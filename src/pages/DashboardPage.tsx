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
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Ready to ace your PRITE? Let's keep that study streak going!
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
            <div className="text-center sm:text-right">
              <div className="text-2xl font-bold text-primary">{dashboardData?.studyStreak || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card variant="outline">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData?.dueQuestionsCount || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Questions Due</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData?.recentAccuracy?.toFixed(0) || 0}%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Recent Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData?.contributionStats?.contributionScore || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Contribution Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="outline">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData?.totalStudiedThisWeek || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column - Study actions */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Quick study */}
          <Card variant="elevated">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Target className="h-5 w-5" />
                <span>Quick Study</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Jump right into your personalized study session
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-accent/50 rounded-lg space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="font-medium text-base sm:text-lg">Due Questions</div>
                    <div className="text-sm text-muted-foreground">
                      {dashboardData?.dueQuestionsCount} questions waiting for review
                    </div>
                  </div>
                  <Link to="/study" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      <Clock className="h-4 w-4 mr-2" />
                      Start Studying
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Link to="/study?mode=practice" className="w-full">
                    <Button variant="outline" className="w-full h-12 sm:h-10">
                      <BookOpen className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Practice Mode</span>
                    </Button>
                  </Link>
                  <Link to="/questions/create" className="w-full">
                    <Button variant="outline" className="w-full h-12 sm:h-10">
                      <Target className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Add Questions</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
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
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-accent/30 rounded-lg space-y-2 sm:space-y-0"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm sm:text-base">
                          {session.totalQuestions} questions
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(session.startedAt).toLocaleDateString()} • {session.accuracy.toFixed(0)}% accuracy
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-sm font-medium text-primary">
                          {Math.floor((session.totalTimeSpent || 0) / 60000)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No recent study sessions</p>
                  <p className="text-xs sm:text-sm">Start your first session to see your progress here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Community and progress */}
        <div className="space-y-4 sm:space-y-6">
          {/* PRITE scores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
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
                          <div className="font-medium text-sm sm:text-base">{score.totalScore}/300</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {new Date(score.examDate).toLocaleDateString()}
                          </div>
                        </div>
                        {score.percentile && (
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-medium text-primary">
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
                <div className="text-center py-4 sm:py-6">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Track your PRITE scores to see your progress
                  </p>
                  <Link to="/profile">
                    <Button size="sm" className="w-full sm:w-auto">Add PRITE Score</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Community contribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                <span>Community Impact</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Public Questions</span>
                  <span className="font-medium text-sm sm:text-base">{dashboardData?.contributionStats?.publicQuestions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Reputation</span>
                  <span className="font-medium flex items-center text-sm sm:text-base">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-500" />
                    {dashboardData?.contributionStats?.reputation || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">Total Studied</span>
                  <span className="font-medium text-sm sm:text-base">{dashboardData?.contributionStats?.totalStudied || 0}</span>
                </div>
                
                <Link to="/community" className="block">
                  <Button variant="outline" size="sm" className="w-full h-10">
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