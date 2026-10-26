import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../lib/api';
import { MessageSquare, Search, Send, User, Cpu, Loader2, ArrowLeft } from 'lucide-react';

interface SupportMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  isRead?: boolean;
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
  _count?: { messages: number };
}

const SupportManager: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [actionError, setActionError] = useState('');
  const [working, setWorking] = useState(false);
  const selectedTicketIdRef = useRef<string | null>(null);
  selectedTicketIdRef.current = selectedTicket?.id || null;

  useEffect(() => {
  void fetchTickets();
  const refreshSupport = () => {
    void fetchTickets();
    if (selectedTicketIdRef.current) void fetchTicketDetails(selectedTicketIdRef.current);
  };
  window.addEventListener('sitemendr:support-ticket-update', refreshSupport);
  return () => window.removeEventListener('sitemendr:support-ticket-update', refreshSupport);
  }, []);

  const fetchTickets = async () => {
  try {
  const res = await apiClient.getAdminSupportTickets() as unknown as { success: boolean; data: SupportTicket[] };
  if (res.success) { setTickets(res.data); setActionError(''); }
  else setActionError('Support tickets could not be loaded.');
  } catch (error) {
  console.error('Failed to fetch tickets', error);
  setActionError(error instanceof Error ? error.message : 'Support tickets could not be loaded.');
  } finally {
  setLoading(false);
  }
  };

  const fetchTicketDetails = async (id: string) => {
  try {
  const res = await apiClient.getAdminSupportTicket(id) as unknown as { success: boolean; data: SupportTicket };
  if (res.success) {
  let ticket = res.data;
  if (ticket.messages?.some(message => !message.isAdmin && !message.isRead)) {
  await apiClient.markAdminSupportTicketRead(id);
  ticket = { ...ticket, messages: ticket.messages.map(message => message.isAdmin ? message : { ...message, isRead: true }) };
  }
  setSelectedTicket(ticket);
  await fetchTickets();
  } else {
  setActionError('The support ticket could not be opened.');
  }
  } catch (error) {
  console.error('Failed to fetch ticket details', error);
  setActionError(error instanceof Error ? error.message : 'The support ticket could not be opened.');
  }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
  setWorking(true); setActionError('');
  try {
  const normalizedStatus = status.toLowerCase();
  const result = await apiClient.updateSupportTicket(id, { status: normalizedStatus });
  if (!result.success) throw new Error(result.message || 'Ticket status could not be updated.');
  await fetchTickets();
  if (selectedTicket?.id === id) {
  setSelectedTicket({ ...selectedTicket, status: normalizedStatus });
  }
  } catch (error) {
  console.error('Failed to update ticket', error);
  setActionError(error instanceof Error ? error.message : 'Ticket status could not be updated.');
  } finally {
  setWorking(false);
  }
  };

  const handleUpdatePriority = async (id: string, priority: string) => {
  setWorking(true); setActionError('');
  try {
  const result = await apiClient.updateSupportTicket(id, { priority });
  if (!result.success) throw new Error(result.message || 'Ticket priority could not be updated.');
  setTickets(current => current.map(ticket => ticket.id === id ? { ...ticket, priority } : ticket));
  setSelectedTicket(current => current?.id === id ? { ...current, priority } : current);
  } catch (error) {
  setActionError(error instanceof Error ? error.message : 'Ticket priority could not be updated.');
  } finally { setWorking(false); }
  };

  const handleSendResponse = async () => {
  if (!response.trim() || !selectedTicket) return;
  setWorking(true); setActionError('');
  try {
  const res = await apiClient.addAdminSupportMessage(selectedTicket.id, response);
  if (!res.success) throw new Error(res.message || 'The reply could not be sent.');
  setResponse('');
  await fetchTicketDetails(selectedTicket.id);
  await fetchTickets();
  } catch (error) {
  console.error('Failed to send response', error);
  setActionError(error instanceof Error ? error.message : 'The reply could not be sent.');
  } finally { setWorking(false); }
  };

  const filteredTickets = tickets.filter(t => {
  const matchesFilter = filter.toUpperCase() === 'ALL' || t.status.toUpperCase() === filter.toUpperCase();
  const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
  t.user?.email?.toLowerCase().includes(search.toLowerCase()) || t.client?.email?.toLowerCase().includes(search.toLowerCase());
  return matchesFilter && matchesSearch;
  });

  return (
  <div className="space-y-5 animate-fade-in">
  {actionError && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/[.05] px-4 py-3 text-xs text-rose-200">{actionError}</p>}
  <div className="flex flex-col"><h2 className="text-lg font-semibold text-white">Support tickets</h2><p className="mt-1 text-xs text-white/45">Review client requests, update priority and status, and keep every reply in its ticket.</p></div>

  <div className={`grid min-h-[500px] h-[calc(100dvh-13rem)] max-h-[820px] grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6 ${selectedTicket ? 'relative' : ''}`}>
  {/* Ticket List Panel */}
  <div className={`min-h-0 min-w-0 flex-col bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden lg:col-span-4 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
  <div className="p-6 border-b border-white/5 space-y-4">
  <div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-medium-gray" />
  <input 
  placeholder="Search..."
  className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[10px] font-semibold focus:outline-none focus:border-ai-blue/50"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  />
  </div>
  <div className="flex gap-2">
  {['all', 'open', 'pending', 'resolved', 'closed'].map(f => (
  <button
  key={f}
  onClick={() => setFilter(f)}
  className={`flex-1 py-2 rounded-lg text-[8px] font-semibold transition-all ${
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
  <p className="text-[8px] font-semibold ">Synchronizing...</p>
  </div>
  ) : filteredTickets.length === 0 ? (
  <div className="p-10 text-center opacity-30">
  <p className="text-[8px] font-semibold ">No logs found</p>
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
  <span className={`text-[8px] font-semibold px-2 py-0.5 rounded ${
  t.priority.toLowerCase() === 'high' ? 'bg-red-500/20 text-red-500' :
  t.priority.toLowerCase() === 'medium' ? 'bg-orange-500/20 text-orange-500' :
  'bg-ai-blue/20 text-ai-blue'
  }`}>
  {t.priority}
  </span>
  <span className="text-[7px] font-mono text-medium-gray ">
  {new Date(t.createdAt).toLocaleDateString()}
  </span>
  </div>
  <h4 className="text-[11px] font-semibold mb-1 truncate">{t.subject}</h4>
  <p className="text-[9px] text-medium-gray font-medium truncate">{t.user?.email || t.client?.email}</p>
  {Boolean(t._count?.messages) && <span className="mt-2 inline-flex rounded-full bg-sky-300/10 px-2 py-1 text-[9px] font-semibold text-sky-200">{t._count?.messages} unread client {t._count?.messages === 1 ? 'reply' : 'replies'}</span>}
  </button>
  ))
  )}
  </div>
  </div>

  {/* Conversation Panel */}
  <div className={`min-h-0 min-w-0 bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden flex-col ${selectedTicket ? 'fixed inset-0 z-50 flex bg-[#0b0d12] lg:relative lg:inset-auto lg:z-auto lg:col-span-8' : 'hidden lg:col-span-8 lg:flex'}`}>
  {selectedTicket ? (
  <>
  <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
  <div>
  <button type="button" onClick={() => setSelectedTicket(null)} className="mb-2 inline-flex items-center gap-1 text-xs text-ai-blue lg:hidden"><ArrowLeft className="h-3.5 w-3.5" />All tickets</button>
  <div className="flex items-center gap-3 mb-1">
  <h3 className="text-sm font-semibold ">{selectedTicket.subject}</h3>
  <div className={`w-2 h-2 rounded-full ${
  selectedTicket.status.toUpperCase() === 'RESOLVED' ? 'bg-expert-green' : 'bg-orange-500 animate-pulse'
  }`}></div>
  </div>
  <p className="text-[9px] font-mono text-medium-gray ">TICKET_ID: {selectedTicket.id.slice(0,8)}</p>
  </div>
  <div className="flex flex-wrap items-center gap-2">
  <label className="sr-only" htmlFor="admin-ticket-priority">Ticket priority</label>
  <select id="admin-ticket-priority" disabled={working} value={selectedTicket.priority} onChange={event => void handleUpdatePriority(selectedTicket.id, event.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#101218] px-3 text-xs text-white"><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select>
  <label className="sr-only" htmlFor="admin-ticket-status">Ticket status</label>
  <select id="admin-ticket-status" disabled={working} value={selectedTicket.status} onChange={event => void handleUpdateStatus(selectedTicket.id, event.target.value)} className="min-h-10 rounded-lg border border-white/10 bg-[#101218] px-3 text-xs text-white"><option value="open">Open</option><option value="pending">Pending</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
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
  <p className="text-[11px] font-medium leading-relaxed text-white/80">{msg.content}</p>
  </div>
  <span className="text-[8px] font-mono text-medium-gray mx-1">
  {msg.isAdmin ? 'STAFF' : 'CLIENT'}{' // '}{new Date(msg.createdAt).toLocaleTimeString()}
  </span>
  </div>
  </div>
  ))}

  {/* Status Indicator */}
  <div className="flex items-center justify-center pt-4">
  <div className="px-6 py-1.5 bg-white/5 rounded-full border border-white/5">
  <span className="text-[7px] font-semibold text-medium-gray ">Status: {selectedTicket.status}</span>
  </div>
  </div>
  </div>

  {selectedTicket.status.toLowerCase() !== 'closed' ? (
  <div className="p-8 bg-white/[0.01] border-t border-white/5">
    <div className="relative">
  <textarea placeholder="Compose your response..." disabled={working} maxLength={10000} className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-4 pr-20 text-sm font-medium focus:outline-none focus:border-ai-blue/50 resize-none" rows={3} value={response} onChange={(e) => setResponse(e.target.value)} />
      <button onClick={handleSendResponse} disabled={!response.trim() || working} className="absolute bottom-4 right-4 p-3 bg-ai-blue text-white rounded-xl transition shadow-xl shadow-ai-blue/20 disabled:opacity-50">{working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
    </div>
    <p className="mt-4 text-[8px] font-mono text-medium-gray text-center opacity-50">Authorized Personnel Only - System Logs Active</p>
  </div>
  ) : <div className="border-t border-white/5 p-6 text-center text-xs text-white/40">This ticket is closed. Reopen it before sending another reply.</div>}
  </>
  ) : (
  <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-20">
  <div className="w-24 h-24 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8">
  <MessageSquare className="w-10 h-10" />
  </div>
  <h3 className="text-sm font-semibold mb-4">Awaiting Signal</h3>
  <p className="text-[9px] font-medium max-w-[280px] leading-relaxed ">Select a support transmission from the registry to initialize communication</p>
  </div>
  )}
  </div>
  </div>
  </div>
  );
};

export default SupportManager;
