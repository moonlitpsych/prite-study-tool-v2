import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  ThumbsUp, 
  ThumbsDown, 
  Star,
  User,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Flag,
  Sparkles
} from 'lucide-react';

export const QuestionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium');

  const { data: question, isLoading, refetch } = trpc.questions.getById.useQuery(id!);
  
  const voteMutation = trpc.questions.vote.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteMutation = trpc.questions.delete.useMutation({
    onSuccess: () => navigate('/questions'),
  });
  const generateExplanationMutation = trpc.questions.generateExplanation.useMutation();

  if (!id) {
    return <div>Question ID not found</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Question not found</h3>
        <Link to="/questions">
          <Button>Back to Questions</Button>
        </Link>
      </div>
    );
  }

  const options = question.options as { label: string; text: string }[];
  const isCorrect = selectedAnswers.length === question.correctAnswers.length &&
    selectedAnswers.every(answer => question.correctAnswers.includes(answer));

  const handleAnswerSelect = (optionLabel: string) => {
    if (showAnswer) return;
    
    if (selectedAnswers.includes(optionLabel)) {
      setSelectedAnswers(selectedAnswers.filter(a => a !== optionLabel));
    } else {
      setSelectedAnswers([...selectedAnswers, optionLabel]);
    }
  };

  const handleSubmitAnswer = () => {
    setShowAnswer(true);
    // Here you could record the study attempt
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) return;
    try {
      await voteMutation.mutateAsync({ questionId: question.id, voteType });
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteMutation.mutateAsync(question.id);
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question');
    }
  };

  const handleGenerateExplanation = async () => {
    setGeneratingExplanation(true);
    try {
      await generateExplanationMutation.mutateAsync({
        questionId: question.id,
      });
      // Refetch to get updated explanation
      refetch();
    } catch (error) {
      console.error('Failed to generate explanation:', error);
    } finally {
      setGeneratingExplanation(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOptionClass = (optionLabel: string) => {
    if (!showAnswer) {
      return selectedAnswers.includes(optionLabel)
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-blue-300';
    }
    
    if (question.correctAnswers.includes(optionLabel)) {
      return 'border-green-500 bg-green-50';
    }
    
    if (selectedAnswers.includes(optionLabel) && !question.correctAnswers.includes(optionLabel)) {
      return 'border-red-500 bg-red-50';
    }
    
    return 'border-gray-200';
  };

  // Calculate vote stats
  const upvotes = question.votes?.filter(v => v.voteType === 'up').length || 0;
  const downvotes = question.votes?.filter(v => v.voteType === 'down').length || 0;
  const score = upvotes - downvotes;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/questions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Questions
        </Button>
        
        {user && question.createdBy.id === user.id && (
          <div className="flex items-center space-x-2">
            <Link to={`/questions/${question.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-lg font-medium">{question.category}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty.toUpperCase()}
                </span>
                <span className="text-sm text-muted-foreground">{question.examPart}</span>
                {question.isVerified && (
                  <span className="text-green-600 font-medium text-sm">✓ Verified</span>
                )}
              </div>
              
              {question.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {question.topics.map((topic) => (
                    <span key={topic} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Voting */}
            {user && (
              <div className="flex flex-col items-center space-y-1 ml-4">
                <button
                  onClick={() => handleVote('up')}
                  className="p-1 hover:bg-green-100 rounded transition-colors"
                  disabled={voteMutation.isLoading}
                >
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                </button>
                <span className={`text-sm font-medium ${
                  score > 0 ? 'text-green-600' : 
                  score < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {score}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  disabled={voteMutation.isLoading}
                >
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Question Text */}
            <div className="prose max-w-none">
              <p className="text-lg leading-relaxed">{question.text}</p>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option) => (
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
                    {showAnswer && (
                      <div className="ml-auto">
                        {question.correctAnswers.includes(option.label) && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {selectedAnswers.includes(option.label) && 
                         !question.correctAnswers.includes(option.label) && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Answer */}
            {!showAnswer && selectedAnswers.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
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
                  <Button onClick={handleSubmitAnswer} size="lg">
                    Submit Answer
                  </Button>
                </div>
              </div>
            )}

            {/* Result & Explanation */}
            {showAnswer && (
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
                    Correct answer{question.correctAnswers.length > 1 ? 's' : ''}: {question.correctAnswers.join(', ')}
                  </span>
                </div>
                
                {/* Explanation */}
                {question.explanation ? (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                    <p className="text-blue-800 leading-relaxed whitespace-pre-line">{question.explanation}</p>
                  </div>
                ) : (
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
                            <LoadingSpinner className="h-4 w-4 mr-2" />
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

                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      setShowAnswer(false);
                      setSelectedAnswers([]);
                    }}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Question Meta */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>Created by @{question.createdBy.username}</span>
                {question.createdBy.reputation > 0 && (
                  <span className="flex items-center text-yellow-600">
                    <Star className="h-4 w-4 mr-0.5" />
                    {question.createdBy.reputation}
                  </span>
                )}
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(question.createdAt).toLocaleDateString()}</span>
              </div>
              <span>•</span>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-4 w-4" />
                <span>Studied {question._count?.studyRecords || 0} times</span>
              </div>
            </div>
            
            {user && question.createdBy.id !== user.id && (
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Flag className="h-4 w-4 mr-2" />
                Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};