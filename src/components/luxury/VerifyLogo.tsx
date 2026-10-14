import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface VerifyLogoProps {
  className?: string;
  size?: string;
  shieldSize?: string;
  layout?: 'single-line' | 'stacked';
}

export const GorillaVerifyLogo: React.FC<VerifyLogoProps> = ({
  className = '',
  size,
  shieldSize,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Assets according to light / dark theme
  const logoSrc = isLight 
    ? '/brand/logo%20gorilla%20verified_fondo%20claro.png' 
    : '/brand/gorilla-verify-dark.png';

  // Heroic, larger default dimensions
  const containerDimensions = size || shieldSize || 'w-52 h-52 sm:w-64 sm:h-64 lg:w-72 lg:h-72';

  return (
    <div className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}>
      <style>{`
        /* 1. Subtle, Elegant Levitation */
        @keyframes gvCleanFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* 2. Forensic Laser Scan Beam (6s Cycle: ~2s sweep + ~4s pause) */
        @keyframes gvLaserSweep {
          0% {
            top: -8%;
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          32% {
            top: 104%;
            opacity: 1;
          }
          36% {
            top: 108%;
            opacity: 0;
          }
          100% {
            top: -8%;
            opacity: 0;
          }
        }

        /* 3. Luminous Scan Trail */
        @keyframes gvLaserTrail {
          0% {
            top: -28%;
            opacity: 0;
          }
          5% {
            opacity: 0.65;
          }
          32% {
            top: 86%;
            opacity: 0.65;
          }
          36% {
            top: 92%;
            opacity: 0;
          }
          100% {
            top: -28%;
            opacity: 0;
          }
        }

        .gv-clean-float {
          animation: gvCleanFloat 4.8s ease-in-out infinite;
          will-change: transform;
        }

        .gv-laser-line {
          animation: gvLaserSweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .gv-laser-trail {
          animation: gvLaserTrail 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Main Container */}
      <div className={`relative flex items-center justify-center cursor-pointer group ${containerDimensions}`}>
        
        {/* Shield Stage with Smooth Levitation */}
        <div className="relative w-full h-full gv-clean-float transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
          
          {/* Main Shield Image */}
          <img 
            key={logoSrc}
            src={logoSrc} 
            alt="Gorilla Verify" 
            className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-300 ${
              isLight 
                ? 'filter drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)]' 
                : 'filter drop-shadow-[0_18px_32px_rgba(0,0,0,0.6)]'
            }`}
            draggable={false}
          />

          {/* Forensic Laser Scanner Overlay — Contained Exclusively within the Shield */}
          <div className="absolute inset-[3.5%] overflow-hidden rounded-[26%] pointer-events-none">
            
            {/* Luminous Scan Trail */}
            <div 
              className="absolute left-0 right-0 h-20 gv-laser-trail pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0.12) 60%, transparent 100%)'
              }}
            />

            {/* Neon Green Laser Beam Line */}
            <div 
              className="absolute left-0 right-0 h-[2.5px] gv-laser-line pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #4ADE80 20%, #FFFFFF 50%, #4ADE80 80%, transparent 100%)',
                boxShadow: '0 0 14px 3px #22C55E, 0 0 28px 5px rgba(74,222,128,0.85)'
              }}
            />
          </div>

        </div>

      </div>
    </div>
  );
};

export const VerifyLogo = GorillaVerifyLogo;
export default GorillaVerifyLogo;

