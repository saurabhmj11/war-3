'use client';

import React, { useState } from 'react';
import { AIChatTurn, LanguageCode, FanCopilotResponseDTO } from '@/domain/types';
import { Send, Bot, User, Sparkles, Compass, Clock, Utensils, AlertCircle, ArrowRight } from 'lucide-react';

interface FanCopilotChatProps {
  onNavigateRequest?: (targetId: string) => void;
  defaultLang?: LanguageCode;
}

export const FanCopilotChat: React.FC<FanCopilotChatProps> = ({
  onNavigateRequest,
  defaultLang = 'en',
}) => {
  const [messages, setMessages] = useState<AIChatTurn[]>([
    {
      role: 'model',
      content: 'Hello Carlos! I am your official FIFA Smart Stadium Copilot powered by Vertex AI Gemini. How can I help you navigate MetLife Stadium today? Ask me about gate wait times, vegetarian food stalls, or step-free accessible routes in your language!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<FanCopilotResponseDTO['suggestedAction'] | null>(null);

  const QUICK_CHIPS = [
    { label: '🏃‍♂️ Fastest Gate to Sec 112', query: 'Which gate is fastest to enter for Sector 112 right now?' },
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

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copilotType: 'FAN',
          message: textToSend,
          stadiumId: 'metlife-ny-nj',
          language: defaultLang,
          history: messages,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const aiData: FanCopilotResponseDTO = json.data;
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: aiData.responseText, timestamp: new Date().toISOString() },
        ]);
        if (aiData.suggestedAction) {
          setLastAction(aiData.suggestedAction);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'model', content: 'I apologize, but I encountered a network delay while contacting Vertex AI Gemini. Please try again or check the stadium map.', timestamp: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: 'Error communicating with AI command server. Please try again.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-2xl flex flex-col h-[600px] backdrop-blur-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Fan Navigation & Concessions Copilot</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-normal">
                GEMINI 2.5 FLASH
              </span>
            </h3>
            <p className="text-xs text-slate-400">Multilingual AI partner supporting 8 World Cup languages & WCAG AA routing</p>
          </div>
        </div>
      </div>

      {/* Quick Chips */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800/60 mb-4">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggested Questions:</span>
        {QUICK_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip.query)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 transition-all shadow-sm active:scale-98 disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Message History Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 border border-slate-700 text-emerald-400'
                }`}
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
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Vertex AI Gemini 2.5 is reasoning across 18 stadium collections...</span>
            </div>
          </div>
        )}

        {/* Action Card if AI suggested navigation */}
        {lastAction && (
          <div className="ml-11 max-w-sm bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/40 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
              <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>AI Recommended Action</span>
            </div>
            <button
              onClick={() => {
                if (onNavigateRequest && lastAction.targetId) {
                  onNavigateRequest(lastAction.targetId);
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1 group"
            >
              <span>{lastAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputMsg);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800/80"
      >
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Ask in English, Español, Français, العربية, 日本語..."
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMsg.trim() || isLoading}
          className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-40 active:scale-95"
          title="Send inquiry to Vertex AI Gemini"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
