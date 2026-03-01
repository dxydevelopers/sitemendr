const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');
const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_SEED !== 'true') {
    logger.error('Seeding disabled. Set ALLOW_SEED=true to run this script.');
    process.exit(1);
  }
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@sitemendr.com' }
  });

  if (!admin) {
    logger.error('Admin user not found for seeding blog');
    return;
  }

  const blogPosts = [
    {
      title: 'The Future of AI-Driven Web Maintenance',
      excerpt: 'Discover how artificial intelligence is revolutionizing the way we keep websites secure and up-to-date.',
      content: 'AI is no longer just a buzzword; it is a critical component of modern web infrastructure. At Sitemendr, we leverage advanced machine learning models to predict vulnerabilities and automate patches before they can be exploited. This proactive approach ensures that your digital presence remains robust and resilient against emerging threats.',
      category: 'Technology',
      tags: ['AI', 'Security', 'Automation'],
      status: 'published'
    },
    {
      title: 'Maximizing Performance in Next.js Applications',
      excerpt: 'Learn the best practices for building lightning-fast websites using the latest Next.js features.',
      content: 'Next.js has become the go-to framework for building high-performance web applications. From server-side rendering to static site generation and image optimization, there are numerous ways to squeeze every bit of performance out of your app. In this article, we dive deep into advanced techniques like streaming, partial prerendering, and efficient data fetching strategies.',
      category: 'Development',
      tags: ['Next.js', 'React', 'Performance'],
      status: 'published'
    },
    {
      title: 'Why Managed Hosting is Better for Your Business',
      excerpt: 'Focus on your business while we handle the technical complexities of hosting and maintenance.',
      content: 'Running a business is hard enough without having to worry about server uptimes, SSL certificates, and database backups. Managed hosting provides a layer of professional support that ensures your website is always running at its best. We explore the cost-benefit analysis of managed vs. self-hosted solutions for growing enterprises.',
      category: 'Business',
      tags: ['Hosting', 'Strategy', 'Business Growth'],
      status: 'published'
    },
    {
      title: 'The Complete Guide to Website Security in 2025',
      excerpt: 'Essential security practices every website owner should implement to protect against modern threats.',
      content: 'In today\'s digital landscape, website security is not optional???it\'s essential. From implementing HTTPS and secure authentication to regular security audits and vulnerability assessments, this comprehensive guide covers everything you need to know to keep your website and your users safe from cyber threats.',
      category: 'Security',
      tags: ['Security', 'HTTPS', 'Cybersecurity', 'Best Practices'],
      status: 'published'
    },
    {
      title: 'SEO Strategies That Actually Work in 2025',
      excerpt: 'Cut through the noise and implement proven SEO techniques that deliver real results.',
      content: 'Search engine optimization has evolved significantly over the years. Gone are the days of keyword stuffing and link schemes. Modern SEO is about creating valuable content, optimizing user experience, and building genuine authority. Learn the strategies that will help your website rank higher and attract more organic traffic.',
      category: 'Marketing',
      tags: ['SEO', 'Content Marketing', 'Digital Marketing'],
      status: 'published'
    },
    {
      title: 'Understanding the New Google Core Web Vitals',
      excerpt: 'How to optimize your website for the latest Google performance metrics.',
      content: 'Google\'s Core Web Vitals are now a critical ranking factor. These metrics measure loading performance, interactivity, and visual stability. In this detailed guide, we break down each metric, explain why it matters, and provide actionable steps to improve your website\'s scores.',
      category: 'Performance',
      tags: ['Performance', 'Google', 'Web Vitals', 'Optimization'],
      status: 'published'
    },
    {
      title: 'The Rise of Headless CMS: What You Need to Know',
      excerpt: 'How decoupled content management systems are changing the web development landscape.',
      content: 'Headless CMS platforms are gaining popularity for their flexibility and scalability. By separating the content repository from the presentation layer, they enable developers to build faster, more flexible websites and applications. Discover the benefits, challenges, and best practices for implementing a headless CMS solution.',
      category: 'Technology',
      tags: ['CMS', 'Headless', 'Content Management', 'API'],
      status: 'published'
    },
    {
      title: 'Mobile-First Design: Principles and Best Practices',
      excerpt: 'Designing for mobile devices should be your primary focus in web development.',
      content: 'With mobile internet usage surpassing desktop, mobile-first design is no longer optional. This approach prioritizes the mobile experience, ensuring your website is accessible and user-friendly across all devices. Learn the key principles and techniques for creating exceptional mobile experiences.',
      category: 'Design',
      tags: ['Mobile', 'UX', 'Responsive Design', 'User Experience'],
      status: 'published'
    },
    {
      title: 'E-commerce Website Optimization: Boost Your Sales',
      excerpt: 'Proven techniques to improve conversion rates and increase revenue from your online store.',
      content: 'E-commerce websites face unique challenges in converting visitors into customers. From streamlining the checkout process to optimizing product pages and implementing effective call-to-actions, this guide covers the strategies that can significantly boost your online sales.',
      category: 'E-commerce',
      tags: ['E-commerce', 'Conversion Rate', 'Sales', 'Optimization'],
      status: 'published'
    },
    {
      title: 'The Importance of Website Accessibility',
      excerpt: 'Why accessible design benefits everyone and how to implement it effectively.',
      content: 'Website accessibility is not just about compliance???it\'s about creating inclusive digital experiences. Accessible websites benefit users with disabilities, improve SEO, and enhance overall user experience. Learn the key principles of accessible design and how to implement them in your projects.',
      category: 'Design',
      tags: ['Accessibility', 'Inclusive Design', 'WCAG', 'User Experience'],
      status: 'published'
    },
    {
      title: 'Content Strategy for Modern Websites',
      excerpt: 'How to create and manage content that engages users and drives business results.',
      content: 'Effective content strategy goes beyond just writing blog posts. It involves planning, creating, and managing content that aligns with your business goals and resonates with your audience. Discover how to develop a content strategy that supports your website\'s objectives and delivers value to your users.',
      category: 'Content',
      tags: ['Content Strategy', 'Content Marketing', 'Brand Voice', 'User Engagement'],
      status: 'published'
    },
    {
      title: 'The Benefits of Progressive Web Apps (PWAs)',
      excerpt: 'How PWAs combine the best of web and mobile app experiences.',
      content: 'Progressive Web Apps offer a compelling alternative to traditional mobile apps. They load quickly, work offline, and can be installed on users\' devices. Learn how PWAs can improve user engagement, increase conversion rates, and provide a superior mobile experience.',
      category: 'Technology',
      tags: ['PWA', 'Mobile', 'Offline', 'Performance'],
      status: 'published'
    },
    {
      title: 'Database Optimization Techniques for Web Applications',
      excerpt: 'How to ensure your database performs efficiently under high traffic loads.',
      content: 'Database performance is critical for web application success. Poorly optimized queries and inefficient data structures can lead to slow load times and poor user experience. This guide covers indexing strategies, query optimization, and database design principles for high-performance applications.',
      category: 'Development',
      tags: ['Database', 'Performance', 'Optimization', 'SQL'],
      status: 'published'
    },
    {
      title: 'The Future of Web Development: Trends to Watch',
      excerpt: 'Emerging technologies and practices that will shape the future of web development.',
      content: 'The web development landscape is constantly evolving. From new frameworks and languages to emerging technologies like WebAssembly and edge computing, staying ahead of trends is crucial for developers. Explore the innovations that are likely to define the future of web development.',
      category: 'Technology',
      tags: ['Web Development', 'Trends', 'Innovation', 'Future'],
      status: 'published'
    },
    {
      title: 'Effective Website Analytics: Beyond Basic Metrics',
      excerpt: 'How to use data to make informed decisions about your website strategy.',
      content: 'Website analytics provide valuable insights into user behavior and website performance. However, many businesses only scratch the surface of what\'s possible. Learn how to set up advanced tracking, interpret complex data, and use analytics to drive meaningful improvements to your website.',
      category: 'Analytics',
      tags: ['Analytics', 'Data', 'User Behavior', 'Metrics'],
      status: 'published'
    },
    {
      title: 'Building Scalable Web Applications',
      excerpt: 'Architectural patterns and practices for creating applications that can handle growth.',
      content: 'Scalability is a critical consideration for any web application. Whether you\'re building a startup MVP or an enterprise solution, designing for scalability from the start can save significant time and resources. This guide covers architectural patterns, database strategies, and infrastructure considerations for scalable applications.',
      category: 'Development',
      tags: ['Scalability', 'Architecture', 'Performance', 'Infrastructure'],
      status: 'published'
    },
    {
      title: 'The Role of AI in Modern Web Development',
      excerpt: 'How artificial intelligence is transforming the way we build and maintain websites.',
      content: 'AI is revolutionizing web development in numerous ways, from automated code generation to intelligent content management and personalized user experiences. Explore the current applications of AI in web development and what the future might hold for this rapidly evolving field.',
      category: 'Technology',
      tags: ['AI', 'Machine Learning', 'Automation', 'Web Development'],
      status: 'published'
    },
    {
      title: 'CSS-in-JS vs Traditional CSS: Which Approach is Right for You?',
      excerpt: 'Comparing modern styling approaches and their impact on development workflows.',
      content: 'The rise of component-based frameworks has led to new approaches to styling web applications. CSS-in-JS, styled-components, and traditional CSS each have their advantages and trade-offs. This comprehensive comparison helps you choose the right approach for your project based on your team, requirements, and constraints.',
      category: 'Development',
      tags: ['CSS', 'Styling', 'React', 'Frontend'],
      status: 'published'
    },
    {
      title: 'The Complete Guide to Website Migration',
      excerpt: 'How to move your website to a new platform without losing traffic or functionality.',
      content: 'Website migration is a complex process that requires careful planning and execution. Whether you\'re changing platforms, redesigning, or consolidating sites, this guide covers everything from pre-migration planning to post-migration optimization to ensure a smooth transition.',
      category: 'Business',
      tags: ['Migration', 'Planning', 'SEO', 'Content Management'],
      status: 'published'
    },
    {
      title: 'Understanding Website Hosting Options',
      excerpt: 'A comprehensive guide to choosing the right hosting solution for your website.',
      content: 'From shared hosting to dedicated servers and cloud platforms, the hosting landscape offers numerous options. Each has its own advantages, costs, and technical requirements. Learn how to evaluate your needs and choose the hosting solution that best supports your website\'s goals and growth.',
      category: 'Business',
      tags: ['Hosting', 'Infrastructure', 'Cloud', 'Performance'],
      status: 'published'
    },
    {
      title: 'The Psychology of User Interface Design',
      excerpt: 'How understanding human behavior can improve your website\'s user experience.',
      content: 'Great UI design goes beyond aesthetics???it\'s about understanding how users think, behave, and interact with digital interfaces. This guide explores psychological principles like cognitive load, Hick\'s Law, and the F-pattern, and shows how to apply them to create more intuitive and effective user interfaces.',
      category: 'Design',
      tags: ['UI', 'UX', 'Psychology', 'User Experience'],
      status: 'published'
    },
    {
      title: 'API Design Best Practices',
      excerpt: 'Creating RESTful APIs that are intuitive, scalable, and maintainable.',
      content: 'APIs are the backbone of modern web applications, enabling different systems to communicate and share data. Good API design is crucial for developer experience, system reliability, and long-term maintainability. Learn the principles and practices that make APIs easy to use and extend.',
      category: 'Development',
      tags: ['API', 'REST', 'Design', 'Integration'],
      status: 'published'
    },
    {
      title: 'The Impact of Website Speed on User Experience',
      excerpt: 'Why page load times matter more than you think and how to improve them.',
      content: 'Website speed directly impacts user satisfaction, conversion rates, and search engine rankings. Even small improvements in load times can have significant business benefits. This guide covers the factors that affect website speed and provides practical techniques for optimization.',
      category: 'Performance',
      tags: ['Performance', 'Speed', 'User Experience', 'Optimization'],
      status: 'published'
    },
    {
      title: 'Content Management Systems: Choosing the Right One',
      excerpt: 'How to evaluate and select a CMS that fits your business needs.',
      content: 'With so many content management systems available, choosing the right one can be overwhelming. This guide helps you evaluate different CMS options based on factors like ease of use, customization capabilities, scalability, and total cost of ownership.',
      category: 'Business',
      tags: ['CMS', 'Content Management', 'Platform Selection', 'Business Tools'],
      status: 'published'
    },
    {
      title: 'The Art of Landing Page Optimization',
      excerpt: 'How to create landing pages that convert visitors into customers.',
      content: 'Landing pages are critical for marketing campaigns, product launches, and lead generation. Effective landing pages focus on a single goal and remove all distractions. Learn the principles of landing page design, copywriting techniques, and testing strategies to maximize conversions.',
      category: 'Marketing',
      tags: ['Landing Pages', 'Conversion', 'Marketing', 'User Experience'],
      status: 'published'
    },
    {
      title: 'Web Accessibility Laws and Compliance',
      excerpt: 'Understanding legal requirements and how to ensure your website is compliant.',
      content: 'Web accessibility is increasingly becoming a legal requirement in many jurisdictions. Non-compliance can result in lawsuits and damage to your brand reputation. This guide covers major accessibility laws, compliance requirements, and practical steps to ensure your website meets legal standards.',
      category: 'Business',
      tags: ['Accessibility', 'Compliance', 'Legal', 'ADA'],
      status: 'published'
    },
    {
      title: 'The Evolution of JavaScript Frameworks',
      excerpt: 'How modern frameworks have changed the way we build web applications.',
      content: 'JavaScript frameworks have evolved rapidly over the past decade, from jQuery to Angular, React, Vue, and now frameworks like Svelte and Solid. Each generation brings new paradigms and capabilities. This article traces the evolution of JavaScript frameworks and what it means for the future of web development.',
      category: 'Development',
      tags: ['JavaScript', 'Frameworks', 'React', 'Vue', 'Angular'],
      status: 'published'
    },
    {
      title: 'Building Multilingual Websites',
      excerpt: 'Strategies and tools for creating websites that serve global audiences.',
      content: 'In today\'s global marketplace, multilingual websites are essential for reaching international audiences. However, creating a multilingual site involves more than just translation???it requires careful consideration of content management, SEO, user experience, and technical implementation.',
      category: 'Development',
      tags: ['Internationalization', 'i18n', 'Translation', 'Global'],
      status: 'published'
    },
    {
      title: 'The Future of E-commerce: Emerging Trends and Technologies',
      excerpt: 'How new technologies and changing consumer behaviors are shaping online retail.',
      content: 'E-commerce is evolving rapidly, driven by advances in technology and shifts in consumer behavior. From augmented reality shopping experiences to AI-powered personalization and voice commerce, this article explores the trends that will define the future of online retail.',
      category: 'E-commerce',
      tags: ['E-commerce', 'Trends', 'Technology', 'Retail'],
      status: 'published'
    },
    {
      title: 'DevOps for Web Development: Streamlining Your Workflow',
      excerpt: 'How DevOps practices can improve collaboration and accelerate development cycles.',
      content: 'DevOps is not just for large enterprises???it can benefit web development teams of all sizes. By automating deployment, improving collaboration between development and operations, and implementing continuous integration/continuous deployment (CI/CD), you can deliver higher quality code faster and more reliably.',
      category: 'Development',
      tags: ['DevOps', 'CI/CD', 'Automation', 'Workflow'],
      status: 'published'
    },
    {
      title: 'The Importance of Website Branding',
      excerpt: 'How your website reflects and shapes your brand identity.',
      content: 'Your website is often the first interaction potential customers have with your brand. It should consistently reflect your brand values, personality, and visual identity. This guide covers how to align your website design, content, and user experience with your overall brand strategy.',
      category: 'Business',
      tags: ['Branding', 'Identity', 'Visual Design', 'Brand Strategy'],
      status: 'published'
    }
  ];

  for (const post of blogPosts) {
    const slug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const wordsPerMinute = 200;
    const words = post.content.split(/\s+/).length;
    const readingTime = Math.ceil(words / wordsPerMinute);

    await prisma.blogPost.upsert({
      where: { slug },
      update: {
        ...post,
        authorId: admin.id,
        readingTime,
        publishedAt: new Date()
      },
      create: {
        ...post,
        slug,
        authorId: admin.id,
        readingTime,
        publishedAt: new Date(),
        featuredImage: `/uploads/blog-${Math.floor(Math.random() * 10)}.jpg` // Placeholder for demo images
      }
    });
    logger.info(`Upserted blog post: ${post.title}`);
  }
}

main()
  .catch(e => {
    logger.error('Blog seeding failed', { error: e.message });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

