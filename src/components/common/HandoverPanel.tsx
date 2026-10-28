import React, { useState } from 'react';
import { CalendarDays, Check, Copy, MapPin, Package, Truck } from 'lucide-react';
import { formatEventWhen } from '../../../shared/events';
import { addressLines, type Handover } from '../../../shared/handover';

/**
 * El siguiente paso tras pagar: adónde enviar las cartas o en qué evento entregarlas. Lo ve el dueño
 * del pedido en su seguimiento hasta que el laboratorio recibe las cartas.
 */
export const HandoverPanel: React.FC<{
  code: string;
  handover: Handover;
  lang: 'es' | 'en';
  isLight: boolean;
}> = ({ code, handover, lang, isLight }) => {
  const es = lang === 'es';
  const [copied, setCopied] = useState(false);
  const strong = isLight ? 'text-[#1C201D]' : 'text-white';
  const muted = isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]';
  const panel = isLight ? 'bg-white border-[#E5DEC9] shadow-sm' : 'bg-[#151A15] border-white/10';
  const accent = isLight ? 'text-[#2D9A46]' : 'text-[#48C765]';

  const ship = handover.kind === 'ship';
  const address = ship ? handover.address : null;
  const event = !ship ? handover.event : null;
  const Icon = ship ? Truck : MapPin;

  const copyText = address ? addressLines(address).join('\n') : event ? [event.name, event.venue, event.address, event.city].filter(Boolean).join('\n') : '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso para copiar: la dirección sigue a la vista para copiarla a mano.
    }
  };

  return (
    <section className="w-full px-6 lg:px-12 pt-6">
      <div className={`max-w-[1400px] mx-auto border rounded-2xl overflow-hidden ${panel}`} aria-label={es ? 'Siguiente paso' : 'Next step'}>
        <div className="flex flex-wrap items-center gap-4 px-6 py-5 bg-gradient-to-br from-[#0B2414] via-[#123D22] to-[#17733A] text-white">
          <span className="w-12 h-12 rounded-xl bg-white text-[#123D22] flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A7E3B5]">{es ? 'Siguiente paso' : 'Next step'}</div>
            <h2 className="font-['Nunito',sans-serif] text-xl sm:text-2xl font-[900] leading-tight">
              {ship
                ? (es ? 'Envía tus cartas a esta dirección' : 'Send your cards to this address')
                : (es ? 'Entrega tus cartas en este evento' : 'Hand over your cards at this event')}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A7E3B5]">{es ? 'Nº de pedido' : 'Order no.'}</div>
            <div className="font-mono text-xl font-bold tracking-wider">{code}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
          {/* Adónde */}
          <div>
            {ship && address && (
              <address className={`not-italic text-base leading-relaxed ${strong}`}>
                {addressLines(address).map((line, i) => (
                  <div key={i} className={i === 0 ? 'font-bold' : ''}>{line}</div>
                ))}
                {address.hours && <div className={`text-sm mt-2 ${muted}`}>{es ? 'Horario de recepción: ' : 'Receiving hours: '}{address.hours}</div>}
                {address.phone && <div className={`text-sm ${muted}`}>{es ? 'Teléfono: ' : 'Phone: '}{address.phone}</div>}
              </address>
            )}
            {ship && !address && (
              <p className={`text-sm leading-relaxed ${strong}`}>
                {es
                  ? 'Te enviaremos por correo la dirección exacta del laboratorio antes de que prepares el paquete.'
                  : 'We will email you the exact laboratory address before you prepare your package.'}
              </p>
            )}
            {!ship && event && (
              <div className="space-y-2">
                <div className={`font-['Nunito',sans-serif] text-lg font-[900] ${strong}`}>{event.name}</div>
                <div className={`flex items-start gap-2 text-sm ${strong}`}>
                  <CalendarDays className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} aria-hidden="true" />
                  <span className="first-letter:uppercase">{formatEventWhen(event.startsAt, event.endsAt, lang)}</span>
                </div>
                <div className={`flex items-start gap-2 text-sm ${strong}`}>
                  <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} aria-hidden="true" />
                  <span>{[event.venue, event.address, event.city].filter(Boolean).join(' · ')}</span>
                </div>
                {event.details && <p className={`text-sm ${muted}`}>{event.details}</p>}
              </div>
            )}
            {!ship && !event && (
              <p className={`text-sm leading-relaxed ${strong}`}>
                {es ? 'Te escribiremos con el lugar y la fecha de entrega.' : 'We will email you the drop-off place and date.'}
              </p>
            )}
            {copyText && (
              <button
                type="button"
                onClick={copy}
                className={`mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                  isLight ? 'border-[#DCD5C3] hover:border-[#2D9A46] text-[#1C201D]' : 'border-white/15 hover:border-[#48C765] text-white'
                }`}
              >
                {copied ? <Check className={`w-3.5 h-3.5 ${accent}`} aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? (es ? 'Copiado' : 'Copied') : ship ? (es ? 'Copiar dirección' : 'Copy address') : (es ? 'Copiar lugar' : 'Copy location')}
              </button>
            )}
          </div>

          {/* Qué hacer */}
          <ol className={`space-y-3 text-sm ${strong}`}>
            {(ship
              ? [
                  es ? 'Protege cada carta en su funda y prepara un paquete resistente.' : 'Protect each card in a sleeve and use a sturdy package.',
                  es ? `Escribe el número de pedido ${code} en una nota dentro del paquete.` : `Write the order number ${code} on a note inside the package.`,
                  es ? 'Te avisaremos por correo en cuanto lleguen al laboratorio.' : 'We will email you as soon as they arrive at the laboratory.',
                ]
              : [
                  es ? 'Lleva tus cartas protegidas, cada una en su funda.' : 'Bring your cards protected, each one in a sleeve.',
                  es ? `Al llegar, dile al equipo tu número de pedido ${code}.` : `When you arrive, tell the team your order number ${code}.`,
                  es ? 'Te avisaremos por correo en cuanto las recibamos.' : 'We will email you as soon as we receive them.',
                ]
            ).map((stepText, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-6 h-6 shrink-0 rounded-full bg-[#2D9A46] text-white text-xs font-black flex items-center justify-center">{i + 1}</span>
                <span className="pt-0.5">{stepText}</span>
              </li>
            ))}
            <li className={`flex items-center gap-2 pt-1 text-xs ${muted}`}>
              <Package className="w-3.5 h-3.5" aria-hidden="true" />
              {es ? 'También te lo hemos enviado por correo.' : 'We have also sent this to you by email.'}
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
};
