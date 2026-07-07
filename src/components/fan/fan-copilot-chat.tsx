'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AIChatTurn, LanguageCode, FanCopilotResponseDTO } from '@/domain/types';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/auth-context';
import { Send, Bot, User, Sparkles, Compass, ArrowRight, AlertCircle } from 'lucide-react';

interface FanCopilotChatProps {
  onNavigateRequest?: (targetId: string) => void;
  defaultLang?: LanguageCode;
}

export const FanCopilotChat: React.FC<FanCopilotChatProps> = ({ onNavigateRequest, defaultLang = 'en' }) => {
  const { isGeminiLive } = useAuth();
  const [messages, setMessages] = useState<AIChatTurn[]>([
    {
      role: 'model',
      content:
        "Hello! I'm your official FIFA Smart Stadium Copilot. How can I help you navigate MetLife Stadium today? Ask me about gate wait times, vegetarian food stalls, or step-free accessible routes — in any of 8 World Cup languages.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<FanCopilotResponseDTO['suggestedAction'] | null>(null);
  const [lastEngine, setLastEngine] = useState<'gemini' | 'simulated' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const QUICK_CHIPS = [
    { label: '🏃 Fastest Gate Sec 112', query: 'Which gate is fastest to enter for Sector 112 right now?' },
    { label: '🌮 Vegetarian Tacos', query: 'Where can I get vegetarian or vegan tacos near Sector 112?' },
    { label: '♿ Step-Free Elevator', query: 'Show me the step-free accessible elevator route to my seat.' },
    { label: '🇪🇸 ¿Puerta C?', query: '¿Cuánto tiempo de espera hay en la Puerta C?' },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    const userTurn: AIChatTurn = { role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userTurn]);
    setInputMsg('');
    setIsLoading(true);
    setLastAction(null);
    setError(null);

    try {
      const aiData = await api.chat({
        copilotType: 'FAN',
        message: textToSend,
        stadiumId: 'metlife-ny-nj',
        language: defaultLang,
        history: messages,
      });
      setLastEngine(aiData.engine);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: aiData.responseText, timestamp: new Date().toISOString() },
      ]);
      if (aiData.suggestedAction) setLastAction(aiData.suggestedAction);
    } catch (err) {
      const e = err as Error & { status?: number };
      setError(e.status === 403 ? 'Your role is not permitted to use this copilot.' : e.message || 'Error communicating with AI server.');
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'I apologize, but I encountered a network delay. Please try again or check the stadium map.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full card-floodlit rounded-xl p-5 shadow-2xl flex flex-col h-[600px] relative overflow-hidden">
      <div className="absolute inset-0 pitch-stripes opacity-10" aria-hidden="true" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3 mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md trophy-badge flex items-center justify-center shadow-lg" aria-hidden="true">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="jersey-heading text-base font-black text-white flex items-center gap-2">
              <span>Fan Copilot</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold border ${
                  isGeminiLive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
                title={isGeminiLive ? 'Real GLM 5.2 API key configured' : 'No GLM API key — using simulated engine'}
              >
                {isGeminiLive ? '◆ GLM 5.2 FLASH' : '◇ SIMULATED'}
              </span>
            </h3>
            <p className="text-xs text-emerald-100/60">Multilingual AI partner • 8 World Cup languages</p>
          </div>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-emerald-900/40 mb-3 relative z-10">
        <span className="text-[11px] font-black text-emerald-100/50 uppercase tracking-widest jersey-heading">Quick Plays:</span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(chip.query)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md bg-[#03110a]/80 hover:bg-emerald-950/60 text-emerald-100/80 hover:text-emerald-100 text-xs font-medium border border-emerald-900/50 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 scrollbar-pitch relative z-10" role="log" aria-live="polite" aria-label="Chat conversation">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div
                className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 shadow-md ${
                  isUser ? 'bg-emerald-500 text-[#03110a]' : 'bg-emerald-950 border border-emerald-700/50 text-amber-400'
                }`}
                aria-hidden="true"
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-3 rounded-md text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-emerald-500 text-[#03110a] rounded-tr-none font-medium'
                    : 'bg-[#03110a]/90 border border-emerald-900/50 text-emerald-50 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-[80%]">
            <div className="w-8 h-8 rounded-md bg-emerald-950 border border-emerald-700/50 text-amber-400 flex items-center justify-center shrink-0" aria-hidden="true">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 rounded-md bg-[#03110a]/90 border border-emerald-900/50 text-emerald-100/60 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 live-pulse" aria-hidden="true" />
              <span>GLM is reasoning across live stadium telemetry…</span>
            </div>
          </div>
        )}

        {lastAction && (
          <div className="ml-11 max-w-sm bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-500/40 rounded-md p-3 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-emerald-200 font-black uppercase tracking-wider">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} aria-hidden="true" />
              <span>AI Recommended Play</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateRequest && lastAction.targetId) onNavigateRequest(lastAction.targetId);
              }}
              className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-[#03110a] text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>{lastAction.label}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div role="alert" className="relative z-10 mb-3 rounded-md bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMsg);
        }}
        className="flex items-center gap-2 pt-2 border-t border-emerald-900/50 relative z-10"
      >
        <label htmlFor="fan-copilot-input" className="sr-only">
          Ask the Fan Copilot a question
        </label>
        <input
          id="fan-copilot-input"
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask in English, Español, Français, العربية, 日本語…"
          disabled={isLoading}
          className="flex-1 bg-[#03110a] border border-emerald-900/50 rounded-md px-4 py-3 text-xs sm:text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || isLoading}
          aria-label="Send inquiry to AI Copilot"
          className="p-3 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-[#03110a] shadow-lg transition-all disabled:opacity-40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      {lastEngine && (
        <div className="text-[10px] text-emerald-100/40 text-center mt-2 font-mono relative z-10" aria-live="polite">
          Last response:{' '}
          <span className={lastEngine === 'gemini' ? 'text-emerald-400' : 'text-amber-400'}>
            {lastEngine === 'gemini' ? '◆ Real GLM 5.2 API' : '◇ Simulated fallback engine'}
          </span>
        </div>
      )}
    </div>
  );
};
