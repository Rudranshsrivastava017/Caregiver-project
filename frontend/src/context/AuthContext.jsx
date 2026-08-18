import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import axiosClient, { setMemoryToken } from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const response = await axiosClient.post('/auth/refresh');
        if (response.data?.status === 'success' && isMounted) {
          const newAccessToken = response.data.accessToken;
          const userData = response.data.user;

          setToken(newAccessToken);
          setUser(userData);
          setMemoryToken(newAccessToken);
        }
      } catch (error) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setMemoryToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password, roleHint = 'user') => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/login', {
        email,
        password,
        roleHint,
      });

      const { user: authenticatedUser, accessToken } = response.data;

      setToken(accessToken);
      setUser(authenticatedUser);
      setMemoryToken(accessToken);

      toast.success(`Welcome back, ${authenticatedUser.fullName}!`);
      return authenticatedUser;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Authentication failed. Please check your credentials.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Real API Register handler
  const register = async (formData) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/register', formData);

      const { user: newUser, accessToken } = response.data;

      setToken(accessToken);
      setUser(newUser);
      setMemoryToken(accessToken);

      if (newUser.role === 'caregiver') {
        toast.info('Account created! Caregiver legal ID is under admin review.');
      } else {
        toast.success('Registration successful! Welcome to CareElderly.');
      }

      return newUser;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login handler
  const googleLogin = async (googleCredential) => {
    setIsLoading(true);
    try {
      const response = await axiosClient.post('/auth/google', {
        idToken: googleCredential,
      });

      const { user: authenticatedUser, accessToken } = response.data;

      setToken(accessToken);
      setUser(authenticatedUser);
      setMemoryToken(accessToken);

      toast.success(`Signed in with Google! Welcome, ${authenticatedUser.fullName}.`);
      return authenticatedUser;
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Google Sign-In failed. Please try again.';
      toast.error(errorMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Real Logout handler
  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout endpoint warning:', error.message);
    } finally {
      setToken(null);
      setUser(null);
      setMemoryToken(null);
      toast.info('Logged out successfully.');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
