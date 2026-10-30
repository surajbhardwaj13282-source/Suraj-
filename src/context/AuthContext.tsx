/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types.js';
import { api, setStoredToken, getStoredToken } from '../services/api.js';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (identifier: string, password?: string) => Promise<void>;
  register: (payload: { username: string; fullName: string; email?: string; phone?: string; avatarUrl?: string; bio?: string }) => Promise<void>;
  loginGoogle: (payload: { email?: string; name?: string; picture?: string }) => Promise<void>;
  logout: () => void;
  switchUser: (user: User) => void;
  updateCurrentUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    setIsLoading(true);
    const token = getStoredToken();
    if (token) {
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
      } catch (err) {
        console.warn('Failed to load user with token, defaulting to Elena:', err);
        // Default to Elena Rostova so user has an immediate, seamless rich experience
        await autoLoginDefault();
      }
    } else {
      await autoLoginDefault();
    }
    setIsLoading(false);
  };

  const autoLoginDefault = async () => {
    try {
      const res = await api.login('elena_captures');
      setStoredToken(res.token);
      setCurrentUser(res.user);
    } catch {
      // Fallback
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (identifier: string, password?: string) => {
    const res = await api.login(identifier, password);
    setStoredToken(res.token);
    setCurrentUser(res.user);
  };

  const register = async (payload: { username: string; fullName: string; email?: string; phone?: string; avatarUrl?: string; bio?: string }) => {
    const res = await api.register(payload);
    setStoredToken(res.token);
    setCurrentUser(res.user);
  };

  const loginGoogle = async (payload: { email?: string; name?: string; picture?: string }) => {
    const res = await api.loginGoogle(payload);
    setStoredToken(res.token);
    setCurrentUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    setStoredToken(user.id);
    setCurrentUser(user);
  };

  const updateCurrentUser = async (data: Partial<User>) => {
    if (!currentUser) return;
    const res = await api.updateProfile(currentUser.id, data);
    setCurrentUser(res.user);
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const res = await api.getMe();
      setCurrentUser(res.user);
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        loginGoogle,
        logout,
        switchUser,
        updateCurrentUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
