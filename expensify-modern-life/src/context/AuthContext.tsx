import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/middleware/authenticate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // Authentication failed but don't redirect automatically
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Handle different error codes differently
        if (response.status === 401) {
          // Token expired or invalid - clear auth state but don't redirect on refresh
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Server error - don't clear auth state, might be temporary
          console.error('Auth check server error:', response.status);
        }
      }
    } catch (error) {
      // Network error - don't clear auth state, might be temporary
      console.error('Auth check network error:', error);
      // Only show error if we don't have a user already
      if (!user) {
        console.log('Network error during auth check, maintaining current state');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.name}!`,
        });
        
        return true;
      } else {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out",
        });
      } else {
        toast({
          title: "Logout failed",
          description: "There was an error logging out. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always clear auth state and redirect, even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      navigate("/");
    }
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};