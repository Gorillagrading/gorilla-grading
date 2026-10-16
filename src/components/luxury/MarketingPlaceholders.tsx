import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ShieldCheck, CheckCircle2, Star, Radio, Activity, ExternalLink } from 'lucide-react';

export const VerifiedAuditsSection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const reviews = [
    {
      id: 1,
      badge: language === 'es' ? 'AUDITORÍA VERIFICADA · ESPAÑA' : 'VERIFIED AUDIT · SPAIN',
      quote: language === 'es'
        ? '«La claridad óptica del acrílico y la precisión de los subgrades marcan una diferencia clara frente al estándar tradicional. El sellado ultrasónico da una rigidez total a cada cápsula.»'
        : '«The optical clarity of the acrylic and subgrade precision set a clear benchmark over traditional slabs. The ultrasonic seal delivers total structural rigidity.»',
      author: language === 'es' ? 'Distribuidor Especializado TCG' : 'TCG Specialist Partner',
      location: language === 'es' ? 'Madrid · Certificación de lote' : 'Madrid · Certified batch audit',
      monogram: 'TCG'
    },
    {
      id: 2,
      badge: language === 'es' ? 'COLECCIONISTA PRIVADO · EUROPA' : 'PRIVATE COLLECTOR · EUROPE',
      quote: language === 'es'
        ? '«Plazos de entrega estrictos y una trazabilidad impecable en cada paso del proceso. La protección contra radiación UV y la presentación en mano superaron mis expectativas.»'
        : '«Strict turnaround times and flawless traceability at every step. The UV protection barrier and in-hand presentation exceeded all expectations.»',
      author: language === 'es' ? 'Coleccionista Vintage & Modern' : 'Vintage & Modern Collector',
      location: language === 'es' ? 'Barcelona · Envío de alta gama' : 'Barcelona · High-tier submission',
      monogram: 'V&M'
    }
  ];

  return (
    <section 
      id="testimonials"
      className={`w-full py-10 sm:py-12 lg:py-14 px-6 lg:px-12 border-b select-none transition-colors duration-300 ${
        isLight ? 'bg-transparent text-[#111827] border-[#E5E7EB]' : 'bg-transparent text-white border-white/[0.08]'
      }`}
    >
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-10">
        
        {/* Left Header */}
        <div className="w-full md:w-1/3 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2 mb-3">
            <span className={`font-mono text-[10px] tracking-[0.25em] uppercase font-bold ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>
              [ AUDITORÍAS · EXPERTOS INDEPENDIENTES ]
            </span>
          </div>

          <h2 className={`font-['Nunito',sans-serif] text-3xl sm:text-4xl font-[900] tracking-normal uppercase leading-tight mb-4 ${
            isLight ? 'text-gray-950' : 'text-white'
          }`}>
            {language === 'es' ? 'VERIFICADO POR EXPERTOS' : 'VERIFIED BY EXPERTS'}
          </h2>

          <p className={`font-sans text-xs sm:text-sm max-w-sm ${isLight ? 'text-gray-600' : 'text-[#A4ACA1]'}`}>
            {language === 'es'
              ? 'Coleccionistas de alto nivel y tiendas europeas de referencia confían en nuestro laboratorio.'
              : 'High-end collectors and leading European hobby shops rely on our optical laboratory.'}
          </p>
        </div>
        
        {/* Right Testimonials Cards */}
        <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {reviews.map((rev) => (
            <div 
              key={rev.id} 
              className={`p-7 border flex flex-col justify-between min-h-[220px] transition-all duration-300 ${
                isLight 
                  ? 'bg-white/80 border-gray-200 shadow-sm hover:border-gray-400' 
                  : 'bg-[#141814]/70 border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`font-mono text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 border ${
                    isLight 
                      ? 'border-gray-300 text-gray-700 bg-gray-50' 
                      : 'border-white/15 text-gray-300 bg-white/[0.03]'
                  }`}>
                    {rev.badge}
                  </span>
                  <span className="font-mono text-[9px] opacity-40">
                    N° 0{rev.id}
                  </span>
                </div>

                <p className={`font-sans text-xs sm:text-[13px] leading-relaxed italic ${
                  isLight ? 'text-gray-800' : 'text-gray-200'
                }`}>
                  {rev.quote}
                </p>
              </div>

              <div className={`flex items-center gap-3.5 mt-6 pt-4 border-t ${
                isLight ? 'border-gray-100' : 'border-white/10'
              }`}>
                <div className={`w-9 h-9 border flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                  isLight 
                    ? 'border-gray-300 bg-gray-100 text-gray-900' 
                    : 'border-white/20 bg-white/[0.04] text-white'
                }`}>
                  {rev.monogram}
                </div>
                <div className="flex flex-col">
                  <span className={`font-mono text-xs font-bold ${
                    isLight ? 'text-gray-950' : 'text-white'
                  }`}>
                    {rev.author}
                  </span>
                  <span className="font-sans text-[11px] opacity-60">
                    {rev.location}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export const LiveLabActivitySection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Espacios reservados para publicaciones oficiales reales
  const reelSlots = [
    { id: 1, platform: 'INSTAGRAM REEL', handle: '@gorillagradinginternational' },
    { id: 2, platform: 'TIKTOK', handle: '@gorillagrading' },
    { id: 3, platform: 'INSTAGRAM REEL', handle: '@gorillagradinginternational' },
    { id: 4, platform: 'TIKTOK', handle: '@gorillagrading' }
  ];

  return (
    <section 
      id="community-reels"
      className={`w-full py-8 sm:py-10 px-6 lg:px-12 border-b select-none transition-colors duration-300 ${
        isLight ? 'bg-white/60 backdrop-blur-md border-[#E5E7EB]' : 'bg-[#141714]/60 backdrop-blur-md border-white/[0.08]'
      }`}
    >
      <div className="max-w-[1100px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-[9px] tracking-[0.25em] uppercase font-bold ${
                isLight ? 'text-gray-900' : 'text-white'
              }`}>
                [ CANALES OFICIALES · INSTAGRAM & TIKTOK ]
              </span>
            </div>

            <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-normal uppercase leading-tight ${
              isLight ? 'text-gray-950' : 'text-white'
            }`}>
              {language === 'es' ? 'COMUNIDAD EN ACCIÓN' : 'COMMUNITY IN ACTION'}
            </h2>

            <p className={`mt-1 font-sans text-xs sm:text-sm max-w-lg ${
              isLight ? 'text-gray-600' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'Únete a la comunidad, síguenos para consejos de graduación, cultura coleccionista y eventos en vivo.'
                : 'Join the crew, follow us for grading tips, collector culture and live events.'}
            </p>
          </div>

          {/* Social Channels Direct Badges */}
          <div className="flex items-center gap-2.5 shrink-0">
            <a 
              href="https://instagram.com/gorillagradinginternational" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`px-3 py-1.5 border font-mono text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white border-gray-300 text-gray-900 hover:border-black shadow-xs' 
                  : 'bg-white/[0.04] border-white/15 text-white hover:border-white'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.668.014-4.948.072-4.354.2-6.782 2.618-6.979 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>Instagram Reels</span>
            </a>

            <a 
              href="https://tiktok.com/@gorillagrading" 
              target="_blank" 
              rel="noopener noreferrer"
              className={`px-3 py-1.5 border font-mono text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
                isLight 
                  ? 'bg-white border-gray-300 text-gray-900 hover:border-black shadow-xs' 
                  : 'bg-white/[0.04] border-white/15 text-white hover:border-white'
              }`}
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.66 2.94 2.94 0 011.66.52V9.38a6.32 6.32 0 00-1.66-.22 6.35 6.35 0 00-6.35 6.35 6.35 6.35 0 0012.7 0v-8.62a8.3 8.3 0 005.76 2.33v-3.45a4.84 4.84 0 01-2-1.08z"/>
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>

        {/* 4-Item Compact Video Placeholder Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reelSlots.map((slot) => (
            <div 
              key={slot.id}
              className={`relative h-[250px] sm:h-[270px] border border-dashed overflow-hidden flex flex-col justify-between p-4 transition-all duration-300 ${
                isLight 
                  ? 'bg-white/60 border-gray-300 shadow-sm' 
                  : 'bg-[#101410]/70 border-white/10'
              }`}
            >
              {/* Top Meta Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border border-current opacity-60">
                  {slot.platform}
                </span>
                <span className="font-mono text-[9px] opacity-40">
                  SLOT 0{slot.id}
                </span>
              </div>

              {/* Central Clean Icon */}
              <div className="self-center flex flex-col items-center gap-2 opacity-50">
                <div className={`w-9 h-9 rounded-full border border-dashed flex items-center justify-center ${
                  isLight ? 'border-gray-400 text-gray-400' : 'border-white/30 text-white/40'
                }`}>
                  <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-center max-w-[130px]">
                  {language === 'es' ? 'Vídeo oficial en preparación' : 'Official media in production'}
                </span>
              </div>

              {/* Bottom Channel Link */}
              <div className="pt-2.5 border-t border-dashed border-gray-200 dark:border-white/10 flex items-center justify-between">
                <span className={`font-mono text-[9px] font-semibold truncate max-w-[140px] ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {slot.handle}
                </span>
                <span className="font-mono text-[9px] opacity-40 shrink-0">
                  HD
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

// Aliases for clean backward compatibility
export const InfluencerTestimonialsPlaceholder = VerifiedAuditsSection;
export const SocialProofPlaceholder = LiveLabActivitySection;
export const TiktokReviewsPlaceholder = LiveLabActivitySection;

