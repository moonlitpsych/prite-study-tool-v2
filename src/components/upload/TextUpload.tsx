import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  FileText, 
  Smartphone, 
  Copy,
  Wand2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TextUploadProps {
  onProcessed: (result: any) => void;
}

export const TextUpload = ({ onProcessed }: TextUploadProps) => {
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processTextMutation = trpc.upload.processText.useMutation({
    onSuccess: (result) => {
      onProcessed(result);
      setProcessing(false);
    },
    onError: (error) => {
      setError(error.message);
      setProcessing(false);
    },
  });

  const handleProcess = async () => {
    if (!text.trim()) return;

    setProcessing(true);
    setError(null);

    try {
      await processTextMutation.mutateAsync({
        text: text.trim(),
        method: 'text',
        options: {
          examType: 'PRITE Part 1',
          expectedQuestions: estimateQuestionCount(text),
          includeAnswerKey: text.toLowerCase().includes('answer') || text.toLowerCase().includes('correct'),
          strictMode: true,
        },
      });
    } catch (err) {
      console.error('Processing error:', err);
    }
  };

  const estimateQuestionCount = (text: string): number => {
    // Simple heuristic to estimate number of questions
    const questionPatterns = [
      /\d+\.\s/g, // "1. "
      /question\s+\d+/gi, // "Question 1"
      /^\d+\)/gm, // "1)"
    ];

    let maxCount = 1;
    questionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > maxCount) {
        maxCount = matches.length;
      }
    });

    return Math.min(Math.max(maxCount, 1), 50);
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      setError(null);
    } catch (err) {
      setError('Unable to access clipboard. Please paste manually.');
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedQuestions = estimateQuestionCount(text);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Text Input</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* iOS Live Text instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Using iOS Live Text (Recommended)</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Take a clear photo of your PRITE questions with your iPhone/iPad</li>
                  <li>Open the photo and tap and hold on any text</li>
                  <li>Tap "Select All" then "Copy" to copy all text</li>
                  <li>Return here and paste the text below</li>
                </ol>
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={handlePaste}>
                    <Copy className="h-4 w-4 mr-2" />
                    Paste from Clipboard
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Text input area */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              PRITE Question Text
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              className="w-full h-64 px-3 py-2 border border-input rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              placeholder="Paste your PRITE question text here...

Example format:
1. A 35-year-old patient presents with...
A) First option
B) Second option  
C) Third option
D) Fourth option

2. Which of the following medications...
A) Option text
B) Option text
..."
              disabled={processing}
            />
          </div>

          {/* Text analytics */}
          {text && (
            <div className="flex items-center space-x-6 text-sm text-muted-foreground bg-accent/20 rounded-lg p-3">
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wand2 className="h-4 w-4" />
                <span>~{estimatedQuestions} questions detected</span>
              </div>
              {text.toLowerCase().includes('answer') && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Answer key detected</span>
                </div>
              )}
            </div>
          )}

          {/* Processing options */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Processing Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Type</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  <option value="Part 1">PRITE Part 1</option>
                  <option value="Part 2">PRITE Part 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Questions</label>
                <select className="w-full px-3 py-2 border border-input rounded-md bg-background">
                  {[5, 10, 15, 20, 25, 30].map(num => (
                    <option key={num} value={num} selected={num === estimatedQuestions}>
                      {num} questions
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <input
                  type="checkbox"
                  id="strictMode"
                  className="rounded border-border"
                  defaultChecked
                />
                <label htmlFor="strictMode" className="text-sm">
                  Strict parsing mode
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleProcess}
            disabled={!text.trim() || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Processing Text...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Process Questions ({estimatedQuestions} detected)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tips for better results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>Tips for Better Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>iOS Live Text:</strong> Works best with clear, well-lit photos</li>
            <li>• <strong>Manual editing:</strong> Review and clean up OCR text before processing</li>
            <li>• <strong>Question numbering:</strong> Keep "1.", "2." format for better parsing</li>
            <li>• <strong>Answer choices:</strong> Maintain "A)", "B)", "C)" format</li>
            <li>• <strong>Answer keys:</strong> Include if available for automatic marking</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};