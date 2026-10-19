import React from 'react';

interface GorillaShieldIconProps {
  className?: string;
  size?: number;
  shieldColor?: string;
  letterColor?: string;
}

export const GorillaShieldIcon: React.FC<GorillaShieldIconProps> = ({
  className = "w-6 h-6",
  size,
  shieldColor = "#0A0D0A",
  letterColor = "#2EA366"
}) => {
  return (
    <svg
      viewBox="0 0 100 115"
      className={className}
      style={size ? { width: size, height: size * 1.15 } : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Shield with rounded corners and authentic curvature */}
      <path
        d="M10 8 C10 4, 14 0, 18 0 L82 0 C86 0, 90 4, 90 8 L90 55 C90 82, 56 108, 52 112 C51 113, 49 113, 48 112 C44 108, 10 82, 10 55 Z"
        fill={shieldColor}
      />
      {/* Bold Cutout of letter 'G' matching Gorilla Grading logo */}
      <path
        d="M50 25 C34 25, 23 35, 23 54 C23 72, 34 83, 50 83 C62 83, 71 77, 75 68 L64 68 C61 72, 56 75, 50 75 C39 75, 32 67, 32 54 C32 41, 39 33, 50 33 C57 33, 62 36, 65 41 L76 34 C70 28, 61 25, 50 25 Z M50 49 L76 49 L76 72 L67 72 L67 57 L50 57 Z"
        fill={letterColor}
      />
    </svg>
  );
};
