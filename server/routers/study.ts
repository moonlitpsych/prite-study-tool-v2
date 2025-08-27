// import { TRPCError } from '@trpc/server'; // Unused for now
import { z } from 'zod';
import { router, protectedProcedure, schemas } from '../lib/trpc';

// Enhanced SM-2 algorithm implementation
function calculateNextReview(
  easeFactor: number,
  repetition: number,
  interval: number,
  quality: number
): { easeFactor: number; repetition: number; interval: number; nextReviewDate: Date } {
  let newEaseFactor = easeFactor;
  let newRepetition = repetition;
  let newInterval = interval;

  // Update ease factor based on quality (0-5 scale)
  if (quality >= 3) {
    newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  } else {
    newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    newRepetition = 0;
    newInterval = 1;
  }

  // Calculate new interval
  if (quality >= 3) {
    if (newRepetition === 0) {
      newInterval = 1;
    } else if (newRepetition === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetition += 1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    repetition: newRepetition,
    interval: newInterval,
    nextReviewDate,
  };
}

function responseToQuality(wasCorrect: boolean, confidence: string, timeSpent: number): number {
  if (!wasCorrect) {
    switch (confidence) {
      case 'high': return 2;
      case 'medium': return 1;
      case 'low': return 0;
      default: return 0;
    }
  } else {
    const baseQuality = confidence === 'high' ? 5 : confidence === 'medium' ? 4 : 3;
    const timeAdjustment = timeSpent > 30000 ? -1 : timeSpent < 5000 ? 1 : 0;
    return Math.max(3, Math.min(5, baseQuality + timeAdjustment));
  }
}

export const studyRouter = router({
  // Start a new study session
  startSession: protectedProcedure
    .input(z.object({
      questionCount: z.number().min(1).max(50).default(20),
      categories: z.array(z.string()).optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      onlyDue: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const { questionCount, categories, difficulty, onlyDue } = input;

      // Create study session
      const session = await ctx.prisma.studySession.create({
        data: {
          userId: ctx.user.id,
        },
      });

      // Build query for questions
      let questionWhere: any = {
        isPublic: true,
        ...(categories && categories.length > 0 && { category: { in: categories } }),
        ...(difficulty && { difficulty }),
      };

      if (onlyDue) {
        // Get questions that are due for review or never studied
        const now = new Date();
        questionWhere = {
          ...questionWhere,
          OR: [
            {
              // Never studied by this user
              NOT: {
                studyRecords: {
                  some: {
                    userId: ctx.user.id,
                  },
                },
              },
            },
            {
              // Due for review
              studyRecords: {
                some: {
                  userId: ctx.user.id,
                  nextReviewDate: {
                    lte: now,
                  },
                },
              },
            },
          ],
        };
      }

      const questions = await ctx.prisma.question.findMany({
        where: questionWhere,
        include: {
          createdBy: {
            select: { username: true, name: true },
          },
          studyRecords: {
            where: { userId: ctx.user.id },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        take: questionCount * 2, // Get extra to account for filtering
      });

      // Sort by priority (most overdue first, then new questions)
      const sortedQuestions = questions
        .map(question => {
          const lastRecord = question.studyRecords[0];
          const priority = lastRecord 
            ? new Date().getTime() - new Date(lastRecord.nextReviewDate).getTime()
            : 0; // New questions get neutral priority
          return { ...question, priority };
        })
        .sort((a, b) => b.priority - a.priority)
        .slice(0, questionCount);

      return {
        sessionId: session.id,
        questions: sortedQuestions.map(({ priority, ...q }) => q),
      };
    }),

  // Record study result
  recordStudy: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      questionId: z.string(),
      wasCorrect: z.boolean(),
      confidence: z.enum(['low', 'medium', 'high']),
      timeSpent: z.number().min(0), // milliseconds
      selectedAnswers: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const { sessionId, questionId, wasCorrect, confidence, timeSpent } = input;
      // Note: selectedAnswers would be stored for detailed analytics

      // Get existing study record or create new one
      const existingRecord = await ctx.prisma.studyRecord.findUnique({
        where: {
          userId_questionId: {
            userId: ctx.user.id,
            questionId,
          },
        },
      });

      // Calculate quality score and next review data
      const quality = responseToQuality(wasCorrect, confidence, timeSpent);
      const { easeFactor, repetition, interval, nextReviewDate } = calculateNextReview(
        existingRecord?.easeFactor || 2.5,
        existingRecord?.repetition || 0,
        existingRecord?.interval || 0,
        quality
      );

      // Update or create study record
      const studyRecord = await ctx.prisma.studyRecord.upsert({
        where: {
          userId_questionId: {
            userId: ctx.user.id,
            questionId,
          },
        },
        create: {
          userId: ctx.user.id,
          questionId,
          sessionId,
          wasCorrect,
          timeSpent,
          confidence,
          easeFactor,
          repetition,
          interval,
          nextReviewDate,
        },
        update: {
          sessionId,
          wasCorrect,
          timeSpent,
          confidence,
          easeFactor,
          repetition,
          interval,
          nextReviewDate,
          createdAt: new Date(), // Update timestamp for this study attempt
        },
      });

      // Update session stats
      await ctx.prisma.studySession.update({
        where: { id: sessionId },
        data: {
          totalQuestions: { increment: 1 },
          correctAnswers: { increment: wasCorrect ? 1 : 0 },
          totalTimeSpent: { increment: timeSpent },
        },
      });

      // Update question times studied counter
      await ctx.prisma.question.update({
        where: { id: questionId },
        data: {
          timesStudied: { increment: 1 },
        },
      });

      return {
        studyRecord,
        nextInterval: interval,
        qualityScore: quality,
      };
    }),

  // Finish study session
  finishSession: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const session = await ctx.prisma.studySession.update({
        where: { id: input.sessionId },
        data: {
          endedAt: new Date(),
        },
        include: {
          records: {
            include: {
              question: {
                select: {
                  category: true,
                  difficulty: true,
                },
              },
            },
          },
        },
      });

      // Calculate session statistics
      const stats = {
        totalQuestions: session.totalQuestions,
        correctAnswers: session.correctAnswers,
        accuracy: session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0,
        totalTimeSpent: session.totalTimeSpent,
        averageTimePerQuestion: session.totalQuestions > 0 ? session.totalTimeSpent / session.totalQuestions : 0,
        categoryBreakdown: session.records.reduce((acc, record) => {
          const category = record.question.category;
          if (!acc[category]) {
            acc[category] = { total: 0, correct: 0 };
          }
          acc[category].total += 1;
          if (record.wasCorrect) {
            acc[category].correct += 1;
          }
          return acc;
        }, {} as Record<string, { total: number; correct: number }>),
      };

      return {
        session,
        stats,
      };
    }),

  // Get due questions count
  getDueCount: protectedProcedure.query(async ({ ctx }) => {
    const now = new Date();
    
    const dueCount = await ctx.prisma.question.count({
      where: {
        OR: [
          {
            // Never studied
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
            // Due for review
            studyRecords: {
              some: {
                userId: ctx.user.id,
                nextReviewDate: {
                  lte: now,
                },
              },
            },
          },
        ],
      },
    });

    return dueCount;
  }),

  // Get user's study statistics
  getStats: protectedProcedure
    .input(z.object({
      period: z.enum(['week', 'month', 'year', 'all']).default('month'),
    }))
    .query(async ({ input, ctx }) => {
      const { period } = input;
      
      const periodDays = {
        week: 7,
        month: 30,
        year: 365,
        all: null,
      };

      const since = periodDays[period] 
        ? new Date(Date.now() - periodDays[period]! * 24 * 60 * 60 * 1000)
        : undefined;

      const whereClause = {
        userId: ctx.user.id,
        ...(since && { createdAt: { gte: since } }),
      };

      const [studyRecords, sessions] = await Promise.all([
        ctx.prisma.studyRecord.findMany({
          where: whereClause,
          include: {
            question: {
              select: {
                category: true,
                difficulty: true,
              },
            },
          },
        }),
        ctx.prisma.studySession.findMany({
          where: {
            userId: ctx.user.id,
            ...(since && { startedAt: { gte: since } }),
            endedAt: { not: null },
          },
          orderBy: { startedAt: 'desc' },
        }),
      ]);

      const totalStudied = studyRecords.length;
      const correctAnswers = studyRecords.filter(r => r.wasCorrect).length;
      const accuracy = totalStudied > 0 ? (correctAnswers / totalStudied) * 100 : 0;

      // Category performance
      const categoryStats = studyRecords.reduce((acc, record) => {
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

      // Study streak calculation
      const recentSessions = await ctx.prisma.studySession.findMany({
        where: {
          userId: ctx.user.id,
          endedAt: { not: null },
        },
        orderBy: { startedAt: 'desc' },
        take: 30,
      });

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 0; i < recentSessions.length; i++) {
        const sessionDate = new Date(recentSessions[i].startedAt);
        sessionDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === i) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalStudied,
        correctAnswers,
        accuracy,
        totalSessions: sessions.length,
        averageSessionLength: sessions.length > 0 
          ? sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0) / sessions.length 
          : 0,
        currentStreak,
        categoryStats,
        recentSessions: sessions.slice(0, 10),
      };
    }),

  // Get study history
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      category: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { limit, offset, category } = input;

      const sessions = await ctx.prisma.studySession.findMany({
        where: {
          userId: ctx.user.id,
          endedAt: { not: null },
        },
        include: {
          records: {
            where: category ? {
              question: {
                category,
              },
            } : undefined,
            include: {
              question: {
                select: {
                  text: true,
                  category: true,
                  difficulty: true,
                },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return sessions.map(session => ({
        ...session,
        stats: {
          accuracy: session.totalQuestions > 0 ? (session.correctAnswers / session.totalQuestions) * 100 : 0,
          averageTime: session.totalQuestions > 0 ? session.totalTimeSpent / session.totalQuestions : 0,
        },
      }));
    }),
});