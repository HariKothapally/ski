import { useState, useCallback, createContext, useContext } from 'react';
import { toast } from 'react-toastify';
import { createApiService } from '../utils/api';

const AuthContext = createContext(null);

const authApi = createApiService('auth');

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('Error parsing user info:', error);
      localStorage.removeItem('userInfo');
      return null;
    }
  });

  const login = useCallback(async (credentials) => {
    if (!credentials?.login || !credentials?.password) {
      throw new Error('Username and password are required');
    }

    setLoading(true);
    try {
      const response = await authApi.create('/login', credentials);
      
      if (!response?.data) {
        throw new Error('Invalid response from server');
      }

      const { token, ...userInfo } = response.data;
      
      if (!token) {
        throw new Error('No authentication token received');
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      setUser(userInfo);
      toast.success(`Welcome back, ${userInfo.firstName}!`);
      
      return userInfo;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    if (!userData?.username || !userData?.password || !userData?.email) {
      throw new Error('Username, password, and email are required');
    }

    setLoading(true);
    try {
      const response = await authApi.create('/register', userData);
      
      if (!response?.data) {
        throw new Error('Invalid response from server');
      }

      const { token, ...userInfo } = response.data;
      
      if (!token) {
        throw new Error('No authentication token received');
      }

      localStorage.setItem('authToken', token);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      
      setUser(userInfo);
      toast.success(`Welcome, ${userInfo.firstName}! Your account has been created.`);
      
      return userInfo;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }

    setLoading(true);
    try {
      await authApi.create('/forgot-password', { email });
      toast.success('Password reset instructions have been sent to your email.');
      return true;
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset instructions. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      setUser(null);
      toast.info('You have been logged out successfully.');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider 
      value={{
        user,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER' || user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
