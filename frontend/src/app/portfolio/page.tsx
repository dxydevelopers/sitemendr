import PortfolioHero from '@/components/PortfolioHero';
import CaseStudies from '@/components/CaseStudies';
import ProcessSection from '@/components/ProcessSection';
import WhyChooseUs from '@/components/WhyChooseUs';
import TechStack from '@/components/TechStack';
import Testimonials from '@/components/Testimonials';
import PortfolioCTA from '@/components/PortfolioCTA';

export default function PortfolioPage() {
  return (
    <main className="min-h-screen bg-dark-bg text-light-text">
      <PortfolioHero />
      <CaseStudies />
      <ProcessSection />
      <WhyChooseUs />
      <TechStack />
      <Testimonials />
      <PortfolioCTA />
    </main>
  );
}
