import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { User, Settings, Trophy, TrendingUp } from 'lucide-react';

export const ProfilePage = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your progress</p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <div className="font-medium">{user?.name}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Username</label>
                  <div className="font-medium">@{user?.username}</div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="font-medium">{user?.email}</div>
                </div>
                {user?.pgyLevel && (
                  <div>
                    <label className="text-sm text-muted-foreground">PGY Level</label>
                    <div className="font-medium">PGY-{user.pgyLevel}</div>
                  </div>
                )}
                {user?.institution && (
                  <div>
                    <label className="text-sm text-muted-foreground">Institution</label>
                    <div className="font-medium">{user.institution}</div>
                  </div>
                )}
                {user?.specialty && (
                  <div>
                    <label className="text-sm text-muted-foreground">Specialty</label>
                    <div className="font-medium">{user.specialty}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{user?.contributionScore || 0}</div>
                  <div className="text-sm text-muted-foreground">Contribution Score</div>
                </div>
                <div className="text-center p-4 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{user?.reputation || 0}</div>
                  <div className="text-sm text-muted-foreground">Reputation</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>PRITE Scores</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No PRITE scores recorded yet</p>
                <Button className="mt-4">Add PRITE Score</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};