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
  const [videoFailed, setVideoFailed] = React.useState(false);

  // Static logo, used only if the browser cannot play the transparent ring video
  const logoSrc = isLight
    ? '/brand/logo%20gorilla%20verified_fondo%20claro.png'
    : '/brand/gorilla-verify-dark.png';

  // Elegant horizontal badge default dimensions (moderately larger & responsive)
  const containerDimensions = size || shieldSize || 'w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] h-[78px] sm:h-[94px] lg:h-[110px]';

  const green = isLight ? '#16A34A' : '#4ADE80';

  return (
    <div className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${containerDimensions}`}>
        {!isLight || videoFailed ? (
          // Static logo (dark theme always, light theme if the video cannot play)
          <svg
            viewBox="0 0 4500 1964"
            role="img"
            aria-label="Gorilla Verified"
            className={`w-full h-full pointer-events-none select-none ${
              isLight ? 'drop-shadow-[0_8px_18px_rgba(15,23,42,0.08)]' : 'drop-shadow-[0_12px_28px_rgba(0,0,0,0.65)]'
            }`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <image href={logoSrc} width="4500" height="1964" />
            <line x1="2640" y1="1146" x2="3410" y2="1146" stroke={isLight ? '#16A34A' : '#22C55E'} strokeWidth="18" strokeLinecap="round" />
            <text
              x="3025"
              y="1388"
              textAnchor="middle"
              fontFamily="'Montserrat', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="155"
              fontWeight="800"
              fill={isLight ? '#15803D' : '#4ADE80'}
              letterSpacing="0.30em"
              style={{ textRendering: 'geometricPrecision' }}
            >
              VERIFIED
            </text>
          </svg>
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{ containerType: 'size', aspectRatio: '3.5 / 1' }}
            role="img"
            aria-label="Gorilla Verified"
          >
            {/* Ring: transparent looping clip (7 s) */}
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              onError={() => setVideoFailed(true)}
              className="shrink-0 object-contain pointer-events-none"
              style={{ height: '118cqh', width: '106cqh', marginRight: '-6cqh', filter: isLight ? 'drop-shadow(0 8px 14px rgba(15,23,42,0.10))' : 'drop-shadow(0 10px 22px rgba(0,0,0,0.6))' }}
            >
              <source src="/brand/gorilla-verify-ring.webm" type="video/webm" onError={() => setVideoFailed(true)} />
            </video>

            {/* Wordmark framed by scanner corners */}
            <div className="relative flex flex-col items-center justify-center px-[11cqh] py-[10cqh]">
              {[
                'top-0 left-0 border-t-2 border-l-2',
                'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2',
              ].map((c) => (
                <span key={c} className={`absolute w-[11cqh] h-[11cqh] ${c}`} style={{ borderColor: green }} />
              ))}
              <span
                className={`font-['Nunito',sans-serif] font-[900] leading-none tracking-tight ${isLight ? 'text-[#14170F]' : 'text-white'}`}
                style={{ fontSize: '31cqh' }}
              >
                GORILLA
              </span>
              <span className="block w-[44%] mt-[5cqh]" style={{ height: 1.5, background: green }} />
              <span
                className="font-sans font-extrabold leading-none mt-[4cqh]"
                style={{ color: isLight ? '#15803D' : '#4ADE80', fontSize: '8.5cqh', letterSpacing: '0.32em', paddingLeft: '0.32em' }}
              >
                VERIFIED
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const VerifyLogo = GorillaVerifyLogo;
export default GorillaVerifyLogo;
