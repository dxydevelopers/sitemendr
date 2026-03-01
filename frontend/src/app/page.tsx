'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ImmersiveHero from '@/components/ImmersiveHero';
import FeatureBento from '@/components/FeatureBento';
import GlobalNetwork from '@/components/GlobalNetwork';
import ServiceShowcase from '@/components/ServiceShowcase';
import ProcessSection from '@/components/ProcessSection';
import WhyChooseUs from '@/components/WhyChooseUs';
import PricingPreview from '@/components/PricingPreview';
import Testimonials from '@/components/Testimonials';
import CTASection from '@/components/CTASection';
import SectionDivider from '@/components/SectionDivider';
import AssessmentQuestionnaire from '@/components/AssessmentQuestionnaire';
import ClientLogos from '@/components/ClientLogos';
import FAQ from '@/components/FAQ';
import Guarantees from '@/components/Guarantees';
import ContactMethods from '@/components/ContactMethods';
import AssessmentResults, { AssessmentResultsData } from '@/components/AssessmentResults';
import LeadCapture from '@/components/LeadCapture';

interface AssessmentData {
  businessType: string;
  businessTypeOther: string;
  employeeCount: string;
  goals: string[];
  targetAudience: string[];
  hasWebsite: string;
  currentWebsiteIssues: string[];
  preferredStyle: string;
  requiredFeatures: string[];
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  assessmentId?: string;
  selectedPackage?: string;
  results?: AssessmentResultsData;
  [key: string]: string | string[] | boolean | number | object | undefined;
}

function HomeContent() {
  const [assessmentStep, setAssessmentStep] = useState<'closed' | 'questionnaire' | 'results' | 'lead'>('closed');
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [preSelectedPlan, setPreSelectedPlan] = useState<string | undefined>(undefined);
  const searchParams = useSearchParams();

  // Dynamic Favicon Effect
  useEffect(() => {
    const favicons = document.querySelectorAll('link[rel*="icon"]') as NodeListOf<HTMLLinkElement>;
    
    favicons.forEach(favicon => {
      if (assessmentStep !== 'closed') {
        favicon.href = '/globe.svg';
      } else {
        // Restore original based on type
        if (favicon.rel.includes('apple-touch-icon')) {
          favicon.href = '/apple-touch-icon.png';
        } else if (favicon.rel.includes('shortcut')) {
          favicon.href = '/favicon-16x16.png';
        } else {
          favicon.href = '/favicon.ico';
        }
      }
    });
  }, [assessmentStep]);

  // Handle plan pre-selection from URL
  useEffect(() => {
    const planId = searchParams.get('plan');
    if (planId) {
      handleStartAssessment(planId);
    }
  }, [searchParams]);

  const handleStartAssessment = (planId?: string | unknown) => {
    // Ensure planId is a string and not a React event object
    const cleanPlanId = typeof planId === 'string' ? planId : undefined;
    setPreSelectedPlan(cleanPlanId);
    setAssessmentStep('questionnaire');
  };

  const handleAssessmentComplete = (data: AssessmentData, results?: AssessmentResultsData) => {
    setAssessmentData({ ...data, assessmentId: data.assessmentId, results });
    setAssessmentStep('results');
  };

  const handleCaptureLead = (packageType?: string) => {
    if (packageType && assessmentData) {
      setAssessmentData(prev => prev ? { ...prev, selectedPackage: packageType } : null);
    }
    setAssessmentStep('lead');
  };

  const handleCloseAssessment = () => {
    setAssessmentStep('closed');
    setAssessmentData(null);
  };

  const handleLeadSuccess = () => {
    // LeadCapture handles the success UI internally
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-ai-blue/30">
      {/* Mission Control HUD */}
      <div className="fixed bottom-10 left-10 z-[100] hidden 2xl:block pointer-events-none group">
        <div className="bg-black/90 backdrop-blur-2xl border border-ai-blue/20 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto transition-all duration-500 hover:border-ai-blue/50 hover:translate-y-[-5px]">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-ai-blue/20 to-tech-purple/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-2 h-2 rounded-full bg-expert-green animate-pulse shadow-[0_0_15px_#10B981]"></div>
              <span className="font-mono text-[10px] text-white/80 uppercase tracking-widest font-black">All Systems Operational</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-16">
                <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">System Status</span>
                <span className="font-mono text-[9px] text-ai-blue font-black uppercase">Online</span>
              </div>
              <div className="flex items-center justify-between gap-16">
                <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">Server Uptime</span>
                <span className="font-mono text-[9px] text-expert-green font-black uppercase tracking-tighter">99.9%</span>
              </div>
              <div className="h-[1px] w-full bg-white/5"></div>
              <div className="flex items-center justify-between gap-16">
                <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.2em]">Account Status</span>
                <span className="font-mono text-[9px] text-white/60 font-black uppercase tracking-tighter">Guest</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImmersiveHero onStartAssessment={handleStartAssessment} />

      <SectionDivider label="Our Features" id="MOD_01" align="center" />
      <FeatureBento />

      <SectionDivider label="Global Network" id="MOD_02" align="center" />
      <GlobalNetwork />

      <SectionDivider label="Our Services" id="services" align="center" />
      <ServiceShowcase />
      <ClientLogos />

      <SectionDivider label="How It Works" id="process" align="center" />
      <ProcessSection />

      <SectionDivider label="Why Choose Us" id="MOD_05" align="center" />
      <WhyChooseUs />

      <SectionDivider label="Pricing" id="pricing" align="center" />
      <PricingPreview onStartAssessment={handleStartAssessment} />

      <SectionDivider label="What Our Clients Say" id="MOD_07" align="center" />
      <Testimonials />
      <FAQ />
      <Guarantees />
      <ContactMethods />

      <SectionDivider label="Get Started" id="MOD_08" align="center" />
      <CTASection onStartAssessment={handleStartAssessment} />

      {/* Assessment Flow Modals */}
      <AssessmentQuestionnaire
        isOpen={assessmentStep === 'questionnaire'}
        onClose={handleCloseAssessment}
        onComplete={handleAssessmentComplete}
        preSelectedPlan={preSelectedPlan}
      />

      <AssessmentResults
        assessmentId={assessmentData?.assessmentId || ''}
        email={assessmentData?.email}
        results={assessmentData?.results}
        isOpen={assessmentStep === 'results'}
        onClose={handleCloseAssessment}
        onCaptureLead={handleCaptureLead}
      />

      <LeadCapture
        assessmentData={assessmentData || {
          businessType: '',
          businessTypeOther: '',
          employeeCount: '',
          goals: [],
          targetAudience: [],
          hasWebsite: '',
          currentWebsiteIssues: [],
          preferredStyle: '',
          requiredFeatures: [],
          budget: '',
          timeline: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          website: ''
        }}
        isOpen={assessmentStep === 'lead'}
        onClose={handleCloseAssessment}
        onSuccess={handleLeadSuccess}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
