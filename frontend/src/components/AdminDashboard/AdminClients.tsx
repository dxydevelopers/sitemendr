// components/admin-dashboard/AdminClients.tsx
//
// Covers the "leads", "users", and "assessments" tabs. These three were
// separate tab blocks in the original file but share the same table
// shape (search + filter + rows), so they're grouped into one file
// with a `view` prop rather than three near-identical files.

'use client';

import type { Lead, User, Assessment } from './types';

interface AdminClientsProps {
  view: 'leads' | 'users' | 'assessments';
  leads: Lead[];
  users: User[];
  assessments: Assessment[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  onUpdateLeadStatus: (id: string, status: string) => void;
  onDeleteLead: (id: string) => void;
  onToggleUserBan: (id: string, currentBanned: boolean) => void;
  onUpdateUserRole: (id: string, role: string) => void;
  onDeleteUser: (id: string) => void;
  onViewAssessment: (assessment: Assessment) => void;
  onDeleteAssessment: (id: string) => void;
}

export default function AdminClients({
  view, leads, users, assessments, searchTerm, setSearchTerm, filterStatus, setFilterStatus,
  onUpdateLeadStatus, onDeleteLead, onToggleUserBan, onUpdateUserRole, onDeleteUser,
  onViewAssessment, onDeleteAssessment,
}: AdminClientsProps) {
  if (view === 'leads') {
    const filtered = leads.filter(l => (filterStatus === 'ALL' || l.status === filterStatus) && (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.email.toLowerCase().includes(searchTerm.toLowerCase())));
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-expert-green rounded-full"></span>Lead Management</h2>
            <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">TOTAL_RECORDS: {leads.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors">
              <option value="ALL">ALL_STATUS</option><option value="new">NEW</option><option value="contacted">CONTACTED</option><option value="qualified">QUALIFIED</option><option value="converted">CONVERTED</option><option value="lost">LOST</option>
            </select>
          </div>
        </div>
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Name/Email</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Source</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Status</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Assigned</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((lead, i) => (
                  <tr key={lead.id || i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5"><p className="text-[11px] font-black tracking-tight uppercase">{lead.name}</p><p className="text-[9px] text-medium-gray font-medium tracking-tighter uppercase">{lead.email}</p></td>
                    <td className="p-5"><span className="text-[8px] font-black text-ai-blue uppercase tracking-widest block">{lead.source?.replace('_', ' ') || 'DIRECT'}</span></td>
                    <td className="p-5"><span className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${lead.status.toLowerCase() === 'new' ? 'bg-expert-green/10 border-expert-green/20 text-expert-green' : lead.status.toLowerCase() === 'contacted' ? 'bg-ai-blue/10 border-ai-blue/20 text-ai-blue' : 'bg-white/5 border-white/10 text-medium-gray'}`}>{lead.status}</span></td>
                    <td className="p-5"><p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">{typeof lead.assignedTo === 'object' && lead.assignedTo !== null ? (lead.assignedTo as { name: string }).name : (lead.assignedTo || 'UNASSIGNED')}</p></td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <select value={lead.status} onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors text-ai-blue">
                          <option value="new">NEW</option><option value="contacted">CONTACTED</option><option value="qualified">QUALIFIED</option><option value="converted">CONVERTED</option><option value="lost">LOST</option>
                        </select>
                        <button onClick={() => window.location.href = `mailto:${lead.email}`} className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue hover:text-white transition-colors">ENGAGE</button>
                        <button onClick={() => { if (confirm('Permanently delete this lead?')) onDeleteLead(lead.id); }} className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors">DELETE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'users') {
    const filtered = users.filter(u => (filterStatus === 'ALL' || u.role === filterStatus) && (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())));
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
          <div className="flex flex-col">
            <h2 className="text-lg font-black tracking-tighter uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-ai-blue rounded-full"></span>User Directory</h2>
            <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.2em] mt-1">ACTIVE_NODES: {users.length}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input type="text" placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors flex-1 md:w-64" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors">
              <option value="ALL">ALL_ROLES</option><option value="user">USER</option><option value="manager">MANAGER</option><option value="admin">ADMIN</option>
            </select>
          </div>
        </div>
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">User</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Role</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Access</th>
                <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((user, i) => (
                  <tr key={user.id || i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-5"><p className="text-[11px] font-black tracking-tight uppercase">{user.name}</p><p className="text-[9px] text-medium-gray font-medium tracking-tighter uppercase">{user.email}</p></td>
                    <td className="p-5">
                      <select value={user.role} onChange={(e) => onUpdateUserRole(user.id, e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[9px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors text-ai-blue">
                        <option value="user">USER</option><option value="manager">MANAGER</option><option value="admin">ADMIN</option>
                      </select>
                    </td>
                    <td className="p-5"><p className="text-[9px] font-black uppercase tracking-widest text-ai-blue">SEC_LVL_0{user.role === 'admin' ? '1' : '2'}</p></td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => onToggleUserBan(user.id, user.banned)} className={`px-2 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border transition-colors ${user.banned ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'bg-expert-green/10 border-expert-green/20 text-expert-green hover:bg-expert-green hover:text-white'}`}>{user.banned ? 'BANNED' : 'ACTIVE'}</button>
                        <button onClick={() => { if (confirm('Permanently delete this user? This action cannot be undone.')) onDeleteUser(user.id); }} className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors">DELETE</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // view === 'assessments'
  const filtered = assessments.filter(a => (a.name || 'Anonymous').toLowerCase().includes(searchTerm.toLowerCase()) || (a.id || '').toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div className="flex flex-col">
          <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>Audit Repository</h2>
          <span className="text-[8px] font-bold text-medium-gray uppercase tracking-[0.2em] mt-1">LOG_ENTRIES: {assessments.length}</span>
        </div>
        <div className="w-full md:w-64"><input type="text" placeholder="Search audits..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-ai-blue transition-colors" /></div>
      </div>
      <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Assessment ID</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Client</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Timestamp</th>
              <th className="p-5 text-[9px] font-black uppercase tracking-widest text-medium-gray">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((assessment, i) => (
                <tr key={assessment.id || i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-5"><p className="text-[9px] font-black font-mono text-ai-blue uppercase tracking-widest">{(assessment.id || '').slice(-8).toUpperCase()}</p></td>
                  <td className="p-5"><p className="text-[11px] font-black tracking-tight uppercase">{assessment.name || 'Anonymous'}</p></td>
                  <td className="p-5"><p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">{new Date(assessment.createdAt).toLocaleString()}</p></td>
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <button onClick={() => onViewAssessment(assessment)} className="text-[9px] font-black uppercase tracking-[0.2em] text-ai-blue hover:text-white transition-colors">VIEW_REPORT</button>
                      <button onClick={() => { if (confirm('Delete this assessment?')) onDeleteAssessment(assessment.id); }} className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 hover:text-white transition-colors">DELETE</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
