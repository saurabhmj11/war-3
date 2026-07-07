import { UserRole } from '@/domain/types';

/**
 * Single source of truth for "kit" color tokens — the referee-card / jersey
 * color associated with each role. Used by the navbar, role switcher, page
 * headers, and home-page role cards so the palette stays consistent across
 * every surface without duplication.
 */
export type KitColor = 'emerald' | 'sky' | 'amber' | 'red' | 'purple' | 'cyan';

export interface KitTokens {
  /** Solid stripe color (jersey side panel). */
  stripe: string;
  /** Background tint for active/idle states. */
  bg: string;
  /** Foreground text color. */
  text: string;
  /** Border color. */
  border: string;
  /** Human-readable kit name (e.g. "EMERALD"). */
  label: string;
}

export const KIT: Record<UserRole, KitTokens> = {
  FAN: { stripe: 'bg-emerald-400', bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/40', label: 'EMERALD' },
  VOLUNTEER: { stripe: 'bg-sky-400', bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/40', label: 'SKY' },
  OPERATIONS: { stripe: 'bg-amber-400', bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/40', label: 'AMBER' },
  SECURITY: { stripe: 'bg-red-400', bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/40', label: 'RED' },
  MEDICAL: { stripe: 'bg-purple-400', bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/40', label: 'PURPLE' },
  ADMIN: { stripe: 'bg-cyan-400', bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/40', label: 'CYAN' },
};

/** Map a role to its kit color key. */
export const ROLE_KIT: Record<UserRole, KitColor> = {
  FAN: 'emerald',
  VOLUNTEER: 'sky',
  OPERATIONS: 'amber',
  SECURITY: 'red',
  MEDICAL: 'purple',
  ADMIN: 'cyan',
};

/** Navbar pill styles keyed by kit color. */
export const KIT_NAV: Record<KitColor, { active: string; idle: string; icon: string }> = {
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

/** Home-page role card gradient backgrounds keyed by kit color. */
export const KIT_CARD_BG: Record<KitColor, string> = {
  emerald: 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/40',
  sky: 'from-sky-500/20 to-sky-900/10 border-sky-500/40',
  amber: 'from-amber-500/20 to-amber-900/10 border-amber-500/40',
  red: 'from-red-500/20 to-red-900/10 border-red-500/40',
  purple: 'from-purple-500/20 to-purple-900/10 border-purple-500/40',
  cyan: 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/40',
};
