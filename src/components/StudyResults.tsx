import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trophy, Target, Clock, BookOpen, TrendingUp } from 'lucide-react';

interface StudyResultsProps {
  sessionStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTimeSpent: number;
    averageTimePerQuestion: number;
    categoryBreakdown: Record<string, { total: number; correct: number }>;
  };
  onStartNewSession: () => void;
  onGoBack: () => void;
}

export const StudyResults = ({ sessionStats, onStartNewSession, onGoBack }: StudyResultsProps) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAccuracyMessage = (accuracy: number) => {
    if (accuracy >= 90) return 'Outstanding! 🎉';
    if (accuracy >= 80) return 'Excellent work! 👏';
    if (accuracy >= 70) return 'Good job! 👍';
    if (accuracy >= 60) return 'Keep practicing! 📚';
    return 'More study needed 💪';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
        <h1 className="text-3xl font-bold">Session Complete!</h1>
        <p className="text-lg text-gray-600">{getAccuracyMessage(sessionStats.accuracy)}</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <div className={`text-3xl font-bold ${getAccuracyColor(sessionStats.accuracy)}`}>
              {Math.round(sessionStats.accuracy)}%
            </div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-bold text-gray-900">
              {sessionStats.correctAnswers}/{sessionStats.totalQuestions}
            </div>
            <div className="text-sm text-gray-500">Correct</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <div className="text-3xl font-bold text-gray-900">
              {formatTime(sessionStats.totalTimeSpent)}
            </div>
            <div className="text-sm text-gray-500">Total Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <div className="text-3xl font-bold text-gray-900">
              {formatTime(sessionStats.averageTimePerQuestion)}
            </div>
            <div className="text-sm text-gray-500">Avg per Q</div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(sessionStats.categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(sessionStats.categoryBreakdown).map(([category, stats]) => {
                const accuracy = (stats.correct / stats.total) * 100;
                return (
                  <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{category}</div>
                      <div className="text-sm text-gray-500">
                        {stats.correct} of {stats.total} questions
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            accuracy >= 80 ? 'bg-green-500' : 
                            accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.max(accuracy, 5)}%` }}
                        />
                      </div>
                      <div className={`font-semibold min-w-[3rem] text-right ${getAccuracyColor(accuracy)}`}>
                        {Math.round(accuracy)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Study Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionStats.accuracy < 70 && (
              <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-yellow-800">
                  <strong>Focus on review:</strong> Questions you missed will appear more frequently in future sessions
                  until you master them.
                </p>
              </div>
            )}
            
            {sessionStats.averageTimePerQuestion > 120000 && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                <p className="text-blue-800">
                  <strong>Work on timing:</strong> Try to answer questions more quickly. The PRITE is time-pressured.
                </p>
              </div>
            )}

            {Object.values(sessionStats.categoryBreakdown).some(cat => 
              (cat.correct / cat.total) * 100 < 60
            ) && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-red-800">
                  <strong>Target weak areas:</strong> Focus your next sessions on categories where you scored below 60%.
                </p>
              </div>
            )}

            <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
              <p className="text-green-800">
                <strong>Spaced repetition active:</strong> Questions will be scheduled for optimal review timing 
                based on your performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={onGoBack}
          variant="outline"
          size="lg"
        >
          Back to Study
        </Button>
        <Button 
          onClick={onStartNewSession}
          size="lg"
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
};