'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Terminal,
  Cpu,
  ShieldCheck,
  MapPin
} from 'lucide-react';

const contactItems = [
  {
    icon: MapPin,
    label: 'Office',
    value: 'Nairobi, Kenya',
    link: 'https://www.google.com/maps/search/Nairobi+Kenya', // Generic Nairobi location search
    color: 'from-orange-500/20 to-red-500/20',
    iconColor: 'text-orange-400'
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'support@sitemendr.com',
    link: 'mailto:support@sitemendr.com',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400'
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+254 790 057 596',
    link: 'tel:+254790057596',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400'
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: '+254 790 057 596',
    link: 'https://wa.me/254790057596',
    color: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400'
  }
];

interface ContactResponse {
  success: boolean;
  message?: string;
}

export default function Contact() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    projectType: '',
    message: ''
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: null });

    try {
      const data = await apiClient.sendContactMessage({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        message: formData.message,
        subject: formData.projectType
      }) as ContactResponse;

      if (data.success) {
        setSubmitStatus({
          type: 'success',
          message: data.message || 'Transmission successful. Our engineers will contact you shortly.'
        });
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          projectType: '',
          message: ''
        });
      } else {
        throw new Error(data.message || 'Uplink failed. Please retry transmission.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'System error. Direct communication channel is currently unstable.';
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Immersive Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover opacity-30 grayscale animate-slow-zoom"
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-data-processing-in-a-server-room-22700-large.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
      </div>

      {/* OS HUD Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-24 left-12 opacity-20">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-4 h-4 text-ai-blue" />
            <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Contact Us</span>
          </div>
          <div className="w-48 h-[1px] bg-gradient-to-r from-ai-blue/50 to-transparent"></div>
        </div>

        <div className="absolute bottom-12 right-12 opacity-20 text-right">
          <div className="flex items-center justify-end gap-3 mb-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Encryption: 256-BIT_AES</span>
            <ShieldCheck className="w-4 h-4 text-expert-green" />
          </div>
          <div className="w-48 h-[1px] bg-gradient-to-l from-expert-green/50 to-transparent"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-40 pb-32">
        <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="text-center mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Sparkles className="w-4 h-4 text-ai-blue" />
              <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Direct Communication Line</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter uppercase leading-none">
              Initiate <br />
              <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">Deployment</span>
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto font-light leading-relaxed">
              Connect with our engineering team to transform your digital infrastructure into a high-performance ecosystem.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              {contactItems.map((item, i) => (
                <div
                  key={i}
                  className="group relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl hover:border-ai-blue/40 transition-all duration-500 cursor-pointer overflow-hidden"
                  onClick={() => item.link && window.open(item.link, '_blank')}
                >
                  <div className="relative z-10 flex items-center gap-6">
                    <div className={`p-4 rounded-2xl bg-white/5 text-white/40 group-hover:scale-110 transition-transform duration-500`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{item.label}</div>
                      <div className="text-lg font-bold text-white uppercase tracking-tight">{item.value}</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-ai-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              ))}

              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-ai-blue/20 to-tech-purple/20 border border-white/10 backdrop-blur-3xl">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-ai-blue" />
                  System Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Average Response Time</span>
                    <span className="font-mono text-xs text-ai-blue">24ms</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-ai-blue w-[90%] animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Immersive Form */}
            <div className="relative p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl overflow-hidden group">
              {/* Form Corner Brackets */}
              <div className="absolute top-12 left-12 w-12 h-12 border-t-2 border-l-2 border-white/5 group-hover:border-ai-blue/20 transition-colors"></div>
              <div className="absolute bottom-12 right-12 w-12 h-12 border-b-2 border-r-2 border-white/5 group-hover:border-ai-blue/20 transition-colors"></div>

              <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
                {submitStatus.type && (
                  <div className={`p-6 rounded-2xl border font-mono text-[10px] uppercase tracking-widest ${
                    submitStatus.type === 'success' 
                      ? 'bg-expert-green/10 border-expert-green/30 text-expert-green' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {submitStatus.type === 'success' ? '✓ STATUS: ' : '⚠ ERROR: '}
                    {submitStatus.message}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-12">
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="FIRST_NAME"
                      className="w-full bg-transparent border-b border-white/10 py-4 font-mono text-xs tracking-[0.2em] focus:border-ai-blue outline-none transition-all placeholder:text-white/20"
                      required
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="LAST_NAME"
                      className="w-full bg-transparent border-b border-white/10 py-4 font-mono text-xs tracking-[0.2em] focus:border-ai-blue outline-none transition-all placeholder:text-white/20"
                      required
                    />
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    className="w-full bg-transparent border-b border-white/10 py-4 font-mono text-xs tracking-[0.2em] focus:border-ai-blue outline-none transition-all placeholder:text-white/20"
                    required
                  />
                </div>

                <div className="relative">
                  <select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="w-full bg-transparent border-b border-white/10 py-4 font-mono text-xs tracking-[0.2em] focus:border-ai-blue outline-none transition-all appearance-none text-white/60 cursor-pointer"
                    required
                  >
                    <option value="" className="bg-black">Project Type</option>
                    <option value="web-app" className="bg-black">WEB_INFRASTRUCTURE</option>
                    <option value="mobile-app" className="bg-black">MOBILE_ECOSYSTEM</option>
                    <option value="api" className="bg-black">API_DEVELOPMENT</option>
                    <option value="consulting" className="bg-black">TECHNICAL_CONSULTING</option>
                  </select>
                </div>

                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Your Message..."
                    className="w-full bg-transparent border-b border-white/10 py-4 font-mono text-xs tracking-[0.2em] focus:border-ai-blue outline-none transition-all resize-none placeholder:text-white/20"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full group/btn relative px-12 py-8 bg-white text-black font-black text-xs uppercase tracking-[0.5em] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,255,255,0.1)] active:scale-[0.98] font-mono ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ai-blue/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] skew-x-[-20deg]"></div>
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {isSubmitting ? 'Transmitting...' : 'Transmit Message'}
                    <Send className={`w-5 h-5 transition-transform duration-500 ${isSubmitting ? 'animate-pulse' : 'group-hover:translate-x-2'}`} />
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
