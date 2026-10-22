import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface ServicesPageProps {
  onNavigate: (path: string) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const tiers = [
    {
      id: 'standard',
      name: 'Standard',
      tagline: language === 'es'
        ? 'Diseñado para sets modernos de expansión, colecciones personales y envíos por volumen.'
        : 'Engineered for modern sets, expansion binders, and personal collections.',
      price: '19',
      turnaround: language === 'es' ? '10 Días Hábiles' : '10 Business Days',
      maxValue: '€500',
      badge: null,
      featured: false,
      features: [
        t('pricing.feat.slab'),
        t('pricing.feat.nfc'),
        t('pricing.feat.insurance'),
        language === 'es' ? 'Centrado láser automatizado' : 'Automated laser centering',
        language === 'es' ? 'Escaneo digital de alta resolución' : 'High-resolution digital scan'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      tagline: language === 'es'
        ? 'El estándar recomendado para cartas de valor medio y piezas emblemáticas con subgrados.'
        : 'The recommended standard for mid-to-high value cards and iconic holos with subgrades.',
      price: '25',
      turnaround: language === 'es' ? '5 Días Hábiles' : '5 Business Days',
      maxValue: '€1.500',
      badge: t('pricing.badgePopular'),
      featured: true,
      features: [
        t('pricing.feat.subgrades'),
        t('pricing.feat.scans'),
        t('pricing.feat.slab'),
        t('pricing.feat.nfc'),
        t('pricing.feat.insurance')
      ]
    },
    {
      id: 'express',
      name: 'Express',
      tagline: language === 'es'
        ? 'Procesamiento acelerado en cola preferente para torneos y grading de alta demanda.'
        : 'Accelerated queue in high-security vault for tournaments and urgent market liquidity.',
      price: '50',
      turnaround: language === 'es' ? '2 Días Hábiles' : '2 Business Days',
      maxValue: '€3.000',
      badge: language === 'es' ? 'ALTA PRIORIDAD' : 'PRIORITY QUEUE',
      featured: false,
      features: [
        t('pricing.feat.subgrades'),
        t('pricing.feat.scans'),
        t('pricing.feat.slab'),
        t('pricing.feat.priority'),
        t('pricing.feat.insurance')
      ]
    },
    {
      id: 'event',
      name: 'Event',
      tagline: language === 'es'
        ? 'Servicio exclusivo para eventos y pop-ups. Solo entrega presencial en pop ups.'
        : 'Exclusive service for events and pop-ups. In-person drop-off only at pop ups.',
      price: '15',
      turnaround: '48 h',
      maxValue: '€1.000',
      badge: language === 'es' ? 'POP UP PRESENCIAL' : 'POP UP IN-PERSON',
      featured: false,
      features: [
        language === 'es' ? 'Solo entrega presencial en pop ups' : 'In-person drop-off only at pop ups',
        language === 'es' ? 'Entrega exprés en mano en 48 horas' : 'Express 48h in-person turnaround',
        t('pricing.feat.slab'),
        t('pricing.feat.nfc'),
        t('pricing.feat.scans')
      ]
    }
  ];

  const tiersWithTheme = tiers.map(t => {
    switch(t.id) {
      case 'standard': return { ...t, color: '#48C765', shortName: 'STANDARD' };
      case 'premium': return { ...t, color: '#48C765', shortName: 'PREMIUM' };
      case 'express': return { ...t, color: '#48C765', shortName: 'EXPRESS' };
      case 'event': return { ...t, color: '#48C765', shortName: 'EVENT' };
      default: return { ...t, color: '#48C765', shortName: 'TIER' };
    }
  });

  const comparisonRows = [
    {
      feature: language === 'es' ? 'Centrado por Calibre Láser (0.01 mm)' : 'Laser Caliper Centering (0.01mm)',
      standard: true, premium: true, express: true, event: true
    },
    {
      feature: language === 'es' ? '4 Sub-grados en décimas (Centrado, Esquinas, Bordes, Superficie)' : '4-Quadrant Subgrades (0.1 decimal scale)',
      standard: false, premium: true, express: true, event: false
    },
    {
      feature: language === 'es' ? 'Mapeo microscópico de defectos a 40x' : '40x Darkfield microscopic defect mapping',
      standard: false, premium: true, express: true, event: false
    },
    {
      feature: language === 'es' ? 'Encapsulado sónico hermético a 35 kHz (Acrílico UV 99.4%)' : '35kHz Ultrasonic Hermetic Seal (99.4% UV Acrylic)',
      standard: true, premium: true, express: true, event: true
    },
    {
      feature: language === 'es' ? 'Chip Criptográfico NFC con enlace al Registro Internacional' : 'Cryptographic NFC chip linked to International Registry',
      standard: true, premium: true, express: true, event: true
    },
    {
      feature: language === 'es' ? 'Cola preferente en cámara acorazada climatizada' : 'Priority queue in climate-controlled vault',
      standard: false, premium: false, express: true, event: true
    },
    {
      feature: language === 'es' ? 'Solo entrega presencial en pop ups / eventos' : 'In-person drop-off only at pop ups / events',
      standard: false, premium: false, express: false, event: true
    },
    {
      feature: language === 'es' ? 'Seguro de transporte a todo riesgo incluido' : 'Full replacement transit insurance included',
      standard: true, premium: true, express: true, event: true
    }
  ];

  return (
    <div className={`w-full min-h-screen py-16 px-6 lg:px-12 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#454545] text-white'
    }`}>
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Banner */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-none border font-mono text-[11px] font-bold tracking-[0.25em] uppercase mb-4 ${
            isLight 
              ? 'bg-[#15803D]/10 border-[#15803D]/30 text-[#15803D]' 
              : 'bg-white/[0.04] border-white/10 text-[#48C765]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-none ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`} />
            <span>{t('pricing.kicker')}</span>
          </div>

          <h1 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl uppercase tracking-normal leading-[1.05] mb-5 ${
            isLight ? 'text-[#14170F]' : 'text-white'
          }`}>
            {language === 'es' ? 'TARIFAS Y NIVELES DE ' : 'GRADING TIERS & '}
            <span className={isLight ? 'text-[#15803D]' : 'text-[#48C765]'}>
              {language === 'es' ? 'SERVICIO' : 'PRICING'}
            </span>
          </h1>

          <p className={`font-sans text-base max-w-2xl mx-auto leading-relaxed font-normal ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {t('pricing.desc')}
          </p>
        </div>

        {/* 4 Obsidian Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-20">
          {tiersWithTheme.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl flex flex-col justify-between transition-all duration-700 relative group/card cursor-pointer border hover:scale-[1.02] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden ${
                tier.featured ? 'md:-translate-y-2' : ''
              }`}
              style={{
                background: `linear-gradient(160deg, #161A17 0%, #0A0D0B 100%)`,
                borderColor: `${tier.color}40`,
              }}
            >
              {/* Massive Typography Watermark */}
              <div 
                className="absolute -right-4 -bottom-6 text-[80px] font-black opacity-[0.03] pointer-events-none select-none tracking-tighter leading-none whitespace-nowrap transition-all duration-700 font-['Nunito',sans-serif]" 
                style={{ color: tier.color }}
              >
                {tier.shortName}
              </div>

              {/* Glowing Orb inside the card */}
              <div 
                className="absolute top-0 right-0 w-[200px] h-[200px] blur-[60px] rounded-full pointer-events-none opacity-20 transition-colors duration-700 translate-x-1/3 -translate-y-1/3"
                style={{ backgroundColor: tier.color }}
              />

              {/* Noise Texture Overlay */}
              <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-20 pointer-events-none mix-blend-overlay z-0" />

              {/* Glass Reflection Sheen */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-transparent translate-x-[-150%] group-hover/card:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out pointer-events-none z-20" />

              <div className="p-7 flex flex-col justify-between h-full relative z-10">
                {/* Badge if present */}
                <div className="h-6 mb-3">
                  {tier.badge && (
                    <span className="inline-block font-mono text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-0.5 rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                      style={{ backgroundColor: tier.featured ? tier.color : 'rgba(255,255,255,0.1)', color: tier.featured ? '#14170F' : '#FFF', borderColor: 'rgba(255,255,255,0.15)', borderWidth: tier.featured ? 0 : 1 }}
                    >
                      {tier.badge}
                    </span>
                  )}
                </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl text-white uppercase tracking-normal mb-2">
                  {tier.name}
                </h3>
                <p className="text-xs text-[#A4ACA1] font-sans leading-relaxed mb-6 min-h-[48px]">
                  {tier.tagline}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-1.5 pb-6 mb-6 border-b border-white/[0.08]">
                  <span className="font-mono text-xs text-[#A4ACA1] font-semibold">€</span>
                  <span className="font-['Nunito',sans-serif] font-[900] text-xl text-white tracking-tight">{tier.price}</span>
                  <span className="font-mono text-xs text-[#A4ACA1] ml-1">{t('pricing.cardUnit')}</span>
                </div>

                {/* Key Telemetry Stats */}
                <div className="space-y-3 font-mono text-xs mb-8">
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-[#A4ACA1] text-[11px] uppercase tracking-wider">{t('pricing.turnaroundPrefix')}</span>
                    <span className="text-white font-bold">{tier.turnaround}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-white/[0.04]">
                    <span className="text-[#A4ACA1] text-[11px] uppercase tracking-wider">{t('pricing.maxValuePrefix')}</span>
                    <span className="text-[#48C765] font-bold">{tier.maxValue}</span>
                  </div>
                </div>

                {/* Technical Features Checklist */}
                <ul className="space-y-2.5 text-xs text-[#A4ACA1] mb-8 font-sans">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-[#48C765] shrink-0 font-bold mt-0.5">✓</span>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Action */}
              <button
                onClick={() => onNavigate('/submit')}
                className="w-full py-3.5 px-4 rounded-sm font-mono text-xs font-bold tracking-[0.18em] uppercase transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border"
                style={{
                  backgroundColor: tier.featured ? tier.color : 'rgba(255,255,255,0.06)',
                  borderColor: tier.featured ? tier.color : 'rgba(255,255,255,0.1)',
                  color: tier.featured ? '#14170F' : '#FFF',
                  boxShadow: tier.featured ? `0 4px 20px ${tier.color}40` : 'none'
                }}
              >
                <span>{t('pricing.submitCta')}</span>
                <span className="transition-transform group-hover/card:translate-x-1">→</span>
              </button>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Technical Comparison Matrix */}
        <div className={`rounded-none border p-8 lg:p-10 mb-20 transition-colors duration-300 ${
          isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#0E130F] border-white/[0.08]'
        }`}>
          <div className="mb-8">
            <span className={`font-mono text-xs font-bold tracking-[0.25em] uppercase block mb-2 ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'AUDITORÍA COMPARATIVA' : 'FEATURE COMPARISON MATRIX'}
            </span>
            <h2 className={`font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl uppercase tracking-normal ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'Desglose Técnico por Nivel de Graduación' : 'Technical Breakdown by Service Tier'}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className={`border-b text-mono text-[11px] tracking-wider uppercase ${
                  isLight ? 'border-black/[0.08] text-[#4A5048]' : 'border-white/[0.08] text-[#A4ACA1]'
                }`}>
                  <th className="py-4 pr-6 font-semibold">{language === 'es' ? 'Especificación Técnica' : 'Technical Specification'}</th>
                  <th className="py-4 px-4 text-center">Standard</th>
                  <th className={`py-4 px-4 text-center ${isLight ? 'text-[#15803D]' : 'text-[#48C765]'}`}>Premium</th>
                  <th className="py-4 px-4 text-center">Express</th>
                  <th className="py-4 pl-4 text-center">Event</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-black/[0.05]' : 'divide-white/[0.04]'}`}>
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className={isLight ? 'hover:bg-black/[0.02] transition-colors' : 'hover:bg-white/[0.02] transition-colors'}>
                    <td className={`py-4 pr-6 font-medium ${isLight ? 'text-[#14170F]' : 'text-[#E0E5DC]'}`}>{row.feature}</td>
                    <td className="py-4 px-4 text-center">{row.standard ? <span className={isLight ? 'text-[#15803D] font-bold' : 'text-[#48C765] font-bold'}>✓</span> : <span className={isLight ? 'text-gray-400' : 'text-gray-600'}>—</span>}</td>
                    <td className="py-4 px-4 text-center">{row.premium ? <span className={isLight ? 'text-[#15803D] font-bold' : 'text-[#48C765] font-bold'}>✓</span> : <span className={isLight ? 'text-gray-400' : 'text-gray-600'}>—</span>}</td>
                    <td className="py-4 px-4 text-center">{row.express ? <span className={isLight ? 'text-[#15803D] font-bold' : 'text-[#48C765] font-bold'}>✓</span> : <span className={isLight ? 'text-gray-400' : 'text-gray-600'}>—</span>}</td>
                    <td className="py-4 pl-4 text-center">{row.event ? <span className={isLight ? 'text-[#15803D] font-bold' : 'text-[#48C765] font-bold'}>✓</span> : <span className={isLight ? 'text-gray-400' : 'text-gray-600'}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customs & Armored Transit Strip */}
        <div className={`rounded-none border p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 transition-colors duration-300 ${
          isLight 
            ? 'bg-[#EAE2D5] border-[#15803D]/40 shadow-sm' 
            : 'bg-gradient-to-r from-[#121E15] via-[#0E1611] to-[#121E15] border-[#48C765]/30'
        }`}>
          <div className="max-w-2xl">
            <span className={`font-mono text-xs font-bold tracking-[0.25em] uppercase mb-2 block ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'GARANTÍA DE TRANSPORTE Y PROPIEDAD' : 'CHAIN OF CUSTODY GUARANTEE'}
            </span>
            <h3 className={`font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl uppercase tracking-normal mb-3 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' 
                ? 'Protección Integral y Cobertura Internacional Asegurada' 
                : 'Comprehensive Protection Across International Transit'}
            </h3>
            <p className={`font-sans text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'Todos los envíos se gestionan mediante contratos directos con mensajería blindada (GLS Express / DHL Express) con firma obligatoria, seguro de reposición del 100% y sin intermediarios aduaneros.'
                : 'All shipments are managed under direct contracts with certified armored carriers (GLS / DHL Express) featuring mandatory signature, 100% replacement insurance, and zero customs paperwork.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <button
              onClick={() => onNavigate('/submit')}
              className="btn-gorilla-square px-8 py-4 text-xs font-extrabold tracking-normal shadow-lg cursor-pointer"
            >
              {language === 'es' ? 'INICIAR SOLICITUD AHORA' : 'START SUBMISSION NOW'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
