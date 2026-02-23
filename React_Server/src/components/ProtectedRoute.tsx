import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'organization' | 'candidate';
  requireAuth?: boolean;
}

/**
 * Protected Route component that handles authentication and authorization
 * - Redirects unauthenticated users to login
 * - Redirects users to their correct dashboard if they try to access wrong user type's pages
 */
const ProtectedRoute = ({ 
  children, 
  allowedUserType, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, loading, isAuthenticated, isOrganization, isCandidate } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to appropriate login page based on the route they tried to access
    const isOrgRoute = location.pathname.startsWith('/org');
    const loginPath = isOrgRoute ? '/org/login' : '/candidate/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If a specific user type is required, check authorization
  if (allowedUserType && isAuthenticated) {
    if (allowedUserType === 'organization' && !isOrganization) {
      // Candidate trying to access org routes - redirect to candidate dashboard
      console.warn('Unauthorized: Candidate tried to access organization route');
      return <Navigate to="/candidate/dashboard" replace />;
    }
    
    if (allowedUserType === 'candidate' && !isCandidate) {
      // Organization trying to access candidate routes - redirect to org dashboard
      console.warn('Unauthorized: Organization tried to access candidate route');
      return <Navigate to="/org/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
