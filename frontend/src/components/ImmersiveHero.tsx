'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Users, Globe, Award, Zap, Shield, Briefcase, Megaphone, Palette, Code, Smartphone, Search, TrendingUp } from 'lucide-react';

export default function ImmersiveHero({ onStartAssessment }: { onStartAssessment: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Dark tech video URLs - verified working
  const darkTechVideos = [
    'https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4', // Tech network
    'https://videos.pexels.com/video-files/5532766/5532766-uhd_2560_1440_25fps.mp4', // Dark particles
    'https://videos.pexels.com/video-files/3129953/3129953-uhd_2560_1440_30fps.mp4', // Digital tunnel
  ];

  const stats = [
    { value: '500+', label: 'Projects Completed', icon: Briefcase },
    { value: '98%', label: 'Client Satisfaction', icon: Star },
    { value: '50+', label: 'Countries Served', icon: Globe },
    { value: '10+', label: 'Years Experience', icon: Award },
  ];

  const services = [
    { name: 'Web Development', icon: Code, description: 'Custom websites & web applications' },
    { name: 'Mobile Apps', icon: Smartphone, description: 'iOS & Android development' },
    { name: 'UI/UX Design', icon: Palette, description: 'User-centered design solutions' },
    { name: 'Digital Marketing', icon: Megaphone, description: 'Grow your online presence' },
    { name: 'SEO Services', icon: Search, description: 'Rank higher in search results' },
    { name: 'E-commerce', icon: TrendingUp, description: 'Online stores that sell' },
  ];

  return (
    <section className="relative min-h-screen bg-gray-900 overflow-hidden">
      {/* Dark Tech Video Background */}
      <div className="absolute inset-0 z-0">
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => setVideoError(true)}
            className="h-full w-full object-cover opacity-40"
            style={{ 
              objectPosition: 'center',
              filter: 'brightness(0.6) contrast(1.1)'
            }}
          >
            <source src={darkTechVideos[0]} type="video/mp4" />
          </video>
        )}
        {/* Fallback dark gradient if video fails */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>
        )}
        
        {/* Dark overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-gray-900/50"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Top Info Bar */}
      <div className="relative z-10 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 py-3">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6 text-gray-400">
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Serving clients worldwide
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Secure & reliable
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact Sales
            </Link>
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Client Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className={`transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Trust Badge */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium border border-blue-500/30">
                <Award className="w-4 h-4" />
                Award-Winning Agency
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium border border-green-500/30">
                <Star className="w-4 h-4 fill-current" />
                4.9/5 Rating
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              We Build{' '}
              <span className="text-blue-500">Professional Websites</span>
              <br />That Grow Your Business
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Transform your online presence with stunning, high-performance websites designed and developed by our expert team. From concept to launch, we deliver results that matter.
            </p>

            {/* Features List */}
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {[
                'Custom Design & Development',
                'SEO Optimized',
                'Mobile Responsive',
                'Fast Loading Speed',
                'Secure & Reliable',
                '24/7 Support'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onStartAssessment()}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Your Project
                <ArrowRight className="w-5 h-5" />
              </button>
              
              <Link 
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-600 text-gray-300 text-base font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-800/50 transition-all"
              >
                View Our Work
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 mb-4">Trusted by businesses worldwide</p>
              <div className="flex items-center gap-8">
                {['Google', 'Microsoft', 'Amazon', 'Stripe'].map((brand, i) => (
                  <span key={i} className="text-xl font-bold text-gray-500 hover:text-gray-400 transition-colors">
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Image Grid */}
          <div className={`relative transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="grid grid-cols-2 gap-4">
              {/* Main Image Card */}
              <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Globe className="w-20 h-20 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 text-lg font-medium">Professional Web Solutions</p>
                  </div>
                </div>
                {/* Floating Card 1 */}
                <div className="absolute bottom-4 left-4 right-4 bg-gray-900/90 backdrop-blur rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Conversion Rate</p>
                      <p className="text-xs text-gray-400">+127% average increase</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary Card 1 */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-700">
                <div className="aspect-square bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm font-medium">Team of Experts</p>
                  </div>
                </div>
              </div>

              {/* Secondary Card 2 */}
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-700">
                <div className="aspect-square bg-gradient-to-br from-orange-900/50 to-red-900/50 flex items-center justify-center p-6">
                  <div className="text-center">
                    <Zap className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <p className="text-white/60 text-sm font-medium">Fast Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Preview Section */}
      <section className="relative z-10 py-16 md:py-20 bg-gray-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Comprehensive digital solutions tailored to your business needs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div key={index} className="group p-6 rounded-2xl border border-gray-700 hover:border-blue-500 hover:bg-gray-800/50 transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                    <Icon className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{service.name}</h3>
                  <p className="text-gray-400 text-sm">{service.description}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:gap-3 transition-all">
              View All Services <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 md:py-20 bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
