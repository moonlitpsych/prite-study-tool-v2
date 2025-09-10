import React, { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  Database,
  Grid3X3,
  Undo,
  RotateCcw
} from 'lucide-react';

interface AnswerData {
  questionNumber: number;
  correctAnswer: string;
  saved: boolean;
}

export const AdminAnswerKeyManualPage = () => {
  const [examYear, setExamYear] = useState(2024);
  const [examPart, setExamPart] = useState<'Part 1' | 'Part 2'>('Part 1');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mutations
  const saveMutation = trpc.answerKeys.saveAnswerKey.useMutation();
  
  // Queries
  const { data: existingAnswerKeys, refetch: refetchAnswerKeys } = trpc.answerKeys.getAllAnswerKeys.useQuery();
  const { data: currentAnswerKey, refetch: refetchCurrentAnswerKey } = trpc.answerKeys.getAnswerKey.useQuery({
    examYear,
    examPart,
  });

  // Load existing answers when data changes
  useEffect(() => {
    if (currentAnswerKey?.answers) {
      const existingAnswers: Record<number, string> = {};
      currentAnswerKey.answers.forEach((answer: any) => {
        existingAnswers[answer.questionNumber] = answer.correctAnswer;
      });
      setAnswers(existingAnswers);
      setHasUnsavedChanges(false);
    } else {
      // Reset if no existing answers
      setAnswers({});
      setHasUnsavedChanges(false);
    }
  }, [currentAnswerKey]);

  // Generate question range based on exam part
  const getQuestionRange = () => {
    if (examPart === 'Part 1') {
      return Array.from({ length: 75 }, (_, i) => i + 1); // 1-75
    } else {
      return Array.from({ length: 75 }, (_, i) => i + 76); // 76-150
    }
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAnswers = async () => {
    const answersToSave = Object.entries(answers).map(([questionNumber, correctAnswer]) => ({
      questionNumber: parseInt(questionNumber),
      correctAnswer,
    }));

    if (answersToSave.length === 0) {
      alert('Please enter at least one answer before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveMutation.mutateAsync({
        examYear,
        examPart,
        answers: answersToSave,
      });

      if (result.success) {
        alert(`Successfully saved ${result.savedCount} answer keys!`);
        setHasUnsavedChanges(false);
        refetchAnswerKeys();
        refetchCurrentAnswerKey();
      }
    } catch (error) {
      console.error('Failed to save answers:', error);
      alert('Failed to save answers. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all answers? This cannot be undone.')) {
      setAnswers({});
      setHasUnsavedChanges(true);
    }
  };

  const handleResetToSaved = () => {
    if (confirm('Are you sure you want to reset to the last saved state? All unsaved changes will be lost.')) {
      if (currentAnswerKey?.answers) {
        const existingAnswers: Record<number, string> = {};
        currentAnswerKey.answers.forEach((answer: any) => {
          existingAnswers[answer.questionNumber] = answer.correctAnswer;
        });
        setAnswers(existingAnswers);
      } else {
        setAnswers({});
      }
      setHasUnsavedChanges(false);
    }
  };

  const getProgress = () => {
    const questionRange = getQuestionRange();
    const answeredCount = questionRange.filter(q => answers[q]).length;
    return { answered: answeredCount, total: questionRange.length };
  };

  const progress = getProgress();
  const progressPercentage = (progress.answered / progress.total) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">Manual Answer Key Entry</h1>
          <p className="text-muted-foreground">
            Enter correct answers for PRITE exam questions manually
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {progress.answered}/{progress.total}
            </div>
            <div className="text-sm text-muted-foreground">Questions answered</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Exam Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Exam Year */}
            <div>
              <label className="block text-sm font-medium mb-2">Exam Year</label>
              <select
                value={examYear}
                onChange={(e) => setExamYear(Number(e.target.value))}
                className="flex h-10 w-full sm:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Exam Part */}
            <div>
              <label className="block text-sm font-medium mb-2">Exam Part</label>
              <select
                value={examPart}
                onChange={(e) => setExamPart(e.target.value as 'Part 1' | 'Part 2')}
                className="flex h-10 w-full sm:w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Part 1">Part 1 (1-75)</option>
                <option value="Part 2">Part 2 (76-150)</option>
              </select>
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Progress</label>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              {hasUnsavedChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetToSaved}
                  className="text-orange-600 border-orange-300"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 border-red-300"
              >
                <Undo className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button
                onClick={handleSaveAnswers}
                disabled={isSaving || !hasUnsavedChanges}
                className="min-w-24"
              >
                {isSaving ? (
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="font-medium text-yellow-800">Unsaved Changes</div>
              <div className="text-sm text-yellow-700">
                You have unsaved changes. Don't forget to save your work!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Grid3X3 className="h-5 w-5" />
            <span>PRITE {examYear} {examPart}</span>
          </CardTitle>
          <CardDescription>
            Select the correct answer for each question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-15 gap-3">
            {getQuestionRange().map((questionNumber) => (
              <div 
                key={questionNumber} 
                className={`border rounded-lg p-3 transition-all ${
                  answers[questionNumber] 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Question Number */}
                <div className="text-center mb-2">
                  <div className="font-bold text-sm">{questionNumber}</div>
                  {answers[questionNumber] && (
                    <CheckCircle className="h-3 w-3 text-green-600 mx-auto mt-1" />
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-1">
                  {['A', 'B', 'C', 'D', 'E'].map((option) => (
                    <label key={option} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`question-${questionNumber}`}
                        value={option}
                        checked={answers[questionNumber] === option}
                        onChange={(e) => handleAnswerChange(questionNumber, e.target.value)}
                        className="h-3 w-3 text-green-600"
                        style={{ accentColor: '#16a34a' }}
                      />
                      <span className="text-xs font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Answer Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            {['A', 'B', 'C', 'D', 'E'].map((option) => {
              const count = Object.values(answers).filter(a => a === option).length;
              return (
                <div key={option} className="p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{count}</div>
                  <div className="text-sm text-muted-foreground">Answer {option}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};