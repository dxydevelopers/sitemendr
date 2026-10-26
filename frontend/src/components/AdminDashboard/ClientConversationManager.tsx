'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Inbox, Loader2, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ConversationMessage {
  id: string;
  content: string;
  sender: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  subject: string;
  content: string;
  sender: string;
  isRead: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
  replies: ConversationMessage[];
}

export default function ClientConversationManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      const response = await apiClient.getAdminClientConversations();
      if (!response.success) throw new Error('Could not load client conversations.');
      const rows = (response.data || []) as unknown as Conversation[];
      setConversations(rows);
      setSelected(current => current ? rows.find(row => row.id === current.id) || null : null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load client conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const handleNewMessage = () => { void refresh(); };
    window.addEventListener('sitemendr:client-message', handleNewMessage);
    return () => window.removeEventListener('sitemendr:client-message', handleNewMessage);
  }, [refresh]);

  const filtered = useMemo(() => conversations.filter(item =>
    `${item.subject} ${item.user?.name || ''} ${item.user?.email || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [conversations, search]);

  const openConversation = async (conversation: Conversation) => {
    setSelected(conversation);
    if (!conversation.isRead || conversation.replies?.some(reply => reply.sender === 'USER' && !reply.isRead)) {
      try {
        await apiClient.markAdminClientConversationRead(conversation.id);
        const updated = {
          ...conversation,
          isRead: true,
          replies: (conversation.replies || []).map(reply => reply.sender === 'USER' ? { ...reply, isRead: true } : reply),
        };
        setSelected(updated);
        setConversations(current => current.map(row => row.id === updated.id ? updated : row));
      } catch {
        setError('Conversation opened, but its unread state could not be updated.');
      }
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    setSending(true);
    setError('');
    try {
      const response = await apiClient.replyToAdminClientConversation(selected.id, draft.trim());
      if (!response.success || !response.data) throw new Error('Your reply could not be sent.');
      const reply = response.data as unknown as ConversationMessage;
      const updated = { ...selected, replies: [...(selected.replies || []), reply] };
      setSelected(updated);
      setConversations(current => current.map(row => row.id === updated.id ? updated : row));
      setDraft('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-5 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Client conversations</p>
          <p className="mt-1 text-xs text-white/45">General conversations started from the client workspace.</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 border border-white/10 px-3 text-xs text-white/70 hover:bg-white/[.04]">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </header>

      {error && <p role="alert" className="border border-rose-300/20 bg-rose-300/[.05] px-4 py-3 text-xs text-rose-200">{error}</p>}

      <div className="grid min-h-[560px] overflow-hidden border border-white/10 bg-white/[.015] lg:grid-cols-[minmax(260px,360px)_1fr]">
        <aside className={`min-w-0 border-white/10 lg:border-r ${selected ? 'hidden lg:block' : ''}`}>
          <div className="border-b border-white/10 p-4">
            <label className="sr-only" htmlFor="client-conversation-search">Search conversations</label>
            <input id="client-conversation-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search clients or subjects" className="min-h-10 w-full border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-sky-300/50" />
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {loading ? <div className="flex items-center justify-center gap-2 p-10 text-xs text-white/45"><Loader2 className="h-4 w-4 animate-spin" /> Loading conversations</div> : filtered.length ? filtered.map(item => {
              const unread = (!item.isRead && item.sender === 'USER') || item.replies?.some(reply => reply.sender === 'USER' && !reply.isRead);
              return <button key={item.id} type="button" onClick={() => void openConversation(item)} className={`w-full border-b border-white/[.07] p-4 text-left hover:bg-white/[.035] ${selected?.id === item.id ? 'bg-white/[.04]' : ''}`}>
                <span className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium">{item.subject}</span>{unread && <span className="h-2 w-2 shrink-0 rounded-full bg-sky-300" />}</span>
                <span className="mt-1 block truncate text-xs text-white/45">{item.user?.name || item.user?.email || 'Client'}</span>
                <span className="mt-2 block truncate text-xs text-white/35">{item.replies?.at(-1)?.content || item.content}</span>
                <time className="mt-2 block text-[10px] text-white/30">{new Date(item.replies?.at(-1)?.createdAt || item.createdAt).toLocaleString()}</time>
              </button>;
            }) : <div className="p-10 text-center text-xs text-white/40"><Inbox className="mx-auto mb-3 h-5 w-5" />No conversations found.</div>}
          </div>
        </aside>

        <div className={`${selected ? '' : 'hidden lg:flex'} min-w-0 flex-col`}>
          {selected ? <>
            <div className="border-b border-white/10 p-4 sm:p-6">
              <button type="button" onClick={() => setSelected(null)} className="mb-3 text-xs text-sky-200 lg:hidden">← All conversations</button>
              <h2 className="break-words text-base font-semibold">{selected.subject}</h2>
              <p className="mt-1 text-xs text-white/45">{selected.user?.name} · {selected.user?.email}</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {[selected, ...(selected.replies || [])].map(message => <div key={message.id} className={`max-w-[92%] rounded-xl border p-4 sm:max-w-[80%] ${message.sender === 'ADMIN' ? 'ml-auto border-sky-300/20 bg-sky-300/[.06]' : 'border-white/10 bg-white/[.025]'}`}>
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/80">{message.content}</p>
                <p className="mt-2 text-[10px] text-white/35">{message.sender === 'ADMIN' ? 'You · Sitemendr' : selected.user?.name || 'Client'} · {new Date(message.createdAt).toLocaleString()}</p>
              </div>)}
            </div>
            <form onSubmit={sendReply} className="flex gap-2 border-t border-white/10 p-4 sm:p-6">
              <label className="sr-only" htmlFor="client-conversation-reply">Write a reply</label>
              <textarea id="client-conversation-reply" value={draft} onChange={event => setDraft(event.target.value)} maxLength={10000} rows={2} placeholder="Reply to this client…" className="min-h-12 min-w-0 flex-1 resize-y border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-sky-300/50" />
              <button type="submit" disabled={sending || !draft.trim()} className="inline-flex min-h-12 shrink-0 items-center gap-2 bg-sky-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send</button>
            </form>
          </> : <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-white/40"><MessageSquare className="mb-3 h-7 w-7" /><p className="text-sm">Choose a client conversation</p><p className="mt-1 text-xs">Replies stay attached to the same conversation.</p></div>}
        </div>
      </div>
    </section>
  );
}
