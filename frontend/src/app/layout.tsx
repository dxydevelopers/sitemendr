import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";
import QueryProvider from "@/lib/query-provider";
import { OrganizationSchema, WebSiteSchema, LocalBusinessSchema } from "@/components/StructuredData";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Sitemendr - Digital Infrastructure Solutions",
    template: "%s | Sitemendr",
  },
  description: "High-performance web development and digital infrastructure solutions. We build resilient digital ecosystems for modern businesses.",
  keywords: [
    "web development", 
    "website builder", 
    "digital solutions", 
    "Sitemendr", 
    "web development company", 
    "digital infrastructure", 
    "AI web development", 
    "e-commerce development", 
    "SaaS platforms", 
    "web design Nairobi"
  ],
  authors: [{ name: "Sitemendr Technologies" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sitemendr.com",
    title: "Sitemendr - Digital Infrastructure Solutions",
    description: "High-performance web development and digital infrastructure solutions. We build resilient digital ecosystems for modern businesses.",
    siteName: "Sitemendr",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Sitemendr - Digital Infrastructure Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sitemendr - Digital Infrastructure Solutions",
    description: "High-performance web development and digital infrastructure solutions. We build resilient digital ecosystems for modern businesses.",
    creator: "@sitemendr",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-US",
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://sitemendr.com"),
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/api/favicon/S', sizes: '32x32', type: 'image/svg+xml' }
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: {
      url: '/api/favicon/S',
      rel: 'icon',
      type: 'image/svg+xml'
    }
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-6JSC6HT7EC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){ dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', 'G-6JSC6HT7EC');
          `}
        </Script>

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
          crossOrigin="anonymous"
        />

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" title="Sitemap" href="https://sitemendr.com/sitemap.xml" />

        {/* Structured Data */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
        >
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Sitemendr",
            "url": "https://sitemendr.com",
            "description": "Sitemendr builds and sells high-performance custom eCommerce and service websites. Launch your online store or business site fast—fully designed, animated, and ready to grow your brand. Get a dedicated account manager and unmatched support.",
            "contactPoint": [{
              "@type": "ContactPoint",
              "telephone": "+254-790-057-596",
              "contactType": "customer service",
              "email": "support@sitemendr.com"
            }],
            "sameAs": [
              "https://facebook.com/sitemendr",
              "https://linkedin.com/company/sitemendr",
              "https://instagram.com/sitemendr",
              "https://tiktok.com/@sitemendr",
              "https://twitter.com/sitemendr",
              "https://pinterest.com/sitemendr/",
              "https://youtube.com/@sitemendr"
            ],
            "founder": {
              "@type": "Person",
              "name": "Sitemendr Team"
            },
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "KE"
            }
          })}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-dark-bg text-light-text`}>
        {/* SEO Structured Data */}
        <OrganizationSchema />
        <WebSiteSchema />
        <LocalBusinessSchema />
        
        <QueryProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
