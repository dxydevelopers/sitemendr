import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Send, User, Bot, CheckCircle2 } from 'lucide-react';

interface ChatSessionData {
  chatId: string;
  type: string;
  timestamp: string;
  status: string;
}

interface ChatSession {
  chatId: string;
  type: string;
  timestamp: Date;
  messages: Message[];
  status: 'active' | 'waiting' | 'closed';
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
}

const LiveSupportManager: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);
  const [message, setMessage] = useState('');
  const [chatError, setChatError] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = sessions.find(s => s.chatId === selectedChatId);

  useEffect(() => {
  selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
  let socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  // Remove /api from the end for socket connection
  socketUrl = socketUrl.replace(/\/api$/, '');
  const authToken = localStorage.getItem('sitemendr_auth_token') || localStorage.getItem('token');
  socketRef.current = io(socketUrl, { auth: authToken ? { token: authToken } : {} });

  socketRef.current.on('connect', () => {
  setConnected(true);
  socketRef.current?.emit('admin_join', (result: { success: boolean; message?: string }) => {
  if (!result?.success) setChatError(result?.message || 'Admin support access could not be verified.');
  else setChatError('');
  });
  });
  socketRef.current.on('disconnect', () => setConnected(false));
  socketRef.current.on('connect_error', () => { setConnected(false); setChatError('Live chat connection failed. Check the API connection and sign-in.'); });

  socketRef.current.on('active_sessions', (data: ChatSessionData[]) => {
  setSessions(current => data.map(s => ({
  chatId: s.chatId,
  type: s.type,
  timestamp: new Date(s.timestamp),
  messages: current.find(existing => existing.chatId === s.chatId)?.messages || [],
  status: s.status as 'active' | 'waiting' | 'closed'
  })));
  });

  socketRef.current.on('chat_history', (messages: Message[]) => {
  setSessions(prev => prev.map(s => {
  if (s.chatId === selectedChatIdRef.current) {
  return {
  ...s,
  messages: messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))
  };
  }
  return s;
  }));
  });

  socketRef.current.on('new_support_request', (data: { chatId: string, type: string, timestamp: string }) => {
  setSessions(prev => {
  if (prev.find(s => s.chatId === data.chatId)) return prev.map(s => s.chatId === data.chatId
  ? { ...s, type: data.type, timestamp: new Date(data.timestamp), status: 'waiting' }
  : s);
  return [...prev, {
  chatId: data.chatId,
  type: data.type,
  timestamp: new Date(data.timestamp),
  messages: [],
  status: 'waiting'
  }];
  });
  });

  socketRef.current.on('receive_message', (data: Message & { chatId: string }) => {
  setSessions(prev => prev.map(s => {
  if (s.chatId === data.chatId) {
  return {
  ...s,
  messages: s.messages.some(message => message.id === data.id) ? s.messages : [...s.messages, { ...data, timestamp: new Date(data.timestamp) }]
  };
  }
  return s;
  }));
  });

  return () => {
  socketRef.current?.disconnect();
  };
  }, []);

  const joinChat = (chatId: string) => {
  setSelectedChatId(chatId);
  setChatError('');
  if (!socketRef.current?.connected || !connected) { setChatError('Live chat is disconnected. Reconnect before opening a conversation.'); return; }
  socketRef.current.emit('join_chat', chatId, (result: { success: boolean; message?: string }) => {
  if (!result?.success) { setChatError(result?.message || 'Could not open this conversation.'); return; }
  if (sessions.find(session => session.chatId === chatId)?.status === 'closed') return;
  socketRef.current?.emit('agent_joined', { chatId }, (joined: { success: boolean; message?: string }) => {
  if (!joined?.success) { setChatError(joined?.message || 'Could not join this conversation.'); return; }
  setSessions(prev => prev.map(s => s.chatId === chatId ? { ...s, status: 'active' } : s));
  });
  });
  };

  const handleSendMessage = (e: React.FormEvent) => {
  e.preventDefault();
  const content = message.trim();
  if (!content || !selectedChatId || sending) return;
  if (!socketRef.current?.connected) { setChatError('Live chat is disconnected. The reply was not sent.'); return; }
  setSending(true); setChatError('');
  socketRef.current.emit('send_message', { chatId: selectedChatId, text: content }, (result: { success: boolean; data?: Message; message?: string }) => {
  setSending(false);
  if (!result?.success || !result.data) { setChatError(result?.message || 'The reply could not be sent.'); return; }
  setSessions(prev => prev.map(s => s.chatId === selectedChatId
  ? { ...s, messages: s.messages.some(item => item.id === result.data?.id) ? s.messages : [...s.messages, { ...result.data!, timestamp: new Date(result.data!.timestamp) }] }
  : s));
  setMessage('');
  });
  };

  const closeChat = () => {
  if (!selectedChatId || activeChat?.status === 'closed' || !socketRef.current?.connected || !window.confirm('Close this live support conversation? The history will remain available to admins.')) return;
  setChatError('');
  socketRef.current.emit('close_chat', { chatId: selectedChatId }, (result: { success: boolean; message?: string }) => {
  if (!result?.success) { setChatError(result?.message || 'Could not close this conversation.'); return; }
  setSessions(prev => prev.filter(session => session.chatId !== selectedChatId));
  setSelectedChatId(null);
  });
  };

  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  return (
  <div className="grid lg:grid-cols-12 gap-8 h-[700px] animate-fade-in font-mono">
  {/* Sessions List */}
  <div className="lg:col-span-4 flex flex-col bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden">
  <div className="p-6 border-b border-white/5">
  <h3 className="text-xs font-semibold text-ai-blue">Live Chat</h3>
  <p className={`mt-2 text-[10px] ${connected ? 'text-emerald-300/70' : 'text-amber-200/70'}`}>{connected ? 'Connected to support queue' : 'Connecting to support…'}</p>
  </div>
  <div className="flex-1 overflow-y-auto p-4 space-y-3">
  {sessions.length === 0 ? (
  <div className="p-10 text-center opacity-30">
  <p className="text-[8px] font-semibold ">No active signals...</p>
  </div>
  ) : (
  sessions.map(s => (
  <button
  key={s.chatId}
  onClick={() => joinChat(s.chatId)}
  className={`w-full text-left p-5 rounded-2xl border transition-all ${
  selectedChatId === s.chatId 
  ? 'bg-ai-blue/10 border-ai-blue/30' 
  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
  }`}
  >
  <div className="flex justify-between items-start mb-2">
  <span className={`text-[8px] font-semibold px-2 py-0.5 rounded ${
  s.status === 'waiting' ? 'bg-orange-500/20 text-orange-500' : s.status === 'closed' ? 'bg-white/10 text-white/45' : 'bg-expert-green/20 text-expert-green'
  }`}>
  {s.status}
  </span>
  <span className="text-[7px] font-mono text-medium-gray ">
  {s.timestamp.toLocaleTimeString()}
  </span>
  </div>
  <h4 className="text-[11px] font-semibold mb-1">REQ_TYPE: {s.type}</h4>
  <p className="text-[9px] text-medium-gray font-mono truncate">ID: {s.chatId}</p>
  </button>
  ))
  )}
  </div>
  </div>

  {/* Chat Interface */}
  <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden flex flex-col relative">
  {activeChat ? (
  <>
  <div className="p-5 sm:p-8 border-b border-white/5 flex flex-wrap justify-between items-center gap-4 bg-white/[0.01]">
  <div>
  <h3 className="text-sm font-semibold flex items-center gap-3">
  <span className="w-1.5 h-1.5 rounded-full bg-expert-green animate-pulse"></span>
  {activeChat.status === 'closed' ? 'Closed conversation' : activeChat.status === 'waiting' ? 'Waiting for agent' : 'Active chat'}: {activeChat.chatId}
  </h3>
  <p className="text-[9px] font-mono text-medium-gray ">Queue: {activeChat.type.toUpperCase()} support</p>
  </div>
  {activeChat.status !== 'closed' && <button type="button" onClick={closeChat} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/65 transition hover:border-emerald-300/25 hover:bg-emerald-300/[.06] hover:text-emerald-200"><CheckCircle2 className="h-4 w-4" />Close chat</button>}
  </div>

  <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
  {activeChat.messages.length === 0 && (
  <div className="flex justify-center italic text-medium-gray text-[10px] ">
  Initializing secure channel...
  </div>
  )}
  {activeChat.messages.map((msg, i) => (
  <div key={i} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
  <div className={`flex gap-4 max-w-[80%] ${msg.sender === 'agent' ? 'flex-row-reverse' : 'flex-row'}`}>
  <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
  msg.sender === 'agent' ? 'bg-ai-blue/20 border-ai-blue/30' : 'bg-white/5 border-white/10'
  }`}>
  {msg.sender === 'agent' ? <User className="w-4 h-4 text-ai-blue" /> : <Bot className="w-4 h-4" />}
  </div>
  <div className={`space-y-1 ${msg.sender === 'agent' ? 'items-end' : 'items-start'}`}>
  <div className={`p-4 rounded-2xl ${
  msg.sender === 'agent' 
  ? 'bg-ai-blue text-white rounded-tr-none' 
  : 'bg-white/5 border border-white/10 rounded-tl-none'
  }`}>
  <p className="text-[11px] font-medium ">{msg.text}</p>
  </div>
  <span className="text-[7px] font-mono text-medium-gray ">
  {msg.sender.toUpperCase()} | {msg.timestamp.toLocaleTimeString()}
  </span>
  </div>
  </div>
  </div>
  ))}
  <div ref={messagesEndRef} />
  </div>

  {chatError && <p role="alert" className="mx-6 mb-2 rounded-lg border border-rose-300/15 bg-rose-300/[.05] px-3 py-2 text-xs text-rose-200">{chatError}</p>}
  {activeChat.status === 'closed' ? <div className="border-t border-white/5 p-5 text-center text-xs text-white/40">This conversation is closed. Its history is read-only.</div> : <form onSubmit={handleSendMessage} className="p-8 border-t border-white/5">
  <div className="relative">
  <input
  placeholder="Type your response..."
  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-6 pr-16 text-[11px] font-semibold focus:outline-none focus:border-ai-blue/50"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  />
  <button 
  type="submit"
  disabled={!message.trim() || sending || !connected}
  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-ai-blue text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50"
  >
  <Send className="w-4 h-4" />
  </button>
  </div>
  </form>}
  </>
  ) : (
  <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-20">
  <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
  <MessageSquare className="w-8 h-8" />
  </div>
  <h3 className="text-xs font-semibold mb-3">Signal Intercept Pending</h3>
  <p className="text-[9px] font-medium max-w-[250px] leading-relaxed ">Select a frequency from the transceiver to begin authorized communication</p>
  </div>
  )}
  </div>
  </div>
  );
};

export default LiveSupportManager;
