'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Code, 
  Save, 
  RotateCcw, 
  Eye, 
  Layout, 
  FileCode, 
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  X
} from 'lucide-react';

interface MediaAsset {
  id: string;
  url: string;
  mimetype: string;
  filename: string;
}

interface TemplateEditorProps {
  subscriptionId: string;
  onSave?: () => void;
  onClose?: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ subscriptionId, onSave, onClose }) => {
  const [template, setTemplate] = useState<{ html: string; css: string; js: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const fetchTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getAdminTemplate(subscriptionId);
      if (res.success && res.data) {
        const data = res.data as { html?: string; css?: string; js?: string };
        setTemplate({
          html: data.html || '',
          css: data.css || '',
          js: data.js || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setStatus({ type: 'error', message: 'Failed to synchronize template data' });
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  useEffect(() => {
    if (showMediaSelector) fetchMedia();
  }, [showMediaSelector]);

  const fetchMedia = async () => {
    try {
      const res = await apiClient.getMedia() as { success: boolean; data: MediaAsset[] };
      if (res.success) setMedia(res.data);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
  };

  const insertMediaUrl = (url: string) => {
    if (!template) return;
    const fullUrl = window.location.origin.includes('localhost') 
      ? `http://localhost:5000${url}`
      : `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
    
    // Simple append for now, more advanced would use textarea cursor position
    updateContent(template[activeTab] + `\n${fullUrl}\n`);
    setShowMediaSelector(false);
  };

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setStatus(null);
    try {
      await apiClient.updateAdminTemplate(subscriptionId, template);
      setStatus({ type: 'success', message: 'Template refinement synchronized successfully' });
      if (onSave) onSave();
    } catch (error) {
      console.error('Failed to save template:', error);
      setStatus({ type: 'error', message: 'Sync failed' });
    } finally {
      setSaving(false);
    }
  };

  const updateContent = (value: string) => {
    if (!template) return;
    setTemplate({ ...template, [activeTab]: value });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 text-ai-blue animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ai-blue animate-pulse">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] bg-darker-bg border border-white/5 rounded-[32px] overflow-hidden font-mono relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-wrap justify-between items-center bg-white/[0.01] gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-ai-blue/10 rounded-xl flex items-center justify-center border border-ai-blue/20">
            <Layout className="w-5 h-5 text-ai-blue" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.3em]">Template Editor</h3>
            <p className="text-[8px] text-medium-gray mt-1">Subscription: {subscriptionId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              previewMode 
                ? 'bg-tech-purple text-white shadow-lg shadow-tech-purple/20' 
                : 'bg-white/5 border border-white/10 text-medium-gray hover:text-white'
            }`}
          >
            {previewMode ? <Code className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {previewMode ? 'EDIT_MODE' : 'LIVE_PREVIEW'}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-expert-green/20 border border-expert-green/30 text-expert-green rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-expert-green hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-expert-green/10"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            {saving ? 'SYNCING...' : 'COMMIT_CHANGES'}
          </button>
          
          {onClose && (
             <button
             onClick={onClose}
             className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
           >
             <RotateCcw className="w-4 h-4" />
           </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {!previewMode ? (
          <>
            {/* Sidebar Tabs */}
            <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-white/[0.01]">
              <button
                onClick={() => setActiveTab('html')}
                className={`p-3 rounded-xl transition-all ${activeTab === 'html' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
                title="HTML"
              >
                <Layout className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('css')}
                className={`p-3 rounded-xl transition-all ${activeTab === 'css' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
                title="CSS"
              >
                <FileCode className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('js')}
                className={`p-3 rounded-xl transition-all ${activeTab === 'js' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
                title="JavaScript"
              >
                <Terminal className="w-5 h-5" />
              </button>
              
              <div className="w-8 h-[1px] bg-white/5 my-2"></div>

              <button
                onClick={() => setShowMediaSelector(true)}
                className={`p-3 rounded-xl transition-all text-medium-gray hover:text-white hover:bg-white/5`}
                title="Media Assets"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-black/20">
              <div className="px-6 py-2 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] font-black text-ai-blue uppercase tracking-widest">{activeTab.toUpperCase()}_ASSET</span>
                <span className="text-[7px] text-medium-gray">UTF-8 // CRLF</span>
              </div>
              <textarea
                value={template ? template[activeTab] : ''}
                onChange={(e) => updateContent(e.target.value)}
                className="flex-1 w-full bg-transparent p-8 text-[11px] font-mono leading-relaxed text-light-text focus:outline-none resize-none custom-scrollbar"
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          /* Preview Area */
          <div className="flex-1 bg-white relative">
            <iframe
              title="Site Preview"
              className="w-full h-full border-none"
              srcDoc={`
                <!DOCTYPE html>
                <html>
                  <head>
                    <style>${template?.css || ''}</style>
                  </head>
                  <body>
                    ${template?.html || ''}
                    <script>${template?.js || ''}</script>
                  </body>
                </html>
              `}
            />
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl">
              <div className="w-2 h-2 rounded-full bg-expert-green animate-pulse"></div>
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Virtualized Live Instance</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center px-8">
        <div className="flex items-center gap-6">
          {status && (
            <div className={`flex items-center gap-2 transition-all animate-fade-in`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-3 h-3 text-expert-green" />
              ) : (
                <AlertCircle className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                status.type === 'success' ? 'text-expert-green' : 'text-red-500'
              }`}>
                {status.message}
              </span>
            </div>
          )}
          {!status && (
            <div className="flex items-center gap-2 opacity-30">
              <div className="w-1 h-1 bg-medium-gray rounded-full"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-medium-gray">Ready for refinement</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-[8px] font-black text-medium-gray uppercase tracking-widest">
          <span>Lines: {(template?.[activeTab].split('\n').length || 0)}</span>
          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
          <span>Chars: {(template?.[activeTab].length || 0)}</span>
        </div>
      </div>

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-darker-bg border border-white/10 rounded-[32px] w-full max-w-4xl h-full max-h-[600px] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-ai-blue" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">ASSET_SELECTOR</h3>
              </div>
              <button 
                onClick={() => setShowMediaSelector(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {media.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => insertMediaUrl(item.url)}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl aspect-square overflow-hidden cursor-pointer group hover:border-ai-blue/30 transition-all relative"
                  >
                    {item.mimetype.startsWith('image/') ? (
                      <img src={item.url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileCode className="w-8 h-8 opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-ai-blue/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">SELECT_ASSET</span>
                    </div>
                  </div>
                ))}
                {media.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30">
                    <ImageIcon className="w-12 h-12 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No assets in repository</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
