'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import {
  Plus,
  Save,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  Settings,
  Monitor,
  Tablet,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Layers,
  Palette,
  Layout,
  X,
  Check,
  Loader2,
  Lock
} from 'lucide-react';

// Types
interface Page {
  id: string;
  type: string;
  slug: string;
  title: string;
  isPublished: boolean;
  isHome: boolean;
  sections: PageSection[];
}

interface PageSection {
  id: string;
  sectionId: string;
  order: number;
  settings: Record<string, unknown>;
  section: SectionTemplate;
}

interface SectionTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  defaultSettings: Record<string, unknown>;
  schema: Record<string, unknown>;
  componentName: string;
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  containerWidth: string;
  buttonStyle: string;
  buttonSize: string;
  customCss?: string;
}

interface PageEditorProps {
  subscriptionId: string;
  purchasedAddons?: unknown[];
  onSave?: () => void;
  onClose?: () => void;
}

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type EditorMode = 'pages' | 'sections' | 'settings' | 'theme';

const PageEditor: React.FC<PageEditorProps> = ({
  subscriptionId,
  purchasedAddons = [],
  onSave,
  onClose
}) => {
  // State
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [sectionTemplates, setSectionTemplates] = useState<SectionTemplate[]>([]);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [editorMode, setEditorMode] = useState<EditorMode>('pages');
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check if Standard CMS addon is purchased
  const isLocked = !purchasedAddons.some((addon: unknown) =>
    (typeof addon === 'string' && addon === 'addon_cms_basic') ||
    (typeof addon === 'object' && addon !== null && 'id' in addon && (addon as { id: string }).id === 'addon_cms_basic')
  );

  // Load data
  const loadData = useCallback(async () => {
    if (isLocked || !subscriptionId || subscriptionId === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const [pagesRes, sectionsRes, themeRes] = await Promise.all([
        apiClient.getPages(subscriptionId),
        apiClient.getSectionTemplates(),
        apiClient.getThemeSettings(subscriptionId)
      ]);

      if (pagesRes.success) setPages(pagesRes.data as Page[]);
      if (sectionsRes.success) setSectionTemplates(sectionsRes.data as SectionTemplate[]);
      if (themeRes.success) setThemeSettings(themeRes.data as ThemeSettings);

      // Select first page if available
      if (pagesRes.success && (pagesRes.data as Page[]).length > 0) {
        setSelectedPage((pagesRes.data as Page[])[0]);
      }
    } catch (error) {
      console.error('Failed to load editor data:', error);
      setStatus({ type: 'error', message: 'Failed to load editor data' });
    } finally {
      setLoading(false);
    }
  }, [subscriptionId, isLocked]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Page operations
  const handleCreatePage = async () => {
    const title = prompt('Enter page title:');
    if (!title) return;

    try {
      const res = await apiClient.createPage({
        subscriptionId,
        title,
        type: 'CUSTOM'
      });

      if (res.success) {
        await loadData();
        setStatus({ type: 'success', message: 'Page created!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to create page' });
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const res = await apiClient.deletePage(pageId);
      if (res.success) {
        if (selectedPage?.id === pageId) {
          setSelectedPage(null);
        }
        await loadData();
        setStatus({ type: 'success', message: 'Page deleted!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to delete page' });
    }
  };

  const handlePublishPage = async () => {
    if (!selectedPage) return;

    try {
      const res = selectedPage.isPublished
        ? await apiClient.unpublishPage(selectedPage.id)
        : await apiClient.publishPage(selectedPage.id);

      if (res.success) {
        await loadData();
        setStatus({ type: 'success', message: selectedPage.isPublished ? 'Page unpublished!' : 'Page published!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to publish page' });
    }
  };

  // Section operations
  const handleAddSection = async (sectionId: string) => {
    if (!selectedPage) return;

    try {
      const res = await apiClient.addSectionToPage(selectedPage.id, sectionId);
      if (res.success) {
        await loadData();
        setStatus({ type: 'success', message: 'Section added!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to add section' });
    }
  };

  const handleUpdateSection = async (sectionId: string, settings: Record<string, unknown>) => {
    if (!selectedPage) return;

    try {
      const res = await apiClient.updatePageSection(selectedPage.id, sectionId, settings);
      if (res.success) {
        await loadData();
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to update section' });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!selectedPage || !confirm('Remove this section?')) return;

    try {
      const res = await apiClient.removeSectionFromPage(selectedPage.id, sectionId);
      if (res.success) {
        await loadData();
        setSelectedSection(null);
        setStatus({ type: 'success', message: 'Section removed!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to remove section' });
    }
  };

  const handleReorderSections = async (fromIndex: number, toIndex: number) => {
    if (!selectedPage) return;

    const sections = [...selectedPage.sections];
    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);

    const reorderData = sections.map((s, i) => ({ id: s.id, order: i }));

    try {
      const res = await apiClient.reorderSections(selectedPage.id, reorderData);
      if (res.success) {
        await loadData();
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to reorder sections' });
    }
  };

  // Theme operations
  const handleUpdateTheme = async (settings: Partial<ThemeSettings>) => {
    if (!themeSettings) return;

    try {
      const res = await apiClient.updateThemeSettings(subscriptionId, settings);
      if (res.success) {
        setThemeSettings({ ...themeSettings, ...settings } as ThemeSettings);
        setStatus({ type: 'success', message: 'Theme saved!' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save theme' });
    }
  };

  // Get viewport width
  const getViewportWidth = () => {
    switch (viewMode) {
      case 'desktop': return '100%';
      case 'tablet': return '768px';
      case 'mobile': return '375px';
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-white/5 rounded-3xl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-ai-blue mx-auto mb-4" />
          <p className="text-medium-gray">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-white/5 rounded-3xl">
        <div className="text-center p-8">
          <Lock className="w-12 h-12 text-medium-gray mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">CMS Add-on Required</h3>
          <p className="text-medium-gray text-sm">Purchase the Standard CMS add-on to access the visual editor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[800px] flex flex-col bg-black/20 rounded-3xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">Visual Editor</h2>
            <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest">
              {selectedPage ? selectedPage.title : 'Select a page'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'desktop' ? 'bg-ai-blue text-black' : 'hover:bg-white/10'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'tablet' ? 'bg-ai-blue text-black' : 'hover:bg-white/10'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'mobile' ? 'bg-ai-blue text-black' : 'hover:bg-white/10'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Publish button */}
          {selectedPage && (
            <button
              onClick={handlePublishPage}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-colors ${
                selectedPage.isPublished
                  ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                  : 'bg-expert-green/20 text-expert-green hover:bg-expert-green/30'
              }`}
            >
              {selectedPage.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {selectedPage.isPublished ? 'Unpublish' : 'Publish'}
            </button>
          )}

          {/* Sidebar toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            {showSidebar ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
          status.type === 'success' ? 'bg-expert-green/20 text-expert-green' : 'bg-red-500/20 text-red-400'
        }`}>
          {status.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {status.message}
          <button onClick={() => setStatus(null)} className="ml-auto hover:opacity-70">×</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor canvas */}
        <div className="flex-1 overflow-auto bg-neutral-900 p-8">
          <div
            className="mx-auto transition-all duration-300"
            style={{ width: getViewportWidth(), maxWidth: '100%' }}
          >
            {selectedPage ? (
              <div className="bg-white rounded-lg overflow-hidden shadow-2xl min-h-[600px]">
                {/* Page sections */}
                {selectedPage.sections.length > 0 ? (
                  <div className="space-y-0">
                    {selectedPage.sections.map((pageSection, index) => (
                      <SectionRenderer
                        key={pageSection.id}
                        section={pageSection}
                        theme={themeSettings}
                        isSelected={selectedSection?.id === pageSection.id}
                        onSelect={() => setSelectedSection(pageSection)}
                        onUpdate={(settings) => handleUpdateSection(pageSection.id, settings)}
                        onDelete={() => handleDeleteSection(pageSection.id)}
                        onMoveUp={() => index > 0 && handleReorderSections(index, index - 1)}
                        onMoveDown={() => index < selectedPage.sections.length - 1 && handleReorderSections(index, index + 1)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No sections yet</p>
                      <p className="text-sm mt-2">Add sections from the sidebar to build your page</p>
                    </div>
                  </div>
                )}

                {/* Add section button at bottom */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setEditorMode('sections')}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-ai-blue hover:text-ai-blue transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Section
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[600px] flex items-center justify-center bg-white/5 rounded-3xl">
                <div className="text-center">
                  <Layout className="w-12 h-12 text-medium-gray mx-auto mb-4" />
                  <p className="text-medium-gray font-medium mb-4">No page selected</p>
                  <button
                    onClick={handleCreatePage}
                    className="px-6 py-3 bg-ai-blue text-black rounded-xl font-bold uppercase text-sm tracking-widest hover:bg-ai-blue/80 transition-colors"
                  >
                    Create First Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white/5 border-l border-white/10 flex flex-col overflow-hidden">
            {/* Sidebar tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setEditorMode('pages')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  editorMode === 'pages' ? 'text-ai-blue border-b-2 border-ai-blue' : 'text-medium-gray hover:text-white'
                }`}
              >
                Pages
              </button>
              <button
                onClick={() => setEditorMode('sections')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  editorMode === 'sections' ? 'text-ai-blue border-b-2 border-ai-blue' : 'text-medium-gray hover:text-white'
                }`}
              >
                Sections
              </button>
              <button
                onClick={() => setEditorMode('theme')}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  editorMode === 'theme' ? 'text-ai-blue border-b-2 border-ai-blue' : 'text-medium-gray hover:text-white'
                }`}
              >
                Theme
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-auto p-4">
              {editorMode === 'pages' && (
                <PageList
                  pages={pages}
                  selectedPage={selectedPage}
                  onSelect={setSelectedPage}
                  onCreate={handleCreatePage}
                  onDelete={handleDeletePage}
                />
              )}
              {editorMode === 'sections' && (
                <SectionLibrary
                  sections={sectionTemplates}
                  onAdd={handleAddSection}
                />
              )}
              {editorMode === 'theme' && themeSettings && (
                <ThemeEditor
                  settings={themeSettings}
                  onUpdate={handleUpdateTheme}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components
const PageList: React.FC<{
  pages: Page[];
  selectedPage: Page | null;
  onSelect: (page: Page) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}> = ({ pages, selectedPage, onSelect, onCreate, onDelete }) => (
  <div className="space-y-3">
    <button
      onClick={onCreate}
      className="w-full py-3 bg-ai-blue/20 text-ai-blue rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-ai-blue/30 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" /> New Page
    </button>

    <div className="space-y-2">
      {pages.map(page => (
        <div
          key={page.id}
          className={`p-3 rounded-xl cursor-pointer transition-colors ${
            selectedPage?.id === page.id
              ? 'bg-ai-blue/20 border border-ai-blue/50'
              : 'bg-white/5 hover:bg-white/10 border border-transparent'
          }`}
          onClick={() => onSelect(page)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">{page.title}</p>
              <p className="text-[10px] text-medium-gray">{page.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              {page.isHome && (
                <span className="px-2 py-1 bg-expert-green/20 text-expert-green text-[8px] font-black uppercase rounded">
                  HOME
                </span>
              )}
              {page.isPublished && (
                <span className="w-2 h-2 bg-expert-green rounded-full" title="Published" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                className="p-1 hover:bg-red-500/20 text-medium-gray hover:text-red-400 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SectionLibrary: React.FC<{
  sections: SectionTemplate[];
  onAdd: (sectionId: string) => void;
}> = ({ sections, onAdd }) => {
  const categories = [...new Set(sections.map(s => s.category))];

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category}>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
            {category}
          </h3>
          <div className="space-y-2">
            {sections.filter(s => s.category === category).map(section => (
              <div
                key={section.id}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors group"
                onClick={() => onAdd(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{section.name}</p>
                    <p className="text-[10px] text-medium-gray">{section.description}</p>
                  </div>
                  <Plus className="w-5 h-5 text-medium-gray group-hover:text-ai-blue transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ThemeEditor: React.FC<{
  settings: ThemeSettings;
  onUpdate: (settings: Partial<ThemeSettings>) => void;
}> = ({ settings, onUpdate }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
        Primary Color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={settings.primaryColor}
          onChange={(e) => onUpdate({ primaryColor: e.target.value })}
          className="w-10 h-10 rounded-lg cursor-pointer"
        />
        <input
          type="text"
          value={settings.primaryColor}
          onChange={(e) => onUpdate({ primaryColor: e.target.value })}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
        />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
        Secondary Color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={settings.secondaryColor}
          onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
          className="w-10 h-10 rounded-lg cursor-pointer"
        />
        <input
          type="text"
          value={settings.secondaryColor}
          onChange={(e) => onUpdate({ secondaryColor: e.target.value })}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
        />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
        Background Color
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          className="w-10 h-10 rounded-lg cursor-pointer"
        />
        <input
          type="text"
          value={settings.backgroundColor}
          onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
        />
      </div>
    </div>

    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
        Border Radius
      </label>
      <select
        value={settings.borderRadius}
        onChange={(e) => onUpdate({ borderRadius: e.target.value })}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
      >
        <option value="0">Square (0px)</option>
        <option value="4px">Small (4px)</option>
        <option value="8px">Medium (8px)</option>
        <option value="16px">Large (16px)</option>
        <option value="9999px">Pill</option>
      </select>
    </div>

    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-medium-gray mb-2">
        Heading Font
      </label>
      <select
        value={settings.headingFont}
        onChange={(e) => onUpdate({ headingFont: e.target.value })}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
      >
        <option value="Inter">Inter</option>
        <option value="Poppins">Poppins</option>
        <option value="Roboto">Roboto</option>
        <option value="Playfair Display">Playfair Display</option>
        <option value="Montserrat">Montserrat</option>
      </select>
    </div>
  </div>
);

const SectionRenderer: React.FC<{
  section: PageSection;
  theme: ThemeSettings | null;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (settings: Record<string, unknown>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ section, theme, isSelected, onSelect, onDelete, onMoveUp, onMoveDown }) => {
  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-ai-blue' : ''}`}
      onClick={onSelect}
    >
      {/* Section controls */}
      <div className={`absolute top-2 right-2 z-10 flex items-center gap-1 transition-opacity ${
        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg"
          title="Move up"
        >
          <ChevronLeft className="w-4 h-4 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg"
          title="Move down"
        >
          <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 bg-red-500/50 hover:bg-red-500 text-white rounded-lg"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Section content placeholder */}
      <div className="p-8 min-h-[100px] bg-gray-50 border border-transparent">
        <div className="text-center text-gray-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">{section.section.name}</p>
          <p className="text-xs">{section.section.category}</p>
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
