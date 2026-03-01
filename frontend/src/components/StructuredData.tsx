'use client';

import Script from 'next/script';

/**
 * Organization structured data for SEO
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sitemendr',
    url: 'https://sitemendr.com',
    logo: 'https://sitemendr.com/logo.png',
    description: 'High-performance web development and digital infrastructure solutions. We build resilient digital ecosystems for modern businesses.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
      addressLocality: 'Nairobi',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-790-057-596',
      contactType: 'customer service',
      email: 'support@sitemendr.com',
      availableLanguage: ['English', 'Swahili'],
    },
    sameAs: [
      'https://facebook.com/sitemendr',
      'https://linkedin.com/company/sitemendr',
      'https://instagram.com/sitemendr',
      'https://twitter.com/sitemendr',
      'https://youtube.com/@sitemendr',
    ],
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    serviceType: [
      'Web Development',
      'E-commerce Solutions',
      'AI Solutions',
      'Digital Marketing',
    ],
  };

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite structured data with search action
 */
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sitemendr',
    url: 'https://sitemendr.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://sitemendr.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * LocalBusiness schema for local SEO
 */
export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://sitemendr.com/#organization',
    name: 'Sitemendr Technologies',
    image: 'https://sitemendr.com/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nairobi',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-1.2921',
      longitude: '36.8219',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    priceRange: '$$',
  };

  return (
    <Script
      id="local-business-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Service schema for SEO
 */
export function ServiceSchema({ name, description, price }: { name: string; description: string; price?: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'Organization',
      name: 'Sitemendr',
      url: 'https://sitemendr.com',
    },
    areaServed: 'Worldwide',
    ...(price && { offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'USD',
    }}),
  };

  return (
    <Script
      id={`service-${name}-schema`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQ schema for rich snippets
 */
export function FAQSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default {
  OrganizationSchema,
  WebSiteSchema,
  LocalBusinessSchema,
  ServiceSchema,
  FAQSchema,
};
