import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const steps = [
    {
      num: t('how.step1.num'),
      title: t('how.step1.title'),
      sub: t('how.step1.sub'),
      desc: t('how.step1.desc'),
      tag: language === 'es' ? 'FASE 01 · CÁMARA ACORAZADA' : 'PHASE 01 · SECURE VAULT'
    },
    {
      num: t('how.step2.num'),
      title: t('how.step2.title'),
      sub: t('how.step2.sub'),
      desc: t('how.step2.desc'),
      tag: language === 'es' ? 'FASE 02 · SALA LIMPIA ISO' : 'PHASE 02 · ISO CLEANROOM'
    },
    {
      num: t('how.step3.num'),
      title: t('how.step3.title'),
      sub: t('how.step3.sub'),
      desc: t('how.step3.desc'),
      tag: language === 'es' ? 'FASE 03 · ESPECTROMETRÍA' : 'PHASE 03 · SPECTROMETRY'
    },
    {
      num: t('how.step4.num'),
      title: t('how.step4.title'),
      sub: t('how.step4.sub'),
      desc: t('how.step4.desc'),
      tag: language === 'es' ? 'FASE 04 · CALIBRE LÁSER' : 'PHASE 04 · LASER CALIPER'
    },
    {
      num: t('how.step5.num'),
      title: t('how.step5.title'),
      sub: t('how.step5.sub'),
      desc: t('how.step5.desc'),
      tag: language === 'es' ? 'FASE 05 · CAMPO OSCURO 40X' : 'PHASE 05 · 40X DARKFIELD'
    },
    {
      num: t('how.step6.num'),
      title: t('how.step6.title'),
      sub: t('how.step6.sub'),
      desc: t('how.step6.desc'),
      tag: language === 'es' ? 'FASE 06 · FUSIÓN 35 KHZ' : 'PHASE 06 · 35 KHZ FUSION'
    }
  ];

  const labSpecs = [
    {
      title: language === 'es' ? 'Ambiente Sala Limpia ISO 7' : 'ISO Class 7 Cleanroom Environment',
      spec: '< 10.000 part/m³',
      desc: language === 'es' 
        ? 'Filtración de aire continua HEPA 99.97% para evitar que partículas microscópicas de polvo queden atrapadas en el slab.'
        : 'Continuous 99.97% HEPA air filtration ensuring zero airborne particulates are trapped inside the sealed holder.'
    },
    {
      title: language === 'es' ? 'Acrílico Óptico Virgen Libre de Ácido' : 'Virgin Optical-Grade Acid-Free Acrylic',
      spec: '99.4% Filtro UV',
      desc: language === 'es'
        ? 'Polímero numismático puro sin plastificantes volátiles ni vapores químicos que puedan desteñir la tinta original.'
        : 'Pure archival polymer formulated without volatile plasticizers or harmful vapors that degrade original cardstock.'
    },
    {
      title: language === 'es' ? 'Calibre Láser Multieje Submilimétrico' : 'Sub-Millimeter Multi-Axis Laser Caliper',
      spec: '±0.01 mm',
      desc: language === 'es'
        ? 'Medición geométrica automatizada de márgenes frontales y posteriores con cálculo de ratio de centrado exacto.'
        : 'Automated geometric scanning of front and back margins calculating mathematically accurate border ratios.'
    },
    {
      title: language === 'es' ? 'Soldadura Molecular Ultrasónica' : 'Ultrasonic Molecular Hermetic Fusion',
      spec: '35 kHz',
      desc: language === 'es'
        ? 'Sellado molecular sin pegamentos químicos ni solventes orgánicos. Creación de una barrera hermética contra humedad.'
        : 'Adhesive-free molecular fusion eliminating chemical glues. Yields a permanent hermetic barrier against moisture.'
    }
  ];

  return (
    <div className={`w-full min-h-screen py-16 px-6 lg:px-12 select-none transition-colors duration-300 ${
      isLight ? 'bg-[#FAF8F5] text-[#1A1D1A]' : 'bg-[#454545] text-white'
    }`}>
      <div className="max-w-[1400px] mx-auto">
        
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Left decorative line */}
            <div className={`hidden sm:block h-[1px] w-12 ${
              isLight ? 'bg-[#2D9A46]/30' : 'bg-[#48C765]/30'
            }`} />
            
            {/* Badge content */}
            <div className="flex items-center gap-2.5">
              <div className={`w-5 h-5 flex items-center justify-center ${
                isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
              }`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                </svg>
              </div>
              <span className={`font-mono text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase ${
                isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
              }`}>
                {t('how.kicker')}
              </span>
            </div>

            {/* Right decorative line */}
            <div className={`hidden sm:block h-[1px] w-12 ${
              isLight ? 'bg-[#2D9A46]/30' : 'bg-[#48C765]/30'
            }`} />
          </div>

          <h1 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl uppercase tracking-normal leading-[1.05] mb-5 ${
            isLight ? 'text-[#1A1D1A]' : 'text-white'
          }`}>
            {language === 'es' ? 'EL VIAJE DESDE CARTA CRUDA HASTA ' : 'THE JOURNEY FROM RAW CARD TO '}
            <span className={isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}>{language === 'es' ? 'SLAB CERTIFICADO' : 'CERTIFIED SLAB'}</span>
          </h1>

          <p className={`font-sans text-base max-w-2xl mx-auto leading-relaxed font-normal ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {t('how.desc')}
          </p>
        </div>

        {/* 6-Step Visual Timeline */}
        <div className="space-y-6 mb-20">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-none border shadow-xl flex flex-col md:flex-row items-start md:items-center gap-8 transition-all duration-300 group ${
                isLight
                  ? 'bg-white border-[#DDD6C9] hover:border-[#2D9A46]/40 hover:bg-[#F5F2EC] hover:shadow-[0_8px_30px_rgba(45,154,70,0.06)]'
                  : 'bg-[#454545] border-white/[0.08] hover:border-[#48C765]/40 hover:bg-[#151B16]'
              }`}
            >
              {/* Numeric Indicator */}
              <div className="flex items-center gap-4 shrink-0">
                <span className={`font-['Nunito',sans-serif] font-[900] text-xl tracking-tight group-hover:scale-105 transition-transform ${
                  isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
                }`}>
                  {step.num}
                </span>
                <span className={`font-mono text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded border ${
                  isLight
                    ? 'text-[#4A5048] bg-[#ECE5D8] border-[#DDD6C9]'
                    : 'text-[#A4ACA1] bg-white/[0.04] border-white/5'
                }`}>
                  {step.tag}
                </span>
              </div>

              {/* Text Info */}
              <div className="flex-1 space-y-1.5">
                <h3 className={`font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl uppercase tracking-normal transition-colors ${
                  isLight
                    ? 'text-[#1A1D1A] group-hover:text-[#2D9A46]'
                    : 'text-white group-hover:text-[#48C765]'
                }`}>
                  {step.title}
                </h3>
                <h4 className={`font-mono text-xs font-medium leading-snug ${
                  isLight ? 'text-[#2D9A46]' : 'text-[#A2B5A5]'
                }`}>
                  {step.sub}
                </h4>
                <p className={`text-xs sm:text-sm leading-relaxed font-normal pt-1 ${
                  isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                }`}>
                  {step.desc}
                </p>
              </div>

              {/* Telemetry Badge */}
              <div className={`shrink-0 self-center md:self-auto hidden lg:flex flex-col items-end text-right font-mono text-[10px] border-l pl-6 py-2 ${
                isLight ? 'text-[#6B7268] border-[#DDD6C9]' : 'text-[#A4ACA1] border-white/[0.06]'
              }`}>
                <span className="font-semibold">{language === 'es' ? 'AUDITORÍA ÓPTICA' : 'OPTICAL AUDIT'}</span>
                <span className={`font-bold ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>100% REPRODUCIBLE</span>
              </div>
            </div>
          ))}
        </div>

        {/* Technical Lab Specifications Matrix */}
        <div className={`rounded-none border p-8 lg:p-12 mb-20 transition-colors duration-300 ${
          isLight
            ? 'bg-[#ECE5D8] border-[#DDD6C9]'
            : 'bg-[#0E130F] border-white/[0.08]'
        }`}>
          <div className="mb-10">
            <span className={`font-mono text-xs font-bold tracking-[0.25em] uppercase block mb-2 ${
              isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'ESPECIFICACIONES DEL LABORATORIO' : 'LABORATORY SPECIFICATIONS'}
            </span>
            <h2 className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-4xl uppercase tracking-normal ${
              isLight ? 'text-[#1A1D1A]' : 'text-white'
            }`}>
              {language === 'es' ? 'Ingeniería y Parámetros Numismáticos' : 'Engineering & Numismatic Parameters'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {labSpecs.map((spec, idx) => (
              <div 
                key={idx} 
                className={`p-8 rounded-none border flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden ${
                  isLight
                    ? 'bg-white border-[#DDD6C9] hover:border-[#2D9A46]/40 hover:shadow-[0_8px_30px_rgba(45,154,70,0.08)]'
                    : 'bg-[#121814] hover:bg-[#161d18] border-white/[0.06] hover:border-[#48C765]/40 hover:shadow-[0_8px_30px_rgba(72,199,101,0.08)]'
                }`}
              >
                <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent to-transparent transition-all duration-500 ${
                  isLight 
                    ? 'via-[#2D9A46]/0 group-hover:via-[#2D9A46]/80' 
                    : 'via-[#48C765]/0 group-hover:via-[#48C765]/80'
                }`} />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`w-1.5 h-1.5 rounded-none opacity-80 ${
                      isLight ? 'bg-[#2D9A46]' : 'bg-[#48C765]'
                    }`} />
                    <span className={`font-mono text-xs font-bold tracking-[0.15em] ${
                      isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
                    }`}>
                      {spec.spec}
                    </span>
                  </div>
                  <h4 className={`font-['Nunito',sans-serif] font-[900] text-xl uppercase tracking-normal mb-3 transition-colors duration-300 ${
                    isLight
                      ? 'text-[#1A1D1A] group-hover:text-[#2D9A46]'
                      : 'text-white group-hover:text-[#48C765]'
                  }`}>
                    {spec.title}
                  </h4>
                  <p className={`text-sm leading-relaxed font-normal ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {spec.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Mission & Founders Ethos */}
        <div className={`rounded-none border p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 transition-colors duration-300 ${
          isLight
            ? 'bg-gradient-to-r from-[#2D9A46]/8 via-[#2D9A46]/4 to-[#2D9A46]/8 border-[#2D9A46]/25'
            : 'bg-gradient-to-r from-[#121E15] via-[#0E1611] to-[#121E15] border-[#48C765]/30'
        }`}>
          <div className="max-w-2xl">
            <span className={`font-mono text-xs font-bold tracking-[0.25em] uppercase mb-2 block ${
              isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'MISIÓN INSTITUCIONAL' : 'INSTITUTIONAL ETHOS'}
            </span>
            <h3 className={`font-['Nunito',sans-serif] font-[900] text-lg sm:text-xl uppercase tracking-normal mb-3 ${
              isLight ? 'text-[#1A1D1A]' : 'text-white'
            }`}>
              {language === 'es' 
                ? 'Nuestra Misión: Erradicar la Subjetividad Ocular en el Coleccionismo Internacional' 
                : 'Our Mission: Eliminating Ocular Subjectivity Worldwide'}
            </h3>
            <p className={`font-sans text-xs sm:text-sm leading-relaxed mb-4 ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'Durante décadas, los coleccionistas han dependido de procesos manuales con criterios de graduación opacos, meses de espera e irreproducibilidad. Gorilla Grading nace para ofrecer la certeza científica de la óptica de precisión, trazabilidad criptográfica y máxima custodia para coleccionistas de todo el mundo.'
                : 'For decades, collectors have endured opaque, subjective grading criteria, inconsistent turnarounds, and lack of reproducible data. Gorilla Grading was founded to deliver scientific certainty via optical metrology, cryptographic traceability, and uncompromising custody for collectors worldwide.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-4">
            <button
              onClick={() => onNavigate('/services')}
              className="btn-gorilla-square-secondary px-6 py-4 text-xs font-bold tracking-normal"
            >
              {language === 'es' ? 'VER TARIFAS' : 'VIEW PRICING'}
            </button>
            <button
              onClick={() => onNavigate('/submit')}
              className="btn-gorilla-square px-8 py-4 text-xs font-extrabold tracking-normal shadow-lg"
            >
              {language === 'es' ? 'ENVIAR CARTAS' : 'SUBMIT CARDS'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
