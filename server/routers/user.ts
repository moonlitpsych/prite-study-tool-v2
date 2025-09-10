import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { router, protectedProcedure, schemas } from '../lib/trpc.js';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // Change password
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get current user with password
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: { hashedPassword: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(input.currentPassword, user.hashedPassword);
      if (!isValidPassword) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(input.newPassword, 10);

      // Update password
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { hashedPassword: hashedNewPassword },
      });

      return { success: true };
    }),

  // Add PRITE score
  addPriteScore: protectedProcedure
    .input(z.object({
      examDate: z.date(),
      totalScore: z.number().min(0).max(300),
      percentile: z.number().min(0).max(100).optional(),
      adultPsychiatry: z.number().min(0).max(100).optional(),
      childPsychiatry: z.number().min(0).max(100).optional(),
      neurology: z.number().min(0).max(100).optional(),
      psychology: z.number().min(0).max(100).optional(),
      substance: z.number().min(0).max(100).optional(),
      emergency: z.number().min(0).max(100).optional(),
      consultation: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const score = await ctx.prisma.priteScore.create({
        data: {
          userId: ctx.user.id,
          examDate: input.examDate,
          totalScore: input.totalScore,
          percentile: input.percentile,
          adultPsychiatry: input.adultPsychiatry,
          childPsychiatry: input.childPsychiatry,
          neurology: input.neurology,
          psychology: input.psychology,
          substance: input.substance,
          emergency: input.emergency,
          consultation: input.consultation,
        },
      });

      return score;
    }),

  // Get PRITE scores
  getPriteScores: protectedProcedure.query(async ({ ctx }) => {
    const scores = await ctx.prisma.priteScore.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        examDate: 'desc',
      },
    });

    return scores;
  }),

  // Update PRITE score
  updatePriteScore: protectedProcedure
    .input(z.object({
      id: schemas.id,
      examDate: z.date().optional(),
      totalScore: z.number().min(0).max(300).optional(),
      percentile: z.number().min(0).max(100).optional(),
      adultPsychiatry: z.number().min(0).max(100).optional(),
      childPsychiatry: z.number().min(0).max(100).optional(),
      neurology: z.number().min(0).max(100).optional(),
      psychology: z.number().min(0).max(100).optional(),
      substance: z.number().min(0).max(100).optional(),
      emergency: z.number().min(0).max(100).optional(),
      consultation: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      const score = await ctx.prisma.priteScore.update({
        where: {
          id,
          userId: ctx.user.id, // Ensure user owns this score
        },
        data: updateData,
      });

      return score;
    }),

  // Delete PRITE score
  deletePriteScore: protectedProcedure
    .input(schemas.id)
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.priteScore.delete({
        where: {
          id: input,
          userId: ctx.user.id,
        },
      });

      return { success: true };
    }),

  // Get dashboard data
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const [
      dueQuestionsCount,
      recentSessions,
      priteScores,
      contributionStats,
      studyStreak,
    ] = await Promise.all([
      // Due questions count
      ctx.prisma.question.count({
        where: {
          OR: [
            {
              NOT: {
                studyRecords: {
                  some: {
                    userId: ctx.user.id,
                  },
                },
              },
              isPublic: true,
            },
            {
              studyRecords: {
                some: {
                  userId: ctx.user.id,
                  nextReviewDate: {
                    lte: new Date(),
                  },
                },
              },
            },
          ],
        },
      }),

      // Recent study sessions
      ctx.prisma.studySession.findMany({
        where: {
          userId: ctx.user.id,
          endedAt: { not: null },
        },
        orderBy: { startedAt: 'desc' },
        take: 5,
      }),

      // Latest PRITE scores
      ctx.prisma.priteScore.findMany({
        where: {
          userId: ctx.user.id,
        },
        orderBy: { examDate: 'desc' },
        take: 3,
      }),

      // User's contribution stats
      ctx.prisma.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          contributionScore: true,
          reputation: true,
          _count: {
            select: {
              questions: {
                where: { isPublic: true },
              },
              studyRecords: true,
            },
          },
        },
      }),

      // Calculate study streak
      ctx.prisma.studySession.findMany({
        where: {
          userId: ctx.user.id,
          endedAt: { not: null },
        },
        orderBy: { startedAt: 'desc' },
        take: 30,
      }),
    ]);

    // Calculate current study streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < studyStreak.length; i++) {
      const sessionDate = new Date(studyStreak[i].startedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate recent performance
    const recentStudyRecords = await ctx.prisma.studyRecord.findMany({
      where: {
        userId: ctx.user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const recentAccuracy = recentStudyRecords.length > 0
      ? (recentStudyRecords.filter(r => r.wasCorrect).length / recentStudyRecords.length) * 100
      : 0;

    return {
      dueQuestionsCount,
      recentSessions: recentSessions.map(session => ({
        ...session,
        accuracy: session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0,
      })),
      priteScores,
      contributionStats: {
        ...contributionStats,
        publicQuestions: contributionStats?._count.questions || 0,
        totalStudied: contributionStats?._count.studyRecords || 0,
      },
      studyStreak: currentStreak,
      recentAccuracy,
      totalStudiedThisWeek: recentStudyRecords.length,
    };
  }),

  // Get user's performance analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const { period } = input;
      
      const periodDays = {
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };

      const since = new Date(Date.now() - periodDays[period] * 24 * 60 * 60 * 1000);

      const [studyRecords, sessions] = await Promise.all([
        ctx.prisma.studyRecord.findMany({
          where: {
            userId: ctx.user.id,
            createdAt: { gte: since },
          },
          include: {
            question: {
              select: {
                category: true,
                difficulty: true,
                examPart: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),

        ctx.prisma.studySession.findMany({
          where: {
            userId: ctx.user.id,
            startedAt: { gte: since },
            endedAt: { not: null },
          },
          orderBy: { startedAt: 'asc' },
        }),
      ]);

      // Daily study data for charts
      const dailyData = studyRecords.reduce((acc, record) => {
        const date = record.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { total: 0, correct: 0, date };
        }
        acc[date].total += 1;
        if (record.wasCorrect) {
          acc[date].correct += 1;
        }
        return acc;
      }, {} as Record<string, { total: number; correct: number; date: string }>);

      // Category performance
      const categoryPerformance = studyRecords.reduce((acc, record) => {
        const category = record.question.category;
        if (!acc[category]) {
          acc[category] = { total: 0, correct: 0, accuracy: 0 };
        }
        acc[category].total += 1;
        if (record.wasCorrect) {
          acc[category].correct += 1;
        }
        acc[category].accuracy = (acc[category].correct / acc[category].total) * 100;
        return acc;
      }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

      // Difficulty analysis
      const difficultyPerformance = studyRecords.reduce((acc, record) => {
        const difficulty = record.question.difficulty;
        if (!acc[difficulty]) {
          acc[difficulty] = { total: 0, correct: 0, accuracy: 0 };
        }
        acc[difficulty].total += 1;
        if (record.wasCorrect) {
          acc[difficulty].correct += 1;
        }
        acc[difficulty].accuracy = (acc[difficulty].correct / acc[difficulty].total) * 100;
        return acc;
      }, {} as Record<string, { total: number; correct: number; accuracy: number }>);

      return {
        totalStudied: studyRecords.length,
        totalSessions: sessions.length,
        overallAccuracy: studyRecords.length > 0 
          ? (studyRecords.filter(r => r.wasCorrect).length / studyRecords.length) * 100 
          : 0,
        dailyData: Object.values(dailyData),
        categoryPerformance,
        difficultyPerformance,
        studyTime: {
          total: sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0),
          average: sessions.length > 0 
            ? sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0) / sessions.length 
            : 0,
        },
      };
    }),

  // Get community ranking for user
  getCommunityRank: protectedProcedure.query(async ({ ctx }) => {
    // Get user's study count first
    const userStudyCount = await ctx.prisma.studyRecord.count({
      where: { userId: ctx.user.id },
    });

    const [contributionRank, reputationRank] = await Promise.all([
      // Contribution rank
      ctx.prisma.user.count({
        where: {
          contributionScore: {
            gt: ctx.user.contributionScore,
          },
          isPublic: true,
        },
      }),

      // Reputation rank  
      ctx.prisma.user.count({
        where: {
          reputation: {
            gt: ctx.user.reputation,
          },
          isPublic: true,
        },
      }),
    ]);

    // For study rank, we'll use a simpler approach
    const studyRank = 0; // Placeholder - could implement later with raw SQL if needed

    return {
      contributionRank: contributionRank + 1,
      reputationRank: reputationRank + 1,
      studyRank: studyRank + 1,
      userStudyCount,
    };
  }),
});