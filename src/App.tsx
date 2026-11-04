import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LuxuryNavbar } from './components/luxury/LuxuryNavbar';
import { LuxuryFooter } from './components/luxury/LuxuryFooter';
import { PrecisionScrollDatum } from './components/luxury/PrecisionScrollDatum';
import { EventStickerPopup } from './components/common/EventSticker';

// Pages
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SubmissionWizardPage } from './pages/SubmissionWizardPage';
import { VerificationPage } from './pages/VerificationPage';
import { CertificateDetailPage } from './pages/CertificateDetailPage';
import { TrackingPage } from './pages/TrackingPage';
import { CollectorVaultPage } from './pages/CollectorVaultPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TechnologyPage } from './pages/TechnologyPage';

import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { LegalPage } from './pages/LegalPage';

import { PreservePage } from './pages/PreservePage';
import { AuthenticatePage } from './pages/AuthenticatePage';
import { UnderstandPage } from './pages/UnderstandPage';
import { BelongPage } from './pages/BelongPage';
import { FAQPreparePage } from './pages/FAQPreparePage';
import { FAQDropoffPage } from './pages/FAQDropoffPage';
import { FAQTurnaroundPage } from './pages/FAQTurnaroundPage';
import { EventsCalendarPage } from './pages/EventsCalendarPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { GradingScalePage } from './pages/GradingScalePage';
import { NewsletterPage } from './pages/NewsletterPage';
import { forgetPendingScroll, rememberScroll, restoreScroll, storedScroll, trackScroll } from './utils/scrollMemory';

export const AppContent: React.FC = () => {
  const { isLoggedIn, status: authStatus, retrySession } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const handleNavigate = (path: string) => {
    const [pathAndQuery, hash] = path.split('#');
    const pathname = pathAndQuery.split('?')[0] || '/';
    // Antes de irnos, apuntamos dónde estábamos para que "atrás" vuelva justo aquí.
    forgetPendingScroll();
    rememberScroll();
    setCurrentPath(pathname);
    window.history.pushState({}, '', path);

    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    // La posición la gestionamos nosotros: el navegador no sabe cuándo termina de pintarse cada página.
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const initial = storedScroll();
    if (initial !== undefined) restoreScroll(initial);
    const stopTracking = trackScroll();

    const handlePopState = () => {
      forgetPendingScroll();
      setCurrentPath(window.location.pathname || '/');
      const y = storedScroll();
      if (y !== undefined) {
        restoreScroll(y);
      } else if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      stopTracking();
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <HomePage onNavigate={handleNavigate} />;
      case '/technology':
        return <TechnologyPage onNavigate={handleNavigate} />;

      case '/pricing':
        return <PricingPage onNavigate={handleNavigate} />;
      case '/about':
        return <AboutPage onNavigate={handleNavigate} />;
      case '/contact':
        return <ContactPage onNavigate={handleNavigate} />;
      case '/faq':
        return <FAQPage onNavigate={handleNavigate} />;
      case '/services':
        return <ServicesPage onNavigate={handleNavigate} />;
      case '/how-it-works':
        return <HowItWorksPage onNavigate={handleNavigate} />;
      case '/preserve':
        return <PreservePage onNavigate={handleNavigate} />;
      case '/authenticate':
        return <AuthenticatePage onNavigate={handleNavigate} />;
      case '/understand':
        return <UnderstandPage onNavigate={handleNavigate} />;
      case '/belong':
        return <BelongPage onNavigate={handleNavigate} />;
      case '/faq/prepare':
        return <FAQPreparePage onNavigate={handleNavigate} />;
      case '/faq/dropoff':
        return <FAQDropoffPage onNavigate={handleNavigate} />;
      case '/faq/turnaround':
        return <FAQTurnaroundPage onNavigate={handleNavigate} />;
      case '/events':
      case '/events-calendar':
      case '/calendario-eventos':
        return <EventsCalendarPage onNavigate={handleNavigate} />;
      case '/submit':
        return <SubmissionWizardPage onNavigate={handleNavigate} />;
      case '/verify':
        return <VerificationPage onNavigate={handleNavigate} />;
      case '/track':
      case '/tracking':
        return <TrackingPage onNavigate={handleNavigate} />;
      case '/login':
        return <LoginPage onNavigate={handleNavigate} />;
      case '/account':
        // Mientras se comprueba la sesión no se muestra el formulario de acceso, para que no parpadee.
        if (authStatus === 'loading') return <div className="flex-1 min-h-[60vh]" aria-busy="true" />;
        if (authStatus === 'error') {
          return (
            <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
              <h1 className="font-['Nunito',sans-serif] text-2xl font-[900]">
                {language === 'es' ? 'No hemos podido abrir tu cuenta' : 'We could not open your account'}
              </h1>
              <p className="text-sm max-w-md opacity-75">
                {language === 'es'
                  ? 'El servidor no ha respondido a tiempo. Tus cartas y pedidos están a salvo; vuelve a intentarlo en unos segundos.'
                  : 'The server did not answer in time. Your cards and orders are safe; please try again in a few seconds.'}
              </p>
              <button type="button" onClick={retrySession} className="btn-gorilla-square px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer">
                {language === 'es' ? 'Reintentar' : 'Try again'}
              </button>
            </div>
          );
        }
        return isLoggedIn ? <CollectorVaultPage onNavigate={handleNavigate} /> : <LoginPage onNavigate={handleNavigate} />;
      case '/terms':
        return <LegalPage type="terms" onNavigate={handleNavigate} />;
      case '/privacy':
        return <LegalPage type="privacy" onNavigate={handleNavigate} />;
      case '/refund':
        return <LegalPage type="refund" onNavigate={handleNavigate} />;
      case '/cookies':
        return <LegalPage type="cookies" onNavigate={handleNavigate} />;
      case '/cookie-consent':
        // Página retirada: solo hay cookies técnicas, no hace falta gestor de consentimiento.
        return <LegalPage type="cookies" onNavigate={handleNavigate} />;
      case '/legal-notice':
        return <LegalPage type="legal-notice" onNavigate={handleNavigate} />;
      case '/newsletter':
        return <NewsletterPage onNavigate={handleNavigate} />;
      case '/grading-scale':
        return <GradingScalePage onNavigate={handleNavigate} />;
      case '/admin':
      case '/admin/dashboard':
      case '/admin/orders':
      case '/admin/events':
      case '/admin/team':
        return <AdminPage path={currentPath} onNavigate={handleNavigate} />;
      default:
        if (currentPath.startsWith('/admin/orders/')) {
          return <AdminPage path={currentPath} onNavigate={handleNavigate} />;
        }
        if (currentPath.startsWith('/certificates/')) {
          const certId = currentPath.replace('/certificates/', '');
          return <CertificateDetailPage onNavigate={handleNavigate} certId={certId} />;
        }
        return <NotFoundPage onNavigate={handleNavigate} />;
    }
  };

  // El panel del laboratorio es una herramienta propia: ocupa toda la pantalla, sin el menú ni el pie de la web.
  if (currentPath === '/admin' || currentPath.startsWith('/admin/')) {
    return <AdminPage path={currentPath} onNavigate={handleNavigate} />;
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative ${
      theme === 'light' ? 'bg-[#F9F7F2] text-[#111827]' : 'bg-[#0B0E0B] text-[#F4F6F0]'
    }`}>
      {/* Universal Fixed Studio Background Layer with Uploaded Smoke Texture & Lighting */}
      <PrecisionScrollDatum />

      <LuxuryNavbar onNavigate={handleNavigate} />
      
      <main className="flex-1 flex flex-col relative">
        {renderPage()}
      </main>

      <LuxuryFooter onNavigate={handleNavigate} />

      <EventStickerPopup path={currentPath} onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

