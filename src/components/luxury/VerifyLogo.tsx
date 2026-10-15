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

  // Elegant horizontal badge default dimensions
  const containerDimensions = size || shieldSize || 'w-60 sm:w-72 lg:w-80 h-14 sm:h-16 lg:h-18';

  return (
    <div className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}>
      <style>{`
        /* Forensic Laser Scan Beam - Lateral Left to Right (8.5s Stately Cycle: ~4.2s slow sweep + ~4.3s pause) */
        @keyframes gvLaserSweepLateral {
          0% {
            left: -8%;
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          48% {
            left: 106%;
            opacity: 1;
          }
          52% {
            left: 110%;
            opacity: 0;
          }
          100% {
            left: -8%;
            opacity: 0;
          }
        }

        /* Luminous Scan Trail Lateral */
        @keyframes gvLaserTrailLateral {
          0% {
            left: -24%;
            opacity: 0;
          }
          4% {
            opacity: 0.55;
          }
          48% {
            left: 90%;
            opacity: 0.55;
          }
          52% {
            left: 94%;
            opacity: 0;
          }
          100% {
            left: -24%;
            opacity: 0;
          }
        }

        .gv-laser-line-lateral {
          animation: gvLaserSweepLateral 8.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .gv-laser-trail-lateral {
          animation: gvLaserTrailLateral 8.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Main Container - Grounded and Stable (No Pendulum Float) */}
      <div className={`relative flex items-center justify-center cursor-pointer group ${containerDimensions}`}>
        
        {/* Shield Stage without pendulum bobbing */}
        <div className="relative w-full h-full transition-transform duration-500 ease-out group-hover:scale-105 flex items-center justify-center">
          
          {/* Main Shield Image & Razor-Sharp Vector Typography Overlay */}
          <div className="relative w-full h-full flex items-center justify-center">
            <svg 
              viewBox="0 0 4500 1964" 
              className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-300 ${
                isLight 
                  ? 'filter drop-shadow-[0_8px_18px_rgba(15,23,42,0.10)]' 
                  : 'filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]'
              }`}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Base High-Resolution 3D Ring and Gorilla Typography */}
              <image href={logoSrc} width="4500" height="1964" />

              {/* Enhanced Precision Divider Line */}
              <line 
                x1="2640" 
                y1="1146" 
                x2="3410" 
                y2="1146" 
                stroke={isLight ? "#16A34A" : "#22C55E"} 
                strokeWidth="20" 
                strokeLinecap="round" 
              />

              {/* Crisp, Bold, Perfectly Legible VERIFIED Text */}
              <text 
                x="3025" 
                y="1388" 
                textAnchor="middle" 
                fontFamily="'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
                fontSize="152" 
                fontWeight="800" 
                fill={isLight ? "#15803D" : "#4ADE80"}
                letterSpacing="0.28em"
                style={{
                  textRendering: 'geometricPrecision',
                  WebkitFontSmoothing: 'antialiased',
                  filter: isLight 
                    ? 'drop-shadow(0px 1px 1px rgba(255,255,255,0.7))' 
                    : 'drop-shadow(0px 0px 12px rgba(74,222,128,0.35))',
                }}
              >
                VERIFIED
              </text>
            </svg>
          </div>

          {/* Forensic Laser Scanner Overlay — Slow lateral sweep across the badge */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-lg">
            
            {/* Luminous Lateral Scan Trail */}
            <div 
              className="absolute top-0 bottom-0 w-24 gv-laser-trail-lateral pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgba(34,197,94,0.45) 0%, rgba(34,197,94,0.08) 60%, transparent 100%)'
              }}
            />

            {/* Neon Green Lateral Laser Beam Line */}
            <div 
              className="absolute top-0 bottom-0 w-[3px] gv-laser-line-lateral pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, #4ADE80 20%, #FFFFFF 50%, #4ADE80 80%, transparent 100%)',
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

