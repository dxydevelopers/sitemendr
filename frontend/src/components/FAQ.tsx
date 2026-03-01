'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How long does it take to build a website?',
    answer: 'Our Starter Website package delivers a professional site in 2-4 weeks. Custom Development projects typically take 4-8 weeks depending on complexity.'
  },
  {
    question: 'Do you offer revisions?',
    answer: 'Yes! All our packages include multiple revision rounds. We won\'t stop until you\'re completely satisfied with your website.'
  },
  {
    question: 'What happens after my website launches?',
    answer: 'We provide 30-90 days of complimentary support to ensure everything runs smoothly. You can also opt for our ongoing maintenance plans for continued updates and support.'
  },
  {
    question: 'Will my website work on mobile phones?',
    answer: 'Absolutely. All our websites are fully responsive and optimized for mobile, tablet, and desktop devices.'
  },
  {
    question: 'Do I need to provide content for my website?',
    answer: 'You can provide your own content, or we can help write professional copy. We\'ll guide you through what\'s needed.'
  },
  {
    question: 'Can you help with domain and hosting?',
    answer: 'Yes, we handle everything. We\'ll set up your domain, hosting, and ensure your site is live and accessible.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 relative">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
            Common Questions
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-white pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-white/50 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-40' : 'max-h-0'
                }`}
              >
                <p className="px-6 pb-6 text-white/60">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
