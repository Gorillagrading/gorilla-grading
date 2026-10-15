import React from 'react';
import { TechnologySection } from '../components/luxury/TechnologySection';
import { CardAnalysisPillars } from '../components/luxury/CardAnalysisPillars';
import { LuxuryAboutSection } from '../components/luxury/LuxuryAboutSection';

interface TechnologyPageProps {
  onNavigate?: (path: string) => void;
}

export const TechnologyPage: React.FC<TechnologyPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full min-h-screen bg-[#454545] text-white flex flex-col">
      <TechnologySection onNavigate={onNavigate} showExploreButton={false} />
      <LuxuryAboutSection onNavigate={onNavigate} />
      <CardAnalysisPillars onNavigate={onNavigate} />
    </div>
  );
};
