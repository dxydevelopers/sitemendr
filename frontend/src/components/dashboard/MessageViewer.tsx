'use client';

import React, { useEffect, useState } from 'react';
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
  Check
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface MessageItem {
  id: string;
  subject: string;
  content: string;
  createdAt: string;
  sender?: string;
  isRead?: boolean;
  threadId?: string | null;
  replies?: MessageItem[];
  user?: { name?: string; email?: string };
}

interface MessageViewerProps {
  messages: MessageItem[];
  onRefresh?: () => void;
}

const hasUnreadIncoming = (message: MessageItem) =>
  (message.sender !== 'USER' && !message.isRead)
  || Boolean(message.replies?.some(reply => reply.sender !== 'USER' && !reply.isRead));

const MessageViewer: React.FC<MessageViewerProps> = ({ messages, onRefresh }) => {
  const [conversationList, setConversationList] = useState(messages);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');
  const [replyMode, setReplyMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
  subject: '',
  content: ''
  });

  useEffect(() => setConversationList(messages), [messages]);
  useEffect(() => {
    setSelectedMessage(current => current ? messages.find(message => message.id === current.id) || current : null);
  }, [messages]);

  const filteredMessages = conversationList.filter(msg =>
  msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
  msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSending(true);
  setSendError('');
  try {
  if (editingMessageId) {
  const response = await apiClient.put<{ success: boolean; message?: string }>(`/client/messages/${editingMessageId}`, formData);
  if (!response.success) throw new Error(response.message || 'The message could not be updated.');
  } else if (replyMode && selectedMessage) {
  const response = await apiClient.replyToClientMessage(selectedMessage.id, formData.content);
  if (!response.success || !response.message) throw new Error('The reply could not be sent.');
  const updated = { ...selectedMessage, replies: [...(selectedMessage.replies || []), response.message as unknown as MessageItem] };
  setSelectedMessage(updated);
  setConversationList(current => current.map(item => item.id === updated.id ? updated : item));
  } else {
  const response = await apiClient.sendClientMessage(formData.subject, formData.content);
  if (!response.success) throw new Error('The message could not be sent.');
  }
  setReplyMode(false);
  setSendSuccess(true);
  setTimeout(() => {
  setSendSuccess(false);
  setShowCompose(false);
  setEditingMessageId(null);
  setReplyMode(false);
  setFormData({ subject: '', content: '' });
  if (onRefresh) onRefresh();
  }, 2000);
  } catch (error) {
  console.error('Failed to send message:', error);
  setSendError(error instanceof Error ? error.message : 'The message could not be sent. Please try again.');
  } finally {
  setIsSending(false);
  }
  };

  const handleEditMessage = (msg: MessageItem) => {
  setFormData({
  subject: msg.subject,
  content: msg.content
  });
  setEditingMessageId(msg.id);
  setReplyMode(false);
  setShowCompose(true);
  };

  const handleReply = (msg: MessageItem) => {
  setEditingMessageId(null);
  setReplyMode(true);
  setFormData({
  subject: msg.subject,
  content: ''
  });
  setSendError('');
  setShowCompose(true);
  };

  const handleSelectMessage = async (msg: MessageItem) => {
  setSelectedMessage(msg);
  if (hasUnreadIncoming(msg)) {
  try {
  await apiClient.post(`/client/messages/${msg.id}/read`, {});
  const updated = { ...msg, isRead: true, replies: (msg.replies || []).map(reply => reply.sender === 'USER' ? reply : { ...reply, isRead: true }) };
  setSelectedMessage(updated);
  setConversationList(current => current.map(item => item.id === updated.id ? updated : item));
  if (onRefresh) onRefresh();
  } catch (error) {
  console.error('Failed to mark message as read:', error);
  }
  }
  };

  return (
  <div className="relative flex h-[calc(100dvh-10rem)] min-h-[420px] flex-col gap-4 animate-fade-in lg:h-[700px] lg:flex-row lg:gap-6">
  {/* Sidebar List - Hidden on mobile if message selected */}
  <div className={`w-full min-w-0 lg:w-96 flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl lg:rounded-[32px] overflow-hidden transition-all ${
  selectedMessage ? 'hidden lg:flex' : 'flex'
  }`}>
  <div className="p-4 sm:p-6 border-b border-white/5 space-y-4">
  <div className="flex items-center justify-between">
  <h2 className="text-sm lg:text-base font-semibold flex items-center gap-3">
  <MessageSquare className="w-5 h-5 text-ai-blue" />
  Messages
  </h2>
  <button 
  aria-label="Start a new conversation"
  title="New conversation"
  onClick={() => {
  setEditingMessageId(null);
  setFormData({ subject: '', content: '' });
  setReplyMode(false);
  setSendError('');
  setSendSuccess(false);
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
  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-semibold focus:border-ai-blue outline-none transition-colors"
  />
  </div>
  </div>

  <div className="flex-1 overflow-y-auto custom-scrollbar">
  {filteredMessages.length > 0 ? (
  filteredMessages.map((msg) => (
  <button
  key={msg.id}
  onClick={() => handleSelectMessage(msg)}
  className={`w-full min-w-0 p-4 sm:p-6 text-left border-b border-white/5 hover:bg-white/[0.02] transition-all relative group ${
  selectedMessage?.id === msg.id ? 'bg-white/[0.03]' : ''
  }`}
  >
  {hasUnreadIncoming(msg) && (
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-ai-blue"></div>
  )}
  <div className="flex justify-between items-start mb-2">
  <span className={`text-[8px] font-semibold ${msg.sender === 'USER' ? 'text-expert-green' : 'text-ai-blue'}`}>
  {msg.sender === 'USER' ? 'YOU' : 'SITEMENDR'}
  </span>
  <span className="text-[8px] font-bold text-medium-gray ">
  {new Date(msg.createdAt).toLocaleDateString()}
  </span>
  </div>
  <h3 className={`text-xs font-semibold truncate mb-1 ${
  hasUnreadIncoming(msg) ? 'text-white' : 'text-white/40'
  }`}>
  {msg.subject}
  </h3>
  <p className="text-[10px] text-white/20 font-medium line-clamp-1 opacity-60">
  {msg.content}
  </p>
  </button>
  ))
  ) : (
  <div className="h-full flex flex-col items-center justify-center p-10 text-center">
  <Inbox className="w-12 h-12 text-white/5 mb-4" />
  <p className="text-[10px] font-semibold text-white/20 leading-relaxed">
  No conversations yet. Start one with the Sitemendr team.
  </p>
  </div>
  )}
  </div>
  </div>

  {/* Message Content - Mobile view uses full screen when message selected */}
  <div className={`min-w-0 flex-1 bg-darker-bg lg:bg-white/[0.01] border border-white/5 rounded-2xl lg:rounded-[32px] overflow-hidden flex flex-col transition-all ${
  selectedMessage ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:flex'
  }`}>
  {selectedMessage ? (
  <>
  <div className="p-4 sm:p-6 lg:p-10 border-b border-white/5 bg-white/[0.01]">
  <div className="flex items-center gap-4 mb-8 lg:hidden">
  <button 
  onClick={() => setSelectedMessage(null)}
  className="p-2 bg-white/5 rounded-lg text-white/40"
  >
  <ChevronLeft className="w-5 h-5" />
  </button>
  <span className="text-[10px] font-semibold text-white/40">Message thread</span>
  </div>

  <div className="flex justify-between items-start gap-4">
  <div className="min-w-0 flex-1 space-y-4">
  <h2 className="break-words text-xl lg:text-2xl font-semibold text-white leading-tight">{selectedMessage.subject}</h2>
  <div className="flex flex-wrap items-center gap-4">
  <div className="flex items-center gap-2">
  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-semibold ${
  selectedMessage.sender === 'USER' ? 'bg-expert-green/20 text-expert-green' : 'bg-ai-blue/20 text-ai-blue'
  }`}>
  {selectedMessage.sender === 'USER' ? 'U' : 'S'}
  </div>
  <span className={`text-[10px] font-semibold ${
  selectedMessage.sender === 'USER' ? 'text-expert-green' : 'text-ai-blue'
  }`}>
  {selectedMessage.sender === 'USER' ? 'You' : 'Sitemendr team'}
  </span>
  </div>
  <span className="text-white/10">|</span>
  <div className="flex items-center gap-2 text-white/20">
  <Clock className="w-3.5 h-3.5" />
  <span className="text-[10px] font-bold ">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
  </div>
  </div>
  </div>
  </div>
  </div>
   
  <div className="flex-1 p-5 sm:p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-white/[0.01] space-y-5">
  {[selectedMessage, ...(selectedMessage.replies || [])].map(entry => (
    <div key={entry.id} className={`max-w-[92%] rounded-2xl border p-4 sm:max-w-[80%] ${entry.sender === 'USER' ? 'ml-auto border-ai-blue/20 bg-ai-blue/[0.08]' : 'border-white/10 bg-white/[0.025]'}`}>
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-white/75">{entry.content}</p>
      <p className="mt-2 text-[10px] text-white/35">{entry.sender === 'USER' ? 'You' : 'Sitemendr'} · {new Date(entry.createdAt).toLocaleString()}</p>
    </div>
  ))}
  </div>
   
  <div className="p-6 lg:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col sm:flex-row justify-between items-center gap-4">
  <div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
  <div className="w-1.5 h-1.5 bg-ai-blue rounded-full animate-pulse"></div>
  <p className="text-[9px] font-semibold text-ai-blue ">Conversation</p>
  </div>
  {selectedMessage.sender === 'USER' && !selectedMessage.replies?.length && (
  <button 
  onClick={() => handleEditMessage(selectedMessage)}
  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-semibold text-white/60 transition-all"
  >
  Edit message
  </button>
  )}
  </div>
  <button 
  onClick={() => handleReply(selectedMessage)}
  className="w-full sm:w-auto px-8 py-4 bg-ai-blue text-white font-semibold text-[10px] rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-ai-blue/20"
  >
  <Send className="w-4 h-4" />
  Reply to Sitemendr
  </button>
  </div>
  </>
  ) : (
  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
  <div className="w-24 h-24 rounded-[32px] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center mb-10 group-hover:rotate-12 transition-transform">
  <Mail className="w-10 h-10 text-white/10" />
  </div>
  <h3 className="text-sm font-semibold text-white/40 mb-4">Select a message</h3>
  <p className="text-[10px] font-semibold text-white/20 max-w-[200px] leading-relaxed">
  Choose a thread to read, reply, or continue the conversation.
  </p>
  </div>
  )}
  </div>

  {/* Compose Modal */}
  {showCompose && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
  <div className="absolute inset-0" onClick={() => {
  if (!isSending) {
  setShowCompose(false);
  setEditingMessageId(null);
  setReplyMode(false);
  }
  }}></div>
  <div className="bg-darker-bg border border-white/10 rounded-[40px] w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl">
  <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between">
  <h2 className="text-xl lg:text-2xl font-semibold text-white flex items-center gap-4">
  <Plus className="w-6 h-6 text-ai-blue" />
  {editingMessageId ? 'Update' : replyMode ? 'Reply to' : 'New'} <span className="text-ai-blue italic">{replyMode ? 'Sitemendr' : 'Message'}</span>
  </h2>
  <button 
  disabled={isSending}
  onClick={() => {
  setShowCompose(false);
  setEditingMessageId(null);
  setReplyMode(false);
  }} 
  className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-500 transition-all disabled:opacity-50"
  >
  <X className="w-5 h-5" />
  </button>
  </div>
   
  <form onSubmit={handleSendMessage} className="p-8 lg:p-10 space-y-8">
  {!replyMode && <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40 ml-1">Subject</label>
  <input 
  type="text"
  required
  disabled={isSending}
  placeholder="e.g. Deployment Question"
  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all disabled:opacity-50"
  value={formData.subject}
  onChange={(e) => setFormData({...formData, subject: e.target.value})}
  />
  </div>}
   
  <div className="space-y-3">
  <label className="text-[10px] font-semibold text-white/40 ml-1">Message</label>
  <textarea 
  required
  disabled={isSending}
  placeholder={replyMode ? 'Write your reply...' : 'Provide message details...'}
  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-ai-blue outline-none transition-all h-48 lg:h-64 resize-none leading-relaxed disabled:opacity-50"
  value={formData.content}
  onChange={(e) => setFormData({...formData, content: e.target.value})}
  />
  </div>

  {sendError && <p role="alert" className="text-sm text-rose-300">{sendError}</p>}

  <div className="flex flex-col sm:flex-row gap-4 pt-4">
  <button 
  type="button"
  disabled={isSending}
  onClick={() => {
  setShowCompose(false);
  setEditingMessageId(null);
  setReplyMode(false);
  }}
  className="order-2 sm:order-1 flex-1 py-5 border border-white/10 rounded-2xl font-semibold text-[10px] hover:bg-white/5 transition-all disabled:opacity-50"
  >
  Cancel
  </button>
  <button 
  type="submit" 
  disabled={isSending || sendSuccess}
  className={`order-1 sm:order-2 flex-[2] py-5 rounded-2xl font-semibold text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg ${
  sendSuccess 
  ? 'bg-expert-green text-dark-bg' 
  : 'bg-ai-blue text-white hover:scale-[1.02] active:scale-[0.98] shadow-ai-blue/20'
  } disabled:opacity-50`}
  >
  {isSending ? (
  <><Loader2 className="w-5 h-5 animate-spin" /> {editingMessageId ? 'Updating' : 'Sending'}...</>
  ) : sendSuccess ? (
  <><Check className="w-5 h-5" /> {editingMessageId ? 'Update' : 'Message'} sent</>
  ) : (
  <><Send className="w-5 h-5" /> {editingMessageId ? 'Save update' : 'Send message'}</>
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
