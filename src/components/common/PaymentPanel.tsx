import React, { useEffect, useRef, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { ApiError } from '../../api/client';
import { startCheckout } from '../../api/orders';

/**
 * Aviso de pago en el seguimiento: el resultado al volver de la página de pago de Stripe y,
 * si el pedido sigue sin pagar, el botón para pagarlo. Solo el dueño del pedido puede pagar.
 */
export const PaymentPanel: React.FC<{
  code: string;
  status: string;
  isOwner: boolean;
  paymentReturn: 'success' | 'cancelled' | null;
  lang: 'es' | 'en';
  isLight: boolean;
  onRefresh: () => Promise<void>;
  onNavigate: (path: string) => void;
}> = ({ code, status, isOwner, paymentReturn, lang, isLight, onRefresh, onNavigate }) => {
  const es = lang === 'es';
  const pending = status === 'PAYMENT_PENDING';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const polls = useRef(0);

  // Al volver de Stripe el aviso del pago puede tardar unos segundos: se vuelve a consultar el pedido.
  useEffect(() => {
    if (paymentReturn !== 'success' || !pending || polls.current >= 10) return;
    const timer = window.setTimeout(() => {
      polls.current += 1;
      void onRefresh();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [paymentReturn, pending, onRefresh, status]);

  if (!pending && paymentReturn !== 'success') return null;

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      window.location.assign(await startCheckout(code));
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.status === 401) setNeedsLogin(true);
      else if (err instanceof ApiError && err.code === 'nothing_to_pay') void onRefresh();
      else setError(es ? 'No se pudo abrir la página de pago. Inténtalo de nuevo.' : 'Could not open the payment page. Please try again.');
    }
  };

  const tone = !pending
    ? 'border-emerald-500/40 bg-emerald-500/10'
    : paymentReturn === 'cancelled'
      ? 'border-amber-500/50 bg-amber-500/10'
      : isLight ? 'border-black/10 bg-white/60' : 'border-white/10 bg-black/20';
  const text = isLight ? 'text-[#1C201D]' : 'text-white';
  const muted = isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]';

  let title: string;
  let body: string;
  if (!pending) {
    title = es ? 'Pago recibido' : 'Payment received';
    body = es ? 'Tu pedido está registrado. Te hemos enviado la confirmación por correo.' : 'Your order is registered. We have emailed you the confirmation.';
  } else if (paymentReturn === 'success') {
    title = es ? 'Confirmando tu pago…' : 'Confirming your payment…';
    body = polls.current >= 10
      ? (es ? 'El pago está tardando en confirmarse. Recarga la página en unos minutos; si se cobró, no hace falta pagar otra vez.' : 'The payment is taking a while to confirm. Reload in a few minutes; if you were charged, there is no need to pay again.')
      : (es ? 'Stripe nos está avisando del pago. Esta página se actualiza sola.' : 'Stripe is notifying us of the payment. This page updates by itself.');
  } else if (paymentReturn === 'cancelled') {
    title = es ? 'El pago no se completó' : 'The payment was not completed';
    body = es ? 'Tu pedido sigue guardado. Puedes pagarlo cuando quieras.' : 'Your order is still saved. You can pay for it whenever you like.';
  } else {
    title = es ? 'Pendiente de pago' : 'Awaiting payment';
    body = es ? 'Este pedido quedará registrado en cuanto se complete el pago.' : 'This order will be registered as soon as the payment is completed.';
  }

  return (
    <section className="w-full px-6 lg:px-12 pt-6">
      <div className={`max-w-[1400px] mx-auto border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${tone}`} role="status">
        <div>
          <div className={`font-mono text-[11px] tracking-[0.16em] uppercase font-bold ${text}`}>{title}</div>
          <p className={`text-sm mt-1 ${muted}`}>{body}</p>
          {error && <p className="text-sm mt-2 text-red-500">{error}</p>}
          {needsLogin && (
            <p className={`text-sm mt-2 ${muted}`}>
              {es ? 'Inicia sesión con el correo del pedido para pagarlo. ' : 'Sign in with the order email to pay for it. '}
              <button type="button" onClick={() => onNavigate('/login')} className="underline underline-offset-4 cursor-pointer text-[#16A34A] dark:text-[#48C765]">
                {es ? 'Iniciar sesión' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
        {pending && isOwner && paymentReturn !== 'success' && (
          <button
            type="button"
            onClick={() => void pay()}
            disabled={busy}
            className="btn-gorilla-square inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-extrabold tracking-normal cursor-pointer disabled:opacity-60 shrink-0"
          >
            <CreditCard className="w-4 h-4" />
            {busy ? (es ? 'Abriendo…' : 'Opening…') : (es ? 'Pagar ahora' : 'Pay now')}
          </button>
        )}
      </div>
    </section>
  );
};
