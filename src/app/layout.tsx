import type { Metadata } from 'next';
import { Inter, Outfit, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/layout/navbar';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform',
  description:
    'Enterprise-grade cloud-native SaaS platform designed as the digital command center for the FIFA World Cup 2026. Powered by Zhipu GLM 5.2.',
  keywords: [
    'FIFA World Cup 2026',
    'Smart Stadium',
    'Zhipu GLM 5.2',
    'Prompt Wars',
    'AI Command Center',
    'Crowd Control',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${outfit.variable} ${inter.variable} ${robotoMono.variable} font-sans text-chalk antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen flex flex-col`}
      >
        {/* Skip link for screen readers / keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg trophy-badge focus:shadow-xl focus:font-bold"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <Navbar />
          <main id="main-content" role="main" className="flex-1 flex flex-col w-full relative">
            {/* Subtle pitch line overlay across the entire app */}
            <div className="pointer-events-none absolute inset-0 pitch-lines opacity-30" aria-hidden="true" />
            <div className="relative z-10 w-full">{children}</div>
          </main>
          <footer
            role="contentinfo"
            className="w-full border-t border-emerald-900/40 bg-[#03110a]/95 py-6 text-center text-xs text-emerald-100/60 mt-auto relative overflow-hidden"
          >
            <div className="absolute inset-0 pitch-stripes opacity-20" aria-hidden="true" />
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-2">
                <span className="font-black tracking-widest text-emerald-300 jersey-heading text-sm">FIFA SMART STADIUM COPILOT</span>
                <span aria-hidden="true" className="text-emerald-700">|</span>
                <span className="text-emerald-100/50">Prompt Wars Challenge 4</span>
              </div>
              <div className="flex items-center gap-3 text-emerald-100/50">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
                  Zhipu GLM 5.2
                </span>
                <span aria-hidden="true" className="text-emerald-700">|</span>
                <span>WCAG 2.2 AA</span>
                <span aria-hidden="true" className="text-emerald-700">|</span>
                <span>Real-time SSE</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
