import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Trophy, Users, TrendingUp, Star } from 'lucide-react';

export const CommunityPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Community</h1>
        <p className="text-muted-foreground">See how you're doing compared to other residents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Top Contributors</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                      {rank}
                    </div>
                    <div>
                      <div className="font-medium">@resident{rank}</div>
                      <div className="text-xs text-muted-foreground">PGY-{rank + 1}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{150 - rank * 20} pts</div>
                    <div className="text-xs text-muted-foreground">{25 - rank * 3} questions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Trending Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-3 bg-accent/30 rounded-lg">
                  <div className="text-sm font-medium mb-1">
                    Question about antipsychotics...
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Adult Psychiatry</span>
                    <span>{20 + i * 5} studies today</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Community Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1,247</div>
                <div className="text-sm text-muted-foreground">Active Residents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">3,891</div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">89.3%</div>
                <div className="text-sm text-muted-foreground">Average Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Community Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { user: 'resident123', action: 'added a new question', category: 'Child Psychiatry', time: '2 hours ago' },
              { user: 'pgy4_psych', action: 'achieved 95% accuracy', category: 'Adult Psychiatry', time: '4 hours ago' },
              { user: 'future_shrink', action: 'completed 50 questions', category: 'Mixed Categories', time: '6 hours ago' },
              { user: 'resident456', action: 'earned Top Contributor badge', category: '', time: '1 day ago' },
              { user: 'study_buddy', action: 'added explanation', category: 'Neurology', time: '1 day ago' },
            ].map((activity, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-accent/20 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium">@{activity.user}</span> {activity.action}
                    {activity.category && <span className="text-muted-foreground"> in {activity.category}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};