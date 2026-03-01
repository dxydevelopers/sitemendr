'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { AssessmentResultsData } from './AssessmentResults';

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

interface LeadCaptureProps {
  assessmentData: AssessmentData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { isNewUser: boolean; email: string; nextSteps: string[] }) => void;
}

interface ConvertToLeadResponse {
  success: boolean;
  leadId: string;
  isNewUser: boolean;
  message: string;
  nextSteps: string[];
  token?: string;
  user?: any;
}

export default function LeadCapture({ assessmentData, isOpen, onClose, onSuccess }: LeadCaptureProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    timeline: '',
    consent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<ConvertToLeadResponse | null>(null);

  useEffect(() => {
    if (isOpen && assessmentData && !successData) {
      setFormData({
        name: assessmentData.name || '',
        email: assessmentData.email || '',
        phone: assessmentData.phone || '',
        company: assessmentData.company || '',
        website: assessmentData.website || '',
        timeline: assessmentData.timeline || '',
        consent: false
      });
    }
  }, [isOpen, assessmentData, successData]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.consent) newErrors.consent = 'You must agree to the terms';

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!assessmentData.assessmentId) {
        throw new Error('Assessment ID is missing');
      }
      const response = await apiClient.convertToLead(assessmentData.assessmentId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        website: formData.website,
        timeline: formData.timeline,
        consent: formData.consent,
        packageType: assessmentData.selectedPackage
      }) as ConvertToLeadResponse;

      // Automatically log the user in if a token is returned
      if (response.token) {
        localStorage.setItem('sitemendr_auth_token', response.token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }

      setSuccessData(response);
      onSuccess({ isNewUser: response.isNewUser, email: formData.email, nextSteps: response.nextSteps });
    } catch (error) {
      console.error('Lead capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit. Please try again.';
      
      if (errorMessage.toLowerCase().includes('email already exists')) {
        setErrors({ 
          submit: 'This email is already in our system. ',
          loginLink: 'Please log in to your account'
        });
      } else {
        setErrors({ submit: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success View
  if (successData) {
    return (
      <div className="fixed inset-0 bg-darker-bg/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
        <div className="bg-darker-bg/80 border border-expert-green/20 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.1)] relative animate-slide-up">
          {/* Success Gradient Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          {/* Subtle Scanline Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div className="w-full h-[1px] bg-expert-green animate-scan shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          </div>

          {/* HUD Corner Brackets */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-expert-green/30"></div>
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-expert-green/30"></div>
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-expert-green/30"></div>
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-expert-green/30"></div>

          {/* Header */}
          <div className="p-8 md:p-10 border-b border-expert-green/10 flex items-center justify-between shrink-0 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-expert-green shadow-[0_0_8px_#10B981] animate-pulse"></div>
                <span className="font-mono text-[10px] text-expert-green uppercase tracking-[0.3em]">Assessment Complete</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Access_Granted</h1>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar relative z-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-expert-green/10 border border-expert-green/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-expert-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-mono text-sm uppercase tracking-widest mb-2">{successData.message}</p>
              <p className="text-medium-gray font-mono text-xs uppercase tracking-wider">Check your email for login credentials</p>
            </div>

            {successData.isNewUser && (
              <div className="bg-expert-green/5 border border-expert-green/20 rounded-xl p-6 mb-8">
                <h3 className="text-white font-mono text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-expert-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Your Secure Credentials
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-medium-gray font-mono text-[10px] uppercase tracking-widest">Email</span>
                    <span className="text-white font-mono text-sm">{formData.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-medium-gray font-mono text-[10px] uppercase tracking-widest">Password</span>
                    <span className="text-white font-mono text-sm">Sent to your email</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <h3 className="text-white font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <svg className="w-4 h-4 text-ai-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Next Steps
              </h3>
              {successData.nextSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-medium-gray">
                  <div className="w-6 h-6 rounded-full bg-ai-blue/10 border border-ai-blue/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-ai-blue font-mono text-[10px] font-bold">{i + 1}</span>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 md:p-10 border-t border-expert-green/10 bg-expert-green/5 flex flex-col md:flex-row gap-4 relative z-10">
            <Link
              href="/dashboard"
              className="flex-1 bg-expert-green/10 border border-expert-green/30 text-white py-5 px-10 rounded-lg font-mono text-xs uppercase tracking-[0.2em] hover:bg-expert-green/20 hover:border-expert-green/50 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Go To Dashboard
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-white/5 border border-white/10 text-white py-5 px-10 rounded-lg font-mono text-xs uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-darker-bg/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="bg-darker-bg/80 border border-ai-blue/20 rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,102,255,0.1)] relative animate-slide-up">
        {/* Technical Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,102,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

        {/* Subtle Scanline Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="w-full h-[1px] bg-ai-blue animate-scan shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
        </div>

        {/* HUD Corner Brackets */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-ai-blue/30"></div>
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-ai-blue/30"></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-ai-blue/30"></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-ai-blue/30"></div>

        {/* Header */}
        <div className="p-8 md:p-10 border-b border-ai-blue/10 flex items-center justify-between shrink-0 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-ai-blue shadow-[0_0_8px_#0066FF] animate-pulse"></div>
              <span className="font-mono text-[10px] text-ai-blue uppercase tracking-[0.3em]">Launch Assessment</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">Contact Collection</h1>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-ai-blue/5 border border-ai-blue/20 flex items-center justify-center text-ai-blue/50 hover:text-white hover:bg-ai-blue/20 hover:border-ai-blue/40 transition-all z-20 group"
          >
            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar relative z-10">
          {/* Pre-filled data summary */}
          {(assessmentData.name || assessmentData.email || assessmentData.timeline) && (
            <div className="mb-10 p-6 bg-ai-blue/5 border border-ai-blue/10 rounded-xl">
              <h3 className="text-ai-blue font-mono text-[10px] uppercase tracking-[0.3em] mb-4">Verified Protocol Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {assessmentData.name && (
                  <div>
                    <span className="block text-[8px] text-white/30 uppercase tracking-widest mb-1">Operator</span>
                    <span className="text-sm text-white font-mono">{assessmentData.name}</span>
                  </div>
                )}
                {assessmentData.email && (
                  <div>
                    <span className="block text-[8px] text-white/30 uppercase tracking-widest mb-1">Comms Address</span>
                    <span className="text-sm text-white font-mono">{assessmentData.email}</span>
                  </div>
                )}
                {assessmentData.timeline && (
                  <div>
                    <span className="block text-[8px] text-white/30 uppercase tracking-widest mb-1">Target Window</span>
                    <span className="text-sm text-white font-mono uppercase">{assessmentData.timeline.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <form id="lead-capture-form" onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { label: 'Your Name', field: 'name', type: 'text', placeholder: 'Enter your name' },
                    { label: 'Email', field: 'email', type: 'email', placeholder: 'your@email.com' },
                    { label: 'Phone', field: 'phone', type: 'tel', placeholder: '+1 000 000 0000' },
                    { label: 'Company', field: 'company', type: 'text', placeholder: 'Company name' }
                  ].map((input) => {
                    // Skip name and email if they are already provided in assessmentData
                    if ((input.field === 'name' || input.field === 'email') && assessmentData[input.field as keyof AssessmentData]) {
                      return null;
                    }
                    return (
                      <div key={input.field} className="space-y-2">
                        <label className="font-mono text-[9px] text-ai-blue uppercase tracking-[0.3em] ml-1">{input.label}</label>
                        <input
                          type={input.type}
                          value={formData[input.field as keyof typeof formData] as string}
                          onChange={(e) => handleInputChange(input.field, e.target.value)}
                          className={`w-full px-5 py-4 bg-ai-blue/5 border rounded-lg text-white font-mono text-sm focus:border-ai-blue focus:bg-ai-blue/10 focus:outline-none transition-all placeholder:text-white/10 ${
                            errors[input.field] ? 'border-red-500/50' : 'border-ai-blue/20'
                          }`}
                          placeholder={input.placeholder}
                        />
                        {errors[input.field] && <p className="text-red-500 font-mono text-[9px] mt-1 ml-1 uppercase tracking-tighter">{errors[input.field]}</p>}
                      </div>
                    );
                  })}
                </div>

                {/* Only show timeline if not already provided or if user wants to change it */}
                {(!assessmentData.timeline) && (
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-ai-blue uppercase tracking-[0.3em] ml-1">Timeline</label>
                    <div className="relative">
                      <select
                        value={formData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className="w-full px-5 py-4 bg-ai-blue/5 border border-ai-blue/20 rounded-lg text-white font-mono text-sm focus:border-ai-blue focus:bg-ai-blue/10 focus:outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-darker-bg">SELECT TIME FRAME</option>
                        <option value="ASAP" className="bg-darker-bg">QUICK (WITHIN 14 DAYS)</option>
                        <option value="1-3 months" className="bg-darker-bg">NORMAL (1-3 MONTHS)</option>
                        <option value="Flexible" className="bg-darker-bg">FLEXIBLE TIMING</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ai-blue/40">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 p-5 bg-ai-blue/5 rounded-lg border border-ai-blue/10 group/consent cursor-pointer" onClick={() => handleInputChange('consent', !formData.consent)}>
                  <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${
                    formData.consent ? 'bg-ai-blue border-ai-blue shadow-[0_0_10px_rgba(0,102,255,0.5)]' : 'border-white/10 group-hover/consent:border-ai-blue/40'
                  }`}>
                    {formData.consent && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <label className="font-mono text-[10px] text-medium-gray leading-relaxed cursor-pointer select-none uppercase tracking-tight">
                    I authorize Sitemendr to process my assessment data and agree to the <span className="text-ai-blue font-bold underline decoration-ai-blue/30">Privacy Policy</span>. Data remains secure and private.
                  </label>
                </div>
                {errors.consent && <p className="text-red-500 font-mono text-[9px] -mt-4 ml-1 animate-pulse uppercase tracking-widest">! PROTOCOL ERROR: {errors.consent}</p>}
                {errors.submit && (
                  <div className="text-red-500 font-mono text-[10px] text-center font-bold p-4 bg-red-500/5 rounded-lg border border-red-500/20 uppercase tracking-widest">
                    {errors.submit}
                    {errors.loginLink && (
                      <Link href="/admin" className="text-ai-blue underline hover:text-ai-blue/80 ml-1">
                        {errors.loginLink}
                      </Link>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-ai-blue/5 border border-ai-blue/20 rounded-lg p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ai-blue/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="font-mono text-xs font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 rounded-full bg-ai-blue shadow-[0_0_8px_#0066FF]"></span>
                  What You Get
                </h3>
                <ul className="space-y-6">
                  {[
                    { title: 'System Check', desc: 'Detailed look at current system setup.' },
                    { title: 'Return Prediction', desc: 'Created data predictions.' },
                    { title: 'Set Price', desc: 'Fixed budget with no changes.' }
                  ].map((item, i) => (
                    <li key={i} className="relative pl-6 group/item">
                      <div className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-ai-blue/40 group-hover/item:bg-ai-blue group-hover/item:scale-125 transition-all"></div>
                      <div className="text-white font-mono text-[11px] font-bold mb-1 uppercase tracking-wider">{item.title}</div>
                      <div className="text-medium-gray font-mono text-[9px] leading-relaxed opacity-60 uppercase tracking-tight">{item.desc}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 bg-expert-green/5 border border-expert-green/20 rounded-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-expert-green/[0.02] animate-pulse"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full bg-expert-green shadow-[0_0_10px_#10B981]"></div>
                    <span className="text-expert-green font-mono text-[9px] font-bold uppercase tracking-[0.2em]">Server Status: Active</span>
                  </div>
                  <p className="text-medium-gray font-mono text-[10px] leading-relaxed opacity-80 uppercase tracking-tight">
                    Engineers are currently online. Safe plan review for quick call back within <span className="text-white font-bold underline decoration-expert-green/30">120 minutes</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 border-t border-ai-blue/10 bg-ai-blue/5 flex flex-col md:flex-row items-center gap-8 relative z-10">
          <button
            type="submit"
            form="lead-capture-form"
            disabled={isSubmitting}
            className="group relative w-full md:w-auto md:flex-1 bg-ai-blue/10 border border-ai-blue/30 text-white py-5 px-10 rounded-lg font-mono text-xs uppercase tracking-[0.2em] hover:bg-ai-blue/20 hover:border-ai-blue/50 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-ai-blue/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] skew-x-[-20deg]"></div>
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-ai-blue/30 border-t-ai-blue rounded-full animate-spin"></div>
                <span>UPLOADING...</span>
              </>
            ) : (
              <>
                <span>Safe Strategy Talk</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform text-ai-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          <div className="text-center md:text-left">
            <p className="text-white font-mono text-[10px] font-bold mb-1 uppercase tracking-widest">COST: ZERO</p>
            <p className="text-medium-gray font-mono text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">SECURE • EXPERT CHECK • LEGAL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
