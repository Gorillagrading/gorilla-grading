import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Heart, Images, MessageCircle, Play, Send } from 'lucide-react';
import { fetchInstagramPosts } from '../../api/instagram';
import type { InstagramPostDto } from '../../../shared/instagram';

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
                  : 'bg-[#3B3B3B]/70 border-white/10 hover:border-white/20'
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

const InstagramGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.668.014-4.948.072-4.354.2-6.782 2.618-6.979 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const INSTAGRAM_URL = 'https://instagram.com/gorillagradinginternational';
const TIKTOK_URL = 'https://tiktok.com/@gorillagrading';

export const LiveLabActivitySection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';

  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [posts, setPosts] = useState<InstagramPostDto[]>([]);

  // Las publicaciones se piden cuando la sección está a punto de verse: así no gastan tiempo al abrir la web.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const load = () => {
      setState('loading');
      fetchInstagramPosts()
        .then((r) => {
          if (cancelled) return;
          setPosts(r.posts.slice(0, 4));
          setState(r.configured && r.posts.length > 0 ? 'ready' : 'unavailable');
        })
        .catch(() => {
          if (!cancelled) setState('unavailable');
        });
    };
    if (typeof IntersectionObserver === 'undefined') {
      load();
      return () => {
        cancelled = true;
      };
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          load();
        }
      },
      { rootMargin: '500px' },
    );
    obs.observe(el);
    return () => {
      cancelled = true;
      obs.disconnect();
    };
  }, []);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(es ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const channelLink = `px-3 py-1.5 border font-mono text-[11px] flex items-center gap-2 transition-all cursor-pointer ${
    isLight ? 'bg-white border-gray-300 text-gray-900 hover:border-black shadow-xs' : 'bg-white/[0.04] border-white/15 text-white hover:border-white'
  }`;

  return (
    <section
      ref={ref}
      id="community-reels"
      className={`w-full py-8 sm:py-10 px-6 lg:px-12 border-b select-none transition-colors duration-300 ${
        isLight ? 'bg-white/60 backdrop-blur-md border-[#E5E7EB]' : 'bg-[#3B3B3B]/60 backdrop-blur-md border-white/[0.08]'
      }`}
    >
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`font-mono text-[9px] tracking-[0.25em] uppercase font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                [ CANALES OFICIALES · INSTAGRAM & TIKTOK ]
              </span>
            </div>

            <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-normal uppercase leading-tight ${isLight ? 'text-gray-950' : 'text-white'}`}>
              {es ? 'COMUNIDAD EN ACCIÓN' : 'COMMUNITY IN ACTION'}
            </h2>

            <p className={`mt-1 font-sans text-xs sm:text-sm max-w-lg ${isLight ? 'text-gray-600' : 'text-[#A4ACA1]'}`}>
              {es
                ? 'Únete a la comunidad, síguenos para consejos de graduación, cultura coleccionista y eventos en vivo.'
                : 'Join the crew, follow us for grading tips, collector culture and live events.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={channelLink}>
              <InstagramGlyph className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
            <a href={TIKTOK_URL} target="_blank" rel="noopener noreferrer" className={channelLink}>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.66 2.94 2.94 0 011.66.52V9.38a6.32 6.32 0 00-1.66-.22 6.35 6.35 0 00-6.35 6.35 6.35 6.35 0 0012.7 0v-8.62a8.3 8.3 0 005.76 2.33v-3.45a4.84 4.84 0 01-2-1.08z" />
              </svg>
              <span>TikTok</span>
            </a>
          </div>
        </div>

        {/* Publicaciones de Instagram: cada una con la forma de una publicación de Instagram, con los colores de Gorilla */}
        {state === 'ready' && (
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {posts.map((post) => (
              <li key={post.id}>
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex flex-col h-full border transition-colors duration-300 ${
                    isLight
                      ? 'bg-white border-gray-200 hover:border-[#15803D]/60 shadow-sm'
                      : 'bg-[#3B3B3B] border-white/10 hover:border-[#48C765]/60'
                  }`}
                  aria-label={`${es ? 'Ver en Instagram' : 'View on Instagram'}: ${post.caption?.slice(0, 80) ?? formatDate(post.postedAt)}`}
                >
                  {/* Cabecera: avatar y nombre de la cuenta */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <span
                      className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center"
                      style={{ background: '#0B0E0B', boxShadow: `0 0 0 2px ${isLight ? '#15803D' : '#48C765'}` }}
                    >
                      <img src="/brand/logo-green.png" alt="" aria-hidden="true" className="w-4 h-auto" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] font-bold leading-tight ${isLight ? 'text-gray-950' : 'text-white'}`}>
                        gorillagradinginternational
                      </span>
                      <span className={`block text-[10px] leading-tight ${isLight ? 'text-gray-500' : 'text-[#8C9185]'}`}>
                        {post.isReel ? 'Reel' : post.type === 'carousel' ? (es ? 'Álbum' : 'Album') : (es ? 'Publicación' : 'Post')}
                      </span>
                    </span>
                    <InstagramGlyph className={`w-4 h-4 shrink-0 ${isLight ? 'text-gray-400' : 'text-white/35'}`} />
                  </div>

                  {/* Imagen */}
                  <div className={`relative aspect-[4/5] overflow-hidden ${isLight ? 'bg-gray-100' : 'bg-[#0B0E0B]'}`}>
                    <img
                      src={post.imageUrl}
                      alt={post.caption?.slice(0, 120) ?? ''}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {post.type !== 'image' && (
                      <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center" aria-hidden="true">
                        {post.type === 'video' ? <Play className="w-3.5 h-3.5 fill-current" /> : <Images className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>

                  {/* Pie: iconos de Instagram, texto y fecha */}
                  <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3">
                    <div className={`flex items-center gap-3 ${isLight ? 'text-gray-900' : 'text-white'}`} aria-hidden="true">
                      <Heart className="w-[18px] h-[18px] transition-colors group-hover:text-[#16A34A]" strokeWidth={1.8} />
                      <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.8} />
                      <Send className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    </div>
                    {post.caption && (
                      <p className={`mt-2 text-[12px] leading-snug line-clamp-3 ${isLight ? 'text-gray-800' : 'text-[#D7DCD4]'}`}>
                        <span className="font-bold hidden sm:inline">gorillagradinginternational </span>{post.caption}
                      </p>
                    )}
                    <p className={`mt-auto pt-2 text-[10px] uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-[#8C9185]'}`}>
                      {formatDate(post.postedAt)}
                    </p>
                    <span className={`mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-[#15803D]' : 'text-[#4ADE80]'}`}>
                      {es ? 'Ver en Instagram' : 'View on Instagram'}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}

        {(state === 'idle' || state === 'loading') && (
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-busy="true" aria-label={es ? 'Cargando publicaciones' : 'Loading posts'}>
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className={`aspect-[4/5] animate-pulse ${isLight ? 'bg-gray-200/70' : 'bg-white/[0.06]'}`} />
            ))}
          </ul>
        )}

        {/* Sin la cuenta conectada o sin respuesta: un enlace claro, sin contenido de relleno */}
        {state === 'unavailable' && (
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8 border ${isLight ? 'border-gray-200 bg-white/70' : 'border-white/10 bg-[#101410]/70'}`}>
            <div className="flex items-center gap-4">
              <span className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${isLight ? 'border-gray-300 text-gray-900' : 'border-white/20 text-white'}`}>
                <InstagramGlyph className="w-5 h-5" />
              </span>
              <div>
                <p className={`font-['Nunito',sans-serif] text-lg font-[900] ${isLight ? 'text-gray-950' : 'text-white'}`}>@gorillagradinginternational</p>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-[#A4ACA1]'}`}>
                  {es ? 'Mira nuestras últimas publicaciones y reels en Instagram.' : 'See our latest posts and reels on Instagram.'}
                </p>
              </div>
            </div>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn-gorilla-square shrink-0 px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer">
              {es ? 'Seguir en Instagram' : 'Follow on Instagram'}
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

// Aliases for clean backward compatibility
export const InfluencerTestimonialsPlaceholder = VerifiedAuditsSection;
export const SocialProofPlaceholder = LiveLabActivitySection;
export const TiktokReviewsPlaceholder = LiveLabActivitySection;

