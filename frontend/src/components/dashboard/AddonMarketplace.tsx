'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  CheckCircle, 
  Database, 
  Layout, 
  Zap, 
  Globe, 
  Search,
  Loader2,
  ArrowRight,
  Link2,
  Mail,
  ShieldCheck,
  Cpu,
  Boxes
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  category: string;
  features: string[];
}

const ADDONS: Addon[] = [
  {
    id: 'addon_cms_basic',
    name: 'Standard CMS',
    description: 'Empower your team to update content instantly without code.',
    price: 499,
    icon: <Layout className="w-6 h-6 text-ai-blue" />,
    category: 'Backend',
    features: ['Blog management', 'Media library', 'SEO controls', 'Multi-user access']
  },
  {
    id: 'addon_ecommerce_lite',
    name: 'E-commerce Core',
    description: 'Transform your site into a high-performance digital storefront.',
    price: 2999,
    icon: <ShoppingBag className="w-6 h-6 text-expert-green" />,
    category: 'Commerce',
    features: ['Product catalog', 'Secure checkout', 'Order tracking', 'Inventory management']
  },
  {
    id: 'addon_ai_search',
    name: 'Smart Search',
    description: 'AI-powered site search that understands user intent perfectly.',
    price: 799,
    icon: <Search className="w-6 h-6 text-tech-purple" />,
    category: 'AI Tools',
    features: ['Semantic understanding', 'Instant results', 'Voice search ready', 'Search analytics']
  },
  {
    id: 'addon_analytics_pro',
    name: 'Advanced Analytics',
    description: 'Advanced real-time analytics with predictive visitor modeling.',
    price: 599,
    icon: <Zap className="w-6 h-6 text-orange-500" />,
    category: 'Analytics',
    features: ['Heatmaps', 'Conversion funnels', 'A/B testing', 'ROI tracking']
  },
  {
    id: 'addon_global_cdn',
    name: 'Global CDN',
    description: 'Deploy your assets to over 300 edge locations globally.',
    price: 199,
    icon: <Globe className="w-6 h-6 text-ai-blue" />,
    category: 'Infrastructure',
    features: ['Global edge caching', 'DDoS protection', 'Image optimization', '1TB bandwidth']
  },
  {
    id: 'addon_database_sync',
    name: 'Cloud Database',
    description: 'Cloud-synced database for high-concurrency applications.',
    price: 1499,
    icon: <Database className="w-6 h-6 text-expert-green" />,
    category: 'Backend',
    features: ['Automatic backups', 'Low latency', 'Unlimited collections', 'API access']
  },
  {
    id: 'addon_crm_sync',
    name: 'Unified CRM Sync',
    description: 'Bi-directional synchronization with Salesforce, HubSpot, or Zoho.',
    price: 899,
    icon: <Link2 className="w-6 h-6 text-ai-blue" />,
    category: 'Integrations',
    features: ['Lead auto-capture', 'Field mapping', 'Real-time updates', 'Custom webhooks']
  },
  {
    id: 'addon_email_nexus',
    name: 'Email Marketing Hub',
    description: 'Direct integration with Mailchimp, Klaviyo, or SendGrid.',
    price: 499,
    icon: <Mail className="w-6 h-6 text-tech-purple" />,
    category: 'Integrations',
    features: ['Campaign automation', 'List segmentation', 'Dynamic content', 'Open/Click tracking']
  }
];

interface AddonMarketplaceProps {
  subscription: {
    id: string;
    purchasedAddons?: any;
  } | null;
  onRequestCustom?: () => void;
}

const AddonMarketplace: React.FC<AddonMarketplaceProps> = ({ subscription, onRequestCustom }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [activeCategory, setActiveFilter] = useState('ALL');

  // Parse purchased addons from JSON field if needed
  const purchasedAddonsList = Array.isArray(subscription?.purchasedAddons) 
    ? subscription?.purchasedAddons 
    : typeof subscription?.purchasedAddons === 'string'
      ? JSON.parse(subscription.purchasedAddons)
      : [];

  const handlePurchase = async (addon: Addon) => {
    if (purchasedAddonsList.some((a: any) => (a.id === addon.id || a === addon.id))) {
      return;
    }

    setLoading(addon.id);
    try {
      const response = await apiClient.initializePayment({
        amount: addon.price,
        serviceType: 'addon',
        description: `Purchase of ${addon.name} Add-on`,
        metadata: {
          addonId: addon.id,
          addonName: addon.name,
          subscriptionId: subscription?.id
        }
      });

      if (response.success && response.data?.paystack?.authorization_url) {
        window.location.href = response.data.paystack.authorization_url;
      } else {
        alert('Payment initialization failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(ADDONS.map(a => a.category.toUpperCase())))];
  const filteredAddons = ADDONS.filter(a => activeCategory === 'ALL' || a.category.toUpperCase() === activeCategory);

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ai-blue/10 border border-ai-blue/20 rounded-xl flex items-center justify-center">
              <Boxes className="w-5 h-5 text-ai-blue" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Enhancement Protocols
            </h2>
          </div>
          <p className="text-[10px] text-medium-gray font-bold uppercase tracking-widest mt-1 opacity-60">Deploy additional modules to your infrastructure</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
          {categories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeCategory === cat ? 'bg-ai-blue text-white shadow-lg shadow-ai-blue/20' : 'text-white/40 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {filteredAddons.map((addon) => {
          const isPurchased = purchasedAddonsList.some((a: any) => (a.id === addon.id || a === addon.id));
          
          return (
            <div 
              key={addon.id} 
              className="group relative bg-white/[0.01] border border-white/5 rounded-[40px] p-8 lg:p-10 hover:bg-white/[0.03] hover:border-ai-blue/30 transition-all duration-500 overflow-hidden flex flex-col h-full"
            >
              {/* Background Gradient */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-ai-blue/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-ai-blue/10 transition-colors"></div>
              
              <div className="relative z-10 space-y-8 flex-1">
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl">
                    {addon.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black text-ai-blue uppercase tracking-[0.3em] block mb-1">{addon.category}</span>
                    <p className="text-2xl font-black text-white tracking-tighter">${addon.price}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base lg:text-lg font-black uppercase tracking-widest text-white leading-tight">
                    {addon.name}
                  </h3>
                  <p className="text-[11px] text-white/40 font-medium uppercase leading-relaxed h-12 overflow-hidden line-clamp-2">
                    {addon.description}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Included_Payload:</p>
                  {addon.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <ShieldCheck className="w-3.5 h-3.5 text-expert-green opacity-40" />
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 relative z-10">
                <button
                  onClick={() => handlePurchase(addon)}
                  disabled={loading === addon.id || isPurchased}
                  className={`w-full flex items-center justify-center gap-4 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 shadow-xl ${
                    isPurchased 
                      ? 'bg-expert-green/10 border border-expert-green/20 text-expert-green cursor-default' 
                      : 'bg-white/5 border border-white/10 text-white hover:bg-ai-blue hover:border-ai-blue hover:scale-[1.02] active:scale-95 shadow-ai-blue/5'
                  } disabled:opacity-50`}
                >
                  {loading === addon.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</>
                  ) : isPurchased ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Module_Live</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>Initialize Deployment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bespoke Request CTA */}
      <div className="mt-20 p-8 lg:p-16 bg-gradient-to-br from-ai-blue/10 via-transparent to-tech-purple/10 border border-white/10 rounded-[48px] relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-tech-purple/5 blur-[120px] rounded-full group-hover:bg-tech-purple/10 transition-colors"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-tech-purple animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-tech-purple">Custom Architecture Support</span>
            </div>
            <h3 className="text-2xl lg:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              Require Custom <span className="text-ai-blue italic">Infrastructure?</span>
            </h3>
            <p className="text-xs lg:text-sm text-white/40 leading-relaxed font-bold uppercase tracking-wide">
              Our engineering team can architect bespoke modules tailored specifically to your enterprise operational requirements. From specialized neural models to complex legacy migrations.
            </p>
          </div>
          
          <button 
            onClick={onRequestCustom}
            className="flex-shrink-0 flex items-center gap-4 px-12 py-6 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10"
          >
            Consult Architect
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddonMarketplace;
