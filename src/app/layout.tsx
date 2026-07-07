import type { Metadata } from 'next';
import { Inter, Outfit, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/layout/navbar';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
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
});

export const metadata: Metadata = {
  title: 'FIFA Smart Stadium Copilot – AI-Powered Stadium Operations Platform',
  description:
    'Enterprise-grade cloud-native SaaS platform designed as the digital command center for the FIFA World Cup 2026. Powered by Google Gemini.',
  keywords: [
    'FIFA World Cup 2026',
    'Smart Stadium',
    'Google Gemini',
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
    <html lang="en" className="dark scroll-smooth">
      <body
        className={`${outfit.variable} ${inter.variable} ${robotoMono.variable} font-sans bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 min-h-screen flex flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-600 focus:text-white focus:shadow-xl"
        >
          Skip to main content
        </a>
        <AuthProvider>
          <Navbar />
          <main id="main-content" role="main" className="flex-1 flex flex-col w-full">
            {children}
          </main>
          <footer
            role="contentinfo"
            className="w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500 mt-auto"
          >
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">FIFA SMART STADIUM COPILOT</span>
                <span aria-hidden="true">•</span>
                <span>Prompt Wars Challenge 4</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Google Gemini 2.5</span>
                <span aria-hidden="true">•</span>
                <span>WCAG 2.2 AA</span>
                <span aria-hidden="true">•</span>
                <span>Real-time SSE</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
