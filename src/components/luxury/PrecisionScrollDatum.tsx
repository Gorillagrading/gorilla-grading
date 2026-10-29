import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const PrecisionScrollDatum: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { language = 'es' } = useLanguage();

  // Interactive mouse position tracking for dynamic optical spotlight
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [scanTelemetryIndex, setScanTelemetryIndex] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Cycling forensic scan telemetry status (synchronized with 18s scan cycle: top, middle, bottom)
  useEffect(() => {
    const interval = setInterval(() => {
      setScanTelemetryIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Clear any legacy localStorage theme override
  useEffect(() => {
    localStorage.removeItem('gorilla_bg_atmosphere');
  }, []);

  const telemetryData = {
    es: [
      {
        tag: 'CALIBRANDO MATRIZ ÓPTICA',
        title: 'INSPECCIÓN LITOGRÁFICA Y DE CENTRADO',
        flaw: 'RESOLUCIÓN 1200 DPI',
        code: 'λ: 532nm'
      },
      {
        tag: '⚠ ERROR EN CARTA DETECTADO',
        title: 'DEFECTO DE IMPRESIÓN [0.03mm] · SUPERFICIE',
        flaw: 'DESVIACIÓN DE CENTRADO 58/42 · SUB-GRADE: 8.5',
        code: 'ANOMALÍA #E-8849'
      },
      {
        tag: 'AUDITORÍA FORENSE COMPLETADA',
        title: 'AUTENTICIDAD CRIPTOGRÁFICA VERIFICADA',
        flaw: 'REGISTRO PÚBLICO DE CERTIFICADOS',
        code: 'REGISTRO OK'
      }
    ],
    en: [
      {
        tag: 'CALIBRATING OPTICAL MATRIX',
        title: 'LITHO ROSETTE & CENTERING INSPECTION',
        flaw: 'RESOLUTION 1200 DPI',
        code: 'λ: 532nm'
      },
      {
        tag: '⚠ CARD FLAW DETECTED',
        title: 'PRINT DEFECT [0.03mm] · SURFACE ANOMALY',
        flaw: 'CENTERING BIAS 58/42 · SUB-GRADE: 8.5',
        code: 'ANOMALY #E-8849'
      },
      {
        tag: 'FORENSIC AUDIT COMPLETED',
        title: 'CRYPTOGRAPHIC AUTHENTICITY CONFIRMED',
        flaw: 'PUBLIC CERTIFICATE REGISTRY',
        code: 'REGISTRY OK'
      }
    ]
  };

  const currentTelemetry = (language === 'en' ? telemetryData.en : telemetryData.es)[scanTelemetryIndex];

  return (
    <div 
      aria-hidden="true" 
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-colors duration-700 ${
        isLight ? 'bg-[#FAF9F6]' : 'bg-[#060806]'
      }`}
    >
      {/* 1. Underlying Deep Ambient Base */}
      <div 
        className="absolute inset-0"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at 50% 30%, #FFFFFF 0%, #FAF8F5 50%, #F3EFE9 100%)'
            : 'radial-gradient(ellipse at 50% 35%, #0B0E0B 0%, #060806 60%, #030403 100%)'
        }}
      />

      {/* ═════════════════════════════════════════════════════════════════════
          4. FONDO DE PUNTOS LITOGRÁFICOS SUTILES
          ═════════════════════════════════════════════════════════════════════ */}
      
      {/* Layer 4A: Puntos Litográficos Principales */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle, rgba(0, 0, 0, 0.10) 1.15px, transparent 1.25px)'
            : 'radial-gradient(circle, rgba(255, 255, 255, 0.14) 1.15px, transparent 1.25px)',
          backgroundSize: '9px 9px',
          mixBlendMode: isLight ? 'multiply' : 'screen',
          opacity: isLight ? 0.62 : 0.65
        }}
      />

      {/* Layer 4B: Puntos Rosette Escalonados (Efecto laboratorio auténtico) */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'radial-gradient(circle, rgba(22, 101, 52, 0.05) 0.85px, transparent 0.95px)'
            : 'radial-gradient(circle, rgba(74, 222, 128, 0.10) 0.85px, transparent 0.95px)',
          backgroundSize: '9px 9px',
          backgroundPosition: '4.5px 4.5px',
          mixBlendMode: isLight ? 'multiply' : 'screen',
          opacity: 0.50
        }}
      />

      {/* Layer 4C: Iluminación interactiva suave con el cursor (solo en modo claro) */}
      {isLight && mousePos.x !== -1000 && (
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(460px circle at ${mousePos.x}px ${mousePos.y}px, ${
              'rgba(34, 197, 94, 0.07)'
            } 0%, transparent 80%)`,
          }}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          5. BASE METROLÓGICA Y COORDENADAS DISCRETAS EN ESQUINA
          ═════════════════════════════════════════════════════════════════════ */}

      {/* ═════════════════════════════════════════════════════════════════════
          6. COORDENADAS DISCRETAS EN ESQUINA (Puro Texto Sin Caja Ni Círculos)
          ═════════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:flex absolute bottom-3 right-6 pointer-events-none items-center gap-2 font-mono text-[7px] tracking-widest text-emerald-500/40 uppercase">
        <span>GORILLA FORENSIC SCANNER</span>
        {mousePos.x !== -1000 && (
          <>
            <span className="opacity-30">·</span>
            <span>X:{Math.round(mousePos.x)} Y:{Math.round(mousePos.y)}</span>
          </>
        )}
      </div>

      {/* 7. Subtle Edge Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse at 50% 50%, transparent 68%, rgba(0,0,0,0.03) 100%)'
            : 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.72) 100%)'
        }}
      />
    </div>
  );
};

export default PrecisionScrollDatum;



