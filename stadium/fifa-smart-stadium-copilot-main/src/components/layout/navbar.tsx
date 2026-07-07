'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/auth/role-switcher';
import { LanguageCode } from '@/domain/types';
import {
  Trophy,
  Globe,
  LayoutDashboard,
  Users,
  Shield,
  HeartPulse,
  Lock,
  Sparkles,
  Menu,
  X,
  Compass,
} from 'lucide-react';

const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

const DASHBOARD_LINKS = [
  { href: '/fan', label: 'Fan Copilot', icon: <Compass className="w-4 h-4" />, role: 'FAN' },
  { href: '/volunteer', label: 'Volunteer', icon: <Sparkles className="w-4 h-4" />, role: 'VOLUNTEER' },
  { href: '/operations', label: 'Operations', icon: <LayoutDashboard className="w-4 h-4" />, role: 'OPERATIONS' },
  { href: '/security', label: 'Security', icon: <Shield className="w-4 h-4" />, role: 'SECURITY' },
  { href: '/medical', label: 'Medical', icon: <HeartPulse className="w-4 h-4" />, role: 'MEDICAL' },
  { href: '/admin', label: 'Admin', icon: <Lock className="w-4 h-4" />, role: 'ADMIN' },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
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
            <nav className="hidden md:flex items-center gap-1">
              {DASHBOARD_LINKS.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Language Selector & Role Switcher */}
          <div className="flex items-center gap-3">
            
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
                title="Change active language (8 World Cup languages supported)"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="uppercase font-mono">{activeLang}</span>
              </button>

              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 py-1.5 overflow-hidden">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select AI Language
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setActiveLang(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-all ${
                          activeLang === lang.code ? 'text-emerald-400 font-bold bg-slate-800/50' : 'text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Role Switcher Widget */}
            <RoleSwitcher />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
            Stadium Command Dashboards
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DASHBOARD_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-900/60 text-slate-300 border border-slate-800'
                  }`}
                >
                  {link.icon}
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
