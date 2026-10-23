import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const translations = {
  es: {
    // Luxury Reference Homepage Translations
    'ref.nav.grading': 'Graduación y Tarifas',
    'ref.nav.technology': 'Tecnología',
    'ref.nav.collectors': 'Coleccionistas',
    'ref.nav.pricing': 'Tarifas',
    'ref.nav.about': 'Nosotros',
    'ref.nav.submit': 'Enviar Carta',
    'ref.nav.signIn': 'Acceso',
    
    // Hero
    'ref.hero.eyebrow': 'GRADUACIÓN PROFESIONAL DE CARTAS',
    'ref.hero.title1': 'PRECISIÓN',
    'ref.hero.title2': 'QUE DA ',
    'ref.hero.titleGreen': 'VALOR',
    'ref.hero.desc': 'Impulsado por tecnología avanzada y expertos.',
    'ref.hero.ctaPrimary': 'Iniciar Solicitud',
    'ref.hero.ctaSecondary': 'Ver Nuestra Tecnología',
    'ref.hero.trustedBy': 'Coleccionistas en todo el mundo',
    'ref.hero.rating': '4.9/5',
    'ref.hero.ratingSub': 'Envíos de prototipo verificados',
    'ref.hero.categories': 'TCG  //  SPORTS  //  COLECCIONABLES',
    'ref.hero.moreThanGrade': 'MÁS QUE UNA NOTA',
    'ref.hero.higherStandard': 'UN ESTÁNDAR SUPERIOR',
    'ref.hero.plinthText': 'COLECCIONA · PRESERVA · VALORA',

    // Ecosystem Ribbon
    'ref.ribbon.title': 'CONFIADO POR COLECCIONISTAS, TIENDAS Y COMUNIDADES',
    'ref.ribbon.andMore': 'Y MÁS',

    // Section 02 Technology
    'ref.tech.title': 'TECNOLOGÍA QUE REVELA LA HISTORIA REAL',
    'ref.tech.title2': 'TECNOLOGÍA Y EXPERIENCIA',
    'ref.tech.desc': 'Imágenes de alta resolución y análisis avanzado donde cada detalle importa.',
    'ref.tech.desc2': 'Un proceso de graduación transparente diseñado para darte confianza en cada detalle.',
    'ref.tech.explore': 'EXPLORAR EL PROCESO',
    'ref.tech.step1': 'ESCANEO',
    'ref.tech.step1Desc': 'Captura multiespectral a 1200 PPP bajo iluminación fría balanceada.',
    'ref.tech.step2': 'ANÁLISIS',
    'ref.tech.step2Desc': 'Mapeo microscópico de defectos, tramas de impresión y microfibras.',
    'ref.tech.step3': 'MEDICIÓN',
    'ref.tech.step3Desc': 'Calibre láser submilimétrico (0.01 mm) en ejes X, Y y diagonales.',
    'ref.tech.step4': 'GRADUACIÓN',
    'ref.tech.step4Desc': 'Encapsulado sónico hermético en acrílico óptico y emisión de nota final.',
    'ref.tech.centering': 'CENTRADO',
    'ref.tech.corners': 'ESQUINAS',
    'ref.tech.edges': 'BORDES',
    'ref.tech.surface': 'SUPERFICIE',
    'ref.tech.authenticity': 'AUTENTICIDAD',

    // Section 03 Pillars (Senior European Numismatic Authority)
    'ref.pillar1.title': 'PRESERVAR',
    'ref.pillar1.desc': 'Encapsulación ultrasónica grado museo a 35 kHz. Polímero óptico virgen con filtro UV del 99.4%, soldando un cierre hermético molecular contra humedad y oxidación.',
    'ref.pillar1.cta': 'EXPLORAR ENCAPSULADO',
    'ref.pillar2.title': 'AUTENTICAR',
    'ref.pillar2.desc': 'Espectrometría óptica y análisis de roseta a 1200 DPI. Validación de tintas químicas y fluorescencia UV a 365 nm para detección inequívoca de alteraciones o reproducciones.',
    'ref.pillar2.cta': 'VERIFICAR CRITERIOS',
    'ref.pillar3.title': 'COMPRENDER',
    'ref.pillar3.desc': 'Telemetría láser submilimétrica a 0.01 mm y 4 sub-grados en décimas (Centrado, Esquinas, Bordes, Superficie), con trazabilidad criptográfica inmutable en registro global.',
    'ref.pillar3.cta': 'VER TELEMETRÍA',
    'ref.pillar4.title': 'PERTENECER',
    'ref.pillar4.desc': 'Cadena de custodia unificada y liquidez internacional. Tránsito blindado con cobertura asegurada y procesos optimizados para envíos globales.',
    'ref.pillar4.cta': 'ENTRAR EN BÓVEDA',

    // Section 04 Mission (Authoritative Institutional Manifesto)
    'ref.mission.eyebrow': 'NUESTRA MISIÓN',
    'ref.mission.title': 'UN ESTÁNDAR NUMISMÁTICO DEFINITIVO A NIVEL GLOBAL',
    'ref.mission.title2': 'POR UN FUTURO DEL COLECCIONISMO MÁS FUERTE',
    'ref.mission.desc': 'Sustituimos la subjetividad artesanal por metrología óptica reproducible, trazabilidad digital verificable y rigor de laboratorio. Diseñado a nivel internacional para blindar el patrimonio del coleccionista moderno.',
    'ref.mission.desc2': 'Creemos en un mercado de coleccionables transparente, accesible y de confianza. Gorilla Grading está creado para coleccionistas, por coleccionistas, con una visión a largo plazo.',
    'ref.mission.cta': 'CONOCE NUESTRO LABORATORIO',
    'ref.mission.btn1': 'Nuestra Misión',
    'ref.mission.btn2': 'Enviar Carta',
    'ref.mission.trust': 'CONFIANZA',
    'ref.mission.transparency': 'TRANSPARENCIA',
    'ref.mission.innovation': 'INNOVACIÓN',
    'ref.mission.community': 'COMUNIDAD',

    // Section: Tarifas & Servicios (Bilingual Senior Pricing)
    'pricing.kicker': 'ESTÁNDAR GLOBAL · OPERACIONES INTERNACIONALES',
    'pricing.title': 'TARIFAS Y NIVELES DE SERVICIO',
    'pricing.desc': 'Rendimiento de laboratorio con tiempos garantizados en días laborables, seguro de reposición total y trazabilidad en tiempo real.',
    'pricing.cardUnit': '/ carta',
    'pricing.turnaroundPrefix': 'Plazo:',
    'pricing.maxValuePrefix': 'Valor máx. declarado:',
    'pricing.submitCta': 'Seleccionar Nivel',
    'pricing.badgePopular': 'MÁS ELEGIDO',
    'pricing.badgeVip': 'GUANTE BLANCO',
    'pricing.badgeValue': 'MEJOR VALOR',
    'pricing.feat.subgrades': '4 Sub-grados en escala 0.1 (Centrado, Esquinas, Bordes, Superficie)',
    'pricing.feat.scans': 'Escaneos microscópicos de campo oscuro a 40x',
    'pricing.feat.slab': 'Encapsulado sónico hermético a 35 kHz con filtro UV 99.4%',
    'pricing.feat.nfc': 'Código QR único enlazado al certificado público',
    'pricing.feat.insurance': 'Seguro de tránsito intracomunitario incluido',
    'pricing.feat.priority': 'Cola preferente en cámara acorazada',
    'pricing.feat.dualAudit': 'Doble peritaje independiente por Conservador Jefe',

    // Section: Nosotros & Laboratorio (Bilingual Senior Lab Protocol)
    'how.kicker': 'PROTOCOLO GLOBAL DE METROLOGÍA NUMISMÁTICA',
    'how.title': 'EL VIAJE DESDE CARTA CRUDA HASTA SLAB CERTIFICADO',
    'how.desc': 'Conoce cómo Gorilla Grading combina diagnóstico óptico multiespectral, química de polímeros de archivo y una cadena de custodia con trazabilidad total.',
    'how.step1.num': '01',
    'how.step1.title': 'Admisión Blindada & Trazabilidad Barcode',
    'how.step1.sub': 'Apertura bajo grabación continua en cámara acorazada.',
    'how.step1.desc': 'Los paquetes se recepcionan en nuestras sedes internacionales y se abren bajo videocámaras 4K continuas. Cada pieza recibe un identificador criptográfico único para trazabilidad ininterrumpida.',
    'how.step2.num': '02',
    'how.step2.title': 'Desionización y Purga en Sala Limpia ISO',
    'how.step2.sub': 'Eliminación electrostática de micropartículas.',
    'how.step2.desc': 'En entorno de flujo laminar con aire filtrado HEPA, la carta se somete a una cortina de nitrógeno desionizado para remover polvo microscópico sin fricción física ni contacto mecánico.',
    'how.step3.num': '03',
    'how.step3.title': 'Espectrometría y Verificación de Roseta',
    'how.step3.sub': 'Validación química de tintas y capas de impresión.',
    'how.step3.desc': 'Cámaras multiespectrales analizan la curva de absorción infrarroja contra patrones de planchas de imprenta originales. La fluorescencia UV a 365 nm descarta retoques, limpieza química o reproducciones.',
    'how.step4.num': '04',
    'how.step4.title': 'Telemetría Láser Submilimétrica (0.01 mm)',
    'how.step4.sub': 'Medición automatizada de márgenes y centrado.',
    'how.step4.desc': 'Calibres ópticos miden las proporciones de los bordes frontal y posterior en ejes horizontal, vertical y diagonales con tolerancia de 10 micras, eliminando la estimación ocular arbitraria.',
    'how.step5.num': '05',
    'how.step5.title': 'Mapeo Microscópico de Defectos a 40x',
    'how.step5.sub': 'Inspección de campo oscuro en esquinas, bordes y superficie.',
    'how.step5.desc': 'Luz polarizada oblicua revela micro-arañazos, líneas de impresión, compresión de esquinas y desgaste de foil. Cada defecto se cataloga con coordenadas exactas X/Y para el coleccionista.',
    'how.step6.num': '06',
    'how.step6.title': 'Encapsulado Ultrasónico a 35 kHz & Código QR',
    'how.step6.sub': 'Fusión molecular en acrílico virgen con filtro UV 99.4%.',
    'how.step6.desc': 'La carta descansa en una cuna interior suspendida sin presión y el estuche se suelda herméticamente mediante ultrasonidos a 35 kHz. Se incorpora un código QR único que enlaza al certificado en el registro público.',


    // Navigation (Classic)
    'nav.services': 'Servicios & Tarifas',
    'nav.howItWorks': 'Cómo Funciona',
    'nav.verify': 'Verificar Certificado',
    'nav.track': 'Seguimiento en Vivo',
    'nav.vault': 'Bóveda de Colección',
    'nav.compare': 'Matriz de Conceptos',
    'nav.submit': 'Enviar Cartas',
    'nav.registrySubtitle': 'Registro Internacional de Precisión',
    
    // Concept Switcher
    'switcher.prototype': 'PROTOTIPO:',
    'switcher.compareAll': 'Comparar Modelos',
    'switcher.active': 'ACTIVO',
    'switcher.switch': 'Cambiar a este Concepto',
    'switcher.viewing': 'Visualizando',
    
    // Model 01 Precision Lab
    'lab.tag': 'MODELO 01: LABORATORIO ÓPTICO — PRECISIÓN MILIMÉTRICA',
    'lab.heroTitle': 'Graduación sin especulaciones.',
    'lab.heroSubtitle': 'Respaldada por evidencia óptica submilimétrica.',
    'lab.heroDesc': 'El estándar definitivo para cartas coleccionables. Sustituimos la arbitrariedad subjetiva por telemetría láser multieje, mapeo de defectos por campo oscuro a 40x y encapsulado sónico hermético.',
    'lab.metricCentering': 'Precisión Centrado',
    'lab.metricCenteringVal': '0.01 mm',
    'lab.metricDarkfield': 'Campo Oscuro',
    'lab.metricDarkfieldVal': '40x Especular',
    'lab.metricTurnaround': 'Plazos UE',
    'lab.metricTurnaroundVal': '5–15 Días',
    'lab.ctaSubmit': 'Enviar a Laboratorio',
    'lab.ctaVerify': 'Consultar Registro Oficial',
    'lab.inspectorTitle': 'Comprende exactamente cada décima de tu nota',
    'lab.inspectorDesc': 'Sin calificaciones misteriosas. Interactúa con los marcadores para examinar la telemetría exacta, el análisis microscópico y las deducciones aplicadas.',
    'lab.protocolTitle': 'El Protocolo Óptico de 5 Fases de Gorilla',
    'lab.protocolP1Title': 'Ingreso en Bóveda & Limpieza Ionizada',
    'lab.protocolP1Desc': 'Desionización y microaspiración bajo filtración HEPA para eliminar polvo electrostático sin fricción superficial.',
    'lab.protocolP2Title': 'Autenticidad Espectral',
    'lab.protocolP2Desc': 'Comparativa de absorción UV e infrarroja contra formulaciones de tinta y densidad de papel originales de fábrica.',
    'lab.protocolP3Title': 'Calibre Láser Geométrico',
    'lab.protocolP3Desc': 'Cálculo de ratios de centrado borde a borde en vectores horizontales, verticales y diagonales.',
    'lab.protocolP4Title': 'Mapeo a 40x en Campo Oscuro',
    'lab.protocolP4Desc': 'La luz rasante revela microarañazos, líneas de impresión, plateado en holos y fracturas de fibra en esquinas.',
    'lab.protocolP5Title': 'Soldadura Sónica & Registro',
    'lab.protocolP5Desc': 'Fusión acrílica ultrasónica a 35kHz con un código QR único enlazado al certificado público.',
    
    // Model 02 Collector Gallery
    'gallery.tag': 'MODELO 02: GALERÍA DE COLECCIÓN — EL ESTÁNDAR ARCHIVÍSTICO',
    'gallery.heroTitle': 'Preservando reliquias de papel.',
    'gallery.heroSubtitle': 'Elevando cada carta a pieza de museo.',
    'gallery.heroDesc': 'Más que protección: una celebración editorial de tu colección. Los slabs Gorilla combinan acrílico de grado óptico con sellos de oro auténtico y procedencia europea de por vida.',
    'gallery.plateTitle': 'GRADO DE EXHIBICIÓN DE MUSEO',
    'gallery.originalRelease': 'Edición Original:',
    'gallery.preservationState': 'Estado Certificado:',
    'gallery.archivalValue': 'Valoración Estimada:',
    'gallery.populationStatus': 'Censo en Registro:',
    'gallery.switchHero': 'Cambiar Carta de Muestra',
    'gallery.submitArchive': 'Ingresar en Bóveda Archivística',
    'gallery.journeyTitle': 'De pieza vulnerable de papel a tesoro inmortalizado',
    
    // Model 03 Digital Jungle
    'jungle.tag': 'MODELO 03: SELVA DIGITAL — TCG MODERNO & COMUNIDAD',
    'jungle.heroTitle': 'Tus cartas, protegidas.',
    'jungle.heroSubtitle': 'Creado para la nueva generación europea de TCG.',
    'jungle.heroDesc': 'Encuentra a Gorilla Grading en tus ferias y card shows favoritos o envía directamente online. Subnotas transparentes, entregas exprés en 5 días y slabs hechos para resistir cualquier impacto.',
    'jungle.showPresence': 'Entregas en Mano en Card Shows Ibéricos y Europeos',
    'jungle.thisWeekend': 'ESTE FIN DE SEMANA',
    'jungle.showCities': 'Madrid TCG Expo • Lisbon Card Show • Barcelona Manga Fair',
    'jungle.bananaTag': 'HERRAMIENTA INFORMAL DE FERIA • NO ES CERTIFICACIÓN OFICIAL',
    'jungle.bananaTitle': 'Banana Quick-Check: Estimador Rápido',
    'jungle.bananaDesc': '¿Dudas si tu carta merece ser enviada? Introduce el nombre para consultar el histórico de población y tolerancias de centrado recomendadas.',
    'jungle.bananaPlaceholder': 'Ej. Shanks Romance Dawn Manga Alternate Art...',
    'jungle.bananaBtn': 'Calcular Estimación',
    'jungle.upcomingShows': 'Próximos Stands Gorilla en Europa',
    'jungle.liveFeed': 'Últimos Slabs Certificados en Vivo',

    // Model 04 Hybrid
    'hybrid.tag': 'MODELO 04: BASE HÍBRIDA — DIRECCIÓN ESTRATÉGICA RECOMENDADA',
    'hybrid.heroTitle': 'Graduación óptica de precisión.',
    'hybrid.heroSubtitle': 'Velocidad europea y protección sónica de grado militar.',
    'hybrid.heroDesc': 'El estándar de referencia para coleccionistas a nivel internacional. Centrado láser de 0.01mm, telemetría microscópica de defectos y slabs acrílicos ultrasónicos—respaldados por plazos reales de 5 a 15 días con seguro integral.',
    'hybrid.trustLaser': 'LÁSER 0.01mm',
    'hybrid.trustLaserSub': 'Centrado Objetivo',
    'hybrid.trustInsured': 'SEGURO UE',
    'hybrid.trustInsuredSub': 'Laboratorios Madrid & Lisboa',
    'hybrid.trustSonic': 'SLAB SÓNICO',
    'hybrid.trustSonicSub': 'Hermético UV 99.4%',

    // Submission Wizard
    'submit.title': 'Nueva Solicitud de Graduación',
    'submit.subtitle': 'Manifiesto electrónico para laboratorios de Madrid y Lisboa',
    'submit.step1': 'Nivel de Servicio',
    'submit.step2': 'Catálogo de Cartas',
    'submit.step3': 'Logística & Entrega',
    'submit.step4': 'Resumen & Albarán',
    'submit.addCard': 'AÑADIR OTRA CARTA AL ENVÍO',
    'submit.cardName': 'Nombre de la Carta *',
    'submit.gameCategory': 'Juego / Categoría',
    'submit.setName': 'Colección & Número',
    'submit.declaredVal': 'Valor de Reemplazo Declarado (€)',
    'submit.notes': 'Notas para el graduador (opcional)',
    'submit.courierOption': 'Mensajería Asegurada UE',
    'submit.showOption': 'Entrega en Mano en Card Show',
    'submit.liveTotal': 'Total de la Solicitud',
    'submit.cardsDeclared': 'Cartas Declaradas',
    'submit.lockOrder': 'Confirmar y Bloquear Solicitud',
    'submit.printSlip': 'Imprimir Albarán de Envío con Códigos de Barra',

    // Verification
    'verify.title': 'Verificar Certificado Gorilla',
    'verify.subtitle': 'Autentica la procedencia del slab, consulta la telemetría a 40x y comprueba el certificado firmado digitalmente.',
    'verify.placeholder': 'Introduce el nº de certificado (ej. GGI-XXXXXXXX)',
    'verify.scanQR': 'Escanear QR con Cámara',
    'verify.officialGrade': 'Nota Oficial',
    'verify.subCentering': 'Centrado',
    'verify.subCorners': 'Esquinas',
    'verify.subEdges': 'Bordes',
    'verify.subSurface': 'Superficie',
    'verify.totalGraded': 'Total en Registro Internacional:',
    'verify.higherPop': 'Población Superior:',
    'verify.equalPop': 'Población Igual:',

    // Tracking
    'track.title': 'Estado de Graduación & Cadena de Custodia',
    'track.subtitle': 'Sigue cada fase del proceso: recepción en bóveda, diagnóstico láser, encapsulado y retorno asegurado.',
    'track.placeholder': 'Nº de Seguimiento (ej. ES-GLS-9928174620)...',
    'track.timelineTitle': 'Cronología de la Cadena de Custodia',
    
    // Vault
    'vault.title': 'Bóveda de Colección de Carlos Mendes',
    'vault.memberSince': 'Socio desde 2025 • Madrid, España',
    'vault.portfolioVal': 'Valor Total de Bóveda',
    'vault.certifiedCount': 'Slabs Certificados',
    'vault.activeSub': 'Envíos en Curso',
    'vault.inventory': 'Inventario de Slabs Certificados',

    // Common
    'btn.back': 'Volver',
    'btn.next': 'Continuar',
    'btn.select': 'Seleccionar',
    'btn.inspect': 'Inspeccionar Defectos',
    'btn.verify': 'Verificar',
    'btn.share': 'Compartir',
    'btn.print': 'Imprimir',
    'card.flip': 'Girar Carta',
    'card.pristine': 'Pristine 10',
    'card.gemMint': 'Gem Mint 10',
    'card.mint': 'Mint 9',
    'card.nmMint': 'Near Mint-Mint 8.5'
  },
  en: {
    // Luxury Reference Homepage Translations (EN)
    'ref.nav.grading': 'Grading & Pricing',
    'ref.nav.technology': 'Technology',
    'ref.nav.collectors': 'Collectors',
    'ref.nav.pricing': 'Pricing',
    'ref.nav.about': 'About',
    'ref.nav.submit': 'Submit a Card',
    'ref.nav.signIn': 'Sign in',
    
    // Hero
    'ref.hero.eyebrow': 'PROFESSIONAL CARD GRADING',
    'ref.hero.title1': 'PRECISION',
    'ref.hero.title2': 'GIVES ',
    'ref.hero.titleGreen': 'VALUE',
    'ref.hero.desc': 'Powered by advanced technology and experts.',
    'ref.hero.ctaPrimary': 'Start Your Submission',
    'ref.hero.ctaSecondary': 'See Our Technology',
    'ref.hero.trustedBy': 'Trusted by collectors worldwide',
    'ref.hero.rating': '4.9/5',
    'ref.hero.ratingSub': 'From 2,500+ submissions',
    'ref.hero.categories': 'TCG  //  SPORTS  //  COLLECTIBLES',
    'ref.hero.moreThanGrade': 'MORE THAN A GRADE',
    'ref.hero.higherStandard': 'A HIGHER STANDARD',
    'ref.hero.plinthText': 'COLLECT · PRESERVE · VALUE',

    // Ecosystem Ribbon
    'ref.ribbon.title': 'TRUSTED BY COLLECTORS, STORES AND COMMUNITIES',
    'ref.ribbon.andMore': 'AND MORE',

    // Section 02 Technology
    'ref.tech.title': 'TECHNOLOGY THAT REVEALS THE REAL STORY',
    'ref.tech.title2': 'TECHNOLOGY MEETS EXPERTISE',
    'ref.tech.desc': 'High-resolution imaging and advanced analysis where every detail matters.',
    'ref.tech.desc2': 'A transparent grading process designed to give you confidence in every detail.',
    'ref.tech.explore': 'EXPLORE THE PROCESS',
    'ref.tech.step1': 'SCAN',
    'ref.tech.step1Desc': '1200 DPI multispectral imaging under calibrated neutral studio illumination.',
    'ref.tech.step2': 'ANALYZE',
    'ref.tech.step2Desc': 'Microscopic defect mapping, rosette dot patterns, and fiber analysis.',
    'ref.tech.step3': 'MEASURE',
    'ref.tech.step3Desc': 'Sub-millimeter laser caliper (0.01 mm) along horizontal, vertical and diagonal axes.',
    'ref.tech.step4': 'GRADE',
    'ref.tech.step4Desc': 'Hermetic ultrasonic optical acrylic encapsulation and cryptographic certificate emission.',
    'ref.tech.centering': 'CENTERING',
    'ref.tech.corners': 'CORNERS',
    'ref.tech.edges': 'EDGES',
    'ref.tech.surface': 'SURFACE',
    'ref.tech.authenticity': 'AUTHENTICITY',

    // Section 03 Pillars (Senior European Numismatic Authority)
    'ref.pillar1.title': 'PRESERVE',
    'ref.pillar1.desc': 'Museum-grade 35 kHz ultrasonic encapsulation. Virgin optical polymer free of plasticizers with 99.4% UV filtration, creating a permanent molecular barrier against humidity and oxidation.',
    'ref.pillar1.cta': 'EXPLORE ENCAPSULATION',
    'ref.pillar2.title': 'AUTHENTICATE',
    'ref.pillar2.desc': 'Optical micro-spectrometry and 1200 DPI rosette pattern analysis. Validating genuine factory ink chemistry under 365 nm UV fluorescence to expose rebacks, recoloring, or counterfeit stocks.',
    'ref.pillar2.cta': 'VERIFY CRITERIA',
    'ref.pillar3.title': 'UNDERSTAND',
    'ref.pillar3.desc': 'Sub-millimeter laser telemetry at 0.01 mm and 4-quadrant subgrades on a 0.1 scale (Centering, Corners, Edges, Surface), archived with cryptographic proof on the global registry.',
    'ref.pillar3.cta': 'VIEW TELEMETRY',
    'ref.pillar4.title': 'BELONG',
    'ref.pillar4.desc': 'Unified international collector ecosystem and market liquidity. Armored door-to-door transit with full replacement insurance and optimized global logistics.',
    'ref.pillar4.cta': 'ENTER VAULT',

    // Section 04 Mission (Authoritative Institutional Manifesto)
    'ref.mission.eyebrow': 'OUR MISSION',
    'ref.mission.title': 'THE DEFINITIVE NUMISMATIC & OPTICAL GLOBAL STANDARD',
    'ref.mission.title2': 'FOR A STRONGER COLLECTING FUTURE',
    'ref.mission.desc': 'Replacing subjective guesswork with reproducible optical metrology, verifiable digital provenance, and laboratory rigor. Engineered to international standards to safeguard collector heritage.',
    'ref.mission.desc2': 'We believe in a transparent, accessible and trustworthy collectibles market. Gorilla Grading is built for collectors, by collectors, with a long-term vision.',
    'ref.mission.cta': 'DISCOVER OUR LAB',
    'ref.mission.btn1': 'Our Mission',
    'ref.mission.btn2': 'Submit a Card',
    'ref.mission.trust': 'TRUST',
    'ref.mission.transparency': 'TRANSPARENCY',
    'ref.mission.innovation': 'INNOVATION',
    'ref.mission.community': 'COMMUNITY',

    // Section: Tarifas & Servicios (Bilingual Senior Pricing)
    'pricing.kicker': 'GLOBAL STANDARD · INTERNATIONAL OPERATIONS',
    'pricing.title': 'GRADING TIERS & PRICING',
    'pricing.desc': 'Laboratory precision with guaranteed business-day turnarounds, full replacement insurance, and real-time European vault telemetry.',
    'pricing.cardUnit': '/ card',
    'pricing.turnaroundPrefix': 'Turnaround:',
    'pricing.maxValuePrefix': 'Max declared value:',
    'pricing.submitCta': 'Select Tier',
    'pricing.badgePopular': 'MOST POPULAR',
    'pricing.badgeVip': 'WHITE GLOVE',
    'pricing.badgeValue': 'BEST VALUE',
    'pricing.feat.subgrades': '4 Subgrades on 0.1 scale (Centering, Corners, Edges, Surface)',
    'pricing.feat.scans': '40x Darkfield polarized microscopic scans',
    'pricing.feat.slab': '35 kHz Ultrasonic hermetic seal with 99.4% UV filtration',
    'pricing.feat.nfc': 'Unique QR code linked to the public certificate registry',
    'pricing.feat.insurance': 'Intra-European insured transit included',
    'pricing.feat.priority': 'Priority queue in climate-controlled vault',
    'pricing.feat.dualAudit': 'Independent dual audit by Senior Numismatic Conservator',

    // Section: Nosotros & Laboratorio (Bilingual Senior Lab Protocol)
    'how.kicker': 'GLOBAL NUMISMATIC METROLOGY PROTOCOL',
    'how.title': 'THE JOURNEY FROM RAW CARD TO CERTIFIED SLAB',
    'how.desc': 'Discover how Gorilla Grading integrates multispectral optical diagnostics, archival polymer chemistry, and uninterrupted chain-of-custody tracking.',
    'how.step1.num': '01',
    'how.step1.title': 'Armored Intake & Barcode Logging',
    'how.step1.sub': 'Continuous 4K video recording inside secure intake vault.',
    'how.step1.desc': 'Packages are received at our European facilities and opened under continuous 4K overhead cameras. Each specimen is assigned an immutable cryptographic identifier for non-stop custody tracking.',
    'how.step2.num': '02',
    'how.step2.title': 'ISO Cleanroom Nitrogen De-Dusting',
    'how.step2.sub': 'Electrostatic particulate neutralization.',
    'how.step2.desc': 'Within an ISO-class laminar flow environment with HEPA filtration, cards are treated with an ionized nitrogen air curtain to lift microscopic dust without physical friction or mechanical contact.',
    'how.step3.num': '03',
    'how.step3.title': 'Multispectral Ink & Rosette Validation',
    'how.step3.sub': 'Chemical ink profiling and print screen verification.',
    'how.step3.desc': 'Multispectral sensors compare infrared absorption curves against genuine factory offset printing plates. 365 nm UV fluorescence exposes chemical cleaning, recoloring, or counterfeit cardstocks.',
    'how.step4.num': '04',
    'how.step4.title': 'Sub-Millimeter Laser Telemetry (0.01 mm)',
    'how.step4.sub': 'Automated margin caliper calculation.',
    'how.step4.desc': 'Optical laser calipers measure front and back border ratios along horizontal, vertical, and diagonal vectors down to 10 microns, eliminating ocular bias and human grading fatigue.',
    'how.step5.num': '05',
    'how.step5.title': '40x Darkfield Polarized Defect Mapping',
    'how.step5.sub': 'Sub-surface inspection of corners, edges, and holofoil.',
    'how.step5.desc': 'Oblique polarized darkfield illumination uncovers micro-scratches, print lines, corner fiber compaction, and edge silvering. Every defect is logged with exact X/Y coordinates for collector review.',
    'how.step6.num': '06',
    'how.step6.title': '35 kHz Ultrasonic Fusion & QR Code',
    'how.step6.sub': 'Molecular acrylic bond with 99.4% UV filtration.',
    'how.step6.desc': 'The card is placed in a custom zero-pressure inner cradle, and the casing is molecularly fused via 35 kHz ultrasonic welding. A unique QR code is added, linking directly to the certificate in the public registry.',

    // Navigation (Classic)
    'nav.services': 'Services & Pricing',
    'nav.howItWorks': 'How It Works',
    'nav.verify': 'Verify Certificate',
    'nav.track': 'Live Tracking',
    'nav.vault': 'Collector Vault',
    'nav.compare': 'Concepts Matrix',
    'nav.submit': 'Submit Cards',
    'nav.registrySubtitle': 'International Precision Registry',
    
    // Concept Switcher
    'switcher.prototype': 'PROTOTYPE:',
    'switcher.compareAll': 'Compare All',
    'switcher.active': 'ACTIVE',
    'switcher.switch': 'Switch to Concept',
    'switcher.viewing': 'Viewing Now',
    
    // Model 01 Precision Lab
    'lab.tag': 'MODEL 01: OPTICAL LAB — SUB-MILLIMETER PRECISION',
    'lab.heroTitle': 'Grading without guesswork.',
    'lab.heroSubtitle': 'Backed by sub-millimeter optical evidence.',
    'lab.heroDesc': 'The international standard for collectible cards. We replace subjective human eyes with multi-axis optical laser measurement, 40x darkfield defect mapping, and ultrasonic hermetic encapsulation.',
    'lab.metricCentering': 'Centering Accuracy',
    'lab.metricCenteringVal': '0.01 mm',
    'lab.metricDarkfield': 'Darkfield Specs',
    'lab.metricDarkfieldVal': '40x Specular',
    'lab.metricTurnaround': 'EU Turnaround',
    'lab.metricTurnaroundVal': '5–15 Days',
    'lab.ctaSubmit': 'Submit to Optical Lab',
    'lab.ctaVerify': 'Query Certificate Registry',
    'lab.inspectorTitle': 'Understand exactly how every subgrade was calculated',
    'lab.inspectorDesc': 'No mystery grades. Click on any defect marker to examine optical telemetry, micron measurement, and exact score deductions.',
    'lab.protocolTitle': 'The Gorilla 5-Point Optical Protocol',
    'lab.protocolP1Title': 'Nitrogen Vault Cleanse',
    'lab.protocolP1Desc': 'De-ionization and micro-vacuuming under HEPA filtration removes electrostatic dust without touching card surfaces.',
    'lab.protocolP2Title': 'Spectral Authenticity',
    'lab.protocolP2Desc': 'UV & infrared wavelength comparison against known genuine factory ink formulations and cardstock grain.',
    'lab.protocolP3Title': 'Geometric Caliper',
    'lab.protocolP3Desc': 'Sub-millimeter edge-to-border centering ratio computation across horizontal, vertical, and diagonal vectors.',
    'lab.protocolP4Title': '40x Darkfield Defect Mapping',
    'lab.protocolP4Desc': 'Specular reflection reveals scratches, print lines, holo silvering, corner fiber separation and roller marks.',
    'lab.protocolP5Title': 'Sonic Weld & Cert',
    'lab.protocolP5Desc': '35kHz ultrasonic acrylic fusion with a unique QR code linked to the public certificate.',

    // Model 02 Collector Gallery
    'gallery.tag': 'MODEL 02: COLLECTOR GALLERY — THE ARCHIVAL STANDARD',
    'gallery.heroTitle': 'Preserving paper artifacts.',
    'gallery.heroSubtitle': 'Elevating cards to museum grandeur.',
    'gallery.heroDesc': 'More than protection—an editorial celebration of your collection. Gorilla slabs are engineered with optical-grade acrylic, archival gold-foil seals, and lifetime European provenance.',
    'gallery.plateTitle': 'MUSEUM EXHIBITION GRADE',
    'gallery.originalRelease': 'Original Release:',
    'gallery.preservationState': 'Certified State:',
    'gallery.archivalValue': 'Estimated Value:',
    'gallery.populationStatus': 'Registry Population:',
    'gallery.switchHero': 'Switch Sample Card',
    'gallery.submitArchive': 'Submit to Archival Vault',
    'gallery.journeyTitle': 'From fragile paper artifact to immortalized slab',

    // Model 03 Digital Jungle
    'jungle.tag': 'MODEL 03: DIGITAL JUNGLE — MODERN TCG & COMMUNITY',
    'jungle.heroTitle': 'Your cards, protected.',
    'jungle.heroSubtitle': 'Built for the European TCG generation.',
    'jungle.heroDesc': 'Meet Gorilla Grading at your favorite European card shows or submit directly online. Transparent subgrades, ultra-fast 5-day EU turnarounds, and slabs built to survive anything.',
    'jungle.showPresence': 'Live Drop-Offs at Iberian & European Card Shows',
    'jungle.thisWeekend': 'THIS WEEKEND',
    'jungle.showCities': 'Madrid TCG Expo • Lisbon Card Show • Barcelona Manga Fair',
    'jungle.bananaTag': 'INFORMAL SHOW UTILITY • NOT OFFICIAL CERTIFICATION',
    'jungle.bananaTitle': 'Banana Quick-Check Estimator',
    'jungle.bananaDesc': 'Curious if your raw card is worth grading? Enter your card title below for instant historical European population and centering recommendations.',
    'jungle.bananaPlaceholder': 'e.g. Shanks Romance Dawn Manga Alternate Art...',
    'jungle.bananaBtn': 'Quick Check',
    'jungle.upcomingShows': 'Upcoming Gorilla Show Booths',
    'jungle.liveFeed': 'Recently Certified Slabs Live',

    // Model 04 Hybrid
    'hybrid.tag': 'MODEL 04: HYBRID BASELINE — RECOMMENDED STRATEGY',
    'hybrid.heroTitle': 'Precision optical grading.',
    'hybrid.heroSubtitle': 'European speed & sonic military-grade protection.',
    'hybrid.heroDesc': 'The modern standard for international TCG collectors. Sub-millimeter laser centering, microscopic defect telemetry, and ultrasonic acrylic slabs—backed by global insured turnarounds with zero customs delays.',
    'hybrid.trustLaser': '0.01mm LASER',
    'hybrid.trustLaserSub': 'Objective Centering',
    'hybrid.trustInsured': 'EU INSURED',
    'hybrid.trustInsuredSub': 'Madrid & Lisbon Labs',
    'hybrid.trustSonic': 'SONIC SLAB',
    'hybrid.trustSonicSub': 'Hermetic UV 99.4%',

    // Submission Wizard
    'submit.title': 'Create Card Submission',
    'submit.subtitle': 'Electronic manifest for Madrid and Lisbon grading laboratories',
    'submit.step1': 'Service Tier',
    'submit.step2': 'Card Catalog',
    'submit.step3': 'Logistics & Hand-off',
    'submit.step4': 'Summary & Packing Slip',
    'submit.addCard': 'ADD ANOTHER CARD TO SUBMISSION',
    'submit.cardName': 'Card Name *',
    'submit.gameCategory': 'Game / Category',
    'submit.setName': 'Set & Card Number',
    'submit.declaredVal': 'Declared Replacement Value (€)',
    'submit.notes': 'Special Grader Notes (optional)',
    'submit.courierOption': 'Insured EU Courier',
    'submit.showOption': 'Card Show Drop-Off',
    'submit.liveTotal': 'Live Submission Total',
    'submit.cardsDeclared': 'Declared Cards',
    'submit.lockOrder': 'Confirm & Lock Submission',
    'submit.printSlip': 'Print Packing Slip with Barcodes',

    // Verification
    'verify.title': 'Verify Gorilla Certificate',
    'verify.subtitle': 'Authenticate slab provenance, inspect 40x optical defect telemetry, and verify the digitally signed certificate.',
    'verify.placeholder': 'Enter the certificate number (e.g. GGI-XXXXXXXX)',
    'verify.scanQR': 'Scan QR via Camera',
    'verify.officialGrade': 'Official Grade',
    'verify.subCentering': 'Centering',
    'verify.subCorners': 'Corners',
    'verify.subEdges': 'Edges',
    'verify.subSurface': 'Surface',
    'verify.totalGraded': 'Total in International Registry:',
    'verify.higherPop': 'Higher Population:',
    'verify.equalPop': 'Equal Population:',

    // Tracking
    'track.title': 'Grading Status & Chain of Custody',
    'track.subtitle': 'Track every phase: vault reception, laser diagnostics, encapsulation, and insured return.',
    'track.placeholder': 'Tracking # (e.g. ES-GLS-9928174620)...',
    'track.timelineTitle': 'Chain of Custody Timeline',
    
    // Vault
    'vault.title': 'Carlos Mendes\'s Vault',
    'vault.memberSince': 'Member since 2025 • Madrid, Spain',
    'vault.portfolioVal': 'Total Portfolio Value',
    'vault.certifiedCount': 'Certified Slabs',
    'vault.activeSub': 'Active Submissions',
    'vault.inventory': 'Certified Slabs Inventory',

    // Common
    'btn.back': 'Back',
    'btn.next': 'Continue',
    'btn.select': 'Select',
    'btn.inspect': 'Inspect Defect Data',
    'btn.verify': 'Verify',
    'btn.share': 'Share',
    'btn.print': 'Print',
    'card.flip': 'Flip Card',
    'card.pristine': 'Pristine 10',
    'card.gemMint': 'Gem Mint 10',
    'card.mint': 'Mint 9',
    'card.nmMint': 'Near Mint-Mint 8.5'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gorilla_language', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const dict = translations[language] || translations['en'];
    return (dict as any)[key] || (translations['en'] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
