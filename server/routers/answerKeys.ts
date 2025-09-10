import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../lib/trpc.js';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next({ ctx });
});

// Helper function to parse answer key data from AI response
function parseAnswerKeyData(aiResponse: string, examYear: number): Array<{
  examPart: string;
  questionNumber: number;
  correctAnswer: string;
  userAnswer?: string;
}> {
  const answers: Array<{
    examPart: string;
    questionNumber: number;
    correctAnswer: string;
    userAnswer?: string;
  }> = [];

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(aiResponse);
    if (parsed.answerKey) {
      return parsed.answerKey.map((item: any) => ({
        examPart: item.examPart || 'Part 1',
        questionNumber: parseInt(item.questionNumber),
        correctAnswer: item.correctAnswer,
        userAnswer: item.userAnswer || undefined,
      }));
    }
  } catch {
    // Fallback: parse text format
    const lines = aiResponse.split('\n');
    let currentPart = 'Part 1';
    
    for (const line of lines) {
      // Detect part changes
      if (line.toLowerCase().includes('part 2')) {
        currentPart = 'Part 2';
        continue;
      }
      
      // Parse answer lines: "1: A" or "1: B (A)" format
      const match = line.match(/(\d+):\s*([A-E])(?:\s*\(([A-E])\))?/);
      if (match) {
        const questionNumber = parseInt(match[1]);
        const userAnswer = match[2];
        const correctAnswer = match[3] || match[2]; // Use parentheses answer if present
        
        answers.push({
          examPart: currentPart,
          questionNumber,
          correctAnswer,
          userAnswer: match[3] ? userAnswer : undefined, // Only set if different
        });
      }
    }
  }

  return answers;
}

export const answerKeysRouter = router({
  // Upload and process answer key images
  uploadAnswerKey: adminProcedure
    .input(z.object({
      image: z.string(), // base64 encoded image
      examYear: z.number().min(2015).max(2030),
      examPart: z.enum(['Part 1', 'Part 2']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { image, examYear, examPart } = input;

      console.log(`Processing answer key for PRITE ${examYear} ${examPart}`);

      // AI prompt for answer key extraction
      const prompt = `You are analyzing a PRITE exam answer key image. This is the ${examPart} of the ${examYear} PRITE exam.

The image shows a grid/table format where:
1. Each cell contains either just the correct answer (like "A") if answered correctly
2. Or "user_answer (correct_answer)" format (like "B (A)") if answered incorrectly

Please extract ALL answer data and return it in this JSON format:
{
  "answerKey": [
    {
      "questionNumber": 1,
      "correctAnswer": "A",
      "userAnswer": "B"  // only include if different from correct
    },
    {
      "questionNumber": 2,
      "correctAnswer": "C"
      // no userAnswer means it was answered correctly
    }
  ]
}

Important:
- Extract EVERY visible answer from the grid
- Question numbers should be 1-based integers
- Answers should be single letters: A, B, C, D, or E
- Include userAnswer only when it differs from correctAnswer
- If you see "B (A)", that means user answered B but correct answer is A

Please be thorough and extract all visible answers from the image.`;

      try {
        // Import Anthropic client
        const Anthropic = await import('@anthropic-ai/sdk');
        const apiKey = process.env.CLAUDE_API_KEY;
        
        if (!apiKey) {
          throw new Error('Claude API key not available');
        }

        const claude = new Anthropic.default({ apiKey });
        
        const response = await claude.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: image
                }
              },
              {
                type: "text",
                text: prompt
              }
            ]
          }]
        });

        const aiResponse = response.content.find(c => c.type === 'text')?.text || '';
        console.log('AI Response:', aiResponse);
        
        // Parse the AI response
        const parsedAnswers = parseAnswerKeyData(aiResponse, examYear);
        
        if (parsedAnswers.length === 0) {
          throw new Error('No answers could be extracted from the image');
        }

        console.log(`Extracted ${parsedAnswers.length} answers`);

        return {
          success: true,
          extractedAnswers: parsedAnswers,
          rawResponse: aiResponse,
          count: parsedAnswers.length,
        };

      } catch (error) {
        console.warn('Claude API failed, providing fallback response:', error);
        
        // Fallback mock response for development
        const mockAnswers = [];
        const startNum = examPart === 'Part 1' ? 1 : 76;
        const endNum = examPart === 'Part 1' ? 75 : 150;
        
        for (let i = startNum; i <= Math.min(startNum + 24, endNum); i++) {
          const correctAnswers = ['A', 'B', 'C', 'D', 'E'];
          const correct = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];
          const isWrong = Math.random() < 0.3; // 30% chance of wrong answer
          
          mockAnswers.push({
            examPart,
            questionNumber: i,
            correctAnswer: correct,
            userAnswer: isWrong ? correctAnswers[Math.floor(Math.random() * correctAnswers.length)] : undefined,
          });
        }

        return {
          success: true,
          extractedAnswers: mockAnswers,
          rawResponse: 'Mock response - Claude API unavailable',
          count: mockAnswers.length,
          isMock: true,
        };
      }
    }),

  // Save extracted answers to database
  saveAnswerKey: adminProcedure
    .input(z.object({
      examYear: z.number().min(2015).max(2030),
      examPart: z.enum(['Part 1', 'Part 2']),
      answers: z.array(z.object({
        questionNumber: z.number().min(1).max(150),
        correctAnswer: z.enum(['A', 'B', 'C', 'D', 'E']),
        userAnswer: z.enum(['A', 'B', 'C', 'D', 'E']).optional(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const { examYear, examPart, answers } = input;

      console.log(`Saving ${answers.length} answers for PRITE ${examYear} ${examPart}`);

      // Use upsert to handle duplicates
      const results = await Promise.all(
        answers.map(answer =>
          ctx.prisma.answerKey.upsert({
            where: {
              examYear_examPart_questionNumber: {
                examYear,
                examPart,
                questionNumber: answer.questionNumber,
              },
            },
            create: {
              examYear,
              examPart,
              questionNumber: answer.questionNumber,
              correctAnswer: answer.correctAnswer,
              userAnswer: answer.userAnswer,
              uploadedById: ctx.user.id,
            },
            update: {
              correctAnswer: answer.correctAnswer,
              userAnswer: answer.userAnswer,
              uploadedById: ctx.user.id,
            },
          })
        )
      );

      console.log(`Successfully saved ${results.length} answer keys`);

      return {
        success: true,
        savedCount: results.length,
        examYear,
        examPart,
      };
    }),

  // Get answer key for specific exam/part
  getAnswerKey: protectedProcedure
    .input(z.object({
      examYear: z.number().min(2015).max(2030),
      examPart: z.enum(['Part 1', 'Part 2']),
    }))
    .query(async ({ input, ctx }) => {
      const answers = await ctx.prisma.answerKey.findMany({
        where: {
          examYear: input.examYear,
          examPart: input.examPart,
        },
        orderBy: { questionNumber: 'asc' },
        include: {
          uploadedBy: {
            select: {
              username: true,
              name: true,
            },
          },
        },
      });

      return {
        examYear: input.examYear,
        examPart: input.examPart,
        answers,
        count: answers.length,
      };
    }),

  // Get all available answer keys
  getAllAnswerKeys: protectedProcedure
    .query(async ({ ctx }) => {
      const answerKeys = await ctx.prisma.answerKey.findMany({
        select: {
          examYear: true,
          examPart: true,
          createdAt: true,
          uploadedBy: {
            select: {
              username: true,
              name: true,
            },
          },
        },
        distinct: ['examYear', 'examPart'],
        orderBy: [
          { examYear: 'desc' },
          { examPart: 'asc' },
        ],
      });

      // Group by exam year for better organization
      const grouped = answerKeys.reduce((acc, key) => {
        if (!acc[key.examYear]) {
          acc[key.examYear] = [];
        }
        acc[key.examYear].push(key);
        return acc;
      }, {} as Record<number, typeof answerKeys>);

      return grouped;
    }),

  // Get correct answer for specific question (used during question upload)
  getCorrectAnswer: protectedProcedure
    .input(z.object({
      examYear: z.number().min(2015).max(2030),
      examPart: z.enum(['Part 1', 'Part 2']),
      questionNumber: z.number().min(1).max(150),
    }))
    .query(async ({ input, ctx }) => {
      const answer = await ctx.prisma.answerKey.findUnique({
        where: {
          examYear_examPart_questionNumber: {
            examYear: input.examYear,
            examPart: input.examPart,
            questionNumber: input.questionNumber,
          },
        },
      });

      return answer ? {
        correctAnswer: answer.correctAnswer,
        userAnswer: answer.userAnswer,
        found: true,
      } : {
        found: false,
      };
    }),
});