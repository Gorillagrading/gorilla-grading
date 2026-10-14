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
import { ScrollReveal } from '../components/luxury/ScrollReveal';

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
      <ScrollReveal direction="up" delay={0.1}>
        <HomeTechnologySection 
          onNavigate={onNavigate}
          onOpenTechModal={() => setIsTechModalOpen(true)}
        />
      </ScrollReveal>

      {/* 3.5. Live Forensic Certificate Verification Module */}
      <ScrollReveal direction="up" delay={0.1}>
        <HomeVerificationModule onNavigate={onNavigate} />
      </ScrollReveal>

      {/* 4. Pricing & Services Recommendation */}
      <ScrollReveal direction="up" delay={0.1}>
        <LuxuryPricingSection onNavigate={onNavigate} isHome={true} />
      </ScrollReveal>


      {/* 5. Step by Step / Process */}
      <ScrollReveal direction="up" delay={0.1}>
        <TechnologySection onNavigate={onNavigate} />
      </ScrollReveal>

      {/* 7. Verified Expert Audits & Testimonials */}
      <ScrollReveal direction="up" delay={0.1}>
        <VerifiedAuditsSection />
      </ScrollReveal>

      {/* 8. Call to Action / Promos */}
      <ScrollReveal direction="up" delay={0.1}>
        <PromoCTA onNavigate={onNavigate} />
      </ScrollReveal>

      {/* 9. FAQs */}
      <ScrollReveal direction="up" delay={0.1}>
        <FAQSection onNavigate={onNavigate} />
      </ScrollReveal>

      {/* 10. Live Laboratory Activity & Community Feed */}
      <ScrollReveal direction="up" delay={0.1}>
        <LiveLabActivitySection />
      </ScrollReveal>

      {/* 11. Customer Promise / International Shipping */}
      <ScrollReveal direction="up" delay={0.1}>
        <MissionBanner onNavigate={onNavigate} />
      </ScrollReveal>

      {/* 12. Newsletter Subscription */}
      <ScrollReveal direction="up" delay={0.1}>
        <NewsletterSection />
      </ScrollReveal>

      {/* Interactive Technology Detail Explorer Modal */}
      <TechDetailModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        onNavigate={onNavigate}
      />

    </div>
  );
};
