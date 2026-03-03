import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { MessageSquare, Search, Send, User, Cpu } from 'lucide-react';

interface SupportMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: { email: string };
  client?: { email: string };
  messages?: SupportMessage[];
}

const SupportManager: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await apiClient.getAdminSupportTickets() as unknown as { success: boolean; data: SupportTicket[] };
      if (res.success) setTickets(res.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await apiClient.getAdminSupportTicket(id) as unknown as { success: boolean; data: SupportTicket };
      if (res.success) setSelectedTicket(res.data);
    } catch (error) {
      console.error('Failed to fetch ticket details', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateSupportTicket(id, { status });
      fetchTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (error) {
      console.error('Failed to update ticket', error);
    }
  };

  const handleSendResponse = async () => {
    if (!response.trim() || !selectedTicket) return;
    
    try {
      const res = await apiClient.addAdminSupportMessage(selectedTicket.id, response);
      if (res.success) {
        setResponse('');
        fetchTicketDetails(selectedTicket.id);
        if (selectedTicket.status.toLowerCase() === 'open') {
          handleUpdateStatus(selectedTicket.id, 'replied');
        }
      }
    } catch (error) {
      console.error('Failed to send response', error);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter.toUpperCase() === 'ALL' || t.status.toUpperCase() === filter.toUpperCase();
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || 
                         t.client?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] mb-1">Support_Intelligence</span>
        <h2 className="text-sm font-black tracking-widest flex items-center gap-3 uppercase">
          <span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>
          Terminal Support Nexus
        </h2>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 h-[700px]">
        {/* Ticket List Panel */}
        <div className="lg:col-span-4 flex flex-col bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden">
          <div className="p-6 border-b border-white/5 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
              <input 
                placeholder="Search..."
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {['all', 'open', 'replied', 'resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                    filter === f ? 'bg-ai-blue text-white' : 'bg-white/5 text-medium-gray hover:bg-white/10'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {loading ? (
              <div className="p-10 text-center animate-pulse opacity-30">
                <div className="w-8 h-8 border-2 border-ai-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">Synchronizing...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-10 text-center opacity-30">
                <p className="text-[8px] font-black uppercase tracking-[0.2em]">No logs found</p>
              </div>
            ) : (
              filteredTickets.map(t => (
                <button
                  key={t.id}
                  onClick={() => fetchTicketDetails(t.id)}
                  className={`w-full text-left p-5 rounded-2xl border transition-all ${
                    selectedTicket?.id === t.id 
                      ? 'bg-ai-blue/10 border-ai-blue/30' 
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                      t.priority.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-500' :
                      t.priority.toLowerCase() === 'medium' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-ai-blue/20 text-ai-blue'
                    }`}>
                      {t.priority}
                    </span>
                    <span className="text-[7px] font-mono text-medium-gray uppercase">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-tight mb-1 truncate">{t.subject}</h4>
                  <p className="text-[9px] text-medium-gray font-medium uppercase truncate">{t.user?.email || t.client?.email}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="lg:col-span-8 bg-white/[0.01] border border-white/5 rounded-[32px] overflow-hidden flex flex-col">
          {selectedTicket ? (
            <>
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-black uppercase tracking-widest">{selectedTicket.subject}</h3>
                    <div className={`w-2 h-2 rounded-full ${
                      selectedTicket.status.toUpperCase() === 'RESOLVED' ? 'bg-expert-green' : 'bg-orange-500 animate-pulse'
                    }`}></div>
                  </div>
                  <p className="text-[9px] font-mono text-medium-gray uppercase">TICKET_ID: {selectedTicket.id.slice(0,8)}</p>
                </div>
                <div className="flex gap-3">
                  {selectedTicket.status.toUpperCase() !== 'RESOLVED' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                      className="px-6 py-2.5 bg-expert-green text-dark-bg font-black text-[9px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selectedTicket.status.toUpperCase() === 'RESOLVED' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'OPEN')}
                      className="px-6 py-2.5 bg-white/10 text-white font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                    >
                      Reopen Ticket
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/20">
                {selectedTicket.messages?.map((msg: SupportMessage) => (
                  <div key={msg.id} className={`flex gap-5 max-w-[80%] ${msg.isAdmin ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.isAdmin 
                        ? 'bg-tech-purple/20 border-tech-purple/30' 
                        : 'bg-ai-blue/20 border-ai-blue/30'
                    }`}>
                      {msg.isAdmin ? <Cpu className="w-5 h-5 text-tech-purple" /> : <User className="w-5 h-5 text-ai-blue" />}
                    </div>
                    <div className={`space-y-2 ${msg.isAdmin ? 'text-right' : ''}`}>
                      <div className={`p-6 rounded-[24px] border ${
                        msg.isAdmin 
                          ? 'bg-tech-purple/5 border-tech-purple/10 rounded-tr-none' 
                          : 'bg-white/[0.03] border-white/5 rounded-tl-none'
                      }`}>
                        <p className="text-[11px] font-medium uppercase leading-relaxed text-white/80">{msg.content}</p>
                      </div>
                      <span className="text-[8px] font-mono text-medium-gray uppercase mx-1">
                        {msg.isAdmin ? 'STAFF' : 'CLIENT'}{' // '}{new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Status Indicator */}
                <div className="flex items-center justify-center pt-4">
                  <div className="px-6 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[7px] font-black text-medium-gray uppercase tracking-[0.4em]">Status: {selectedTicket.status}</span>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white/[0.01] border-t border-white/5">
                <div className="relative">
                  <textarea
                    placeholder="Compose your response..."
                    className="w-full bg-white/[0.02] border border-white/5 rounded-[24px] p-6 pr-20 text-[11px] font-medium uppercase tracking-wider focus:outline-none focus:border-ai-blue/50 resize-none"
                    rows={3}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                  />
                  <button 
                    onClick={handleSendResponse}
                    disabled={!response.trim()}
                    className="absolute bottom-6 right-6 p-4 bg-ai-blue text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-ai-blue/20 disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="mt-4 text-[8px] font-mono text-medium-gray text-center uppercase tracking-widest opacity-50">Authorized Personnel Only - System Logs Active</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-20">
              <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-[0.4em] mb-4">Awaiting Signal</h3>
              <p className="text-[9px] font-medium uppercase max-w-[280px] leading-relaxed tracking-widest">Select a support transmission from the registry to initialize communication</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportManager;
