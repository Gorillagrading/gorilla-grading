import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { homePathFor } from '../../shared/admin';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authErrorMessage } from '../utils/authErrors';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { requestCode, verifyCode, isLoggedIn, user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const es = language === 'es';

  const [step, setStep] = useState<'email' | 'sending' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Quien ya ha iniciado sesión no necesita ver el formulario: el equipo va a su panel y el cliente a su cuenta.
  useEffect(() => {
    if (isLoggedIn && user) onNavigate(homePathFor(user));
  }, [isLoggedIn, user]);

  const messageFor = (err: unknown): string => authErrorMessage(err, es);

  const sendCode = async (): Promise<boolean> => {
    setError('');
    setInfo('');
    setStep('sending');
    try {
      await requestCode(email.trim(), language === 'es' ? 'es' : 'en');
      setStep('otp');
      return true;
    } catch (err) {
      setError(messageFor(err));
      setStep('email');
      return false;
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError(es ? 'Introduce un correo válido' : 'Enter a valid email');
      return;
    }
    void sendCode();
  };

  const handleResend = async () => {
    setOtp('');
    if (await sendCode()) setInfo(es ? 'Te hemos enviado un código nuevo.' : 'We sent you a new code.');
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError(es ? 'El código debe tener 6 dígitos' : 'Code must be 6 digits');
      return;
    }
    setError('');
    setInfo('');
    setVerifying(true);
    try {
      // Al entrar, el efecto de arriba lleva a cada uno a su sitio.
      await verifyCode(email.trim(), otp);
    } catch (err) {
      setError(messageFor(err));
      setOtp('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div 
      className={`flex-1 min-h-[calc(100vh_/_var(--page-zoom)_-_5rem)] min-h-[calc(100dvh_/_var(--page-zoom)_-_5rem)] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500 ${
        isLight ? 'bg-[#F4F1EA] text-[#1A1D1A]' : 'bg-[#454545] text-white'
      }`}
    >
      {/* Fondo de puntos suave, solo en el tema claro */}
      {isLight && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(#1A1D1A 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
      )}

      <div className="w-full max-w-[440px] relative z-10">
        
        {/* Exterior Metrological Hairline Frame */}
        <div 
          className="relative p-1.5 sm:p-2 rounded-[28px] border transition-colors duration-300"
          style={{
            borderColor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.10)'
          }}
        >
          {/* Core Luxury Card */}
          <div 
            className={`p-7 sm:p-10 relative overflow-hidden rounded-[22px] transition-all duration-300 border ${
              isLight 
                ? 'bg-[#FAF8F5] border-[#E8E2D5] shadow-[0_20px_50px_rgba(0,0,0,0.06)]' 
                : 'bg-[#121612]/95 border-white/[0.08] shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl'
            }`}
          >
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-15 mix-blend-overlay pointer-events-none" />

            {/* Official Gorilla Brand Crest - Clickable to Home */}
            <div className="flex justify-center mb-6">
              <button 
                onClick={() => onNavigate('/')}
                title={language === 'es' ? 'Ir al inicio de Gorilla Grading' : 'Go to Gorilla Grading home'}
                className={`relative p-1.5 rounded-2xl border transition-all duration-300 hover:scale-105 cursor-pointer group ${
                  isLight
                    ? 'bg-white border-[#DDD6C9] shadow-sm hover:border-[#16A34A]/40'
                    : 'bg-[#181E17] border-white/10 hover:border-[#48C765]/40'
                }`}
              >
                <div className="w-9 h-9 flex items-center justify-center p-0.5">
                  <img 
                    src="/brand/logo-green.png" 
                    alt="Gorilla Grading Logo" 
                    className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all"
                  />
                </div>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {step === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col relative z-10"
                >
                  <h1 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase text-center mb-1 font-[900] tracking-normal">
                    {language === 'es' ? 'Acceso Seguro' : 'Secure Access'}
                  </h1>
                  
                  <p 
                    className={`text-center font-mono text-[9.5px] uppercase tracking-widest mb-3 ${
                      isLight ? 'text-neutral-500' : 'text-[#48C765]'
                    }`}
                  >
                    {language === 'es' ? 'Autenticación sin contraseña' : 'Passwordless Authentication'}
                  </p>

                  <p 
                    className={`text-center font-sans text-xs mb-6 px-2 leading-relaxed ${
                      isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'
                    }`}
                  >
                    {language === 'es'
                      ? 'Accede con el correo de tus pedidos para consultar el estado de tus cartas y tu bóveda.'
                      : 'Access with the email used in your orders to check your cards and vault status.'}
                  </p>

                  {/* Email Form */}
                  <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label 
                        className={`font-mono text-[9.5px] uppercase tracking-widest font-semibold ${
                          isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'
                        }`}
                      >
                        {language === 'es' ? 'Correo Electrónico' : 'Email Address'}
                      </label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="collector@example.com"
                        className={`px-4 py-3.5 rounded-xl text-sm font-sans focus:outline-none transition-all duration-200 border ${
                          isLight 
                            ? 'bg-white border-[#DDD6C9] text-neutral-900 placeholder:text-neutral-400 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 shadow-sm'
                            : 'bg-[#181E18] border-white/10 text-white placeholder:text-white/30 focus:border-[#48C765] focus:bg-[#1B231B] focus:ring-2 focus:ring-[#48C765]/20'
                        }`}
                        required
                      />
                      {error && <span className="text-red-500 text-xs mt-1 font-sans">{error}</span>}
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn-gorilla-square w-full py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
                    >
                      {language === 'es' ? 'Recibir Código' : 'Get Code'}
                    </button>
                  </form>

                  {/* Divider: New Collector Guidance */}
                  <div className="flex items-center gap-3 my-6">
                    <div className={`h-[1px] flex-1 ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />
                    <span className={`font-mono text-[9px] uppercase tracking-widest font-semibold ${isLight ? 'text-neutral-400' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? '¿NUEVO COLECCIONISTA?' : 'NEW COLLECTOR?'}
                    </span>
                    <div className={`h-[1px] flex-1 ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />
                  </div>

                  {/* Clear Explanatory Copy */}
                  <p className={`text-center font-sans text-xs mb-3.5 leading-relaxed px-1 ${isLight ? 'text-neutral-600' : 'text-[#C5CDC2]'}`}>
                    {language === 'es'
                      ? 'Tu cuenta se activa automáticamente al enviar tu primer lote de cartas a certificar.'
                      : 'Your collector vault is activated automatically when you submit your first batch of cards.'}
                  </p>

                  {/* Conversion CTA: Enviar Cartas a Graduar */}
                  <button
                    type="button"
                    onClick={() => onNavigate('/submit')}
                    className="btn-gorilla-square-secondary w-full py-3 px-4 text-xs font-bold tracking-normal flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>{language === 'es' ? 'Enviar Cartas a Graduar' : 'Submit Cards for Grading'}</span>
                    <span className="transition-transform duration-200 group-hover:translate-x-1 font-bold">→</span>
                  </button>

                  {/* Secondary Shortcut: Track Existing Package */}
                  <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 dark:border-white/[0.08] text-center">
                    <button
                      type="button"
                      onClick={() => onNavigate('/track')}
                      className={`font-mono text-[9px] uppercase tracking-wider transition-colors hover:underline cursor-pointer ${
                        isLight ? 'text-neutral-400 hover:text-neutral-700' : 'text-[#8E968B] hover:text-white'
                      }`}
                    >
                      {language === 'es' ? '¿Solo buscas rastrear un pedido? Haz clic aquí' : 'Just tracking an existing order? Click here'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'sending' && (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 relative z-10"
                >
                  <div 
                    className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
                      isLight 
                        ? 'border-[#16A34A]/20 border-t-[#16A34A]' 
                        : 'border-[#48C765]/20 border-t-[#48C765]'
                    }`} 
                  />
                  <p className={`font-mono text-[10px] uppercase tracking-widest ${isLight ? 'text-[#16A34A]' : 'text-[#48C765]'}`}>
                    {language === 'es' ? 'Generando código de acceso...' : 'Generating access code...'}
                  </p>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col relative z-10"
                >
                  <h1 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase text-center mb-1 font-[900] tracking-normal">
                    {language === 'es' ? 'Verificación' : 'Verification'}
                  </h1>
                  <p className={`text-center font-sans text-xs mb-6 px-4 ${isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'}`}>
                    {language === 'es' 
                      ? `Hemos enviado un código de acceso a ${email}` 
                      : `We sent an access code to ${email}`}
                  </p>

                  <form onSubmit={handleOtpSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 items-center">
                      <input 
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                        className={`px-4 py-3.5 text-2xl sm:text-3xl tracking-[0.45em] font-mono text-center w-full rounded-xl border focus:outline-none transition-all ${
                          isLight 
                            ? 'bg-white border-[#DDD6C9] text-neutral-900 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15 shadow-sm'
                            : 'bg-[#181E18] border-white/10 text-white focus:border-[#48C765] focus:bg-[#1B231B] focus:ring-2 focus:ring-[#48C765]/20'
                        }`}
                        required
                      />
                      {error && <span role="alert" className="text-red-500 text-xs mt-1 font-sans text-center">{error}</span>}
                      {info && !error && <span className="text-[#16A34A] text-xs mt-1 font-sans text-center">{info}</span>}
                    </div>

                    <button
                      type="submit"
                      disabled={verifying}
                      className="btn-gorilla-square w-full py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-lg cursor-pointer transition-transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait"
                    >
                      {verifying
                        ? (language === 'es' ? 'Comprobando...' : 'Checking...')
                        : (language === 'es' ? 'Acceder al Perfil' : 'Access Vault')}
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      className={`text-center font-mono text-[9px] uppercase tracking-widest transition-colors cursor-pointer hover:underline ${
                        isLight ? 'text-neutral-500 hover:text-neutral-800' : 'text-[#A4ACA1] hover:text-white'
                      }`}
                    >
                      {language === 'es' ? 'Reenviar código' : 'Resend code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep('email'); setOtp(''); setError(''); setInfo(''); }}
                      className={`text-center font-mono text-[9px] uppercase tracking-widest mt-2 transition-colors cursor-pointer hover:underline ${
                        isLight ? 'text-neutral-400 hover:text-neutral-800' : 'text-[#A4ACA1] hover:text-white'
                      }`}
                    >
                      {language === 'es' ? '← Cambiar correo electrónico' : '← Change email address'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
