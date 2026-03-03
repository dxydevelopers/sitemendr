'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  LifeBuoy, 
  Plus, 
  History, 
  Bot, 
  User, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  X,
  ArrowLeft,
  Search,
  Zap,
  ShieldQuestion,
  Headphones,
  Paperclip
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';

interface TicketMessage {
  id: string;
  content: string;
  senderId: string;
  isAdmin: boolean;
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

const SupportTickets: React.FC<SupportTicketsProps> = ({ subscriptionId }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'chat' | 'create' | 'details'>('list');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [aiChat, setAIChat] = useState<AIChatMessage[]>([
    { text: "Hello! I'm the Sitemendr AI Assistant. How can I help you today?", sender: 'ai', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ticketReply, setTicketReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets();
  }, [subscriptionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat, selectedTicket?.messages]);

  const fetchTickets = async () => {
    try {
      const response = await apiClient.getClientSupportTickets(subscriptionId);
      if (response.success) {
        setTickets(response.data as unknown as SupportTicket[]);
      }
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
      const response = await apiClient.createSupportTicket(newTicket);
      if (response.success) {
        setTickets([response.data.ticket as unknown as SupportTicket, ...tickets]);
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        
        // If AI gave an immediate response, maybe show it?
        if (response.data.aiResponse) {
          alert(`AI Suggestion: ${response.data.aiResponse}`);
        }
        
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
      if (response.success) {
        setAIChat(prev => [...prev, { text: response.message, sender: 'ai', timestamp: new Date() }]);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      setAIChat(prev => [...prev, { text: "I'm having trouble connecting right now. Please try creating a support ticket instead.", sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
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
        // Update in main list too
        setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, messages: updatedMessages } : t));
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-ai-blue bg-ai-blue/10 border-ai-blue/20';
      case 'pending': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'resolved': return 'text-expert-green bg-expert-green/10 border-expert-green/20';
      case 'closed': return 'text-white/30 bg-white/5 border-white/10';
      default: return 'text-white/50 bg-white/5 border-white/10';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 text-ai-blue animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 px-2">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ai-blue/10 border border-ai-blue/20 rounded-xl flex items-center justify-center">
              <Headphones className="w-5 h-5 text-ai-blue" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Tactical Support Center
            </h2>
          </div>
          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest mt-1 opacity-60">
            {view === 'list' && 'Support History'}
            {view === 'chat' && 'AI Assistant'}
            {view === 'create' && 'New Ticket'}
            {view === 'details' && `Ticket_${selectedTicket?.id.slice(-8)}`}
          </p>
        </div>

        <div className="flex gap-4">
          {view !== 'list' && (
            <button 
              onClick={() => { setView('list'); setSelectedTicket(null); }}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
          )}
          {view === 'list' && (
            <>
              <button 
                onClick={() => setView('chat')}
                className="px-6 py-3 bg-tech-purple/10 border border-tech-purple/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-tech-purple hover:bg-tech-purple/20 transition-all flex items-center gap-2"
              >
                <Bot className="w-4 h-4" /> AI Chat
              </button>
              <button 
                onClick={() => setView('create')}
                className="px-6 py-3 bg-ai-blue border border-ai-blue rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-ai-blue/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> New Ticket
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="bg-white/[0.01] border border-white/5 rounded-[40px] overflow-hidden min-h-[600px] flex flex-col relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex-1 flex flex-col relative z-10">
            {tickets.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center opacity-20">
                  <ShieldQuestion className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/60">No Support Logs Found</h3>
                  <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">All systems operational. No active tickets pending.</p>
                </div>
                <button 
                  onClick={() => setView('create')}
                  className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-ai-blue hover:border-ai-blue transition-all"
                >
                  Initiate First Inquiry
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {tickets.map((ticket) => (
                  <button 
                    key={ticket.id}
                    onClick={() => { setSelectedTicket(ticket); setView('details'); }}
                    className="w-full p-8 lg:p-10 flex items-center justify-between hover:bg-white/[0.02] transition-all group"
                  >
                    <div className="flex items-center gap-8">
                      <div className={`w-3 h-3 rounded-full animate-pulse ${ticket.status === 'open' ? 'bg-expert-green' : 'bg-white/20'}`}></div>
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-4">
                          <h4 className="text-base lg:text-lg font-black uppercase tracking-tight text-white group-hover:text-ai-blue transition-colors">
                            {ticket.subject}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">ID: {ticket.id.slice(-12)}</p>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3 h-3" /> {format(new Date(ticket.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-2 transition-all" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DETAILS VIEW */}
        {view === 'details' && selectedTicket && (
          <div className="flex-1 flex flex-col h-full relative z-10">
            {/* Ticket Header */}
            <div className="p-8 lg:p-10 border-bottom border-white/5 bg-white/[0.02] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">{selectedTicket.subject}</h3>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Priority: <span className="text-white">{selectedTicket.priority}</span> • Created: {format(new Date(selectedTicket.createdAt), 'PPP')}</p>
              </div>
              <button className="text-[9px] font-black uppercase tracking-widest text-expert-green hover:underline">Mark as Resolved</button>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10 max-h-[600px] no-scrollbar">
              {selectedTicket.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] flex items-start gap-4 ${msg.isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.isAdmin ? 'bg-tech-purple/20 border border-tech-purple/20' : 'bg-ai-blue/20 border border-ai-blue/20'}`}>
                      {msg.isAdmin ? <Bot className="w-5 h-5 text-tech-purple" /> : <User className="w-5 h-5 text-ai-blue" />}
                    </div>
                    <div className={`space-y-2 ${msg.isAdmin ? 'items-start' : 'items-end'}`}>
                      <div className={`p-6 rounded-[28px] text-xs lg:text-sm font-medium leading-relaxed ${msg.isAdmin ? 'bg-white/5 text-white/80 rounded-tl-none' : 'bg-ai-blue text-white rounded-tr-none shadow-xl shadow-ai-blue/20'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input */}
            {selectedTicket.status !== 'closed' && (
              <div className="p-8 lg:p-10 bg-white/[0.02] border-t border-white/5">
                <div className="relative group">
                  <textarea 
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    placeholder="Enter your message or question..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-8 text-white text-sm focus:ring-2 focus:ring-ai-blue/30 focus:border-ai-blue outline-none transition-all min-h-[140px] resize-none pr-32 no-scrollbar font-medium"
                  />
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    <button className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-white transition-all">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleReplyToTicket}
                      disabled={isSubmitting || !ticketReply.trim()}
                      className="px-8 py-4 bg-ai-blue text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-ai-blue/20 flex items-center gap-3"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Transmit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEURAL CHAT VIEW */}
        {view === 'chat' && (
          <div className="flex-1 flex flex-col h-full relative z-10">
             <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-8 max-h-[600px] no-scrollbar">
              {aiChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] flex items-start gap-4 ${msg.sender === 'ai' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.sender === 'ai' ? 'bg-tech-purple/20 border border-tech-purple/20' : 'bg-ai-blue/20 border border-ai-blue/20'}`}>
                      {msg.sender === 'ai' ? <Bot className="w-5 h-5 text-tech-purple" /> : <User className="w-5 h-5 text-ai-blue" />}
                    </div>
                    <div className={`space-y-2 ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
                      <div className={`p-6 rounded-[28px] text-xs lg:text-sm font-medium leading-relaxed ${msg.sender === 'ai' ? 'bg-white/5 text-white/80 rounded-tl-none border border-white/5' : 'bg-tech-purple text-white rounded-tr-none shadow-xl shadow-tech-purple/20'}`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-tech-purple rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-tech-purple rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-tech-purple rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-8 lg:p-10 bg-white/[0.02] border-t border-white/5">
              <div className="relative group">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendAIChat()}
                  placeholder="Ask a question or report an issue..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-6 px-10 text-white text-sm focus:ring-2 focus:ring-tech-purple/30 focus:border-tech-purple outline-none transition-all pr-40 font-medium"
                />
                <button 
                  onClick={handleSendAIChat}
                  disabled={!chatInput.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3.5 bg-tech-purple text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-xl shadow-tech-purple/20"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CREATE VIEW */}
        {view === 'create' && (
          <div className="flex-1 p-8 lg:p-20 relative z-10">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-ai-blue/10 border border-ai-blue/20 rounded-full">
                  <Zap className="w-3 h-3 text-ai-blue animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-ai-blue">High Priority Uplink</span>
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-white">Initialize New Inquiry</h3>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest leading-relaxed">Our AI will automatically classify and route your request to the relevant department for accelerated resolution.</p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Inquiry Subject</label>
                    <input 
                      type="text"
                      required
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                      placeholder="e.g. Need help with my website"
                      className="w-full bg-white/5 border border-white/10 rounded-[24px] py-6 px-8 text-white text-sm focus:ring-2 focus:ring-ai-blue/30 focus:border-ai-blue outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Priority Protocol</label>
                    <select 
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-[24px] py-6 px-8 text-white text-sm focus:ring-2 focus:ring-ai-blue/30 focus:border-ai-blue outline-none transition-all font-black uppercase tracking-widest appearance-none"
                    >
                      <option value="low">Low (Standard)</option>
                      <option value="medium">Medium (Accelerated)</option>
                      <option value="high">High (Immediate)</option>
                      <option value="urgent">Urgent (Emergency)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-4">Detailed Mission Briefing</label>
                  <textarea 
                    required
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    placeholder="Describe your issue or request in detail..."
                    className="w-full bg-white/5 border border-white/10 rounded-[32px] p-8 lg:p-10 text-white text-sm focus:ring-2 focus:ring-ai-blue/30 focus:border-ai-blue outline-none transition-all min-h-[240px] resize-none no-scrollbar font-medium"
                  />
                </div>

                <div className="flex justify-center pt-6">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="px-20 py-6 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-2xl shadow-white/10 flex items-center gap-4"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                    Deploy Inquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Support Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <Clock className="w-5 h-5" />, title: 'Response Time', detail: '< 2 Hours', sub: 'For Priority Protocol' },
          { icon: <ShieldQuestion className="w-5 h-5" />, title: 'System Status', detail: 'Nominal', sub: 'All Systems Green' },
          { icon: <MessageSquare className="w-5 h-5" />, title: '24/7 Support', detail: '24/7/365', sub: '24/7 & Human Support' }
        ].map((item, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 flex items-center gap-6 group hover:border-white/10 transition-all">
            <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-white/40 group-hover:text-ai-blue transition-colors">
              {item.icon}
            </div>
            <div>
              <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">{item.title}</p>
              <h4 className="text-lg font-black text-white tracking-tight">{item.detail}</h4>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportTickets;
