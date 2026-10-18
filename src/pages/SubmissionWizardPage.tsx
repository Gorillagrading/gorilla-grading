import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { MOCK_SERVICES } from '../data/mockServices';
import { OrderItem, ServiceTier } from '../types';
import { Plus, Trash2, CheckCircle2, Clock, Check, ShieldCheck, Edit2, X } from 'lucide-react';
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
    if (stepParam === '2') return 2;
    if (stepParam === '3') return 3;
    if (stepParam === '4') return 4;
    return 1;
  });

  const [selectedTier, setSelectedTier] = useState<ServiceTier | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const tierId = params.get('tier');
    if (tierId) {
      const found = MOCK_SERVICES.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event'));
      if (found) return found;
    }
    return MOCK_SERVICES[0];
  }); 
  
  const [items, setItems] = useState<OrderItem[]>(() => {
    const params = new URLSearchParams(window.location.search);
    const qty = parseInt(params.get('qty') || '0', 10);
    const tierId = params.get('tier');
    const tier = (tierId ? MOCK_SERVICES.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event')) : null) || MOCK_SERVICES[0];

    if (qty > 0) {
      return Array.from({ length: qty }, (_, i) => ({
        id: `preset-${Date.now()}-${i}`,
        cardName: language === 'es' ? `Carta #${i + 1} (${tier.name})` : `Card #${i + 1} (${tier.name})`,
        game: 'Pokemon',
        set: 'Base Set',
        declaredValue: 100,
        serviceTierId: tier.id,
        notes: '',
        frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
      }));
    }
    return [];
  });

  const [newCardGame, setNewCardGame] = useState('Pokemon');
  const [newCardYear, setNewCardYear] = useState('');
  const [newCardSet, setNewCardSet] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardLanguage, setNewCardLanguage] = useState('English');
  const [newCardRarity, setNewCardRarity] = useState('');
  const [newDeclaredValue, setNewDeclaredValue] = useState('');
  const [newCardQuantity, setNewCardQuantity] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('qty') || '1';
  });

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
      if (s >= 1 && s <= 4) setCurrentStep(s as any);
    }

    if (tierId) {
      const found = MOCK_SERVICES.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event'));
      if (found) {
        setSelectedTier(found);
      }
    }

    if (qtyParam) {
      const qty = parseInt(qtyParam, 10);
      if (qty > 0) {
        setWizardCardCount(qty);
        setNewCardQuantity(String(qty));
        setItems(prevItems => {
          if (prevItems.length === 0 || fromConfigParam === 'true') {
            const currentTier = (tierId ? MOCK_SERVICES.find(s => s.id === tierId || (tierId === 'regular' && s.id === 'standard') || (tierId === 'walkthrough' && s.id === 'event')) : null) || selectedTier || MOCK_SERVICES[0];
            return Array.from({ length: qty }, (_, i) => ({
              id: `preset-${Date.now()}-${i}`,
              cardName: language === 'es' ? `Carta #${i + 1} (${currentTier.name})` : `Card #${i + 1} (${currentTier.name})`,
              game: 'Pokemon',
              set: 'Base Set',
              declaredValue: 100,
              serviceTierId: currentTier.id,
              notes: '',
              frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
            }));
          }
          return prevItems;
        });
      }
    }
  }, [language]);

  const [shippingMethod, setShippingMethod] = useState<'COURIER_INSURED' | 'CARD_SHOW_DROPOFF'>('COURIER_INSURED');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedSubmissionId, setGeneratedSubmissionId] = useState('');

  // Totals Calculation
  const subtotalGrading = items.length * (selectedTier?.priceEur || 0);
  const totalDeclaredValue = items.reduce((sum, item) => sum + (Number(item.declaredValue) || 0), 0);
  const insuranceFee = Math.max(8.00, totalDeclaredValue * 0.008);
  const shippingFee = shippingMethod === 'CARD_SHOW_DROPOFF' ? 0.00 : 14.50;
  const totalEstimatedCost = subtotalGrading + (shippingMethod === 'COURIER_INSURED' ? insuranceFee + shippingFee : 0);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim()) return;

    const quantity = Math.max(1, parseInt(newCardQuantity) || 1);
    const newItems: OrderItem[] = [];
    
    for (let i = 0; i < quantity; i++) {
      newItems.push({
        id: `item-${Date.now()}-${i}`,
        cardName: newCardName,
        game: newCardGame,
        set: newCardSet || 'Unknown',
        declaredValue: Number(newDeclaredValue) || 100,
        serviceTierId: selectedTier?.id || 'standard',
        notes: '',
        frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
      });
    }

    setItems([...items, ...newItems]);
    setNewCardName('');
    setNewCardSet('');
    setNewCardYear('');
    setNewCardRarity('');
    setNewDeclaredValue('');
    setNewCardQuantity('1');
  };

  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);

  const handleSaveEditedCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setItems(items.map(it => it.id === editingItem.id ? editingItem : it));
    setEditingItem(null);
  };

  const handleRemoveCard = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleFinalSubmit = () => {
    if (items.length === 0) return;
    const randomSubId = `GG-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedSubmissionId(randomSubId);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepsList = [
    { num: 1, label: language === 'es' ? 'SERVICIO' : 'SERVICE' },
    { num: 2, label: language === 'es' ? 'CARTAS' : 'CARDS' },
    { num: 3, label: language === 'es' ? 'DATOS' : 'DETAILS' },
    { num: 4, label: language === 'es' ? 'RESUMEN' : 'SUMMARY' }
  ];

  if (isSubmitted) {
    return (
      <div className={`max-w-3xl mx-auto px-4 py-24 text-center ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
        <div className="flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className={`w-14 h-14 ${isLight ? 'text-[#16A34A]' : 'text-[#4ADE80]'}`} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-['Nunito',sans-serif] font-[900] uppercase tracking-normal mb-4">
          {language === 'es' ? 'Pedido Confirmado' : 'Order Confirmed'}
        </h1>
        <p className={`mb-8 font-sans ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
          {language === 'es' 
            ? `Tu número de envío es #${generatedSubmissionId}. Recibirás las etiquetas por correo electrónico en breve.`
            : `Your submission ID is #${generatedSubmissionId}. You will receive shipping labels via email shortly.`}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
      <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
        
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
            ? 'Configura tu pedido en cuatro pasos. Al terminar recibirás el albarán y la etiqueta de transporte por correo. Nada se cobra hasta que las cartas llegan y se verifican.'
            : 'Configure your order in four steps. Once finished, you will receive your packing slip and transport label by email. Nothing is charged until your cards arrive and are verified.'}
        </p>

        {/* Minimalist Horizontal Step Indicator */}
        <div className={`flex w-full border rounded mb-12 overflow-hidden transition-colors ${
          isLight ? 'border-[#E2DCce] bg-[#EAE4D7]' : 'border-[#2A2E2A] bg-[#2B302B]'
        }`}>
          {stepsList.map((step) => {
            const isCurrent = currentStep === step.num;
            const isPast = currentStep > step.num;
            return (
              <div 
                key={step.num}
                onClick={() => isPast && setCurrentStep(step.num as any)}
                className={`flex-1 p-3 sm:px-6 sm:py-4 transition-all ${
                  isLight ? 'border-r border-[#DCD5C3] last:border-r-0' : 'border-r border-[#2A2E2A] last:border-r-0'
                } ${isPast ? (isLight ? 'cursor-pointer hover:bg-white/40' : 'cursor-pointer hover:bg-white/[0.05]') : ''} ${
                  isCurrent ? (isLight ? 'bg-white/80 border-b-2 border-b-[#2D9A46]' : 'bg-black/20 border-b-2 border-b-[#48C765]') : ''
                }`}
              >
                <div className="flex flex-col">
                  <span className={`font-mono text-[11px] font-bold ${
                    isCurrent 
                      ? (isLight ? 'text-[#2D9A46]' : 'text-[#48C765]') 
                      : isPast 
                        ? (isLight ? 'text-[#1C201D]' : 'text-white') 
                        : (isLight ? 'text-[#8A9388]' : 'text-[#A4ACA1]')
                  }`}>
                    0{step.num}
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-widest mt-1 ${
                    isCurrent 
                      ? (isLight ? 'text-[#1C201D] font-bold' : 'text-white') 
                      : (isLight ? 'text-[#8A9388]' : 'text-[#A4ACA1]')
                  }`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

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
              scope: language === 'es' 
                ? 'Encapsulado sónico 35 kHz · Chip NFC de seguridad · Escaneo maestro 1200 DPI' 
                : '35 kHz ultrasonic encapsulation · NFC security chip · 1200 DPI master scan',
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
              scope: language === 'es' 
                ? '4 Subgrados láser 0.01mm · Escaneo forense 4K · Registro público en blockchain' 
                : '4 Laser 0.01mm subgrades · 4K forensic scan · Blockchain public registry',
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
              scope: language === 'es' 
                ? 'Cola preferente de laboratorio · Auditoría óptica doble · Canal directo de soporte' 
                : 'Priority lab queue · Dual optical audit · Direct laboratory support channel',
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
              scope: language === 'es' 
                ? 'Solo entrega presencial en pop ups · Entrega rápida 48h · Encapsulado sónico' 
                : 'In-person drop-off only at pop ups · 48h express turnaround · Sonic encapsulation',
              price: 15,
              accentColor: '#CA8A04'
            }
          ];

          const handleSelectTier = (lvlId: string) => {
            const found = MOCK_SERVICES.find(s => s.id === lvlId) || MOCK_SERVICES[0];
            setSelectedTier(found);
          };

          const handleProceedToStep2 = () => {
            const targetQty = Math.max(1, wizardCardCount);
            const currentTier = selectedTier || MOCK_SERVICES[0];
            
            const presetItems: OrderItem[] = Array.from({ length: targetQty }, (_, i) => ({
              id: `preset-${Date.now()}-${i}`,
              cardName: language === 'es' ? `Carta #${i + 1} (${currentTier.name})` : `Card #${i + 1} (${currentTier.name})`,
              game: 'Pokemon',
              set: 'Base Set',
              declaredValue: 100,
              serviceTierId: currentTier.id,
              notes: '',
              frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
            }));
            
            setItems(presetItems);
            setIsFromConfigureShipment(true);
            setCurrentStep(2);
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
                
                {/* Matrix Top Header Bar - Limpio, Sobrio y Profesional */}
                <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
                  isLight 
                    ? 'bg-gray-50 border-[#E5E7EB] text-gray-600' 
                    : 'bg-white/[0.04] border-white/10 text-gray-200'
                }`}>
                  <span className="font-bold tracking-wider uppercase">
                    {language === 'es' ? 'CUADRO REGULATORIO DE GRADUACIÓN ÓPTICA' : 'OPTICAL GRADING REGULATORY MATRIX'}
                  </span>
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    <span>ISO-9001 CLEANROOM AUDITED</span>
                    <span>•</span>
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
                        <th className="py-3 px-6 font-semibold">{language === 'es' ? 'NIVEL DE SERVICIO' : 'SERVICE TIER'}</th>
                        <th className="py-3 px-6 font-semibold">{language === 'es' ? 'PLAZO DE RETORNO' : 'ESTIMATED TURNAROUND'}</th>
                        <th className="py-3 px-6 font-semibold">{language === 'es' ? 'SEGURO MÁXIMO' : 'MAX INSURANCE'}</th>
                        <th className="py-3 px-6 font-semibold">{language === 'es' ? 'ALCANCE TÉCNICO' : 'TECHNICAL SCOPE'}</th>
                        <th className="py-3 px-6 font-semibold text-right">{language === 'es' ? 'TARIFA / CARTA' : 'RATE / CARD'}</th>
                        <th className="py-3 px-6 font-semibold text-center">{language === 'es' ? 'ACCIÓN' : 'ACTION'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/70 dark:divide-white/10 font-mono text-xs">
                      {serviceLevels.map((lvl, index) => {
                        const isSelected = selectedTier?.id === lvl.id;
                        const isEven = index % 2 === 0;

                        // Distinctive neon tier colors for Dark Mode
                        const darkTierColor = 
                          lvl.id === 'standard' ? '#60A5FA' : 
                          lvl.id === 'premium' ? '#4ADE80' : 
                          lvl.id === 'express' ? '#FB923C' : '#FBBF24';

                        const rowBg = isSelected 
                          ? (isLight 
                              ? 'bg-[#E7F6EA]' 
                              : 'bg-gradient-to-r from-emerald-950/60 via-[#102917] to-[#0D1F13] shadow-[inset_0_0_24px_rgba(74,222,128,0.15)]') 
                          : (isLight 
                              ? (isEven ? 'bg-white' : 'bg-[#F2EFE8]')
                              : (lvl.id === 'standard' 
                                  ? 'bg-gradient-to-r from-blue-950/30 via-[#0F1722]/90 to-[#0C121B]' 
                                  : lvl.id === 'premium' 
                                  ? 'bg-gradient-to-r from-emerald-950/30 via-[#0E1C12]/90 to-[#0A160E]' 
                                  : lvl.id === 'express' 
                                  ? 'bg-gradient-to-r from-orange-950/30 via-[#1F150E]/90 to-[#170F0A]' 
                                  : 'bg-gradient-to-r from-amber-950/35 via-[#211B0D]/90 to-[#191409]'));

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
                                : (isSelected ? '#4ADE80' : darkTierColor)
                            }}
                          >
                            {/* Name & Purpose */}
                            <td className="py-4 px-6">
                              <div 
                                className="font-['Nunito',sans-serif] text-sm uppercase font-[900] tracking-normal"
                                style={{
                                  color: !isLight ? darkTierColor : undefined
                                }}
                              >
                                {lvl.name}
                              </div>
                              <div className="font-sans text-[11px] text-gray-500 dark:text-gray-300 max-w-xs mt-0.5">
                                {lvl.purpose}
                              </div>
                            </td>

                            {/* Turnaround */}
                            <td className="py-4 px-6 font-bold">
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
                            <td className={`py-4 px-6 font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
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

                            {/* Scope */}
                            <td className="py-4 px-6 font-sans text-xs text-gray-500 dark:text-gray-300 max-w-sm">
                              {lvl.scope}
                            </td>

                            {/* Price */}
                            <td className="py-4 px-6 text-right font-['Nunito',sans-serif] text-xl font-[900]">
                              <span style={{ color: !isLight && isSelected ? '#4ADE80' : undefined }}>
                                {lvl.price} €
                              </span>
                              <span className="block font-mono text-[9px] text-gray-400 font-normal">
                                {language === 'es' ? 'IVA INCLUIDO' : 'VAT INCLUDED'}
                              </span>
                            </td>

                            {/* Action Button */}
                            <td className="py-4 px-6 text-center">
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
                          <div className="pt-1 border-t border-gray-200 dark:border-white/5 font-sans text-[11px] text-gray-500">
                            {lvl.scope}
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

              </div>

              {/* ESTIMACIÓN DE REMESA (Volume Estimation Calculator) */}
              <div className={`w-full border p-4 sm:p-8 lg:p-10 mb-8 transition-colors ${
                isLight ? 'bg-white border-[#E5E7EB]' : 'bg-[#181B18] border-white/10'
              }`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-gray-100 dark:border-white/5">
                  <div>
                    <h3 className="font-['Nunito',sans-serif] text-lg sm:text-2xl font-[900] uppercase tracking-normal">
                      {language === 'es' ? 'CALCULAR TARIFA POR CANTIDAD DE CARTAS' : 'VOLUME ESTIMATION'}
                    </h3>
                    <p className={`mt-1 font-sans text-xs max-w-xl leading-relaxed ${
                      isLight ? 'text-gray-700' : 'text-gray-200'
                    }`}>
                      {language === 'es'
                        ? 'Descuentos por volumen: 5% a partir de 10 cartas, 8% desde 25 cartas y 12% para más de 50 cartas.'
                        : 'Bulk discounts: 5% for 10+ cards, 8% for 25+ cards, and 12% for 50+ cards.'}
                    </p>
                  </div>

                  {/* Service Level Switcher */}
                  <div className={`p-1 border flex items-center gap-1 flex-wrap ${
                    isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/40 border-white/15'
                  }`}>
                    {serviceLevels.map((lvl) => {
                      const isActive = (selectedTier?.id || 'standard') === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSelectTier(lvl.id)}
                          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 font-mono text-[11px] sm:text-xs transition-colors cursor-pointer ${
                            isActive
                              ? (isLight ? 'bg-white text-black font-bold shadow-xs border border-gray-200' : 'bg-white/20 text-white font-bold')
                              : (isLight ? 'text-gray-600 hover:text-black' : 'text-gray-300 hover:text-white')
                          }`}
                        >
                          {lvl.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Main interactive area: Volume buttons & Real-time result */}
                <div className="pt-4 sm:pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                  
                  {/* Left: Volume selector buttons + custom input */}
                  <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                    <span className={`font-mono text-[11px] sm:text-xs uppercase tracking-wider font-semibold block ${
                      isLight ? 'text-gray-700' : 'text-gray-200'
                    }`}>
                      {language === 'es' ? 'Selecciona o introduce la cantidad de cartas:' : 'Select or enter number of cards:'}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {[1, 5, 10, 25, 50, 100].map((vol) => {
                        const isSelected = wizardCardCount === vol;
                        return (
                          <button
                            key={vol}
                            type="button"
                            onClick={() => setWizardCardCount(vol)}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-xs font-bold transition-colors cursor-pointer border ${
                              isSelected
                                ? 'border-[#16A34A] bg-[#16A34A] text-white'
                                : (isLight ? 'border-gray-300 bg-gray-50 text-gray-800 hover:border-gray-500' : 'border-white/15 bg-white/5 text-gray-100 hover:border-white/30')
                            }`}
                          >
                            {vol} {vol === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')}
                          </button>
                        );
                      })}

                      {/* Direct Stepper Input */}
                      <div className={`flex items-center border ml-auto ${
                        isLight ? 'border-gray-300 bg-gray-50' : 'border-white/15 bg-white/5'
                      }`}>
                        <button
                          type="button"
                          onClick={() => setWizardCardCount(Math.max(1, wizardCardCount - 1))}
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-mono font-bold text-sm cursor-pointer ${
                            isLight ? 'hover:bg-gray-200 text-black' : 'hover:bg-white/10 text-white'
                          }`}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={wizardCardCount}
                          onChange={(e) => setWizardCardCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 sm:w-14 text-center font-mono text-xs sm:text-sm font-bold bg-transparent outline-none text-current"
                        />
                        <button
                          type="button"
                          onClick={() => setWizardCardCount(Math.min(1000, wizardCardCount + 1))}
                          className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-mono font-bold text-sm cursor-pointer ${
                            isLight ? 'hover:bg-gray-200 text-black' : 'hover:bg-white/10 text-white'
                          }`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className={`font-mono text-[11px] sm:text-xs pt-2 flex flex-wrap items-center gap-2 sm:gap-3 ${
                      isLight ? 'text-gray-700' : 'text-gray-200'
                    }`}>
                      <span className="font-semibold">{language === 'es' ? `Servicio: ${currentSelectedLevel.name}` : `Service: ${currentSelectedLevel.name}`}</span>
                      <span className="text-gray-400">/</span>
                      <span>{language === 'es' ? `Plazo: ${currentSelectedLevel.turnaround}` : `Turnaround: ${currentSelectedLevel.turnaround}`}</span>
                      <span className="text-gray-400">/</span>
                      <span>{language === 'es' ? 'Envío asegurado 100%' : '100% Insured Transit'}</span>
                    </div>
                  </div>

                  {/* Right: Clean Price Display & Action */}
                  <div className={`lg:col-span-5 p-4 sm:p-6 border flex flex-col justify-between gap-4 ${
                    isLight ? 'bg-gray-50/90 border-gray-200' : 'bg-black/40 border-white/15'
                  }`}>
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className={`font-mono text-[10px] sm:text-[11px] uppercase tracking-wider block font-semibold ${
                          isLight ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {language === 'es' ? 'Total estimado' : 'Estimated total'}
                        </span>
                        <span className={`font-mono text-xs font-semibold ${
                          isLight ? 'text-gray-800' : 'text-gray-200'
                        }`}>
                          {calculatedUnitPrice} € / {language === 'es' ? 'carta' : 'card'} {calcDiscountRate > 0 && `(-${Math.round(calcDiscountRate * 100)}%)`}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-['Nunito',sans-serif] text-3xl sm:text-5xl font-[900] tracking-tight">
                          {calculatedTotalAmount} €
                        </span>
                        <span className={`block font-mono text-[10px] font-medium mt-0.5 ${
                          isLight ? 'text-gray-700' : 'text-gray-300'
                        }`}>
                          {language === 'es' ? 'IVA 21% y seguro incluidos' : 'VAT 21% & insurance included'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToStep2}
                      className="btn-gorilla-pill w-full py-3.5 sm:py-4 px-6 sm:px-8 text-xs font-bold tracking-normal gap-2 shadow-lg"
                    >
                      <span>
                        {language === 'es' 
                          ? `CONFIGURAR ENVÍO (${wizardCardCount} ${wizardCardCount === 1 ? 'CARTA' : 'CARTAS'}) →` 
                          : `CONFIGURE SHIPMENT (${wizardCardCount} ${wizardCardCount === 1 ? 'CARD' : 'CARDS'}) →`}
                      </span>
                    </button>
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
                    {language === 'es' ? 'VALOR DECLARADO Y COBERTURA:' : 'DECLARED VALUE & INSURANCE:'}
                  </strong>
                  {language === 'es' 
                    ? 'Cada nivel tiene un tope de valor asegurado por carta. Si alguna de tus cartas supera dicho importe, el sistema te solicitará asignarla al nivel correspondiente para garantizar la cobertura total.'
                    : 'Each tier specifies a maximum declared coverage per card. Cards exceeding this threshold are assigned to the appropriate protocol for full insured transit.'}
                </p>
              </div>

            </div>
          );
        })()}

        {/* ==============================================================
            STEP 2: CARTAS
        ============================================================== */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
              <div>
                <h2 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] tracking-normal mb-1 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
                  {isFromConfigureShipment
                    ? (language === 'es' ? 'Configuración de tus cartas' : 'Configure your cards')
                    : (language === 'es' ? 'Suma tus cartas' : 'Add your cards')}
                </h2>
                <p className={`text-xs font-sans ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
                  {isFromConfigureShipment
                    ? (language === 'es'
                        ? `Hemos generado tus ${items.length} cuadros para el nivel ${selectedTier?.name || ''}. Haz clic en cada uno para personalizar los datos de la carta.`
                        : `We have set up your ${items.length} card slots for ${selectedTier?.name || ''} tier. Click any box to configure card details.`)
                    : items.length > 0
                    ? (language === 'es' 
                        ? `${items.length} ${items.length === 1 ? 'carta añadida' : 'cartas añadidas'} · ${selectedTier?.name || ''}`
                        : `${items.length} ${items.length === 1 ? 'card added' : 'cards added'} · ${selectedTier?.name || ''}`)
                    : (language === 'es' 
                        ? 'Agrega una foto o escribe el nombre y valor de cada carta. Podrás añadir más después.'
                        : 'Add a photo or type the name and value of each card.')}
                </p>
              </div>

              {items.length > 0 && (
                <div className={`font-mono text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  <span>{items.length} × {selectedTier?.priceEur || 0} € = </span>
                  <strong className={`font-bold text-sm ${isLight ? 'text-gray-950' : 'text-white'}`}>{subtotalGrading} €</strong>
                </div>
              )}
            </div>

            {/* Professional Mini-Form: solo se muestra en modo regular, NO cuando viene de configure shipment */}
            {!isFromConfigureShipment && (
              <form onSubmit={handleAddCard} className={`w-full p-6 mb-8 flex flex-col gap-6 border ${
                isLight ? 'bg-white border-[#E5DEC9] shadow-sm' : 'bg-[#151A15] border-white/10 shadow-lg'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* TCG / Collection */}
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Colección / TCG' : 'TCG / Collection'}
                    </label>
                    <select 
                      value={newCardGame}
                      onChange={e => setNewCardGame(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                    >
                      <option value="Pokemon">Pokémon TCG</option>
                      <option value="Magic">Magic: The Gathering</option>
                      <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                      <option value="Sports">Sports Cards</option>
                      <option value="One Piece">One Piece TCG</option>
                      <option value="Lorcana">Disney Lorcana</option>
                      <option value="Other">Other / Misc</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Año' : 'Year'}
                    </label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1999" 
                      value={newCardYear}
                      onChange={e => setNewCardYear(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>

                  {/* Set / Expansion */}
                  <div className="flex flex-col gap-1 lg:col-span-2">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Nombre del Set / Expansión' : 'Set / Expansion Name'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Base Set" 
                      value={newCardSet}
                      onChange={e => setNewCardSet(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>

                  {/* Card Name */}
                  <div className="flex flex-col gap-1 lg:col-span-2">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Nombre de la carta' : 'Card Name'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Charizard Holo 1st Edition" 
                      value={newCardName}
                      onChange={e => setNewCardName(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                      required
                    />
                  </div>

                  {/* Rarity / Variant */}
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Rareza / Variante' : 'Rarity / Variant'}
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Secret Rare, Holo" 
                      value={newCardRarity}
                      onChange={e => setNewCardRarity(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>

                  {/* Quantity */}
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Cantidad' : 'Quantity'}
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="1" 
                      value={newCardQuantity}
                      onChange={e => setNewCardQuantity(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                        isLight 
                          ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] focus:border-[#2D9A46] focus:bg-white' 
                          : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>

                  {/* Declared Value */}
                  <div className="flex flex-col gap-1">
                    <label className={`text-[10px] uppercase font-mono tracking-widest ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>
                      {language === 'es' ? 'Valor Declarado ud. (€)' : 'Declared Value ea. (€)'}
                    </label>
                    <div className="relative">
                      <span className={`absolute left-3 top-2 text-sm ${isLight ? 'text-[#6B7268]' : 'text-[#A4ACA1]'}`}>€</span>
                      <input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={newDeclaredValue}
                        onChange={e => setNewDeclaredValue(e.target.value)}
                        className={`w-full pl-7 pr-3 py-2 text-sm rounded-none transition-colors focus:outline-none ${
                          isLight 
                            ? 'bg-[#FAF7F2] border border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46] focus:bg-white' 
                            : 'bg-[#2B302B] border border-white/5 text-white focus:border-[#48C765]'
                        }`}
                        required
                      />
                    </div>
                  </div>

                </div>
                
                <div className={`flex justify-end pt-3 border-t mt-2 ${isLight ? 'border-[#E5DEC9]' : 'border-white/5'}`}>
                  <button 
                    type="submit" 
                    className="btn-gorilla-square px-6 py-2.5 text-xs font-extrabold uppercase tracking-normal flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>{language === 'es' ? 'Añadir a la orden' : 'Add to Order'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Horizontal Card Gallery */}
            {items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    {language === 'es' ? 'Cartas en la orden (haz clic para editar datos o valor):' : 'Cards in order (click to edit card data or value):'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-[11px] ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                      {items.length} {items.length === 1 ? (language === 'es' ? 'carta' : 'card') : (language === 'es' ? 'cartas' : 'cards')}
                    </span>
                    {isFromConfigureShipment && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = items.length + 1;
                          const tierName = selectedTier?.name || 'Standard';
                          const newItem: OrderItem = {
                            id: `preset-${Date.now()}-${items.length}`,
                            cardName: language === 'es' ? `Carta #${nextIdx} (${tierName})` : `Card #${nextIdx} (${tierName})`,
                            game: 'Pokemon',
                            set: 'Base Set',
                            declaredValue: 100,
                            serviceTierId: selectedTier?.id || 'standard',
                            notes: '',
                            frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
                          };
                          setItems(prev => [...prev, newItem]);
                          setEditingItem(newItem);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-mono font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                          isLight 
                            ? 'border-gray-300 bg-gray-50 text-gray-800 hover:border-black hover:bg-white' 
                            : 'border-white/15 bg-white/5 text-gray-200 hover:border-white hover:bg-white/10'
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>{language === 'es' ? 'Añadir otra' : 'Add another'}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {items.map((item, idx) => (
                    <div 
                      key={item.id} 
                      onClick={() => setEditingItem({ ...item })}
                      className={`rounded-none p-4 flex flex-col justify-between relative group border transition-all cursor-pointer select-none ${
                        isLight 
                          ? 'bg-white border-[#DCD5C3] hover:border-[#16A34A] hover:shadow-md' 
                          : 'bg-[#181D18] border-white/10 hover:border-[#48C765] hover:bg-[#1E241E]'
                      }`}
                    >
                      {/* Top bar with ID & actions */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          GG-{1000 + idx}
                        </span>
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            title={language === 'es' ? 'Editar carta' : 'Edit card'}
                            onClick={() => setEditingItem({ ...item })}
                            className={`p-1.5 transition-colors ${
                              isLight ? 'text-gray-500 hover:text-emerald-600 hover:bg-gray-100' : 'text-gray-400 hover:text-emerald-400 hover:bg-white/10'
                            }`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            type="button"
                            title={language === 'es' ? 'Eliminar carta' : 'Delete card'}
                            onClick={() => handleRemoveCard(item.id)}
                            className={`p-1.5 transition-colors ${
                              isLight ? 'text-gray-400 hover:text-red-500 hover:bg-gray-100' : 'text-gray-500 hover:text-red-400 hover:bg-white/10'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Name */}
                      <div className={`text-xs font-bold leading-tight line-clamp-2 mb-2 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
                        {item.cardName}
                      </div>

                      {/* Game & Set */}
                      <div className={`text-[10px] font-mono truncate mb-3 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                        {item.game} · {item.set || 'Base Set'}
                      </div>

                      {/* Bottom row: Declared Value */}
                      <div className={`pt-2.5 border-t flex items-center justify-between font-mono text-[11px] ${
                        isLight ? 'border-gray-100 text-gray-700' : 'border-white/5 text-gray-300'
                      }`}>
                        <span className="text-[9.5px] uppercase text-gray-500 dark:text-gray-400">
                          {language === 'es' ? 'Seguro / Valor:' : 'Insurance / Decl:'}
                        </span>
                        <strong className="font-bold text-emerald-600 dark:text-emerald-400">
                          €{item.declaredValue}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {items.length === 0 && (
              <div className={`text-center font-mono text-[10px] uppercase tracking-widest mt-8 ${
                isLight ? 'text-[#8A9388]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es' ? 'AÚN NO HAS AÑADIDO CARTAS' : 'NO CARDS ADDED YET'}
              </div>
            )}
          </div>
        )}

        {/* ==============================================================
            STEP 3: DATOS
        ============================================================== */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] tracking-normal mb-2 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
              {language === 'es' ? 'Tus Datos de Envío' : 'Your Shipping Details'}
            </h2>
            <p className={`text-xs font-sans mb-8 ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
              {language === 'es' 
                ? 'Introduce tus datos para que el servicio de mensajería blindada recoja tus cartas.'
                : 'Enter your details for the armored courier pickup.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder={language === 'es' ? 'Nombre Completo' : 'Full Name'} 
                className={`w-full p-4 text-sm focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]' 
                    : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
                }`} 
              />
              <input 
                type="email" 
                placeholder={language === 'es' ? 'Correo Electrónico' : 'Email Address'} 
                className={`w-full p-4 text-sm focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]' 
                    : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
                }`} 
              />
              <input 
                type="text" 
                placeholder={language === 'es' ? 'Dirección' : 'Street Address'} 
                className={`w-full p-4 text-sm focus:outline-none transition-colors border md:col-span-2 ${
                  isLight 
                    ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]' 
                    : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
                }`} 
              />
              <input 
                type="text" 
                placeholder={language === 'es' ? 'Ciudad' : 'City'} 
                className={`w-full p-4 text-sm focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]' 
                    : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
                }`} 
              />
              <input 
                type="text" 
                placeholder={language === 'es' ? 'Código Postal' : 'Postal Code'} 
                className={`w-full p-4 text-sm focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-white border-[#DCD5C3] text-[#1C201D] placeholder:text-[#9A9E96] focus:border-[#2D9A46]' 
                    : 'bg-[#151A15] border-white/10 text-white focus:border-[#48C765]'
                }`} 
              />
            </div>
          </div>
        )}

        {/* ==============================================================
            STEP 4: RESUMEN
        ============================================================== */}
        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className={`font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase font-[900] tracking-normal mb-2 ${isLight ? 'text-[#1C201D]' : 'text-white'}`}>
              {language === 'es' ? 'Resumen Final' : 'Final Review'}
            </h2>
            <p className={`text-xs font-sans mb-8 ${isLight ? 'text-[#656E63]' : 'text-[#A4ACA1]'}`}>
              {language === 'es' 
                ? 'Comprueba que todo esté correcto. Al confirmar, emitiremos tu etiqueta de envío encriptada.'
                : 'Verify all details. Upon confirmation, your encrypted shipping label will be issued.'}
            </p>

            <div className={`p-6 font-mono text-sm space-y-4 border ${
              isLight 
                ? 'bg-white border-[#E5DEC9] shadow-sm text-[#1C201D]' 
                : 'bg-[#151A15] border-white/10 text-white shadow-lg'
            }`}>
              <div className={`flex justify-between pb-3 border-b ${isLight ? 'border-[#E5DEC9]' : 'border-white/10'}`}>
                <span className={isLight ? 'text-[#656E63]' : 'text-white'}>{language === 'es' ? 'Servicio Seleccionado' : 'Selected Service'}</span>
                <span className={`font-bold ${isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}`}>{selectedTier?.name || ''}</span>
              </div>
              <div className={`flex justify-between pb-3 border-b ${isLight ? 'border-[#E5DEC9]' : 'border-white/10'}`}>
                <span className={isLight ? 'text-[#656E63]' : 'text-white'}>{language === 'es' ? 'Total de Cartas' : 'Total Cards'}</span>
                <span className="font-bold">{items.length}</span>
              </div>
              <div className={`flex justify-between pb-3 border-b ${isLight ? 'border-[#E5DEC9]' : 'border-white/10'}`}>
                <span className={isLight ? 'text-[#656E63]' : 'text-white'}>{language === 'es' ? 'Valor Declarado Total' : 'Total Declared Value'}</span>
                <span className="font-bold">€{totalDeclaredValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>TOTAL APROX.</span>
                <span className={isLight ? 'text-[#2D9A46]' : 'text-[#48C765]'}>€{totalEstimatedCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            BOTTOM NAVIGATION BAR
        ============================================================== */}
        <div className={`mt-16 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t ${
          isLight ? 'border-[#E5DEC9]' : 'border-[#2A2E2A]'
        }`}>
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3.5 text-[11px] sm:text-xs font-bold tracking-widest uppercase transition-colors border ${
                isLight 
                  ? 'bg-white hover:bg-[#FAF7F2] text-[#1C201D] border-[#DCD5C3]' 
                  : 'bg-[#151A15] hover:bg-white/10 text-white border-white/10'
              }`}
            >
              {language === 'es' ? 'ATRÁS' : 'BACK'}
            </button>
          ) : <div className="hidden sm:block" />}
          
          {currentStep > 1 && (
            <button
              onClick={() => {
                if (currentStep === 2 && items.length > 0) setCurrentStep(3);
                else if (currentStep === 2 && items.length === 0) alert(language === 'es' ? 'Añade al menos una carta' : 'Add at least one card');
                else if (currentStep === 3) setCurrentStep(4);
                else if (currentStep === 4) handleFinalSubmit();
              }}
              className="btn-gorilla-square w-full sm:w-auto px-6 sm:px-10 py-3.5 text-[11px] sm:text-xs font-extrabold tracking-normal uppercase flex items-center justify-center gap-2 sm:gap-4 shadow-lg"
            >
              <span>{language === 'es' ? (currentStep === 4 ? 'ENVIAR PEDIDO' : 'CONTINUAR') : (currentStep === 4 ? 'SUBMIT ORDER' : 'CONTINUE')}</span>
              
              {/* Show dynamic total price on the button */}
              {items.length > 0 && currentStep > 1 && (
                <span className="px-2 py-0.5 rounded-none shrink-0 truncate bg-black/25 text-white">
                  €{totalEstimatedCost.toFixed(2)}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Modal de Edición de Carta Individual */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-lg p-6 border shadow-2xl relative ${
              isLight ? 'bg-white border-[#DCD5C3] text-[#1C201D]' : 'bg-[#151A15] border-white/10 text-white'
            }`}>
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-['Nunito',sans-serif] text-lg uppercase tracking-normal font-[900]">
                    {language === 'es' ? 'Editar Especificaciones de la Carta' : 'Edit Card Specifications'}
                  </h3>
                  <p className="text-[11px] font-mono text-gray-500">
                    ID: {editingItem.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className={`p-1.5 transition-colors ${
                    isLight ? 'text-gray-400 hover:text-black hover:bg-gray-100' : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedCard} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1">
                    {language === 'es' ? 'Nombre de la Carta' : 'Card Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.cardName}
                    onChange={e => setEditingItem({ ...editingItem, cardName: e.target.value })}
                    className={`w-full px-3 py-2 text-sm border focus:outline-none ${
                      isLight ? 'bg-[#FAF7F2] border-[#DCD5C3] text-black focus:border-[#2D9A46]' : 'bg-[#222722] border-white/10 text-white focus:border-[#48C765]'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1">
                      {language === 'es' ? 'Juego / Colección' : 'Game / TCG'}
                    </label>
                    <select
                      value={editingItem.game}
                      onChange={e => setEditingItem({ ...editingItem, game: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none ${
                        isLight ? 'bg-[#FAF7F2] border-[#DCD5C3] text-black focus:border-[#2D9A46]' : 'bg-[#222722] border-white/10 text-white focus:border-[#48C765]'
                      }`}
                    >
                      <option value="Pokemon">Pokémon TCG</option>
                      <option value="Magic">Magic: The Gathering</option>
                      <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
                      <option value="Sports">Sports Cards</option>
                      <option value="One Piece">One Piece TCG</option>
                      <option value="Lorcana">Disney Lorcana</option>
                      <option value="Other">Other / Misc</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1">
                      {language === 'es' ? 'Set / Expansión' : 'Set / Expansion'}
                    </label>
                    <input
                      type="text"
                      value={editingItem.set || ''}
                      onChange={e => setEditingItem({ ...editingItem, set: e.target.value })}
                      className={`w-full px-3 py-2 text-sm border focus:outline-none ${
                        isLight ? 'bg-[#FAF7F2] border-[#DCD5C3] text-black focus:border-[#2D9A46]' : 'bg-[#222722] border-white/10 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-gray-500 mb-1">
                    {language === 'es' ? 'Valor Declarado (€) — Para Seguro de Tránsito' : 'Declared Value (€) — For Transit Insurance'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm text-gray-500 font-mono">€</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editingItem.declaredValue}
                      onChange={e => setEditingItem({ ...editingItem, declaredValue: Number(e.target.value) || 0 })}
                      className={`w-full pl-7 pr-3 py-2 text-sm border focus:outline-none font-mono ${
                        isLight ? 'bg-[#FAF7F2] border-[#DCD5C3] text-black focus:border-[#2D9A46]' : 'bg-[#222722] border-white/10 text-white focus:border-[#48C765]'
                      }`}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1 font-sans">
                    {language === 'es'
                      ? 'Este valor define la cobertura de la póliza de custodia y seguro ante pérdida/daño, no el precio del servicio de graduación.'
                      : 'This value determines vault coverage and insurance limit, not the service fee.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border ${
                      isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/10 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="btn-gorilla-square px-6 py-2 text-xs font-extrabold uppercase tracking-normal shadow-md"
                  >
                    {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
