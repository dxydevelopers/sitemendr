'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { 
  MessageSquare, 
  X, 
  Send, 
  Minus, 
  Loader2, 
  User, 
  Bot
} from 'lucide-react';

interface ChatHistoryItem {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface ChatMessageData {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'agent';
  timestamp: Date;
}

interface SupportChatCredentials { chatId: string; chatToken: string }

const isUnexpiredSupportToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 60_000;
  } catch { return false; }
};

const ChatSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm the Sitemendr AI Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [chatCredentials, setChatCredentials] = useState<SupportChatCredentials | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [isHumanSupportRequested, setIsHumanSupportRequested] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [agentType, setAgentType] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      const cachedChatId = localStorage.getItem('sitemendr_chat_id');
      const cachedChatToken = localStorage.getItem('sitemendr_chat_token');
      if (cachedChatId && cachedChatToken && isUnexpiredSupportToken(cachedChatToken)) {
        setChatCredentials({ chatId: cachedChatId, chatToken: cachedChatToken });
        return;
      }
      try {
        const response = await apiClient.createSupportChatSession();
        if (!response.success || !response.data?.chatId || !response.data?.chatToken) throw new Error(response.message || 'Support chat is temporarily unavailable.');
        if (cancelled) return;
        localStorage.setItem('sitemendr_chat_id', response.data.chatId);
        localStorage.setItem('sitemendr_chat_token', response.data.chatToken);
        setChatCredentials(response.data);
        setChatError('');
      } catch (error) {
        if (!cancelled) setChatError(error instanceof Error ? error.message : 'Support chat is temporarily unavailable.');
      }
    };
    void initialize();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!chatCredentials) return;
    // Initialize socket connection
    let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Remove /api from the end for socket connection if using API URL as fallback
    if (!process.env.NEXT_PUBLIC_SOCKET_URL && socketUrl.includes('/api')) {
      socketUrl = socketUrl.replace(/\/api$/, '');
    }
    const authToken = localStorage.getItem('sitemendr_auth_token') || localStorage.getItem('token');
    socketRef.current = io(socketUrl, { auth: { chatToken: chatCredentials.chatToken, ...(authToken ? { token: authToken } : {}) } });

    socketRef.current.on('connect', () => {
      setIsSocketConnected(true);
      socketRef.current?.emit('join_chat', { chatId: chatCredentials.chatId }, (result: { success: boolean; status?: string; type?: string; message?: string }) => {
        if (!result?.success) setChatError(result?.message || 'Could not open support chat.');
        else {
          setChatError('');
          const humanRequested = result.status === 'waiting' || (result.status === 'active' && result.type !== 'general');
          setIsHumanSupportRequested(humanRequested);
          setIsAgentConnected(humanRequested && result.status === 'active');
          setAgentType(humanRequested ? result.type || null : null);
        }
      });
    });
    socketRef.current.on('disconnect', () => setIsSocketConnected(false));
    socketRef.current.on('connect_error', () => { setIsSocketConnected(false); setChatError('Live chat is disconnected. Check your connection and try again.'); });

    socketRef.current.on('chat_history', (history: ChatHistoryItem[]) => {
      if (history.length > 0) {
        setMessages(history.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender as 'user' | 'bot' | 'agent',
          timestamp: new Date(msg.timestamp)
        })));
      }
    });

    socketRef.current.on('receive_message', (data: ChatMessageData) => {
      setMessages(prev => prev.some(item => item.id === data.id) ? prev : [...prev, { ...data, timestamp: new Date(data.timestamp) }]);
    });

    socketRef.current.on('message_sent', (data: ChatMessageData) => {
      setMessages(prev => prev.some(item => item.id === data.id) ? prev : [...prev, { ...data, timestamp: new Date(data.timestamp) }]);
    });

    socketRef.current.on('chat_closed', () => {
      setIsChatClosed(true);
      setIsAgentConnected(false);
      setIsHumanSupportRequested(false);
    });

    socketRef.current.on('agent_joined', (data: { agentName: string, type: string }) => {
      setIsAgentConnected(true);
      setIsHumanSupportRequested(true);
      setAgentType(data.type);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `${data.agentName} (${data.type} agent) has joined the chat.`,
        sender: 'bot',
        timestamp: new Date()
      }]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [chatCredentials]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = message.trim();
    if (!content || isLoading) return;
    if (isChatClosed) { setChatError('This support conversation has been closed. Please open a support ticket for further help.'); return; }
    if (!chatCredentials) {
      setChatError('Support chat is still connecting. Please try again in a moment.');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessage('');

    if (isAgentConnected || isHumanSupportRequested) {
      if (!socketRef.current?.connected) {
        setChatError('Live chat is disconnected. Your message was not sent.');
        setMessage(content);
        return;
      }
      setIsLoading(true);
      socketRef.current.emit('send_message', { chatId: chatCredentials.chatId, text: content }, (result: { success: boolean; data?: ChatMessageData; message?: string }) => {
        setIsLoading(false);
        if (!result?.success || !result.data) {
          setChatError(result?.message || 'Your message could not be sent.');
          setMessage(content);
          return;
        }
        setChatError('');
        setMessages(prev => prev.some(item => item.id === result.data?.id) ? prev : [...prev, { ...result.data!, timestamp: new Date(result.data!.timestamp) }]);
      });
      return;
    }

    setIsLoading(true);
    setMessages(prev => [...prev, userMsg]);

    try {
      // Prepare history for API (last 5 messages for context)
      const history = messages
        .slice(-5)
        .map(msg => ({
          sender: msg.sender === 'bot' ? 'assistant' : 'user',
          text: msg.text
        }));

      const response = await apiClient.chatWithSupport(content, history, chatCredentials.chatId, chatCredentials.chatToken);
      if (!response.success) throw new Error(response.message || 'The assistant could not respond.');
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
      setChatError('');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later or email us at support@sitemendr.com",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHumanAgent = (type: 'technical' | 'billing' | 'sales') => {
    if (!chatCredentials || !socketRef.current?.connected) {
      setChatError('Live chat is disconnected. Please try again when connected.');
      return;
    }
    setIsLoading(true);
    setChatError('');
    socketRef.current.emit('request_agent', { chatId: chatCredentials.chatId, type }, (result: { success: boolean; message?: string }) => {
      if (!result?.success) {
        setChatError(result?.message || 'Your request could not be sent.');
        setIsLoading(false);
        return;
      }
      setIsHumanSupportRequested(true);
      const botMsg: Message = {
        id: Date.now().toString(),
        text: `Your request is in the ${type} support queue. A Sitemendr agent will join this conversation here.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-all duration-300 z-[100] group"
        aria-label="Open support chat"
      >
        <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 bg-darker-bg sm:rounded-2xl shadow-2xl border-t sm:border border-white/10 overflow-hidden transition-all duration-300 z-[100] flex flex-col ${
        isMinimized ? 'h-14 sm:h-16' : 'h-[100dvh] sm:h-[500px]'
      } ${!isOpen && 'hidden'}`}
    >
      {/* Header */}
      <div className="bg-ai-blue p-4 text-white flex items-center justify-between cursor-pointer" onClick={() => isMinimized && setIsMinimized(false)}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {isAgentConnected ? `Support agent · ${agentType}` : isHumanSupportRequested ? `Support queue · ${agentType}` : 'Sitemendr Assistant'}
            </h3>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isAgentConnected ? 'bg-blue-400' : 'bg-expert-green'}`}></span>
              <span className="text-[10px] text-white/80">
                {isAgentConnected ? 'Human agent online' : isHumanSupportRequested ? 'Waiting for an agent' : 'AI assistant online'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Minus size={18} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-bg/50 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                    msg.sender === 'user' ? 'bg-ai-blue text-white' : 
                    msg.sender === 'agent' ? 'bg-expert-green text-black' : 'bg-white/10 text-white/60'
                  }`}>
                    {msg.sender === 'user' ? <User size={14} /> : msg.sender === 'agent' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-ai-blue text-white rounded-tr-none' 
                      : msg.sender === 'agent'
                      ? 'bg-expert-green text-black rounded-tl-none font-medium'
                      : 'bg-white/5 text-light-text border border-white/10 rounded-tl-none shadow-sm backdrop-blur-sm'
                  }`}>
                    {msg.text}
                    <div className={`text-[10px] mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-white/40'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-white/10 text-white/60 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 shadow-sm">
                    <Loader2 size={16} className="animate-spin text-ai-blue" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {!isAgentConnected && !isChatClosed && (
            <div className="px-4 py-2 bg-dark-bg/80 flex flex-wrap gap-2 border-t border-white/5">
              {['Pricing', 'Technical Support', 'Billing', 'Talk to Human'].map((topic) => (
                <button
                  key={topic}
                  onClick={() => {
                    if (topic === 'Talk to Human') {
                      requestHumanAgent('technical');
                    } else if (topic === 'Billing') {
                      requestHumanAgent('billing');
                    } else {
                      setMessage(`Tell me about ${topic.toLowerCase()}...`);
                    }
                  }}
                  className="text-[10px] px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/80 hover:border-ai-blue hover:text-ai-blue transition-all font-medium"
                >
                  {topic}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-darker-bg">
            {chatError && <p role="alert" className="mb-3 rounded-lg border border-rose-300/15 bg-rose-300/[.05] px-3 py-2 text-xs text-rose-200">{chatError}</p>}
            {isChatClosed && <p role="status" className="mb-3 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-white/55">This conversation is closed. Please sign in to your workspace to open a support ticket.</p>}
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isChatClosed}
                className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-ai-blue outline-none transition-all placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading || isChatClosed}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-ai-blue text-white rounded-lg disabled:opacity-50 disabled:bg-gray-600 transition-all hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[9px] text-center text-white/30 mt-2 flex items-center justify-center gap-1 uppercase tracking-widest">
              <span className={`w-1 h-1 rounded-full ${isSocketConnected ? 'bg-ai-blue animate-pulse' : 'bg-amber-300'}`}></span>
              {isSocketConnected ? 'Support chat connected' : 'Connecting to support'}
            </p>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatSupport;
