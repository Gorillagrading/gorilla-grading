import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { GradedCardsCounter } from './GradedCardsCounter';

interface LuxuryFooterProps {
  onNavigate?: (path: string) => void;
}

export const LuxuryFooter: React.FC<LuxuryFooterProps> = ({ onNavigate }) => {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const [searchCert, setSearchCert] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCert.trim() && onNavigate) {
      onNavigate(`/certificates/${searchCert.trim()}`);
    }
  };

  return (
    <footer 
      className={`relative z-20 w-full pt-12 sm:pt-16 pb-8 border-t select-none transition-colors duration-300 ${
        isLight 
          ? 'bg-[#F6F4EE] border-[#E2DDD3] text-[#1B1E1A]' 
          : 'bg-[#111411] border-white/[0.08] text-[#EAEAEA]'
      }`}
    >
      {/* Top Footer Section Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pb-10 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-3 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div 
              onClick={() => onNavigate && onNavigate('/')}
              className="cursor-pointer mb-6 flex justify-center lg:justify-start w-full transition-transform hover:scale-102"
            >
              <div className="flex flex-col items-center lg:items-start">
                <img
                  src="/brand/logo-green.png"
                  alt="Gorilla Grading Shield"
                  className="h-8 sm:h-9 w-auto object-contain"
                />
                <div className="flex flex-col items-center leading-none mt-1">
                  <span className={`font-['Nunito',sans-serif] font-black tracking-normal text-[16px] sm:text-[18px] uppercase ${
                    isLight ? 'text-[#111827]' : 'text-[#F0F1F2]'
                  }`}>
                    GORILLA
                  </span>
                  <span className="font-['Nunito',sans-serif] font-bold text-[#16A34A] tracking-normal text-[8px] sm:text-[9px] uppercase mt-[1px]">
                    GRADING
                  </span>
                </div>
              </div>
            </div>
            
            <p className={`text-xs max-w-sm leading-relaxed mb-6 font-normal text-center lg:text-left mx-auto lg:mx-0 ${
              isLight ? 'text-[#4A5248]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'El estándar internacional de graduación óptica submilimétrica, autenticación forense multiespectral y encapsulado sónico hermético.'
                : 'The international standard for sub-millimeter optical grading, forensic multispectral authentication, and ultrasonic hermetic encapsulation.'
              }
            </p>

            {/* Social Media */}
            <div className="flex flex-col items-center lg:items-start gap-3">
              <a 
                href="https://instagram.com/gorillagradinginternational" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center justify-center lg:justify-start gap-2 text-xs transition-colors ${
                  isLight ? 'text-[#374151] hover:text-[#16A34A]' : 'text-[#A4ACA1] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span className="font-sans font-medium tracking-wide">@gorillagradinginternational</span>
              </a>
              <a 
                href="https://tiktok.com/@gorillagrading" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`flex items-center justify-center lg:justify-start gap-2 text-xs transition-colors ${
                  isLight ? 'text-[#374151] hover:text-[#16A34A]' : 'text-[#A4ACA1] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.66 2.94 2.94 0 011.66.52V9.38a6.32 6.32 0 00-1.66-.22 6.35 6.35 0 00-6.35 6.35 6.35 6.35 0 0012.7 0v-8.62a8.3 8.3 0 005.76 2.33v-3.45a4.84 4.84 0 01-2-1.08z"/>
                </svg>
                <span className="font-sans font-medium tracking-wide">@gorillagrading</span>
              </a>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="lg:col-span-2 flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
            <span className={`font-sans text-xs tracking-widest uppercase font-bold mb-2 ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              {language === 'es' ? 'SERVICIOS' : 'SERVICES'}
            </span>
            <button onClick={() => onNavigate && onNavigate('/submit')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Enviar Cartas' : 'Submit Cards'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/verify')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Verificar Certificado' : 'Verify Certificate'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/pricing')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Tarifas & Plazos' : 'Pricing & Tiers'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/track')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Seguimiento en Vivo' : 'Live Tracking'}
            </button>
          </div>

          {/* Company & Support */}
          <div className="lg:col-span-2 flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
            <span className={`font-sans text-xs tracking-widest uppercase font-bold mb-2 ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              {language === 'es' ? 'COMPAÑÍA' : 'COMPANY'}
            </span>
            <button onClick={() => onNavigate && onNavigate('/about')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Sobre Nosotros' : 'About Us'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/contact')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Contacto' : 'Contact'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/faq')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Preguntas Frecuentes' : 'FAQ'}
            </button>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2 flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
            <span className={`font-sans text-xs tracking-widest uppercase font-bold mb-2 ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              {language === 'es' ? 'LEGAL' : 'LEGAL'}
            </span>
            <button onClick={() => onNavigate && onNavigate('/legal-notice')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Aviso Legal' : 'Legal Notice'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/terms')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Términos y Condiciones' : 'Terms & Conditions'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/privacy')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/refund')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Política de Reembolso' : 'Refund Policy'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/cookies')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Política de Cookies' : 'Cookie Policy'}
            </button>
            <button onClick={() => onNavigate && onNavigate('/cookie-consent')} className={`text-center lg:text-left text-xs transition-all duration-300 w-fit mx-auto lg:mx-0 ${
              isLight ? 'text-[#4B524A] hover:text-[#16A34A] hover:translate-x-0 lg:hover:translate-x-1' : 'text-[#A4ACA1] hover:text-[#48C765] hover:translate-x-0 lg:hover:translate-x-1'
            }`}>
              {language === 'es' ? 'Consentimiento de Cookies' : 'Cookie Consent'}
            </button>
          </div>

          {/* Standards & Certifications */}
          <div className="lg:col-span-3 flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
            <span className={`font-sans text-xs tracking-widest uppercase font-bold mb-2 text-center lg:text-left ${
              isLight ? 'text-[#111827]' : 'text-white'
            }`}>
              {language === 'es' ? 'ESTÁNDARES ÓPTICOS' : 'OPTICAL STANDARDS'}
            </span>
            <div className={`w-full max-w-sm mx-auto lg:mx-0 p-4 rounded-none border flex flex-col gap-2 relative overflow-hidden group ${
              isLight 
                ? 'bg-white/80 border-[#D5CDC0] shadow-xs' 
                : 'bg-white/[0.02] border-white/[0.08]'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono relative z-10">
                <span className={isLight ? 'text-[#4A5248]' : 'text-[#A4ACA1]'}>
                  {language === 'es' ? 'CALIBRE LÁSER:' : 'LASER CALIPER:'}
                </span>
                <span className={`font-bold ${isLight ? 'text-[#16A34A]' : 'text-[#48C765]'}`}>0.01 mm</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono relative z-10">
                <span className={isLight ? 'text-[#4A5248]' : 'text-[#A4ACA1]'}>
                  {language === 'es' ? 'FILTRACIÓN UV:' : 'UV BARRIER:'}
                </span>
                <span className={`font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                  {language === 'es' ? 'ACRÍLICO ÓPTICO' : 'OPTICAL ACRYLIC'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono relative z-10">
                <span className={isLight ? 'text-[#4A5248]' : 'text-[#A4ACA1]'}>
                  {language === 'es' ? 'SELLADO SÓNICO:' : 'SONIC FUSION:'}
                </span>
                <span className={`font-bold ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                  {language === 'es' ? 'HERMÉTICO' : 'HERMETIC SEAL'}
                </span>
              </div>
            </div>

            {/* Certificate Search Input */}
            <div className="mt-4 w-full max-w-sm mx-auto lg:mx-0">
              <span className={`font-sans text-xs tracking-widest uppercase font-bold mb-2 block text-center lg:text-left ${
                isLight ? 'text-[#111827]' : 'text-white'
              }`}>
                {language === 'es' ? 'BUSCADOR DE CERTIFICADOS' : 'CERTIFICATE SEARCH'}
              </span>
              <form onSubmit={handleSearch} className="relative flex items-center w-full group">
                <input 
                  type="text" 
                  value={searchCert}
                  onChange={(e) => setSearchCert(e.target.value)}
                  placeholder={language === 'es' ? 'Ej. GGI-892401' : 'e.g. GGI-892401'}
                  className={`w-full text-xs px-4 py-2.5 rounded-none focus:outline-none transition-colors uppercase font-mono border ${
                    isLight 
                      ? 'bg-white border-[#D0C9BC] text-[#111827] placeholder:text-[#8C948B] focus:border-[#16A34A] shadow-xs' 
                      : 'bg-white/[0.04] border-white/[0.12] text-white placeholder:text-[#7A8377] focus:border-[#48C765]/60'
                  }`}
                />
                <button 
                  type="submit" 
                  className={`absolute right-2 p-1 transition-colors ${
                    isLight ? 'text-[#6B7268] hover:text-[#16A34A]' : 'text-[#7A8377] hover:text-[#48C765]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {/* Graded Cards Counter — Below search */}
              <GradedCardsCounter />
            </div>
          </div>

        </div>
      </div>

      {/* Full-width Divider Line — De extremo a extremo de la pantalla (100% width) */}
      <div className={`w-full border-b ${
        isLight ? 'border-[#E2DDD3]' : 'border-white/[0.08]'
      }`} />

      {/* Bottom Bar Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-6">
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-center md:text-left ${
          isLight ? 'text-[#4A5248]' : 'text-[#7A8377]'
        }`}>
          <div className="font-mono order-3 md:order-1 text-[11px]">
            © 2026 GORILLA GRADING · {language === 'es' ? 'TODOS LOS DERECHOS RESERVADOS' : 'ALL RIGHTS RESERVED'}
          </div>

          <div className="font-sans text-[13px] flex items-center justify-center gap-1.5 order-2 md:order-2">
            {language === 'es' ? 'Hecho con' : 'Made with'} 
            <svg className="w-3.5 h-3.5 text-[#D03B3B] fill-current animate-heartbeat" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            {language === 'es' ? 'en Madrid y Lisboa' : 'in Madrid & Lisbon'}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 order-1 md:order-3 w-full md:w-auto">
            {/* Theme & Language row */}
            <div className="flex items-center justify-center gap-3">
              {/* Theme Toggle Button */}
              <button 
                onClick={toggleTheme}
                className="theme-toggle-btn"
                title={theme === 'dark' 
                  ? (language === 'es' ? 'Cambiar a modo claro' : 'Switch to light mode')
                  : (language === 'es' ? 'Cambiar a modo oscuro' : 'Switch to dark mode')
                }
              >
                {theme === 'dark' ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    <span>{language === 'es' ? 'CLARO' : 'LIGHT'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </svg>
                    <span>{language === 'es' ? 'OSCURO' : 'DARK'}</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')} 
                className="theme-toggle-btn"
                title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{language === 'es' ? 'ES' : 'EN'}</span>
              </button>
            </div>

            {/* Legal Links */}
            <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-sans tracking-wider uppercase ${
              isLight ? 'text-[#4A5248]' : 'text-[#A4ACA1]'
            }`}>
              <button onClick={() => onNavigate && onNavigate('/privacy')} className={`transition-colors cursor-pointer whitespace-nowrap ${isLight ? 'hover:text-[#111827]' : 'hover:text-white'}`}>{language === 'es' ? 'PRIVACIDAD' : 'PRIVACY'}</button>
              <span className="opacity-40 select-none">•</span>
              <button onClick={() => onNavigate && onNavigate('/terms')} className={`transition-colors cursor-pointer whitespace-nowrap ${isLight ? 'hover:text-[#111827]' : 'hover:text-white'}`}>{language === 'es' ? 'TÉRMINOS' : 'TERMS'}</button>
              <span className="opacity-40 select-none">•</span>
              <button onClick={() => onNavigate && onNavigate('/legal-notice')} className={`transition-colors cursor-pointer whitespace-nowrap ${isLight ? 'hover:text-[#111827]' : 'hover:text-white'}`}>{language === 'es' ? 'AVISO LEGAL' : 'LEGAL NOTICE'}</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};



