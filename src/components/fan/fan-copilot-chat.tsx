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
    { label: '🏃 Fastest Gate to Sec 112', query: 'Which gate is fastest to enter for Sector 112 right now?' },
    { label: '🌮 Vegetarian Tacos Nearby', query: 'Where can I get vegetarian or vegan tacos near Sector 112?' },
    { label: '♿ Step-Free Elevator Route', query: 'Show me the step-free accessible elevator route to my seat.' },
    { label: '🇪🇸 ¿Cuánto tiempo en Puerta C?', query: '¿Cuánto tiempo de espera hay en la Puerta C?' },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;
    const userTurn: AIChatTurn = { role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    const newHistory = [...messages, userTurn];
    setMessages(newHistory);
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
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col h-[600px] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20" aria-hidden="true">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Fan Navigation & Concessions Copilot</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-normal border ${
                  isGeminiLive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
                title={isGeminiLive ? 'Real Google Gemini API key configured' : 'No Gemini API key — using simulated engine'}
              >
                {isGeminiLive ? 'GEMINI 2.5 FLASH' : 'SIMULATED'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Multilingual AI partner supporting 8 World Cup languages & WCAG AA routing</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800/60 mb-4">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested questions:</span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(chip.query)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-all shadow-sm active:scale-98 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4" role="log" aria-live="polite" aria-label="Chat conversation">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser ? 'bg-emerald-600 text-white' : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
                aria-hidden="true"
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-3 mr-auto max-w-[80%]">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0" aria-hidden="true">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
              <span>Gemini is reasoning across live stadium telemetry…</span>
            </div>
          </div>
        )}

        {lastAction && (
          <div className="ml-11 max-w-sm bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} aria-hidden="true" />
              <span>AI Recommended Action</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onNavigateRequest && lastAction.targetId) onNavigateRequest(lastAction.targetId);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <span>{lastAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div role="alert" className="mb-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMsg);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800/80"
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
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || isLoading}
          aria-label="Send inquiry to AI Copilot"
          className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-40 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      {lastEngine && (
        <div className="text-[10px] text-slate-500 text-center mt-2" aria-live="polite">
          Last response generated by:{' '}
          <span className={lastEngine === 'gemini' ? 'text-emerald-400' : 'text-amber-400'}>
            {lastEngine === 'gemini' ? 'Real Google Gemini API' : 'Simulated fallback engine'}
          </span>
        </div>
      )}
    </div>
  );
};
