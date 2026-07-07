'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/auth/role-switcher';
import {
  Trophy,
  Globe,
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
  { href: '/fan', label: 'Fan Copilot', icon: Compass, role: 'FAN' as const },
  { href: '/volunteer', label: 'Volunteer', icon: Sparkles, role: 'VOLUNTEER' as const },
  { href: '/operations', label: 'Operations', icon: LayoutDashboard, role: 'OPERATIONS' as const },
  { href: '/security', label: 'Security', icon: Shield, role: 'SECURITY' as const },
  { href: '/medical', label: 'Medical', icon: HeartPulse, role: 'MEDICAL' as const },
  { href: '/admin', label: 'Admin', icon: Lock, role: 'ADMIN' as const },
];

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
    <header role="banner" className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              aria-label="FIFA Smart Stadium Copilot home"
              className="flex items-center gap-2.5 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all" aria-hidden="true">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <span className="text-sm font-black tracking-wider text-white flex items-center gap-1.5 uppercase font-mono">
                  FIFA <span className="text-emerald-400">COPILOT</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium block -mt-0.5 tracking-tight">
                  World Cup 2026 • AI Command
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav role="navigation" aria-label="Dashboards" className="hidden md:flex items-center gap-1">
              {DASHBOARD_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
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
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
          className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2"
        >
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Stadium Command Dashboards
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DASHBOARD_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300 border border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
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
