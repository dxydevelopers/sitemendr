'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Plus, Bot, User, ChevronRight, Clock, Loader2,
  ArrowLeft, ShieldQuestion, Headphones,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';

interface TicketMessage {
  id: string;
  content: string;
  senderId: string;
  isAdmin: boolean;
  isRead?: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  messages: TicketMessage[];
}

interface AIChatMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface SupportTicketsProps {
  subscriptionId?: string;
}

const statusColor: Record<string, string> = {
  open: 'text-ai-blue',
  pending: 'text-amber-300',
  resolved: 'text-expert-green',
  closed: 'text-white/40',
};

const SupportTickets: React.FC<SupportTicketsProps> = ({ subscriptionId }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'chat' | 'create' | 'details'>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [aiChat, setAIChat] = useState<AIChatMessage[]>([
    { text: "Hello! I'm the Sitemendr AI Assistant. How can I help you today?", sender: 'ai', timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ticketReply, setTicketReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat, selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const response = await apiClient.getClientSupportTickets(subscriptionId);
      if (response.success) setTickets(response.data as unknown as SupportTicket[]);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.message.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiClient.createSupportTicket({ ...newTicket, subscriptionId });
      if (response.success) {
        setTickets([response.data.ticket as unknown as SupportTicket, ...tickets]);
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        setView('list');
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAIChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: AIChatMessage = { text: chatInput, sender: 'user', timestamp: new Date() };
    setAIChat(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);
    try {
      const response = await apiClient.chatWithSupport(chatInput, aiChat);
      if (response.success) setAIChat(prev => [...prev, { text: response.message, sender: 'ai', timestamp: new Date() }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      setAIChat(prev => [...prev, { text: "I'm having trouble connecting right now. Please try creating a support ticket instead.", sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView('details');
    const hasUnread = ticket.messages.some(m => m.isAdmin && !m.isRead);
    if (hasUnread) {
      try {
        await apiClient.post(`/support/tickets/${ticket.id}/read`, {});
        setTickets(tickets.map(t => t.id === ticket.id
          ? { ...t, messages: t.messages.map(m => m.isAdmin ? { ...m, isRead: true } : m) }
          : t));
      } catch (error) {
        console.error('Failed to mark ticket as read:', error);
      }
    }
  };

  const handleReplyToTicket = async () => {
    if (!selectedTicket || !ticketReply.trim()) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.addSupportMessage(selectedTicket.id, ticketReply);
      if (response.success) {
        const updatedMessages = [...selectedTicket.messages, response.data as unknown as TicketMessage];
        setSelectedTicket({ ...selectedTicket, messages: updatedMessages });
        setTicketReply('');
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, messages: updatedMessages } : t));
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-ai-blue" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Headphones className="h-5 w-5 text-ai-blue" />
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Support</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">
              {view === 'list' && 'Your tickets'}
              {view === 'chat' && 'AI assistant'}
              {view === 'create' && 'New ticket'}
              {view === 'details' && selectedTicket?.subject}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {view !== 'list' ? (
            <button onClick={() => { setView('list'); setSelectedTicket(null); }} className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <>
              <button onClick={() => setView('chat')} className="flex items-center gap-2 border border-white/10 bg-white/[0.02] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition hover:border-ai-blue/30 hover:text-white">
                <Bot className="h-4 w-4" /> AI chat
              </button>
              <button onClick={() => setView('create')} className="flex items-center gap-2 bg-ai-blue px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black">
                <Plus className="h-4 w-4" /> New ticket
              </button>
            </>
          )}
        </div>
      </div>

      <div className="min-h-[500px] border border-white/[0.08] bg-white/[0.02]">
        {view === 'list' && (
          tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-4 p-16 text-center">
              <ShieldQuestion className="h-8 w-8 text-white/24" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/50">No tickets yet</h3>
                <p className="mt-1 text-xs font-medium text-white/30">Nothing open right now.</p>
              </div>
              <button onClick={() => setView('create')} className="border border-white/10 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/80 transition hover:border-ai-blue/30 hover:text-white">
                Create a ticket
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {tickets.map((ticket) => {
                const unread = ticket.messages.some(m => m.isAdmin && !m.isRead);
                return (
                  <button key={ticket.id} onClick={() => handleSelectTicket(ticket)} className="flex w-full items-center justify-between gap-4 p-6 text-left transition hover:bg-white/[0.02]">
                    <div className="flex min-w-0 items-center gap-4">
                      {unread && <span className="h-2 w-2 shrink-0 bg-ai-blue" />}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-3">
                          <h4 className="truncate text-sm font-black text-white">{ticket.subject}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor[ticket.status] || 'text-white/50'}`}>{ticket.status}</span>
                        </div>
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40">
                          <Clock className="h-3 w-3" /> {format(new Date(ticket.createdAt), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-white/20" />
                  </button>
                );
              })}
            </div>
          )
        )}

        {view === 'details' && selectedTicket && (
          <div className="flex h-full flex-col">
            <div className="flex flex-col gap-2 border-b border-white/[0.08] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-black tracking-tight text-white">{selectedTicket.subject}</h3>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${statusColor[selectedTicket.status] || 'text-white/50'}`}>{selectedTicket.status}</span>
                </div>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/40">
                  Priority: {selectedTicket.priority} · {format(new Date(selectedTicket.createdAt), 'PPP')}
                </p>
              </div>
            </div>

            <div className="max-h-[480px] flex-1 space-y-6 overflow-y-auto p-6">
              {selectedTicket.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[80%] items-start gap-3 ${msg.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`grid h-8 w-8 shrink-0 place-items-center border ${msg.isAdmin ? 'border-white/10 bg-white/[0.04]' : 'border-ai-blue/30 bg-ai-blue/10'}`}>
                      {msg.isAdmin ? <Bot className="h-4 w-4 text-white/60" /> : <User className="h-4 w-4 text-ai-blue" />}
                    </div>
                    <div className="space-y-1">
                      <div className={`p-4 text-sm font-medium leading-relaxed ${msg.isAdmin ? 'border border-white/[0.08] bg-white/[0.02] text-white/80' : 'bg-ai-blue text-white'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/24">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {selectedTicket.status !== 'closed' && (
              <div className="border-t border-white/[0.08] p-6">
                <div className="relative">
                  <textarea
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[120px] w-full resize-none border border-white/10 bg-white/[0.02] p-4 pr-32 text-sm text-white outline-none focus:border-ai-blue"
                  />
                  <button
                    onClick={handleReplyToTicket}
                    disabled={isSubmitting || !ticketReply.trim()}
                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-ai-blue px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'chat' && (
          <div className="flex h-full flex-col">
            <div className="max-h-[480px] flex-1 space-y-6 overflow-y-auto p-6">
              {aiChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex max-w-[80%] items-start gap-3 ${msg.sender === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`grid h-8 w-8 shrink-0 place-items-center border ${msg.sender === 'ai' ? 'border-white/10 bg-white/[0.04]' : 'border-ai-blue/30 bg-ai-blue/10'}`}>
                      {msg.sender === 'ai' ? <Bot className="h-4 w-4 text-white/60" /> : <User className="h-4 w-4 text-ai-blue" />}
                    </div>
                    <div className={`p-4 text-sm font-medium leading-relaxed ${msg.sender === 'ai' ? 'border border-white/[0.08] bg-white/[0.02] text-white/80' : 'bg-ai-blue text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-center gap-1.5 pl-11">
                  <span className="h-1.5 w-1.5 animate-bounce bg-white/30" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-white/30 [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-white/30 [animation-delay:0.3s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="border-t border-white/[0.08] p-6">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAIChat()}
                  placeholder="Ask a question or describe an issue..."
                  className="w-full border border-white/10 bg-white/[0.02] py-3.5 pl-4 pr-24 text-sm text-white outline-none focus:border-ai-blue"
                />
                <button onClick={handleSendAIChat} disabled={!chatInput.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 bg-ai-blue px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="mx-auto max-w-xl space-y-8 p-8 lg:p-12">
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-black tracking-tight text-white">New ticket</h3>
              <p className="text-xs font-medium text-white/40">Describe what you need and we&apos;ll route it to the right place.</p>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Subject</label>
                  <input
                    type="text" required
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    placeholder="e.g. Need help with my website"
                    className="w-full border border-white/10 bg-white/[0.02] p-3 text-sm text-white outline-none focus:border-ai-blue"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full border border-white/10 bg-white/[0.02] p-3 text-sm text-white outline-none focus:border-ai-blue"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Details</label>
                <textarea
                  required
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Describe your issue or request in detail..."
                  className="min-h-[180px] w-full resize-none border border-white/10 bg-white/[0.02] p-4 text-sm text-white outline-none focus:border-ai-blue"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-ai-blue py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-black disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create ticket'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;