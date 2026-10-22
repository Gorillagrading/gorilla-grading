import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { PaymentReceiptDto } from '../../../shared/account';

const STATUS_TEXT: Record<PaymentReceiptDto['status'], { es: string; en: string }> = {
  paid: { es: 'Pagado', en: 'Paid' },
  refunded: { es: 'Reembolsado', en: 'Refunded' },
  partially_refunded: { es: 'Reembolso parcial', en: 'Partially refunded' },
};

/**
 * Pagos cobrados del cliente, con el recibo de Stripe de cada uno. Un recibo es el justificante
 * del pago, no una factura: para la factura el cliente escribe al soporte.
 */
export const PaymentReceipts: React.FC<{
  payments: PaymentReceiptDto[];
  lang: 'es' | 'en';
  isLight: boolean;
  onOpenOrder: (code: string) => void;
}> = ({ payments, lang, isLight, onOpenOrder }) => {
  const es = lang === 'es';
  const locale = es ? 'es-ES' : 'en-GB';
  const card = isLight ? 'bg-white border-[#E2DBD0] shadow-sm' : 'bg-[#383838] border-[#4E4E4E]';
  const text = isLight ? 'text-[#14170F]' : 'text-white';
  const muted = isLight ? 'text-neutral-500' : 'text-[#A4ACA1]';
  const rule = isLight ? 'border-[#E2DBD0]' : 'border-[#4E4E4E]';
  const accent = isLight ? 'text-[#15803D]' : 'text-[#61B663]';
  const money = (cents: number, currency: string) =>
    (cents / 100).toLocaleString(locale, { style: 'currency', currency: currency || 'EUR' });
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

  const note = (
    <p className={`text-xs leading-relaxed ${muted}`}>
      {es
        ? 'Los recibos los emite Stripe como justificante de pago. Si necesitas una factura, escríbenos a '
        : 'Receipts are issued by Stripe as proof of payment. If you need an invoice, write to us at '}
      <a href="mailto:info@gorillagrading.com" className={`underline underline-offset-4 ${accent}`}>info@gorillagrading.com</a>.
    </p>
  );

  if (payments.length === 0) {
    return (
      <div className={`border rounded-xl p-8 sm:p-12 flex flex-col items-center text-center gap-3 ${card}`}>
        <h3 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] ${text}`}>
          {es ? 'Pagos y recibos' : 'Payments & receipts'}
        </h3>
        <p className={`text-sm max-w-md leading-relaxed ${isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'}`}>
          {es ? 'Todavía no tienes ningún pago. Cuando pagues un pedido, aparecerá aquí con su recibo.' : 'You have no payments yet. When you pay for an order, it will appear here with its receipt.'}
        </p>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${card}`}>
      <div className={`px-5 sm:px-6 py-4 border-b ${rule}`}>
        <h3 className={`font-['Nunito',sans-serif] text-lg sm:text-xl uppercase font-[900] ${text}`}>
          {es ? 'Pagos y recibos' : 'Payments & receipts'}
        </h3>
      </div>
      <ul>
        {payments.map((p) => (
          <li key={`${p.orderCode}-${p.paidAt}`} className={`px-5 sm:px-6 py-4 border-b last:border-b-0 flex flex-wrap items-center gap-x-6 gap-y-2 ${rule}`}>
            <div className="min-w-[120px]">
              <div className={`font-mono text-[10px] uppercase tracking-wider ${muted}`}>{date(p.paidAt)}</div>
              <button
                type="button"
                onClick={() => onOpenOrder(p.orderCode)}
                className={`font-mono text-sm font-bold underline underline-offset-4 cursor-pointer ${text}`}
              >
                {p.orderCode}
              </button>
            </div>
            <div className={`text-base font-[900] ${text}`}>{money(p.amountCents, p.currency)}</div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${p.status === 'paid' ? accent : 'text-amber-600 dark:text-amber-400'}`}>
              {STATUS_TEXT[p.status][lang]}
            </span>
            <div className="flex-1" />
            {p.receiptUrl ? (
              <a
                href={p.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${accent}`}
              >
                {es ? 'Ver recibo' : 'View receipt'} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className={`text-xs ${muted}`}>{es ? 'Recibo en preparación' : 'Receipt being prepared'}</span>
            )}
          </li>
        ))}
      </ul>
      <div className={`px-5 sm:px-6 py-4 border-t ${rule}`}>{note}</div>
    </div>
  );
};
