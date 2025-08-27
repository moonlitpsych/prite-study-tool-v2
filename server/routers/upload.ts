import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc';
import { processQuestionImage, processQuestionText, generateExplanation } from '../lib/ai-processing';

export const uploadRouter = router({
  // Process image with AI (camera/file upload)
  processImage: protectedProcedure
    .input(z.object({
      imageData: z.string(), // base64 encoded image
      method: z.enum(['camera', 'file']),
      options: z.object({
        examType: z.enum(['PRITE Part 1', 'PRITE Part 2']).default('PRITE Part 1'),
        expectedQuestions: z.number().min(1).max(50).default(10),
        includeAnswerKey: z.boolean().default(false),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Process image with Claude Vision API
        const result = await processQuestionImage({
          imageData: input.imageData,
          userId: ctx.user.id,
          options: input.options || {},
        });

        // Award contribution points for successful processing
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            contributionScore: { increment: 5 },
          },
        });

        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Process text with AI (paste/OCR text)
  processText: protectedProcedure
    .input(z.object({
      text: z.string().min(10),
      method: z.enum(['text', 'bulk']),
      options: z.object({
        examType: z.enum(['PRITE Part 1', 'PRITE Part 2']).default('PRITE Part 1'),
        expectedQuestions: z.number().min(1).max(100).default(20),
        includeAnswerKey: z.boolean().default(false),
        strictMode: z.boolean().default(true), // Stricter parsing for accuracy
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await processQuestionText({
          text: input.text,
          userId: ctx.user.id,
          options: input.options || {},
        });

        // Award points based on number of questions processed
        const pointsEarned = Math.min(result.questions.length * 2, 20);
        await ctx.prisma.user.update({
          where: { id: ctx.user.id },
          data: {
            contributionScore: { increment: pointsEarned },
          },
        });

        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Generate explanation for a question
  generateExplanation: protectedProcedure
    .input(z.object({
      questionText: z.string(),
      options: z.array(z.object({
        label: z.string(),
        text: z.string(),
      })),
      correctAnswers: z.array(z.string()),
      existingExplanation: z.string().optional(),
      style: z.enum(['uworld', 'detailed', 'concise']).default('uworld'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const explanation = await generateExplanation({
          question: input.questionText,
          options: input.options as { label: string; text: string; }[],
          correctAnswers: input.correctAnswers,
          existingExplanation: input.existingExplanation,
          style: input.style,
          userId: ctx.user.id,
        });

        return { explanation };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to generate explanation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }),

  // Batch process multiple uploads
  batchProcess: protectedProcedure
    .input(z.object({
      uploads: z.array(z.object({
        type: z.enum(['image', 'text']),
        data: z.string(),
        metadata: z.object({
          filename: z.string().optional(),
          examDate: z.string().optional(),
          section: z.string().optional(),
        }).optional(),
      })),
      globalOptions: z.object({
        examType: z.enum(['PRITE Part 1', 'PRITE Part 2']).default('PRITE Part 1'),
        autoGenerateExplanations: z.boolean().default(false),
        makePublic: z.boolean().default(false),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const results = [];
      let totalQuestions = 0;

      for (const upload of input.uploads) {
        try {
          let result;
          if (upload.type === 'image') {
            result = await processQuestionImage({
              imageData: upload.data,
              userId: ctx.user.id,
              options: input.globalOptions,
            });
          } else {
            result = await processQuestionText({
              text: upload.data,
              userId: ctx.user.id,
              options: input.globalOptions,
            });
          }

          totalQuestions += result.questions.length;
          results.push({
            success: true,
            questions: result.questions,
            metadata: upload.metadata,
          });

          // Auto-generate explanations if requested
          if (input.globalOptions.autoGenerateExplanations) {
            for (const question of result.questions) {
              try {
                const explanation = await generateExplanation({
                  question: question.text,
                  options: question.options,
                  correctAnswers: question.correctAnswers,
                  style: 'uworld',
                  userId: ctx.user.id,
                });
                question.explanation = explanation;
              } catch (explainError) {
                console.warn(`Failed to generate explanation for question: ${explainError instanceof Error ? explainError.message : 'Unknown error'}`);
              }
            }
          }
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            metadata: upload.metadata,
          });
        }
      }

      // Award significant points for batch processing
      const pointsEarned = Math.min(totalQuestions * 3, 100);
      await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          contributionScore: { increment: pointsEarned },
        },
      });

      return {
        results,
        totalProcessed: results.filter(r => r.success).length,
        totalQuestions,
        pointsEarned,
      };
    }),

  // Get processing history for user
  getProcessingHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      // This would track processing history in a separate table
      // For now, return recent questions created by user
      const questions = await ctx.prisma.question.findMany({
        where: {
          createdById: ctx.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
        skip: input.offset,
        select: {
          id: true,
          text: true,
          category: true,
          examPart: true,
          createdAt: true,
          timesStudied: true,
          averageRating: true,
        },
      });

      return questions;
    }),
});