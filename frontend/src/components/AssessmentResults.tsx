'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import {
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Target,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export interface AssessmentResultsData {
  recommendedPackage: string;
  confidence: number;
  recommendedFeatures: string[];
  pricing: {
    package: string;
    basePrice: number;
    estimatedTotal: number;
    currency: string;
    breakdown: {
      basePackage: number;
      features: Record<string, number>;
      total: number;
    };
  };
  timeline: string;
  mockupUrl?: string;
  aiInsights: string;
  predictions: {
    trafficIncrease: string;
    conversionImprovement: string;
    roiTimeline: string;
    maintenanceNeeds: string;
  };
  riskAssessment: string[];
  competitorAnalysis: string;
  marketTrends: string[];
  nextSteps: string[];
}

interface AssessmentResultsProps {
  assessmentId?: string;
  email?: string;
  results?: AssessmentResultsData;
  isOpen?: boolean;
  onClose?: () => void;
  onCaptureLead?: (packageType: string) => void;
  onRetake?: () => void;
}

const serviceMapping: Record<string, { name: string; tier: string; gradient: string }> = {
  ai_foundation: { name: 'AI-Launch', tier: 'Startup Foundation', gradient: 'from-ai-blue to-tech-purple' },
  pro_enhancement: { name: 'Pro Dev', tier: 'Custom Architecture', gradient: 'from-tech-purple to-pink-500' },
  enterprise: { name: 'Enterprise', tier: 'Global Operations', gradient: 'from-expert-green to-ai-blue' },
  self_hosted: { name: 'Self-Hosted', tier: 'Full Ownership', gradient: 'from-pink-500 to-orange-500' },
  maintenance: { name: 'Systems Care', tier: 'Lifecycle Support', gradient: 'from-pink-500 to-ai-blue' }
};

const timelineLabels: Record<string, string> = {
  '1_week': '1 week',
  '2_weeks': '2 weeks',
  '3_4_weeks': '3-4 weeks',
  '1_month': '1 month',
  '2_3_months': '2-3 months'
};

export default function AssessmentResults({ 
  assessmentId,
  email,
  results, 
  onCaptureLead, 
  onRetake,
  isOpen 
}: AssessmentResultsProps) {
  const [selectedPackage, setSelectedPackage] = useState(results?.recommendedPackage || 'ai_foundation');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  if (!results) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-darker-bg/90 backdrop-blur-xl"></div>
        <div className="relative w-full max-w-md bg-darker-bg/90 border border-ai-blue/20 rounded-2xl p-8 text-center">
          <div className="text-sm font-black uppercase tracking-widest text-ai-blue mb-2">Assessment Pending</div>
          <p className="text-white/60 text-sm">Results are not available yet. Please try again in a moment.</p>
        </div>
      </div>
    );
  }

  const service = serviceMapping[selectedPackage] || serviceMapping.ai_foundation;
  const primaryPackage = results?.recommendedPackage || 'ai_foundation';
  const isRecommended = selectedPackage === primaryPackage;

  const handlePayment = async () => {
    if (!results?.pricing?.estimatedTotal || !results?.pricing?.currency || !results?.pricing?.basePrice) {
      alert('Pricing is not available yet. Please retry the assessment.');
      return;
    }
    if (!email) {
      alert('Technical Error: Operator address (email) is missing. Please ensure you completed the identification step.');
      return;
    }

    setIsLoading(true);
    try {
      const paymentData = {
        assessmentId: assessmentId,
        package: selectedPackage,
        amount: results?.pricing?.estimatedTotal,
        email: email,
        description: `${service.name} Package - Website Development`,
        serviceType: 'subscription',
        metadata: {
          assessmentId: assessmentId,
          tier: selectedPackage,
          packagePrice: results?.pricing?.basePrice,
          currency: results?.pricing?.currency
        }
      };

      console.log('Initializing payment protocol...', { email, assessmentId, amount: paymentData.amount });
      const response = await apiClient.initializePayment(paymentData);
      
      if (response.success && response.data?.paystack?.authorization_url) {
        window.location.href = response.data.paystack.authorization_url;
      } else {
        console.error('Handshake failed: missing authorization URL', response);
        alert('Payment initialization failed: API Handshake Incomplete. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Payment initialization failed:', error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const detail = err.response?.data?.message || err.message || 'Unknown network error';
      alert(`Payment initialization failed: ${detail}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-darker-bg/90 backdrop-blur-xl" onClick={() => {}}></div>

      {/* Main Content */}
      <div className="relative w-full max-w-4xl bg-darker-bg/90 backdrop-blur-3xl border border-ai-blue/20 rounded-2xl shadow-[0_0_50px_rgba(0,102,255,0.15)] overflow-hidden animate-slide-up">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
        </div>

        {/* HUD Corner Brackets */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-ai-blue/30"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-ai-blue/30"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-ai-blue/30"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-ai-blue/30"></div>

        <div className="p-8 md:p-12 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-expert-green/10 border border-expert-green/20 mb-6">
              <Sparkles className="w-4 h-4 text-expert-green" />
              <span className="font-mono text-[10px] font-bold text-expert-green uppercase tracking-[0.3em]">Assessment Complete</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black mb-4 tracking-tighter uppercase leading-tight">
              Analysis <span className="bg-gradient-to-r from-expert-green to-ai-blue bg-clip-text text-transparent italic">Complete</span>
            </h1>

            <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
              Based on your requirements, our AI has determined the optimal technical architecture for your project.
            </p>
          </div>

          {/* Recommended Service */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-ai-blue/10 border border-ai-blue/20 mb-4">
                <Target className="w-4 h-4 text-ai-blue" />
                <span className="font-mono text-[10px] font-bold text-ai-blue uppercase tracking-widest">Recommended Solution</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black mb-2 tracking-tighter uppercase">
                {service.name}
              </h2>
              <p className="text-white/40 text-sm font-mono uppercase tracking-widest">{service.tier}</p>
              
              {/* Plan Selection Tabs */}
              <div className="flex justify-center gap-2 mt-6">
                {Object.entries(serviceMapping).map(([id, info]) => (
                  <button
                    key={id}
                    onClick={() => setSelectedPackage(id)}
                    className={`px-4 py-2 rounded-lg font-mono text-[9px] uppercase tracking-widest transition-all border ${
                      selectedPackage === id 
                        ? 'bg-ai-blue/20 border-ai-blue text-white shadow-[0_0_15px_rgba(0,102,255,0.3)]' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {info.name}
                    {primaryPackage === id && (
                      <span className="ml-2 text-expert-green">*</span>
                    )}
                  </button>
                ))}
              </div>

              {!isRecommended && (
                <div className="mt-2 text-xs text-ai-blue font-mono uppercase tracking-widest">
                  Alternative Option
                </div>
              )}
            </div>

            {/* Service Card */}
            <div className="relative bg-white/[0.02] border border-white/10 rounded-[2rem] p-8 mb-8 overflow-hidden">
              {/* Glow Effect */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${service.gradient} opacity-20 blur-[80px] transition-opacity duration-700`}></div>

              <div className="relative z-10">
                {/* Confidence Score */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-black text-expert-green mb-1">{results?.confidence != null ? `${results.confidence}%` : 'N/A'}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Match Confidence</div>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-ai-blue mb-1">{results?.timeline ? (timelineLabels[results.timeline] || results.timeline) : 'N/A'}</div>
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Timeline</div>
                  </div>
                </div>

                {/* Estimated Total */}
                <div className="text-center mb-12">
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.3em] mb-2">Estimated Total Investment</div>
                  <div className="text-5xl font-black">
                    <span className={`bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}>{results?.pricing?.estimatedTotal != null ? results.pricing.estimatedTotal.toLocaleString() : 'N/A'}</span>
                  </div>
                </div>

                {/* AI Mockup Preview */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-[1px] bg-ai-blue/30"></div>
                    <h3 className="text-sm font-black uppercase tracking-[0.4em] text-ai-blue">High-Fidelity Visual Preview</h3>
                    <div className="flex-1 h-[1px] bg-ai-blue/30"></div>
                  </div>
                  
                  <div className="relative group rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video shadow-2xl">
                    {results?.mockupUrl ? (
                      <>
                        <img 
                          src={results.mockupUrl} 
                          alt="AI Generated Website Mockup" 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                          <div className="font-mono text-[8px] text-white/40 uppercase tracking-widest">
                            AI_GENERATED_MOCKUP_V4.2<br />
                            STATUS: VISUAL_REPRESENTATION_ONLY
                          </div>
                          <div className="px-3 py-1 bg-ai-blue/20 border border-ai-blue/30 rounded text-[8px] font-black text-ai-blue uppercase tracking-widest">
                            DALL-E 3 Render
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                        <span className="font-mono text-[10px] uppercase tracking-widest">Rendering Visual Matrix...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-12">
                  <h3 className="text-lg font-bold mb-6 uppercase tracking-tight flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-expert-green"></div>
                    Included Technical Assets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {results?.recommendedFeatures && results.recommendedFeatures.length > 0 ? (
                    results.recommendedFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-expert-green flex-shrink-0" />
                        <span className="text-sm text-white/70 font-mono uppercase tracking-tighter">{feature.replace(/_/g, ' ')}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-white/40">No feature list available yet.</div>
                  )}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold mb-4 uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-ai-blue" />
                    AI Analysis
                  </h3>
                  <p className="text-white/60 leading-relaxed">{results?.aiInsights || 'No AI insights available yet.'}</p>
                </div>

                {/* Predictions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-expert-green" />
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Traffic Increase</div>
                      <div className="text-xs text-white/40">{results?.predictions?.trafficIncrease || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <Target className="w-6 h-6 text-ai-blue" />
                    <div>
                      <div className="text-sm font-bold uppercase tracking-tight">Conversion Boost</div>
                      <div className="text-xs text-white/40">{results?.predictions?.conversionImprovement || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="text-xl font-bold mb-6 uppercase tracking-tight text-center">Next Steps</h3>
            <div className="space-y-4">
              <button 
                onClick={() => onCaptureLead?.(selectedPackage)}
                className="w-full flex items-center gap-4 p-4 bg-ai-blue/5 border border-ai-blue/20 rounded-xl hover:bg-ai-blue/10 hover:border-ai-blue/40 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-ai-blue/20 border border-ai-blue/30 flex items-center justify-center group-hover:bg-ai-blue group-hover:text-white transition-all">
                  <span className="text-sm font-bold text-ai-blue group-hover:text-white">1</span>
                </div>
                <div className="flex-1">
                  <span className="text-white/70 block group-hover:text-white transition-colors">Book a discovery call to discuss your results</span>
                  <span className="text-[10px] text-ai-blue/50 font-mono uppercase tracking-widest group-hover:text-ai-blue transition-colors">Capture protocol details first</span>
                </div>
                <ArrowRight className="w-4 h-4 text-ai-blue/30 group-hover:text-ai-blue group-hover:translate-x-1 transition-all" />
              </button>

              {(results?.nextSteps?.slice(1) || [
                'Receive a detailed technical specification',
                'Begin the onboarding process'
              ]).map((step, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-white/30">{index + 2}</span>
                  </div>
                  <span className="text-white/70">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onCaptureLead?.(selectedPackage)}
              disabled={isLoading}
              className="group relative px-8 py-4 bg-white text-black font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
                Proceed with {service.name}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="group relative px-8 py-4 bg-gradient-to-r from-ai-blue to-tech-purple text-white font-black rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(0,102,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-3 uppercase tracking-widest text-sm">
                <span className="text-lg mr-2">$</span>
                {isLoading ? 'Processing...' : (results?.pricing?.estimatedTotal != null ? results.pricing.estimatedTotal.toLocaleString() : 'N/A')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            {onRetake && (
              <button
                onClick={onRetake}
                disabled={isLoading}
                className="group px-8 py-4 bg-white/5 border border-white/10 text-white font-mono uppercase tracking-widest text-sm rounded-xl transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Retake Assessment
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}






