import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, schemas } from '../lib/trpc';

export const communityRouter = router({
  // Get community leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({
      type: z.enum(['contribution', 'reputation', 'study']).default('contribution'),
      ...schemas.pagination,
    }))
    .query(async ({ input, ctx }) => {
      const { type, limit, offset } = input;

      let orderBy;
      switch (type) {
        case 'contribution':
          orderBy = { contributionScore: 'desc' as const };
          break;
        case 'reputation':
          orderBy = { reputation: 'desc' as const };
          break;
        case 'study':
          // Order by total study records
          orderBy = { studyRecords: { _count: 'desc' as const } };
          break;
      }

      const users = await ctx.prisma.user.findMany({
        where: {
          isPublic: true,
        },
        select: {
          id: true,
          username: true,
          name: true,
          contributionScore: true,
          reputation: true,
          pgyLevel: true,
          institution: true,
          _count: {
            select: {
              questions: {
                where: { isPublic: true },
              },
              studyRecords: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      });

      return users.map((user, index) => ({
        ...user,
        rank: offset + index + 1,
        stats: {
          publicQuestions: user._count.questions,
          totalStudied: user._count.studyRecords,
        },
      }));
    }),

  // Get community statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalQuestions,
      totalPublicQuestions,
      totalStudyRecords,
      recentActivity,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.question.count(),
      ctx.prisma.question.count({ where: { isPublic: true } }),
      ctx.prisma.studyRecord.count(),
      
      // Recent activity (last 7 days)
      ctx.prisma.question.findMany({
        where: {
          isPublic: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          createdBy: {
            select: { username: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totalUsers,
      totalQuestions,
      totalPublicQuestions,
      totalStudyRecords,
      recentActivity,
      communityGrowth: {
        questionsThisWeek: recentActivity.length,
      },
    };
  }),

  // Get trending questions (most studied recently)
  getTrending: publicProcedure
    .input(schemas.pagination)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;
      
      // Get questions with most study activity in last 7 days
      const questions = await ctx.prisma.question.findMany({
        where: {
          isPublic: true,
          studyRecords: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
              reputation: true,
            },
          },
          votes: {
            select: { voteType: true },
          },
          _count: {
            select: {
              studyRecords: {
                where: {
                  createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          },
        },
        orderBy: {
          studyRecords: {
            _count: 'desc',
          },
        },
        take: limit,
        skip: offset,
      });

      return questions.map(question => {
        const upvotes = question.votes.filter(v => v.voteType === 'up').length;
        const downvotes = question.votes.filter(v => v.voteType === 'down').length;
        
        return {
          ...question,
          stats: {
            recentStudies: question._count.studyRecords,
            upvotes,
            downvotes,
            score: upvotes - downvotes,
          },
        };
      });
    }),

  // Get top contributors this month
  getTopContributors: publicProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'year']).default('month'),
      ...schemas.pagination,
    }))
    .query(async ({ input, ctx }) => {
      const { period, limit, offset } = input;
      
      const periodDays = {
        week: 7,
        month: 30,
        year: 365,
      };

      const since = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000);

      const contributors = await ctx.prisma.user.findMany({
        where: {
          isPublic: true,
          questions: {
            some: {
              isPublic: true,
              createdAt: { gte: since },
            },
          },
        },
        select: {
          id: true,
          username: true,
          name: true,
          contributionScore: true,
          reputation: true,
          pgyLevel: true,
          _count: {
            select: {
              questions: {
                where: {
                  isPublic: true,
                  createdAt: { gte: since },
                },
              },
            },
          },
        },
        orderBy: {
          questions: {
            _count: 'desc',
          },
        },
        take: limit,
        skip: offset,
      });

      return contributors.map((user, index) => ({
        ...user,
        rank: offset + index + 1,
        questionsThisPeriod: user._count.questions,
      }));
    }),

  // Get category performance across community
  getCategoryStats: publicProcedure.query(async ({ ctx }) => {
    const categoryStats = await ctx.prisma.question.groupBy({
      by: ['category'],
      where: {
        isPublic: true,
      },
      _count: {
        _all: true,
      },
      _avg: {
        averageRating: true,
      },
    });

    // Get study performance by category
    const studyStats = await ctx.prisma.studyRecord.groupBy({
      by: ['questionId'],
      _avg: {
        wasCorrect: true,
      },
      _count: {
        _all: true,
      },
    });

    // This would need more complex aggregation for full category study stats
    // For now, return basic category info
    return categoryStats.map(stat => ({
      category: stat.category,
      totalQuestions: stat._count._all,
      averageRating: stat._avg.averageRating || 0,
    }));
  }),

  // Get user's community activity feed
  getActivityFeed: protectedProcedure
    .input(schemas.pagination)
    .query(async ({ input, ctx }) => {
      const { limit, offset } = input;

      // Get recent questions from followed users or highly-rated questions
      const activities = await ctx.prisma.question.findMany({
        where: {
          isPublic: true,
        },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
              reputation: true,
            },
          },
          votes: {
            select: { voteType: true },
          },
          questionReviews: {
            select: { rating: true },
          },
          _count: {
            select: { studyRecords: true },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      });

      return activities.map(activity => {
        const upvotes = activity.votes.filter(v => v.voteType === 'up').length;
        const averageRating = activity.questionReviews.length > 0
          ? activity.questionReviews.reduce((sum, r) => sum + r.rating, 0) / activity.questionReviews.length
          : null;

        return {
          ...activity,
          activityType: 'question_created',
          stats: {
            upvotes,
            averageRating,
            timesStudied: activity._count.studyRecords,
          },
        };
      });
    }),

  // Get question recommendations based on user's weak areas
  getRecommendations: protectedProcedure
    .input(schemas.pagination)
    .query(async ({ input, ctx }) => {
      // Get user's study history to identify weak categories
      const userStudyData = await ctx.prisma.studyRecord.groupBy({
        by: ['questionId'],
        where: {
          userId: ctx.user.id,
        },
        _avg: {
          wasCorrect: true,
        },
        _count: {
          _all: true,
        },
        having: {
          wasCorrect: {
            _avg: {
              lt: 0.7, // Less than 70% accuracy
            },
          },
        },
      });

      // Get questions from categories where user struggles
      const weakQuestionIds = userStudyData.map(data => data.questionId);
      
      if (weakQuestionIds.length === 0) {
        // If no weak areas, return popular questions
        return ctx.prisma.question.findMany({
          where: {
            isPublic: true,
            isVerified: true,
          },
          include: {
            createdBy: {
              select: { username: true, name: true },
            },
            votes: {
              select: { voteType: true },
            },
          },
          orderBy: {
            studyRecords: {
              _count: 'desc',
            },
          },
          take: input.limit,
          skip: input.offset,
        });
      }

      const weakQuestions = await ctx.prisma.question.findMany({
        where: {
          id: { in: weakQuestionIds },
        },
        select: {
          category: true,
        },
      });

      const weakCategories = [...new Set(weakQuestions.map(q => q.category))];

      // Find similar questions in weak categories that user hasn't seen
      const recommendations = await ctx.prisma.question.findMany({
        where: {
          isPublic: true,
          category: { in: weakCategories },
          NOT: {
            studyRecords: {
              some: {
                userId: ctx.user.id,
              },
            },
          },
        },
        include: {
          createdBy: {
            select: { username: true, name: true },
          },
          votes: {
            select: { voteType: true },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { averageRating: 'desc' },
        ],
        take: input.limit,
        skip: input.offset,
      });

      return recommendations;
    }),
});