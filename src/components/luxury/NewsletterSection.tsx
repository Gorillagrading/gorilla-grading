import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

export const NewsletterSection: React.FC = () => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
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
            <div className="w-full max-w-[400px] py-3.5 px-4 bg-[#16A34A]/10 border border-[#16A34A]/40 text-[#16A34A] font-mono text-xs uppercase tracking-widest font-bold">
              {language === 'es' ? '¡Suscripción exitosa!' : 'Successfully subscribed!'}
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
                className="btn-gorilla-pill px-8 py-3.5 text-xs font-bold tracking-normal shrink-0 shadow-md"
              >
                {language === 'es' ? 'Suscribir' : 'Subscribe'}
              </button>
            </form>
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

