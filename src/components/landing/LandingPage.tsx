import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { FourIconStrip } from './FourIconStrip';
import { FeaturedTools } from './FeaturedTools';
import { CareerTracks } from './CareerTracks';
import { PricingSection } from '../saas/PricingSection';
import { UnlockBanner } from './UnlockBanner';
import { Footer } from './Footer';
import { DashboardPageId } from '../dashboard/DashboardShell';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigateToDashboard: (page?: DashboardPageId) => void;
  onOpenLegal?: (tab: 'terms' | 'privacy' | 'refund') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onNavigateToDashboard,
  onOpenLegal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar
        onOpenAuth={onOpenAuth}
        onNavigateToDashboard={onNavigateToDashboard}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="flex-1">
        <HeroSection
          onNavigateToDashboard={onNavigateToDashboard}
          onOpenAuth={onOpenAuth}
        />

        <FourIconStrip
          onNavigateDashboard={(page) => onNavigateToDashboard(page as DashboardPageId)}
        />

        <FeaturedTools
          onNavigateDashboard={(page) => onNavigateToDashboard(page as DashboardPageId)}
        />

        <CareerTracks
          onNavigateDashboard={(page) => onNavigateToDashboard(page as DashboardPageId)}
        />

        <PricingSection
          onNavigateToDashboard={(page) => onNavigateToDashboard(page as DashboardPageId)}
        />

        <UnlockBanner
          onGetStarted={() => onOpenAuth('signup')}
        />
      </main>

      <Footer
        onNavigateToDashboard={(page) => onNavigateToDashboard(page as DashboardPageId)}
        onOpenLegal={onOpenLegal}
      />
    </div>
  );
};
