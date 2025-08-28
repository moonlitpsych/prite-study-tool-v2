import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { trpc } from './lib/trpc';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudyPage } from './pages/StudyPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { CommunityPage } from './pages/CommunityPage';
import { ProfilePage } from './pages/ProfilePage';
import { UploadPage } from './pages/UploadPage';

// Components
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { isAuthenticated, user, login, logout } = useAuthStore();
  
  // Verify authentication on app load
  const { data: currentUser, error } = trpc.auth.me.useQuery(
    undefined,
    { 
      enabled: !!localStorage.getItem('token') && !user,
      retry: false,
    }
  );

  useEffect(() => {
    if (currentUser && !user) {
      const token = localStorage.getItem('token');
      if (token) {
        login(currentUser, token);
      }
    }
    
    if (error && error.data?.code === 'UNAUTHORIZED') {
      logout();
    }
  }, [currentUser, error, user, login, logout]);

  // Show loading while verifying auth
  if (localStorage.getItem('token') && !user && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/questions" element={<QuestionsPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;