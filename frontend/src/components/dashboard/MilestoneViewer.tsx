import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

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
    <div className="space-y-4">
      {milestones.map((ms) => (
        <div key={ms.id} className={`p-6 rounded-3xl border transition-all ${
          ms.status.toUpperCase() === 'COMPLETED' 
            ? 'bg-expert-green/5 border-expert-green/20' 
            : ms.status.toUpperCase() === 'IN_PROGRESS'
            ? 'bg-ai-blue/5 border-ai-blue/20'
            : 'bg-white/[0.02] border-white/5'
        }`}>
          <div className="flex items-start gap-4">
            <div className="mt-1">
              {ms.status.toUpperCase() === 'COMPLETED' ? (
                <CheckCircle2 className="w-5 h-5 text-expert-green" />
              ) : ms.status.toUpperCase() === 'IN_PROGRESS' ? (
                <Clock className="w-5 h-5 text-ai-blue animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-medium-gray" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-black uppercase tracking-tight">{ms.title}</h4>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  ms.status.toUpperCase() === 'COMPLETED' ? 'text-expert-green' : ms.status.toUpperCase() === 'IN_PROGRESS' ? 'text-ai-blue' : 'text-medium-gray'
                }`}>
                  {ms.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[10px] text-medium-gray font-medium uppercase leading-relaxed">{ms.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MilestoneViewer;
