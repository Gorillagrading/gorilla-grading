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

        </div>

      </div>
    </div>
  );
};

export const VerifyLogo = GorillaVerifyLogo;
export default GorillaVerifyLogo;
