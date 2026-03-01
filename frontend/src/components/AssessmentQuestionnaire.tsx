'use client';

import { useState, useEffect } from 'react';
import { apiClient, saveSessionToken } from '@/lib/api';
import { Sparkles, Palette, Briefcase, Layout, ChevronRight, ChevronLeft, Send, CheckCircle2, X } from 'lucide-react';
import AssessmentResults, { AssessmentResultsData } from './AssessmentResults';

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
  [key: string]: string | string[] | undefined;
}

interface AssessmentQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: AssessmentData, results?: AssessmentResultsData) => void;
  preSelectedPlan?: string;
}

interface OptionObject {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

type Option = string | OptionObject;

interface Question {
  id: number;
  title: string;
  subtitle?: string;
  type: string;
  field: string;
  required: boolean;
  options: Option[];
  hasOther?: boolean;
  otherField?: string;
}

const questions: Question[] = [
  {
    id: 1,
    title: "What type of business do you have?",
    type: "select",
    field: "businessType",
    required: true,
    options: [
      "E-commerce/Online Store",
      "Service Business (consulting, agency, etc.)",
      "Restaurant/Food Service",
      "Healthcare/Medical",
      "Real Estate",
      "Education/Training",
      "Non-profit/Charity",
      "Other"
    ],
    hasOther: true,
    otherField: "businessTypeOther"
  },
  {
    id: 2,
    title: "How many employees does your business have?",
    type: "select",
    field: "employeeCount",
    required: true,
    options: [
      "Just me/Sole proprietor",
      "2-10 employees",
      "11-50 employees",
      "51-200 employees",
      "200+ employees"
    ]
  },
  {
    id: 3,
    title: "What are your main goals for the website?",
    subtitle: "Select all that apply",
    type: "multiselect",
    field: "goals",
    required: true,
    options: [
      "Generate leads/inquiries",
      "Sell products online",
      "Build brand awareness",
      "Provide information to customers",
      "Offer online booking/appointments",
      "Showcase portfolio/work",
      "Community building",
      "Other"
    ],
    hasOther: true
  },
  {
    id: 4,
    title: "Who is your target audience?",
    subtitle: "Select all that apply",
    type: "multiselect",
    field: "targetAudience",
    required: true,
    options: [
      "General public/consumers",
      "Businesses (B2B)",
      "Specific age group",
      "Specific industry/profession",
      "Local community",
      "International audience"
    ]
  },
  {
    id: 5,
    title: "Do you currently have a website?",
    type: "select",
    field: "hasWebsite",
    required: true,
    options: [
      "No website yet",
      "Basic website (template or simple)",
      "Custom website (professionally built)",
      "E-commerce platform (Shopify, WooCommerce, etc.)"
    ]
  },
  {
    id: 6,
    title: "What design style appeals to you?",
    type: "cards",
    field: "preferredStyle",
    required: true,
    options: [
      {
        value: "modern",
        label: "Modern & Clean",
        description: "Minimalist design, lots of white space",
        icon: <Layout className="w-6 h-6 text-ai-blue" />
      },
      {
        value: "bold",
        label: "Bold & Creative",
        description: "Vibrant colors, unique layouts",
        icon: <Palette className="w-6 h-6 text-tech-purple" />
      },
      {
        value: "professional",
        label: "Professional & Corporate",
        description: "Traditional business look",
        icon: <Briefcase className="w-6 h-6 text-expert-green" />
      },
      {
        value: "trendy",
        label: "Trendy & Modern",
        description: "Current design trends",
        icon: <Sparkles className="w-6 h-6 text-pink-500" />
      }
    ]
  },
  {
    id: 7,
    title: "Which features do you need?",
    subtitle: "Select all that apply",
    type: "multiselect",
    field: "requiredFeatures",
    required: false,
    options: [
      "Contact forms",
      "Online booking/appointments",
      "E-commerce/shopping cart",
      "Blog/news section",
      "Portfolio/gallery",
      "Social media integration",
      "Newsletter signup",
      "Live chat support",
      "Multi-language support",
      "User accounts/login",
      "Search functionality",
      "Analytics integration"
    ]
  },
  {
    id: 8,
    title: "What's your budget range for this project?",
    type: "select",
    field: "budget",
    required: true,
    options: [
      "Under $1,000 (Basic template)",
      "$1,000 - $3,000 (AI-Launch package)",
      "$3,000 - $10,000 (Pro Development)",
      "$10,000+ (Enterprise/Custom)",
      "Not sure yet"
    ]
  },
  {
    id: 9,
    title: "What's your preferred timeline?",
    type: "select",
    field: "timeline",
    required: true,
    options: [
      "ASAP (within 2 weeks)",
      "1-3 months",
      "3-6 months",
      "6+ months",
      "Flexible"
    ]
  }
];

export default function AssessmentQuestionnaire({ isOpen, onClose, onComplete, preSelectedPlan }: AssessmentQuestionnaireProps) {
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

  // Handle pre-selected plan from PricingPreview
  useEffect(() => {
    if (preSelectedPlan && isOpen) {
      console.log('AssessmentQuestionnaire: preSelectedPlan received:', preSelectedPlan, typeof preSelectedPlan);
      const budgetMap: Record<string, string> = {
        'PROTOCOL_A': 'Under $1,000 (Basic template)',
        'PROTOCOL_B': '$1,000 - $3,000 (AI-Launch package)',
        'PROTOCOL_C': '$3,000 - $10,000 (Pro Development)',
        'PROTOCOL_D': 'Under $1,000 (Basic template)',
        'PROTOCOL_E': '$1,000 - $3,000 (AI-Launch package)'
      };

      const featuresMap: Record<string, string[]> = {
        'PROTOCOL_A': ['Contact forms', 'Mobile-friendly Design', '1-Year Hosting'],
        'PROTOCOL_B': ['Custom development', 'Admin Panel', 'Speed Improvements'],
        'PROTOCOL_C': ['Enterprise solutions', 'Dedicated Manager', 'Priority Care'],
        'PROTOCOL_D': ['Security updates', 'Live system check', 'Problem response'],
        'PROTOCOL_E': ['Full Source Code', 'Docker Configuration', 'Deployment Guide']
      };

      const packageNames: Record<string, string> = {
        'PROTOCOL_A': 'ai_foundation',
        'PROTOCOL_B': 'pro_enhancement',
        'PROTOCOL_C': 'enterprise',
        'PROTOCOL_D': 'maintenance',
        'PROTOCOL_E': 'self_hosted'
      };

      setData(prev => ({
        ...prev,
        budget: budgetMap[preSelectedPlan] || prev.budget,
        requiredFeatures: Array.from(new Set([...(prev.requiredFeatures || []), ...(featuresMap[preSelectedPlan] || [])])),
        selectedPackage: packageNames[preSelectedPlan] || preSelectedPlan
      }));
    }
  }, [preSelectedPlan, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultsData | null>(null);
  const [showResults, setShowResults] = useState(false);

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
        let nextStep = currentStep + 1;
        
        // Skip budget (id: 8) and features (id: 7) if pre-selected plan exists
        // Since questions is 0-indexed, id: 7 is index 6, id: 8 is index 7
        if (preSelectedPlan) {
          while (nextStep < questions.length && (questions[nextStep].id === 7 || questions[nextStep].id === 8)) {
            nextStep++;
          }
        }
        
        setCurrentStep(nextStep);
      } else {
        // Move to contact form
        setCurrentStep(questions.length);
      }
    } catch (error) {
      console.error('Error saving responses:', error);
      setErrors({ submit: 'Failed to save responses. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      
      // Skip back over budget (id: 8) and features (id: 7) if pre-selected plan exists
      if (preSelectedPlan) {
        while (prevStep > 0 && (questions[prevStep].id === 7 || questions[prevStep].id === 8)) {
          prevStep--;
        }
      }
      
      setCurrentStep(prevStep);
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
    const contactErrors: Record<string, string> = {};
    if (!data.name) contactErrors.name = 'Name is required';
    if (!data.email) contactErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) contactErrors.email = 'Please enter a valid email';

    if (Object.keys(contactErrors).length > 0) {
      setErrors(contactErrors);
      return;
    }

    if (!assessmentId) {
      setErrors({ submit: 'Assessment not initialized. Please wait a moment and try again.' });
      return;
    }

    setIsSubmitting(true);

    try {
      // Process the assessment with AI and get results
      const response = await apiClient.processAssessment(assessmentId, data);

      // Store results and show results component
      setAssessmentResults(response.results);
      setShowResults(true);

      // Notify parent component with safe data mapping
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
        assessmentId: assessmentId,
        selectedPackage: typeof data.selectedPackage === 'string' ? data.selectedPackage : undefined
      };
      
      onComplete(safeData, response.results);
    } catch (error) {
      console.error('Assessment submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process assessment. Please try again.';
      setErrors({ submit: `Failed to process assessment: ${errorMessage}. Please ensure the backend server is running.` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize assessment when modal opens
  useEffect(() => {
    if (isOpen && !assessmentId && !isInitializing) {
      const initializeAssessment = async () => {
        setIsInitializing(true);
        try {
          const response = await apiClient.startAssessment('homepage');
          setAssessmentId(response.assessmentId);
          saveSessionToken(response.sessionToken);
        } catch (error) {
          console.error('Failed to start assessment:', error);
          setErrors({ submit: 'Failed to start assessment. Please try again.' });
        } finally {
          setIsInitializing(false);
        }
      };

      initializeAssessment();
    }
  }, [isOpen, assessmentId, isInitializing]);

  const renderQuestion = () => {
    if (currentStep > questions.length - 1) {
      // Contact form
      return (
        <div className="space-y-8 animate-fade-in-up">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Signal_Acquisition</h2>
            <p className="text-medium-gray text-sm font-mono uppercase tracking-widest opacity-60">Complete technical profile for AI synthesis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Your Name', field: 'name', type: 'text', placeholder: 'Enter your name' },
              { label: 'Email Address', field: 'email', type: 'email', placeholder: 'your@email.com' },
              { label: 'Phone Number', field: 'phone', type: 'tel', placeholder: '+1 000 000 0000' },
              { label: 'Company Name', field: 'company', type: 'text', placeholder: 'Your company name' }
            ].map((input) => (
              <div key={input.field} className="space-y-2">
                <label className="font-mono text-[9px] text-ai-blue uppercase tracking-[0.3em] ml-1">{input.label}</label>
                <input
                  type={input.type}
                  value={data[input.field as keyof AssessmentData] as string}
                  onChange={(e) => handleInputChange(input.field, e.target.value)}
                  className={`w-full px-5 py-4 bg-ai-blue/5 border rounded-lg text-white font-mono text-sm focus:border-ai-blue focus:bg-ai-blue/10 focus:outline-none transition-all placeholder:text-white/10 ${
                    errors[input.field] ? 'border-red-500/50' : 'border-ai-blue/20'
                  }`}
                  placeholder={input.placeholder}
                />
                {errors[input.field] && <p className="text-red-500 font-mono text-[9px] mt-1 ml-1 uppercase tracking-tighter">{errors[input.field]}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-fade-in-up">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-lg bg-ai-blue/5 border border-ai-blue/20 mb-6">
            <span className="flex h-1.5 w-1.5 rounded-full bg-ai-blue animate-pulse shadow-[0_0_8px_#0066FF]"></span>
            <span className="font-mono text-[10px] font-bold text-ai-blue uppercase tracking-[0.3em]">Question {currentStep + 1} of {questions.length}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tighter uppercase leading-tight">{currentQuestion.title}</h2>
          {currentQuestion.subtitle && (
            <p className="text-medium-gray text-xs font-mono uppercase tracking-[0.2em] opacity-60">{currentQuestion.subtitle}</p>
          )}
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-2 custom-scrollbar space-y-3">
          {currentQuestion.type === 'select' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option) => {
                const optValue = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                return (
                  <label key={optValue} className={`flex items-center space-x-4 p-5 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${
                    data[currentQuestion.field as keyof AssessmentData] === optValue
                      ? 'border-ai-blue bg-ai-blue/10 shadow-[0_0_20px_rgba(0,102,255,0.1)]'
                      : 'border-white/5 bg-white/[0.02] hover:border-ai-blue/30 hover:bg-ai-blue/5'
                  }`}>
                    <input
                      type="radio"
                      name={currentQuestion.field}
                      value={optValue}
                      checked={data[currentQuestion.field as keyof AssessmentData] === optValue}
                      onChange={(e) => handleInputChange(currentQuestion.field, e.target.value)}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      data[currentQuestion.field as keyof AssessmentData] === optValue ? 'border-ai-blue scale-110 shadow-[0_0_10px_rgba(0,102,255,0.5)]' : 'border-white/20 group-hover:border-ai-blue/40'
                    }`}>
                      {data[currentQuestion.field as keyof AssessmentData] === optValue && (
                        <div className="w-1.5 h-1.5 bg-ai-blue rounded-full shadow-[0_0_8px_rgba(0,102,255,0.8)]"></div>
                      )}
                    </div>
                    <span className={`font-mono text-xs tracking-widest transition-colors uppercase ${
                      data[currentQuestion.field as keyof AssessmentData] === optValue ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                    }`}>{optLabel}</span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'multiselect' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option) => {
                const optValue = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                const isChecked = (data[currentQuestion.field as keyof AssessmentData] as string[]).includes(optValue);
                return (
                  <label key={optValue} className={`flex items-center space-x-4 p-5 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${
                    isChecked
                      ? 'border-ai-blue bg-ai-blue/10 shadow-[0_0_20px_rgba(0,102,255,0.1)]'
                      : 'border-white/5 bg-white/[0.02] hover:border-ai-blue/30 hover:bg-ai-blue/5'
                  }`}>
                    <input
                      type="checkbox"
                      value={optValue}
                      checked={isChecked}
                      onChange={(e) => {
                        const current = data[currentQuestion.field as keyof AssessmentData] as string[];
                        const updated = e.target.checked
                          ? [...current, optValue]
                          : current.filter(item => item !== optValue);
                        handleInputChange(currentQuestion.field, updated);
                      }}
                      className="hidden"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked 
                        ? 'border-ai-blue bg-ai-blue/20 shadow-[0_0_10px_rgba(0,102,255,0.3)]' 
                        : 'border-white/20 group-hover:border-ai-blue/40'
                    }`}>
                      {isChecked && (
                        <CheckCircle2 className="w-3 h-3 text-ai-blue" />
                      )}
                    </div>
                    <span className={`font-mono text-xs tracking-widest transition-colors uppercase ${
                      isChecked ? 'text-white' : 'text-white/40 group-hover:text-white/70'
                    }`}>{optLabel}</span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion.options.map((option) => {
                if (typeof option === 'string') return null;
                return (
                  <div
                    key={option.value}
                    onClick={() => handleInputChange(currentQuestion.field, option.value)}
                    className={`p-6 border rounded-lg cursor-pointer transition-all group relative overflow-hidden ${
                      data[currentQuestion.field as keyof AssessmentData] === option.value
                        ? 'border-ai-blue bg-ai-blue/10 shadow-[0_0_30px_rgba(0,102,255,0.1)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-ai-blue/30 hover:bg-ai-blue/5'
                    }`}
                  >
                    <div className={`text-3xl mb-4 transition-transform group-hover:scale-110 duration-300 ${
                      data[currentQuestion.field as keyof AssessmentData] === option.value ? 'filter-none' : 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100'
                    }`}>{option.icon}</div>
                    <h3 className={`font-mono text-xs font-bold mb-2 tracking-[0.2em] uppercase transition-colors ${
                      data[currentQuestion.field as keyof AssessmentData] === option.value ? 'text-white' : 'text-white/40 group-hover:text-white'
                    }`}>{option.label}</h3>
                    <p className="font-mono text-[9px] text-medium-gray leading-relaxed opacity-60 uppercase tracking-tighter">{option.description}</p>
                    
                    {data[currentQuestion.field as keyof AssessmentData] === option.value && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-ai-blue shadow-[0_0_5px_#0066FF]"></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {errors[currentQuestion.field] && (
          <p className="text-red-500 font-mono text-[9px] text-center animate-pulse uppercase tracking-widest">! ERROR: {errors[currentQuestion.field]}</p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  // Show results if assessment is complete
  if (showResults && assessmentResults) {
    return (
      <AssessmentResults
        results={assessmentResults}
        email={data.email}
        assessmentId={assessmentId}
        onCaptureLead={(packageType) => {
          onComplete({ ...data, assessmentId, selectedPackage: packageType }, assessmentResults);
        }}
        onRetake={() => {
          setShowResults(false);
          setAssessmentResults(null);
          setCurrentStep(0);
          setData({
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
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-darker-bg/90 backdrop-blur-xl" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-darker-bg/90 backdrop-blur-3xl border border-ai-blue/20 rounded-2xl shadow-[0_0_50px_rgba(0,102,255,0.15)] overflow-hidden animate-slide-up">
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

        {/* Progress Bar Container */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-white/5 overflow-hidden">
          <div
            className="h-full bg-ai-blue transition-all duration-700 ease-out relative shadow-[0_0_10px_rgba(0,102,255,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8 md:p-12 relative z-10">
          {/* Header Status Bar */}
          <div className="flex justify-between items-center mb-10 pb-4 border-b border-ai-blue/10">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-ai-blue shadow-[0_0_8px_#0066FF] animate-pulse"></div>
                <span className="font-mono text-[10px] text-ai-blue uppercase tracking-[0.3em]">Step: Business Analysis</span>
              </div>
              {data.selectedPackage && typeof data.selectedPackage === 'string' && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[8px] text-tech-purple uppercase tracking-[0.2em]">Package:</span>
                  <span className="font-mono text-[8px] text-white/60 uppercase tracking-[0.2em] font-black">{data.selectedPackage}</span>
                </div>
              )}
            </div>
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.2em] hidden sm:block">ID: {assessmentId?.substring(0, 8) || 'INITIALIZING'}</span>
          </div>

          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 w-8 h-8 rounded-lg bg-ai-blue/5 border border-ai-blue/20 flex items-center justify-center text-ai-blue/50 hover:text-white hover:bg-ai-blue/20 hover:border-ai-blue/40 transition-all z-20 group"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {renderQuestion()}

          <div className="mt-12 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isProcessing || isSubmitting}
              className={`flex items-center font-mono text-[10px] uppercase tracking-[0.2em] px-5 py-2.5 rounded-lg border transition-all ${
                currentStep === 0 || isProcessing || isSubmitting 
                  ? 'text-white/5 border-transparent' 
                  : 'text-ai-blue/60 border-ai-blue/20 hover:text-ai-blue hover:bg-ai-blue/5 hover:border-ai-blue/40'
              }`}
            >
              <ChevronLeft className="w-3 h-3 mr-3" />
              Step_Back
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end mr-4">
                <span className="font-mono text-[9px] text-ai-blue/40 uppercase tracking-widest">Buffer_Level</span>
                <div className="flex gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-3 h-1 rounded-full ${i < (currentStep / questions.length) * 5 ? 'bg-ai-blue shadow-[0_0_5px_#0066FF]' : 'bg-white/5'}`}></div>
                  ))}
                </div>
              </div>
              
            <button
              onClick={currentStep <= questions.length - 1 ? handleNext : handleSubmit}
              disabled={isProcessing || isSubmitting || isInitializing}
              className="group relative px-10 py-4 bg-ai-blue/10 border border-ai-blue/30 text-white font-mono text-xs uppercase tracking-[0.2em] rounded-lg overflow-hidden transition-all duration-300 hover:bg-ai-blue/20 hover:border-ai-blue/50 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ai-blue/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] skew-x-[-20deg]"></div>
              <span className="relative z-10 flex items-center gap-3">
                {isProcessing || isSubmitting || isInitializing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ai-blue/30 border-t-ai-blue rounded-full animate-spin"></div>
                    <span className="text-ai-blue">{isInitializing ? 'INITIALIZING...' : 'PROCESSING...'}</span>
                  </>
                ) : (
                  <>
                    <span>{currentStep <= questions.length - 1 ? 'Next_Step' : 'Finalize_Scan'}</span>
                    {currentStep <= questions.length - 1 ? (
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-ai-blue" />
                    ) : (
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-ai-blue" />
                    )}
                  </>
                )}
              </span>
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}