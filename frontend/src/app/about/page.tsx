'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  Code2,
  CreditCard,
  Database,
  Eye,
  FileText,
  Globe,
  Heart,
  KeyRound,
  Layers2,
  LayoutDashboard,
  Lock,
  MapPin,
  MessageSquareText,
  MonitorCheck,
  Puzzle,
  Quote,
  Rocket,
  Server,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Star,
  Target,
  Terminal,
  UploadCloud,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';

const stats = [
  { value: '4', label: 'Service paths', icon: <Layers2 className="h-5 w-5" />, note: 'Build, repair, maintain, grow' },
  { value: '1', label: 'Client workspace', icon: <MessageSquareText className="h-5 w-5" />, note: 'Project memory kept together' },
  { value: '24h', label: 'First review aim', icon: <Clock className="h-5 w-5" />, note: 'Clear next step after request' },
];

const tabs = [
  { id: 0, label: 'Mission', icon: <Target className="h-5 w-5" /> },
  { id: 1, label: 'Vision', icon: <Eye className="h-5 w-5" /> },
  { id: 2, label: 'Values', icon: <Heart className="h-5 w-5" /> },
];

const tabContent = [
  {
    title: 'Our mission',
    content:
      'Sitemendr exists to make digital work easier to understand, easier to approve, and easier to support after launch. We help businesses move from scattered requests to a clear service path.',
    points: [
      'Build websites, platforms, dashboards, and business systems with clear purpose.',
      'Repair damaged or unfinished digital work without guessing through the problem.',
      'Keep support, files, billing, and progress connected inside the workspace.',
      'Leave clients with ownership, context, and a practical next step.',
    ],
  },
  {
    title: 'Our vision',
    content:
      'The company is being shaped as a calm operating layer for web work: a place where service requests, approvals, delivery, maintenance, and support remain connected.',
    points: [
      'Make professional digital delivery accessible without making it feel vague.',
      'Give every project a visible record from first request to handoff.',
      'Help businesses keep their online systems healthy after launch.',
      'Turn commerce, maintenance, repair, and development into clear paths.',
    ],
  },
  {
    title: 'Our values',
    content:
      'We value clarity, privacy, practical design, careful repair, and honest delivery. The work should feel organized before it feels impressive.',
    points: [
      'Clarity before complexity.',
      'Private records over scattered communication.',
      'Useful proof over decorative promises.',
      'Careful diagnosis before technical change.',
    ],
  },
];

const features = [
  {
    icon: <Workflow className="h-8 w-8" />,
    title: 'Guided service routing',
    desc: 'Clients are not pushed into one generic form. The request is routed through build, repair, maintenance, or commerce.',
    tone: 'text-ai-blue',
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Private workspace model',
    desc: 'Project messages, approvals, files, billing context, and support history stay close to the work.',
    tone: 'text-expert-green',
  },
  {
    icon: <Wrench className="h-8 w-8" />,
    title: 'Repair with diagnosis',
    desc: 'Existing websites and systems are reviewed before they are changed, especially when the setup is fragile.',
    tone: 'text-tech-purple',
  },
  {
    icon: <Layers2 className="h-8 w-8" />,
    title: 'Structured handoff',
    desc: 'A finished project should leave access, context, documentation, and a sensible maintenance path.',
    tone: 'text-amber-300',
  },
  {
    icon: <Puzzle className="h-8 w-8" />,
    title: 'Business-first planning',
    desc: 'The system is shaped around how the business explains itself, sells, operates, and supports customers.',
    tone: 'text-ai-blue',
  },
  {
    icon: <Activity className="h-8 w-8" />,
    title: 'Ongoing care',
    desc: 'Maintenance is treated as part of digital ownership, not a small note after the launch is finished.',
    tone: 'text-expert-green',
  },
];

const timeline = [
  {
    year: '01',
    title: 'Request',
    desc: 'The client opens a workspace or starts a conversation with the team.',
    icon: <Terminal className="h-5 w-5" />,
    tone: 'text-ai-blue',
  },
  {
    year: '02',
    title: 'Path',
    desc: 'The work is shaped as a build, repair, maintenance, or commerce request.',
    icon: <Target className="h-5 w-5" />,
    tone: 'text-expert-green',
  },
  {
    year: '03',
    title: 'Approval',
    desc: 'Scope, price, payment, and delivery expectations are made visible.',
    icon: <BadgeCheck className="h-5 w-5" />,
    tone: 'text-tech-purple',
  },
  {
    year: '04',
    title: 'Delivery',
    desc: 'Progress, messages, files, and decisions stay connected to the project.',
    icon: <Code2 className="h-5 w-5" />,
    tone: 'text-amber-300',
  },
  {
    year: '05',
    title: 'Handoff',
    desc: 'The work is handed over with access, context, and ownership in mind.',
    icon: <Award className="h-5 w-5" />,
    tone: 'text-ai-blue',
  },
  {
    year: '06',
    title: 'Support',
    desc: 'Support and maintenance continue from the record already created.',
    icon: <ShieldCheck className="h-5 w-5" />,
    tone: 'text-expert-green',
  },
];

const principles = [
  {
    icon: <Eye className="h-6 w-6" />,
    title: 'Clear explanation',
    desc: 'A client should understand what is being done, why it matters, and what comes next.',
    stat: '01',
    tone: 'text-ai-blue',
  },
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Private records',
    desc: 'The workspace protects project context from being lost across different channels.',
    stat: '02',
    tone: 'text-expert-green',
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Purposeful scope',
    desc: 'The work is shaped around real business use, not around a list of features for its own sake.',
    stat: '03',
    tone: 'text-tech-purple',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Practical momentum',
    desc: 'Speed matters, but the project must still be understandable when it is reviewed later.',
    stat: '04',
    tone: 'text-amber-300',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Remote-ready delivery',
    desc: 'The workflow is built for clients who need clear progress without sitting in the same room.',
    stat: '05',
    tone: 'text-ai-blue',
  },
  {
    icon: <Code2 className="h-6 w-6" />,
    title: 'Clean ownership',
    desc: 'The end of a project should create confidence, not dependence on hidden knowledge.',
    stat: '06',
    tone: 'text-expert-green',
  },
];

const team = [
  {
    name: 'Strategy',
    role: 'Discovery and direction',
    desc: 'Clarifies the business situation before the technical route is chosen.',
    icon: <Target className="h-8 w-8" />,
    count: 'Plan',
    tone: 'text-ai-blue',
  },
  {
    name: 'Development',
    role: 'Build and integration',
    desc: 'Creates websites, portals, dashboards, and custom systems around the agreed scope.',
    icon: <Code2 className="h-8 w-8" />,
    count: 'Build',
    tone: 'text-expert-green',
  },
  {
    name: 'Care',
    role: 'Repair and maintenance',
    desc: 'Handles diagnosis, updates, monitoring, recovery, and support after launch.',
    icon: <Wrench className="h-8 w-8" />,
    count: 'Care',
    tone: 'text-tech-purple',
  },
  {
    name: 'Workspace',
    role: 'Client operations',
    desc: 'Keeps approvals, support, files, billing, and progress connected.',
    icon: <Database className="h-8 w-8" />,
    count: 'Track',
    tone: 'text-amber-300',
  },
];

const technologies = [
  { name: 'Next.js', category: 'Frontend', icon: <Code2 className="h-5 w-5" />, tone: 'text-ai-blue' },
  { name: 'TypeScript', category: 'Language', icon: <FileText className="h-5 w-5" />, tone: 'text-expert-green' },
  { name: 'Node APIs', category: 'Backend', icon: <Server className="h-5 w-5" />, tone: 'text-tech-purple' },
  { name: 'PostgreSQL', category: 'Data', icon: <Database className="h-5 w-5" />, tone: 'text-amber-300' },
  { name: 'Payments', category: 'Billing', icon: <CreditCard className="h-5 w-5" />, tone: 'text-ai-blue' },
  { name: 'Dashboards', category: 'Workspace', icon: <LayoutDashboard className="h-5 w-5" />, tone: 'text-expert-green' },
  { name: 'Auth flows', category: 'Security', icon: <KeyRound className="h-5 w-5" />, tone: 'text-tech-purple' },
  { name: 'Monitoring', category: 'Care', icon: <MonitorCheck className="h-5 w-5" />, tone: 'text-amber-300' },
  { name: 'Commerce', category: 'Stores', icon: <ShoppingBag className="h-5 w-5" />, tone: 'text-ai-blue' },
  { name: 'Deployment', category: 'Hosting', icon: <UploadCloud className="h-5 w-5" />, tone: 'text-expert-green' },
  { name: 'Support tools', category: 'Client care', icon: <MessageSquareText className="h-5 w-5" />, tone: 'text-tech-purple' },
  { name: 'Content systems', category: 'Publishing', icon: <Layers2 className="h-5 w-5" />, tone: 'text-amber-300' },
];

const testimonials = [
  {
    name: 'Business owner',
    role: 'Website repair client',
    content:
      'The value was not only that the issue was fixed. The value was understanding what had gone wrong and what needed to happen next.',
    rating: 5,
    avatar: 'BO',
  },
  {
    name: 'Store founder',
    role: 'Commerce setup',
    content:
      'The store finally felt organized. Products, checkout, delivery notes, and support were no longer treated like separate problems.',
    rating: 5,
    avatar: 'SF',
  },
  {
    name: 'Operations lead',
    role: 'Workspace delivery',
    content:
      'Having files, messages, approvals, and payments connected made the project easier to follow than a normal agency handoff.',
    rating: 5,
    avatar: 'OL',
  },
];

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070a] pb-20 pt-24 text-white">
      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-white/8">
        <div className="h-full bg-ai-blue transition-all duration-300" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '34px 34px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 md:px-10">
        <section className={`mb-24 text-center transition duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="inline-flex items-center gap-3 border-b border-ai-blue/40 px-1 pb-3">
            <Terminal className="h-4 w-4 text-ai-blue" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue">
              Sitemendr company system
            </span>
          </div>

          <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-black leading-[0.96] tracking-tight md:text-7xl lg:text-8xl">
            Digital work,
            <br />
            <span className="text-white/54">made traceable.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-base leading-8 text-white/62 md:text-xl">
            Sitemendr builds, repairs, maintains, and prepares digital systems for businesses that need the work to stay clear from the first request to the support that follows.
          </p>

          <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-[190px] border-t border-white/10 pt-5 text-center">
                <div className="flex items-center justify-center gap-2 text-ai-blue">
                  {stat.icon}
                  <span className="text-4xl font-black text-white">{stat.value}</span>
                </div>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/44">{stat.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/46">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24 border-y border-white/10 py-12 md:py-16">
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[46px] items-center gap-3 px-5 text-xs font-black uppercase tracking-[0.16em] transition ${
                  activeTab === tab.id ? 'bg-white text-black' : 'text-white/56 ring-1 ring-white/10 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue">Company position</p>
              <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">{tabContent[activeTab].title}</h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-white/64">{tabContent[activeTab].content}</p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {tabContent[activeTab].points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-expert-green" />
                    <span className="text-sm leading-7 text-white/72">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-24 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&h=1200&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover object-[50%_42%]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.82),rgba(5,7,10,0.08))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center bg-white text-black">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue">Operating idea</p>
                    <h3 className="mt-1 text-2xl font-black tracking-tight">Workspace-first delivery</h3>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/58">
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Nairobi, Kenya
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Remote-ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-tech-purple">Our thesis</p>
            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight md:text-6xl">
              From a request to a record the client can understand.
            </h2>
            <p className="mt-7 text-lg leading-8 text-white/62">
              The old About direction worked because it felt like a visual explanation of the company. This page keeps that approach: each section should help the visitor understand how Sitemendr receives work, organizes it, proves progress, and supports it later.
            </p>
            <p className="mt-5 text-lg leading-8 text-white/62">
              The modernization is quieter: less noise, cleaner contrast, stronger photos, and language that sounds like a serious company rather than a loud technology demo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <AboutButton href="/services" tone="light">
                Explore services
              </AboutButton>
              <AboutButton href="/workspace">
                View workspace
              </AboutButton>
            </div>
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            eyebrow="Why choose us"
            title="Built for the parts of digital work that usually become messy."
            copy="The company needs to explain more than design and development. It needs to show the system around the work."
          />
          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="group border-t border-white/10 pt-7">
                <div className={feature.tone}>{feature.icon}</div>
                <h3 className="mt-8 text-xl font-black tracking-tight text-white">{feature.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{feature.desc}</p>
                <ArrowUpRight className="mt-8 h-5 w-5 text-white/20 transition group-hover:text-white/62" />
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            title="The journey is visible before the client commits deeper."
            copy="This keeps the old step-by-step feeling, but makes the steps more specific to the new Sitemendr."
          />
          <div className="relative mt-14">
            <div className="absolute bottom-0 left-1/2 top-0 hidden w-px bg-white/10 md:block" />
            <div className="space-y-10">
              {timeline.map((item, index) => (
                <div key={item.title} className={`relative grid gap-6 md:grid-cols-2 ${index % 2 === 0 ? '' : 'md:[&>*:first-child]:col-start-2'}`}>
                  <div className={`${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="border-t border-white/10 pt-6">
                      <div className={`mb-5 inline-flex items-center gap-3 ${index % 2 === 0 ? 'md:ml-auto' : ''}`}>
                        <span className={item.tone}>{item.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/64">{item.year}</span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-white/56">{item.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 bg-ai-blue ring-4 ring-[#05070a] md:block" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            eyebrow="Core principles"
            title="What the company stands for."
            copy="The icons and compact proof points stay, but the claims are grounded in how Sitemendr actually works."
          />
          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => (
              <div key={principle.title} className="border-t border-white/10 pt-7">
                <div className="flex items-center justify-between">
                  <div className={principle.tone}>{principle.icon}</div>
                  <span className="text-4xl font-black tracking-tight text-white/12">{principle.stat}</span>
                </div>
                <h3 className="mt-8 text-xl font-black tracking-tight">{principle.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/58">{principle.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24 grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div className="relative min-h-[520px] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1600&h=1700&fit=crop&crop=center"
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover object-[50%_44%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,7,10,0.78),rgba(5,7,10,0.08))]" />
          </div>
          <div>
            <SectionIntro
              eyebrow="Working groups"
              title="The team is presented by responsibility, not noise."
              copy="This keeps the original team section feeling while making it more truthful and useful for the company page."
              align="left"
            />
            <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {team.map((member) => (
                <div key={member.name} className="border-l border-white/10 pl-6">
                  <div className={member.tone}>{member.icon}</div>
                  <div className="mt-8 text-3xl font-black tracking-tight">{member.count}</div>
                  <h3 className="mt-2 text-lg font-black">{member.name}</h3>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/38">{member.role}</p>
                  <p className="mt-4 text-sm leading-7 text-white/56">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            title="The stack exists to support the service, not to decorate the page."
            copy="This keeps the older technology-grid idea but makes it cleaner and more connected to the actual Sitemendr offering."
          />
          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 lg:grid-cols-4">
            {technologies.map((tech) => (
              <div key={tech.name} className="border-b border-white/10 pb-5 transition hover:border-ai-blue/40">
                <div className={tech.tone}>{tech.icon}</div>
                <p className="mt-5 text-sm font-black text-white">{tech.name}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/36">{tech.category}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <SectionIntro
            eyebrow="Client voices"
            title="The proof should sound like outcomes, not exaggerated praise."
            copy="These are framed as service-context examples until real case studies are formalized."
          />
          <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="relative border-t border-white/10 pt-7">
                <Quote className="absolute right-0 top-7 h-8 w-8 text-white/10" />
                <div className="mb-6 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-amber-300 text-amber-300" />
                  ))}
                </div>
                <p className="text-sm leading-7 text-white/68">&quot;{testimonial.content}&quot;</p>
                <div className="mt-7 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center bg-white text-sm font-black text-black">{testimonial.avatar}</div>
                  <div>
                    <p className="text-sm font-black">{testimonial.name}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/38">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16 overflow-hidden border-y border-white/10">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.82fr]">
            <div className="p-8 md:p-12 lg:p-16">
              <Rocket className="h-10 w-10 text-ai-blue" />
              <h2 className="mt-8 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Ready to place the work inside a clear system?
              </h2>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
                Start with a service path, open a workspace, or speak with the team before a project begins.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <AboutButton href="/contact?intent=sales" tone="light">
                  Speak with the team
                </AboutButton>
                <AboutButton href="/services">
                  Explore services
                </AboutButton>
              </div>
            </div>
            <div className="relative min-h-[420px]">
              <Image
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1500&h=1400&fit=crop&crop=center"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
  align = 'center',
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.24em] text-ai-blue">{eyebrow}</p> : null}
      <h2 className={eyebrow ? 'mt-5 text-4xl font-black leading-tight tracking-tight md:text-5xl' : 'text-4xl font-black leading-tight tracking-tight md:text-5xl'}>{title}</h2>
      <p className="mt-5 text-base leading-8 text-white/58">{copy}</p>
    </div>
  );
}

function AboutButton({ href, children, tone = 'dark' }: { href: string; children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[48px] items-center justify-center gap-3 px-5 py-3.5 text-center text-[11px] font-black uppercase tracking-[0.12em] transition sm:px-6 sm:py-4 sm:text-xs ${
        tone === 'light' ? 'bg-white text-black hover:bg-ai-blue hover:text-white' : 'bg-white/[0.06] text-white ring-1 ring-white/12 hover:bg-white/[0.1]'
      }`}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
