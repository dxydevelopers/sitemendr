import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';

import { Download } from 'lucide-react';

interface TemplateViewerProps {
  subscriptionId: string;
}

interface TemplateData {
  html: string;
  css: string;
  js?: string;
  aiModel?: string;
}

const TemplateViewer: React.FC<TemplateViewerProps> = ({ subscriptionId }) => {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'preview' | 'html' | 'css' | 'js'>('preview');

  const handleDownload = () => {
    if (!template) return;
    
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitemendr AI Export</title>
    <style>${template.css || ''}</style>
</head>
<body>
    ${template.html}
    ${template.js ? `<script>${template.js}</script>` : ''}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemendr-site-${subscriptionId.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const res = await apiClient.getProjectTemplate(subscriptionId) as { success: boolean; data: TemplateData };
        if (res.success) setTemplate(res.data);
      } catch (error) {
        console.error('Failed to fetch template', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [subscriptionId]);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <div className="w-12 h-12 border-2 border-ai-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-ai-blue">Decompiling AI Blueprint...</p>
    </div>
  );

  if (!template) return (
    <div className="p-20 text-center opacity-50 border border-dashed border-white/10 rounded-3xl">
      <p className="text-[10px] font-black uppercase tracking-[0.3em]">AI Template Generation in Progress</p>
      <span className="text-[8px] mt-2 block uppercase tracking-widest">Our neural engines are crafting your initial architecture. Please check back in 30 seconds.</span>
    </div>
  );

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-white/[0.02] gap-4">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <button 
            onClick={() => setView('preview')}
            className={`px-3 lg:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'preview' ? 'bg-ai-blue text-white' : 'hover:bg-white/5 text-medium-gray'}`}
          >
            Visual Preview
          </button>
          <button 
            onClick={() => setView('html')}
            className={`px-3 lg:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'html' ? 'bg-tech-purple text-white' : 'hover:bg-white/5 text-medium-gray'}`}
          >
            Source HTML
          </button>
          <button 
            onClick={() => setView('css')}
            className={`px-3 lg:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'css' ? 'bg-expert-green text-white' : 'hover:bg-white/5 text-medium-gray'}`}
          >
            Global CSS
          </button>
          <button 
            onClick={() => setView('js')}
            className={`px-3 lg:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'js' ? 'bg-orange-500 text-white' : 'hover:bg-white/5 text-medium-gray'}`}
          >
            Client JS
          </button>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-ai-blue/10 border border-ai-blue/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-ai-blue hover:bg-ai-blue hover:text-white transition-all"
          >
            <Download className="w-3 h-3" />
            Download Blueprint
          </button>
          <div className="text-[8px] font-black text-ai-blue uppercase tracking-widest opacity-50 hidden sm:block">
            Engine: {template.aiModel || 'GPT-4O-PRO'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {view === 'preview' ? (
          <iframe 
            srcDoc={`
              <html>
                <head>
                  <style>${template.css || ''}</style>
                </head>
                <body>${template.html || ''}</body>
              </html>
            `}
            className="w-full h-full bg-white"
            title="Project Preview"
          />
        ) : (
          <div className="p-6 h-full overflow-auto font-mono text-[11px] bg-black/50">
            <pre className="text-ai-blue selection:bg-white/10">
              <code>{view === 'html' ? template.html : view === 'css' ? template.css : template.js}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateViewer;