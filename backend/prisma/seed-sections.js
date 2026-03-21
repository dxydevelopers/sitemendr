const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sectionTemplates = [
  // Header sections
  {
    name: 'Navigation Header',
    category: 'header',
    icon: 'Menu',
    description: 'Logo, navigation menu, and cart icon',
    componentName: 'HeaderSection',
    defaultSettings: {
      logo: '',
      navLinks: [
        { label: 'Home', url: '/' },
        { label: 'Shop', url: '/collections' },
        { label: 'Blog', url: '/blog' },
        { label: 'About', url: '/about' }
      ],
      showCart: true,
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    },
    schema: {
      logo: { type: 'text', label: 'Logo URL' },
      navLinks: { type: 'array', label: 'Navigation Links', itemSchema: { label: 'text', url: 'text' } },
      showCart: { type: 'boolean', label: 'Show Cart Icon' },
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' }
    },
    isBuiltIn: true
  },
  // Hero sections
  {
    name: 'Hero Banner',
    category: 'hero',
    icon: 'Image',
    description: 'Full-width hero banner with title, subtitle, and CTA button',
    componentName: 'HeroSection',
    defaultSettings: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products at great prices',
      ctaText: 'Shop Now',
      ctaUrl: '/collections',
      backgroundImage: '',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      overlay: true
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'textarea', label: 'Subtitle' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
      ctaUrl: { type: 'url', label: 'CTA URL' },
      backgroundImage: { type: 'media', label: 'Background Image' },
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' },
      overlay: { type: 'boolean', label: 'Show Overlay' }
    },
    isBuiltIn: true
  },
  {
    name: 'Split Hero',
    category: 'hero',
    icon: 'Columns',
    description: 'Two-column hero with image and text',
    componentName: 'SplitHeroSection',
    defaultSettings: {
      title: 'Your Amazing Headline Here',
      description: 'Describe your product or service in a compelling way',
      ctaText: 'Get Started',
      ctaUrl: '/signup',
      image: '',
      imagePosition: 'right',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      description: { type: 'textarea', label: 'Description' },
      ctaText: { type: 'text', label: 'CTA Button Text' },
      ctaUrl: { type: 'url', label: 'CTA URL' },
      image: { type: 'media', label: 'Image' },
      imagePosition: { type: 'select', label: 'Image Position', options: ['left', 'right'] },
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' }
    },
    isBuiltIn: true
  },
  // Product sections
  {
    name: 'Product Grid',
    category: 'product',
    icon: 'Grid',
    description: 'Grid of products with images, prices, and quick view',
    componentName: 'ProductGridSection',
    defaultSettings: {
      title: 'Featured Products',
      products: [],
      columns: 4,
      showPrice: true,
      showAddToCart: true,
      limit: 8
    },
    schema: {
      title: { type: 'text', label: 'Section Title' },
      products: { type: 'productSelect', label: 'Select Products', multiple: true },
      columns: { type: 'select', label: 'Columns', options: [2, 3, 4, 5, 6] },
      showPrice: { type: 'boolean', label: 'Show Price' },
      showAddToCart: { type: 'boolean', label: 'Show Add to Cart' },
      limit: { type: 'number', label: 'Product Limit' }
    },
    isBuiltIn: true
  },
  {
    name: 'Featured Collection',
    category: 'product',
    icon: 'Star',
    description: 'Highlighted collection with featured products',
    componentName: 'FeaturedCollectionSection',
    defaultSettings: {
      title: 'New Arrivals',
      collection: '',
      showProducts: true,
      productCount: 4
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      collection: { type: 'text', label: 'Collection Handle' },
      showProducts: { type: 'boolean', label: 'Show Products' },
      productCount: { type: 'number', label: 'Number of Products' }
    },
    isBuiltIn: true
  },
  // Content sections
  {
    name: 'Rich Text',
    category: 'content',
    icon: 'Type',
    description: 'Rich text content block with customizable formatting',
    componentName: 'TextBlockSection',
    defaultSettings: {
      content: '<p>Your content here...</p>',
      textAlign: 'left',
      maxWidth: '800px'
    },
    schema: {
      content: { type: 'html', label: 'Content' },
      textAlign: { type: 'select', label: 'Text Align', options: ['left', 'center', 'right'] },
      maxWidth: { type: 'text', label: 'Max Width' }
    },
    isBuiltIn: true
  },
  {
    name: 'Image Gallery',
    category: 'content',
    icon: 'Images',
    description: 'Grid or masonry gallery of images',
    componentName: 'ImageGallerySection',
    defaultSettings: {
      images: [],
      columns: 3,
      gap: '16px',
      lightbox: true
    },
    schema: {
      images: { type: 'media', label: 'Images', multiple: true },
      columns: { type: 'select', label: 'Columns', options: [2, 3, 4, 5] },
      gap: { type: 'text', label: 'Gap' },
      lightbox: { type: 'boolean', label: 'Enable Lightbox' }
    },
    isBuiltIn: true
  },
  {
    name: 'Video Section',
    category: 'content',
    icon: 'Video',
    description: 'Video player with optional autoplay',
    componentName: 'VideoSection',
    defaultSettings: {
      videoUrl: '',
      poster: '',
      autoplay: false,
      muted: true,
      loop: false,
      aspectRatio: '16/9'
    },
    schema: {
      videoUrl: { type: 'url', label: 'Video URL (YouTube, Vimeo, or direct MP4)' },
      poster: { type: 'media', label: 'Poster Image' },
      autoplay: { type: 'boolean', label: 'Autoplay' },
      muted: { type: 'boolean', label: 'Muted' },
      loop: { type: 'boolean', label: 'Loop' },
      aspectRatio: { type: 'select', label: 'Aspect Ratio', options: ['16/9', '4/3', '1/1', '9/16'] }
    },
    isBuiltIn: true
  },
  {
    name: 'Accordion FAQ',
    category: 'content',
    icon: 'ChevronDown',
    description: 'Expandable accordion for FAQs or content',
    componentName: 'AccordionSection',
    defaultSettings: {
      items: [
        { question: 'What is your return policy?', answer: 'We offer 30-day returns.' },
        { question: 'How do I track my order?', answer: 'Use the tracking number in your email.' }
      ],
      allowMultiple: false
    },
    schema: {
      items: { type: 'array', label: 'FAQ Items', itemSchema: { question: 'text', answer: 'textarea' } },
      allowMultiple: { type: 'boolean', label: 'Allow Multiple Open' }
    },
    isBuiltIn: true
  },
  // Social sections
  {
    name: 'Testimonials',
    category: 'social',
    icon: 'MessageSquare',
    description: 'Customer testimonials with photos and quotes',
    componentName: 'TestimonialsSection',
    defaultSettings: {
      title: 'What Our Customers Say',
      testimonials: [
        { name: 'John D.', text: 'Amazing products!', avatar: '' },
        { name: 'Sarah M.', text: 'Great service!', avatar: '' }
      ],
      columns: 3
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      testimonials: { type: 'array', label: 'Testimonials', itemSchema: { name: 'text', text: 'textarea', avatar: 'media' } },
      columns: { type: 'select', label: 'Columns', options: [1, 2, 3, 4] }
    },
    isBuiltIn: true
  },
  {
    name: 'Newsletter Signup',
    category: 'marketing',
    icon: 'Mail',
    description: 'Email newsletter signup form',
    componentName: 'NewsletterSection',
    defaultSettings: {
      title: 'Subscribe to Our Newsletter',
      subtitle: 'Get the latest updates and exclusive offers',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email',
      successMessage: 'Thank you for subscribing!'
    },
    schema: {
      title: { type: 'text', label: 'Title' },
      subtitle: { type: 'text', label: 'Subtitle' },
      buttonText: { type: 'text', label: 'Button Text' },
      placeholder: { type: 'text', label: 'Input Placeholder' },
      successMessage: { type: 'text', label: 'Success Message' }
    },
    isBuiltIn: true
  },
  {
    name: 'Promo Banner',
    category: 'marketing',
    icon: 'Megaphone',
    description: 'Announcement banner with customizable text and link',
    componentName: 'PromoBannerSection',
    defaultSettings: {
      text: 'Free shipping on orders over $50!',
      link: '/shipping',
      linkText: 'Learn more',
      backgroundColor: '#10b981',
      textColor: '#ffffff'
    },
    schema: {
      text: { type: 'text', label: 'Banner Text' },
      link: { type: 'url', label: 'Link URL' },
      linkText: { type: 'text', label: 'Link Text' },
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' }
    },
    isBuiltIn: true
  },
  // Footer sections
  {
    name: 'Multi-Column Footer',
    category: 'footer',
    icon: 'LayoutFooter',
    description: 'Multi-column footer with links, social icons, and copyright',
    componentName: 'FooterSection',
    defaultSettings: {
      columns: [
        { title: 'Shop', links: [
          { label: 'All Products', url: '/collections' },
          { label: 'New Arrivals', url: '/collections/new' },
          { label: 'Best Sellers', url: '/collections/bestsellers' }
        ]},
        { title: 'Company', links: [
          { label: 'About Us', url: '/about' },
          { label: 'Contact', url: '/contact' },
          { label: 'Careers', url: '/careers' }
        ]},
        { title: 'Support', links: [
          { label: 'FAQ', url: '/faq' },
          { label: 'Shipping', url: '/shipping' },
          { label: 'Returns', url: '/returns' }
        ]}
      ],
      showSocial: true,
      showCopyright: true,
      copyrightText: '© 2024 Your Company. All rights reserved.',
      backgroundColor: '#1f2937',
      textColor: '#ffffff'
    },
    schema: {
      columns: { type: 'array', label: 'Footer Columns', itemSchema: { title: 'text', links: 'array' } },
      showSocial: { type: 'boolean', label: 'Show Social Icons' },
      showCopyright: { type: 'boolean', label: 'Show Copyright' },
      copyrightText: { type: 'text', label: 'Copyright Text' },
      backgroundColor: { type: 'color', label: 'Background Color' },
      textColor: { type: 'color', label: 'Text Color' }
    },
    isBuiltIn: true
  }
];

async function main() {
  console.log('Seeding section templates...');

  for (const section of sectionTemplates) {
    const existing = await prisma.sectionTemplate.findFirst({
      where: { name: section.name, isBuiltIn: true }
    });

    if (!existing) {
      await prisma.sectionTemplate.create({
        data: section
      });
      console.log(`Created: ${section.name}`);
    } else {
      console.log(`Skipped (already exists): ${section.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
