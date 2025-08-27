import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '@/lib/trpc';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Target, LogIn } from 'lucide-react';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    pgyLevel: '',
    institution: '',
    specialty: '',
  });
  
  const { login } = useAuthStore();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      login(data.user, data.token);
    },
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    registerMutation.mutate({
      email: formData.email,
      username: formData.username,
      name: formData.name,
      password: formData.password,
      pgyLevel: formData.pgyLevel ? parseInt(formData.pgyLevel) : undefined,
      institution: formData.institution || undefined,
      specialty: formData.specialty || undefined,
    });
  };

  const passwordMismatch = formData.password !== formData.confirmPassword && formData.confirmPassword !== '';

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
            Join the collaborative study community
          </p>
        </div>

        {/* Registration form */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Join hundreds of residents improving their PRITE scores together
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Full name"
                  required
                />

                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="username"
                  required
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="your@email.com"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Password"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  error={passwordMismatch ? 'Passwords do not match' : undefined}
                  required
                />
              </div>

              {/* Optional profile info */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Profile Information (Optional)</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">PGY Level</label>
                    <select
                      value={formData.pgyLevel}
                      onChange={(e) => handleChange('pgyLevel', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Select PGY</option>
                      <option value="1">PGY-1</option>
                      <option value="2">PGY-2</option>
                      <option value="3">PGY-3</option>
                      <option value="4">PGY-4</option>
                    </select>
                  </div>

                  <Input
                    label="Specialty"
                    value={formData.specialty}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    placeholder="e.g., Psychiatry"
                  />
                </div>

                <Input
                  label="Institution"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  placeholder="Your residency program"
                  className="mt-4"
                />
              </div>

              {registerMutation.error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {registerMutation.error.message}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                isLoading={registerMutation.isLoading}
                disabled={passwordMismatch}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 font-medium inline-flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};