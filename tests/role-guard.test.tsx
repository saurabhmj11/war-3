// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the auth context before importing RoleGuard.
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}));
import { useAuth } from '@/lib/auth/auth-context';
import { RoleGuard } from '@/components/auth/role-guard';

describe('RoleGuard', () => {
  it('shows loading spinner while isLoading is true', () => {
    vi.mocked(useAuth).mockReturnValue({
      role: 'FAN',
      switchRole: vi.fn(),
      isLoading: true,
      // Fill in the rest so TS is happy
      user: null,
      isAuthenticated: false,
      isDemoMode: true,
      isGeminiLive: false,
      roleToken: null,
    });
    render(
      <RoleGuard allowedRoles={['OPERATIONS']}>
        <div>protected content</div>
      </RoleGuard>
    );
    expect(screen.getByText(/Verifying role permissions/i)).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('renders children when role is in allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      role: 'OPERATIONS',
      switchRole: vi.fn(),
      isLoading: false,
      user: null,
      isAuthenticated: true,
      isDemoMode: true,
      isGeminiLive: false,
      roleToken: 'tok',
    });
    render(
      <RoleGuard allowedRoles={['OPERATIONS', 'ADMIN']}>
        <div>protected content</div>
      </RoleGuard>
    );
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });

  it('renders the restricted screen when role is not allowed', () => {
    vi.mocked(useAuth).mockReturnValue({
      role: 'FAN',
      switchRole: vi.fn(),
      isLoading: false,
      user: null,
      isAuthenticated: true,
      isDemoMode: true,
      isGeminiLive: false,
      roleToken: 'tok',
    });
    render(
      <RoleGuard allowedRoles={['OPERATIONS']}>
        <div>protected content</div>
      </RoleGuard>
    );
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.getByText(/Restricted Command Center/i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('lets ADMIN through even when not in allowedRoles', () => {
    vi.mocked(useAuth).mockReturnValue({
      role: 'ADMIN',
      switchRole: vi.fn(),
      isLoading: false,
      user: null,
      isAuthenticated: true,
      isDemoMode: true,
      isGeminiLive: false,
      roleToken: 'tok',
    });
    render(
      <RoleGuard allowedRoles={['SECURITY']}>
        <div>admin sees all</div>
      </RoleGuard>
    );
    expect(screen.getByText('admin sees all')).toBeInTheDocument();
  });
});
