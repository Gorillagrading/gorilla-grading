import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface LuxuryNavbarProps {
  onNavigate?: (path: string) => void;
}

export const LuxuryNavbar: React.FC<LuxuryNavbarProps> = ({ onNavigate }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  // El panel del laboratorio solo se ofrece a cuentas del personal.
  const isStaff = !!user && user.role !== 'customer';
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  // Track window scroll position to dynamically adapt navbar contrast
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setIsScrolled(currentScroll > 8);
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handleScroll);
    };
  }, []);
  // Lock body scroll when mobile menu is open to prevent background scrolling
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const go = (path: string) => {
    setCurrentPath(path);
    onNavigate && onNavigate(path);
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search popover on click outside or Escape
  useEffect(() => {
    if (!isSearchOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onNavigate) {
      go(`/verify?id=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  // Navigation map (single source for desktop + mobile)
  const navLinks = [
    { path: '/technology', label: language === 'es' ? 'Tecnología' : 'Technology' },
    { path: '/about', label: language === 'es' ? 'El Laboratorio' : 'The Laboratory' },
    { path: '/verify', label: language === 'es' ? 'Verificar Certificado' : 'Verify Certificate' },
    { path: '/pricing', label: language === 'es' ? 'Tarifas' : 'Pricing & Tiers' },
    { path: '/track', label: language === 'es' ? 'Estado del Pedido' : 'Order Status' },
  ];

  // Executive nav link: Nunito, normal letter spacing
  const navLinkClass = (active: boolean) =>
    `relative py-2 font-['Nunito',sans-serif] text-[13px] lg:text-[14px] font-bold tracking-normal transition-colors cursor-pointer shrink-0
     after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:transition-all after:duration-300
     ${isLight ? 'after:bg-[#111827]' : 'after:bg-[#48C765]'}
     ${active ? 'after:w-full' : 'after:w-0 hover:after:w-full'}
     ${active
       ? (isLight ? 'text-[#111827]' : 'text-white font-black')
       : (isLight ? 'text-[#374151] hover:text-[#111827]' : 'text-[#B8BFB5] hover:text-white')}`;

  const iconBtnClass = `p-2 transition-colors cursor-pointer shrink-0 ${
    isLight ? 'text-[#4B5563] hover:text-[#111827]' : 'text-[#B8BFB5] hover:text-white'
  }`;

  // Header background class — Solid at top, sleek frosted glass on scroll
  const headerBgClass = isMobileMenuOpen
    ? (isLight 
        ? 'bg-white text-[#111827] border-b border-black/[0.06] shadow-sm' 
        : 'bg-[#0B0E0B] text-white border-b border-white/10 shadow-sm')
    : !isScrolled
    ? (isLight 
        ? 'bg-white text-[#111827] border-b border-black/[0.05] shadow-xs' 
        : 'bg-[#0B0E0B] text-white border-b border-white/[0.05] shadow-xs')
    : (isLight 
        ? 'bg-transparent text-[#111827] backdrop-blur-md border-b border-transparent' 
        : 'bg-transparent text-white backdrop-blur-md border-b border-transparent');

  return (
    <header 
      className={`sticky top-0 w-full transition-all duration-300 ${isMobileMenuOpen ? 'z-[10000]' : 'z-50'} ${headerBgClass}`}
      style={isMobileMenuOpen ? { backgroundColor: isLight ? '#FFFFFF' : '#0B0E0B' } : undefined}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 flex items-center justify-between gap-4 h-20">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={() => go('/')}
          className="flex flex-col items-center justify-center cursor-pointer group shrink-0"
        >
          <img
            src="/brand/logo-green.png"
            alt="Gorilla Grading Shield"
            className="h-8 sm:h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
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

        {/* Center Navigation Links — executive small caps with well-proportioned spacing */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => go(link.path)}
              className={navLinkClass(currentPath.startsWith(link.path))}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Tools & CTAs */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          {/* Mobile Search Form (inline, exactly as it was before) */}
          {isSearchOpen && (
            <form onSubmit={handleSearchSubmit} className="flex md:hidden items-center">
              <input
                type="text"
                placeholder={language === 'es' ? 'Nº de certificado (8 cifras)' : 'Certificate no. (8 digits)'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className={`${isLight ? 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gray-900' : 'bg-[#161B16] border border-white/20 text-white focus:border-white'} text-xs px-3 py-1.5 rounded-none w-36 focus:outline-none focus:w-44 transition-all font-mono`}
              />
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)}
                className={`ml-2 text-xs ${isLight ? 'text-gray-500 hover:text-gray-900' : 'text-[#A4ACA1] hover:text-white'}`}
              >
                ✕
              </button>
            </form>
          )}

          {/* Mobile Search Trigger Button (when search is closed) */}
          {!isSearchOpen && (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className={`md:hidden ${iconBtnClass}`}
              title={language === 'es' ? 'Buscar certificado' : 'Search Certificate'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {/* Desktop Search Trigger & Dropdown Popover (md and above) */}
          <div ref={searchContainerRef} className="hidden md:flex relative items-center">
            <button 
              onClick={() => setIsSearchOpen(prev => !prev)}
              className={`${iconBtnClass} ${isSearchOpen ? (isLight ? 'text-[#16A34A]' : 'text-[#4ADE80]') : ''}`}
              title={language === 'es' ? 'Buscar certificado' : 'Search Certificate'}
              aria-expanded={isSearchOpen}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <input
                    type="text"
                    placeholder={language === 'es' ? 'Nº de certificado (8 cifras)' : 'Certificate no. (8 digits)'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className={`w-52 sm:w-56 text-xs pl-3 pr-12 py-1.5 border font-mono uppercase tracking-wider focus:outline-none transition-all shadow-xl ${
                      isLight 
                        ? 'bg-white border-black/30 text-[#111827] placeholder:text-black/35 focus:border-[#16A34A]' 
                        : 'bg-[#141714] border-white/30 text-white placeholder:text-white/35 focus:border-[#4ADE80]'
                    }`}
                  />
                  <button 
                    type="submit" 
                    aria-label="Submit Search"
                    className={`absolute right-6 top-1/2 -translate-y-1/2 p-0.5 text-xs font-mono transition-colors cursor-pointer ${
                      isLight ? 'text-gray-400 hover:text-[#16A34A]' : 'text-gray-400 hover:text-[#4ADE80]'
                    }`}
                  >
                    ↵
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsSearchOpen(false)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-xs transition-colors cursor-pointer ${
                      isLight ? 'text-gray-400 hover:text-black' : 'text-gray-400 hover:text-white'
                    }`}
                    title={language === 'es' ? 'Cerrar' : 'Close'}
                  >
                    ✕
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Discreet EN / ES toggle */}
          <div className="hidden lg:flex items-center gap-1.5 px-1 font-mono text-[10px] tracking-[0.12em]">
            {(['en', 'es'] as const).map((lng, i) => (
              <React.Fragment key={lng}>
                {i === 1 && <span className={isLight ? 'text-gray-300' : 'text-white/20'}>/</span>}
                <button
                  onClick={() => setLanguage(lng)}
                  className={`uppercase cursor-pointer transition-colors ${
                    language === lng
                      ? (isLight ? 'text-[#111827] font-bold' : 'text-white font-bold')
                      : (isLight ? 'text-gray-400 hover:text-gray-900' : 'text-white/40 hover:text-white')
                  }`}
                >
                  {lng}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Vertical hairline divider */}
          <span className={`hidden sm:block h-5 w-px mx-0.5 ${isLight ? 'bg-black/15' : 'bg-white/15'}`} />

          {isStaff && (
            <button
              onClick={() => go('/admin')}
              className={`hidden sm:inline-flex items-center px-2.5 py-1 border rounded font-mono text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                isLight ? 'border-black/20 text-gray-800 hover:border-[#16A34A] hover:text-[#16A34A]' : 'border-white/20 text-gray-200 hover:border-[#4ADE80] hover:text-[#4ADE80]'
              }`}
            >
              {language === 'es' ? 'Panel' : 'Lab panel'}
            </button>
          )}

          {/* Account / Collector Vault — neutral icon */}
          <button
            onClick={() => go('/account')}
            className={`hidden sm:flex items-center justify-center ${iconBtnClass}`}
            title={language === 'es' ? 'Bóveda del Coleccionista' : 'Collector Vault'}
            aria-label="Account"
          >
            <svg 
              className="w-[18px] h-[18px]" 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="7" r="4" />
              <path d="M4 21v-1.5C4 16.2 7.6 13.8 12 13.8C16.4 13.8 20 16.2 20 19.5V21" />
            </svg>
          </button>

          {/* Submit a Card — High-end luxury outlined button */}
          <button
            onClick={() => go('/submit')}
            className={`hidden sm:inline-flex items-center justify-center gap-1.5 px-4 lg:px-5 py-2.5 rounded-none font-['Nunito',sans-serif] text-xs font-bold tracking-normal transition-all duration-200 cursor-pointer ${
              isLight
                ? 'border border-gray-900 text-gray-900 bg-transparent hover:bg-gray-900 hover:!text-white shadow-2xs'
                : 'border border-white/25 text-white bg-transparent hover:border-white hover:bg-white/10'
            }`}
          >
            <span>{t('ref.nav.submit')}</span>
            <span aria-hidden="true" className="text-xs">→</span>
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden ${iconBtnClass}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

      </div>

      {/* Línea divisoria eliminada para transparencia limpia */}

      {/* Mobile Menu Overlay - Executive Luxury Takeover (Portaled directly to document.body to break free from header constraints) */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className={`md:hidden fixed top-20 inset-x-0 bottom-0 flex flex-col justify-between py-6 px-6 z-[9999] overflow-y-auto ${
            isLight 
              ? 'text-gray-900 border-t border-[#E5E7EB] shadow-2xl' 
              : 'text-white border-t border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
          }`}
          style={{ 
            backgroundColor: isLight ? '#FAF9F6' : '#0B0E0B',
            color: isLight ? '#111827' : '#FFFFFF'
          }}
        >
          {/* Clean Navigation Links */}
          <nav className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;

              return (
                <button
                  key={link.path}
                  onClick={() => { setIsMobileMenuOpen(false); go(link.path); }}
                  className={`py-4 px-2 text-left font-['Nunito',sans-serif] text-base tracking-normal transition-colors cursor-pointer ${
                    isActive 
                      ? (isLight ? 'text-black font-black' : 'text-emerald-400 font-black') 
                      : (isLight ? 'text-gray-700 hover:text-black font-bold' : 'text-gray-300 hover:text-white font-bold')
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {isStaff && (
              <button
                onClick={() => { setIsMobileMenuOpen(false); go('/admin'); }}
                className={`py-4 px-2 text-left font-['Nunito',sans-serif] text-base tracking-normal transition-colors cursor-pointer ${
                  isLight ? 'text-gray-700 hover:text-black font-bold' : 'text-gray-300 hover:text-white font-bold'
                }`}
              >
                {language === 'es' ? 'Panel del laboratorio' : 'Lab panel'}
              </button>
            )}

            {/* Collector Vault / Login Row */}
            <button
              onClick={() => { setIsMobileMenuOpen(false); go('/account'); }}
              className={`py-4 px-2 text-left font-['Nunito',sans-serif] text-base tracking-normal transition-colors cursor-pointer ${
                currentPath === '/account'
                  ? (isLight ? 'text-black font-black' : 'text-emerald-400 font-black')
                  : (isLight ? 'text-gray-700 hover:text-black font-bold' : 'text-gray-300 hover:text-white font-bold')
              }`}
            >
              {language === 'es' ? 'Bóveda del Coleccionista' : 'Collector Vault / Login'}
            </button>
          </nav>

          {/* Bottom Submit Button */}
          <div className="pt-4">
            <button
              onClick={() => { setIsMobileMenuOpen(false); go('/submit'); }}
              className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-['Nunito',sans-serif] text-sm font-bold tracking-normal uppercase transition-colors cursor-pointer"
            >
              <span>{t('ref.nav.submit')}</span>
              <span aria-hidden="true" className="text-xs">→</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
