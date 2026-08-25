// components/admin-dashboard/AdminNotifications.tsx
//
// Real control room for NotificationRule rows. Full CRUD: list (grouped
// by category), inline edit, create new, delete (with a warning if the
// rule is wired to a live backend trigger), plus email transport switch.

'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronUp, Mail, Loader2, Plus, Trash2, X, AlertTriangle } from 'lucide-react';
import { apiClient, type NotificationRule } from '@/lib/api';
import CustomSelect from './CustomSelect';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const statusStyles: Record<string, string> = {
  active: 'text-expert-green',
  paused: 'text-amber-200',
  removed: 'text-white/35',
};

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const recipientTypeOptions = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
  { value: 'all_admins', label: 'All Admins' },
  { value: 'specific_email', label: 'Specific Email' },
];

const transportOptions = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'resend', label: 'Resend' },
  { value: 'log', label: 'Log Only (dev)' },
];

interface EditState {
  status: string;
  subject: string;
  htmlTemplate: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
}

const toEditState = (rule: NotificationRule): EditState => ({
  status: rule.status,
  subject: rule.subject || '',
  htmlTemplate: rule.htmlTemplate || '',
  senderName: rule.senderName || '',
  senderEmail: rule.senderEmail || '',
  replyTo: rule.replyTo || '',
});

interface NewRuleState {
  name: string;
  category: string;
  newCategory: string;
  trigger: string;
  recipientType: string;
  subject: string;
  htmlTemplate: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
}

const blankNewRule = (defaultCategory: string): NewRuleState => ({
  name: '',
  category: defaultCategory,
  newCategory: '',
  trigger: '',
  recipientType: 'user',
  subject: '',
  htmlTemplate: '',
  senderName: '',
  senderEmail: '',
  replyTo: '',
});

export default function AdminNotifications() {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [transport, setTransport] = useState<string>('smtp');
  const [transportLoading, setTransportLoading] = useState(true);
  const [transportSaving, setTransportSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState<NewRuleState>(blankNewRule(''));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.getNotificationRules();
    if (res.success) {
      setRules(res.data);
    }
    setLoading(false);
  }, []);

  const loadCategories = useCallback(async () => {
    const res = await apiClient.get('/admin/notification-rules/categories') as { success: boolean; data: string[] };
    if (res.success) {
      setCategories(res.data);
    }
  }, []);

  const loadTransport = useCallback(async () => {
    setTransportLoading(true);
    const res = await apiClient.getEmailConfig();
    if (res.success) {
      setTransport(res.data.transport);
    }
    setTransportLoading(false);
  }, []);

  useEffect(() => {
    loadRules();
    loadCategories();
    loadTransport();
  }, [loadRules, loadCategories, loadTransport]);

  const handleToggleExpand = (rule: NotificationRule) => {
    if (expandedId === rule.id) {
      setExpandedId(null);
      setEditState(null);
      setSaveError(null);
      return;
    }
    setExpandedId(rule.id);
    setEditState(toEditState(rule));
    setSaveError(null);
  };

  const handleSave = async (id: string) => {
    if (!editState) return;
    setSaving(true);
    setSaveError(null);

    const res = await apiClient.updateNotificationRule(id, {
      status: editState.status as NotificationRule['status'],
      subject: editState.subject,
      htmlTemplate: editState.htmlTemplate,
      senderName: editState.senderName || null,
      senderEmail: editState.senderEmail || null,
      replyTo: editState.replyTo || null,
    });

    setSaving(false);

    if (!res.success) {
      setSaveError(res.message || 'Failed to save changes');
      return;
    }

    setRules(prev => prev.map(r => (r.id === id ? res.data : r)));
    setExpandedId(null);
    setEditState(null);
  };

  const handleTransportChange = async (nextTransport: string) => {
    setTransportSaving(true);
    const res = await apiClient.updateEmailConfig(nextTransport);
    if (res.success) {
      setTransport(res.data.transport);
    }
    setTransportSaving(false);
  };

  const openAddForm = () => {
    setNewRule(blankNewRule(categories[0] || ''));
    setCreateError(null);
    setShowAddForm(true);
  };

  const handleCreate = async () => {
    const finalCategory = newRule.category === '__new__' ? newRule.newCategory.trim() : newRule.category;

    if (!newRule.name.trim() || !finalCategory || !newRule.trigger.trim() || !newRule.subject.trim() || !newRule.htmlTemplate.trim()) {
      setCreateError('Name, category, trigger, subject, and body are all required.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    const res = await apiClient.post('/admin/notification-rules', {
      name: newRule.name.trim(),
      category: finalCategory,
      trigger: newRule.trigger.trim(),
      recipientType: newRule.recipientType,
      subject: newRule.subject,
      htmlTemplate: newRule.htmlTemplate,
      senderName: newRule.senderName || undefined,
      senderEmail: newRule.senderEmail || undefined,
      replyTo: newRule.replyTo || undefined,
    }) as { success: boolean; data: NotificationRule; message?: string };

    setCreating(false);

    if (!res.success) {
      setCreateError(res.message || 'Failed to create notification');
      return;
    }

    setRules(prev => [...prev, res.data]);
    if (!categories.includes(finalCategory)) {
      setCategories(prev => [...prev, finalCategory].sort());
    }
    setShowAddForm(false);
  };

  const requestDelete = (rule: NotificationRule) => {
    setDeleteTarget(rule);
    setDeleteWarning(null);
  };

  const confirmDelete = async (force = false) => {
    if (!deleteTarget) return;
    setDeleting(true);

    const res = await apiClient.delete(
      `/admin/notification-rules/${deleteTarget.id}${force ? '?confirm=true' : ''}`
    ) as { success: boolean; requiresConfirmation?: boolean; message?: string };

    setDeleting(false);

    if (!res.success && res.requiresConfirmation) {
      setDeleteWarning(res.message || 'This notification is wired to live code. Delete anyway?');
      return;
    }

    if (!res.success) {
      setDeleteWarning(res.message || 'Failed to delete');
      return;
    }

    setRules(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleteWarning(null);
    if (expandedId === deleteTarget.id) {
      setExpandedId(null);
      setEditState(null);
    }
  };

  const groupedCategories = Array.from(new Set(rules.map(r => r.category))).sort();

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-[9px] font-black text-medium-gray uppercase tracking-[0.3em]">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Email delivery panel */}
      <div className="border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-ai-blue"><Mail className="h-4 w-4" /></span>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white">Email Delivery</span>
        </div>
        {transportLoading ? (
          <p className="text-[9px] font-black text-medium-gray uppercase tracking-widest">Loading...</p>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Active Transport:</span>
            <CustomSelect
              value={transport}
              options={transportOptions}
              onChange={handleTransportChange}
              disabled={transportSaving}
            />
            {transportSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />}
          </div>
        )}
      </div>

      {/* Header + Add New */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Notifications</span>
        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-ai-blue text-white font-black text-[9px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New
        </button>
      </div>

      {/* Add New form */}
      {showAddForm && (
        <div className="border border-ai-blue/30 bg-ai-blue/[0.03] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white">New Notification</span>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Suspension Applied"
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Category</label>
              <CustomSelect
                value={newRule.category}
                options={[...categories.map(c => ({ value: c, label: c })), { value: '__new__', label: '+ New Category' }]}
                onChange={(v) => setNewRule(prev => ({ ...prev, category: v }))}
                placeholder="Select category"
              />
              {newRule.category === '__new__' && (
                <input
                  type="text"
                  value={newRule.newCategory}
                  onChange={(e) => setNewRule(prev => ({ ...prev, newCategory: e.target.value }))}
                  placeholder="New category name"
                  className="w-full mt-2 bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Trigger Description</label>
            <input
              type="text"
              value={newRule.trigger}
              onChange={(e) => setNewRule(prev => ({ ...prev, trigger: e.target.value }))}
              placeholder="Plain description of what fires this"
              className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Recipient Type</label>
            <CustomSelect
              value={newRule.recipientType}
              options={recipientTypeOptions}
              onChange={(v) => setNewRule(prev => ({ ...prev, recipientType: v }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Subject</label>
            <input
              type="text"
              value={newRule.subject}
              onChange={(e) => setNewRule(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Body</label>
            <div className="bg-white text-black">
              <ReactQuill
                theme="snow"
                value={newRule.htmlTemplate}
                onChange={(value: string) => setNewRule(prev => ({ ...prev, htmlTemplate: value }))}
                modules={quillModules}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Sender Name</label>
              <input
                type="text"
                placeholder="Sitemendr"
                value={newRule.senderName}
                onChange={(e) => setNewRule(prev => ({ ...prev, senderName: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Sender Email</label>
              <input
                type="email"
                placeholder="no-reply@sitemendr.com"
                value={newRule.senderEmail}
                onChange={(e) => setNewRule(prev => ({ ...prev, senderEmail: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Reply-To</label>
              <input
                type="email"
                placeholder="support@sitemendr.com"
                value={newRule.replyTo}
                onChange={(e) => setNewRule(prev => ({ ...prev, replyTo: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
              />
            </div>
          </div>

          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wide">
            New notifications are created paused. Wire a matching <code className="text-tech-purple">notify()</code> call in the backend, then activate it here.
          </p>

          {createError && (
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{createError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="px-6 py-3 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Notification'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-6 py-3 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notification rules by category */}
      {groupedCategories.map((category) => (
        <div key={category} className="space-y-0">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">{category}</p>
          <div className="border-t border-white/10">
            {rules.filter(r => r.category === category).map((rule) => {
              const isExpanded = expandedId === rule.id;
              return (
                <div key={rule.id} className="border-b border-white/10">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(rule)}
                      className="col-span-11 grid grid-cols-11 gap-4 w-full py-4 text-left items-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="col-span-4">
                        <p className="text-[13px] font-medium tracking-[-0.02em] text-white">{rule.name}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/30">{rule.trigger}</p>
                      </div>
                      <div className="col-span-3 text-[12px] tracking-[-0.01em] text-white/60">
                        {rule.recipientType.replace('_', ' ')}
                      </div>
                      <div className="col-span-2 text-[12px] tracking-[-0.01em] text-white/60">
                        {rule.channels.join(' / ')}
                      </div>
                      <div className="col-span-2 text-[10px] uppercase tracking-[0.18em]">
                        <span className={statusStyles[rule.status] || 'text-white/35'}>{rule.status}</span>
                      </div>
                    </button>
                    <div className="col-span-1 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => requestDelete(rule)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                        aria-label={`Delete ${rule.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => handleToggleExpand(rule)} className="text-white/40">
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && editState && (
                    <div className="pb-8 space-y-6 border-t border-white/5 pt-6">
                      {/* Quick status buttons */}
                      <div className="flex items-center gap-2">
                        {(['active', 'paused', 'removed'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditState(prev => prev ? { ...prev, status: s } : prev)}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-colors ${
                              editState.status === s
                                ? 'border-ai-blue text-ai-blue bg-ai-blue/10'
                                : 'border-white/10 text-white/40 hover:text-white/70'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Available variables hint */}
                      {rule.availableVariables.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Available:</span>
                          {rule.availableVariables.map(v => (
                            <code key={v} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-tech-purple">
                              {`{{${v}}}`}
                            </code>
                          ))}
                        </div>
                      )}

                      {/* Subject */}
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Subject</label>
                        <input
                          type="text"
                          value={editState.subject}
                          onChange={(e) => setEditState(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                          className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
                        />
                      </div>

                      {/* Body — rich text */}
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Body</label>
                        <div className="bg-white text-black">
                          <ReactQuill
                            theme="snow"
                            value={editState.htmlTemplate}
                            onChange={(value: string) => setEditState(prev => prev ? { ...prev, htmlTemplate: value } : prev)}
                            modules={quillModules}
                          />
                        </div>
                      </div>

                      {/* Sender / reply-to */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Sender Name</label>
                          <input
                            type="text"
                            placeholder="Sitemendr"
                            value={editState.senderName}
                            onChange={(e) => setEditState(prev => prev ? { ...prev, senderName: e.target.value } : prev)}
                            className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Sender Email</label>
                          <input
                            type="email"
                            placeholder="no-reply@sitemendr.com"
                            value={editState.senderEmail}
                            onChange={(e) => setEditState(prev => prev ? { ...prev, senderEmail: e.target.value } : prev)}
                            className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-medium-gray uppercase tracking-widest">Reply-To</label>
                          <input
                            type="email"
                            placeholder="support@sitemendr.com"
                            value={editState.replyTo}
                            onChange={(e) => setEditState(prev => prev ? { ...prev, replyTo: e.target.value } : prev)}
                            className="w-full bg-white/[0.02] border border-white/10 px-4 py-3 text-xs focus:outline-none focus:border-ai-blue transition-colors"
                          />
                        </div>
                      </div>

                      {saveError && (
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{saveError}</p>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSave(rule.id)}
                          disabled={saving}
                          className="px-6 py-3 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setExpandedId(null); setEditState(null); setSaveError(null); }}
                          className="px-6 py-3 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md border border-white/10 bg-[#05070a] p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-red-400"><AlertTriangle className="h-4 w-4" /></span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Delete Notification</span>
            </div>
            <p className="text-[12px] text-white/60">
              Delete <strong className="text-white">{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            {deleteWarning && (
              <p className="text-[11px] font-bold text-amber-300 border border-amber-300/20 bg-amber-300/5 p-3">
                {deleteWarning}
              </p>
            )}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => confirmDelete(!!deleteWarning)}
                disabled={deleting}
                className="px-6 py-3 bg-red-500 text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : deleteWarning ? 'Delete Anyway' : 'Confirm Delete'}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteTarget(null); setDeleteWarning(null); }}
                className="px-6 py-3 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}