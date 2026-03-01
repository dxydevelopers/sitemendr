'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Globe, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Cloud, 
  Building, 
  Rocket, 
  Smartphone, 
  Layout, 
  Shield, 
  Calendar, 
  Star, 
  ChevronRight 
} from 'lucide-react';
import Image from 'next/image';

interface CaseStudy {
  id: string;
  title: string;
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    description: string;
  }[];
  technologies: string[];
  image: string;
  category: 'e-commerce' | 'saas' | 'enterprise' | 'startup' | 'mobile' | 'fintech' | 'healthcare' | 'education';
  featured?: boolean;
  year: string;
  duration: string;
  teamSize: string;
}

const caseStudies: CaseStudy[] = [
  {
    id: 'ecommerce-transformation',
    title: 'E-Commerce Platform Overhaul',
    client: 'Luxe Fashion House',
    industry: 'Retail & E-commerce',
    challenge: 'Legacy system causing 40% cart abandonment and poor mobile experience',
    solution: 'Complete platform rebuild with modern frontend and scalable backend',
    results: [
      { metric: 'Conversion Rate', value: '+340%', description: 'Increased from 2.1% to 9.2%' },
      { metric: 'Page Load Speed', value: '-65%', description: 'Reduced from 5.2s to 1.8s' },
      { metric: 'Mobile Traffic', value: '+280%', description: 'Mobile conversions increased significantly' },
      { metric: 'Revenue Growth', value: '+$2.1M', description: 'Additional revenue in first 6 months' }
    ],
    technologies: ['React', 'Node.js', 'AWS', 'Stripe', 'MongoDB', 'Redis'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center',
    category: 'e-commerce',
    featured: true,
    year: '2024',
    duration: '6 months',
    teamSize: '12 developers'
  },
  {
    id: 'saas-analytics-platform',
    title: 'SaaS Analytics Dashboard',
    client: 'MetricFlow Analytics',
    industry: 'Technology & Analytics',
    challenge: 'Complex data visualization needs with real-time processing requirements',
    solution: 'Custom dashboard with D3.js, WebSocket connections, and scalable backend',
    results: [
      { metric: 'Data Processing', value: '+1000%', description: 'Handle 10x more concurrent users' },
      { metric: 'Real-time Updates', value: 'Sub-second', description: 'Live data updates in under 1 second' },
      { metric: 'User Engagement', value: '+150%', description: 'Increased dashboard interaction time' },
      { metric: 'System Uptime', value: '99.95%', description: 'Enterprise-grade reliability' }
    ],
    technologies: ['React', 'D3.js', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    image: 'https://images.unsplash.com/photo-1551288049-4d31c5442d60?w=800&h=600&fit=crop&crop=center',
    category: 'saas',
    featured: true,
    year: '2024',
    duration: '8 months',
    teamSize: '8 developers'
  },
  {
    id: 'enterprise-intranet',
    title: 'Enterprise Intranet System',
    client: 'Apex Manufacturing',
    industry: 'Manufacturing',
    challenge: 'Disconnected departments with inefficient communication and workflow bottlenecks',
    solution: 'Unified intranet with workflow automation and real-time collaboration tools',
    results: [
      { metric: 'Process Efficiency', value: '+400%', description: 'Reduced approval times by 80%' },
      { metric: 'Employee Productivity', value: '+35%', description: 'Streamlined workflows increased output' },
      { metric: 'Communication Speed', value: '+200%', description: 'Faster cross-departmental coordination' },
      { metric: 'System Integration', value: '15+', description: 'Connected all major business systems' }
    ],
    technologies: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Socket.io', 'AWS'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&crop=center',
    category: 'enterprise',
    featured: true,
    year: '2023',
    duration: '10 months',
    teamSize: '15 developers'
  },
  {
    id: 'startup-mvp',
    title: 'Startup MVP Development',
    client: 'PayFlow Technologies',
    industry: 'Fintech',
    challenge: 'Need to launch MVP quickly to secure Series A funding',
    solution: 'Rapid development using modern tech stack with focus on scalability',
    results: [
      { metric: 'Time to Market', value: '8 weeks', description: 'Launched MVP in record time' },
      { metric: 'Funding Secured', value: '$2.5M', description: 'Successfully closed Series A round' },
      { metric: 'User Growth', value: '+1000%', description: 'Exponential user growth post-launch' },
      { metric: 'System Scalability', value: '100k+', description: 'Built to handle massive scale' }
    ],
    technologies: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Vercel', 'Stripe'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop&crop=center',
    category: 'startup',
    featured: true,
    year: '2024',
    duration: '2 months',
    teamSize: '6 developers'
  },
  {
    id: 'mobile-banking-app',
    title: 'Mobile Banking Application',
    client: 'First National Bank',
    industry: 'Banking & Finance',
    challenge: 'Outdated mobile app with poor UX and security vulnerabilities',
    solution: 'Complete mobile app redesign with React Native and enhanced security',
    results: [
      { metric: 'App Store Rating', value: '4.8???', description: 'Increased from 3.2 to 4.8 stars' },
      { metric: 'Daily Active Users', value: '+180%', description: 'Significant increase in engagement' },
      { metric: 'Transaction Volume', value: '+250%', description: 'More transactions per user' },
      { metric: 'Security Incidents', value: '0', description: 'Zero security breaches post-launch' }
    ],
    technologies: ['React Native', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Biometric Auth'],
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop&crop=center',
    category: 'fintech',
    year: '2024',
    duration: '9 months',
    teamSize: '10 developers'
  },
  {
    id: 'healthcare-portal',
    title: 'Healthcare Patient Portal',
    client: 'Cascade Medical Group',
    industry: 'Healthcare',
    challenge: 'Fragmented patient data and poor communication between providers',
    solution: 'HIPAA-compliant portal with unified patient records and telemedicine',
    results: [
      { metric: 'Patient Satisfaction', value: '+85%', description: 'Improved patient experience scores' },
      { metric: 'Appointment No-Shows', value: '-45%', description: 'Reduced missed appointments' },
      { metric: 'Provider Efficiency', value: '+60%', description: 'Faster patient data access' },
      { metric: 'Telemedicine Usage', value: '+300%', description: 'Increased virtual consultations' }
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Twilio', 'Video SDK'],
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop&crop=center',
    category: 'healthcare',
    year: '2023',
    duration: '12 months',
    teamSize: '14 developers'
  },
  {
    id: 'education-platform',
    title: 'Online Learning Platform',
    client: 'SkillForge Academy',
    industry: 'Education Technology',
    challenge: 'Scalable LMS needed for 100k+ students with interactive features',
    solution: 'Modern learning platform with real-time collaboration and AI-powered recommendations',
    results: [
      { metric: 'Student Enrollment', value: '+500%', description: 'Massive growth in user base' },
      { metric: 'Course Completion', value: '+75%', description: 'Improved completion rates' },
      { metric: 'Student Engagement', value: '+200%', description: 'Higher interaction levels' },
      { metric: 'Platform Uptime', value: '99.99%', description: 'Near-perfect reliability' }
    ],
    technologies: ['React', 'Node.js', 'MongoDB', 'Redis', 'WebRTC', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&h=600&fit=crop&crop=center',
    category: 'education',
    year: '2024',
    duration: '14 months',
    teamSize: '18 developers'
  },
  {
    id: 'food-delivery-app',
    title: 'Food Delivery Platform',
    client: 'TasteTown Kitchen',
    industry: 'Food & Beverage',
    challenge: 'Need for real-time tracking and efficient dispatch system',
    solution: 'End-to-end delivery platform with real-time GPS tracking and smart routing',
    results: [
      { metric: 'Delivery Time', value: '-40%', description: 'Faster average delivery times' },
      { metric: 'Order Volume', value: '+350%', description: 'Increased orders processed' },
      { metric: 'Driver Efficiency', value: '+80%', description: 'Optimized route planning' },
      { metric: 'Customer Retention', value: '+65%', description: 'Higher repeat customer rate' }
    ],
    technologies: ['React Native', 'Node.js', 'PostgreSQL', 'Google Maps API', 'Socket.io', 'AWS'],
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop&crop=center',
    category: 'mobile',
    year: '2024',
    duration: '7 months',
    teamSize: '11 developers'
  },
  {
    id: 'real-estate-platform',
    title: 'Real Estate Marketplace',
    client: 'PropertyHub Inc',
    industry: 'Real Estate',
    challenge: 'Outdated listing platform with poor search and virtual tour capabilities',
    solution: 'Modern marketplace with 3D virtual tours and AI-powered property matching',
    results: [
      { metric: 'Listing Views', value: '+400%', description: 'Increased property engagement' },
      { metric: 'Lead Generation', value: '+280%', description: 'More qualified leads' },
      { metric: 'Time to Close', value: '-35%', description: 'Faster deal closures' },
      { metric: 'User Satisfaction', value: '4.7???', description: 'Excellent user ratings' }
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Three.js', 'AWS', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=center',
    category: 'saas',
    year: '2023',
    duration: '11 months',
    teamSize: '13 developers'
  },
  {
    id: 'social-media-dashboard',
    title: 'Social Media Management Suite',
    client: 'SocialBoost Agency',
    industry: 'Marketing & Social Media',
    challenge: 'Managing multiple client accounts across platforms efficiently',
    solution: 'Unified dashboard with scheduling, analytics, and AI content suggestions',
    results: [
      { metric: 'Client Accounts', value: '500+', description: 'Managing hundreds of accounts' },
      { metric: 'Content Efficiency', value: '+300%', description: 'Faster content creation' },
      { metric: 'Engagement Rate', value: '+150%', description: 'Improved client results' },
      { metric: 'Time Saved', value: '20hrs/week', description: 'Per client on average' }
    ],
    technologies: ['React', 'Node.js', 'MongoDB', 'Redis', 'Social APIs', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop&crop=center',
    category: 'saas',
    year: '2024',
    duration: '8 months',
    teamSize: '9 developers'
  },
  {
    id: 'iot-dashboard',
    title: 'IoT Monitoring Platform',
    client: 'SmartTech Industries',
    industry: 'Industrial IoT',
    challenge: 'Real-time monitoring of thousands of sensors across multiple facilities',
    solution: 'Scalable IoT platform with real-time alerts and predictive analytics',
    results: [
      { metric: 'Sensors Monitored', value: '50k+', description: 'Massive scale deployment' },
      { metric: 'Alert Response', value: '-70%', description: 'Faster incident response' },
      { metric: 'Predictive Accuracy', value: '92%', description: 'AI-powered predictions' },
      { metric: 'Downtime Reduced', value: '-85%', description: 'Significant operational improvement' }
    ],
    technologies: ['React', 'Node.js', 'InfluxDB', 'MQTT', 'AWS IoT', 'Machine Learning'],
    image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=800&h=600&fit=crop&crop=center',
    category: 'enterprise',
    year: '2024',
    duration: '16 months',
    teamSize: '20 developers'
  },
  {
    id: 'travel-booking-platform',
    title: 'Travel Booking Engine',
    client: 'Wanderlust Travels',
    industry: 'Travel & Hospitality',
    challenge: 'Complex booking system with multiple integrations and dynamic pricing',
    solution: 'Modern booking platform with real-time inventory and personalized recommendations',
    results: [
      { metric: 'Booking Conversion', value: '+220%', description: 'Higher conversion rates' },
      { metric: 'Revenue per User', value: '+180%', description: 'Increased average booking value' },
      { metric: 'User Retention', value: '+140%', description: 'More repeat bookings' },
      { metric: 'Search Performance', value: '+400%', description: 'Faster search results' }
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Travel APIs', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop&crop=center',
    category: 'e-commerce',
    year: '2024',
    duration: '10 months',
    teamSize: '12 developers'
  },
  {
    id: 'fitness-tracking-app',
    title: 'Fitness & Wellness App',
    client: 'FitLife Pro',
    industry: 'Health & Fitness',
    challenge: 'Comprehensive fitness tracking with personalized workout plans',
    solution: 'Mobile app with AI-powered coaching and social features',
    results: [
      { metric: 'Active Users', value: '+450%', description: 'Massive user growth' },
      { metric: 'Workout Completion', value: '+85%', description: 'Higher adherence rates' },
      { metric: 'User Engagement', value: '+200%', description: 'Daily active users increased' },
      { metric: 'App Store Rating', value: '4.9???', description: 'Top-rated in category' }
    ],
    technologies: ['React Native', 'TypeScript', 'Node.js', 'MongoDB', 'HealthKit', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&crop=center',
    category: 'mobile',
    year: '2024',
    duration: '9 months',
    teamSize: '8 developers'
  },
  {
    id: 'crm-system',
    title: 'Enterprise CRM Solution',
    client: 'Velocity Sales',
    industry: 'Business Software',
    challenge: 'Fragmented customer data across multiple systems',
    solution: 'Unified CRM with automation, analytics, and AI insights',
    results: [
      { metric: 'Sales Productivity', value: '+65%', description: 'More deals closed per rep' },
      { metric: 'Data Accuracy', value: '+95%', description: 'Cleaner customer data' },
      { metric: 'Customer Satisfaction', value: '+80%', description: 'Improved CSAT scores' },
      { metric: 'Revenue Growth', value: '+45%', description: 'Direct impact on bottom line' }
    ],
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Elasticsearch', 'AWS', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center',
    category: 'enterprise',
    year: '2023',
    duration: '18 months',
    teamSize: '22 developers'
  },
  {
    id: 'video-streaming-platform',
    title: 'Video Streaming Service',
    client: 'StreamMax Entertainment',
    industry: 'Media & Entertainment',
    challenge: 'High-quality video streaming with adaptive bitrate and global CDN',
    solution: 'Scalable streaming platform with personalized content recommendations',
    results: [
      { metric: 'Concurrent Viewers', value: '1M+', description: 'Peak concurrent streams' },
      { metric: 'Buffer Rate', value: '<1%', description: 'Excellent streaming quality' },
      { metric: 'Watch Time', value: '+180%', description: 'Increased user engagement' },
      { metric: 'Content Discovery', value: '+250%', description: 'More content found by users' }
    ],
    technologies: ['React', 'Node.js', 'AWS', 'CloudFront', 'HLS', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=600&fit=crop&crop=center',
    category: 'saas',
    year: '2024',
    duration: '14 months',
    teamSize: '16 developers'
  },
  {
    id: 'logistics-management',
    title: 'Logistics & Supply Chain',
    client: 'Global Logistics Co',
    industry: 'Logistics & Transportation',
    challenge: 'Complex supply chain tracking across multiple carriers and regions',
    solution: 'End-to-end logistics platform with real-time tracking and optimization',
    results: [
      { metric: 'Delivery Accuracy', value: '99.5%', description: 'Near-perfect delivery rate' },
      { metric: 'Cost Reduction', value: '-35%', description: 'Significant operational savings' },
      { metric: 'Tracking Visibility', value: '100%', description: 'Complete shipment visibility' },
      { metric: 'Customer Satisfaction', value: '+90%', description: 'Improved client experience' }
    ],
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'GraphQL', 'AWS', 'AI/ML'],
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=600&fit=crop&crop=center',
    category: 'enterprise',
    year: '2024',
    duration: '12 months',
    teamSize: '14 developers'
  }
];

const categories = [
  { id: 'all', label: 'All Projects', icon: <Globe className="w-4 h-4" /> },
  { id: 'e-commerce', label: 'E-commerce', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'saas', label: 'SaaS', icon: <Cloud className="w-4 h-4" /> },
  { id: 'enterprise', label: 'Enterprise', icon: <Building className="w-4 h-4" /> },
  { id: 'startup', label: 'Startup', icon: <Rocket className="w-4 h-4" /> },
  { id: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'fintech', label: 'FinTech', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'healthcare', label: 'Healthcare', icon: <Shield className="w-4 h-4" /> },
  { id: 'education', label: 'Education', icon: <Layout className="w-4 h-4" /> }
];

export default function CaseStudies() {
  const showCaseStudies = process.env.NEXT_PUBLIC_SHOW_CASE_STUDIES === 'true';
  if (!showCaseStudies) {
    return null;
  }
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedStudy, setExpandedStudy] = useState<string | null>(null);

  const filteredStudies = caseStudies.filter(study => 
    selectedCategory === 'all' || study.category === selectedCategory
  );

  const featuredStudies = filteredStudies.filter(study => study.featured);
  const regularStudies = filteredStudies.filter(study => !study.featured);

  return (
    <section className="relative py-32 bg-gradient-to-b from-black via-[#0a0a0f] to-black">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ai-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-tech-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-ai-blue/5 border border-ai-blue/20 mb-8">
            <Sparkles className="w-4 h-4 text-ai-blue" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Portfolio Showcase</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase leading-none">
            Our <span className="bg-gradient-to-r from-ai-blue via-tech-purple to-pink-500 bg-clip-text text-transparent italic">Work</span>
          </h2>
          <p className="text-xl text-white/50 max-w-3xl mx-auto font-light leading-relaxed">
            Explore our portfolio of 16+ successful projects across various industries. 
            Each project represents our commitment to excellence and innovation.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group relative px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-ai-blue to-tech-purple text-white shadow-[0_0_30px_rgba(0,102,255,0.3)]'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="flex items-center gap-2">
                {category.icon}
                {category.label}
              </span>
              {selectedCategory === category.id && (
                <div className="absolute -inset-1 bg-gradient-to-r from-ai-blue to-tech-purple rounded-full blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
              )}
            </button>
          ))}
        </div>

        {/* Featured Projects */}
        {selectedCategory === 'all' && featuredStudies.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ai-blue/50 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-ai-blue/10 border border-ai-blue/20 rounded-full">
                <Star className="w-4 h-4 text-ai-blue fill-ai-blue" />
                <span className="text-xs font-bold text-ai-blue uppercase tracking-widest">Featured Projects</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-ai-blue/50 to-transparent"></div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {featuredStudies.map((study) => (
                <div
                  key={study.id}
                  className="group relative bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden hover:border-ai-blue/40 transition-all duration-500"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={study.image}
                      alt={study.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-ai-blue/90 backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                        {study.category}
                      </span>
                    </div>

                    {/* Featured Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-gradient-to-r from-ai-blue to-tech-purple rounded-full text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Featured
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-white/40" />
                      <span className="text-xs text-white/40 uppercase tracking-widest">{study.year}</span>
                      <span className="text-white/20">???</span>
                      <Users className="w-4 h-4 text-white/40" />
                      <span className="text-xs text-white/40 uppercase tracking-widest">{study.teamSize}</span>
                    </div>

                    <h3 className="text-2xl font-black mb-2 tracking-tighter uppercase leading-none text-white">
                      {study.title}
                    </h3>
                    <p className="text-white/40 font-mono text-sm uppercase tracking-widest mb-4">{study.client}</p>

                    <p className="text-white/60 text-sm leading-relaxed mb-6 line-clamp-2">
                      {study.challenge}
                    </p>

                    {/* Results Preview */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {study.results.slice(0, 2).map((result, i) => (
                        <div key={i} className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                          <div className="text-lg font-black text-ai-blue">{result.value}</div>
                          <div className="text-[10px] text-white/40 uppercase tracking-widest">{result.metric}</div>
                        </div>
                      ))}
                    </div>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {study.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 uppercase tracking-widest"
                        >
                          {tech}
                        </span>
                      ))}
                      {study.technologies.length > 4 && (
                        <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          +{study.technologies.length - 4}
                        </span>
                      )}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => setExpandedStudy(expandedStudy === study.id ? null : study.id)}
                      className="w-full group/btn flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-ai-blue to-tech-purple text-white font-bold rounded-xl hover:scale-[1.02] transition-all"
                    >
                      <span className="uppercase tracking-widest text-xs">
                        {expandedStudy === study.id ? 'Hide Details' : 'View Case Study'}
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedStudy === study.id ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded Details */}
                    {expandedStudy === study.id && (
                      <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Challenge</h4>
                            <p className="text-white/60 text-sm leading-relaxed">{study.challenge}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Solution</h4>
                                <p className="text-white/60 text-sm leading-relaxed">{study.solution}</p>
                          </div>
                        </div>
                        <div className="mt-6">
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-3">Results</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {study.results.map((result, i) => (
                              <div key={i} className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                                <div className="text-lg font-black text-ai-blue">{result.value}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-widest">{result.metric}</div>
                                <div className="text-[10px] text-white/30 mt-1">{result.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Projects Grid */}
        <div>
          {selectedCategory !== 'all' && (
            <div className="flex items-center gap-4 mb-8">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-tech-purple/50 to-transparent"></div>
              <div className="flex items-center gap-2 px-4 py-2 bg-tech-purple/10 border border-tech-purple/20 rounded-full">
                <span className="text-xs font-bold text-tech-purple uppercase tracking-widest">
                  {categories.find(c => c.id === selectedCategory)?.label} Projects
                </span>
                <span className="px-2 py-0.5 bg-tech-purple/20 rounded-full text-[10px] font-bold text-tech-purple">
                  {filteredStudies.length}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-tech-purple/50 to-transparent"></div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularStudies.map((study) => (
              <div
                key={study.id}
                className="group relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden hover:border-ai-blue/40 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={study.image}
                    alt={study.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 bg-ai-blue/90 backdrop-blur-sm rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
                      {study.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">{study.year}</span>
                  </div>

                  <h3 className="text-lg font-black mb-1 tracking-tighter uppercase leading-none text-white">
                    {study.title}
                  </h3>
                  <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mb-3">{study.client}</p>

                  <p className="text-white/60 text-xs leading-relaxed mb-4 line-clamp-2">
                    {study.challenge}
                  </p>

                  {/* Key Result */}
                  <div className="p-3 bg-gradient-to-br from-ai-blue/10 to-tech-purple/10 border border-white/10 rounded-xl mb-4">
                    <div className="text-xl font-black text-ai-blue">{study.results[0].value}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-widest">{study.results[0].metric}</div>
                  </div>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {study.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 uppercase tracking-widest"
                      >
                        {tech}
                      </span>
                    ))}
                    {study.technologies.length > 3 && (
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 uppercase tracking-widest">
                        +{study.technologies.length - 3}
                      </span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setExpandedStudy(expandedStudy === study.id ? null : study.id)}
                    className="w-full group/btn flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-ai-blue hover:border-ai-blue transition-all"
                  >
                    <span className="uppercase tracking-widest text-[10px]">
                      {expandedStudy === study.id ? 'Hide Details' : 'View Details'}
                    </span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${expandedStudy === study.id ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Details */}
                  {expandedStudy === study.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Challenge</h4>
                          <p className="text-white/60 text-xs leading-relaxed">{study.challenge}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Solution</h4>
                          <p className="text-white/60 text-xs leading-relaxed">{study.solution}</p>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Results</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {study.results.map((result, i) => (
                              <div key={i} className="p-2 bg-white/[0.03] border border-white/10 rounded-lg">
                                <div className="text-sm font-black text-ai-blue">{result.value}</div>
                                <div className="text-[9px] text-white/40 uppercase tracking-widest">{result.metric}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="text-4xl font-black text-ai-blue mb-2">16+</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Projects Delivered</div>
          </div>
          <div className="text-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="text-4xl font-black text-tech-purple mb-2">8</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Industries Served</div>
          </div>
          <div className="text-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="text-4xl font-black text-pink-500 mb-2">98%</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Client Satisfaction</div>
          </div>
          <div className="text-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="text-4xl font-black text-expert-green mb-2">50+</div>
            <div className="text-xs text-white/40 uppercase tracking-widest">Technologies Used</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </section>
  );
}

