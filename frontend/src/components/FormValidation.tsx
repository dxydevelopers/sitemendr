'use client';

import { useState, useCallback } from 'react';
import { 
  Mail, 
  User, 
  Phone, 
  Building2, 
  Globe, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface FieldConfig {
  type: 'text' | 'email' | 'tel' | 'url' | 'password';
  label: string;
  placeholder: string;
  validation: ValidationRule;
  icon: React.ReactNode;
}

interface FormField {
  value: string;
  error: string | null;
  touched: boolean;
}

interface FormState {
  [key: string]: FormField;
}

export default function FormValidation() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fieldConfigs: Record<string, FieldConfig> = {
    name: {
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      validation: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/,
      },
      icon: <User className="w-5 h-5" />
    },
    email: {
      type: 'email',
      label: 'Email Address',
      placeholder: 'your@email.com',
      validation: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      },
      icon: <Mail className="w-5 h-5" />
    },
    phone: {
      type: 'tel',
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567',
      validation: {
        required: true,
        pattern: /^\+?[1-9]\d{1,14}$/,
      },
      icon: <Phone className="w-5 h-5" />
    },
    company: {
      type: 'text',
      label: 'Company Name',
      placeholder: 'Your company name',
      validation: {
        required: true,
        minLength: 2,
        maxLength: 100,
      },
      icon: <Building2 className="w-5 h-5" />
    },
    website: {
      type: 'url',
      label: 'Website URL',
      placeholder: 'https://yourcompany.com',
      validation: {
        pattern: /^https?:\/\/.+\..+/,
      },
      icon: <Globe className="w-5 h-5" />
    },
    password: {
      type: 'password',
      label: 'Password',
      placeholder: 'Create a strong password',
      validation: {
        required: true,
        minLength: 8,
        custom: (value) => {
          if (!/(?=.*[a-z])/.test(value)) return 'Password must contain lowercase letter';
          if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain uppercase letter';
          if (!/(?=.*\d)/.test(value)) return 'Password must contain number';
          if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain special character';
          return null;
        },
      },
      icon: <Sparkles className="w-5 h-5" />
    }
  };

  const [formState, setFormState] = useState<FormState>(() => {
    const initialState: FormState = {};
    Object.keys(fieldConfigs).forEach(key => {
      initialState[key] = { value: '', error: null, touched: false };
    });
    return initialState;
  });

  const validateField = useCallback((name: string, value: string): string | null => {
    const config = fieldConfigs[name];
    const rules = config.validation;

    if (rules.required && (!value || value.trim() === '')) {
      return `${config.label} is required`;
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return `${config.label} must be at least ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return `${config.label} must be no more than ${rules.maxLength} characters`;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      return `${config.label} format is invalid`;
    }

    if (value && rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, []);

  const updateField = useCallback((name: string, value: string) => {
    const error = validateField(name, value);
    setFormState(prev => ({
      ...prev,
      [name]: { value, error, touched: true }
    }));
  }, [validateField]);

  const getFieldStatus = useCallback((name: string) => {
    const field = formState[name];
    if (!field.touched) return 'default';
    if (field.error) return 'error';
    if (field.value) return 'success';
    return 'default';
  }, [formState]);

  const isFormValid = useCallback(() => {
    return Object.keys(formState).every(key => {
      const field = formState[key];
      return !field.error && (field.value || !fieldConfigs[key].validation.required);
    });
  }, [formState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const updatedState = { ...formState };
    Object.keys(updatedState).forEach(key => {
      updatedState[key] = { ...updatedState[key], touched: true };
    });
    setFormState(updatedState);

    if (!isFormValid()) {
      setSubmitMessage('Please fix the errors above before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSubmitMessage('Form submitted successfully! 🎉');
      
      // Reset form after successful submission
      const resetState: FormState = {};
      Object.keys(fieldConfigs).forEach(key => {
        resetState[key] = { value: '', error: null, touched: false };
      });
      setFormState(resetState);
    } catch {
      setSubmitMessage('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-darker-bg text-white py-20">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-6">
            <Sparkles className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Advanced Form Validation</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            Smart <span className="bg-gradient-to-r from-ai-blue to-tech-purple bg-clip-text text-transparent italic">Validation</span>
          </h1>
          <p className="text-white/60 text-lg">
            Real-time validation with intelligent error handling and user feedback
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {Object.keys(fieldConfigs).map((fieldName) => {
            const config = fieldConfigs[fieldName];
            const field = formState[fieldName];
            const status = getFieldStatus(fieldName);

            return (
              <div key={fieldName} className="relative">
                <label className="block text-sm font-bold mb-2 text-white/60 uppercase tracking-widest">
                  {config.label}
                </label>
                
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40">
                    {config.icon}
                  </div>
                  
                  <input
                    type={config.type === 'password' && showPassword ? 'text' : config.type}
                    value={field.value}
                    onChange={(e) => updateField(fieldName, e.target.value)}
                    placeholder={config.placeholder}
                    className={`w-full pl-12 pr-4 py-4 bg-white/[0.02] border rounded-xl focus:outline-none transition-all ${
                      status === 'error' 
                        ? 'border-red-500/50 focus:border-red-500/80' 
                        : status === 'success' 
                        ? 'border-ai-blue/50 focus:border-ai-blue/80' 
                        : 'border-white/10 focus:border-ai-blue/40'
                    }`}
                  />
                  
                  {config.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  )}
                  
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {status === 'success' && <CheckCircle className="w-5 h-5 text-ai-blue" />}
                  </div>
                </div>

                {field.error && field.touched && (
                  <p className="mt-2 text-red-500 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {field.error}
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all ${
                isSubmitting || !isFormValid()
                  ? 'bg-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-r from-ai-blue to-tech-purple hover:scale-105 shadow-[0_0_40px_rgba(0,102,255,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                'Submit Form'
              )}
            </button>
          </div>

          {submitMessage && (
            <div className={`p-4 rounded-xl text-center ${
              submitMessage.includes('successfully') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {submitMessage}
            </div>
          )}
        </form>

        {/* Validation Rules Info */}
        <div className="mt-12 p-8 bg-white/[0.02] border border-white/10 rounded-2xl">
          <h3 className="text-lg font-bold mb-4">Password Requirements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${formState.password.value.length >= 8 ? 'bg-ai-blue' : 'bg-white/20'}`}></div>
              8+ characters
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${/(?=.*[a-z])/.test(formState.password.value) ? 'bg-ai-blue' : 'bg-white/20'}`}></div>
              Lowercase letter
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${/(?=.*[A-Z])/.test(formState.password.value) ? 'bg-ai-blue' : 'bg-white/20'}`}></div>
              Uppercase letter
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${/(?=.*\d)/.test(formState.password.value) ? 'bg-ai-blue' : 'bg-white/20'}`}></div>
              Number
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${/(?=.*[!@#$%^&*])/.test(formState.password.value) ? 'bg-ai-blue' : 'bg-white/20'}`}></div>
              Special character
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}