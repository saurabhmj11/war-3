'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/auth/role-switcher';
import {
  Trophy,
  LayoutDashboard,
  Shield,
  HeartPulse,
  Lock,
  Sparkles,
  Menu,
  X,
  Compass,
} from 'lucide-react';

const DASHBOARD_LINKS = [
  { href: '/fan', label: 'Fan', icon: Compass, role: 'FAN' as const, kit: 'emerald' as const },
  { href: '/volunteer', label: 'Volunteer', icon: Sparkles, role: 'VOLUNTEER' as const, kit: 'sky' as const },
  { href: '/operations', label: 'Operations', icon: LayoutDashboard, role: 'OPERATIONS' as const, kit: 'amber' as const },
  { href: '/security', label: 'Security', icon: Shield, role: 'SECURITY' as const, kit: 'red' as const },
  { href: '/medical', label: 'Medical', icon: HeartPulse, role: 'MEDICAL' as const, kit: 'purple' as const },
  { href: '/admin', label: 'Admin', icon: Lock, role: 'ADMIN' as const, kit: 'cyan' as const },
];

const KIT_STYLES: Record<string, { active: string; idle: string; icon: string }> = {
  emerald: {
    active: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    idle: 'text-emerald-100/60 hover:text-emerald-200 hover:bg-emerald-500/10',
    icon: 'text-emerald-300',
  },
  sky: {
    active: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    idle: 'text-sky-100/60 hover:text-sky-200 hover:bg-sky-500/10',
    icon: 'text-sky-300',
  },
  amber: {
    active: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    idle: 'text-amber-100/60 hover:text-amber-200 hover:bg-amber-500/10',
    icon: 'text-amber-300',
  },
  red: {
    active: 'bg-red-500/20 text-red-200 border-red-400/40',
    idle: 'text-red-100/60 hover:text-red-200 hover:bg-red-500/10',
    icon: 'text-red-300',
  },
  purple: {
    active: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    idle: 'text-purple-100/60 hover:text-purple-200 hover:bg-purple-500/10',
    icon: 'text-purple-300',
  },
  cyan: {
    active: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
    idle: 'text-cyan-100/60 hover:text-cyan-200 hover:bg-cyan-500/10',
    icon: 'text-cyan-300',
  },
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Close mobile menu on route change (without setState-in-effect).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }

  // Close mobile menu on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full bg-[#03110a]/85 backdrop-blur-xl border-b border-emerald-900/50 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)] relative"
    >
      {/* Floodlight bloom from above the navbar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand — scoreboard style */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="FIFA Smart Stadium Copilot home"
              className="flex items-center gap-2.5 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
            >
              <div className="relative w-10 h-10 rounded-lg trophy-badge flex items-center justify-center shadow-lg group-hover:scale-105 transition-all" aria-hidden="true">
                <Trophy className="w-5 h-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
              </div>
              <div>
                <span className="text-sm font-black tracking-wider text-white flex items-center gap-1.5 uppercase jersey-heading">
                  FIFA <span className="trophy-text">COPILOT</span>
                </span>
                <span className="text-[10px] text-emerald-200/60 font-medium block -mt-0.5 tracking-tight font-mono">
                  WC 2026 • AI COMMAND
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links — kit-colored pills */}
            <nav role="navigation" aria-label="Dashboards" className="hidden md:flex items-center gap-1">
              {DASHBOARD_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                const kit = KIT_STYLES[link.kit];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 border ${
                      isActive ? kit.active : `border-transparent ${kit.idle}`
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? kit.icon : ''}`} aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <RoleSwitcher />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-200 hover:text-white hover:bg-emerald-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          role="navigation"
          aria-label="Mobile dashboards"
          ref={mobileMenuRef}
          className="md:hidden border-t border-emerald-900/50 bg-[#03110a]/95 backdrop-blur-2xl px-4 py-4 space-y-2"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-emerald-300/70 px-2 mb-1 jersey-heading">
            Stadium Dashboards
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DASHBOARD_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              const kit = KIT_STYLES[link.kit];
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 border ${
                    isActive ? kit.active : `bg-emerald-950/40 ${kit.idle} border-emerald-900/50`
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? kit.icon : ''}`} aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
