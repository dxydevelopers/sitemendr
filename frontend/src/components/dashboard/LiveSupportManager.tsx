import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageSquare, Send, User, Bot } from 'lucide-react';

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
  status: 'active' | 'waiting';
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
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('admin_join');
    });

    socketRef.current.on('active_sessions', (data: ChatSessionData[]) => {
      setSessions(data.map(s => ({
        chatId: s.chatId,
        type: s.type,
        timestamp: new Date(s.timestamp),
        messages: [],
        status: s.status as 'active' | 'waiting'
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
        if (prev.find(s => s.chatId === data.chatId)) return prev;
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
            messages: [...s.messages, { ...data, timestamp: new Date(data.timestamp) }]
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
    socketRef.current?.emit('join_chat', chatId);
    socketRef.current?.emit('agent_joined', { 
      chatId, 
      agentName: 'Support Agent', 
      type: sessions.find(s => s.chatId === chatId)?.type || 'technical'
    });
    
    setSessions(prev => prev.map(s => 
      s.chatId === chatId ? { ...s, status: 'active' } : s
    ));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChatId) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'agent',
      timestamp: new Date()
    };

    socketRef.current?.emit('send_message', {
      ...newMsg,
      chatId: selectedChatId
    });

    setSessions(prev => prev.map(s => {
      if (s.chatId === selectedChatId) {
        return {
          ...s,
          messages: [...s.messages, newMsg]
        };
      }
      return s;
    }));

    setMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  return (
    <div className="grid lg:grid-cols-12 gap-8 h-[700px] animate-fade-in font-mono">
      {/* Sessions List */}
      <div className="lg:col-span-4 flex flex-col bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-ai-blue">Live Chat</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="p-10 text-center opacity-30">
              <p className="text-[8px] font-black uppercase tracking-[0.2em]">No active signals...</p>
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
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    s.status === 'waiting' ? 'bg-orange-500/20 text-orange-500' : 'bg-expert-green/20 text-expert-green'
                  }`}>
                    {s.status}
                  </span>
                  <span className="text-[7px] font-mono text-medium-gray uppercase">
                    {s.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="text-[11px] font-black uppercase tracking-tight mb-1">REQ_TYPE: {s.type}</h4>
                <p className="text-[9px] text-medium-gray font-mono uppercase truncate">ID: {s.chatId}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden flex flex-col relative">
        {activeChat ? (
          <>
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-expert-green animate-pulse"></span>
                  Active Transmission: {activeChat.chatId}
                </h3>
                <p className="text-[9px] font-mono text-medium-gray uppercase">PROTOCOL: {activeChat.type.toUpperCase()}_SUPPORT</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
              {activeChat.messages.length === 0 && (
                <div className="flex justify-center italic text-medium-gray text-[10px] uppercase">
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
                        <p className="text-[11px] font-medium uppercase tracking-wide">{msg.text}</p>
                      </div>
                      <span className="text-[7px] font-mono text-medium-gray uppercase">
                        {msg.sender.toUpperCase()} | {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-8 border-t border-white/5">
              <div className="relative">
                <input
                  placeholder="Type your response..."
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-6 pr-16 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue/50"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-ai-blue text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-ai-blue/20 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-20">
            <div className="w-20 h-20 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-3">Signal Intercept Pending</h3>
            <p className="text-[9px] font-medium uppercase max-w-[250px] leading-relaxed tracking-widest">Select a frequency from the transceiver to begin authorized communication</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSupportManager;
