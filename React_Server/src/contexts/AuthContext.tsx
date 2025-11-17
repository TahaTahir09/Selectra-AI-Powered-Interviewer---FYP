import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isOrganization: boolean;
  isCandidate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          // Optionally refresh user data from server
          const profileData = await authAPI.getProfile();
          setUser(profileData.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          authAPI.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      await authAPI.login({ username, password });
      
      // Fetch user profile after login
      const profileData = await authAPI.getProfile();
      setUser(profileData.user);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${profileData.user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.detail || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setLoading(true);
      await authAPI.register(data);

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. Please login to continue.',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.email?.[0] 
        || error.response?.data?.username?.[0]
        || error.response?.data?.password?.[0]
        || 'Registration failed. Please try again.';

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isOrganization: user?.user_type === 'organization',
    isCandidate: user?.user_type === 'candidate',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
