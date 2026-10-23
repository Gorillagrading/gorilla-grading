import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink } from 'lucide-react';
import type { PaymentReceiptDto } from '../../../shared/account';

type Lang = 'es' | 'en';

const T = {
  es: {
    title: 'Pagos y justificantes',
    kicker: 'HISTORIAL DE PAGOS',
    intro: 'Cada pago de tus pedidos, con su desglose. Ábrelo para verlo, imprimirlo o guardarlo en PDF.',
    payments: 'PAGOS',
    totalPaid: 'TOTAL PAGADO',
    expandAll: 'EXPANDIR TODOS',
    collapseAll: 'REDUCIR TODOS',
    expand: 'EXPANDIR',
    collapse: 'REDUCIR',
    order: 'Pedido',
    services: 'servicios',
    total: 'TOTAL',
    paid: 'PAGADO',
    refunded: 'REEMBOLSADO',
    partial: 'REEMBOLSO PARCIAL',
    breakdown: 'DESGLOSE DEL PAGO',
    service: (name: string) => `Servicio ${name}`,
    insuredReturn: 'Devolución por mensajería asegurada',
    insurance: 'Seguro',
    base: 'Base imponible',
    vat: (pct: number) => `IVA incluido (${pct} %)`,
    totalPaidLabel: 'TOTAL PAGADO',
    included: 'El seguro y el IVA ya van incluidos en el precio de los servicios.',
    view: 'Ver justificante',
    download: 'Descargar PDF',
    stripe: 'Recibo de Stripe',
    empty: 'Todavía no tienes ningún pago. Cuando pagues un pedido aparecerá aquí con su justificante.',
    note: 'Un justificante de pago no es una factura. Si necesitas una factura, escríbenos a',
    // Documento
    docTitle: 'JUSTIFICANTE DE PAGO',
    customer: 'CLIENTE',
    detail: 'DETALLE DEL PAGO',
    concept: 'Concepto',
    date: 'Fecha del pago',
    reference: 'Referencia',
    method: 'Método',
    methodValue: 'Tarjeta, procesada por Stripe',
    qty: 'Cant.',
    unit: 'Precio ud.',
    amount: 'Importe',
    close: 'Cerrar',
    printPdf: 'Descargar / Imprimir PDF',
    notInvoice: 'Este documento es un justificante de pago y no una factura.',
    notInvoiceLong: 'Acredita que el pago se ha recibido. Si necesitas una factura, solicítala a info@gorillagrading.com indicando el número de pedido.',
    printedOn: 'Impreso el',
  },
  en: {
    title: 'Payments & receipts',
    kicker: 'PAYMENT HISTORY',
    intro: 'Every payment for your orders, itemised. Open one to view it, print it or save it as a PDF.',
    payments: 'PAYMENTS',
    totalPaid: 'TOTAL PAID',
    expandAll: 'EXPAND ALL',
    collapseAll: 'COLLAPSE ALL',
    expand: 'EXPAND',
    collapse: 'COLLAPSE',
    order: 'Order',
    services: 'services',
    total: 'TOTAL',
    paid: 'PAID',
    refunded: 'REFUNDED',
    partial: 'PARTIALLY REFUNDED',
    breakdown: 'PAYMENT BREAKDOWN',
    service: (name: string) => `${name} service`,
    insuredReturn: 'Insured courier return',
    insurance: 'Insurance',
    base: 'Net amount',
    vat: (pct: number) => `VAT included (${pct}%)`,
    totalPaidLabel: 'TOTAL PAID',
    included: 'Insurance and VAT are already included in the service prices.',
    view: 'View receipt',
    download: 'Download PDF',
    stripe: 'Stripe receipt',
    empty: 'You have no payments yet. When you pay for an order it will appear here with its receipt.',
    note: 'A payment receipt is not an invoice. If you need an invoice, write to us at',
    docTitle: 'PAYMENT RECEIPT',
    customer: 'CUSTOMER',
    detail: 'PAYMENT DETAILS',
    concept: 'Item',
    date: 'Payment date',
    reference: 'Reference',
    method: 'Method',
    methodValue: 'Card, processed by Stripe',
    qty: 'Qty',
    unit: 'Unit price',
    amount: 'Amount',
    close: 'Close',
    printPdf: 'Download / Print PDF',
    notInvoice: 'This document is a payment receipt and not an invoice.',
    notInvoiceLong: 'It confirms that the payment was received. If you need an invoice, request it at info@gorillagrading.com quoting the order number.',
    printedOn: 'Printed on',
  },
} as const;

const statusLabel = (s: PaymentReceiptDto['status'], t: (typeof T)[Lang]) => (s === 'paid' ? t.paid : s === 'refunded' ? t.refunded : t.partial);

export const PaymentReceipts: React.FC<{
  payments: PaymentReceiptDto[];
  lang: Lang;
  isLight: boolean;
  onOpenOrder: (code: string) => void;
}> = ({ payments, lang, isLight, onOpenOrder }) => {
  const t = T[lang];
  const locale = lang === 'es' ? 'es-ES' : 'en-GB';
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<PaymentReceiptDto | null>(null);

  const money = (cents: number, currency = 'EUR') => (cents / 100).toLocaleString(locale, { style: 'currency', currency });
  const dateOf = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  const keyOf = (p: PaymentReceiptDto) => `${p.orderCode}-${p.paidAt}`;
  const allExpanded = payments.length > 0 && payments.every((p) => expanded[keyOf(p)]);
  const settled = payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amountCents : 0), 0);
  const serviceCount = (p: PaymentReceiptDto) => p.lines.reduce((n, l) => n + l.quantity, 0);

  const box = isLight ? 'bg-white border-[#D8D2C5] shadow-sm text-[#14170F]' : 'bg-[#383838] border-[#4E4E4E] text-white shadow-md';
  const tile = isLight ? 'bg-[#F7F4EC] border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]';
  const accent = 'text-[#16A34A] dark:text-[#48C765]';

  if (payments.length === 0) {
    return (
      <div className={`border rounded-xl p-8 sm:p-12 flex flex-col items-center text-center gap-3 ${isLight ? 'bg-white border-[#E2DBD0] shadow-sm' : 'bg-[#383838] border-[#4E4E4E]'}`}>
        <h3 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] ${isLight ? 'text-[#14170F]' : 'text-white'}`}>{t.title}</h3>
        <p className={`text-sm max-w-md leading-relaxed ${isLight ? 'text-neutral-600' : 'text-[#D1D5DB]'}`}>{t.empty}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Cabecera con el resumen */}
      <div className={`p-5 sm:p-6 border rounded-xl relative overflow-hidden ${box}`}>
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#16A34A] via-[#38BDF8] to-[#16A34A] opacity-70" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className={`font-mono text-[9px] uppercase tracking-[0.22em] font-bold mb-1.5 ${accent}`}>{t.kicker}</div>
            <h2 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase tracking-normal font-[900]">{t.title}</h2>
            <p className={`font-mono text-xs mt-1 max-w-xl ${isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'}`}>{t.intro}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className={`px-4 py-2.5 border rounded-lg ${tile}`}>
              <span className="block text-[8px] uppercase tracking-wider text-neutral-400">{t.payments}</span>
              <span className="font-['Nunito',sans-serif] text-base font-[900]">{payments.length}</span>
            </div>
            <div className={`px-4 py-2.5 border rounded-lg ${tile}`}>
              <span className="block text-[8px] uppercase tracking-wider text-neutral-400">{t.totalPaid}</span>
              <span className={`font-['Nunito',sans-serif] text-base font-[900] ${accent}`}>{money(settled)}</span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(Object.fromEntries(payments.map((p) => [keyOf(p), !allExpanded])))}
              className={`px-3.5 py-2.5 border rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer select-none ${
                isLight ? 'bg-white hover:bg-[#F2EFE8] border-[#D8D2C5] text-[#14170F]' : 'bg-[#2A2A2A] hover:bg-[#333333] border-[#4E4E4E] text-white'
              }`}
            >
              <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${allExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
              {allExpanded ? t.collapseAll : t.expandAll}
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas desplegables */}
      <div className="flex flex-col gap-4 sm:gap-5">
        {payments.map((p) => {
          const k = keyOf(p);
          const isOpen = !!expanded[k];
          const toggle = () => setExpanded({ ...expanded, [k]: !isOpen });
          return (
            <div
              key={k}
              className={`border rounded-xl relative overflow-hidden transition-all duration-300 ${
                isLight ? 'bg-[#FAF9F5] border-[#D8D2C5] text-[#191D19] shadow-sm hover:border-[#16A34A]/80' : 'bg-[#383838] border-[#4E4E4E] text-white hover:border-[#61B663]/60 shadow-md'
              }`}
            >
              <div className="relative z-10 p-4 sm:p-6 pl-5 sm:pl-7 flex flex-col">
                <div
                  onClick={toggle}
                  className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none ${isOpen ? 'pb-4 border-b border-dashed border-current/15' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${isLight ? 'bg-[#F5F2EB] border-[#D8D2C5]' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
                      <svg className={`w-5 h-5 ${accent}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-['Nunito',sans-serif] text-lg sm:text-xl font-[900] tracking-normal">{p.orderCode}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-neutral-500 mt-0.5">
                        <span>{dateOf(p.paidAt)}</span>
                        <span>&bull;</span>
                        <span>{serviceCount(p)} {t.services}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono flex items-center gap-2 ${isLight ? 'bg-white border-[#E0D9CB]' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-normal">{t.total}:</span>
                      <span className={`font-['Nunito',sans-serif] text-base font-[900] tracking-tight ${accent}`}>{money(p.amountCents, p.currency)}</span>
                    </div>
                    <span className={`font-mono text-[10px] font-bold uppercase tracking-wider ${p.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {statusLabel(p.status, t)}
                    </span>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle();
                      }}
                      className={`px-3 py-1.5 rounded-lg font-['Nunito',sans-serif] text-xs font-[800] uppercase tracking-wider border flex items-center gap-2 cursor-pointer select-none shadow-sm ${
                        isOpen
                          ? (isLight ? 'bg-black text-white border-black' : 'bg-white/10 text-white border-white/20')
                          : (isLight ? 'bg-white hover:bg-neutral-100 text-[#14170F] border-[#D4CDC0]' : 'bg-[#2A2A2A] hover:bg-[#333333] text-white border-[#4E4E4E]')
                      }`}
                    >
                      <span>{isOpen ? t.collapse : t.expand}</span>
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1400px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    <div className="lg:col-span-7 space-y-2">
                      <span className={`font-mono text-[9px] uppercase tracking-[0.18em] font-bold block ${accent}`}>// {t.breakdown}</span>
                      <div className="space-y-1.5 font-mono text-xs">
                        {p.lines.map((l) => (
                          <div key={`${l.tierName}-${l.unitCents}`} className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border ${isLight ? 'bg-white/80 border-[#E2DCCE]' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
                            <div>
                              <p className="font-sans font-medium text-xs leading-snug">{t.service(l.tierName)}</p>
                              <p className={`font-sans text-[10px] mt-0.5 ${isLight ? 'text-neutral-500' : 'text-[#8E968B]'}`}>{l.quantity} × {money(l.unitCents, p.currency)}</p>
                            </div>
                            <span className="font-bold text-xs shrink-0">{money(l.quantity * l.unitCents, p.currency)}</span>
                          </div>
                        ))}
                        {p.breakdown.shippingCents > 0 && (
                          <div className={`flex items-start justify-between gap-2 p-2.5 rounded-lg border ${isLight ? 'bg-white/80 border-[#E2DCCE]' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
                            <p className="font-sans font-medium text-xs leading-snug">{t.insuredReturn}</p>
                            <span className="font-bold text-xs shrink-0">{money(p.breakdown.shippingCents, p.currency)}</span>
                          </div>
                        )}
                      </div>
                      <p className="font-mono text-[9px] text-neutral-400 pt-1">{t.included}</p>
                    </div>

                    <div className={`lg:col-span-5 p-4 rounded-xl border flex flex-col justify-between gap-4 font-mono ${isLight ? 'bg-white border-[#D4CDC0] shadow-sm' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
                      <div className="space-y-1.5 text-xs border-b border-current/10 pb-3">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">{t.base}:</span>
                          <span className="font-bold">{money(p.breakdown.baseCents, p.currency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">{t.vat(vatPercent(p))}:</span>
                          <span className="font-bold">{money(p.breakdown.vatCents, p.currency)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <span className="font-['Nunito',sans-serif] text-sm uppercase font-[900]">{t.totalPaidLabel}</span>
                          <span className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-tight ${isLight ? 'text-[#16A34A]' : 'text-[#48C765]'}`}>
                            {money(p.breakdown.totalCents, p.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2.5">
                        <button type="button" onClick={() => setOpen(p)} className="btn-gorilla-square-secondary w-full sm:flex-1 py-2.5 px-4 text-[11px] font-bold tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{t.view}</span>
                        </button>
                        <button type="button" onClick={() => setOpen(p)} className="btn-gorilla-square w-full sm:flex-1 py-2.5 px-4 text-[11px] font-extrabold tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>{t.download}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        {p.receiptUrl ? (
                          <a href={p.receiptUrl} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${accent}`}>
                            {t.stripe} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span />}
                        <button type="button" onClick={() => onOpenOrder(p.orderCode)} className="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4 cursor-pointer text-neutral-500">
                          {t.order} {p.orderCode}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={`text-xs leading-relaxed ${isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}`}>
        {t.note} <a href="mailto:info@gorillagrading.com" className={`underline underline-offset-4 ${accent}`}>info@gorillagrading.com</a>.
      </p>

      {open && <ReceiptModal payment={open} lang={lang} isLight={isLight} onClose={() => setOpen(null)} />}
    </div>
  );
};

/** El IVA ya va incluido: el porcentaje se deduce del propio pago, así un cambio futuro del tipo no altera los justificantes antiguos. */
const vatPercent = (p: PaymentReceiptDto) => (p.breakdown.baseCents > 0 ? Math.round((p.breakdown.vatCents / p.breakdown.baseCents) * 100) : 0);

// ---------------------------------------------------------------------------
// Vista previa e impresión
// ---------------------------------------------------------------------------

const ReceiptModal: React.FC<{ payment: PaymentReceiptDto; lang: Lang; isLight: boolean; onClose: () => void }> = ({ payment: p, lang, isLight, onClose }) => {
  const t = T[lang];
  const locale = lang === 'es' ? 'es-ES' : 'en-GB';
  const money = (cents: number) => (cents / 100).toLocaleString(locale, { style: 'currency', currency: p.currency || 'EUR' });
  const paidAt = new Date(p.paidAt).toLocaleString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const accent = 'text-[#16A34A] dark:text-[#48C765]';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const rows: [string, string][] = [
    [t.date, paidAt],
    [t.reference, p.orderCode],
    [t.method, t.methodValue],
  ];

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label={t.docTitle}>
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
        <div className={`relative w-full max-w-3xl my-auto flex flex-col max-h-[95vh] overflow-hidden border rounded-xl shadow-2xl ${
          isLight ? 'bg-[#FCFBF8] border-[#D8D2C5] text-[#191D19]' : 'bg-[#383838] border-[#4E4E4E] text-white'
        }`}>
          <div className="h-1.5 w-full bg-gradient-to-r from-[#16A34A] via-[#38BDF8] to-[#16A34A] opacity-90" />

          <div className={`shrink-0 px-5 sm:px-8 py-4 border-b flex items-start justify-between gap-4 ${isLight ? 'border-[#E2DCCE] bg-white/80' : 'border-[#4E4E4E] bg-[#2A2A2A]'}`}>
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900]">{t.docTitle}</h3>
                <span className={`font-mono text-xs sm:text-sm font-bold tracking-wider ${accent}`}>[{p.orderCode}]</span>
              </div>
              <p className={`font-mono text-[9px] uppercase tracking-wider mt-0.5 ${isLight ? 'text-neutral-600' : 'text-[#A4ACA1]'}`}>Gorilla Grading &bull; gorillagrading.com</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline font-mono text-[10px] font-bold uppercase tracking-wider ${accent}`}>[{statusLabel(p.status, t)}]</span>
              <button type="button" onClick={onClose} aria-label={t.close} className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer ${isLight ? 'border-[#D4CDC0] hover:bg-black/5' : 'border-[#4E4E4E] hover:bg-[#2A2A2A]'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5">
            <div className={`grid grid-cols-1 sm:grid-cols-2 border rounded-xl overflow-hidden ${isLight ? 'border-[#E2DCCE] divide-y sm:divide-y-0 sm:divide-x divide-[#E2DCCE] bg-white/70' : 'border-[#4E4E4E] divide-y sm:divide-y-0 sm:divide-x divide-[#4E4E4E] bg-[#2A2A2A]'}`}>
              <div className="p-4">
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] font-bold block mb-2 ${accent}`}>// {t.customer}</span>
                <p className="font-['Nunito',sans-serif] text-sm font-bold">{p.customer.name || p.customer.email}</p>
                {p.customer.name && <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-neutral-600' : 'text-[#B8BFB5]'}`}>{p.customer.email}</p>}
              </div>
              <div className="p-4">
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] font-bold block mb-2 ${accent}`}>// {t.detail}</span>
                <div className="space-y-1.5 font-mono text-xs">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <span className={isLight ? 'text-neutral-500' : 'text-[#A4ACA1]'}>{k}:</span>
                      <span className="font-semibold text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`border rounded-xl overflow-hidden ${isLight ? 'border-[#E2DCCE] bg-white/90' : 'border-[#4E4E4E] bg-[#2A2A2A]'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[300px] sm:min-w-[460px]">
                  <thead>
                    <tr className={`border-b font-mono text-[9px] uppercase tracking-[0.16em] ${isLight ? 'bg-[#F4EFE6] border-[#E2DCCE] text-neutral-700' : 'bg-[#333333] border-[#4E4E4E] text-[#A4ACA1]'}`}>
                      <th className="px-4 py-2.5 font-bold">{t.concept}</th>
                      <th className="px-3 py-2.5 font-bold text-center">{t.qty}</th>
                      <th className="px-3 py-2.5 font-bold text-right hidden sm:table-cell">{t.unit}</th>
                      <th className="px-4 py-2.5 font-bold text-right">{t.amount}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${isLight ? 'divide-[#EFE9DF]' : 'divide-[#4E4E4E]/60'}`}>
                    {p.lines.map((l) => (
                      <tr key={`${l.tierName}-${l.unitCents}`}>
                        <td className="px-4 py-3 font-sans font-bold text-xs">{t.service(l.tierName)}</td>
                        <td className="px-3 py-3 text-center text-xs">{l.quantity}</td>
                        <td className="px-3 py-3 text-right text-xs hidden sm:table-cell">{money(l.unitCents)}</td>
                        <td className="px-4 py-3 text-right font-bold text-xs">{money(l.quantity * l.unitCents)}</td>
                      </tr>
                    ))}
                    {p.breakdown.shippingCents > 0 && (
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-xs">{t.insuredReturn}</td>
                        <td className="px-3 py-3 text-center text-xs">1</td>
                        <td className="px-3 py-3 text-right text-xs hidden sm:table-cell">{money(p.breakdown.shippingCents)}</td>
                        <td className="px-4 py-3 text-right font-bold text-xs">{money(p.breakdown.shippingCents)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-7 flex items-center gap-4">
                <div className={`border-2 w-24 h-24 p-1 flex items-center justify-center text-center font-mono uppercase rotate-[-5deg] select-none shrink-0 opacity-90 ${accent} border-[#16A34A]/80 dark:border-[#48C765]/80`}>
                  <div className="w-full h-full border border-dashed border-current flex flex-col items-center justify-center leading-tight">
                    <span className="text-[7px] tracking-widest">GORILLA GRADING</span>
                    <span className="font-['Nunito',sans-serif] text-[13px] font-[900] my-0.5">{statusLabel(p.status, t)}</span>
                    <span className="text-[6px] tracking-wider opacity-80">{new Date(p.paidAt).toLocaleDateString(locale)}</span>
                  </div>
                </div>
                <p className={`text-[10px] leading-snug ${isLight ? 'text-neutral-500' : 'text-[#8E968B]'}`}><strong>{t.notInvoice}</strong> {t.notInvoiceLong}</p>
              </div>

              <div className={`sm:col-span-5 border rounded-xl p-3.5 font-mono ${isLight ? 'border-[#D4CDC0] bg-white shadow-sm' : 'border-[#4E4E4E] bg-[#2A2A2A]'}`}>
                <div className="flex justify-between py-1 text-xs border-b border-current/10">
                  <span className="text-neutral-500">{t.base}:</span>
                  <span className="font-bold">{money(p.breakdown.baseCents)}</span>
                </div>
                <div className="flex justify-between py-1 text-xs border-b border-current/10">
                  <span className="text-neutral-500">{t.vat(vatPercent(p))}:</span>
                  <span className="font-bold">{money(p.breakdown.vatCents)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 mt-1">
                  <span className="font-['Nunito',sans-serif] text-xs sm:text-sm uppercase font-[900]">{t.totalPaidLabel}</span>
                  <span className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] tracking-tight ${isLight ? 'text-[#16A34A]' : 'text-[#48C765]'}`}>{money(p.breakdown.totalCents)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`shrink-0 px-5 sm:px-8 py-3.5 border-t flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 ${isLight ? 'bg-[#F4EFE6] border-[#E2DCCE]' : 'bg-[#2A2A2A] border-[#4E4E4E]'}`}>
            <span className="hidden sm:block font-mono text-[9px] uppercase tracking-wider text-neutral-500">// {t.notInvoice}</span>
            <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
              <button type="button" onClick={onClose} className="btn-gorilla-square-secondary py-2.5 px-6 text-xs font-bold tracking-normal cursor-pointer">{t.close}</button>
              <button type="button" onClick={() => window.print()} className="btn-gorilla-square py-2.5 px-7 text-xs font-extrabold tracking-normal flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span>{t.printPdf}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <ReceiptPrint payment={p} lang={lang} />
    </>
  );
};

/** Hoja A4 del justificante: solo visible al imprimir (los estilos están en index.css, junto a los del certificado). */
const ReceiptPrint: React.FC<{ payment: PaymentReceiptDto; lang: Lang }> = ({ payment: p, lang }) => {
  const t = T[lang];
  const locale = lang === 'es' ? 'es-ES' : 'en-GB';
  const money = (cents: number) => (cents / 100).toLocaleString(locale, { style: 'currency', currency: p.currency || 'EUR' });
  const fullDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });

  return createPortal(
    <div className="print-dossier print-receipt" lang={lang}>
      <header className="rp-header">
        <div className="rp-brand">
          <img src="/brand/logo-green.png" alt="" />
          <div>
            <div className="rp-brand-name">GORILLA</div>
            <div className="rp-brand-sub">GRADING</div>
          </div>
        </div>
        <div className="rp-header-right">
          <div className="rp-kicker">{t.docTitle}</div>
          <div className="rp-number">{p.orderCode}</div>
          <div className="rp-small">{fullDate(p.paidAt)}</div>
        </div>
      </header>

      <section className="rp-meta">
        <div>
          <div className="rp-label">{t.customer}</div>
          <div className="rp-strong">{p.customer.name || p.customer.email}</div>
          {p.customer.name && <div>{p.customer.email}</div>}
        </div>
        <div>
          <div className="rp-label">{t.detail}</div>
          <div><span className="rp-muted">{t.date}:</span> {new Date(p.paidAt).toLocaleString(locale, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div><span className="rp-muted">{t.reference}:</span> {p.orderCode}</div>
          <div><span className="rp-muted">{t.method}:</span> {t.methodValue}</div>
        </div>
      </section>

      <table className="rp-table">
        <thead>
          <tr>
            <th>{t.concept}</th>
            <th className="rp-r">{t.qty}</th>
            <th className="rp-r">{t.unit}</th>
            <th className="rp-r">{t.amount}</th>
          </tr>
        </thead>
        <tbody>
          {p.lines.map((l) => (
            <tr key={`${l.tierName}-${l.unitCents}`}>
              <td>{t.service(l.tierName)}</td>
              <td className="rp-r">{l.quantity}</td>
              <td className="rp-r">{money(l.unitCents)}</td>
              <td className="rp-r">{money(l.quantity * l.unitCents)}</td>
            </tr>
          ))}
          {p.breakdown.shippingCents > 0 && (
            <tr>
              <td>{t.insuredReturn}</td>
              <td className="rp-r">1</td>
              <td className="rp-r">{money(p.breakdown.shippingCents)}</td>
              <td className="rp-r">{money(p.breakdown.shippingCents)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <section className="rp-totals-row">
        <div className="rp-stamp">
          <span>{statusLabel(p.status, t)}</span>
          <small>{new Date(p.paidAt).toLocaleDateString(locale)}</small>
        </div>
        <div className="rp-totals">
          <div><span>{t.base}</span><span>{money(p.breakdown.baseCents)}</span></div>
          <div><span>{t.vat(vatPercent(p))}</span><span>{money(p.breakdown.vatCents)}</span></div>
          <div className="rp-grand"><span>{t.totalPaidLabel}</span><span>{money(p.breakdown.totalCents)}</span></div>
        </div>
      </section>
      <p className="rp-muted rp-included">{t.included}</p>

      <footer className="rp-footer">
        <p><strong>{t.notInvoice}</strong> {t.notInvoiceLong}</p>
        <p>{t.printedOn} {fullDate(new Date().toISOString())} · gorillagrading.com · info@gorillagrading.com</p>
      </footer>
    </div>,
    document.body,
  );
};
