import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Upload,
  FileImage,
  CheckCircle,
  AlertCircle,
  Save,
  Eye,
  Calendar,
  BookOpen,
  Database,
  Edit,
  Grid3X3,
  ArrowRight,
  Undo,
  RotateCcw
} from 'lucide-react';
import { AdminAnswerKeyManualPage } from './AdminAnswerKeyManualPage';

interface ExtractedAnswer {
  questionNumber: number;
  correctAnswer: string;
  userAnswer?: string;
}

export const AdminAnswerKeysPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'manual'>('overview');
  const [examYear, setExamYear] = useState(2024);
  const [examPart, setExamPart] = useState<'Part 1' | 'Part 2'>('Part 1');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedAnswers, setExtractedAnswers] = useState<ExtractedAnswer[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAnswers, setEditingAnswers] = useState<Record<number, string>>({});

  // Mutations
  const uploadMutation = trpc.answerKeys.uploadAnswerKey.useMutation();
  const saveMutation = trpc.answerKeys.saveAnswerKey.useMutation();
  
  // Queries
  const { data: existingAnswerKeys, refetch: refetchAnswerKeys } = trpc.answerKeys.getAllAnswerKeys.useQuery();
  const { data: currentAnswerKey } = trpc.answerKeys.getAnswerKey.useQuery({
    examYear,
    examPart,
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Please select an image smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1]; // Remove data URL prefix
      setSelectedImage(base64Data);
      setExtractedAnswers([]);
    };
    reader.readAsDataURL(file);
  };

  const handleExtractAnswers = async () => {
    if (!selectedImage) return;

    setIsExtracting(true);
    try {
      const result = await uploadMutation.mutateAsync({
        image: selectedImage,
        examYear,
        examPart,
      });

      if (result.success) {
        setExtractedAnswers(result.extractedAnswers);
      }
    } catch (error) {
      console.error('Failed to extract answers:', error);
      alert('Failed to extract answers from image. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAnswerEdit = (questionNumber: number, newAnswer: string) => {
    setEditingAnswers(prev => ({
      ...prev,
      [questionNumber]: newAnswer
    }));
  };

  const handleSaveAnswers = async () => {
    if (extractedAnswers.length === 0) return;

    // Apply any edits
    const finalAnswers = extractedAnswers.map(answer => ({
      ...answer,
      correctAnswer: editingAnswers[answer.questionNumber] || answer.correctAnswer,
    }));

    setIsSaving(true);
    try {
      const result = await saveMutation.mutateAsync({
        examYear,
        examPart,
        answers: finalAnswers,
      });

      if (result.success) {
        alert(`Successfully saved ${result.savedCount} answer keys!`);
        setSelectedImage(null);
        setExtractedAnswers([]);
        setEditingAnswers({});
        refetchAnswerKeys();
      }
    } catch (error) {
      console.error('Failed to save answers:', error);
      alert('Failed to save answers. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (activeTab === 'manual') {
    return <AdminAnswerKeyManualPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin: Answer Key Management</h1>
            <p className="text-muted-foreground">
              Upload and manage PRITE exam answer keys for automated question uploads
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {Object.keys(existingAnswerKeys || {}).length} years available
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>AI Upload & Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'manual'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Grid3X3 className="h-4 w-4" />
                <span>Manual Entry</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Grid3X3 className="h-5 w-5" />
              <span>Manual Entry (Recommended)</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Enter answers manually in a clean grid interface - more reliable than AI extraction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setActiveTab('manual')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Open Manual Entry
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>AI Image Processing</span>
            </CardTitle>
            <CardDescription>
              Upload answer key images for AI extraction (experimental)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              This method attempts to extract answers from images but may require significant manual correction.
            </p>
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ Manual entry is recommended for accuracy
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Answer Keys Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>Existing Answer Keys</span>
          </CardTitle>
          <CardDescription>Currently available answer keys in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {existingAnswerKeys && Object.keys(existingAnswerKeys).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(existingAnswerKeys).map(([year, parts]) => (
                <div key={year} className="p-3 border rounded-lg">
                  <div className="font-medium text-lg">{year}</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {parts.map((part: any) => (
                      <div key={part.examPart} className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span>{part.examPart}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No answer keys uploaded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Answer Key</span>
            </CardTitle>
            <CardDescription>
              Upload an image of a PRITE answer key for AI processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Exam Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Year</label>
                <select
                  value={examYear}
                  onChange={(e) => setExamYear(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Exam Part</label>
                <select
                  value={examPart}
                  onChange={(e) => setExamPart(e.target.value as 'Part 1' | 'Part 2')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Part 1">Part 1</option>
                  <option value="Part 2">Part 2</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Answer Key Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="answer-key-upload"
                />
                <label htmlFor="answer-key-upload" className="cursor-pointer">
                  <FileImage className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Click to upload answer key image
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </label>
              </div>
            </div>

            {selectedImage && (
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileImage className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Image uploaded</span>
                </div>
                <Button
                  onClick={handleExtractAnswers}
                  disabled={isExtracting}
                  size="sm"
                >
                  {isExtracting ? (
                    <LoadingSpinner className="h-3 w-3 mr-1" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  Extract Answers
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Answer Key Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Current: {examYear} {examPart}</span>
            </CardTitle>
            <CardDescription>
              {currentAnswerKey?.count || 0} answers in database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentAnswerKey?.answers && currentAnswerKey.answers.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2 text-xs">
                  {currentAnswerKey.answers.slice(0, 25).map((answer: any) => (
                    <div key={answer.questionNumber} className="text-center p-1 border rounded">
                      <div className="font-medium">{answer.questionNumber}</div>
                      <div className={`${answer.userAnswer ? 'text-red-600' : 'text-green-600'}`}>
                        {answer.userAnswer ? `${answer.userAnswer}(${answer.correctAnswer})` : answer.correctAnswer}
                      </div>
                    </div>
                  ))}
                  {currentAnswerKey.answers.length > 25 && (
                    <div className="text-center p-1 text-muted-foreground">
                      +{currentAnswerKey.answers.length - 25} more
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No answers for {examYear} {examPart}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extracted Answers Review */}
      {extractedAnswers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Extracted Answers</span>
                <span className="text-sm text-muted-foreground">
                  ({extractedAnswers.length} questions)
                </span>
              </div>
              <Button
                onClick={handleSaveAnswers}
                disabled={isSaving}
                className="ml-4"
              >
                {isSaving ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save to Database
              </Button>
            </CardTitle>
            <CardDescription>
              Review and edit extracted answers before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                {extractedAnswers.map((answer) => (
                  <div key={answer.questionNumber} className="border rounded-lg p-2">
                    <div className="text-center mb-2">
                      <div className="font-medium text-sm">{answer.questionNumber}</div>
                      {answer.userAnswer && (
                        <div className="text-xs text-red-600">
                          Wrong: {answer.userAnswer}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center">
                      <select
                        value={editingAnswers[answer.questionNumber] || answer.correctAnswer}
                        onChange={(e) => handleAnswerEdit(answer.questionNumber, e.target.value)}
                        className="w-full text-center border rounded px-1 py-1 text-sm"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};