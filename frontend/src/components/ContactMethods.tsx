'use client';

import { Mail, Phone, MessageSquare, MapPin } from 'lucide-react';

const contactMethods = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: 'Email Us',
    description: 'Get a response within 24 hours',
    action: 'hello@sitemendr.com',
    link: 'mailto:hello@sitemendr.com'
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: 'Call Us',
    description: 'Mon-Fri, 9am-6pm EST',
    action: '+1 (555) 123-4567',
    link: 'tel:+15551234567'
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: 'Live Chat',
    description: 'Chat with us in real-time',
    action: 'Start Chat',
    link: '#'
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Visit Us',
    description: 'Nairobi, Kenya',
    action: 'Get Directions',
    link: '#'
  }
];

export default function ContactMethods() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
            Get In Touch
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Multiple Ways to Reach Us
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Prefer email? Want to chat? Give us a call. We\'re here to help anyway works best for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.link}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-ai-blue/30 hover:bg-white/[0.04] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-ai-blue/10 flex items-center justify-center text-ai-blue mb-4 group-hover:bg-ai-blue/20 transition-colors">
                {method.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {method.title}
              </h3>
              <p className="text-white/50 text-sm mb-3">
                {method.description}
              </p>
              <p className="text-ai-blue font-medium">
                {method.action}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
