'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/domain/types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  /** True when the active AI engine is real Vertex AI Gemini (vs simulated fallback). */
  isGeminiLive: boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
  isLoading: boolean;
  /** Verifiable token to send as `x-fifa-role` header on mutating API calls. */
  roleToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fifa_session_token';
const ROLE_KEY = 'fifa_demo_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('FAN');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roleToken, setRoleToken] = useState<string | null>(null);
  const [isGeminiLive, setIsGeminiLive] = useState<boolean>(false);

  const loadUserForRole = useCallback(async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/switch?role=${targetRole}`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data.user);
        setRole(json.data.user.role);
        setRoleToken(json.data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, json.data.token);
          localStorage.setItem(ROLE_KEY, json.data.user.role);
        }
      } else {
        setUser(null);
        setRole('FAN');
        setRoleToken(null);
      }
      if (json.isGeminiLive !== undefined) setIsGeminiLive(json.isGeminiLive);
    } catch (err) {
      console.error('[AuthProvider] Failed to load user profile for role:', targetRole, err);
      setUser(null);
      setRole('FAN');
      setRoleToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedRole = localStorage.getItem(ROLE_KEY) as UserRole | null;
    const initialRole: UserRole =
      savedRole && ['FAN', 'VOLUNTEER', 'OPERATIONS', 'SECURITY', 'MEDICAL', 'ADMIN'].includes(savedRole)
        ? savedRole
        : 'FAN';
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserForRole(initialRole);
  }, [loadUserForRole]);

  const switchRole = useCallback(
    async (newRole: UserRole) => {
      await loadUserForRole(newRole);
    },
    [loadUserForRole]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isDemoMode: true,
        isGeminiLive,
        switchRole,
        isLoading,
        roleToken,
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
