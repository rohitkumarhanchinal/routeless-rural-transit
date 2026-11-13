import React, { useState } from 'react';
import { useTransport } from '../../context/TransportContext';
import { AIAssistantEngine, AssistantMessage } from '../../algorithms/aiAssistantEngine';
import {
  Bot,
  Send,
  User,
  Sparkles,
  HelpCircle,
  Bus,
  MapPin,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const MobilityAssistant: React.FC = () => {
  const {
    t,
    activeStudent,
    villages,
    institutions,
    buses,
    alternatives,
    students,
    requests,
    roads,
    disruptions,
    setActiveRole,
  } = useTransport();

  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: `Hello! I am your **Routeless AI Mobility Assistant**.\n\nI monitor the live transit state across Belagavi district. You are currently viewing as **${activeStudent.name}** (from ${villages.find((v) => v.id === activeStudent.villageId)?.name} ➔ ${institutions.find((i) => i.id === activeStudent.institutionId)?.name}).\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      chips: [
        'Which bus can take me to my college?',
        'What happens if my bus breaks down?',
        'Are there alternative routes?',
        'Why is my request waitlisted?',
        'Which route needs additional buses?',
      ],
    },
  ]);

  const handleSendQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: AssistantMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    // Process using AIAssistantEngine
    setTimeout(() => {
      const response = AIAssistantEngine.processQuery(queryText, {
        activeStudent,
        villages,
        institutions,
        buses,
        alternatives,
        students,
        requests,
        roads,
        disruptions,
      });

      setMessages((prev) => [...prev, response]);
    }, 300);
  };

  const handleChipClick = (chip: string) => {
    handleSendQuery(chip);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center">
              {t.ai_assistant_title}
              <span className="ml-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE DECISION ENGINE
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">{t.ai_assistant_desc}</p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-[11px] text-slate-500 block">Context:</span>
          <span className="text-xs font-bold text-slate-700">{activeStudent.name}</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xl min-h-[480px] max-h-[580px] flex flex-col justify-between">
        <div className="overflow-y-auto space-y-4 pr-1">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
                    isUser
                      ? 'bg-brand-600'
                      : 'bg-gradient-to-tr from-cyan-500 to-indigo-600'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-brand-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-700 rounded-tl-none shadow'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Data Pill if attached */}
                    {msg.dataPill && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{msg.dataPill.label}:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            msg.dataPill.tone === 'success'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : msg.dataPill.tone === 'danger'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {msg.dataPill.value}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 block px-1">
                    {msg.timestamp}
                  </span>

                  {/* Chips for follow up */}
                  {!isUser && msg.chips && msg.chips.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.chips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleChipClick(chip)}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[11px] font-medium transition flex items-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputQuery);
          }}
          className="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t.ask_assistant_placeholder}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/30 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
