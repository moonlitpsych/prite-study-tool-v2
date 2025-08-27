import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Target, UserPlus } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data.user, data.token);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Target className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold">PRITE Study</h1>
          </div>
          <p className="text-muted-foreground">
            Collaborative PRITE exam preparation for psychiatry residents
          </p>
        </div>

        {/* Login form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Welcome back! Sign in to continue studying.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />

              {loginMutation.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {loginMutation.error.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={loginMutation.isLoading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-primary hover:text-primary/80 font-medium inline-flex items-center space-x-1"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create account</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Community stats */}
        <Card>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Join the community of residents improving their PRITE scores together
            </p>
            <div className="flex justify-center space-x-6 text-sm">
              <div>
                <div className="font-semibold text-primary">1000+</div>
                <div className="text-muted-foreground">Questions</div>
              </div>
              <div>
                <div className="font-semibold text-primary">500+</div>
                <div className="text-muted-foreground">Residents</div>
              </div>
              <div>
                <div className="font-semibold text-primary">95%</div>
                <div className="text-muted-foreground">Pass Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};