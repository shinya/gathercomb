import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Login, CreateUser } from '@gathercomb/shared';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  login: (credentials: Login) => Promise<void>;
  signup: (userData: CreateUser) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // User is not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: Login) => {
    try {
      const userData = await authService.login(credentials);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData: CreateUser) => {
    try {
      const newUser = await authService.signup(userData);
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
