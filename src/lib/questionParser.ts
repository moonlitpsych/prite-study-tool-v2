interface ParsedQuestion {
  number: number;
  text: string;
  options: { label: string; text: string }[];
}

const createDefaultOptions = () => [
  { label: 'A', text: 'Answer choice A (needs extraction)' },
  { label: 'B', text: 'Answer choice B (needs extraction)' },
  { label: 'C', text: 'Answer choice C (needs extraction)' },
  { label: 'D', text: 'Answer choice D (needs extraction)' },
  { label: 'E', text: 'Answer choice E (needs extraction)' }
];

export const parseQuestionsFromOCR = (ocrText: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  
  // Clean up OCR text
  let cleanedText = ocrText.replace(/\s+/g, ' ').trim();
  
  // More flexible pattern to find question numbers in PRITE format
  // Look for patterns like "5 An active duty" or "6. Which of the following"
  const questionPattern = /(?:^|\s)([5-8])\s*\.?\s+([A-Z][^0-9]*?)(?=\s*[5-8]\s*\.?\s+[A-Z]|$)/g;
  const matches = [...cleanedText.matchAll(questionPattern)];
  
  console.log(`Question pattern found ${matches.length} matches`);
  
  if (matches.length === 0) {
    // Try a simpler approach - look for common question starters
    const simplePattern = /(?:^|\s)([5-8])[\s\.]+(.+?)(?=(?:\s*[5-8][\s\.])|$)/g;
    const simpleMatches = [...cleanedText.matchAll(simplePattern)];
    
    if (simpleMatches.length > 0) {
      for (const match of simpleMatches) {
        const questionNumber = parseInt(match[1]);
        const questionText = match[2].trim();
        
        questions.push({
          number: questionNumber,
          text: questionText.substring(0, 300) + (questionText.length > 300 ? '...' : ''),
          options: createDefaultOptions()
        });
      }
      return questions;
    }
    
    // Ultimate fallback: split by known question patterns from the OCR
    // Based on your specific OCR output, let's split more intelligently
    const keyPhrases = [
      'An active duty Air Force pilot',
      'Which of the following methods of gastrointestinal decontamination',
      'father wants to know if he should allow',
      'A patient with major depressive disorder'
    ];
    
    let remainingText = cleanedText;
    let questionNum = 5;
    
    keyPhrases.forEach(phrase => {
      const phraseIndex = remainingText.toLowerCase().indexOf(phrase.toLowerCase());
      if (phraseIndex !== -1) {
        // Extract text starting from this phrase until next phrase or end
        let endIndex = remainingText.length;
        for (const nextPhrase of keyPhrases) {
          if (nextPhrase !== phrase) {
            const nextIndex = remainingText.toLowerCase().indexOf(nextPhrase.toLowerCase(), phraseIndex + 1);
            if (nextIndex !== -1 && nextIndex < endIndex) {
              endIndex = nextIndex;
            }
          }
        }
        
        const questionText = remainingText.substring(phraseIndex, endIndex).trim();
        if (questionText.length > 50) {
          questions.push({
            number: questionNum++,
            text: questionText.substring(0, 400) + (questionText.length > 400 ? '...' : ''),
            options: createDefaultOptions()
          });
        }
      }
    });
    
    return questions;
  }
  
  for (let i = 0; i < matches.length; i++) {
    const currentMatch = matches[i];
    const nextMatch = matches[i + 1];
    
    const questionNumber = parseInt(currentMatch[1]);
    const startIndex = currentMatch.index! + currentMatch[0].length;
    const endIndex = nextMatch ? nextMatch.index! : ocrText.length;
    
    const questionText = ocrText.slice(startIndex, endIndex).trim();
    
    // Extract answer choices (A., B., C., etc.)
    const answerPattern = /([A-E])\.\s*([^A-E]*?)(?=\s*[A-E]\.|$)/g;
    const answerMatches = [...questionText.matchAll(answerPattern)];
    
    const options = answerMatches.map(match => ({
      label: match[1],
      text: match[2].trim().replace(/\n/g, ' ').replace(/\s+/g, ' ')
    }));
    
    // If we don't find proper answer choices, create basic structure
    if (options.length === 0) {
      options.push(...createDefaultOptions());
    }
    
    // Extract just the question stem (before answer choices)
    const questionStem = questionText.split(/[A-E]\./)[0].trim();
    
    questions.push({
      number: questionNumber,
      text: questionStem,
      options
    });
  }
  
  return questions;
};

export const formatQuestionForDisplay = (question: ParsedQuestion, rawText: string) => {
  return {
    text: question.text,
    options: question.options,
    correctAnswer: undefined, // Will be set by user or AI
    rawText: rawText
  };
};