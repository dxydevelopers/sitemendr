'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import ImmersiveHero from '@/components/ImmersiveHero';
import SectionDivider from '@/components/SectionDivider';

// Dynamic imports for below-the-fold components
const FeatureBento = dynamic(() => import('@/components/FeatureBento'), { ssr: true });
const GlobalNetwork = dynamic(() => import('@/components/GlobalNetwork'), { ssr: true });
const ServiceShowcase = dynamic(() => import('@/components/ServiceShowcase'), { ssr: true });
const ProcessSection = dynamic(() => import('@/components/ProcessSection'), { ssr: true });
const WhyChooseUs = dynamic(() => import('@/components/WhyChooseUs'), { ssr: true });
const PricingPreview = dynamic(() => import('@/components/PricingPreview'), { ssr: true });
const AirdropGifts = dynamic(() => import('@/components/AirdropGifts'), { ssr: true });
const Testimonials = dynamic(() => import('@/components/Testimonials'), { ssr: true });
const CTASection = dynamic(() => import('@/components/CTASection'), { ssr: true });
const AssessmentQuestionnaire = dynamic(() => import('@/components/AssessmentQuestionnaire'), { ssr: false });
const ClientLogos = dynamic(() => import('@/components/ClientLogos'), { ssr: true });
const FAQ = dynamic(() => import('@/components/FAQ'), { ssr: true });
const Guarantees = dynamic(() => import('@/components/Guarantees'), { ssr: true });
const ContactMethods = dynamic(() => import('@/components/ContactMethods'), { ssr: true });
import type { AssessmentResultsData } from '@/components/AssessmentResults';
const AssessmentResults = dynamic(() => import('@/components/AssessmentResults'), { ssr: false });
const LeadCapture = dynamic(() => import('@/components/LeadCapture'), { ssr: false });

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
    <main className="min-h-screen bg-gray-900 text-white">
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
