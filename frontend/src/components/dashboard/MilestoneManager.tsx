import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api';
import { Trash2, Edit2, Plus, Save, X, CheckCircle2, Clock, Circle } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  order: number;
}

interface Subscription {
  id: string;
  siteName?: string;
  client?: { name: string };
}

const MilestoneManager: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    order: 0
  });

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: 'PENDING',
    order: 0
  });

  const fetchMilestones = useCallback(async () => {
    try {
      setMilestonesLoading(true);
      const res = await apiClient.getAdminMilestones(selectedSub) as { success: boolean, data: Milestone[] };
      if (res.success) setMilestones(res.data);
    } catch (error) {
      console.error('Failed to fetch milestones', error);
    } finally {
      setMilestonesLoading(false);
    }
  }, [selectedSub]);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await apiClient.getAdminSubscriptions() as { success: boolean, data: Subscription[] };
        if (res.success) setSubscriptions(res.data);
      } catch (error) {
        console.error('Failed to fetch subscriptions', error);
      }
    };
    fetchSubs();
  }, []);

  useEffect(() => {
    if (selectedSub) {
      fetchMilestones();
    } else {
      setMilestones([]);
    }
  }, [selectedSub, fetchMilestones]);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return alert('Select a project target');
    try {
      await apiClient.createMilestone({
        ...formData,
        subscriptionId: selectedSub
      });
      setFormData({ title: '', description: '', status: 'PENDING', order: milestones.length + 1 });
      fetchMilestones();
    } catch (error) {
      console.error('Failed to create milestone', error);
    }
  };

  const handleUpdateMilestone = async (id: string) => {
    try {
      await apiClient.updateMilestone(id, editData);
      setEditingId(null);
      fetchMilestones();
    } catch (error) {
      console.error('Failed to update milestone', error);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Permanently delete this milestone?')) return;
    try {
      await apiClient.deleteMilestone(id);
      fetchMilestones();
    } catch (error) {
      console.error('Failed to delete milestone', error);
    }
  };

  const startEditing = (ms: Milestone) => {
    setEditingId(ms.id);
    setEditData({
      title: ms.title,
      description: ms.description || '',
      status: ms.status,
      order: ms.order
    });
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-tech-purple uppercase tracking-[0.3em] mb-1">Project Lead</span>
        <h2 className="text-sm font-black tracking-widest flex items-center gap-3 uppercase">
          <span className="w-1.5 h-6 bg-tech-purple rounded-full"></span>
          Milestone Orchestrator
        </h2>
      </div>

      <div className="bg-white/[0.01] border border-white/5 rounded-[40px] p-10">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Creation / Selection Side */}
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-medium-gray uppercase tracking-widest px-1">Select Project</label>
              <select
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-sm font-black uppercase tracking-widest focus:outline-none focus:border-tech-purple/50 appearance-none cursor-pointer"
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
              >
                <option value="" className="bg-dark-bg text-medium-gray">-- SELECT INFRASTRUCTURE TARGET --</option>
                {subscriptions.map(sub => (
                  <option key={sub.id} value={sub.id} className="bg-dark-bg">
                    {sub.siteName?.toUpperCase() || 'NODE'} | {sub.client?.name?.toUpperCase() || 'GUEST'}
                  </option>
                ))}
              </select>
            </div>

            {selectedSub && (
              <form onSubmit={handleCreateMilestone} className="space-y-6 pt-6 border-t border-white/5 animate-fade-in">
                <h4 className="text-[10px] font-black text-tech-purple uppercase tracking-[0.3em]">Provision New Milestone</h4>
                
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-medium-gray uppercase tracking-widest px-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-tech-purple/50 transition-all"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-medium-gray uppercase tracking-widest px-1">Sequence</label>
                    <input
                      type="number"
                      required
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-tech-purple/50 transition-all"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-medium-gray uppercase tracking-widest px-1">Initial Status</label>
                    <select
                      className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-tech-purple/50 transition-all appearance-none"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="PENDING" className="bg-dark-bg">PENDING</option>
                      <option value="IN_PROGRESS" className="bg-dark-bg">IN_PROGRESS</option>
                      <option value="COMPLETED" className="bg-dark-bg">COMPLETED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-medium-gray uppercase tracking-widest px-1">Technical Description</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-tech-purple/50 transition-all resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-tech-purple text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-tech-purple/20"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              </form>
            )}
          </div>

          {/* List Side */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-medium-gray uppercase tracking-[0.3em] flex items-center justify-between">
              Sequence Registry 
              {selectedSub && <span className="text-tech-purple font-mono">{milestones.length} ENTRIES</span>}
            </h4>

            <div className="space-y-4">
              {!selectedSub ? (
                <div className="p-20 border border-dashed border-white/5 rounded-[32px] text-center opacity-30">
                  <Circle className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Select node to view sequence</p>
                </div>
              ) : milestonesLoading ? (
                <div className="p-20 text-center animate-pulse">
                  <div className="w-10 h-10 border-2 border-white/10 border-t-tech-purple rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">Scanning registry...</p>
                </div>
              ) : milestones.length === 0 ? (
                <div className="p-20 border border-dashed border-white/5 rounded-[32px] text-center opacity-30">
                  <Plus className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-[9px] font-black uppercase tracking-widest">No milestones defined for this node</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {milestones.map((ms) => (
                    <div key={ms.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px] hover:bg-white/[0.03] transition-all group">
                      {editingId === ms.id ? (
                        <div className="space-y-4">
                          <input 
                            className="w-full bg-black/40 border border-tech-purple/50 rounded-lg px-4 py-2 text-xs font-black uppercase"
                            value={editData.title}
                            onChange={(e) => setEditData({...editData, title: e.target.value})}
                          />
                          <textarea 
                            className="w-full bg-black/40 border border-tech-purple/50 rounded-lg px-4 py-2 text-[10px] font-medium uppercase resize-none"
                            value={editData.description}
                            rows={3}
                            onChange={(e) => setEditData({...editData, description: e.target.value})}
                          />
                          <div className="flex gap-4">
                            <select 
                              className="flex-1 bg-black/40 border border-tech-purple/50 rounded-lg px-4 py-2 text-[10px] font-black uppercase"
                              value={editData.status}
                              onChange={(e) => setEditData({...editData, status: e.target.value})}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="IN_PROGRESS">IN_PROGRESS</option>
                              <option value="COMPLETED">COMPLETED</option>
                            </select>
                            <input 
                              type="number"
                              className="w-20 bg-black/40 border border-tech-purple/50 rounded-lg px-4 py-2 text-[10px] font-black"
                              value={editData.order}
                              onChange={(e) => setEditData({...editData, order: parseInt(e.target.value)})}
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => handleUpdateMilestone(ms.id)} className="flex-1 py-2 bg-expert-green text-dark-bg font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2">
                              <Save className="w-3 h-3" /> Commit
                            </button>
                            <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-white/10 text-white font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2">
                              <X className="w-3 h-3" /> Abort
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-4">
                              <div className="mt-1">
                                {ms.status.toUpperCase() === 'COMPLETED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-expert-green" />
                                ) : ms.status.toUpperCase() === 'IN_PROGRESS' ? (
                                  <Clock className="w-4 h-4 text-ai-blue animate-pulse" />
                                ) : (
                                  <Circle className="w-4 h-4 text-medium-gray opacity-30" />
                                )}
                              </div>
                              <div>
                                <h5 className="text-[13px] font-black uppercase tracking-tight">{ms.title}</h5>
                                <p className="text-[9px] font-mono text-medium-gray mt-1">SEQ_0{ms.order}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => startEditing(ms)} className="p-2 hover:bg-white/5 rounded-lg text-ai-blue"><Edit2 className="w-3 h-3" /></button>
                              <button onClick={() => handleDeleteMilestone(ms.id)} className="p-2 hover:bg-white/5 rounded-lg text-red-500"><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                          <p className="text-[10px] text-medium-gray font-medium uppercase leading-relaxed line-clamp-2">{ms.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneManager;
