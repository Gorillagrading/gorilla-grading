import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Search, ChevronDown, Package, Clock, MapPin, Cpu, Shield, MessageSquare, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQPageProps {
  onNavigate: (path: string) => void;
}

interface FAQItem {
  id: string;
  category: 'shipping' | 'turnaround' | 'dropoff' | 'tech' | 'insurance';
  qEs: string;
  qEn: string;
  aEs: string;
  aEn: string;
  deepLink?: string;
  linkTextEs?: string;
  linkTextEn?: string;
}

export const FAQPage: React.FC<FAQPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'prep-1': true,
    'turn-1': true
  });

  const toggleFAQ = (id: string) => {
    setOpenIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [
    { id: 'all', labelEs: 'Todas las Preguntas', labelEn: 'All Questions', icon: null },
    { id: 'shipping', labelEs: 'Envíos & Empaque', labelEn: 'Shipping & Packing', icon: Package },
    { id: 'turnaround', labelEs: 'Plazos & Tiempos', labelEn: 'Turnaround Times', icon: Clock },
    { id: 'dropoff', labelEs: 'Entrega Presencial', labelEn: 'In-Person Dropoff', icon: MapPin },
    { id: 'tech', labelEs: 'Tecnología & Escala', labelEn: 'Optical Tech & Scale', icon: Cpu },
    { id: 'insurance', labelEs: 'Seguro & Valor', labelEn: 'Insurance & Value', icon: Shield }
  ];

  const allFaqs: FAQItem[] = [
    // Shipping & Packing
    {
      id: 'prep-1',
      category: 'shipping',
      qEs: '¿Cómo preparo mis cartas adecuadamente antes de enviarlas?',
      qEn: 'How should I properly prepare my cards before shipping?',
      aEs: 'Para garantizar que tus cartas no sufran el menor daño durante el transporte, recomendamos utilizar una funda protectora blanda (penny sleeve) y colocarla dentro de un toploader semirrígido tipo Card Saver. Evita el uso de cintas adhesivas o celo directamente sobre los protectores. Empaca el conjunto entre dos láminas rígidas de cartón sujetas con gomas elásticas suaves, y colócalo dentro de una caja de cartón corrugado resistente acolchada con abundante plástico de burbujas.',
      aEn: 'To ensure your cards suffer zero transit damage, we recommend placing each card into a soft penny sleeve and inserting it inside a semi-rigid toploader (Card Saver). Avoid scotch tape directly on holders. Sandwich your cards between two stiff cardboard flats secured with soft elastic bands, and place everything inside a sturdy corrugated box wrapped with bubble wrap.',
      deepLink: '/faq/prepare',
      linkTextEs: 'Ver Guía Completa de Preparación de Envíos',
      linkTextEn: 'View Complete Shipping Preparation Guide'
    },
    {
      id: 'prep-2',
      category: 'shipping',
      qEs: '¿Qué tipo de fundas o protectores NO debo utilizar?',
      qEn: 'What types of sleeves or holders should I NOT use?',
      aEs: 'No recomendamos utilizar toploaders rígidos excesivamente ajustados (que puedan rayar los bordes al intentar extraer la carta en laboratorio) ni protectores magnéticos de tornillo. Tampoco utilices cinta aislante, precinto adhesivo directo sobre la abertura de la funda ni bolsas herméticas al vacío que puedan comprimir o curvar la curvatura natural de la carta.',
      aEn: 'We do not recommend overly tight rigid toploaders that risk scraping card borders upon intake extraction, nor screw-down magnetic cases. Never use heavy packaging tape directly over the sleeve opening, nor vacuum-sealed bags that may crush or bend the card\'s natural curvature.'
    },
    {
      id: 'prep-3',
      category: 'shipping',
      qEs: '¿Realizáis envíos y devoluciones internacionales?',
      qEn: 'Do you offer international shipping and returns?',
      aEs: 'Sí. Trabajamos con operadores logísticos internacionales de primer nivel (DHL Express, FedEx y UPS Priority) con seguimiento telemático continuo y firma obligatoria contra entrega. Realizamos envíos de retorno asegurados a más de 45 países de la Unión Europea, Reino Unido, Estados Unidos y Latinoamérica.',
      aEn: 'Yes. We partner with premier international couriers (DHL Express, FedEx, and UPS Priority) featuring end-to-end GPS telemetry and signature-required delivery. We perform insured return shipping to over 45 countries across Europe, the UK, the United States, and Latin America.'
    },

    // Turnaround
    {
      id: 'turn-1',
      category: 'turnaround',
      qEs: '¿Cómo se contabilizan los plazos de turnaround en Gorilla Grading?',
      qEn: 'How are turnaround times calculated at Gorilla Grading?',
      aEs: 'Nuestra política de marca se basa en la absoluta certidumbre. El cómputo de días comienza exactamente el día hábil posterior a la admisión física y escaneo inicial de tu paquete en nuestras instalaciones (estado "Recibido"), excluyendo sábados, domingos y festivos nacionales. El tiempo que el paquete tarda en transitar desde tu domicilio hasta nuestro centro no forma parte del plazo de laboratorio.',
      aEn: 'Our brand philosophy is anchored in absolute certainty. The day count officially commences on the business day following physical unboxing and intake registry in our facility ("Received" status), excluding weekends and national holidays. Courier transit from your residence to our lab does not count toward grading time.',
      deepLink: '/faq/turnaround',
      linkTextEs: 'Ver Detalles de Plazos y Tiempos de Entrega',
      linkTextEn: 'View Details on Processing Turnaround Times'
    },
    {
      id: 'turn-2',
      category: 'turnaround',
      qEs: '¿Qué niveles de velocidad de graduación existen?',
      qEn: 'What turnaround tiers are available?',
      aEs: 'Ofrecemos cuatro niveles adaptados a cada necesidad: Standard (10 días hábiles | 19 € para remesas regulares y colecciones), Premium (5 días hábiles | 25 € con subgrados métricos y registro público), Express (2 días hábiles | 50 € con cola prioritaria acelerada) y Event (48 h | 15 €, exclusivo para entrega presencial en pop ups oficiales).',
      aEn: 'We offer four distinct service tiers: Standard (10 business days | 19 € for regular sets and personal binders), Premium (5 business days | 25 € with metric subgrades and public registry), Express (2 business days | 50 € with accelerated lab priority queue), and Event (48 h | 15 €, exclusive for in-person drop-offs at official pop-ups).'
    },

    // In-person Dropoffs
    {
      id: 'drop-1',
      category: 'dropoff',
      qEs: '¿Puedo entregar mis cartas en mano sin recurrir a envíos postales?',
      qEn: 'Can I drop off my cards in person without postal shipping?',
      aEs: 'Totalmente. Organizamos periódicamente "Pickup Events" en las principales capitales y ferias de coleccionismo especializadas. Además, contamos con una red de tiendas autorizadas (Official Partner Hubs) donde puedes depositar tu submission de forma presencial y recibir un recibo de custodia con código QR al instante.',
      aEn: 'Absolutely. We regularly host official "Pickup Events" across major metropolitan hubs and collector conventions. Furthermore, we maintain a network of authorized partner card shops where you can hand over your submission in person and receive an instant digital QR custody receipt.',
      deepLink: '/faq/dropoff',
      linkTextEs: 'Ver Puntos y Próximos Eventos Presenciales',
      linkTextEn: 'View Partner Dropoff Locations & Upcoming Events'
    },
    {
      id: 'drop-2',
      category: 'dropoff',
      qEs: '¿Qué documentación necesito llevar al punto de entrega presencial?',
      qEn: 'What documentation must I bring to an in-person dropoff?',
      aEs: 'Solo requieres tu comprobante digital de submission (el PDF descargable que genera el asistente tras completar tu pedido online) impreso o en tu teléfono móvil, junto con un documento de identidad oficial. El personal del hub comprobará el recuento exterior de piezas y sellará tu valija precintada en tu presencia.',
      aEn: 'You simply need your digital submission receipt (the downloadable PDF generated by our online wizard) printed or on your mobile device, alongside government-issued identification. Hub personnel will verify piece count and lock your tamper-evident pouch in your presence.'
    },

    // Tech & Scale
    {
      id: 'tech-1',
      category: 'tech',
      qEs: '¿En qué consiste la inspección óptica por inteligencia artificial y escáner láser?',
      qEn: 'How does artificial intelligence and laser optical inspection work?',
      aEs: 'Nuestras cabinas de análisis emplean sensores multiespectrales de 12.000 DPI, iluminación ultravioleta e interferometría láser con resolución nanométrica (0.01 mm). Esto permite medir el centrado geométrico en cuatro cuadrantes con precisión micrométrica, examinar microarañazos en la capa de barniz y detectar retoques de tinta o falsificaciones indetectables para el ojo humano.',
      aEn: 'Our grading chambers deploy 12,000 DPI multispectral imaging sensors, UV excitation illumination, and nanometric laser interferometry (0.01 mm resolution). This measures geometric centering across all four quadrants with micrometer accuracy, reveals varnish micro-scratches, and flags re-inked borders or counterfeits invisible to the human eye.'
    },
    {
      id: 'tech-2',
      category: 'tech',
      qEs: '¿Cuáles son las subnotas y la escala de graduación utilizada?',
      qEn: 'What are the sub-grades and overall grading scale used?',
      aEs: 'Evaluamos cuatro subcategorías cardinales: Centrado (Centering), Esquinas (Corners), Bordes (Edges) y Superficie (Surface). La escala general va del 1 al 10, con distinciones de honor para notas perfectas: Grado 10 Gem Mint y la codiciada etiqueta especial Gorilla Pristine 10 (cuando las cuatro subnotas alcanzan la perfección absoluta).',
      aEn: 'We evaluate four cardinal sub-grades: Centering, Corners, Edges, and Surface. The overarching scale ranges from 1 to 10, featuring elite distinctions for flawless specimens: Gem Mint 10 and our premier Gorilla Pristine 10 label when all four sub-scores attain absolute perfection.'
    },
    {
      id: 'tech-3',
      category: 'tech',
      qEs: '¿Las cápsulas de encapsulado son herméticas y protegen contra los rayos UV?',
      qEn: 'Are the encapsulation slabs hermetic and UV-resistant?',
      aEs: 'Sí. Nuestras losas (slabs) están fabricadas con policarbonato óptico de grado balístico con aditivos de absorción ultravioleta del 99.4%, protegiendo los pigmentos originales contra la decoloración por luz solar. El sellado se realiza por soldadura sónica de alta frecuencia (ultrasonido), creando una unión molecular irreversible e impermeable al polvo y la humedad.',
      aEn: 'Yes. Our slabs are engineered from optical-grade ballistic polycarbonate infused with 99.4% UV absorption inhibitors, shielding delicate print pigments against sunlight fading. Encapsulation is achieved via high-frequency ultrasonic sonic welding, forging an irreversible hermetic barrier against dust and atmospheric moisture.'
    },

    // Insurance & Declared Values
    {
      id: 'ins-1',
      category: 'insurance',
      qEs: '¿Qué ocurre si el valor de mercado de mi carta supera el límite del nivel contratado?',
      qEn: 'What happens if my card\'s market value exceeds the selected tier limit?',
      aEs: 'Si durante el análisis nuestro equipo determina que el valor de mercado actual supera el límite máximo de cobertura del nivel seleccionado, te enviaremos una notificación de ajuste para subirla al nivel correspondiente. Este procedimiento es de carácter obligatorio para asegurar que la pieza esté respaldada por la póliza de seguro completa durante el almacenamiento y retorno.',
      aEn: 'If our valuation algorithms determine the current market value exceeds your chosen tier\'s maximum declared limit, we will issue an upgrade notification to bump the card to the appropriate bracket. This protocol is mandatory to guarantee the piece carries full insurance coverage during vaulting and return transit.'
    },
    {
      id: 'ins-2',
      category: 'insurance',
      qEs: '¿Cómo funciona el seguro durante el transporte y la estancia en el laboratorio?',
      qEn: 'How does insurance work during transit and lab custody?',
      aEs: 'Todas las cartas en nuestras instalaciones están aseguradas a todo riesgo bajo una póliza de custodia de valores de Lloyds of London en cámara acorazada climatizada. Para el envío de vuelta, el seguro cubre el 100% del valor declarado contratado ante cualquier eventualidad o extravío por parte de la empresa de transporte.',
      aEn: 'All cards inside our facility are insured all-risk under an armored vault custody policy with Lloyds of London in a climate-controlled environment. For return courier delivery, insurance covers 100% of the declared value against any transit loss or damage.'
    }
  ];

  // Filtering
  const filteredFaqs = allFaqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery = 
      faq.qEs.toLowerCase().includes(query) ||
      faq.qEn.toLowerCase().includes(query) ||
      faq.aEs.toLowerCase().includes(query) ||
      faq.aEn.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#454545] text-white pt-24 pb-24 px-6 lg:px-12 selection:bg-[#48C765] selection:text-black relative overflow-hidden flex flex-col">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-[#48C765]/[0.02] blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white/[0.01] blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-[1240px] w-full mx-auto relative z-10">
        
        {/* Navigation back */}
        <button 
          onClick={() => onNavigate('/')}
          className="mb-10 text-[#A4ACA1] hover:text-white flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>

        {/* Header */}
        <div className="flex flex-col mb-12 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#48C765]"></span>
            <span className="font-mono text-[10px] font-bold tracking-[0.25em] text-[#48C765] uppercase">
              {language === 'es' ? 'CENTRO OFICIAL DE AYUDA' : 'OFFICIAL HELP HUB'}
            </span>
          </div>

          <h1 className="font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl lg:text-6xl uppercase tracking-normal leading-[1.05] text-white mb-6">
            {language === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#A4ACA1] max-w-3xl leading-relaxed text-justify">
            {language === 'es'
              ? 'Encuentra explicaciones detalladas y respuestas técnicas sobre cada aspecto de nuestro ecosistema: desde el empaque correcto de piezas coleccionables hasta los protocolos de escaneo microscópico, tiempos de entrega garantizados y coberturas de seguro integral.'
              : 'Find detailed answers and technical explanations on every aspect of our ecosystem: from the correct packaging of collectibles to microscopic scanning protocols, guaranteed turnaround times, and comprehensive insurance coverages.'}
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="w-full max-w-2xl mb-10 relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'es' ? 'Buscar dudas (ej. centrado, Card Saver, seguro, plazos)...' : 'Search questions (e.g. centering, Card Saver, insurance, turnaround)...'}
              className="w-full bg-[#161B16] border border-white/10 focus:border-[#48C765]/60 pl-12 pr-4 py-3.5 text-white text-sm focus:outline-none transition-colors"
            />
            <Search size={18} className="absolute left-4 text-[#A4ACA1]" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 font-mono text-xs text-[#A4ACA1] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-12 border-b border-white/10 pb-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-none font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-[#48C765] text-[#14170F] font-bold border-[#48C765] shadow-[0_0_15px_rgba(72,199,101,0.2)]'
                    : 'bg-[#161B16] text-[#A4ACA1] border-white/10 hover:border-white/25 hover:text-white'
                }`}
              >
                {Icon && <Icon size={14} />}
                <span>{language === 'es' ? cat.labelEs : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="flex flex-col gap-4 mb-16">
          {filteredFaqs.length === 0 ? (
            <div className="p-12 bg-[#2B302B] border border-white/10 text-center flex flex-col items-center">
              <p className="font-sans text-sm text-[#A4ACA1] mb-4">
                {language === 'es' 
                  ? 'No se encontraron preguntas que coincidan con tu búsqueda.' 
                  : 'No questions matched your search criteria.'}
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="px-4 py-2 bg-white/5 border border-white/10 text-xs font-mono uppercase text-white hover:bg-white/10"
              >
                {language === 'es' ? 'Restablecer Filtros' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!openIds[faq.id];
              return (
                <div 
                  key={faq.id}
                  className="bg-[#2B302B] border border-white/[0.06] hover:border-white/15 transition-all"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-6 sm:p-7 text-left flex items-start justify-between gap-6 cursor-pointer select-none group"
                  >
                    <span className={`font-['Nunito',sans-serif] text-lg sm:text-xl font-[900] uppercase tracking-normal transition-colors ${
                      isOpen ? 'text-[#48C765]' : 'text-white group-hover:text-[#48C765]'
                    }`}>
                      {language === 'es' ? faq.qEs : faq.qEn}
                    </span>
                    <div className={`shrink-0 w-8 h-8 rounded-none border flex items-center justify-center transition-all ${
                      isOpen ? 'border-[#48C765] bg-[#48C765]/10 text-[#48C765]' : 'border-white/15 text-[#A4ACA1]'
                    }`}>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 sm:px-7 sm:pb-7 pt-2 border-t border-white/5 flex flex-col gap-4">
                          <p className="font-sans text-sm text-[#A4ACA1] leading-relaxed text-justify">
                            {language === 'es' ? faq.aEs : faq.aEn}
                          </p>

                          {faq.deepLink && (
                            <button
                              onClick={() => onNavigate(faq.deepLink!)}
                              className="btn-gorilla-square-secondary mt-3 px-4 py-2 text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 w-fit cursor-pointer"
                            >
                              <span>{language === 'es' ? faq.linkTextEs : faq.linkTextEn}</span>
                              <ExternalLink size={12} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Banner: Direct to Contact Form */}
        <div className="bg-[#161B16] border border-[#48C765]/30 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#48C765]/5 blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[#48C765]" />
              <span className="font-mono text-xs tracking-wider uppercase text-[#48C765] font-bold">
                {language === 'es' ? '¿PREGUNTA NO RESUELTA?' : 'UNRESOLVED QUESTION?'}
              </span>
            </div>
            <h3 className="font-['Nunito',sans-serif] text-xl sm:text-2xl uppercase text-white font-[900] tracking-normal">
              {language === 'es' ? 'Contacta con Nuestros Especialistas de Laboratorio' : 'Contact Our Dedicated Laboratory Team'}
            </h3>
            <p className="font-sans text-xs text-[#A4ACA1] leading-relaxed text-justify">
              {language === 'es'
                ? 'Si tienes una consulta personalizada sobre cartas atípicas, autógrafos verificados o necesitas presupuesto para lotes de gran volumen, envíanos un formulario de contacto y te atenderemos en menos de 24 horas.'
                : 'If you have a customized inquiry regarding error cards, verified autos, or require high-volume bulk grading proposals, reach out via our contact form for a response in under 24 hours.'}
            </p>
          </div>

          <button
            onClick={() => onNavigate('/contact')}
            className="btn-gorilla-square px-8 py-3.5 text-xs font-extrabold tracking-normal shrink-0 flex items-center gap-2 shadow-lg"
          >
            <span>{language === 'es' ? 'Ir al Formulario de Contacto' : 'Go to Contact Form'}</span>
            <span>→</span>
          </button>
        </div>

      </div>
    </div>
  );
};
