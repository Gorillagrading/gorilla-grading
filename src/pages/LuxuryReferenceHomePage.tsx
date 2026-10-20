import React, { useState } from 'react';
import { LuxuryHero } from '../components/luxury/LuxuryHero';
import { HomeTechnologySection } from '../components/luxury/HomeTechnologySection';
import { TechnologySection } from '../components/luxury/TechnologySection';
import { HomeVerificationModule } from '../components/luxury/HomeVerificationModule';
import { LuxuryPricingSection } from '../components/luxury/LuxuryPricingSection';
import { MissionBanner } from '../components/luxury/MissionBanner';
import { TechDetailModal } from '../components/luxury/TechDetailModal';
import { VerifiedAuditsSection, LiveLabActivitySection } from '../components/luxury/MarketingPlaceholders';
import { PromoCTA } from '../components/luxury/PromoCTA';
import { FAQSection } from '../components/luxury/FAQSection';
import { NewsletterSection } from '../components/luxury/NewsletterSection';

interface LuxuryReferenceHomePageProps {
  onNavigate: (path: string) => void;
}

export const LuxuryReferenceHomePage: React.FC<LuxuryReferenceHomePageProps> = ({ onNavigate }) => {
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-transparent text-white flex flex-col selection:bg-[#48C765] selection:text-[#14170F] relative overflow-hidden">
      
      {/* 1. Hero Section (Ultra-High-Fidelity Reference Composition) */}
      <LuxuryHero 
        onNavigate={onNavigate} 
        onOpenTechModal={() => setIsTechModalOpen(true)}
      />

      {/* 3. Core Laboratory Technology: Scan, Analyze, Measure, Grade */}
      <HomeTechnologySection 
        onNavigate={onNavigate}
        onOpenTechModal={() => setIsTechModalOpen(true)}
      />

      {/* 3.5. Live Forensic Certificate Verification Module */}
      <HomeVerificationModule onNavigate={onNavigate} />

      {/* 4. Pricing & Services Recommendation */}
      <LuxuryPricingSection onNavigate={onNavigate} isHome={true} />

      {/* 5. Step by Step / Process */}
      <TechnologySection onNavigate={onNavigate} />

      {/* 7. Verified Expert Audits & Testimonials */}
      <VerifiedAuditsSection />

      {/* 8. Call to Action / Promos */}
      <PromoCTA onNavigate={onNavigate} />

      {/* 9. FAQs */}
      <FAQSection onNavigate={onNavigate} />

      {/* 10. Live Laboratory Activity & Community Feed */}
      <LiveLabActivitySection />

      {/* 11. Customer Promise / International Shipping */}
      <MissionBanner onNavigate={onNavigate} />

      {/* 12. Newsletter Subscription */}
      <NewsletterSection />

      {/* Interactive Technology Detail Explorer Modal */}
      <TechDetailModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onNavigate={onNavigate}
      />

    </div>
  );
};
