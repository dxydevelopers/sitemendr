import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { Check, Circle, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  status: string;
  order: number;
}

interface MilestoneViewerProps {
  subscriptionId: string;
}

const MilestoneViewer: React.FC<MilestoneViewerProps> = ({ subscriptionId }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getProjectMilestones(subscriptionId) as { success: boolean, data?: Milestone[] };
        if (res.success && res.data) {
          setMilestones([...res.data].sort((a: Milestone, b: Milestone) => a.order - b.order));
        } else if (res.success) {
          setMilestones([]);
        }
      } catch (error) {
        console.error('Failed to fetch milestones', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMilestones();
  }, [subscriptionId]);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-white/5 rounded-2xl w-full"></div>
      ))}
    </div>
  );

  if (milestones.length === 0) return (
    <div className="p-10 text-center opacity-50 border border-dashed border-white/10 rounded-3xl">
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">No project milestones defined yet</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {milestones.map((ms, idx) => (
        <div key={ms.id} className="relative">
          {/* Vertical connection line */}
          {idx !== milestones.length - 1 && (
            <div className="absolute left-[22px] top-10 bottom-[-24px] w-px bg-white/5"></div>
          )}
          
          <div className={`p-6 lg:p-8 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${
            ms.status.toUpperCase() === 'COMPLETED' 
              ? 'bg-expert-green/[0.02] border-expert-green/20 hover:border-expert-green/40' 
              : ms.status.toUpperCase() === 'IN_PROGRESS'
              ? 'bg-ai-blue/[0.02] border-ai-blue/20 hover:border-ai-blue/40 shadow-[0_0_30px_rgba(0,102,255,0.05)]'
              : 'bg-white/[0.01] border-white/5 hover:border-white/10'
          }`}>
            <div className="flex items-start gap-6 relative z-10">
              <div className="mt-1 flex-shrink-0">
                {ms.status.toUpperCase() === 'COMPLETED' ? (
                  <div className="w-11 h-11 rounded-2xl bg-expert-green/10 border border-expert-green/20 flex items-center justify-center text-expert-green">
                    <Check className="w-6 h-6" />
                  </div>
                ) : ms.status.toUpperCase() === 'IN_PROGRESS' ? (
                  <div className="w-11 h-11 rounded-2xl bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center text-ai-blue animate-pulse">
                    <Clock className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                    <Circle className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <h4 className="text-base font-black uppercase tracking-tight text-white group-hover:text-ai-blue transition-colors">
                    {ms.title}
                  </h4>
                  <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                    ms.status.toUpperCase() === 'COMPLETED' 
                      ? 'bg-expert-green/10 text-expert-green border-expert-green/20' 
                      : ms.status.toUpperCase() === 'IN_PROGRESS' 
                      ? 'bg-ai-blue/10 text-ai-blue border-ai-blue/20' 
                      : 'bg-white/5 text-white/30 border-white/10'
                  }`}>
                    {ms.status.replace('_', ' ')}
                  </div>
                </div>
                <p className="text-[11px] text-medium-gray font-medium uppercase leading-relaxed max-w-2xl group-hover:text-white/60 transition-colors">
                  {ms.description}
                </p>
              </div>
            </div>
            
            {/* Background HUD Decor */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <span className="text-[40px] font-black italic">{idx + 1}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestoneViewer;
