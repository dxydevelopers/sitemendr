'use client';

import React from 'react';
import { X, Clipboard, CheckCircle } from 'lucide-react';

interface Assessment {
  id: string;
  createdAt: string;
  responses: Record<string, unknown>;
  source?: string;
  results?: unknown;
}

interface AssessmentModalProps {
  assessment: Assessment | null;
  isOpen: boolean;
  onClose: () => void;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ assessment, isOpen, onClose }) => {
  if (!isOpen || !assessment) return null;

  const responses = assessment.responses || {};

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-darker-bg border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* Scanning line effect */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]">
          <div className="w-full h-[1px] bg-ai-blue animate-scan"></div>
        </div>

        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center relative bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-ai-blue/10 rounded-2xl flex items-center justify-center border border-ai-blue/20">
              <Clipboard className="w-6 h-6 text-ai-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase text-white">Assessment Payload</h2>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-ai-blue font-black uppercase tracking-[0.3em]">ID: {assessment.id}</span>
                <span className="w-1 h-1 rounded-full bg-expert-green animate-pulse"></span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-xl transition-colors text-medium-gray hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.3em] mb-2 block">Timestamp</span>
              <p className="text-white font-bold text-sm uppercase">{new Date(assessment.createdAt).toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.3em] mb-2 block">Source</span>
              <p className="text-white font-bold text-sm uppercase">{assessment.source || 'Direct'}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
              <span className="text-[8px] font-black text-medium-gray uppercase tracking-[0.3em] mb-2 block">Status</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-expert-green" />
                <p className="text-expert-green font-bold text-sm uppercase">Verified</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-black text-ai-blue uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-ai-blue rounded-full"></span>
                Response Data
              </h3>
              
              <div className="grid gap-4">
                {Object.entries(responses).map(([key, value], i) => (
                  <div key={i} className="bg-white/[0.01] border border-white/5 p-6 rounded-2xl flex flex-col gap-2 group hover:bg-white/[0.02] transition-colors">
                    <span className="text-[9px] font-black text-medium-gray uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <p className="text-white font-medium text-sm leading-relaxed uppercase">
                      {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {!!assessment.results && (
              <>
                <h3 className="text-sm font-black text-tech-purple uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-tech-purple rounded-full"></span>
                  System Processing Results
                </h3>
                
                {(assessment.results as { mockupUrl?: string }).mockupUrl && (
                  <div className="mb-8 rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/20">
                    <img 
                      src={(assessment.results as { mockupUrl?: string }).mockupUrl} 
                      alt="Assessment Mockup" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="bg-tech-purple/5 border border-tech-purple/20 p-8 rounded-3xl">
                  <pre className="text-xs text-tech-purple/90 font-mono whitespace-pre-wrap leading-loose">
                    {JSON.stringify(assessment.results, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            Close Terminal
          </button>
          <button className="px-8 py-3 bg-ai-blue text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-ai-blue/20">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentModal;
