interface ProcessedQuestion {
  number: number;
  text: string;
  options: { label: string; text: string }[];
  category?: string;
  topics?: string[];
}

interface AIVisionResult {
  questions: ProcessedQuestion[];
  confidence: number;
  rawResponse: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

export const processImageWithAI = async (imageFile: File): Promise<AIVisionResult> => {
  try {
    console.log(`Starting AI vision processing for ${imageFile.name}...`);
    
    const base64Image = await fileToBase64(imageFile);
    
    const prompt = `
Please analyze this PRITE exam page and extract all questions in structured JSON format.

For each question, provide:
1. Question number (if visible)
2. Complete question text
3. All answer choices (A, B, C, D, E) with full text
4. Estimated category (Adult Psychiatry, Child Psychiatry, Neurology, etc.)
5. Key topics/concepts

Return JSON in this exact format:
{
  "questions": [
    {
      "number": 5,
      "text": "Complete question text here...",
      "options": [
        {"label": "A", "text": "Full option A text"},
        {"label": "B", "text": "Full option B text"},
        {"label": "C", "text": "Full option C text"},
        {"label": "D", "text": "Full option D text"},
        {"label": "E", "text": "Full option E text"}
      ],
      "category": "Adult Psychiatry",
      "topics": ["Depression", "Substance Use", "Screening"]
    }
  ]
}

Be very careful to extract complete text and maintain formatting. Include ALL questions visible on the page.
`;

    // Use TRPC mutation directly instead of fetch
    const response = await fetch('/api/trpc/ai.processImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        "0": {
          image: base64Image,
          prompt: prompt
        }
      })
    });

    if (!response.ok) {
      throw new Error('AI vision processing failed');
    }

    const result = await response.json();
    
    console.log(`AI vision completed for ${imageFile.name}`);
    
    return {
      questions: result.questions || [],
      confidence: result.confidence || 95,
      rawResponse: result.rawResponse || ''
    };
    
  } catch (error) {
    console.error('AI vision processing failed:', error);
    
    // Fallback: Create a manual entry prompt
    return {
      questions: [{
        number: 1,
        text: `AI processing unavailable. Please manually enter question from ${imageFile.name}`,
        options: [
          { label: 'A', text: 'Please enter option A' },
          { label: 'B', text: 'Please enter option B' },
          { label: 'C', text: 'Please enter option C' },
          { label: 'D', text: 'Please enter option D' },
          { label: 'E', text: 'Please enter option E' }
        ],
        category: 'Unknown',
        topics: []
      }],
      confidence: 0,
      rawResponse: 'AI processing failed - manual entry required'
    };
  }
};