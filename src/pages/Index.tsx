import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { Navigate } from 'react-router-dom';

const Index = () => {
  const { isAuthenticated, isLoading } = useEnhancedAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to dashboard if authenticated, otherwise show login
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default Index;