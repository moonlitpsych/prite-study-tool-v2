import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Question {
  id: string;
  text: string;
  options: Array<{ label: string; text: string }>;
  correctAnswers: string[];
  explanation?: string;
  category: string;
  difficulty: string;
  examPart: string;
  topics: string[];
  createdBy?: {
    username: string;
    name: string;
  };
}

interface StudySessionProps {
  sessionId: string;
  questions: Question[];
  onComplete: (stats: any) => void;
  onRecordAnswer: (data: {
    sessionId: string;
    questionId: string;
    wasCorrect: boolean;
    confidence: string;
    timeSpent: number;
    selectedAnswers: string[];
  }) => Promise<any>;
}

export const StudySession = ({ sessionId, questions, onComplete, onRecordAnswer }: StudySessionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0,
  });
  const [generatingExplanation, setGeneratingExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // TRPC mutation for generating explanations
  const generateExplanationMutation = trpc.questions.generateExplanation.useMutation();

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    setStartTime(Date.now());
    setCurrentTime(0);
    setAiExplanation(null); // Reset AI explanation for new question
  }, [currentIndex]);

  // Timer effect for real-time display
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnswered) {
        setCurrentTime(Date.now() - startTime);
      }
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(timer);
  }, [startTime, isAnswered]);

  const handleAnswerSelect = (optionLabel: string) => {
    if (isAnswered) return;
    
    if (selectedAnswers.includes(optionLabel)) {
      setSelectedAnswers(selectedAnswers.filter(a => a !== optionLabel));
    } else {
      setSelectedAnswers([...selectedAnswers, optionLabel]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswers.length === 0) return;

    const timeSpent = Date.now() - startTime;
    const wasCorrect = selectedAnswers.length === currentQuestion.correctAnswers.length &&
      selectedAnswers.every(answer => currentQuestion.correctAnswers.includes(answer));

    setIsCorrect(wasCorrect);
    setIsAnswered(true);
    setShowExplanation(true);

    setSessionStats(prev => ({
      correct: prev.correct + (wasCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    try {
      await onRecordAnswer({
        sessionId,
        questionId: currentQuestion.id,
        wasCorrect,
        confidence,
        timeSpent,
        selectedAnswers,
      });
    } catch (error) {
      console.error('Failed to record answer:', error);
    }
  };

  const handleGenerateExplanation = async () => {
    if (!currentQuestion.id) return;
    
    setGeneratingExplanation(true);
    try {
      const result = await generateExplanationMutation.mutateAsync({
        questionId: currentQuestion.id,
      });
      setAiExplanation(result.explanation);
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      setAiExplanation('Failed to generate explanation. Please try again later.');
    } finally {
      setGeneratingExplanation(false);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete(sessionStats);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswers([]);
      setShowExplanation(false);
      setIsAnswered(false);
      setConfidence('medium');
    }
  };

  const getOptionClass = (optionLabel: string) => {
    if (!isAnswered) {
      return selectedAnswers.includes(optionLabel) 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-blue-300';
    }
    
    if (currentQuestion.correctAnswers.includes(optionLabel)) {
      return 'border-green-500 bg-green-50';
    }
    
    if (selectedAnswers.includes(optionLabel) && !currentQuestion.correctAnswers.includes(optionLabel)) {
      return 'border-red-500 bg-red-50';
    }
    
    return 'border-gray-200';
  };

  const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;

  // Format time for display
  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get timer color based on elapsed time
  const getTimerColor = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 30) return 'text-green-600';
    if (seconds < 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <div className="w-48 sm:w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timer Display */}
          <div className="flex items-center space-x-1">
            <Clock className={`h-4 w-4 ${getTimerColor(currentTime)}`} />
            <span className={`text-sm font-mono ${getTimerColor(currentTime)}`}>
              {formatTime(currentTime)}
            </span>
          </div>
          
          {/* Accuracy */}
          <div className="text-sm text-gray-500">
            Accuracy: {accuracy}% ({sessionStats.correct}/{sessionStats.total})
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{currentQuestion.category} - {currentQuestion.examPart}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
              {currentQuestion.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentQuestion.topics.slice(0, 2).map((topic, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {topic}
                    </span>
                  ))}
                  {currentQuestion.topics.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{currentQuestion.topics.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <div
                  key={option.label}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${getOptionClass(option.label)}`}
                  onClick={() => handleAnswerSelect(option.label)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="font-semibold text-lg min-w-[2rem]">
                      {option.label}.
                    </span>
                    <span className="text-gray-800">{option.text}</span>
                    {isAnswered && (
                      <div className="ml-auto">
                        {currentQuestion.correctAnswers.includes(option.label) && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {selectedAnswers.includes(option.label) && 
                         !currentQuestion.correctAnswers.includes(option.label) && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence Selector (only before answering) */}
            {!isAnswered && selectedAnswers.length > 0 && (
              <div className="border-t pt-4">
                <label className="block text-sm font-medium mb-2">How confident are you?</label>
                <div className="flex space-x-2">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setConfidence(level)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        confidence === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Result & Explanation */}
            {showExplanation && (
              <div className="border-t pt-4 space-y-4">
                <div className={`flex items-center space-x-2 p-3 rounded ${
                  isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {isCorrect ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                  <span>
                    Correct answer{currentQuestion.correctAnswers.length > 1 ? 's' : ''}: {currentQuestion.correctAnswers.join(', ')}
                  </span>
                </div>
                
                {/* Existing explanation */}
                {currentQuestion.explanation && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Explanation:</h4>
                      {!aiExplanation && (
                        <Button
                          onClick={handleGenerateExplanation}
                          disabled={generatingExplanation}
                          size="sm"
                          variant="outline"
                          className="text-purple-600 border-purple-300 hover:bg-purple-50"
                        >
                          {generatingExplanation ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-600 border-t-transparent mr-1" />
                              Generating AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              Get AI Perspective
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-line">{currentQuestion.explanation}</p>
                  </div>
                )}
                
                {/* AI Explanation Generator */}
                {!currentQuestion.explanation && (
                  <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <p className="text-sm text-gray-600 mb-3">
                        No explanation available. Generate a comprehensive UWorld-style explanation with AI.
                      </p>
                      <Button
                        onClick={handleGenerateExplanation}
                        disabled={generatingExplanation}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {generatingExplanation ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Explanation
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Generated Explanation */}
                {aiExplanation && (
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center mb-2">
                      <Sparkles className="h-5 w-5 text-purple-600 mr-2" />
                      <h4 className="font-medium text-purple-900">AI-Generated Explanation</h4>
                    </div>
                    <div className="text-purple-800 leading-relaxed whitespace-pre-line">{aiExplanation}</div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>
                  {Math.floor((Date.now() - startTime) / 1000)}s
                </span>
              </div>
              
              <div className="space-x-2">
                {!isAnswered ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswers.length === 0}
                    size="lg"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={handleNextQuestion} size="lg">
                    {isLastQuestion ? 'Finish Session' : 'Next Question'}
                    {!isLastQuestion && <ArrowRight className="h-4 w-4 ml-2" />}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};