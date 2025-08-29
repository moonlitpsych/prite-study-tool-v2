import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, schemas } from '../lib/trpc.js';

const questionSchema = z.object({
  text: z.string().min(10).max(2000),
  options: z.array(z.object({
    label: z.string().min(1),
    text: z.string().min(1).max(500),
  })).min(2).max(8),
  correctAnswers: z.array(z.string()).min(1),
  explanation: z.string().max(2000).optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  examPart: z.enum(['Part 1', 'Part 2']),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  topics: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false),
});

const questionFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  examPart: z.enum(['Part 1', 'Part 2']).optional(),
  isPublic: z.boolean().optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const questionRouter = router({
  // Get questions with community features
  getAll: publicProcedure
    .input(questionFilterSchema)
    .query(async ({ input, ctx }) => {
      const { limit, offset, search, createdBy, ...filters } = input;
      
      const where = {
        ...filters,
        ...(createdBy && { createdById: createdBy }),
        ...(search && {
          OR: [
            { text: { contains: search, mode: 'insensitive' as const } },
            { category: { contains: search, mode: 'insensitive' as const } },
            { topics: { hasSome: [search] } },
          ],
        }),
      };

      const [questions, total] = await Promise.all([
        ctx.prisma.question.findMany({
          where,
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                name: true,
                contributionScore: true,
                reputation: true,
              },
            },
            votes: {
              select: {
                voteType: true,
              },
            },
            questionReviews: {
              select: {
                rating: true,
              },
            },
            _count: {
              select: {
                studyRecords: true,
                questionReviews: true,
              },
            },
          },
          orderBy: [
            { isVerified: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        }),
        ctx.prisma.question.count({ where }),
      ]);

      // Add computed fields
      const questionsWithStats = questions.map((question: any) => {
        const votes = question.votes || [];
        const reviews = question.questionReviews || [];
        const counts = question._count || {};
        
        const upvotes = votes.filter((v: any) => v.voteType === 'up').length;
        const downvotes = votes.filter((v: any) => v.voteType === 'down').length;
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
          : null;

        return {
          ...question,
          stats: {
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            averageRating,
            timesStudied: counts.studyRecords || 0,
            reviewCount: counts.questionReviews || 0,
          },
        };
      });

      return {
        questions: questionsWithStats,
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get single question with full details
  getById: publicProcedure
    .input(schemas.id)
    .query(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              contributionScore: true,
              reputation: true,
            },
          },
          votes: {
            include: {
              user: {
                select: { username: true, reputation: true },
              },
            },
          },
          questionReviews: {
            include: {
              user: {
                select: { username: true, reputation: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { studyRecords: true },
          },
        },
      });

      if (!question) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return question;
    }),

  // Create AI-processed question from upload
  createFromUpload: protectedProcedure
    .input(z.object({
      text: z.string().min(10).max(2000),
      options: z.array(z.object({
        label: z.string().min(1),
        text: z.string().min(1).max(500),
      })).min(2).max(8),
      correctAnswer: z.string().min(1),
      category: z.string().min(1),
      topics: z.array(z.string()).default([]),
      examYear: z.number().min(2015).max(2030),
      examPart: z.number().min(1).max(2),
      questionNumber: z.number().optional(),
      confidence: z.number().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      // Check for duplicates based on questionNumber + examPart + examYear
      if (input.questionNumber && input.examYear) {
        const examPartString = input.examPart === 1 ? 'Part 1' : 'Part 2';
        
        const existingQuestion = await ctx.prisma.question.findFirst({
          where: {
            questionNumber: input.questionNumber,
            examPart: examPartString,
            examYear: input.examYear,
          },
          orderBy: { createdAt: 'asc' }, // Get the oldest one
        });

        if (existingQuestion) {
          // Duplicate found - return the existing question instead of creating new one
          throw new TRPCError({
            code: 'CONFLICT',
            message: `This question already exists: PRITE ${input.examYear} ${examPartString} Question ${input.questionNumber}. The existing question takes precedence.`,
            cause: {
              existingQuestionId: existingQuestion.id,
              conflictDetails: {
                questionNumber: input.questionNumber,
                examPart: examPartString,
                examYear: input.examYear,
              }
            }
          });
        }
      }

      const question = await ctx.prisma.question.create({
        data: {
          text: input.text,
          options: input.options,
          correctAnswers: [input.correctAnswer], // Convert single answer to array
          category: input.category,
          examPart: input.examPart === 1 ? 'Part 1' : 'Part 2',
          topics: input.topics || [],
          examYear: input.examYear,
          questionNumber: input.questionNumber,
          uploadMethod: 'ai-processed',
          isPublic: input.isPublic,
          createdById: ctx.user.id,
        },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
            },
          },
        },
      });

      // Award contribution points
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          contributionScore: {
            increment: 3, // Points for AI-processed uploads
          },
        },
      });

      return question;
    }),

  // Create new question
  create: protectedProcedure
    .input(questionSchema)
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.create({
        data: {
          text: input.text,
          options: input.options,
          correctAnswers: input.correctAnswers,
          explanation: input.explanation,
          category: input.category,
          subcategory: input.subcategory,
          examPart: input.examPart,
          difficulty: input.difficulty,
          topics: input.topics || [],
          isPublic: input.isPublic,
          createdById: ctx.user.id,
        },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
            },
          },
        },
      });

      // Award contribution points
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          contributionScore: {
            increment: input.isPublic ? 10 : 5, // More points for public questions
          },
        },
      });

      return question;
    }),

  // Update question (only by creator)
  update: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
      text: z.string().optional(),
      options: z.array(z.object({
        label: z.string(),
        text: z.string(),
      })).optional(),
      correctAnswers: z.array(z.string()).optional(),
      explanation: z.string().optional(),
      category: z.string().optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      examPart: z.enum(['Part 1', 'Part 2']).optional(),
      topics: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;

      // Check if user owns the question
      const existingQuestion = await ctx.prisma.question.findUnique({
        where: { id },
        select: { createdById: true, isVerified: true },
      });

      if (!existingQuestion) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (existingQuestion.createdById !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // If question was verified, mark as needing re-verification after edit
      const shouldResetVerification = existingQuestion.isVerified && Object.keys(updateData).some(
        key => ['text', 'options', 'correctAnswers', 'explanation'].includes(key)
      );

      const question = await ctx.prisma.question.update({
        where: { id },
        data: {
          ...updateData,
          ...(shouldResetVerification && { isVerified: false }),
          updatedAt: new Date(),
        },
      });

      return question;
    }),

  // Delete question (only by creator)
  delete: protectedProcedure
    .input(schemas.id)
    .mutation(async ({ input, ctx }) => {
      const question = await ctx.prisma.question.findUnique({
        where: { id: input },
        select: { createdById: true },
      });

      if (!question) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      if (question.createdById !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await ctx.prisma.question.delete({
        where: { id: input },
      });

      return { success: true };
    }),

  // Vote on a question
  vote: protectedProcedure
    .input(z.object({
      questionId: schemas.id,
      voteType: z.enum(['up', 'down']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { questionId, voteType } = input;

      // Check if question exists
      const question = await ctx.prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true },
      });

      if (!question) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Upsert vote
      const vote = await ctx.prisma.questionVote.upsert({
        where: {
          userId_questionId: {
            userId: ctx.user.id,
            questionId,
          },
        },
        create: {
          userId: ctx.user.id,
          questionId,
          voteType,
        },
        update: {
          voteType,
        },
      });

      return vote;
    }),

  // Remove vote
  removeVote: protectedProcedure
    .input(z.object({
      questionId: schemas.id,
    }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.questionVote.delete({
        where: {
          userId_questionId: {
            userId: ctx.user.id,
            questionId: input.questionId,
          },
        },
      });

      return { success: true };
    }),

  // Review a question
  review: protectedProcedure
    .input(z.object({
      questionId: schemas.id,
      rating: z.number().min(1).max(5),
      feedback: z.string().max(1000).optional(),
      reviewType: z.enum(['accuracy', 'clarity', 'difficulty']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { questionId, ...reviewData } = input;

      const review = await ctx.prisma.questionReview.upsert({
        where: {
          userId_questionId: {
            userId: ctx.user.id,
            questionId,
          },
        },
        create: {
          userId: ctx.user.id,
          questionId,
          rating: reviewData.rating,
          feedback: reviewData.feedback,
          reviewType: reviewData.reviewType,
        },
        update: reviewData,
      });

      return review;
    }),

  // Report a question
  report: protectedProcedure
    .input(z.object({
      questionId: schemas.id,
      reason: z.enum(['incorrect', 'inappropriate', 'duplicate', 'spam']),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const report = await ctx.prisma.questionReport.create({
        data: {
          userId: ctx.user.id,
          questionId: input.questionId,
          reason: input.reason,
          description: input.description,
        },
      });

      return report;
    }),

  // Get questions for community review (unverified public questions)
  getPendingReview: protectedProcedure
    .input(schemas.pagination)
    .query(async ({ input, ctx }) => {
      const questions = await ctx.prisma.question.findMany({
        where: {
          isPublic: true,
          isVerified: false,
        },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
              contributionScore: true,
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
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      return questions.map(question => {
        const upvotes = question.votes.filter(v => v.voteType === 'up').length;
        const downvotes = question.votes.filter(v => v.voteType === 'down').length;
        const averageRating = question.questionReviews.length > 0
          ? question.questionReviews.reduce((sum, r) => sum + r.rating, 0) / question.questionReviews.length
          : null;

        return {
          ...question,
          stats: {
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            averageRating,
            timesStudied: question._count.studyRecords,
          },
        };
      });
    }),

  // Generate AI explanation for a question
  generateExplanation: protectedProcedure
    .input(z.object({
      questionId: z.string().cuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Get the question with full details
      const question = await ctx.prisma.question.findUnique({
        where: { id: input.questionId },
        include: {
          createdBy: {
            select: {
              username: true,
              name: true,
            },
          },
        },
      });

      if (!question) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Check if user can access this question (public or owns it)
      if (!question.isPublic && question.createdById !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Build the AI prompt for UWorld-style explanation
      const options = question.options as { label: string; text: string }[];
      const correctAnswers = question.correctAnswers;
      const incorrectOptions = options.filter(opt => !correctAnswers.includes(opt.label));

      const prompt = `You are a psychiatric education expert. Generate a comprehensive UWorld-style explanation for this PRITE question.

QUESTION: ${question.text}

OPTIONS:
${options.map(opt => `${opt.label}. ${opt.text}`).join('\n')}

CORRECT ANSWER(S): ${correctAnswers.join(', ')}

Please provide:

1. **CORRECT ANSWER EXPLANATION**: Write 2-3 detailed paragraphs explaining why the correct answer(s) is/are correct. Include relevant medical knowledge, clinical reasoning, diagnostic criteria, treatment guidelines, or psychiatric principles. Make it educational and comprehensive like UWorld explanations.

2. **INCORRECT ANSWER EXPLANATIONS**: For each incorrect option, provide 1-2 sentences explaining why it's wrong or less appropriate.

Format your response as JSON:
{
  "correctExplanation": "2-3 paragraph detailed explanation here...",
  "incorrectExplanations": {
    "A": "Brief explanation if A is incorrect (skip if A is correct)",
    "B": "Brief explanation if B is incorrect (skip if B is correct)",
    "C": "Brief explanation if C is incorrect (skip if C is correct)",
    "D": "Brief explanation if D is incorrect (skip if D is correct)",
    "E": "Brief explanation if E is incorrect (skip if E is correct)"
  }
}

Make the explanations clinically accurate, educational, and appropriate for psychiatry residents preparing for PRITE.`;

      try {
        // Import the Anthropic client
        const Anthropic = await import('@anthropic-ai/sdk');
        const apiKey = process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
          throw new Error('Claude API key not available');
        }

        const claude = new Anthropic.default({ apiKey });
        
        const response = await claude.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 3000,
          messages: [{
            role: "user",
            content: prompt
          }]
        });

        const textContent = response.content.find(c => c.type === 'text')?.text || '';
        const explanationData = JSON.parse(textContent);

        // Update the question with the generated explanation
        const fullExplanation = `${explanationData.correctExplanation}

**Why other options are incorrect:**
${Object.entries(explanationData.incorrectExplanations)
  .map(([option, explanation]) => `${option}. ${explanation}`)
  .join('\n')}`;

        const updatedQuestion = await ctx.prisma.question.update({
          where: { id: input.questionId },
          data: {
            explanation: fullExplanation,
          },
        });

        return {
          explanation: fullExplanation,
          correctExplanation: explanationData.correctExplanation,
          incorrectExplanations: explanationData.incorrectExplanations,
        };

      } catch (error) {
        console.error('AI explanation generation failed:', error);
        
        // Fallback explanation
        const fallbackExplanation = `The correct answer is ${correctAnswers.join(' and ')}.

This explanation was generated automatically. For the most accurate information, please consult medical literature and clinical guidelines.

**Why other options are incorrect:**
${incorrectOptions.map(opt => `${opt.label}. This option is not the best choice for this clinical scenario.`).join('\n')}`;

        const updatedQuestion = await ctx.prisma.question.update({
          where: { id: input.questionId },
          data: {
            explanation: fallbackExplanation,
          },
        });

        return {
          explanation: fallbackExplanation,
          correctExplanation: `The correct answer is ${correctAnswers.join(' and ')}. This explanation was generated automatically.`,
          incorrectExplanations: Object.fromEntries(
            incorrectOptions.map(opt => [opt.label, 'This option is not the best choice for this clinical scenario.'])
          ),
        };
      }
    }),

  // Get my questions
  getMy: protectedProcedure
    .input(schemas.pagination)
    .query(async ({ input, ctx }) => {
      const questions = await ctx.prisma.question.findMany({
        where: {
          createdById: ctx.user.id,
        },
        include: {
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
        orderBy: { createdAt: 'desc' },
        take: input.limit,
        skip: input.offset,
      });

      return questions.map(question => {
        const upvotes = question.votes.filter(v => v.voteType === 'up').length;
        const downvotes = question.votes.filter(v => v.voteType === 'down').length;
        const averageRating = question.questionReviews.length > 0
          ? question.questionReviews.reduce((sum, r) => sum + r.rating, 0) / question.questionReviews.length
          : null;

        return {
          ...question,
          stats: {
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            averageRating,
            timesStudied: question._count.studyRecords,
            reviewCount: question.questionReviews.length,
          },
        };
      });
    }),
});