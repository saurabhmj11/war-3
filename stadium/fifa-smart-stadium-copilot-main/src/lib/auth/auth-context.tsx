'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/domain/types';
import { SEED_DATA } from '@/lib/db/seed-data';
import { repository } from '@/lib/db/repository';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  switchRole: (newRole: UserRole) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('FAN');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    // In Demo Mode or local evaluation, load initial role from localStorage or default to FAN
    const savedRole = (typeof window !== 'undefined' ? localStorage.getItem('fifa_demo_role') : null) as UserRole | null;
    const initialRole: UserRole = savedRole && ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'].includes(savedRole)
      ? savedRole
      : 'FAN';

    loadUserForRole(initialRole);
  }, []);

  const loadUserForRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      // Find matching seed user profile for this role
      const users = await repository.getAllUsers();
      const match = users.find((u) => u.role === targetRole) || SEED_DATA.users[0];
      setUser(match);
      setRole(match.role);
    } catch (err) {
      console.error('Failed to load user profile for role:', targetRole, err);
      setUser(SEED_DATA.users[0]);
      setRole('FAN');
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fifa_demo_role', newRole);
    }
    loadUserForRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isDemoMode,
        switchRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
