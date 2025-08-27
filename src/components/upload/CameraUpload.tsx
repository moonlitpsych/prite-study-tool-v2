import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Camera, 
  Upload, 
  RotateCcw, 
  Crop,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface CameraUploadProps {
  onProcessed: (result: any) => void;
}

export const CameraUpload = ({ onProcessed }: CameraUploadProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImageMutation = trpc.upload.processImage.useMutation({
    onSuccess: (result) => {
      onProcessed(result);
      setProcessing(false);
    },
    onError: (error) => {
      setError(error.message);
      setProcessing(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!image) return;

    setProcessing(true);
    setError(null);

    try {
      // Convert data URL to base64
      const base64Data = image.split(',')[1];
      
      await processImageMutation.mutateAsync({
        imageData: base64Data,
        method: 'camera',
        options: {
          examType: 'PRITE Part 1',
          expectedQuestions: 10,
          includeAnswerKey: false,
        },
      });
    } catch (err) {
      console.error('Processing error:', err);
    }
  };

  const clearImage = () => {
    setImage(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {!image ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Capture Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Camera capture */}
              <div className="space-y-4">
                <h3 className="font-medium">Take Photo</h3>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border hover:border-primary transition-colors"
                  variant="outline"
                >
                  <div className="text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm">Open Camera</span>
                  </div>
                </Button>
              </div>

              {/* File upload */}
              <div className="space-y-4">
                <h3 className="font-medium">Upload Image</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border hover:border-primary transition-colors"
                  variant="outline"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm">Choose File</span>
                  </div>
                </Button>
              </div>
            </div>

            <div className="bg-accent/20 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span>Tips for Best Results</span>
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Ensure good lighting and avoid shadows</li>
                <li>• Keep the camera steady and parallel to the page</li>
                <li>• Include complete questions with all answer choices</li>
                <li>• Avoid glare and reflections on the paper</li>
                <li>• Crop out unnecessary parts of the image</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Image preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Preview</span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={clearImage}>
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img
                  src={image}
                  alt="PRITE questions preview"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing options */}
          <Card>
            <CardHeader>
              <CardTitle>Processing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <option value="5">5 questions</option>
                    <option value="10" selected>10 questions</option>
                    <option value="15">15 questions</option>
                    <option value="20">20 questions</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    id="includeAnswers"
                    className="rounded border-border"
                  />
                  <label htmlFor="includeAnswers" className="text-sm">
                    Include answer key
                  </label>
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
                disabled={processing}
                className="w-full"
                size="lg"
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing Questions...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Process Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};