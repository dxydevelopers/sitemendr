'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingBag, 
  Check, 
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
  Cpu
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
  const purchasedAddonsList: unknown[] = (() => {
    if (Array.isArray(subscription?.purchasedAddons)) return subscription.purchasedAddons;
    if (typeof subscription?.purchasedAddons !== 'string') return [];
    try {
      const parsed: unknown = JSON.parse(subscription.purchasedAddons);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  const hasAddon = (addonId: string) => purchasedAddonsList.some(value =>
    value === addonId || (
      typeof value === 'object' && value !== null && 'id' in value && value.id === addonId
    )
  );

  const handlePurchase = async (addon: Addon) => {
  if (hasAddon(addon.id)) {
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
  <div className="space-y-8 animate-fade-in pb-12">
  <div className="flex flex-col gap-4 px-1 lg:flex-row lg:items-center lg:justify-between">
  <p className="text-sm text-white/45">Add services to this project.</p>
   
  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
  {categories.map((cat) => (
  <button 
  key={cat} 
  onClick={() => setActiveFilter(cat)}
  className={`px-4 py-2 rounded-lg text-[9px] font-semibold transition-all whitespace-nowrap ${
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
  const isPurchased = hasAddon(addon.id);
   
  return (
  <div 
  key={addon.id} 
  className="group relative bg-white/[0.01] border border-white/5 rounded-2xl p-5 sm:p-7 hover:bg-white/[0.03] hover:border-ai-blue/30 transition-colors overflow-hidden flex flex-col h-full"
  >
  {/* Background Gradient */}
  <div className="absolute top-0 right-0 w-48 h-48 bg-ai-blue/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-ai-blue/10 transition-colors"></div>
   
  <div className="relative z-10 space-y-8 flex-1">
  <div className="flex justify-between items-start">
  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500 shadow-xl">
  {addon.icon}
  </div>
  <div className="text-right">
  <span className="text-[8px] font-semibold text-ai-blue block mb-1">{addon.category}</span>
  <p className="text-2xl font-semibold text-white ">${addon.price}</p>
  </div>
  </div>

  <div className="space-y-3">
  <h3 className="text-base lg:text-lg font-semibold text-white leading-tight">
  {addon.name}
  </h3>
  <p className="text-[11px] text-white/40 font-medium leading-relaxed h-12 overflow-hidden line-clamp-2">
  {addon.description}
  </p>
  </div>

  <div className="space-y-3 pt-4 border-t border-white/5">
  <p className="text-[8px] font-semibold text-white/20 ">Included</p>
  {addon.features.map((feature, i) => (
  <div key={i} className="flex items-center gap-3">
  <ShieldCheck className="w-3.5 h-3.5 text-expert-green opacity-40" />
  <span className="text-[10px] font-bold text-white/60 ">{feature}</span>
  </div>
  ))}
  </div>
  </div>

  <div className="mt-7 relative z-10">
  <button
  onClick={() => handlePurchase(addon)}
  disabled={loading === addon.id || isPurchased}
  className={`w-full min-h-11 flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs transition-colors ${
  isPurchased 
  ? 'bg-expert-green/10 border border-expert-green/20 text-expert-green cursor-default' 
  : 'bg-white/5 border border-white/10 text-white hover:bg-ai-blue hover:border-ai-blue hover:scale-[1.02] active:scale-95 shadow-ai-blue/5'
  } disabled:opacity-50`}
  >
  {loading === addon.id ? (
  <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
  ) : isPurchased ? (
  <>
  <Check className="w-4 h-4" />
  <span>Added</span>
  </>
  ) : (
  <>
  <Cpu className="w-4 h-4" />
  <span>Add to workspace</span>
  </>
  )}
  </button>
  </div>
  </div>
  );
  })}
  </div>

  {/* Bespoke Request CTA */}
  <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
  <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
  <div className="max-w-2xl space-y-2">
  <h3 className="text-base font-semibold text-white">Need a different add-on?</h3>
  <p className="text-sm leading-6 text-white/45">Ask support about options for this project.</p>
  </div>
   
  <button 
  onClick={onRequestCustom}
  className="inline-flex min-h-11 flex-shrink-0 items-center gap-3 rounded-lg bg-ai-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-ai-blue/85"
  >
  Contact support
  <ArrowRight className="w-5 h-5" />
  </button>
  </div>
  </div>
  </div>
  );
};

export default AddonMarketplace;
