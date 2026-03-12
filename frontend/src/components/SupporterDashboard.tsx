'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Crown, 
  Star, 
  Shield, 
  Heart, 
  Gift, 
  Calendar, 
  CreditCard, 
  LogOut,
  User,
  ExternalLink,
  ChevronRight,
  Info,
  Trophy,
  Users
} from 'lucide-react';
import { apiClient, Supporter, User as UserType } from '@/lib/api';

const SupporterDashboard: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [supporter, setSupporter] = useState<Supporter | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, profileRes] = await Promise.all([
        apiClient.getMySupporterStatus(),
        apiClient.getProfile()
      ]);

      if (statusRes.success) setSupporter(statusRes.supporter);
      if (profileRes.success) setUser(profileRes.user);
    } catch (err) {
      console.error('Failed to fetch supporter data', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierIcon = (slug?: string) => {
    switch (slug) {
      case 'starter': return <Heart className="w-6 h-6 text-pink-500" />;
      case 'standard': return <Zap className="w-6 h-6 text-ai-blue" />;
      case 'plus': return <Star className="w-6 h-6 text-tech-purple" />;
      case 'premium': return <Shield className="w-6 h-6 text-expert-green" />;
      case 'founders-circle': return <Crown className="w-6 h-6 text-yellow-500" />;
      default: return <Heart className="w-6 h-6 text-ai-blue" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!supporter) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-ai-blue/10 rounded-full flex items-center justify-center mb-8">
          <Heart className="w-10 h-10 text-ai-blue" />
        </div>
        <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Not a Supporter Yet</h2>
        <p className="text-medium-gray max-w-md mb-8 opacity-60">
          Support the Sitemendr community and unlock exclusive rewards, discounts, and perks.
        </p>
        <button
          onClick={() => window.location.href = '/support'}
          className="px-10 py-4 bg-ai-blue text-white font-mono font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-ai-blue transition-all"
        >
          View Supporter Tiers
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans selection:bg-ai-blue/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black flex flex-col z-50">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-ai-blue shadow-[0_0_10px_#0066FF]"></div>
            <span className="font-mono text-[10px] font-black text-white uppercase tracking-[0.3em]">SUPPORTER_HUD</span>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto mt-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'overview' ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/20' : 'text-medium-gray hover:text-white hover:bg-white/5'}`}
          >
            <Trophy className="w-4 h-4" />
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('perks')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'perks' ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/20' : 'text-medium-gray hover:text-white hover:bg-white/5'}`}
          >
            <Gift className="w-4 h-4" />
            My Perks
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'events' ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/20' : 'text-medium-gray hover:text-white hover:bg-white/5'}`}
          >
            <Calendar className="w-4 h-4" />
            Events
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'billing' ? 'bg-ai-blue/10 text-ai-blue border border-ai-blue/20' : 'text-medium-gray hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </button>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ai-blue to-tech-purple flex items-center justify-center font-black text-white text-xs">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left overflow-hidden">
              <p className="text-[10px] font-black text-white uppercase truncate">{user?.name}</p>
              <p className="text-[7px] font-mono text-ai-blue uppercase tracking-widest">{supporter.tier?.name}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto bg-[#050505]">
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-12 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-black uppercase tracking-tighter">Supporter Dashboard</h2>
            <div className="h-4 w-px bg-white/10"></div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-medium-gray uppercase tracking-widest">Auth_Token:</span>
              <span className="text-[9px] font-mono text-expert-green font-black tracking-tighter uppercase">Verified</span>
            </div>
          </div>
        </header>

        <div className="p-12 max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-fade-in">
              {/* Hero Status */}
              <div className="relative bg-black border border-white/5 p-10 overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-ai-blue/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-10">
                  <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl group-hover:border-ai-blue/40 transition-all duration-500">
                    {getTierIcon(supporter.tier?.slug)}
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-[10px] font-mono font-black text-ai-blue uppercase tracking-[0.4em] mb-4 block">Current Status: Active</span>
                    <h3 className="text-4xl font-black mb-2 uppercase tracking-tighter">{supporter.tier?.name}</h3>
                    <p className="text-medium-gray text-sm opacity-60 mb-6 max-w-md">Thank you for being part of the Sitemendr journey. Your support fuels our innovation.</p>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                      <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3">
                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Next Billing:</span>
                        <span className="text-[10px] font-mono font-black text-white">{new Date(supporter.currentPeriodEnd || '').toLocaleDateString()}</span>
                      </div>
                      <div className="px-4 py-2 bg-expert-green/10 rounded-lg border border-expert-green/20 flex items-center gap-3">
                        <span className="text-[8px] font-mono text-expert-green/60 uppercase tracking-widest">Status:</span>
                        <span className="text-[10px] font-mono font-black text-expert-green uppercase">{supporter.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Code & Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-black border border-white/5 p-8 group transition-all hover:border-ai-blue/20">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em]">Active Discount Code</h4>
                    <div className="w-8 h-8 rounded-lg bg-ai-blue/10 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-ai-blue" />
                    </div>
                  </div>
                  {supporter.discountCodes && supporter.discountCodes.length > 0 ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-[#0a0a0a] border-2 border-dashed border-ai-blue/30 rounded-2xl text-center group-hover:border-ai-blue/60 transition-all">
                        <p className="text-[10px] font-mono text-medium-gray uppercase tracking-widest mb-2">Copy Code to Clipboard</p>
                        <span className="text-3xl font-black text-ai-blue tracking-widest cursor-pointer hover:scale-105 transition-transform inline-block" 
                              onClick={() => {
                                navigator.clipboard.writeText(supporter.discountCodes![0].code);
                                alert('Code copied!');
                              }}>
                          {supporter.discountCodes[0].code}
                        </span>
                      </div>
                      <p className="text-center text-[10px] font-mono text-expert-green font-black uppercase tracking-[0.2em]">
                        Enjoy {supporter.discountCodes[0].discountValue}% Off on All Store Purchases
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 bg-white/5 rounded-2xl text-center">
                      <p className="text-[10px] font-mono text-medium-gray uppercase">No active discount codes found.</p>
                    </div>
                  )}
                </div>

                <div className="bg-black border border-white/5 p-8 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em] mb-8">Upcoming Event</h4>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-tech-purple/10 flex items-center justify-center">
                          <Users className="w-6 h-6 text-tech-purple" />
                        </div>
                        <div>
                          <p className="text-sm font-black uppercase tracking-tight">Supporter Roundtable #12</p>
                          <p className="text-[9px] font-mono text-medium-gray uppercase tracking-widest">March 25, 2026 @ 15:00 UTC</p>
                        </div>
                      </div>
                      <button className="w-full py-3 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">Register Now</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'perks' && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Exclusive Perks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supporter.tier?.perks.map((perk, i) => (
                  <div key={i} className="bg-black border border-white/5 p-8 hover:border-ai-blue/30 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-ai-blue/5 border border-ai-blue/10 flex items-center justify-center mb-6 group-hover:bg-ai-blue/10 transition-all">
                      <CheckCircle2 className="w-6 h-6 text-ai-blue" />
                    </div>
                    <h5 className="text-sm font-black uppercase tracking-tight mb-2">{perk.replace(/-/g, ' ')}</h5>
                    <p className="text-[10px] text-medium-gray font-mono opacity-60 leading-relaxed uppercase">
                      Unlocked for {supporter.tier?.name} tier members.
                    </p>
                    <button className="mt-6 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-ai-blue hover:text-white transition-colors">
                      Access Perk <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Community Events</h3>
                <div className="px-4 py-2 bg-ai-blue/10 border border-ai-blue/20 rounded-full">
                  <span className="text-[9px] font-mono font-black text-ai-blue uppercase tracking-widest">Access: Unlocked</span>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="bg-black border border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-ai-blue/20 transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-[8px] font-mono text-medium-gray uppercase">Mar</span>
                        <span className="text-xl font-black">{20 + i * 2}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight mb-1">{i === 0 ? 'AI Roadmap Roundtable' : i === 1 ? 'Founder Q&A Session' : 'Product Council Voting'}</h4>
                        <p className="text-[9px] font-mono text-medium-gray uppercase tracking-[0.1em]">Virtual Meeting • 17:00 UTC • Exclusive to {supporter.tier?.name}+</p>
                      </div>
                    </div>
                    <button className="px-8 py-3 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all">Get Invite</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Billing & Subscription</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black border border-white/5 p-8 col-span-2">
                  <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em] mb-8">Payment History</h4>
                  <div className="space-y-4">
                    {[1, 2].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            <CreditCard className="w-4 h-4 text-medium-gray" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-tight">{supporter.tier?.name} Monthly</p>
                            <p className="text-[8px] font-mono text-medium-gray uppercase">March 12, 2026</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-tight">${supporter.monthlyAmount}</p>
                          <p className="text-[7px] font-mono text-expert-green uppercase">Successful</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-black border border-white/5 p-8">
                  <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em] mb-8">Quick Actions</h4>
                  <div className="space-y-4">
                    <button className="w-full py-4 bg-ai-blue/10 border border-ai-blue/20 text-ai-blue text-[9px] font-black uppercase tracking-[0.2em] hover:bg-ai-blue hover:text-white transition-all">Update Card</button>
                    <button className="w-full py-4 bg-transparent border border-white/10 text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all">View Invoice</button>
                    <div className="pt-8 mt-8 border-t border-white/5">
                      <button className="w-full py-4 bg-transparent text-red-500 text-[9px] font-black uppercase tracking-[0.2em] hover:text-white transition-all opacity-40 hover:opacity-100">Cancel Subscription</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupporterDashboard;
