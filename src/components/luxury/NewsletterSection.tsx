import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { ApiError, api } from '../../api/client';

export const NewsletterSection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  // Campo trampa para robots: las personas no lo ven.
  const [website, setWebsite] = useState('');
  const es = language === 'es';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      await api('/newsletter', { body: { email: email.trim(), locale: es ? 'es' : 'en', website: website || undefined } });
      setSubscribed(true);
      setEmail('');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? (es ? 'Revisa el correo: no parece válido.' : 'Check the email address: it does not look valid.')
          : err instanceof ApiError && err.status === 429
            ? (es ? 'Demasiados intentos. Espera un rato.' : 'Too many attempts. Please wait a while.')
            : (es ? 'No se pudo completar. Inténtalo de nuevo.' : 'Could not complete it. Please try again.'),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="relative z-10 w-full bg-transparent py-10 sm:py-12 lg:py-14 px-6 lg:px-12 flex justify-center">
      <div className={`w-full max-w-[800px] border p-8 md:p-12 relative overflow-hidden flex flex-col items-center text-center transition-all ${
        isLight 
          ? 'bg-white/80 backdrop-blur-md border-[#DCD5C8] shadow-xl' 
          : 'bg-[#181B18]/80 backdrop-blur-md border-white/10 shadow-2xl'
      }`}>
        
        {/* Background Decorative Accents */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A]/5 blur-[60px]" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#16A34A]/5 blur-[60px]" />

        <div className="relative z-10 flex flex-col items-center w-full">
          <svg className="w-8 h-8 text-[#16A34A] mb-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          
          <h2 className={`font-['Nunito',sans-serif] font-[900] text-3xl md:text-4xl uppercase tracking-normal mb-3 ${
            isLight ? 'text-[#111827]' : 'text-white'
          }`}>
            {language === 'es' ? 'Únete al Inner Circle' : 'Join the Inner Circle'}
          </h2>
          
          <p className={`font-sans text-sm mb-8 max-w-[400px] ${
            isLight ? 'text-[#4B524A]' : 'text-[#A4ACA1]'
          }`}>
            {language === 'es' 
              ? 'Suscríbete para recibir noticias, acceso anticipado a eventos y códigos de descuento exclusivos.' 
              : 'Subscribe to receive news, early access to events, and exclusive discount codes.'}
          </p>

          {subscribed ? (
            <div role="status" className={`w-full max-w-[420px] py-4 px-5 border-2 border-[#16A34A] text-left ${isLight ? 'bg-white' : 'bg-[#121612]'}`}>
              <div className="text-[#16A34A] text-xs font-bold uppercase tracking-wider">{es ? 'Revisa tu correo' : 'Check your email'}</div>
              <p className={`text-sm mt-1 ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                {es
                  ? 'Te hemos enviado un enlace para confirmar la suscripción. Hasta que lo pulses no te enviaremos nada.'
                  : 'We have sent you a link to confirm your subscription. We will not send you anything until you click it.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full max-w-[420px] flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                required
                placeholder={language === 'es' ? 'tu@email.com' : 'your@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`flex-1 px-4 py-3.5 text-sm focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-white border-[#D0C9BC] text-[#111827] placeholder:text-[#8C948B] focus:border-[#16A34A]' 
                    : 'bg-[#121612] border-white/10 text-white placeholder:text-[#6B7268] focus:border-[#16A34A]'
                }`}
              />
              <button 
                type="submit"
                disabled={sending}
                className="btn-gorilla-pill px-8 py-3.5 text-xs font-bold tracking-normal shrink-0 shadow-md disabled:opacity-60"
              >
                {sending ? (es ? 'Enviando…' : 'Sending…') : es ? 'Suscribir' : 'Subscribe'}
              </button>
              <input
                type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website}
                onChange={(e) => setWebsite(e.target.value)} className="hidden" name="website"
              />
            </form>
          )}
          {error && <p role="alert" className="text-red-500 text-xs mt-3">{error}</p>}
          {!subscribed && (
            <p className={`text-[11px] mt-4 max-w-[420px] ${isLight ? 'text-[#6B7268]' : 'text-[#7A8377]'}`}>
              {es ? 'Al suscribirte aceptas recibir nuestras comunicaciones comerciales por correo, según la ' : 'By subscribing you agree to receive our marketing emails, as described in the '}
              <a href="/privacy" className="underline underline-offset-2">{es ? 'Política de privacidad' : 'Privacy policy'}</a>.
            </p>
          )}
          <span className={`font-mono text-[9px] mt-4 uppercase tracking-normal ${
            isLight ? 'text-[#6B7268]' : 'text-[#7A8377]'
          }`}>
            {language === 'es' ? 'NO ENVIAMOS SPAM. CANCELA CUANDO QUIERAS.' : 'NO SPAM. UNSUBSCRIBE ANYTIME.'}
          </span>
        </div>
      </div>
    </section>
  );
};

