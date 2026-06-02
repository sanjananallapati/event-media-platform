import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { RecentEventsSection } from '@/components/home/RecentEventsSection';
import { StatsSection } from '@/components/home/StatsSection';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <RecentEventsSection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
}
