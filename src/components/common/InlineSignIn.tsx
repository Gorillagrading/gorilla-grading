import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { authErrorMessage } from '../../utils/authErrors';

/**
 * Verifica el email con un código sin salir de la página. Se usa en el formulario de envío:
 * quien no tiene sesión confirma su correo aquí y no pierde lo que ya ha rellenado.
 * Al acertar, la sesión queda iniciada y el componente padre lo detecta con useAuth().
 */
export const InlineSignIn: React.FC<{ email: string }> = ({ email }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { requestCode, verifyCode } = useAuth();
  const isLight = theme === 'light';
  const es = language === 'es';

  const [step, setStep] = useState<'idle' | 'code'>('idle');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      await requestCode(email, es ? 'es' : 'en');
      setStep('code');
    } catch (err) {
      setError(authErrorMessage(err, es));
    } finally {
      setBusy(false);
    }
  };

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError(es ? 'El código debe tener 6 dígitos' : 'Code must be 6 digits');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await verifyCode(email, code);
    } catch (err) {
      setError(authErrorMessage(err, es));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const inputClass = `w-full p-4 text-sm focus:outline-none transition-colors border font-mono ${
    isLight
      ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]'
      : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
  }`;

  return (
    <div
      className={`p-6 border space-y-4 ${isLight ? 'bg-white border-[#E5DEC9]' : 'bg-[#151A15] border-white/10'}`}
    >
      <div>
        <h3 className="font-['Nunito',sans-serif] text-sm uppercase font-[900] tracking-normal">
          {es ? 'Confirma tu correo' : 'Confirm your email'}
        </h3>
        <p className={`text-xs font-sans mt-1 ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
          {es
            ? `Te enviaremos un código de 6 dígitos a ${email}. Así podrás seguir tu pedido desde tu cuenta.`
            : `We will send a 6-digit code to ${email}. This lets you follow your order from your account.`}
        </p>
      </div>

      {step === 'idle' ? (
        <button
          type="button"
          onClick={sendCode}
          disabled={busy}
          className="btn-gorilla-square-secondary px-6 py-3 text-xs font-bold tracking-normal cursor-pointer disabled:opacity-60"
        >
          {busy ? (es ? 'Enviando…' : 'Sending…') : es ? 'Enviar código' : 'Send code'}
        </button>
      ) : (
        <form onSubmit={check} className="flex flex-col sm:flex-row gap-3">
          <input
            id="signin-code"
            aria-label={es ? 'Código de 6 dígitos' : '6-digit code'}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className={`${inputClass} sm:max-w-[200px] tracking-[0.35em] text-center`}
          />
          <button
            type="submit"
            disabled={busy}
            className="btn-gorilla-square px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer disabled:opacity-60"
          >
            {busy ? (es ? 'Comprobando…' : 'Checking…') : es ? 'Confirmar' : 'Confirm'}
          </button>
          <button
            type="button"
            onClick={sendCode}
            disabled={busy}
            className={`text-xs font-mono underline underline-offset-4 cursor-pointer ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}
          >
            {es ? 'Reenviar código' : 'Resend code'}
          </button>
        </form>
      )}

      {error && (
        <p role="alert" className="text-red-500 text-xs font-sans">
          {error}
        </p>
      )}
    </div>
  );
};
