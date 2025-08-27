import { Link } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  BookOpen, 
  Target, 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  CheckCircle,
  Clock,
  Zap,
  Star
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { data: dashboardData, isLoading } = trpc.user.getDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Ready to ace your PRITE? Let's keep that study streak going!
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{dashboardData?.studyStreak || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="outline">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.dueQuestionsCount || 0}</div>
                <div className="text-sm text-muted-foreground">Questions Due</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.recentAccuracy?.toFixed(0) || 0}%</div>
                <div className="text-sm text-muted-foreground">Recent Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.contributionStats?.contributionScore || 0}</div>
                <div className="text-sm text-muted-foreground">Contribution Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{dashboardData?.totalStudiedThisWeek || 0}</div>
                <div className="text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Study actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick study */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Quick Study</span>
              </CardTitle>
              <CardDescription>
                Jump right into your personalized study session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                  <div>
                    <div className="font-medium">Due Questions</div>
                    <div className="text-sm text-muted-foreground">
                      {dashboardData?.dueQuestionsCount} questions waiting for review
                    </div>
                  </div>
                  <Link to="/study">
                    <Button size="lg">
                      <Clock className="h-4 w-4 mr-2" />
                      Start Studying
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Link to="/study?mode=practice">
                    <Button variant="outline" className="w-full">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Practice Mode
                    </Button>
                  </Link>
                  <Link to="/questions/create">
                    <Button variant="outline" className="w-full">
                      <Target className="h-4 w-4 mr-2" />
                      Add Questions
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Study Sessions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentSessions?.length ? (
                <div className="space-y-3">
                  {dashboardData.recentSessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {session.totalQuestions} questions
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString()} • {session.accuracy.toFixed(0)}% accuracy
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-primary">
                          {Math.floor((session.totalTimeSpent || 0) / 60000)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent study sessions</p>
                  <p className="text-sm">Start your first session to see your progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Community and progress */}
        <div className="space-y-6">
          {/* PRITE scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>PRITE Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData?.priteScores?.length ? (
                <div className="space-y-3">
                  {dashboardData.priteScores.map((score) => (
                    <div key={score.id} className="p-3 bg-accent/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{score.totalScore}/300</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(score.examDate).toLocaleDateString()}
                          </div>
                        </div>
                        {score.percentile && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-primary">
                              {score.percentile}th percentile
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Scores
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Track your PRITE scores to see your progress
                  </p>
                  <Link to="/profile">
                    <Button size="sm">Add PRITE Score</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Community Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Public Questions</span>
                  <span className="font-medium">{dashboardData?.contributionStats?.publicQuestions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Reputation</span>
                  <span className="font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {dashboardData?.contributionStats?.reputation || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Studied</span>
                  <span className="font-medium">{dashboardData?.contributionStats?.totalStudied || 0}</span>
                </div>
                
                <Link to="/community">
                  <Button variant="outline" size="sm" className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    View Community
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};