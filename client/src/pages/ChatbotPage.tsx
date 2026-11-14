import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { ChatSession, ChatMessage } from '../types';
import { CitationPill } from '../components/common/CitationPill';
import { useToast } from '../context/ToastContext';
import {
  BotMessageSquare,
  Plus,
  Send,
  Sparkles,
  Database,
  ShieldAlert,
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

export const ChatbotPage: React.FC = () => {
  const { addToast } = useToast();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await api.chat.getSessions();
      setSessions(res.sessions);
      if (res.sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(res.sessions[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load chat sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await api.chat.getMessages(sessionId);
      setMessages(res.messages);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading session',
        message: err.message,
      });
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    }
  }, [activeSessionId]);

  const handleCreateSession = async () => {
    try {
      const res = await api.chat.createSession('Ops Triage ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSessions([res.session, ...sessions]);
      setActiveSessionId(res.session.id);
      setMessages([]);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Session creation failed',
        message: err.message,
      });
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || !activeSessionId || sending) return;

    setInputMessage('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId,
      sender: 'user',
      content: text,
      citations: [],
      suggested_prompts: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await api.chat.sendMessage(activeSessionId, text);
      // Replace with confirmed messages
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), res.userMessage, res.assistantMessage]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to send query',
        message: err.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-7.5rem)] flex flex-col md:flex-row rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Sessions Sidebar */}
      <div className="w-full md:w-72 border-r border-slate-800 bg-slate-950/80 flex flex-col justify-between shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
              Ops Copilot
            </span>
          </div>
          <button
            onClick={handleCreateSession}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={clsx(
                'w-full text-left p-3 rounded-xl text-xs transition-all flex items-start justify-between gap-2',
                activeSessionId === s.id
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              )}
            >
              <div className="truncate flex-1">
                <p className="font-semibold truncate">{s.title}</p>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(s.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {activeSessionId === s.id && (
                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Grounding Info Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 text-[10px] font-mono text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Database className="w-3 h-3" />
            <span>Live Grounding Connected</span>
          </div>
          <p className="text-slate-400">
            Real-time multi-silo context injected automatically into Gemini 2.5 Flash prompts.
          </p>
        </div>
      </div>

      {/* Main Chat Conversation View */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-950/40">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-12">
              <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-200">
                Agentic Operations Copilot Ready
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ask questions about active incidents, pending HITL guardrails, unmitigated cash exposure, or specific record citations.
              </p>

              {/* Sample Prompts */}
              <div className="mt-6 space-y-2 w-full text-left">
                {[
                  'What is our total unmitigated financial exposure right now?',
                  'Why did the AWS GPU auto-scaling loop escalate to HITL review?',
                  'Simulate the fiscal impact if we approve the SAP wire freeze.',
                  'Review the anomalous Tor exit node IP from the Auth0 logs.',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="w-full p-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-indigo-500/50 hover:bg-slate-900 text-xs text-slate-300 text-left transition-all"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.sender === 'assistant';

              return (
                <div
                  key={m.id}
                  className={clsx(
                    'flex gap-3 max-w-4xl',
                    isAssistant ? 'items-start' : 'items-start ml-auto flex-row-reverse'
                  )}
                >
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border',
                      isAssistant
                        ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    )}
                  >
                    {isAssistant ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  <div className="space-y-3 flex-1">
                    <div
                      className={clsx(
                        'p-4 rounded-2xl border shadow-lg text-xs leading-relaxed',
                        isAssistant
                          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
                          : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-100 ml-auto max-w-xl'
                      )}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.content}</div>
                    </div>

                    {/* Citations Pills */}
                    {isAssistant && m.citations && m.citations.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          Verified Citations:
                        </span>
                        {m.citations.map((c, i) => (
                          <CitationPill key={i} citation={c} />
                        ))}
                      </div>
                    )}

                    {/* Suggested Prompts Chips */}
                    {isAssistant && m.suggested_prompts && m.suggested_prompts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.suggested_prompts.map((p, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendMessage(p)}
                            className="text-[11px] px-3 py-1 rounded-full bg-slate-900 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-200 transition-colors"
                          >
                            + {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center gap-3 text-xs text-indigo-400 font-mono">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span>Gemini 2.5 Flash correlating database groundings...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask AegisFlow about active incidents, rollback safety, or ledger exposure..."
              className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors shrink-0 shadow-md shadow-indigo-950/50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
