'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Type, 
  Image as ImageIcon, 
  Save, 
  RotateCcw, 
  MousePointer2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  Upload,
  Trash2,
  X
} from 'lucide-react';

interface VisualContentEditorProps {
  subscriptionId: string;
  onSave?: () => void;
  onClose?: () => void;
}

const VisualContentEditor: React.FC<VisualContentEditorProps> = ({ subscriptionId, onSave, onClose }) => {
  const [template, setTemplate] = useState<{ html: string; css: string; js: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ id: string; type: string; content: string } | null>(null);
  const [showProperties, setShowSidebar] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const templateUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTemplate = useCallback(async () => {
    if (!subscriptionId || subscriptionId === 'undefined') {
      console.warn('VisualContentEditor: Missing subscriptionId, skipping fetch');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.getProjectTemplate(subscriptionId);
      if (res.success && res.data) {
        setTemplate(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
      setStatus({ type: 'error', message: 'Failed to load template' });
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const syncIframeIdToTemplate = useCallback((id: string, type: string, content: string) => {
    if (!template) return;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.html, 'text/html');
    
    // If the element with this ID already exists, we're good
    if (doc.getElementById(id)) return;
    
    // Otherwise, we need to find the element by content/type and assign it the ID
    // This is a bit tricky, but we can try to find an element that matches
    const elements = doc.body.querySelectorAll('*');
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const elType = el.tagName === 'IMG' ? 'image' : 'text';
      const elContent = elType === 'image' ? el.getAttribute('src') : el.textContent;
      
      if (elType === type && elContent === content && !el.id) {
        el.id = id;
        const newHtml = doc.body.innerHTML;
        setTemplate({ ...template, html: newHtml });
        break;
      }
    }
  }, [template]);

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        const { element } = event.data;
        setSelectedElement(element);
        
        if (element.id && template) {
          syncIframeIdToTemplate(element.id, element.type, element.content);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [template, syncIframeIdToTemplate]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    setStatus(null);
    try {
      await apiClient.updateProjectTemplate(subscriptionId, template);
      setStatus({ type: 'success', message: 'Template saved successfully' });
      if (onSave) onSave();
      
      // Clear success message after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error('Failed to save template:', error);
      setStatus({ type: 'error', message: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  const updateSelectedContent = (newContent: string) => {
    if (!selectedElement || !template) return;
    
    // Update local state for the form
    setSelectedElement({ ...selectedElement, content: newContent });

    // Update the iframe directly without reloading to avoid flicker
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_ELEMENT',
        elementId: selectedElement.id,
        contentType: selectedElement.type,
        content: newContent
      }, '*');
    }
    
    // Also update the template state (which will eventually be used for saving)
    // We debounce this to prevent the iframe from reloading (via srcDoc) on every keystroke
    if (templateUpdateTimeoutRef.current) {
      clearTimeout(templateUpdateTimeoutRef.current);
    }

    templateUpdateTimeoutRef.current = setTimeout(() => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(template.html, 'text/html');
      const el = doc.getElementById(selectedElement.id);
      
      if (el) {
        if (selectedElement.type === 'text') {
          el.textContent = newContent;
        } else if (selectedElement.type === 'image') {
          el.setAttribute('src', newContent);
        }
        
        const newHtml = doc.body.innerHTML;
        setTemplate({ ...template, html: newHtml });
      }
    }, 1000);
  };

  const handleNeuralRewrite = async () => {
    if (!selectedElement) return;
    
    setOptimizing(true);
    setStatus(null);
    try {
      const res = await apiClient.optimizeContent(
        selectedElement.content, 
        selectedElement.type,
        "Make it more compelling and professional for a high-tech audience."
      );
      
      if (res.success && res.data) {
        updateSelectedContent(res.data);
        setStatus({ type: 'success', message: 'Content optimized' });
      }
    } catch (error) {
      console.error('Rewrite:', error);
      setStatus({ type: 'error', message: 'Optimization failed' });
    } finally {
      setOptimizing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setOptimizing(true);
    setStatus(null);
    try {
      const res = await apiClient.uploadMedia(formData);
      if (res.success && res.data?.url) {
        updateSelectedContent(res.data.url);
        setStatus({ type: 'success', message: 'Upload complete' });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setStatus({ type: 'error', message: 'Upload failed' });
    } finally {
      setOptimizing(false);
    }
  };

  const handleDeleteElement = () => {
    if (!selectedElement || !template) return;
    if (!confirm('Permanently remove this component from the layout?')) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(template.html, 'text/html');
    const el = doc.getElementById(selectedElement.id);
    
    if (el) {
      el.remove();
      const newHtml = doc.body.innerHTML;
      setTemplate({ ...template, html: newHtml });
      setSelectedElement(null);
      
      // Update iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'REMOVE_ELEMENT',
          elementId: selectedElement.id
        }, '*');
      }
    }
  };

  const iframeSrcDoc = React.useMemo(() => {
    if (!template) return '';

    const editorScript = `
      <script>
        window.addEventListener('message', (event) => {
          if (event.data.type === 'UPDATE_ELEMENT') {
            const { elementId, contentType, content } = event.data;
            const el = document.getElementById(elementId);
            if (el) {
              if (contentType === 'text') {
                el.textContent = content;
              } else if (contentType === 'image') {
                el.src = content;
              }
            }
          } else if (event.data.type === 'REMOVE_ELEMENT') {
            const el = document.getElementById(event.data.elementId);
            if (el) el.remove();
          }
        });

        document.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const target = e.target;
          // Assign random ID if not exists for tracking
          if (!target.id) target.id = 'editable-' + Math.random().toString(36).substr(2, 9);
          
          const type = target.tagName === 'IMG' ? 'image' : 'text';
          const content = type === 'image' ? target.src : target.textContent;
          
          // Remove previous outlines
          document.querySelectorAll('.sitemendr-selected').forEach(el => el.classList.remove('sitemendr-selected'));
          target.classList.add('sitemendr-selected');
          
          window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            element: { id: target.id, type, content }
          }, '*');
        });

        // Add visual indicator styles
        const style = document.createElement('style');
        style.textContent = \`
          .sitemendr-selected {
            outline: 2px solid #00f2fe !important;
            outline-offset: 2px !important;
            cursor: pointer !important;
          }
          * { transition: outline 0.2s ease; }
          *:hover { outline: 1px dashed rgba(0, 242, 254, 0.5); }
        \`;
        document.head.appendChild(style);
      </script>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${template.css}</style>
        </head>
        <body>
          <div id="sitemendr-root">${template.html}</div>
          ${editorScript}
          <script>${template.js}</script>
        </body>
      </html>
    `;
  }, [template, template?.css, template?.html, template?.js]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="w-10 h-10 text-ai-blue animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-ai-blue animate-pulse">Initializing AI Editor...</p>
      </div>
    );
  }

  const getViewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="flex flex-col min-h-[600px] lg:h-[800px] bg-darker-bg border border-white/5 rounded-3xl lg:rounded-[40px] overflow-hidden font-mono relative shadow-2xl">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-white/5 flex flex-wrap justify-between items-center bg-white/[0.01] backdrop-blur-xl gap-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-ai-blue/10 rounded-xl lg:rounded-2xl flex items-center justify-center border border-ai-blue/20">
            <MousePointer2 className="w-4 h-4 lg:w-5 lg:h-5 text-ai-blue" />
          </div>
          <div>
            <h3 className="text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] text-white">Site Editor</h3>
            <p className="text-[7px] lg:text-[8px] text-medium-gray mt-1 hidden sm:block">Changes sync in real-time</p>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 bg-black/40 p-1 rounded-xl lg:rounded-2xl border border-white/5">
          <button 
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all ${viewMode === 'desktop' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
          >
            <Monitor className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>
          <button 
            onClick={() => setViewMode('tablet')}
            className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all ${viewMode === 'tablet' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
          >
            <Tablet className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl transition-all ${viewMode === 'mobile' ? 'bg-ai-blue/20 text-ai-blue' : 'text-medium-gray hover:text-white'}`}
          >
            <Smartphone className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 lg:gap-3 ml-auto sm:ml-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 lg:px-6 py-2 lg:py-2.5 bg-ai-blue text-black rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Publish Changes'}</span>
            <span className="sm:hidden">{saving ? '...' : 'SYNC'}</span>
          </button>
          
          {onClose && (
             <button
             onClick={onClose}
             className="p-2 lg:p-2.5 bg-white/5 border border-white/10 rounded-lg lg:rounded-xl hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 transition-all"
           >
             <RotateCcw className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
           </button>
          )}

          <button 
            onClick={() => setShowSidebar(!showProperties)}
            className={`lg:hidden p-2 rounded-lg border transition-all ${showProperties ? 'bg-ai-blue text-black border-ai-blue' : 'bg-white/5 text-white border-white/10'}`}
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Editor Preview */}
        <div className="flex-1 bg-black/40 p-4 lg:p-8 flex justify-center overflow-auto custom-scrollbar">
          <div 
            className="bg-white rounded-lg shadow-2xl transition-all duration-500 overflow-hidden relative h-fit"
            style={{ width: getViewWidth(), minHeight: '600px' }}
          >
            <iframe
              ref={iframeRef}
              title="Visual Editor"
              className="w-full h-full border-none min-h-[800px]"
              srcDoc={iframeSrcDoc}
            />
          </div>
          {saving && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-darker-bg p-6 lg:p-8 rounded-2xl lg:rounded-3xl border border-ai-blue/30 flex flex-col items-center gap-4 shadow-2xl">
                <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 text-ai-blue animate-spin" />
                <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-white animate-pulse text-center">Publishing to live site...</p>
              </div>
            </div>
          )}
        </div>

        {/* Properties Sidebar */}
        <div className={`fixed lg:relative inset-y-0 right-0 w-72 lg:w-80 border-l border-white/5 bg-black/90 lg:bg-white/[0.02] flex flex-col z-[60] transform transition-transform duration-300 backdrop-blur-xl lg:translate-x-0 ${showProperties ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 lg:p-6 border-b border-white/5 flex justify-between items-center">
            <h4 className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-ai-blue">NODE_PROPERTIES</h4>
            <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 text-medium-gray"><X className="w-4 h-4" /></button>
          </div>
          
          <div className="flex-1 p-4 lg:p-6 overflow-auto custom-scrollbar">
            {selectedElement ? (
              <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {selectedElement.type === 'text' ? (
                        <Type className="w-4 h-4 text-tech-purple" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-expert-green" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-white">
                        {selectedElement.type}_COMPONENT
                      </span>
                    </div>
                    <button 
                      onClick={handleDeleteElement}
                      className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Element"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <label className="text-[8px] text-medium-gray uppercase tracking-widest block mb-2">ID: {selectedElement.id}</label>
                  
                  {selectedElement.type === 'text' ? (
                    <div className="space-y-4">
                      <textarea
                        value={selectedElement.content}
                        onChange={(e) => updateSelectedContent(e.target.value)}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] text-white focus:border-ai-blue outline-none resize-none transition-all"
                      />
                      <button
                        onClick={handleNeuralRewrite}
                        disabled={optimizing}
                        className="w-full py-2.5 bg-tech-purple text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-tech-purple transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {optimizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        {optimizing ? 'REFINING...' : 'NEURAL_REWRITE'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/10 relative group/img">
                        <img src={selectedElement.content} alt="Preview" className="w-full h-full object-contain" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                          <Upload className="w-6 h-6 text-white mb-2" />
                          <span className="text-[8px] font-black uppercase text-white">Upload New Asset</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] text-medium-gray uppercase tracking-widest">Source URL</label>
                        <input
                          type="text"
                          value={selectedElement.content}
                          onChange={(e) => updateSelectedContent(e.target.value)}
                          placeholder="Image URL"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white focus:border-ai-blue outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-ai-blue/5 rounded-2xl border border-ai-blue/10">
                  <p className="text-[9px] text-ai-blue/70 leading-relaxed font-bold">
                    Changes are saved but not visible live. Click &quot;Publish&quot; to make them visible.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <MousePointer2 className="w-8 h-8 text-medium-gray mb-4" />
                <p className="text-[9px] font-black uppercase tracking-widest text-medium-gray">
                  Select an element<br/>to begin refinement
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Status */}
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
              <div className="w-1.5 h-1.5 bg-ai-blue rounded-full animate-pulse"></div>
              <span className="text-[8px] font-black uppercase tracking-widest text-ai-blue">Ready for input</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-[8px] font-black text-medium-gray uppercase tracking-widest">
          <span>{viewMode.toUpperCase()}_VIEWPORT</span>
          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
          <span>DOM_READY</span>
        </div>
      </div>
    </div>
  );
};

export default VisualContentEditor;
