import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from './ui/Button';
import { 
  Home, 
  BookOpen, 
  Users, 
  MessageSquare,
  Upload,
  User, 
  LogOut,
  Trophy,
  Target
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Study', href: '/study', icon: BookOpen },
    { name: 'Questions', href: '/questions', icon: MessageSquare },
    { name: 'Upload', href: '/upload', icon: Upload },
    { name: 'Community', href: '/community', icon: Users },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">PRITE Study</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* User info */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium">{user?.contributionScore || 0}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Welcome,</span>
                <span className="ml-1 font-medium">{user?.name}</span>
              </div>
            </div>

            {/* Profile dropdown trigger */}
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile navigation */}
      <nav className="md:hidden sticky top-16 z-30 border-b bg-background">
        <div className="container">
          <div className="flex space-x-1 p-2 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive(item.href)
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-8 mt-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                PRITE Study Tool v2 - Collaborative exam preparation
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Built for psychiatry residents, by the community
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};