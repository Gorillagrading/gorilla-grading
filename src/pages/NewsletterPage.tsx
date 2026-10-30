import React, { useEffect, useState } from 'react';
import { CheckCircle2, MailX, TriangleAlert } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Destino de los enlaces del correo de la newsletter (?action=confirm|unsubscribe&token=…).
 * La confirmación la hace esta página por POST: un antivirus que abre el enlace no confirma nada.
 */
export const NewsletterPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const es = useLanguage().language === 'es';
  const isLight = useTheme().theme === 'light';
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action') === 'unsubscribe' ? 'unsubscribe' : 'confirm';
  const token = params.get('token') ?? '';
  const [state, setState] = useState<'working' | 'done' | 'failed'>('working');

  useEffect(() => {
    if (!token) return setState('failed');
    api(`/newsletter/${action}`, { body: { token } })
      .then(() => setState('done'))
      .catch(() => setState('failed'));
  }, [action, token]);

  const copy = {
    confirm: {
      done: [es ? '¡Ya estás en el Inner Circle!' : "You're in the Inner Circle!", es ? 'Tu suscripción está confirmada. Te escribiremos con novedades, eventos y ofertas.' : 'Your subscription is confirmed. We will write to you with news, events and offers.'],
    },
    unsubscribe: {
      done: [es ? 'Te has dado de baja' : 'You have unsubscribed', es ? 'No te enviaremos más correos de la newsletter. Puedes volver a apuntarte cuando quieras.' : 'You will not receive any more newsletter emails. You can subscribe again at any time.'],
    },
  }[action].done;
  const Icon = state === 'failed' ? TriangleAlert : action === 'confirm' ? CheckCircle2 : MailX;

  return (
    <div className={`flex-1 min-h-[60vh] flex items-center justify-center px-6 py-24 ${isLight ? 'bg-[#F4F1EA]' : 'bg-[#111311]'}`}>
      <div className={`max-w-md w-full text-center border rounded-2xl p-8 ${isLight ? 'bg-white border-[#E5DEC9]' : 'bg-[#151A15] border-white/10'}`}>
        {state === 'working' ? (
          <p className={isLight ? 'text-[#4B524A]' : 'text-[#A4ACA1]'}>{es ? 'Un momento…' : 'One moment…'}</p>
        ) : (
          <>
            <span className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white ${state === 'failed' ? 'bg-[#D97706]' : 'bg-[#16A34A]'}`}>
              <Icon className="w-7 h-7" aria-hidden="true" />
            </span>
            <h1 className={`mt-4 font-['Nunito',sans-serif] text-2xl font-[900] ${isLight ? 'text-[#111827]' : 'text-white'}`}>
              {state === 'failed' ? (es ? 'El enlace no es válido' : 'This link is not valid') : copy[0]}
            </h1>
            <p className={`text-sm mt-2 ${isLight ? 'text-[#4B524A]' : 'text-[#A4ACA1]'}`}>
              {state === 'failed'
                ? (es ? 'Puede que ya se haya usado o que esté incompleto. Si quieres suscribirte, hazlo de nuevo desde la portada.' : 'It may have been used already or be incomplete. To subscribe, do it again from the home page.')
                : copy[1]}
            </p>
            <button type="button" onClick={() => onNavigate('/')} className="btn-gorilla-square mt-6 px-6 py-3 text-xs font-extrabold cursor-pointer">
              {es ? 'Ir a la portada' : 'Go to home page'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
