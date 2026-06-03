'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient, saveSessionToken, clearSessionToken } from '@/lib/api';
import { Sparkles, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';
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
  [key: string]: string | string[] | boolean | undefined;
}

interface AssessmentQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: AssessmentData, results?: AssessmentResultsData) => void;
}

type Option = string;

interface Question {
  id: number;
  title: string;
  subtitle?: string;
  type: string;
  field: string;
  required: boolean;
  options: string[];
  hasOther?: boolean;
  otherField?: string;
}

const questions: Question[] = [
  {
    id: 1,
    title: "What are we building?",
    subtitle: "Choose the closest custom development type",
    type: "select",
    field: "projectType",
    required: true,
    options: [
      "Business website",
      "Web app or SaaS platform",
      "Client portal or dashboard",
      "Marketplace or directory",
      "Booking or workflow system",
      "Admin tool or internal system",
      "API or backend integration",
      "Other custom build"
    ]
  },
  {
    id: 2,
    title: "What should this build help you achieve?",
    subtitle: "Select the outcomes that matter",
    type: "multiselect",
    field: "goals",
    required: true,
    options: [
      "Launch a new idea",
      "Get leads or enquiries",
      "Sell or accept payments",
      "Manage users or clients",
      "Automate a business process",
      "Showcase work or services",
      "Replace an old system",
      "Connect existing tools"
    ]
  },
  {
    id: 3,
    title: "What features must be included?",
    subtitle: "Pick the important pieces only",
    type: "multiselect",
    field: "requiredFeatures",
    required: true,
    options: [
      "User accounts/login",
      "Admin dashboard",
      "Payments/checkout",
      "Bookings/scheduling",
      "Forms and lead capture",
      "Content management",
      "File uploads/downloads",
      "Notifications/email automation",
      "Search and filtering",
      "Third-party integrations",
      "Analytics/reporting",
      "Role-based permissions"
    ]
  },
  {
    id: 4,
    title: "Do you already have anything for this project?",
    type: "select",
    field: "hasWebsite",
    required: true,
    options: [
      "Nothing yet",
      "Idea and notes only",
      "Designs or wireframes",
      "Existing website",
      "Existing app/system",
      "Codebase or technical docs"
    ]
  },
  {
    id: 5,
    title: "What is the project or business name?",
    type: "text",
    field: "company",
    required: true,
    options: []
  },
  {
    id: 6,
    title: "Who will use it?",
    subtitle: "Select all that apply",
    type: "multiselect",
    field: "targetAudience",
    required: true,
    options: [
      "Public visitors",
      "Customers/clients",
      "Business staff",
      "Admins/managers",
      "Vendors/partners",
      "Members/community",
      "Other businesses"
    ]
  },
  {
    id: 7,
    title: "What build style fits best?",
    type: "select",
    field: "preferredStyle",
    required: true,
    options: [
      "Clean and professional",
      "Modern SaaS/product feel",
      "Bold brand-led experience",
      "Operational dashboard style",
      "Simple and conversion-focused",
      "Not sure yet"
    ]
  },
  {
    id: 8,
    title: "What budget range should we plan around?",
    type: "select",
    field: "budget",
    required: true,
    options: [
      "Under $1,000",
      "$1,000 - $3,000",
      "$3,000 - $10,000",
      "$10,000+",
      "Not sure yet"
    ]
  },
  {
    id: 9,
    title: "When do you want to start or launch?",
    type: "select",
    field: "timeline",
    required: true,
    options: [
      "ASAP",
      "Within 1 month",
      "1-3 months",
      "3-6 months",
      "Flexible"
    ]
  },
  {
    id: 10,
    title: "Any existing link we should know about?",
    subtitle: "Website, app, prototype, docs, or leave blank",
    type: "text",
    field: "website",
    required: false,
    options: []
  }
];

export default function AssessmentQuestionnaire({ isOpen, onClose, onComplete }: AssessmentQuestionnaireProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentId, setAssessmentId] = useState<string>('');
  const [data, setData] = useState<AssessmentData>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      setAssessmentId('');
      setErrors({});
    }
  }, [isOpen]);

  // Initialize assessment when modal opens
  useEffect(() => {
    if (isOpen && !assessmentId && !isInitializing && !hasInitializedRef.current) {
      const initializeAssessment = async () => {
        hasInitializedRef.current = true;
        setIsInitializing(true);
        try {
          const response = await apiClient.startAssessment('assessment', 'dashboard_build') as any;
          
          // Check if the API call was successful
          if (!response.success) {
            setErrors({ submit: response.message || 'Failed to start build brief. Please try again.' });
            return;
          }
          
          setAssessmentId(response.assessmentId);
          saveSessionToken(response.sessionToken);
        } catch (error) {
          console.error('Failed to start assessment:', error);
          hasInitializedRef.current = false;
          const errorMessage = error instanceof Error ? error.message : 'Failed to start build brief. Please try again.';
          if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('auth')) {
            setErrors({ submit: 'Your session expired. Please sign in again before starting a build request.' });
          } else {
            setErrors({ submit: errorMessage });
          }
        } finally {
          setIsInitializing(false);
        }
      };

      initializeAssessment();
    }
  }, [isOpen, assessmentId, isInitializing]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const validateStep = (stepData: AssessmentData, question: Question) => {
    const newErrors: Record<string, string> = {};

    if (question.required) {
      if (question.type === 'multiselect' && (!stepData[question.field] || (stepData[question.field] as string | string[]).length === 0)) {
        newErrors[question.field] = `Please select at least one ${question.title.toLowerCase()}`;
      } else if (question.type !== 'multiselect' && !stepData[question.field]) {
        newErrors[question.field] = `Please ${question.type === 'select' ? 'select' : 'enter'} ${question.title.toLowerCase()}`;
      }
    }

    return newErrors;
  };

  const handleNext = async () => {
    const stepErrors = validateStep(data, currentQuestion);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (!assessmentId) {
      setErrors({ submit: 'Assessment not initialized. Please wait a moment and try again.' });
      return;
    }

    setErrors({});
    setIsProcessing(true);

    try {
      // Save responses to API
      await apiClient.saveAssessmentResponses(assessmentId, currentStep + 1, data);

      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.error('Error saving responses:', error);
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        setAssessmentId('');
        clearSessionToken();
        setErrors({ submit: 'Your session has expired. Re-initializing assessment node. Please wait...' });
        // Force re-initialization
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }
      setErrors({ submit: 'Failed to synchronize responses with neural core. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(data, currentQuestion);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (!assessmentId) {
      setErrors({ submit: 'Assessment not initialized. Please wait a moment and try again.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await apiClient.saveAssessmentResponses(assessmentId, currentStep + 1, data);
      const response = await apiClient.processAssessment(assessmentId, {
        ...data,
        dashboardRequest: true
      }) as any;

      if (!response.success) {
        throw new Error(response.message || 'Request submission failed');
      }

      const safeData: AssessmentData = {
        businessType: String(data.businessType || ''),
        businessTypeOther: String(data.businessTypeOther || ''),
        employeeCount: String(data.employeeCount || ''),
        goals: Array.isArray(data.goals) ? [...data.goals] : [],
        targetAudience: Array.isArray(data.targetAudience) ? [...data.targetAudience] : [],
        hasWebsite: String(data.hasWebsite || ''),
        currentWebsiteIssues: Array.isArray(data.currentWebsiteIssues) ? [...data.currentWebsiteIssues] : [],
        preferredStyle: String(data.preferredStyle || ''),
        requiredFeatures: Array.isArray(data.requiredFeatures) ? [...data.requiredFeatures] : [],
        budget: String(data.budget || ''),
        timeline: String(data.timeline || ''),
        name: String(data.name || ''),
        email: String(data.email || ''),
        phone: String(data.phone || ''),
        company: String(data.company || ''),
        website: String(data.website || ''),
        assessmentId,
        selectedPackage: typeof data.selectedPackage === 'string' ? data.selectedPackage : undefined
      };

      onComplete(safeData, response.results);
      onClose();
    } catch (error) {
      console.error('Dashboard request submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Request submission failed.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    const question = currentQuestion;
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">{question.title}</h2>
          {question.subtitle && (
            <p className="text-medium-gray text-sm font-mono opacity-60 uppercase tracking-widest">
              {question.subtitle}
            </p>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          {question.type === 'select' && (
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option) => {
                const value = option;
                const label = option;
                const isSelected = data[question.field] === value;
                
                return (
                  <button
                    key={value}
                    onClick={() => handleInputChange(question.field, value)}
                    className={`p-4 text-left font-mono text-xs border transition-all rounded-xl flex items-center gap-4 ${
                      isSelected 
                        ? 'bg-ai-blue/20 border-ai-blue text-white shadow-[0_0_20px_rgba(0,102,255,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-ai-blue animate-pulse shadow-[0_0_8px_#0066FF]' : 'bg-white/10'}`}></div>
                    <span className="uppercase tracking-widest">{label}</span>
                  </button>
                );
              })}
              
              {question.hasOther && data[question.field] === 'Other' && (
                <div className="mt-4 animate-fade-in">
                  <label className="font-mono text-[9px] text-ai-blue ml-1 uppercase tracking-widest mb-2 block">Specify Other</label>
                  <input
                    type="text"
                    value={String(data[question.otherField!] || '')}
                    onChange={(e) => handleInputChange(question.otherField!, e.target.value)}
                    className="w-full px-5 py-4 bg-ai-blue/5 border border-ai-blue/20 rounded-lg text-white font-mono text-sm focus:border-ai-blue focus:outline-none"
                    placeholder="ENTER_SPECIFICATIONS"
                  />
                </div>
              )}
            </div>
          )}

          {question.type === 'multiselect' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options.map((option) => {
                const value = option;
                const label = option;
                const selectedOptions = (data[question.field] as string[]) || [];
                const isSelected = selectedOptions.includes(value);
                
                const toggleOption = () => {
                  const newSelection = isSelected
                    ? selectedOptions.filter(i => i !== value)
                    : [...selectedOptions, value];
                  handleInputChange(question.field, newSelection);
                };

                return (
                  <button
                    key={value}
                    onClick={toggleOption}
                    className={`p-4 text-left font-mono text-[10px] border transition-all rounded-xl flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-ai-blue/20 border-ai-blue text-white shadow-[0_0_20px_rgba(0,102,255,0.2)]' 
                        : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="uppercase tracking-widest">{label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-ai-blue border-ai-blue' : 'border-white/20 group-hover:border-white/40'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'text' && (
            <div className="relative">
              <input
                type="text"
                value={String(data[question.field] || '')}
                onChange={(e) => handleInputChange(question.field, e.target.value)}
                className={`w-full px-6 py-5 bg-ai-blue/5 border rounded-xl text-white font-mono text-sm focus:border-ai-blue focus:bg-ai-blue/10 focus:outline-none transition-all placeholder:text-white/10 ${
                  errors[question.field] ? 'border-red-500/50' : 'border-ai-blue/20'
                }`}
                placeholder="INPUT_DATA_SEQUENCE..."
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                <div className="w-1.5 h-4 bg-ai-blue animate-pulse"></div>
              </div>
            </div>
          )}

          {errors[question.field] && (
            <div className="mt-6 flex items-center gap-3 animate-shake">
              <div className="w-1 h-4 bg-red-500"></div>
              <p className="text-red-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                Error: {errors[question.field]}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in font-mono">
      <div className="bg-darker-bg border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl">
        {/* HUD Elements */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]">
          <div className="w-full h-[1px] bg-ai-blue animate-scan"></div>
        </div>
        
        {/* Header Section */}
        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-ai-blue/10 rounded-2xl flex items-center justify-center border border-ai-blue/20 relative group">
              <div className="absolute inset-0 bg-ai-blue/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Sparkles className="w-6 h-6 text-ai-blue relative z-10" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase text-white">Build Request Brief</h2>
              <div className="flex items-center gap-3">
                <span className="text-[8px] text-ai-blue font-black uppercase tracking-[0.3em]">Module: {`Q_0${currentStep + 1}`}</span>
                <span className="w-1 h-1 rounded-full bg-ai-blue animate-pulse"></span>
                <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em]">ID: {assessmentId?.substring(0, 8) || 'INITIALIZING'}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
          {isInitializing ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 animate-pulse">
              <div className="w-16 h-16 border-4 border-ai-blue/20 border-t-ai-blue rounded-full animate-spin"></div>
              <div className="text-center">
                <p className="text-ai-blue font-mono text-xs uppercase tracking-[0.5em] mb-2">Initializing Neural Link</p>
                <p className="text-white/20 font-mono text-[8px] uppercase tracking-widest">Establishing secure connection to core...</p>
              </div>
            </div>
          ) : (
            renderQuestion()
          )}
        </div>

        {/* Footer Section */}
        <div className="p-8 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0 || isProcessing || isSubmitting}
            className={`flex items-center font-mono text-[10px] px-8 py-3.5 rounded-xl border transition-all uppercase tracking-[0.2em] ${
              currentStep === 0 || isProcessing || isSubmitting
                ? 'opacity-0 pointer-events-none'
                : 'text-white/60 border-white/10 hover:text-white hover:bg-white/5 hover:border-white/20'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-3" />
            Previous
          </button>

          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9px] text-ai-blue/60 uppercase tracking-widest">Processing</span>
                <span className="font-mono text-[10px] text-white font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="flex gap-1">
                {[...Array(questions.length)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-1 rounded-full transition-all duration-700 ${
                      i <= currentStep ? 'bg-ai-blue shadow-[0_0_10px_#0066FF]' : 'bg-white/5'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
            
            <button
              onClick={
                currentStep === questions.length - 1
                  ? handleSubmit
                  : currentStep <= questions.length - 1
                  ? handleNext
                  : handleSubmit
              }
              disabled={isProcessing || isSubmitting || isInitializing}
              className="group relative px-12 py-4 bg-ai-blue text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-ai-blue/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              <span className="relative z-10 flex items-center gap-3">
                {isProcessing || isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStep === questions.length - 1
                        ? 'Submit_Request'
                        : currentStep <= questions.length - 1
                        ? 'Next_Phase'
                        : 'Submit_Request'}
                    </span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Global Error Overlay */}
        {errors.submit && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50 animate-bounce-subtle">
            <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-red-500 font-mono text-[10px] leading-relaxed uppercase tracking-tighter">{errors.submit}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

