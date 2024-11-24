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

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      setUser(null);
      toast.info('You have been logged out successfully.');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
      return false;
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: ['MANAGER', 'ADMIN'].includes(user?.role),
  };

  return (
    <AuthContext.Provider value={value}>
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

export default useAuth;
