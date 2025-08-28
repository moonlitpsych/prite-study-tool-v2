import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, FileImage, Loader2, AlertCircle, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { QuestionEditor } from '@/components/QuestionEditor';
import { processImageWithAI } from '@/lib/aiVision';
import { trpc } from '@/lib/trpc';

interface ProcessedQuestion {
  number: number;
  text: string;
  options: { label: string; text: string }[];
  category?: string;
  topics?: string[];
  correctAnswer?: string;
  confidence?: number;
  saved?: boolean;
}

export const UploadPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedQuestions, setProcessedQuestions] = useState<ProcessedQuestion[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [examYear, setExamYear] = useState(new Date().getFullYear());
  const [examPart, setExamPart] = useState(1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // TRPC mutation for AI processing
  const aiProcessImage = trpc.ai.processImage.useMutation();
  
  // TRPC mutation for saving questions
  const createQuestion = trpc.questions.createFromUpload.useMutation();

  const handleFileSelect = useCallback((files: File[]) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (imageFiles.length === 0) {
      setError('Please select valid image files');
      return;
    }
    
    if (imageFiles.length > 5) {
      setError('Maximum 5 images at a time');
      return;
    }

    setSelectedFiles(imageFiles);
    setError(null);
  }, []);

  const processImages = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      const results: ProcessedQuestion[] = [];
      
      for (const file of selectedFiles) {
        console.log(`Processing ${file.name} with AI Vision...`);
        
        // Convert file to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(file);
        });
        
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
        
        try {
          // Call the TRPC mutation
          const aiResult = await aiProcessImage.mutateAsync({
            image: base64,
            prompt: prompt
          });
          
          console.log(`Found ${aiResult.questions.length} questions in ${file.name} (${aiResult.confidence}% confidence)`);
          
          // Add AI-processed questions to results
          for (const question of aiResult.questions) {
            results.push({
              ...question,
              confidence: aiResult.confidence
            });
          }
        } catch (error) {
          console.error('AI processing failed:', error);
          // Add fallback question for manual entry
          results.push({
            number: 1,
            text: `AI processing failed for ${file.name}. Please enter question manually.`,
            options: [
              { label: 'A', text: 'Please enter option A' },
              { label: 'B', text: 'Please enter option B' },
              { label: 'C', text: 'Please enter option C' },
              { label: 'D', text: 'Please enter option D' },
              { label: 'E', text: 'Please enter option E' }
            ],
            category: 'Unknown',
            confidence: 0
          });
        }
      }
      
      setProcessedQuestions(results);
    } catch (err) {
      console.error('OCR processing failed:', err);
      setError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleQuestionSave = async (updatedQuestion: ProcessedQuestion & { examYear: number; examPart: number }) => {
    console.log('Saving question:', updatedQuestion);
    
    try {
      const savedQuestion = await createQuestion.mutateAsync({
        text: updatedQuestion.text,
        options: updatedQuestion.options,
        correctAnswer: updatedQuestion.correctAnswer!,
        category: updatedQuestion.category || 'Unknown',
        topics: updatedQuestion.topics || [],
        examYear: updatedQuestion.examYear,
        examPart: updatedQuestion.examPart,
        questionNumber: updatedQuestion.number,
        confidence: updatedQuestion.confidence
      });
      
      console.log('Question saved successfully:', savedQuestion.id);
      
      // Update the local state to reflect the saved status
      setProcessedQuestions(prev => 
        prev.map(q => 
          q.number === updatedQuestion.number 
            ? { ...updatedQuestion, saved: true }
            : q
        )
      );
    } catch (error) {
      console.error('Failed to save question:', error);
      setError('Failed to save question. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Upload PRITE Questions
        </h1>
        <p className="text-gray-600">
          Take photos or upload images of PRITE booklet pages to digitize questions
        </p>
      </div>

      {/* Upload Options */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Upload Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Camera Capture */}
            <Button
              variant="outline"
              size="lg"
              className="h-24 flex-col space-y-2"
              onClick={handleCameraCapture}
              disabled={isProcessing}
            >
              <Camera className="h-8 w-8" />
              <span>Take Photos</span>
            </Button>

            {/* File Upload */}
            <Button
              variant="outline"
              size="lg"
              className="h-24 flex-col space-y-2"
              onClick={handleFileUpload}
              disabled={isProcessing}
            >
              <Upload className="h-8 w-8" />
              <span>Upload Images</span>
            </Button>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
          />
        </CardContent>
      </Card>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileImage className="h-5 w-5" />
              <span>Selected Images ({selectedFiles.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative border rounded-md p-2">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${index + 1}`}
                    className="w-full max-h-96 object-contain rounded-md"
                  />
                  <div className="mt-2 text-center text-sm text-gray-600">
                    {file.name} ({Math.round(file.size / 1024)}KB)
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={processImages}
                disabled={isProcessing}
                className="flex items-center space-x-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileImage className="h-4 w-4" />
                )}
                <span>
                  {isProcessing ? 'Processing...' : 'Process Images'}
                </span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFiles([]);
                  setProcessedQuestions([]);
                  setError(null);
                }}
                disabled={isProcessing}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card variant="destructive">
          <CardContent className="flex items-center space-x-2 pt-6">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Questions ({processedQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {processedQuestions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                examYear={examYear}
                examPart={examPart}
                onSave={handleQuestionSave}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};