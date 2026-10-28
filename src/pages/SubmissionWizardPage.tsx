import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SERVICE_TIERS } from '../data/serviceTiers';
import { ServiceTier } from '../types';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { fetchQuote, fetchUpcomingEvents, startCheckout, submitOrder } from '../api/orders';
import { formatEventWhen, type PublicEventDto } from '../../shared/events';
import { formatEur } from '../utils/money';
import { InlineSignIn } from '../components/common/InlineSignIn';
import type { QuoteDto, QuoteIssue } from '../../shared/orders';
import { CalendarDays, CheckCircle2, Clock, Check, ShieldCheck, Lock, MapPin, Truck } from 'lucide-react';
import { 
  BlueprintCaliper, 
  BlueprintScanner, 
  BlueprintMagnifier, 
  BlueprintBriefcase 
} from '../components/luxury/LuxuryPricingSection';

interface SubmissionWizardPageProps {
  onNavigate: (path: string) => void;
}

export const SubmissionWizardPage: React.FC<SubmissionWizardPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Arriving with a tier chosen (e.g. from the home cards) shows only that tier plus the calculator
  const [showAllTiers, setShowAllTiers] = useState<boolean>(
    () => !new URLSearchParams(window.location.search).get('tier'),
  );

  const [isFromConfigureShipment, setIsFromConfigureShipment] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fromConfig') === 'true';
  });

  const [wizardCardCount, setWizardCardCount] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const qty = parseInt(params.get('qty') || '0', 10);
    return qty > 0 ? qty : 10;
  });

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(() => {
    const params = new URLSearchParams(window.location.search);
    const stepParam = params.get('step');
    if (stepParam === '2') return 3;
    if (stepParam === '3') return 3;
    if (stepParam === '4') return 4;
    return 1;
  });

  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const tierId = params.get('tier');
    if (tierId) {
      const found = SERVICE_TIERS.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event'));
      if (found) return found;
    }
    return SERVICE_TIERS[0];
  }); 
  
  // Lo que se envía: tantas cartas como se eligieron en el paso 1, todas del mismo servicio. El laboratorio
  // identifica cada carta al recibirla, y cada una va asegurada hasta el máximo de su servicio.
  const cardTier = selectedTier ?? SERVICE_TIERS[0];
  const items = Array.from({ length: Math.max(1, wizardCardCount) }, () => ({ tier: cardTier.id }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tierId = params.get('tier');
    const qtyParam = params.get('qty');
    const fromConfigParam = params.get('fromConfig');
    const stepParam = params.get('step');

    if (fromConfigParam === 'true') {
      setIsFromConfigureShipment(true);
    }

    if (stepParam) {
      const s = parseInt(stepParam, 10);
      // El antiguo paso 2 (datos de cada carta) ya no existe.
      if (s >= 1 && s <= 4) setCurrentStep((s === 2 ? 3 : s) as any);
    }

    if (tierId) {
      const found = SERVICE_TIERS.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event'));
      if (found) {
        setSelectedTier(found);
      }
    }

    if (qtyParam) {
      const qty = parseInt(qtyParam, 10);
      if (qty > 0) {
        setWizardCardCount(qty);
      }
    }
  }, [language]);

  const [shippingMethod, setShippingMethod] = useState<'COURIER_INSURED' | 'CARD_SHOW_DROPOFF'>('COURIER_INSURED');
  // Entrega en mano: el cliente elige uno de los próximos eventos que publica la dirección.
  const [upcomingEvents, setUpcomingEvents] = useState<PublicEventDto[] | null>(null);
  const [eventsFailed, setEventsFailed] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const chosenEvent = upcomingEvents?.find((e) => e.id === eventId) ?? null;
  useEffect(() => {
    fetchUpcomingEvents()
      .then((list) => {
        setUpcomingEvents(list);
        // Si solo hay uno, ya queda elegido.
        if (list.length === 1) setEventId(list[0].id);
      })
      .catch(() => setEventsFailed(true));
  }, []);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedSubmissionId, setGeneratedSubmissionId] = useState('');
  /** El pedido se creó pero falta pagarlo (no se pudo abrir la página de pago). */
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [payError, setPayError] = useState('');

  const es = language === 'es';
  const { user, isLoggedIn } = useAuth();

  // Datos de contacto y dirección de devolución (paso 3).
  const [contact, setContact] = useState({
    fullName: '', email: '', line1: '', city: '', postalCode: '', countryCode: 'ES', phone: '',
  });
  const setField = (key: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setContact((prev) => ({ ...prev, [key]: e.target.value }));
  const [step3Error, setStep3Error] = useState('');

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Identifica este pedido: si el envío se repite (doble clic, mala conexión), el servidor no crea otro.
  const [clientToken] = useState(() => crypto.randomUUID());

  // El precio lo calcula siempre el servidor. Aquí solo se pide y se muestra.
  const [quote, setQuote] = useState<QuoteDto | null>(null);
  const [issues, setIssues] = useState<QuoteIssue[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteFailed, setQuoteFailed] = useState(false);
  const quoteItems = items;
  const quoteKey = JSON.stringify([quoteItems, shippingMethod]);

  useEffect(() => {
    if (quoteItems.length === 0) {
      setQuote(null);
      setIssues([]);
      return;
    }
    let cancelled = false;
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      fetchQuote(quoteItems, shippingMethod)
        .then((result) => {
          if (cancelled) return;
          setQuote(result.quote);
          setIssues(result.issues);
          setQuoteFailed(false);
        })
        .catch(() => {
          if (!cancelled) setQuoteFailed(true);
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quoteKey]);

  // Quien tiene sesión no vuelve a escribir su nombre y correo.
  useEffect(() => {
    if (user) setContact((prev) => ({ ...prev, fullName: prev.fullName || user.fullName || '', email: user.email }));
  }, [user]);

  // El servicio Event solo se entrega en mano en un evento oficial.
  useEffect(() => {
    if (selectedTier?.id === 'event') setShippingMethod('CARD_SHOW_DROPOFF');
  }, [selectedTier]);

  const issueMessage = (issue: QuoteIssue): string => {
    const n = String(issue.index + 1).padStart(2, '0');
    switch (issue.code) {
      case 'event_tier_requires_dropoff':
        return es ? 'El servicio Event solo admite entrega en mano en un evento oficial.' : 'The Event service only accepts in-person drop-off at an official event.';
      case 'unknown_tier':
        return es ? `Carta #${n}: el servicio elegido ya no está disponible.` : `Card #${n}: the chosen service is no longer available.`;
    }
  };

  const validateStep3 = (): string => {
    if (!contact.fullName.trim()) return es ? 'Escribe tu nombre completo.' : 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) return es ? 'Introduce un correo válido.' : 'Enter a valid email.';
    if (shippingMethod === 'CARD_SHOW_DROPOFF' && !chosenEvent) {
      return es ? 'Elige el evento en el que entregarás tus cartas.' : 'Choose the event where you will hand over your cards.';
    }
    if (shippingMethod === 'COURIER_INSURED' && (!contact.line1.trim() || !contact.city.trim() || !contact.postalCode.trim())) {
      return es ? 'Completa la dirección de devolución.' : 'Complete the return address.';
    }
    return '';
  };

  const handleFinalSubmit = async () => {
    if (items.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await submitOrder({
        items,
        shippingMethod,
        eventId: shippingMethod === 'CARD_SHOW_DROPOFF' ? chosenEvent?.id : undefined,
        fullName: contact.fullName.trim(),
        shippingAddress:
          shippingMethod === 'COURIER_INSURED'
            ? {
                line1: contact.line1.trim(),
                city: contact.city.trim(),
                postalCode: contact.postalCode.trim(),
                countryCode: contact.countryCode,
                phone: contact.phone.trim() || undefined,
              }
            : undefined,
        locale: es ? 'es' : 'en',
        clientToken,
        acceptedTerms: true,
      });
      // Con cobro activado se va directamente a la página de pago de Stripe.
      if (order.checkoutUrl) {
        window.location.assign(order.checkoutUrl);
        return;
      }
      setGeneratedSubmissionId(order.code);
      setAwaitingPayment(order.status === 'PAYMENT_PENDING');
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'invalid_order') {
        setIssues((err.extra.issues as QuoteIssue[] | undefined) ?? []);
        setSubmitError(es ? 'El pedido no se puede enviar tal como está. Revisa el servicio elegido en el paso 1.' : 'The order cannot be submitted as it is. Review the chosen service in step 1.');
        setCurrentStep(1);
      } else if (err instanceof ApiError && err.code === 'event_unavailable') {
        setSubmitError(es ? 'El evento que elegiste ya no admite entregas. Elige otro.' : 'The event you chose no longer accepts drop-offs. Choose another one.');
        setEventId(null);
        fetchUpcomingEvents().then(setUpcomingEvents).catch(() => setEventsFailed(true));
        setCurrentStep(3);
      } else if (err instanceof ApiError && err.status === 401) {
        setSubmitError(es ? 'Tu sesión ha caducado. Confirma tu correo otra vez.' : 'Your session has expired. Confirm your email again.');
      } else if (err instanceof ApiError && err.status === 429) {
        setSubmitError(es ? 'Demasiados pedidos seguidos. Espera unos minutos.' : 'Too many orders in a row. Please wait a few minutes.');
      } else {
        setSubmitError(es ? 'No se pudo enviar el pedido. Inténtalo de nuevo.' : 'The order could not be submitted. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, label: es ? 'Servicio' : 'Service', hint: es ? 'Servicio y número de cartas' : 'Service and number of cards' },
    { num: 3, label: es ? 'Datos' : 'Details', hint: es ? 'Contacto y devolución' : 'Contact and return' },
    { num: 4, label: es ? 'Resumen' : 'Summary', hint: es ? 'Revisar y pagar' : 'Review and pay' },
  ];

  if (isSubmitted) {
    return (
      <div className={`max-w-3xl mx-auto px-4 py-24 text-center ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
        <div className="flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className={`w-14 h-14 ${isLight ? 'text-[#16A34A]' : 'text-[#4ADE80]'}`} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-['Nunito',sans-serif] font-[900] uppercase tracking-normal mb-4">
          {awaitingPayment
            ? (language === 'es' ? 'Falta el pago' : 'Payment pending')
            : (language === 'es' ? 'Pedido Confirmado' : 'Order Confirmed')}
        </h1>
        <p className={`mb-8 font-sans ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
          {language === 'es' 
            ? (awaitingPayment
                ? `Tu pedido #${generatedSubmissionId} está guardado, pero no pudimos abrir la página de pago. Quedará registrado en cuanto lo pagues.`
                : `Tu número de pedido es #${generatedSubmissionId}. Te hemos enviado la confirmación por correo electrónico.`)
            : (awaitingPayment
                ? `Your order #${generatedSubmissionId} is saved, but we could not open the payment page. It will be registered as soon as you pay.`
                : `Your order number is #${generatedSubmissionId}. We have emailed you the confirmation.`)}
        </p>
        {payError && <p className="mb-6 text-sm text-red-500">{payError}</p>}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {awaitingPayment && (
            <button
              onClick={async () => {
                setPayError('');
                try {
                  window.location.assign(await startCheckout(generatedSubmissionId));
                } catch {
                  setPayError(language === 'es' ? 'No se pudo abrir la página de pago. Inténtalo desde tu pedido en unos minutos.' : 'Could not open the payment page. Try again from your order in a few minutes.');
                }
              }}
              className="btn-gorilla-square w-full sm:w-auto px-8 py-3.5 text-xs font-extrabold tracking-normal shadow-lg"
            >
              {language === 'es' ? 'PAGAR AHORA' : 'PAY NOW'}
            </button>
          )}
          <button
            onClick={() => onNavigate('/account')}
            className="btn-gorilla-square w-full sm:w-auto px-8 py-3.5 text-xs font-extrabold tracking-normal shadow-lg"
          >
            {language === 'es' ? 'VER MIS PEDIDOS' : 'VIEW MY ORDERS'}
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="btn-gorilla-square-secondary w-full sm:w-auto px-8 py-3.5 text-xs font-bold tracking-normal"
          >
            {language === 'es' ? 'VOLVER AL INICIO' : 'BACK TO HOME'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen pt-24 pb-32 transition-colors duration-300 ${isLight ? 'bg-[#F3EFE6] text-[#1A1D1A]' : 'bg-[#454545] text-white'}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Breadcrumb & Header */}
        <div className={`mb-6 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
          <span className={`cursor-pointer transition-colors ${isLight ? 'hover:text-[#1C201D]' : 'hover:text-white'}`} onClick={() => onNavigate('/')}>
            {language === 'es' ? 'INICIO' : 'HOME'}
          </span> 
          <span>/</span> 
          <span className={isLight ? 'text-[#1C201D] font-bold' : 'text-white'}>{language === 'es' ? 'ENVIAR CARTAS' : 'SUBMIT CARDS'}</span>
        </div>

        <h1 className={`font-['Nunito',sans-serif] text-3xl sm:text-4xl font-[900] uppercase tracking-normal mb-3 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
          {language === 'es' ? 'Centro de envíos' : 'Submission Center'}
        </h1>
        <p className={`font-sans text-sm max-w-xl mb-12 ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
          {language === 'es'
            ? 'Configura tu pedido en tres pasos. Al terminar pagarás de forma segura con Stripe y te enviaremos la confirmación por correo.'
            : 'Configure your order in three steps. At the end you pay securely with Stripe and we email you the confirmation.'}
        </p>

        {/* Pasos del pedido: círculo con el número (o un check si ya está hecho) unidos por una línea de progreso */}
        <nav aria-label={es ? 'Pasos del pedido' : 'Order steps'} className={`mb-12 border rounded-2xl px-4 sm:px-8 py-5 sm:py-6 ${
          isLight ? 'bg-white border-[#E5DEC9] shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'bg-[#151A15] border-white/10'
        }`}>
          <ol className="flex items-start">
            {stepsList.map((step, index) => {
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;
              const last = index === stepsList.length - 1;
              return (
                <li key={step.num} className={`flex items-start ${last ? '' : 'flex-1'}`}>
                  <button
                    type="button"
                    disabled={!isPast}
                    onClick={() => isPast && setCurrentStep(step.num as any)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`group flex items-center gap-3 text-left shrink-0 ${isPast ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                        isPast
                          ? 'bg-[#2D9A46] text-white group-hover:scale-105'
                          : isCurrent
                            ? `bg-[#2D9A46] text-white ring-4 ${isLight ? 'ring-[#2D9A46]/20' : 'ring-[#48C765]/25'}`
                            : isLight ? 'bg-[#F1EDE3] text-[#8A9388] border border-[#DCD5C3]' : 'bg-[#0F130F] text-[#6B7268] border border-white/10'
                      }`}
                    >
                      {isPast ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> : index + 1}
                    </span>
                    <span className="hidden sm:flex flex-col">
                      <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
                        isCurrent ? (isLight ? 'text-[#2D9A46]' : 'text-[#48C765]') : isLight ? 'text-[#8A9388]' : 'text-[#6B7268]'
                      }`}>
                        {es ? `Paso ${index + 1}` : `Step ${index + 1}`}
                      </span>
                      <span className={`font-['Nunito',sans-serif] text-sm font-[900] ${
                        isCurrent || isPast ? (isLight ? 'text-[#1C201D]' : 'text-white') : isLight ? 'text-[#8A9388]' : 'text-[#A4ACA1]'
                      }`}>
                        {step.label}
                      </span>
                      <span className={`text-[11px] ${isLight ? 'text-[#8A9388]' : 'text-[#6B7268]'}`}>{step.hint}</span>
                    </span>
                  </button>
                  {!last && (
                    <span className="flex-1 mx-3 sm:mx-5 mt-5 h-[3px] rounded-full overflow-hidden" aria-hidden="true">
                      <span className={`block h-full rounded-full transition-all duration-500 ${isLight ? 'bg-[#E5DEC9]' : 'bg-white/10'}`}>
                        <span className={`block h-full rounded-full bg-[#2D9A46] transition-all duration-500 ${isPast ? 'w-full' : 'w-0'}`} />
                      </span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {/* En el móvil, el nombre del paso actual va debajo */}
          {(() => {
            const index = stepsList.findIndex((st) => st.num === currentStep);
            const step = stepsList[index];
            return step ? (
              <p className={`sm:hidden mt-3 text-xs ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
                <span className={`font-bold ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>{es ? `Paso ${index + 1} de ${stepsList.length}` : `Step ${index + 1} of ${stepsList.length}`} · {step.label}</span> — {step.hint}
              </p>
            ) : null;
          })()}
        </nav>

        {/* ==============================================================
            STEP 1: SERVICIO (MISMA MATRIZ TÉCNICA OFICIAL QUE PRICING & TIERS)
        ============================================================== */}
        {currentStep === 1 && (() => {
          const serviceLevels = [
            {
              code: 'RCDM.01',
              id: 'standard',
              name: 'STANDARD',
              purpose: language === 'es' 
                ? 'Remesas regulares, sets modernos y colecciones particulares.' 
                : 'Regular submissions, modern sets, and personal binder collections.',
              turnaround: language === 'es' ? '10 días hábiles' : '10 business days',
              maxInsurance: '500 €',
              maxInsuranceNum: 500,
              price: 19,
              accentColor: '#3B82F6'
            },
            {
              code: 'RCDM.02',
              id: 'premium',
              name: 'PREMIUM',
              purpose: language === 'es' 
                ? 'El estándar del mercado. Cartas de valor medio-alto con 4 subgrados métricos.' 
                : 'The market standard. Mid-to-high value cards with micrometric subgrades.',
              turnaround: language === 'es' ? '5 días hábiles' : '5 business days',
              maxInsurance: '1.500 €',
              maxInsuranceNum: 1500,
              price: 25,
              accentColor: '#16A34A'
            },
            {
              code: 'RCDM.03',
              id: 'express',
              name: 'EXPRESS',
              purpose: language === 'es' 
                ? 'Procesamiento en cola preferente para transacciones de mercado y eventos.' 
                : 'Priority queue routing for urgent transactions, market timing, and conventions.',
              turnaround: language === 'es' ? '2 días hábiles' : '2 business days',
              maxInsurance: '3.000 €',
              maxInsuranceNum: 3000,
              price: 50,
              accentColor: '#EA580C'
            },
            {
              code: 'RCDM.EVENT',
              id: 'event',
              name: 'EVENT',
              purpose: language === 'es' 
                ? 'Servicio exclusivo para eventos y ferias. Solo entrega presencial en pop ups.' 
                : 'Exclusive service for events and fairs. In-person drop-off only at pop ups.',
              turnaround: '48 h',
              maxInsurance: '1.000 €',
              maxInsuranceNum: 1000,
              price: 15,
              accentColor: '#CA8A04'
            }
          ];

          const handleSelectTier = (lvlId: string) => {
            const found = SERVICE_TIERS.find(s => s.id === lvlId) || SERVICE_TIERS[0];
            setSelectedTier(found);
          };

          const handleProceedToStep2 = () => {
            setIsFromConfigureShipment(true);
            setCurrentStep(3);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          };

          const currentSelectedLevel = serviceLevels.find(s => s.id === (selectedTier?.id || 'standard')) || serviceLevels[0];

          const getBulkDiscountRate = (qty: number) => {
            if (qty >= 50) return 0.12; // 12%
            if (qty >= 25) return 0.08; // 8%
            if (qty >= 10) return 0.05; // 5%
            return 0;
          };

          const calcDiscountRate = getBulkDiscountRate(wizardCardCount);
          const baseUnitPrice = currentSelectedLevel.price;
          const calculatedUnitPrice = Math.round(baseUnitPrice * (1 - calcDiscountRate));
          const calculatedTotalAmount = calculatedUnitPrice * wizardCardCount;

          return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Header idéntico a PRICING & TIERS */}
              <div className="flex flex-col items-start max-w-4xl mb-8">
                <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] tracking-[0.25em] uppercase text-gray-500 mb-2">
                  <span>[ {language === 'es' ? 'PASO 01 · MATRIZ OFICIAL DE TARIFAS DE LABORATORIO' : 'STEP 01 · OFFICIAL LABORATORY TARIFF MATRIX'} ]</span>
                </div>

                <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl md:text-4xl font-[900] tracking-normal uppercase leading-tight ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                  {language === 'es' ? 'TARIFAS Y CONDICIONES DE SERVICIO' : 'LABORATORY RATES & SERVICE SPECIFICATIONS'}
                </h2>

                <p className={`mt-2 font-sans text-xs sm:text-sm max-w-2xl leading-relaxed ${isLight ? 'text-gray-600' : 'text-[#A4ACA1]'}`}>
                  {language === 'es'
                    ? 'Precios unitarios fijos por carta según el plazo de retorno requerido y el límite de valor asegurado en laboratorio. Selecciona el nivel de servicio para configurar tu remesa.'
                    : 'Fixed unit fees per card determined strictly by required laboratory turnaround and declared insurance coverage. Select your service tier to begin.'}
                </p>
              </div>

              {/* TECHNICAL TARIFF MATRIX (MISMO DISEÑO EXACTO QUE PRICING & TIERS) */}
              <div className={`w-full border overflow-hidden shadow-sm mb-8 ${
                isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#141815] border-white/10'
              }`}>
                
                {showAllTiers ? (
                <>
                {/* Matrix Top Header Bar - Limpio, Sobrio y Profesional */}
                <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
                  isLight 
                    ? 'bg-gray-50 border-[#E5E7EB] text-gray-600' 
                    : 'bg-white/[0.04] border-white/10 text-gray-200'
                }`}>
                  <span className="font-bold tracking-wider uppercase">
                    {language === 'es' ? 'CUADRO REGULATORIO DE GRADUACIÓN ÓPTICA' : 'OPTICAL GRADING REGULATORY MATRIX'}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <span>{language === 'es' ? 'CALIBRE LÁSER 0.01mm' : '0.01mm LASER CALIPER'}</span>
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b font-mono text-[10.5px] uppercase tracking-wider ${
                        isLight ? 'bg-gray-50/50 text-gray-500 border-gray-200' : 'bg-black/70 text-gray-300 border-white/10'
                      }`}>
                        <th className="py-2 px-4 font-semibold">{language === 'es' ? 'NIVEL DE SERVICIO' : 'SERVICE TIER'}</th>
                        <th className="py-2 px-4 font-semibold">{language === 'es' ? 'PLAZO DE RETORNO' : 'ESTIMATED TURNAROUND'}</th>
                        <th className="py-2 px-4 font-semibold">{language === 'es' ? 'SEGURO MÁXIMO' : 'MAX INSURANCE'}</th>
                        <th className="py-2 px-4 font-semibold text-right">{language === 'es' ? 'TARIFA / CARTA' : 'RATE / CARD'}</th>
                        <th className="py-2 px-4 font-semibold text-center">{language === 'es' ? 'ACCIÓN' : 'ACTION'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/70 dark:divide-white/10 font-mono text-xs">
                      {serviceLevels.map((lvl, index) => {
                        const isSelected = selectedTier?.id === lvl.id;
                        const isEven = index % 2 === 0;

                        // Dark Mode uses only two colors: neutral grays plus a single green accent
                        const darkTierColor = '#4ADE80';

                        const rowBg = isSelected
                          ? (isLight
                              ? 'bg-[#E7F6EA]'
                              : 'bg-[#14301C]')
                          : (isLight
                              ? (isEven ? 'bg-white' : 'bg-[#F2EFE8]')
                              : (isEven ? 'bg-[#141815]' : 'bg-[#1A1E1A]'));

                        const hoverBg = isLight 
                          ? 'hover:bg-[#E7F6EA] hover:border-l-[#16A34A]' 
                          : 'hover:bg-[#122A17] hover:border-l-[#4ADE80]';

                        return (
                          <tr 
                            key={lvl.id}
                            onClick={() => handleSelectTier(lvl.id)}
                            className={`cursor-pointer transition-all border-l-4 ${rowBg} ${hoverBg}`}
                            style={{
                              borderLeftColor: isLight
                                ? (isSelected ? '#16A34A' : 'transparent')
                                : (isSelected ? '#4ADE80' : 'transparent')
                            }}
                          >
                            {/* Name & Purpose */}
                            <td className="py-2.5 px-4">
                              <div 
                                className={`font-['Nunito',sans-serif] text-sm uppercase font-[900] tracking-normal ${
                                  isLight ? '' : 'text-white'
                                }`}
                              >
                                {lvl.name}
                              </div>
                              <div className="font-sans text-[11px] text-gray-500 dark:text-gray-300 max-w-xs mt-0.5">
                                {lvl.purpose}
                              </div>
                            </td>

                            {/* Turnaround */}
                            <td className="py-2.5 px-4 font-bold">
                              <div className="flex items-center gap-1.5">
                                <Clock 
                                  className="w-3.5 h-3.5 shrink-0" 
                                  style={{
                                    color: !isLight ? darkTierColor : undefined
                                  }}
                                />
                                <span>{lvl.turnaround}</span>
                              </div>
                            </td>

                            {/* Max Insurance */}
                            <td className={`py-2.5 px-4 font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck 
                                  className="w-3.5 h-3.5 shrink-0 text-emerald-500" 
                                  style={{
                                    color: !isLight ? darkTierColor : undefined
                                  }}
                                />
                                <span>{lvl.maxInsurance}</span>
                              </div>
                              <span className={`block font-mono text-[9px] font-normal mt-0.5 ${
                                isLight ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                {language === 'es' ? 'cobertura / carta' : 'coverage / card'}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-2.5 px-4 text-right font-['Nunito',sans-serif] text-xl font-[900]">
                              <span style={{ color: !isLight && isSelected ? '#4ADE80' : undefined }}>
                                {lvl.price} €
                              </span>
                              <span className="block font-mono text-[9px] text-gray-400 font-normal">
                                {language === 'es' ? 'IVA INCLUIDO' : 'VAT INCLUDED'}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTier(lvl.id);
                                }}
                                className={
                                  isSelected
                                    ? 'btn-gorilla-square px-4 py-2 text-[10px] font-extrabold tracking-normal shadow-[0_0_15px_rgba(22,163,74,0.4)]'
                                    : isLight
                                      ? 'btn-gorilla-square-secondary px-4 py-2 text-[10px] font-bold tracking-normal'
                                      : 'px-4 py-2 text-[10px] font-bold tracking-normal rounded border border-white/20 bg-white/5 hover:bg-white/15 text-white transition-all hover:border-emerald-400'
                                }
                              >
                                {language === 'es'
                                  ? (isSelected ? '✓ SELECCIONADO' : 'SELECCIONAR')
                                  : (isSelected ? '✓ SELECTED' : 'SELECT')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Tabular List View (MISMO DISEÑO EXACTO QUE PRICING & TIERS) */}
                <div className="lg:hidden divide-y divide-gray-200 dark:divide-white/10">
                  {serviceLevels.map((lvl, index) => {
                    const isSelected = selectedTier?.id === lvl.id;
                    const isEven = index % 2 === 0;
                    const mobileBg = isSelected 
                      ? (isLight ? 'bg-[#E7F6EA]' : 'bg-[#182B1B]') 
                      : (isEven 
                          ? (isLight ? 'bg-white' : 'bg-[#121612]') 
                          : (isLight ? 'bg-[#F2EFE8]' : 'bg-[#1B201B]'));

                    return (
                      <div 
                        key={lvl.id}
                        onClick={() => handleSelectTier(lvl.id)}
                        className={`p-5 transition-colors cursor-pointer ${mobileBg}`}
                      >
                        <div className="flex items-center justify-end mb-2">
                          <span className="font-['Nunito',sans-serif] text-xl font-[900]">
                            {lvl.price} € <span className="font-mono text-[10px] text-gray-400 font-normal">{language === 'es' ? '/ carta' : '/ card'}</span>
                          </span>
                        </div>

                        <h3 className="font-['Nunito',sans-serif] text-lg uppercase font-[900] tracking-normal mb-1">
                          {lvl.name}
                        </h3>

                        <p className="font-sans text-xs text-gray-500 mb-3">
                          {lvl.purpose}
                        </p>

                        <div className={`p-3 border font-mono text-xs mb-3 space-y-1.5 ${
                          isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-white/10'
                        }`}>
                          <div className="flex justify-between">
                            <span className="text-gray-400">{language === 'es' ? 'PLAZO RETORNO:' : 'TURNAROUND:'}</span>
                            <span className="font-bold">{lvl.turnaround}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTier(lvl.id);
                          }}
                          className={
                            isSelected
                              ? 'btn-gorilla-square w-full py-2.5 text-xs font-extrabold tracking-normal'
                              : 'btn-gorilla-square-secondary w-full py-2.5 text-xs font-bold tracking-normal'
                          }
                        >
                          {language === 'es'
                            ? (isSelected ? '✓ SELECCIONADO' : 'SELECCIONAR')
                            : (isSelected ? '✓ SELECTED' : 'SELECT')}
                        </button>
                      </div>
                    );
                  })}
                </div>
                </>
                ) : (
                  <div className={`px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLight ? 'bg-[#F7F5EF]' : 'bg-white/[0.03]'
                  }`}>
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider font-semibold opacity-60">
                        {language === 'es' ? 'Servicio seleccionado' : 'Selected service'}
                      </span>
                      <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <h3 className="font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] uppercase tracking-normal">
                          {currentSelectedLevel.name}
                        </h3>
                        <span className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl font-[900] ${isLight ? 'text-[#15803D]' : 'text-[#4ADE80]'}`}>
                          {currentSelectedLevel.price} €
                          <span className="ml-1 font-mono text-xs font-normal opacity-60">/ {language === 'es' ? 'carta' : 'card'}</span>
                        </span>
                      </div>
                      <p className="mt-1 max-w-xl font-sans text-xs opacity-70">{currentSelectedLevel.purpose}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider opacity-80">
                        <span>{language === 'es' ? 'Plazo' : 'Turnaround'}: <b>{currentSelectedLevel.turnaround}</b></span>
                        <span>{language === 'es' ? 'Valor máx. declarado' : 'Max declared value'}: <b>{currentSelectedLevel.maxInsurance}</b></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllTiers(true)}
                      className={`shrink-0 cursor-pointer border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        isLight
                          ? 'border-[#D8D2C5] bg-white text-[#14170F] hover:border-[#16A34A]'
                          : 'border-white/20 bg-white/5 text-white hover:border-[#4ADE80]'
                      }`}
                    >
                      {language === 'es' ? 'Cambiar de servicio' : 'Change service'}
                    </button>
                  </div>
                )}


          {/* Volume estimation: merged into the tariff card, compact */}
          <div className={`border-t px-4 py-3 ${
            isLight ? 'border-[#E5E7EB] bg-[#FAFAF8]' : 'border-white/10 bg-black/30'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">

              {/* Left: quantity selection */}
              <div className="lg:col-span-7 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h3 className="font-['Nunito',sans-serif] text-sm font-[900] uppercase tracking-normal">
                    {language === 'es' ? 'Calcular tarifa por cantidad' : 'Volume estimation'}
                  </h3>
                  <span className={`font-sans text-[11px] ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                    {language === 'es'
                      ? 'Descuentos: 5% desde 10 cartas, 8% desde 25 y 12% desde 50.'
                      : 'Bulk discounts: 5% from 10 cards, 8% from 25, 12% from 50.'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 5, 10, 25, 50, 100].map((vol) => {
                    const isSelected = wizardCardCount === vol;
                    return (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setWizardCardCount(vol)}
                        className={`px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'border-[#16A34A] bg-[#16A34A] text-white'
                            : (isLight ? 'border-gray-300 bg-white text-gray-800 hover:border-gray-500' : 'border-white/15 bg-white/5 text-gray-100 hover:border-white/30')
                        }`}
                      >
                        {vol} {vol === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')}
                      </button>
                    );
                  })}

                  {/* Direct stepper input */}
                  <div className={`flex items-center border ${
                    isLight ? 'border-gray-300 bg-white' : 'border-white/15 bg-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setWizardCardCount(Math.max(1, wizardCardCount - 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-current"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={wizardCardCount}
                      onChange={(e) => setWizardCardCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-11 text-center font-mono text-xs font-bold bg-transparent outline-none text-current"
                    />
                    <button
                      type="button"
                      onClick={() => setWizardCardCount(Math.min(1000, wizardCardCount + 1))}
                      className="w-7 h-7 flex items-center justify-center font-mono font-bold text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-current"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={`font-mono text-[10.5px] flex flex-wrap items-center gap-x-2 ${
                  isLight ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  <span className="font-semibold">{language === 'es' ? `Servicio: ${currentSelectedLevel.name}` : `Service: ${currentSelectedLevel.name}`}</span>
                  <span className="text-gray-400">/</span>
                  <span>{language === 'es' ? `Plazo: ${currentSelectedLevel.turnaround}` : `Turnaround: ${currentSelectedLevel.turnaround}`}</span>
                  <span className="text-gray-400">/</span>
                  <span>{language === 'es' ? 'Envío asegurado 100%' : '100% Insured Transit'}</span>
                </div>
              </div>

              {/* Right: total and action */}
              <div className="lg:col-span-5 flex flex-wrap items-center justify-between lg:justify-end gap-4">
                <div className="text-right">
                  <span className={`font-mono text-[10px] uppercase tracking-wider block font-semibold ${
                    isLight ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'Total estimado' : 'Estimated total'} · {calculatedUnitPrice} € / {language === 'es' ? 'carta' : 'card'} {calcDiscountRate > 0 && `(-${Math.round(calcDiscountRate * 100)}%)`}
                  </span>
                  <span className="font-['Nunito',sans-serif] text-3xl font-[900] tracking-tight leading-none">
                    {calculatedTotalAmount} €
                  </span>
                  <span className={`block font-mono text-[9.5px] font-medium ${
                    isLight ? 'text-gray-600' : 'text-gray-300'
                  }`}>
                    {language === 'es' ? 'IVA 21% y seguro incluidos' : 'VAT 21% & insurance included'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="btn-gorilla-pill shrink-0 py-3 px-5 text-xs font-bold tracking-normal gap-2 shadow-lg"
                >
                  <span>{language === 'es' ? `Configurar envío (${wizardCardCount}) →` : `Configure shipment (${wizardCardCount}) →`}</span>
                </button>
              </div>

            </div>
          </div>
              </div>

              {/* Action bar to continue to Step 2 */}
              <div className={`p-4 sm:p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 ${
                isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#181B18] border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                    {language === 'es' ? 'SERVICIO SELECCIONADO:' : 'SELECTED SERVICE:'}
                  </span>
                  <span className="font-['Nunito',sans-serif] text-base uppercase font-[900] text-[#16A34A] dark:text-[#4ADE80] tracking-normal">
                    {selectedTier?.name || 'STANDARD'} — {calculatedUnitPrice} € / {language === 'es' ? 'carta' : 'card'} ({wizardCardCount} {wizardCardCount === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  className="btn-gorilla-square w-full sm:w-auto px-8 py-3 text-xs font-extrabold tracking-normal uppercase flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>
                    {language === 'es' 
                      ? `CONTINUAR AL PASO 02 (${wizardCardCount} ${wizardCardCount === 1 ? 'CARTA' : 'CARTAS'})` 
                      : `CONTINUE TO STEP 02 (${wizardCardCount} ${wizardCardCount === 1 ? 'CARD' : 'CARDS'})`}
                  </span>
                  <span className="text-sm">→</span>
                </button>
              </div>

              {/* Nota oficial de laboratorio */}
              <div className={`p-4 border ${
                isLight 
                  ? 'bg-white border-[#E5DEC9] text-gray-700' 
                  : 'bg-[#141814] border-white/10 text-gray-300'
              }`}>
                <p className="font-sans text-xs leading-relaxed">
                  <strong className={`font-mono font-bold uppercase tracking-wider mr-2 ${isLight ? 'text-black' : 'text-white'}`}>
                    {language === 'es' ? 'COBERTURA:' : 'INSURANCE:'}
                  </strong>
                  {language === 'es'
                    ? 'Cada carta queda asegurada hasta el máximo de su servicio. Si alguna vale más, elige un servicio superior. No hace falta que nos digas qué cartas envías: el laboratorio las identifica al recibirlas.'
                    : 'Each card is insured up to the maximum of its service. If a card is worth more, choose a higher service. You do not need to list your cards: the laboratory identifies them on arrival.'}
                </p>
              </div>

            </div>
          );
        })()}

        {/* ==============================================================
            STEP 3: DATOS
        ============================================================== */}
        {currentStep === 3 && (() => {
          const muted = isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]';
          const strong = isLight ? 'text-[#1C201D]' : 'text-white';
          const panel = isLight ? 'bg-white border-[#E5DEC9] shadow-[0_1px_2px_rgba(0,0,0,0.04)]' : 'bg-[#151A15] border-white/10';
          const inputClass = `w-full px-4 py-3 text-sm rounded-lg focus:outline-none transition-colors border ${
            isLight
              ? 'bg-[#FBFAF6] border-[#DCD5C3] text-[#1C201D] placeholder:text-[#A3A79F] focus:border-[#2D9A46] focus:bg-white read-only:bg-[#F1EDE3] read-only:text-[#656E63]'
              : 'bg-[#0F130F] border-white/10 text-white placeholder:text-[#6B7268] focus:border-[#48C765] read-only:bg-[#1B211B] read-only:text-[#A4ACA1]'
          }`;
          const labelClass = `block text-xs font-bold mb-1.5 ${strong}`;
          const methods = [
            {
              id: 'COURIER_INSURED' as const,
              icon: Truck,
              title: es ? 'Mensajería asegurada' : 'Insured courier',
              text: es ? 'Te devolvemos las cartas a tu dirección, con seguro y firma a la entrega.' : 'We return your cards to your address, insured and signed for on delivery.',
              price: formatEur(1450, language),
            },
            {
              id: 'CARD_SHOW_DROPOFF' as const,
              icon: MapPin,
              title: es ? 'Entrega en mano en un evento' : 'In person at an event',
              text: es ? 'Entregas y recoges tus cartas en un evento oficial de Gorilla Grading.' : 'Hand over and collect your cards at an official Gorilla Grading event.',
              price: es ? 'Gratis' : 'Free',
            },
          ];
          const section = (n: string, title: string, hint: string) => (
            <div className="flex items-start gap-3 mb-5">
              <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black text-white ${isLight ? 'bg-[#1C201D]' : 'bg-[#2D9A46]'}`}>{n}</span>
              <div>
                <h3 className={`font-['Nunito',sans-serif] text-base font-[900] ${strong}`}>{title}</h3>
                <p className={`text-xs ${muted}`}>{hint}</p>
              </div>
            </div>
          );
          const courier = shippingMethod === 'COURIER_INSURED';

          return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase font-[900] tracking-normal mb-2 ${strong}`}>
                  {es ? 'Tus datos de envío' : 'Your shipping details'}
                </h2>
                <p className={`text-sm ${muted}`}>
                  {es ? 'Dinos cómo quieres recibir tus cartas y a quién se las devolvemos.' : 'Tell us how you want your cards back and who we return them to.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                  {/* 1. Cómo se devuelven */}
                  <section className={`border rounded-2xl p-5 sm:p-6 ${panel}`}>
                    {section('1', es ? 'Cómo recibes tus cartas' : 'How you get your cards back', es ? 'Elige una opción.' : 'Choose one option.')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="radiogroup">
                      {methods.map((method) => {
                        const disabled = method.id === 'COURIER_INSURED' && selectedTier?.id === 'event';
                        const selected = shippingMethod === method.id;
                        const Icon = method.icon;
                        return (
                          <label
                            key={method.id}
                            className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all ${
                              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                            } ${
                              selected
                                ? (isLight ? 'border-[#2D9A46] bg-white shadow-md' : 'border-[#48C765] bg-[#101510] shadow-lg')
                                : (isLight ? 'border-[#E5DEC9] bg-[#FBFAF6] hover:border-[#C9C1AE]' : 'border-white/10 bg-[#0F130F] hover:border-white/25')
                            }`}
                          >
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.id}
                              checked={selected}
                              disabled={disabled}
                              onChange={() => setShippingMethod(method.id)}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${selected ? 'bg-[#2D9A46]' : isLight ? 'bg-[#8A9388]' : 'bg-[#3A413A]'}`}>
                                <Icon className="w-5 h-5" aria-hidden="true" />
                              </span>
                              <span
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selected ? 'border-[#2D9A46] bg-[#2D9A46]' : isLight ? 'border-[#C9C1AE]' : 'border-white/25'
                                }`}
                                aria-hidden="true"
                              >
                                {selected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-baseline justify-between gap-2">
                                <span className={`font-bold text-sm ${strong}`}>{method.title}</span>
                                <span className={`text-sm font-black whitespace-nowrap ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>{method.price}</span>
                              </div>
                              <p className={`text-xs mt-1 leading-relaxed ${muted}`}>{method.text}</p>
                              {disabled && (
                                <p className="text-[11px] mt-1.5 text-red-500">
                                  {es ? 'El servicio Event solo admite entrega en un evento.' : 'The Event service only accepts event drop-off.'}
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    {shippingMethod === 'CARD_SHOW_DROPOFF' && (
                      <div className="mt-6">
                        <div className={`flex items-center gap-2 text-sm font-bold mb-3 ${strong}`}>
                          <CalendarDays className={`w-4 h-4 ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`} aria-hidden="true" />
                          {es ? 'Elige el evento y la fecha' : 'Choose the event and date'}
                        </div>
                        {upcomingEvents === null && !eventsFailed && (
                          <p className={`text-sm ${muted}`}>{es ? 'Cargando los próximos eventos…' : 'Loading upcoming events…'}</p>
                        )}
                        {eventsFailed && (
                          <p className="text-sm text-red-500">{es ? 'No se pudieron cargar los eventos. Recarga la página.' : 'Could not load the events. Reload the page.'}</p>
                        )}
                        {upcomingEvents && upcomingEvents.length === 0 && (
                          <div className={`rounded-xl border-2 border-dashed px-5 py-6 text-center ${isLight ? 'border-[#DCD5C3]' : 'border-white/15'}`}>
                            <p className={`text-sm font-bold ${strong}`}>{es ? 'Ahora mismo no hay eventos con entrega en mano.' : 'There are no drop-off events right now.'}</p>
                            <p className={`text-xs mt-1 ${muted}`}>
                              {selectedTier?.id === 'event'
                                ? (es ? 'El servicio Event solo se puede usar en un evento. Elige otro servicio en el paso 1 o vuelve pronto.' : 'The Event service is only available at an event. Choose another service in step 1 or come back soon.')
                                : (es ? 'Elige la mensajería asegurada o vuelve pronto: publicamos aquí cada nuevo evento.' : 'Choose insured courier or come back soon: we publish every new event here.')}
                            </p>
                          </div>
                        )}
                        {upcomingEvents && upcomingEvents.length > 0 && (
                          <div className="space-y-3" role="radiogroup" aria-label={es ? 'Eventos' : 'Events'}>
                            {upcomingEvents.map((ev) => {
                              const picked = ev.id === eventId;
                              const start = new Date(ev.startsAt);
                              const day = start.toLocaleDateString(es ? 'es-ES' : 'en-GB', { timeZone: 'Europe/Madrid', day: 'numeric' });
                              const month = start.toLocaleDateString(es ? 'es-ES' : 'en-GB', { timeZone: 'Europe/Madrid', month: 'short' }).replace('.', '');
                              return (
                                <label
                                  key={ev.id}
                                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 ${
                                    picked
                                      ? (isLight ? 'border-[#2D9A46] bg-white shadow-md' : 'border-[#48C765] bg-[#101510] shadow-lg')
                                      : (isLight ? 'border-[#E5DEC9] bg-[#FBFAF6] hover:border-[#C9C1AE]' : 'border-white/10 bg-[#0F130F] hover:border-white/25')
                                  }`}
                                >
                                  <input type="radio" name="dropoffEvent" value={ev.id} checked={picked} onChange={() => setEventId(ev.id)} className="sr-only" />
                                  <span className={`w-14 shrink-0 rounded-lg overflow-hidden text-center border ${isLight ? 'border-[#E5DEC9] bg-white' : 'border-white/10 bg-[#151A15]'}`}>
                                    <span className={`block text-[10px] font-bold uppercase py-0.5 text-white ${picked ? 'bg-[#2D9A46]' : isLight ? 'bg-[#8A9388]' : 'bg-[#3A413A]'}`}>{month}</span>
                                    <span className={`block font-['Nunito',sans-serif] text-xl font-[900] py-1 ${strong}`}>{day}</span>
                                  </span>
                                  <span className="flex-1 min-w-0">
                                    <span className={`block font-bold text-sm ${strong}`}>{ev.name}</span>
                                    <span className={`block text-xs mt-0.5 first-letter:uppercase ${muted}`}>{formatEventWhen(ev.startsAt, ev.endsAt, es ? 'es' : 'en')}</span>
                                    <span className={`flex items-center gap-1 text-xs mt-0.5 ${muted}`}>
                                      <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                                      <span className="truncate">{[ev.venue, ev.address, ev.city].filter(Boolean).join(' · ')}</span>
                                    </span>
                                    {ev.details && <span className={`block text-xs mt-0.5 ${muted}`}>{ev.details}</span>}
                                  </span>
                                  <span
                                    className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                                      picked ? 'border-[#2D9A46] bg-[#2D9A46]' : isLight ? 'border-[#C9C1AE]' : 'border-white/25'
                                    }`}
                                    aria-hidden="true"
                                  >
                                    {picked && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* 2. Contacto */}
                  <section className={`border rounded-2xl p-5 sm:p-6 ${panel}`}>
                    {section('2', es ? 'Tus datos de contacto' : 'Your contact details', es ? 'Te escribiremos a este correo en cada paso del pedido.' : 'We will email you at every step of your order.')}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="ship-name" className={labelClass}>{es ? 'Nombre completo' : 'Full name'}</label>
                        <input
                          id="ship-name" type="text" autoComplete="name" maxLength={120}
                          placeholder={es ? 'Ej. Ana Pérez García' : 'e.g. Jane Smith'}
                          value={contact.fullName} onChange={setField('fullName')} className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="ship-email" className={labelClass}>{es ? 'Correo electrónico' : 'Email address'}</label>
                        <input
                          id="ship-email" type="email" autoComplete="email" maxLength={254}
                          placeholder={es ? 'tu@correo.com' : 'you@email.com'}
                          value={contact.email} onChange={setField('email')} readOnly={isLoggedIn}
                          className={inputClass}
                        />
                        {isLoggedIn && (
                          <p className={`flex items-center gap-1.5 text-[11px] mt-1.5 ${muted}`}>
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            {es ? 'Es el correo de tu cuenta.' : 'This is your account email.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* 3. Dirección de devolución */}
                  {courier && (
                    <section className={`border rounded-2xl p-5 sm:p-6 ${panel}`}>
                      {section('3', es ? 'Dirección de devolución' : 'Return address', es ? 'Aquí te devolveremos las cartas ya calificadas.' : 'Where we will send your graded cards.')}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-6">
                          <label htmlFor="ship-line1" className={labelClass}>{es ? 'Dirección' : 'Street address'}</label>
                          <input
                            id="ship-line1" type="text" autoComplete="address-line1" maxLength={200}
                            placeholder={es ? 'Calle, número, piso y puerta' : 'Street, number and apartment'}
                            value={contact.line1} onChange={setField('line1')} className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label htmlFor="ship-city" className={labelClass}>{es ? 'Ciudad' : 'City'}</label>
                          <input
                            id="ship-city" type="text" autoComplete="address-level2" maxLength={120}
                            value={contact.city} onChange={setField('city')} className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label htmlFor="ship-postal" className={labelClass}>{es ? 'Código postal' : 'Postal code'}</label>
                          <input
                            id="ship-postal" type="text" autoComplete="postal-code" maxLength={20}
                            value={contact.postalCode} onChange={setField('postalCode')} className={inputClass}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label htmlFor="ship-country" className={labelClass}>{es ? 'País' : 'Country'}</label>
                          <select
                            id="ship-country" autoComplete="country"
                            value={contact.countryCode} onChange={setField('countryCode')} className={inputClass}
                          >
                            <option value="ES">{es ? 'España' : 'Spain'}</option>
                            <option value="PT">Portugal</option>
                            <option value="FR">{es ? 'Francia' : 'France'}</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label htmlFor="ship-phone" className={labelClass}>
                            {es ? 'Teléfono' : 'Phone'} <span className={`font-normal ${muted}`}>{es ? '(opcional)' : '(optional)'}</span>
                          </label>
                          <input
                            id="ship-phone" type="tel" autoComplete="tel" maxLength={40}
                            placeholder={es ? 'Para el transportista' : 'For the courier'}
                            value={contact.phone} onChange={setField('phone')} className={inputClass}
                          />
                        </div>
                      </div>
                    </section>
                  )}

                  {step3Error && (
                    <p role="alert" className="text-red-500 text-sm font-bold">{step3Error}</p>
                  )}
                </div>

                {/* Resumen del pedido */}
                <aside className={`lg:col-span-4 lg:sticky lg:top-28 border rounded-2xl overflow-hidden ${panel}`}>
                  <div className={`px-5 py-4 ${isLight ? 'bg-[#1C201D]' : 'bg-[#0F130F]'} text-white`}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#A7E3B5]">{es ? 'Tu pedido' : 'Your order'}</div>
                    <div className="font-['Nunito',sans-serif] text-lg font-[900] mt-0.5">
                      {items.length} {items.length === 1 ? (es ? 'carta' : 'card') : (es ? 'cartas' : 'cards')} · {cardTier.name}
                    </div>
                  </div>
                  <div className="px-5 py-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className={muted}>{es ? 'Plazo' : 'Turnaround'}</span>
                      <span className={`font-bold ${strong}`}>{cardTier.turnaroundDays} {es ? 'días hábiles' : 'business days'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={muted}>{es ? 'Seguro por carta' : 'Insurance per card'}</span>
                      <span className={`font-bold ${strong}`}>{es ? 'hasta ' : 'up to '}{formatEur(cardTier.maxDeclaredValueEur * 100, language)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className={muted}>{es ? 'Devolución' : 'Return'}</span>
                      <span className={`font-bold ${strong}`}>{courier ? formatEur(1450, language) : (es ? 'Gratis' : 'Free')}</span>
                    </div>
                    {!courier && chosenEvent && (
                      <div className="flex justify-between gap-3">
                        <span className={muted}>{es ? 'Evento' : 'Event'}</span>
                        <span className={`font-bold text-right ${strong}`}>{chosenEvent.name}</span>
                      </div>
                    )}
                    <div className={`flex justify-between items-baseline gap-3 pt-3 border-t ${isLight ? 'border-[#E5DEC9]' : 'border-white/10'}`}>
                      <span className={`font-bold ${strong}`}>{es ? 'Total' : 'Total'}</span>
                      <span className={`font-['Nunito',sans-serif] text-2xl font-[900] ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>
                        {quote ? formatEur(quote.totalCents, language) : '…'}
                      </span>
                    </div>
                    <p className={`text-[11px] ${muted}`}>{es ? 'IVA incluido. Pagas al final, en la página segura de Stripe.' : 'VAT included. You pay at the end, on the secure Stripe page.'}</p>
                  </div>
                  <div className={`px-5 py-4 border-t text-xs flex gap-2.5 ${isLight ? 'border-[#E5DEC9] bg-[#FBFAF6]' : 'border-white/10 bg-[#0F130F]'} ${muted}`}>
                    <ShieldCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`} aria-hidden="true" />
                    <span>{es ? 'No tienes que decirnos qué cartas envías: el laboratorio las identifica al recibirlas.' : 'No need to list your cards: the laboratory identifies them on arrival.'}</span>
                  </div>
                </aside>
              </div>
            </div>
          );
        })()}

        {/* ==============================================================
            STEP 4: RESUMEN
        ============================================================== */}
        {currentStep === 4 && (() => {
          const row = `flex justify-between pb-3 border-b ${isLight ? 'border-[#E5DEC9]' : 'border-white/10'}`;
          const muted = isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]';
          const money = (cents: number) => formatEur(cents, language);
          const returnText = shippingMethod === 'COURIER_INSURED'
            ? (es ? 'Mensajería asegurada' : 'Insured courier')
            : (es ? 'Entrega en mano en un evento' : 'In-person at an event');

          return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] tracking-normal mb-2 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
                {es ? 'Resumen Final' : 'Final Review'}
              </h2>
              <p className={`text-xs font-sans mb-8 ${muted}`}>
                {es
                  ? 'Comprueba que todo esté correcto. Al confirmar irás a la página de pago segura de Stripe.'
                  : 'Verify all details. Upon confirmation you will go to the secure Stripe payment page.'}
              </p>

              <div className={`p-6 font-mono text-sm space-y-4 border ${
                isLight
                  ? 'bg-white border-[#E5DEC9] shadow-sm text-[#1C201D]'
                  : 'bg-[#151A15] border-white/10 text-white shadow-lg'
              }`}>
                <div className={row}>
                  <span className={muted}>{es ? 'Total de Cartas' : 'Total Cards'}</span>
                  <span className="font-bold">{items.length}</span>
                </div>
                <div className={row}>
                  <span className={muted}>{es ? 'Cobertura por carta' : 'Coverage per card'}</span>
                  <span className="font-bold">{es ? 'hasta ' : 'up to '}{formatEur(cardTier.maxDeclaredValueEur * 100, language)}</span>
                </div>

                {quote ? (
                  <>
                    {quote.lines.map((line) => (
                      <div key={line.tier} className={row}>
                        <span className={muted}>{line.count} × {line.name}</span>
                        <span className="font-bold">{money(line.totalCents)}</span>
                      </div>
                    ))}
                    {quote.discountCents > 0 && (
                      <div className={row}>
                        <span className={muted}>{es ? `Descuento por volumen (${Math.round(quote.discountRate * 100)} %)` : `Volume discount (${Math.round(quote.discountRate * 100)}%)`}</span>
                        <span className={`font-bold ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>−{money(quote.discountCents)}</span>
                      </div>
                    )}
                    <div className={row}>
                      <span className={muted}>{es ? 'Seguro de transporte y custodia' : 'Transit and custody insurance'}</span>
                      <span className="font-bold">{es ? 'Incluido' : 'Included'}</span>
                    </div>
                    <div className={row}>
                      <span className={muted}>{es ? 'Devolución' : 'Return'} · {returnText}</span>
                      <span className="font-bold">{quote.shippingCents > 0 ? money(quote.shippingCents) : es ? 'Gratis' : 'Free'}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>{es ? 'TOTAL (IVA incluido)' : 'TOTAL (VAT included)'}</span>
                      <span className={isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}>{money(quote.totalCents)}</span>
                    </div>
                    <p className={`text-[11px] font-sans ${muted}`}>
                      {es
                        ? `Base imponible ${money(quote.vatBaseCents)} + IVA ${Math.round(quote.vatRate * 100)} % ${money(quote.vatCents)}. Se cobra en el siguiente paso, en la página segura de Stripe.`
                        : `Net ${money(quote.vatBaseCents)} + ${Math.round(quote.vatRate * 100)}% VAT ${money(quote.vatCents)}. You pay in the next step, on the secure Stripe page.`}
                    </p>
                  </>
                ) : (
                  <p className={`text-xs font-sans ${muted}`} aria-live="polite">{quoteFailed ? (es ? 'No se pudo calcular el precio.' : 'Could not calculate the price.') : '…'}</p>
                )}
              </div>

              <div className={`mt-4 p-6 border text-xs font-sans space-y-1 ${isLight ? 'bg-white border-[#E5DEC9]' : 'bg-[#151A15] border-white/10'}`}>
                <div className="font-mono text-[10px] uppercase tracking-widest mb-2 text-[#6B7268]">{es ? 'Contacto y devolución' : 'Contact and return'}</div>
                <div className="font-bold text-sm">{contact.fullName}</div>
                <div className={muted}>{contact.email}</div>
                {shippingMethod === 'COURIER_INSURED' && (
                  <div className={muted}>
                    {contact.line1}, {contact.postalCode} {contact.city} ({contact.countryCode})
                  </div>
                )}
                {shippingMethod === 'CARD_SHOW_DROPOFF' && chosenEvent && (
                  <div className={`pt-2 ${muted}`}>
                    <span className="font-bold">{es ? 'Entrega en mano: ' : 'In-person drop-off: '}</span>
                    {chosenEvent.name} · <span className="first-letter:uppercase">{formatEventWhen(chosenEvent.startsAt, chosenEvent.endsAt, es ? 'es' : 'en')}</span> ·{' '}
                    {[chosenEvent.venue, chosenEvent.city].filter(Boolean).join(', ')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className={`underline underline-offset-4 cursor-pointer pt-1 ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}
                >
                  {es ? 'Cambiar' : 'Change'}
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {isLoggedIn ? (
                  <p className={`text-xs font-sans ${muted}`}>
                    {es ? `Sesión iniciada como ${user?.email}. El pedido aparecerá en tu cuenta.` : `Signed in as ${user?.email}. The order will appear in your account.`}
                  </p>
                ) : (
                  <InlineSignIn email={contact.email.trim()} />
                )}

                <label className="flex items-start gap-3 text-xs font-sans cursor-pointer">
                  <input
                    id="accept-terms" type="checkbox" checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5 accent-[#16A34A]"
                  />
                  <span>
                    {es ? 'Acepto los ' : 'I accept the '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{es ? 'Términos y condiciones' : 'Terms and conditions'}</a>
                    {es ? ' y la ' : ' and the '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{es ? 'Política de privacidad' : 'Privacy policy'}</a>.
                  </span>
                </label>

                {submitError && (
                  <p role="alert" className="text-red-500 text-xs font-sans">{submitError}</p>
                )}
              </div>
            </div>
          );
        })()}

        {/* ==============================================================
            BOTTOM NAVIGATION BAR
        ============================================================== */}
        <div className={`mt-16 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t ${
          isLight ? 'border-[#E5DEC9]' : 'border-[#2A2E2A]'
        }`}>
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((currentStep === 3 ? 1 : currentStep - 1) as any)}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase transition-colors border ${
                isLight 
                  ? 'bg-white hover:bg-[#FAF7F2] text-[#1C201D] border-[#DCD5C3]' 
                  : 'bg-[#151A15] hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {language === 'es' ? 'ATRÁS' : 'BACK'}
            </button>
          ) : <div className="hidden sm:block" />}
          
          {currentStep > 1 && (() => {
            const blocked =
              (currentStep === 4 && (!isLoggedIn || !acceptedTerms || !quote || quoteLoading || issues.length > 0 || submitting));
            const goNext = () => {
              if (currentStep === 3) {
                const problem = validateStep3();
                setStep3Error(problem);
                if (!problem) setCurrentStep(4);
              } else if (currentStep === 4) void handleFinalSubmit();
            };
            return (
              <button
                type="button"
                disabled={blocked}
                onClick={goNext}
                className="btn-gorilla-square w-full sm:w-auto px-6 sm:px-10 py-3.5 text-[11px] sm:text-xs font-extrabold tracking-normal uppercase flex items-center justify-center gap-2 sm:gap-4 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {currentStep === 4
                    ? (submitting ? (es ? 'ENVIANDO…' : 'SUBMITTING…') : (es ? 'ENVIAR Y PAGAR' : 'SUBMIT AND PAY'))
                    : (es ? 'CONTINUAR' : 'CONTINUE')}
                </span>

                {/* Total que calcula el servidor */}
                {items.length > 0 && (
                  <span className="px-2 py-0.5 rounded-none shrink-0 truncate bg-black/25 text-white" aria-live="polite">
                    {quote ? formatEur(quote.totalCents, language) : '…'}
                  </span>
                )}
              </button>
            );
          })()}
        </div>


      </div>
    </div>
  );
};
