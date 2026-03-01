'use client';

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Mail, 
  Search, 
  Clock, 
  Inbox, 
  Send, 
  ChevronLeft, 
  Plus, 
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: string;
  isRead?: boolean;
}

interface MessageViewerProps {
  messages: MessageItem[];
  onRefresh?: () => void;
}

const MessageViewer: React.FC<MessageViewerProps> = ({ messages, onRefresh }) => {
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  });

  const filteredMessages = messages.filter(msg => 
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await apiClient.sendClientMessage(formData.subject, formData.content);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setShowCompose(false);
        setFormData({ subject: '', content: '' });
        if (onRefresh) onRefresh();
      }, 2000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (msg: MessageItem) => {
    setFormData({
      subject: `RE: ${msg.subject}`,
      content: `\n\n--- Original Message ---\nFrom: ${msg.sender || 'System'}\nDate: ${new Date(msg.createdAt).toLocaleString()}\n\n${msg.content}`
    });
    setShowCompose(true);
  };

  return (
    <div className="h-[600px] lg:h-[700px] flex flex-col lg:flex-row gap-6 animate-fade-in relative">
      {/* Sidebar List - Hidden on mobile if message selected */}
      <div className={`w-full lg:w-96 flex flex-col bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden transition-all ${
        selectedMessage ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm lg:text-base font-black uppercase tracking-widest flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-ai-blue" />
              Comms Hub
            </h2>
            <button 
              onClick={() => {
                setFormData({ subject: '', content: '' });
                setShowCompose(true);
              }}
              className="p-2 bg-ai-blue/10 text-ai-blue rounded-lg hover:bg-ai-blue hover:text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
            <input 
              type="text" 
              placeholder="Filter messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase tracking-widest focus:border-ai-blue outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(msg)}
                className={`w-full p-6 text-left border-b border-white/5 hover:bg-white/[0.02] transition-all relative group ${
                  selectedMessage?.id === msg.id ? 'bg-white/[0.03]' : ''
                }`}
              >
                {!msg.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-ai-blue"></div>
                )}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${msg.sender === 'USER' ? 'text-expert-green' : 'text-ai-blue'}`}>
                    {msg.sender === 'USER' ? 'OUTGOING_NODE' : 'INCOMING_SYSTEM'}
                  </span>
                  <span className="text-[8px] font-bold text-medium-gray uppercase tracking-tighter">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className={`text-xs font-black uppercase tracking-tight truncate mb-1 ${
                  !msg.isRead ? 'text-white' : 'text-white/40'
                }`}>
                  {msg.subject}
                </h3>
                <p className="text-[10px] text-white/20 font-medium uppercase tracking-tighter line-clamp-1 opacity-60">
                  {msg.content}
                </p>
              </button>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <Inbox className="w-12 h-12 text-white/5 mb-4" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                Buffer empty - awaiting interaction
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Message Content - Mobile view uses full screen when message selected */}
      <div className={`flex-1 bg-darker-bg lg:bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden flex flex-col transition-all ${
        selectedMessage ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'
      }`}>
        {selectedMessage ? (
          <>
            <div className="p-6 lg:p-10 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-4 mb-8 lg:hidden">
                <button 
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 bg-white/5 rounded-lg text-white/40"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Transmission Log</span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div className="space-y-4">
                  <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-white leading-tight">{selectedMessage.subject}</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${
                        selectedMessage.sender === 'USER' ? 'bg-expert-green/20 text-expert-green' : 'bg-ai-blue/20 text-ai-blue'
                      }`}>
                        {selectedMessage.sender === 'USER' ? 'U' : 'S'}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        selectedMessage.sender === 'USER' ? 'text-expert-green' : 'text-ai-blue'
                      }`}>
                        {selectedMessage.sender === 'USER' ? 'You (Client)' : 'System Orchestrator'}
                      </span>
                    </div>
                    <span className="text-white/10">|</span>
                    <div className="flex items-center gap-2 text-white/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-white/[0.01]">
              <div className="prose prose-invert max-w-none">
                <p className="text-xs lg:text-sm text-white/60 font-medium uppercase tracking-tight leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
            </div>
            
            <div className="p-6 lg:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-ai-blue rounded-full animate-pulse"></div>
                <p className="text-[9px] font-black text-ai-blue uppercase tracking-[0.3em]">Secure Connection Active</p>
              </div>
              <button 
                onClick={() => handleReply(selectedMessage)}
                className="w-full sm:w-auto px-8 py-4 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-ai-blue/20"
              >
                <Send className="w-4 h-4" />
                Transmit Reply
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform">
              <Mail className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white/40 mb-4">Select_Transmission</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 max-w-[200px] leading-relaxed">
              Awaiting selection from encrypted message stream
            </p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => !isSending && setShowCompose(false)}></div>
          <div className="bg-darker-bg border border-white/10 rounded-[40px] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl">
            <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-4">
                <Plus className="w-6 h-6 text-ai-blue" />
                Initialize <span className="text-ai-blue italic">Transmission</span>
              </h2>
              <button 
                disabled={isSending}
                onClick={() => setShowCompose(false)} 
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="p-8 lg:p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Subject_Line</label>
                <input 
                  type="text"
                  required
                  disabled={isSending}
                  placeholder="e.g. Deployment Question"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all disabled:opacity-50"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Data_Content</label>
                <textarea 
                  required
                  disabled={isSending}
                  placeholder="Provide message details..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all h-48 lg:h-64 resize-none leading-relaxed disabled:opacity-50"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  type="button"
                  disabled={isSending}
                  onClick={() => setShowCompose(false)}
                  className="order-2 sm:order-1 flex-1 py-5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Terminate
                </button>
                <button 
                  type="submit"
                  disabled={isSending || sendSuccess}
                  className={`order-1 sm:order-2 flex-[2] py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg ${
                    sendSuccess 
                      ? 'bg-expert-green text-dark-bg' 
                      : 'bg-ai-blue text-white hover:scale-[1.02] active:scale-[0.98] shadow-ai-blue/20'
                  } disabled:opacity-50`}
                >
                  {isSending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Transmitting...</>
                  ) : sendSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /> Transmission Complete</>
                  ) : (
                    <><Send className="w-5 h-5" /> Authorize Transmit</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageViewer;
