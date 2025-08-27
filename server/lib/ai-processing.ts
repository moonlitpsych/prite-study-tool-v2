// server/lib/ai-processing.ts
// Modern AI processing with Claude API for PRITE question extraction and explanation generation

interface QuestionOption {
  label: string;
  text: string;
}

interface ParsedQuestion {
  number: string;
  text: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface ProcessingOptions {
  examType?: 'PRITE Part 1' | 'PRITE Part 2';
  expectedQuestions?: number;
  includeAnswerKey?: boolean;
  strictMode?: boolean;
}

interface ProcessingResult {
  questions: ParsedQuestion[];
  metadata: {
    totalFound: number;
    processingTime: number;
    confidence: number;
    warnings: string[];
  };
}

// Mock Claude API client (replace with actual implementation)
class ClaudeClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Claude API key not found. Using mock responses.');
    }
  }

  async processText(prompt: string, text: string): Promise<any> {
    if (!this.apiKey) {
      // Return mock data for development
      return this.getMockResponse(text);
    }

    // Actual Claude API implementation would go here
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `${prompt}\n\nText to process:\n${text}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async processImage(prompt: string, imageData: string): Promise<any> {
    if (!this.apiKey) {
      return this.getMockImageResponse();
    }

    // Claude Vision API implementation
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude Vision API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private getMockResponse(text: string): string {
    // Mock response for development
    const questionCount = Math.max(1, Math.floor(text.length / 200));
    const questions = [];

    for (let i = 1; i <= Math.min(questionCount, 3); i++) {
      questions.push({
        number: i.toString(),
        text: `Sample PRITE question ${i} extracted from the provided text about psychiatric medications and their mechanisms.`,
        options: [
          { label: 'A', text: 'First option for question ' + i },
          { label: 'B', text: 'Second option for question ' + i },
          { label: 'C', text: 'Third option for question ' + i },
          { label: 'D', text: 'Fourth option for question ' + i },
        ],
        correctAnswer: ['A'],
        category: 'Adult Psychiatry',
        difficulty: 'medium'
      });
    }

    return JSON.stringify(questions, null, 2);
  }

  private getMockImageResponse(): string {
    return JSON.stringify([
      {
        number: '1',
        text: 'A 35-year-old patient with major depressive disorder is started on a medication. Which of the following best describes the mechanism of action?',
        options: [
          { label: 'A', text: 'Selective serotonin reuptake inhibition' },
          { label: 'B', text: 'Dopamine receptor antagonism' },
          { label: 'C', text: 'GABA receptor modulation' },
          { label: 'D', text: 'Norepinephrine reuptake inhibition' },
        ],
        correctAnswer: ['A'],
        category: 'Adult Psychiatry',
        difficulty: 'medium'
      }
    ], null, 2);
  }
}

const claude = new ClaudeClient();

// Process image data (from camera or file upload)
export async function processQuestionImage(params: {
  imageData: string;
  userId: string;
  options: ProcessingOptions;
}): Promise<ProcessingResult> {
  const startTime = Date.now();
  const { imageData, options } = params;

  const prompt = `You are an expert at extracting PRITE (Psychiatry Resident In-Training Examination) questions from images.

Please analyze this image and extract all visible multiple-choice questions. For each question, provide:
1. Question number (if visible)
2. Complete question text
3. All answer options with their letters (A, B, C, D, E, etc.)
4. If an answer key is visible, identify the correct answer(s)
5. Estimate the category (Adult Psychiatry, Child Psychiatry, Neurology, etc.)
6. Estimate difficulty level

Format your response as a JSON array with this structure:
[
  {
    "number": "1",
    "text": "Complete question text here",
    "options": [
      {"label": "A", "text": "First option text"},
      {"label": "B", "text": "Second option text"},
      {"label": "C", "text": "Third option text"},
      {"label": "D", "text": "Fourth option text"}
    ],
    "correctAnswer": ["A"] // if answer key visible, otherwise empty array
    "category": "Adult Psychiatry",
    "difficulty": "medium"
  }
]

Important:
- Extract text exactly as it appears
- Preserve all formatting and punctuation
- If text is unclear, indicate with [unclear] in brackets
- Only include complete questions with all options visible
- Expected questions: ${options.expectedQuestions || 10}
- Exam type: ${options.examType || 'PRITE Part 1'}`;

  try {
    const response = await claude.processImage(prompt, imageData);
    const parsedQuestions = JSON.parse(response);

    const warnings: string[] = [];
    if (parsedQuestions.length === 0) {
      warnings.push('No questions detected in image');
    }
    if (parsedQuestions.some((q: any) => q.text.includes('[unclear]'))) {
      warnings.push('Some text may be unclear or incomplete');
    }

    return {
      questions: parsedQuestions.map(normalizeQuestion),
      metadata: {
        totalFound: parsedQuestions.length,
        processingTime: Date.now() - startTime,
        confidence: calculateConfidence(parsedQuestions),
        warnings,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

// Process text data (from OCR or paste)
export async function processQuestionText(params: {
  text: string;
  userId: string;
  options: ProcessingOptions;
}): Promise<ProcessingResult> {
  const startTime = Date.now();
  const { text, options } = params;

  const prompt = `You are an expert at parsing PRITE exam question text into structured format.

The following text contains ${options.expectedQuestions || 'multiple'} PRITE questions. Please extract and structure them.

Parse each question with:
1. Question number (if present)
2. Complete question text
3. All answer choices with letters
4. Identify correct answer if an answer key is present
5. Categorize by topic (Adult Psychiatry, Child Psychiatry, Neurology, Emergency, etc.)
6. Assess difficulty level

Format as JSON array:
[
  {
    "number": "1",
    "text": "Question text here...",
    "options": [
      {"label": "A", "text": "Option A text"},
      {"label": "B", "text": "Option B text"},
      {"label": "C", "text": "Option C text"},
      {"label": "D", "text": "Option D text"}
    ],
    "correctAnswer": ["A"], // if answer key present
    "category": "Adult Psychiatry",
    "difficulty": "medium"
  }
]

Guidelines:
- Clean up OCR errors and formatting issues
- Preserve medical terminology exactly
- Maintain question numbering sequence
- Include all options even if formatting is messy
- Mark uncertain extractions with confidence notes
- Exam type: ${options.examType || 'PRITE Part 1'}
- Strict mode: ${options.strictMode ? 'Only include complete, well-formed questions' : 'Include partial questions with notes'}`;

  try {
    const response = await claude.processText(prompt, text);
    const parsedQuestions = JSON.parse(response);

    const warnings: string[] = [];
    if (parsedQuestions.length !== options.expectedQuestions) {
      warnings.push(`Expected ${options.expectedQuestions} questions, found ${parsedQuestions.length}`);
    }

    return {
      questions: parsedQuestions.map(normalizeQuestion),
      metadata: {
        totalFound: parsedQuestions.length,
        processingTime: Date.now() - startTime,
        confidence: calculateConfidence(parsedQuestions),
        warnings,
      },
    };
  } catch (error) {
    throw new Error(`Failed to process text: ${error.message}`);
  }
}

// Generate UWorld-style explanations
export async function generateExplanation(params: {
  question: string;
  options: QuestionOption[];
  correctAnswers: string[];
  existingExplanation?: string;
  style: 'uworld' | 'detailed' | 'concise';
  userId: string;
}): Promise<string> {
  const { question, options, correctAnswers, style } = params;

  const stylePrompts = {
    uworld: `Generate a comprehensive UWorld-style explanation that:
    1. Clearly states why the correct answer is right with detailed reasoning
    2. Explains why each incorrect answer is wrong with 1-2 sentences each
    3. Includes relevant medical knowledge and teaching points
    4. Uses clear, educational language appropriate for psychiatry residents`,
    
    detailed: `Provide an in-depth explanation covering:
    1. Core concepts tested by this question
    2. Detailed rationale for the correct answer
    3. Analysis of why other options are incorrect
    4. Related clinical pearls and high-yield facts
    5. Connections to other psychiatric conditions or medications`,
    
    concise: `Write a clear, concise explanation that:
    1. States the correct answer and primary reason why
    2. Briefly explains why other options are wrong
    3. Includes one key teaching point
    4. Keeps explanation under 200 words`
  };

  const prompt = `You are an expert psychiatry educator creating explanations for PRITE exam questions.

Question: ${question}

Options:
${options.map(opt => `${opt.label}. ${opt.text}`).join('\n')}

Correct Answer(s): ${correctAnswers.join(', ')}

${stylePrompts[style]}

Format your response as a clear, well-structured explanation that would help a psychiatry resident understand not just the correct answer, but the underlying concepts being tested.

Focus on:
- Medical accuracy and current standards
- Clear reasoning and logic
- Educational value for PRITE preparation
- Professional tone appropriate for medical education`;

  try {
    const explanation = await claude.processText(prompt, '');
    return explanation;
  } catch (error) {
    throw new Error(`Failed to generate explanation: ${error.message}`);
  }
}

// Utility functions
function normalizeQuestion(question: any): ParsedQuestion {
  return {
    number: question.number?.toString() || '',
    text: question.text?.trim() || '',
    options: question.options?.map((opt: any) => ({
      label: opt.label?.toUpperCase() || '',
      text: opt.text?.trim() || '',
    })) || [],
    correctAnswers: Array.isArray(question.correctAnswer) 
      ? question.correctAnswer.map((a: string) => a.toUpperCase())
      : [question.correctAnswer?.toUpperCase()].filter(Boolean),
    explanation: question.explanation?.trim(),
    category: question.category || 'General',
    difficulty: question.difficulty || 'medium',
  };
}

function calculateConfidence(questions: any[]): number {
  if (questions.length === 0) return 0;

  let totalScore = 0;
  questions.forEach(q => {
    let score = 0;
    if (q.text && q.text.length > 10) score += 25;
    if (q.options && q.options.length >= 4) score += 25;
    if (q.number) score += 15;
    if (q.category) score += 15;
    if (q.correctAnswer && q.correctAnswer.length > 0) score += 20;
    totalScore += score;
  });

  return Math.round(totalScore / (questions.length * 100) * 100);
}