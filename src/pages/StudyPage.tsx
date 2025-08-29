import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StudySession } from '@/components/StudySession';
import { StudyResults } from '@/components/StudyResults';
import { trpc } from '@/lib/trpc';
import { BookOpen, Play, Settings, TrendingUp } from 'lucide-react';

type StudyMode = 'spaced' | 'practice' | 'custom';
type PageState = 'setup' | 'session' | 'results';

export const StudyPage = () => {
  const [studyMode, setStudyMode] = useState<StudyMode>('spaced');
  const [pageState, setPageState] = useState<PageState>('setup');
  const [questionCount, setQuestionCount] = useState(20);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | undefined>();
  const [currentSession, setCurrentSession] = useState<{ sessionId: string; questions: any[] } | null>(null);
  const [sessionResults, setSessionResults] = useState<any>(null);

  // Get due questions count for spaced repetition
  const { data: dueCount } = trpc.study.getDueCount.useQuery();
  
  // Get user stats for context
  const { data: userStats } = trpc.study.getStats.useQuery({ period: 'week' });

  // Mutations
  const startSessionMutation = trpc.study.startSession.useMutation();
  const recordStudyMutation = trpc.study.recordStudy.useMutation();
  const finishSessionMutation = trpc.study.finishSession.useMutation();

  const availableCategories = [
    'Adult Psychiatry',
    'Child Psychiatry', 
    'Addiction Psychiatry',
    'Geriatric Psychiatry',
    'Forensic Psychiatry',
    'Consultation-Liaison Psychiatry',
    'Emergency Psychiatry',
    'Neurology'
  ];

  const handleStartSession = async () => {
    try {
      const result = await startSessionMutation.mutateAsync({
        questionCount,
        categories: categories.length > 0 ? categories : undefined,
        difficulty,
        onlyDue: studyMode === 'spaced',
      });
      
      if (result.questions.length === 0) {
        alert('No questions available for the selected criteria. Try adjusting your filters or upload some questions first!');
        return;
      }
      
      setCurrentSession(result);
      setPageState('session');
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start study session. Please try again.');
    }
  };

  const handleRecordAnswer = async (data: any) => {
    return recordStudyMutation.mutateAsync(data);
  };

  const handleSessionComplete = async () => {
    if (!currentSession) return;
    
    try {
      const result = await finishSessionMutation.mutateAsync({
        sessionId: currentSession.sessionId,
      });
      
      setSessionResults(result.stats);
      setPageState('results');
    } catch (error) {
      console.error('Failed to finish session:', error);
      alert('Failed to save session results. Please try again.');
    }
  };

  const handleBackToSetup = () => {
    setPageState('setup');
    setCurrentSession(null);
    setSessionResults(null);
  };

  const handleStartNewSession = () => {
    setPageState('setup');
    setCurrentSession(null);
    setSessionResults(null);
  };

  if (pageState === 'session' && currentSession) {
    return (
      <StudySession
        sessionId={currentSession.sessionId}
        questions={currentSession.questions}
        onComplete={handleSessionComplete}
        onRecordAnswer={handleRecordAnswer}
      />
    );
  }

  if (pageState === 'results' && sessionResults) {
    return (
      <StudyResults
        sessionStats={sessionResults}
        onStartNewSession={handleStartNewSession}
        onGoBack={handleBackToSetup}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Study Session</h1>
          <p className="text-muted-foreground">Choose your study mode and start learning</p>
        </div>
        {userStats && (
          <div className="text-right">
            <div className="text-sm text-gray-500">This week</div>
            <div className="font-semibold">
              {userStats.totalStudied} questions • {Math.round(userStats.accuracy)}% accuracy
            </div>
          </div>
        )}
      </div>

      {/* Due Count Alert for Spaced Repetition */}
      {studyMode === 'spaced' && dueCount !== undefined && (
        <Card className={`border-l-4 ${dueCount > 0 ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-300'}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-medium">
                {dueCount > 0 ? (
                  `${dueCount} questions are due for review`
                ) : (
                  'No questions due for review right now'
                )}
              </span>
            </div>
            {dueCount === 0 && (
              <p className="text-sm text-gray-600 mt-1 ml-7">
                Great job staying on top of your studies! Try Practice Mode or upload more questions.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`cursor-pointer transition-all ${studyMode === 'spaced' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('spaced')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>Spaced Repetition</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Study questions that are due for review based on your past performance
            </p>
            {dueCount !== undefined && (
              <p className="text-sm font-medium mt-2 text-blue-600">
                {dueCount} questions due
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${studyMode === 'practice' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('practice')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Practice Mode</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Practice with questions from your collection and the community database
            </p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all ${studyMode === 'custom' ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setStudyMode('custom')}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Custom Session</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create a custom study session with specific categories and difficulty
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Study Session Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Questions</label>
              <select 
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={20}>20 questions</option>
                <option value={30}>30 questions</option>
                <option value={50}>50 questions</option>
              </select>
            </div>

            {(studyMode === 'practice' || studyMode === 'custom') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Categories (optional)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableCategories.map((category) => (
                      <label key={category} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={categories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCategories([...categories, category]);
                            } else {
                              setCategories(categories.filter(c => c !== category));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Difficulty (optional)</label>
                  <select 
                    value={difficulty || ''}
                    onChange={(e) => setDifficulty(e.target.value as any || undefined)}
                    className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full md:w-auto"
              onClick={handleStartSession}
              disabled={startSessionMutation.isLoading}
            >
              {startSessionMutation.isLoading ? (
                <LoadingSpinner className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Study Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};