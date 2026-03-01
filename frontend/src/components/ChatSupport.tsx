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
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [agentType, setAgentType] = useState<string | null>(null);
  const [chatId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sitemendr_chat_id');
      if (stored) return stored;
      const newId = Math.random().toString(36).substring(7);
      localStorage.setItem('sitemendr_chat_id', newId);
      return newId;
    }
    return Math.random().toString(36).substring(7);
  });
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => {
      socketRef.current?.emit('join_chat', chatId);
    });

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
      setMessages(prev => [...prev, { ...data, timestamp: new Date(data.timestamp) }]);
    });

    socketRef.current.on('agent_joined', (data: { agentName: string, type: string }) => {
      setIsAgentConnected(true);
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
  }, [chatId]);

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
    
    if (!message.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');

    if (isAgentConnected) {
      socketRef.current?.emit('send_message', {
        ...userMsg,
        chatId
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare history for API (last 5 messages for context)
      const history = messages
        .slice(-5)
        .map(msg => ({
          sender: msg.sender === 'bot' ? 'assistant' : 'user',
          text: msg.text
        }));

      const response = await apiClient.chatWithSupport(message, history);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMsg]);
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
    setIsLoading(true);
    socketRef.current?.emit('request_agent', { chatId, type });
    
    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now().toString(),
        text: `I've forwarded your request to our ${type} team. A human agent will be with you shortly. You can continue to chat with me in the meantime.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsLoading(false);
    }, 1000);
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
              {isAgentConnected ? `Agent (${agentType})` : 'Sitemendr Assistant'}
            </h3>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isAgentConnected ? 'bg-blue-400' : 'bg-expert-green'}`}></span>
              <span className="text-[10px] text-white/80">
                {isAgentConnected ? 'Human Agent Online' : 'AI Assistant Online'}
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
          {!isAgentConnected && (
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
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full pl-4 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-ai-blue outline-none transition-all placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-ai-blue text-white rounded-lg disabled:opacity-50 disabled:bg-gray-600 transition-all hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[9px] text-center text-white/30 mt-2 flex items-center justify-center gap-1 uppercase tracking-widest">
              <span className="w-1 h-1 bg-ai-blue rounded-full animate-pulse"></span>
              Live Support Active
            </p>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatSupport;
