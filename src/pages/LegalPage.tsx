import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, FileText, Lock, RotateCcw, Cookie, CheckCircle2, Check } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'privacy' | 'refund' | 'cookies' | 'legal-notice';
  onNavigate?: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type: initialType, onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEs = language === 'es';

  const [activeType, setActiveType] = useState<LegalPageProps['type']>(initialType);

  React.useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  // Cookie Preferences State

  const tabs = [
    { 
      id: 'legal-notice' as const, 
      num: '01', 
      label: isEs ? 'AVISO LEGAL' : 'LEGAL NOTICE', 
      icon: Shield 
    },
    { 
      id: 'terms' as const, 
      num: '02', 
      label: isEs ? 'TÉRMINOS Y CONDICIONES' : 'TERMS & CONDITIONS', 
      icon: FileText 
    },
    { 
      id: 'privacy' as const, 
      num: '03', 
      label: isEs ? 'PRIVACIDAD GLOBAL' : 'PRIVACY & DATA PROTECTION', 
      icon: Lock 
    },
    { 
      id: 'refund' as const, 
      num: '04', 
      label: isEs ? 'REEMBOLSOS Y COBERTURA' : 'REFUND & CLAIMS', 
      icon: RotateCcw 
    },
    { 
      id: 'cookies' as const, 
      num: '05', 
      label: isEs ? 'POLÍTICA DE COOKIES' : 'COOKIE POLICY', 
      icon: Cookie 
    },
  ];

  const legalContent = {
    'legal-notice': {
      category: isEs ? 'ESTATUTO CORPORATIVO' : 'CORPORATE CHARTER',
      code: 'DOC. GGI-CORP-LEGAL-2026',
      title: isEs ? 'Aviso Legal y Estructura Societaria' : 'Legal Notice & Corporate Entity',
      desc: isEs
        ? 'Identificación institucional, titularidad de activos tecnológicos y marco regulatorio internacional aplicable a los servicios de metrología óptica, certificación numismática y custodia acorazada.'
        : 'Official corporate disclosure, intellectual property governance, and international statutory framework governing optical metrology, certification, and high-security vault custody.',
      metrics: [
        { label: isEs ? 'Régimen Jurídico' : 'Legal Jurisdiction', val: isEs ? 'Derecho Mercantil UE' : 'EU Commercial Law' },
        { label: isEs ? 'Protección Marcaria' : 'Trademark Treaty', val: 'Tratado de Madrid · WIPO' },
        { label: isEs ? 'Estándar de Graduación' : 'Grading Standard', val: isEs ? 'Regla de nota pública' : 'Public grading rule' },
        { label: isEs ? 'Custodia y Depósito' : 'Vault Protocol', val: isEs ? 'Póliza a Todo Riesgo' : 'All-Risk Insured' },
      ],
      articles: [
        {
          num: '01',
          title: isEs ? 'Identidad de la Sociedad y Sede Operativa' : 'Corporate Identity & Registered Offices',
          text: isEs
            ? 'Gorilla Grading International S.L. es una entidad mercantil debidamente constituida con alcance internacional, titular de Número de Identificación Fiscal comunitario y registro de operadores globales. Nuestras instalaciones técnicas y cámaras acorazadas de custodia coordinan servicios para coleccionistas e instituciones a escala internacional.'
            : 'Gorilla Grading International S.L. is a legally registered corporate entity operating under international commercial statutes, holding international VAT and economic operator credentials. Our centralized laboratories and high-security vaults provide certified services to global collectors and archival institutions.'
        },
        {
          num: '02',
          title: isEs ? 'Propiedad Intelectual, Patentes y Algoritmos' : 'Intellectual Property, Patents & Algorithms',
          text: isEs
            ? 'Todos los signos distintivos, la marca Gorilla Grading, los diseños industriales del slab de polímero con sellado ultrasónico a 35 kHz, los algoritmos matemáticos de cálculo subpíxel de centrado y el sistema de certificados y verificación son propiedad exclusiva de Gorilla Grading International S.L., protegidos por tratados internacionales de propiedad industrial (CUP, OMPI/WIPO).'
            : 'All trademarks, logos, industrial designs of the 35 kHz ultrasonic acrylic encapsulation slab, proprietary sub-pixel optical centering algorithms, and the certificate and verification system remain the exclusive property of Gorilla Grading International S.L., protected under international intellectual property treaties (WIPO, Paris Convention).'
        },
        {
          num: '03',
          title: isEs ? 'Uso Autorizado y Protección de la Base de Datos' : 'Authorized Access & Registry Database Protection',
          text: isEs
            ? 'El explorador público de certificados y la base de datos de cartas graduadas se ofrecen para verificación de autenticidad. Queda estrictamente prohibida la copia no autorizada, el raspado automatizado (scraping), la alteración o falsificación de códigos QR y etiquetas de certificación.'
            : 'The public certificate registry is provided strictly for verification of specimen authenticity. Unauthorized automated data extraction (scraping), forging or altering QR codes and certification labels, or reverse engineering of metrological telemetry is strictly prohibited.'
        },
        {
          num: '04',
          title: isEs ? 'Jurisdicción y Resolución de Controversias' : 'Jurisdiction & Dispute Resolution',
          text: isEs
            ? 'Cualquier controversia derivada de los servicios tecnológicos o comerciales se someterá a mediación y a los tribunales competentes fijados por la normativa mercantil aplicable, con plena sujeción a los principios de buena fe y arbitraje comercial internacional.'
            : 'Any dispute arising from technological or certification services shall be governed by applicable international commercial law and submitted to competent commercial arbitration courts in accordance with established international trade practices.'
        }
      ]
    },
    'terms': {
      category: isEs ? 'CONVENIO DE SERVICIOS' : 'SERVICE COVENANT',
      code: 'DOC. GGI-TERMS-CUSTODY-2026',
      title: isEs ? 'Términos de Servicio y Protocolo de Custodia' : 'Terms of Service & Custody Protocol',
      desc: isEs
        ? 'Contrato vinculante que rige la recepción en cámara limpia, la auditoría óptica imparcial, el aseguramiento a valor declarado y la preservación hermética en cápsula molecular.'
        : 'Binding covenant governing cleanroom intake, objective spectrometric evaluation, full declared-value transit insurance, and hermetic ultrasonic preservation.',
      metrics: [
        { label: isEs ? 'Cobertura Asegurada' : 'Insured Replacement', val: '100% Valor Declarado' },
        { label: isEs ? 'Precisión de Calibre' : 'Metrology Precision', val: '± 0.015 mm Subpíxel' },
        { label: isEs ? 'Fusión Molecular' : 'Ultrasonic Fusion', val: '35 kHz Sin Químicos' },
        { label: isEs ? 'Criterio de Evaluación' : 'Grading Protocol', val: 'Imparcial & Auditoría Doble' },
      ],
      articles: [
        {
          num: '01',
          title: isEs ? 'Ámbito de Aplicación y Consentimiento' : 'Contractual Scope & Binding Agreement',
          text: isEs
            ? 'Al enviar ejemplares a través de la plataforma web o depositarlos en puntos de entrega oficiales, el coleccionista suscribe de forma vinculante los presentes términos de servicio, aceptando los protocolos metrológicos de manipulación y preservación de Gorilla Grading.'
            : 'By submitting specimens via the platform or delivering them to authorized intake drop-off centers, the collector enters into a binding covenant governed by Gorilla Grading archival custody and technical grading protocols.'
        },
        {
          num: '02',
          title: isEs ? 'Objetividad e Imparcialidad en la Calificación' : 'Objective & Impartial Grading Standards',
          text: isEs
            ? 'La graduación de cada ejemplar se fundamenta estrictamente en datos métricos objetivos: análisis espectral a 1200 DPI, microscopía de rosetas litográficas a 2400 LPI y fotogrametría subpíxel. Las notas emitidas son finales e irrevocables; Gorilla Grading no garantiza calificaciones comerciales subjetivas.'
            : 'Specimen grading is strictly governed by objective physical telemetry: 1200 DPI spectral imaging, 2400 LPI lithographic rosette inspection, and sub-pixel edge photogrammetry. Assigned grades are final and impartial; commercial or speculative grades are never guaranteed.'
        },
        {
          num: '03',
          title: isEs ? 'Custodia Acorazada y Seguro Integral a Todo Riesgo' : 'Armored Custody & Comprehensive Transit Insurance',
          text: isEs
            ? 'Desde la confirmación de recepción física en el laboratorio hasta la entrega final en manos del cliente, cada carta permanece protegida por una póliza integral de seguro de transporte y custodia acorazada por el 100% del valor de reposición declarado.'
            : 'From validated intake scan to insured door-to-door return, every collectible is covered by our comprehensive transit and vault policy insuring 100% of verified fair market replacement value.'
        },
        {
          num: '04',
          title: isEs ? 'Plazos de Ejecución y Entrega' : 'Service Tiers & Completion Windows',
          text: isEs
            ? 'Los tiempos de entrega (Estándar, Prioritario y Guante Blanco) se computan en días hábiles a partir del escaneado de ingreso en bóveda. Gorilla Grading mantiene trazabilidad pública en tiempo real de cada fase de peritaje en la cuenta del coleccionista.'
            : 'Processing windows (Standard, Priority, White Glove) are measured in business days from verified vault entry. Real-time telemetry stages are tracked transparently in the collector dashboard throughout every phase.'
        }
      ]
    },
    'privacy': {
      category: isEs ? 'SEGURIDAD DE LA INFORMACIÓN' : 'DATA PROTECTION',
      code: 'DOC. GGI-PRIV-GDPR-2026',
      title: isEs ? 'Política de Privacidad y Protección de Datos' : 'Privacy Policy & Global Data Protection',
      desc: isEs
        ? 'Compromiso riguroso con la privacidad del coleccionista conforme al RGPD de la Unión Europea y los más exigentes estándares internacionales de seguridad de la información (ISO/IEC 27001).'
        : 'Commitment to collector confidentiality adhering to EU GDPR standards and international information security protocols (ISO/IEC 27001).',
      metrics: [
        { label: isEs ? 'Cifrado en Reposo' : 'Data Encryption', val: 'AES-256-GCM / TLS 1.3' },
        { label: isEs ? 'Alojamiento Servidores' : 'Hosting Infrastructure', val: 'Centros Tier-IV Auditados' },
        { label: isEs ? 'Cesión Comercial' : 'Third-Party Selling', val: '0.00% (Estrictamente Nula)' },
        { label: isEs ? 'Auditoría de Privacidad' : 'Privacy Compliance', val: 'Delegado DPO Certificado' },
      ],
      articles: [
        {
          num: '01',
          title: isEs ? 'Datos Esenciales Recopilados' : 'Essential Data Collection',
          text: isEs
            ? 'Únicamente procesamos la información estrictamente necesaria para la prestación del servicio: datos identificativos de contacto, dirección física validada para envíos asegurados y registro histórico de los certificados emitidos a su nombre.'
            : 'We collect solely necessary information required for service execution: verified contact details, validated physical address for insured delivery, and archival history of issued certificates linked to your collector profile.'
        },
        {
          num: '02',
          title: isEs ? 'Infraestructura Criptográfica y Aislamiento' : 'Cryptographic Security & System Isolation',
          text: isEs
            ? 'Todas las transacciones y bases de datos están protegidas mediante cifrado AES-256 en reposo y conexiones forzadas TLS 1.3. Los datos de pago nunca se almacenan en nuestros servidores y se gestionan exclusivamente mediante pasarelas con certificación bancaria PCI-DSS Nivel 1.'
            : 'All databases and data transfers are protected via AES-256 encryption at rest and TLS 1.3 in transit. Financial payment credentials are never stored on our servers and are handled exclusively by Tier-1 PCI-DSS certified banking processors.'
        },
        {
          num: '03',
          title: isEs ? 'Cero Comercialización de Información' : 'Zero Commercialization or Data Brokerage',
          text: isEs
            ? 'Gorilla Grading no vende, arrienda ni transfiere bajo ninguna circunstancia los datos de sus clientes a empresas publicitarias o corredores de datos. El acceso queda restringido al personal autorizado y a los transportistas asegurados para la entrega.'
            : 'Gorilla Grading does not sell, lease, or distribute collector information to marketing agencies or third-party brokers. Access is strictly limited to authorized lab personnel and insured logistics carriers for final delivery.'
        },
        {
          num: '04',
          title: isEs ? 'Ejercicio de Derechos de Acceso y Supresión' : 'Collector Rights: Access, Rectification & Erasure',
          text: isEs
            ? 'Cualquier titular puede solicitar en cualquier momento el acceso, modificación, exportación o supresión definitiva de sus datos personales contactando directamente con nuestro departamento de cumplimiento en compliance@gorillagrading.com.'
            : 'Collectors retain full statutory rights to inspect, update, export, or permanently erase their personal data by contacting our compliance office at compliance@gorillagrading.com.'
        }
      ]
    },
    'refund': {
      category: isEs ? 'GARANTÍA Y COBERTURA' : 'GUARANTEE & COVERAGE',
      code: 'DOC. GGI-CLAIMS-INSURANCE-2026',
      title: isEs ? 'Garantía Numismática, Reembolsos y Cobertura' : 'Numismatic Guarantee, Claims & Refunds',
      desc: isEs
        ? 'Estatuto de indemnización transparente que garantiza la restitución del 100% del valor de reposición de mercado en caso de siniestro durante el tránsito asegurado o la custodia.'
        : 'Transparent compensation charter guaranteeing 100% fair market replacement value in the verified event of transit incident or vault contingency.',
      metrics: [
        { label: isEs ? 'Garantía de Tránsito' : 'Transit Protection', val: 'Cobertura Puerta a Puerta' },
        { label: isEs ? 'Límite Asegurable' : 'Insurable Limit', val: 'Hasta 100.000 € / Colección' },
        { label: isEs ? 'Peritaje de Siniestro' : 'Claims Processing', val: 'Dictamen en 5 Días Hábiles' },
        { label: isEs ? 'Sustitución de Slab' : 'Capsule Warranty', val: 'Garantía Vitalicia de Sellado' },
      ],
      articles: [
        {
          num: '01',
          title: isEs ? 'Póliza de Tránsito y Recepción Segura' : 'Insured Transit & Intake Protocol',
          text: isEs
            ? 'Todos los envíos canalizados mediante nuestras etiquetas aseguradas cuentan con cobertura integral contra pérdida, sustracción o daño material durante el transporte. Al recibirse en laboratorio, el desempaquetado se registra bajo circuito cerrado de vídeo de alta definición.'
            : 'All shipments processed via our insured pre-paid logistics labels carry full indemnification against loss, theft, or transit damage. Upon arrival, unpacking is recorded continuously under high-definition closed-circuit optical cameras.'
        },
        {
          num: '02',
          title: isEs ? 'Compensación por Incidencia en Laboratorio' : 'Facility Incident Compensation',
          text: isEs
            ? 'En el improbable supuesto de daño físico durante el proceso de manipulación o encapsulado ultrasónico, nuestra compañía indemnizará al propietario por el valor de mercado contrastado del ejemplar o el valor declarado por el cliente.'
            : 'In the rare contingency of physical damage during cleanroom handling or ultrasonic encapsulation, Gorilla Grading compensates the collector based on independently verified market value or initial declared value.'
        },
        {
          num: '03',
          title: isEs ? 'Garantía Vitalicia del Sellado Hermético' : 'Lifetime Ultrasonic Weld Warranty',
          text: isEs
            ? 'Nuestra cápsula de polímero acrílico virgen cuenta con garantía vitalicia frente a defectos de fusión sónica o desprendimiento espontáneo de la soldadura. En caso de defecto de fabricación, el reencapsulado y reemisión de etiqueta se efectúan sin coste.'
            : 'Our museum-grade polymer slabs carry a lifetime warranty against sonic weld separation or manufacturing defects. In case of certified material flaw, re-encapsulation and label reissuance are performed entirely free of charge.'
        },
        {
          num: '04',
          title: isEs ? 'Procedimiento y Plazos de Reclamación' : 'Claim Notification & Resolution Period',
          text: isEs
            ? 'Cualquier disconformidad o reporte de incidencia debe notificarse en los 14 días naturales posteriores a la entrega. El departamento pericial emitirá resolución fundamentada en un plazo máximo de 5 días hábiles.'
            : 'Any notification of damage or delivery discrepancy must be filed within 14 calendar days of receipt. Our forensic claims division completes formal case evaluation within 5 business days.'
        }
      ]
    },
    'cookies': {
      category: isEs ? 'DIRECTIVA DE NAVEGACIÓN' : 'NAVIGATION DIRECTIVE',
      code: 'DOC. GGI-COOKIES-TECH-2026',
      title: isEs ? 'Política de Cookies e Identificadores' : 'Cookie Policy & Technical Storage',
      desc: isEs
        ? 'Transparencia absoluta: utilizamos únicamente identificadores técnicos esenciales para mantener su sesión segura y telemetría anónima de rendimiento, sin rastreadores publicitarios intrusivos.'
        : 'Complete transparency: we utilize solely essential technical tokens for secure sessions and anonymous performance telemetry, completely free of commercial advertising trackers.',
      metrics: [
        { label: isEs ? 'Cookies Publicitarias' : 'Advertising Trackers', val: '0 (Estrictamente Prohibidas)' },
        { label: isEs ? 'Identificador de Sesión' : 'Session Security', val: 'Tokens Cifrados HttpOnly' },
        { label: isEs ? 'Rendimiento 3D' : '3D Telemetry', val: 'Métricas Locales Anónimas' },
        { label: isEs ? 'Control de Usuario' : 'User Governance', val: 'Modificable en Todo Momento' },
      ],
      articles: [
        {
          num: '01',
          title: isEs ? 'Qué son las Cookies y su Función Técnica' : 'Technical Nature & Purpose of Storage',
          text: isEs
            ? 'Las cookies son pequeños ficheros que se descargan en su dispositivo al acceder a la plataforma web. En Gorilla Grading se emplean para autenticar su acceso a la Bóveda de Coleccionista, mantener la selección de idioma y garantizar transacciones cifradas sin fallos.'
            : 'Cookies are small data files stored locally on your device upon accessing the web portal. Gorilla Grading uses them exclusively to authenticate Collector Vault sessions, preserve language preferences, and maintain tamper-resistant encrypted transactions.'
        },
        {
          num: '02',
          title: isEs ? 'Tipologías de Cookies Utilizadas' : 'Categories of Active Storage',
          text: isEs
            ? '1. Cookies Técnicas (Estrictamente Necesarias): indispensables para la navegación y el pago seguro. 2. Cookies de Telemetría Anónima: permiten evaluar la velocidad de renderizado del visor 3D de certificados y corregir errores sin rastrear su identidad.'
            : '1. Technical Cookies (Strictly Necessary): essential for account access and secure checkout. 2. Anonymous Telemetry Cookies: evaluate 3D certificate rendering speed and diagnose browser performance without tracking personal identity.'
        },
        {
          num: '03',
          title: isEs ? 'Ausencia de Redes de Rastreo de Terceros' : 'Absence of Third-Party Ad Networks',
          text: isEs
            ? 'Nuestra plataforma no implementa píxeles de retargeting publicitario ni comparte perfiles de navegación con empresas comercializadoras de datos.'
            : 'Our platform never deploys cross-site advertising retargeting pixels nor distributes browsing profiles to third-party data brokers.'
        },
        {
          num: '04',
          title: isEs ? 'Cómo gestionarlas' : 'How to manage them',
          text: isEs
            ? 'Solo usamos cookies técnicas, imprescindibles para iniciar sesión, por lo que no necesitan su consentimiento. Puede borrarlas o bloquearlas en cualquier momento desde los ajustes de su navegador; si lo hace, no podrá iniciar sesión.'
            : 'We only use technical cookies, required to sign in, so they do not need your consent. You can delete or block them at any time in your browser settings; if you do, you will not be able to sign in.'
        }
      ]
    },
  };

  const currentData = legalContent[activeType] || legalContent['legal-notice'];

  const handleTabClick = (tabId: LegalPageProps['type']) => {
    setActiveType(tabId);
    if (onNavigate) {
      onNavigate(`/${tabId}`);
    }
  };

  return (
    <div className={`w-full min-h-screen py-10 sm:py-16 px-4 sm:px-6 lg:px-12 font-sans transition-colors duration-300 ${
      isLight ? 'bg-[#F8F6F0] text-[#14170F]' : 'bg-[#0E1310] text-[#F3F4F1]'
    }`}>
      <div className="max-w-[1360px] mx-auto space-y-8 sm:space-y-12">

        {/* ── 1. DIGNIFIED INSTITUTIONAL MASTHEAD & DOSSIER NAVIGATION ── */}
        <div className={`p-6 sm:p-8 border transition-all ${
          isLight 
            ? 'bg-[#FAF8F3] border-[#DDD5C7]' 
            : 'bg-[#131A14] border-white/10'
        }`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-current/15">
            <div>
              <div className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase text-[#15803D] dark:text-[#48C765]">
                GORILLA GRADING INTERNATIONAL
              </div>
              <h1 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-[900] uppercase tracking-normal mt-2 ${
                isLight ? 'text-[#14170F]' : 'text-white'
              }`}>
                {isEs 
                  ? 'Marco Legal y Estatutos Corporativos' 
                  : 'Legal Framework & Corporate Statutes'}
              </h1>
              <p className="font-sans text-xs sm:text-sm opacity-70 mt-1 max-w-2xl">
                {isEs
                  ? 'Estatutos oficiales de peritaje metrológico, régimen de propiedad intelectual y custodia acorazada.'
                  : 'Official statutes of metrological certification, intellectual property governance, and insured custody.'}
              </p>
            </div>

            <div className="font-mono text-[10px] tracking-wider uppercase opacity-60 shrink-0">
              {isEs ? 'REGISTRO MERCANTIL VIGENTE · EJERCICIO 2026' : 'ACTIVE COMMERCIAL REGISTRY · 2026'}
            </div>
          </div>

          {/* ── CLEAN DOSSIER INDEX NAVIGATION STRIP ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-5 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3.5 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-150 cursor-pointer shrink-0 border flex items-center gap-2 ${
                    isActive
                      ? isLight 
                        ? 'bg-[#14170F] text-white border-[#14170F]' 
                        : 'bg-[#16A34A] text-black border-[#16A34A] font-bold'
                      : isLight 
                        ? 'bg-transparent text-neutral-600 border-transparent hover:border-[#DDD5C7] hover:bg-black/5' 
                        : 'bg-transparent text-neutral-400 border-transparent hover:border-white/10 hover:bg-white/5'
                  }`}
                >
                  <span className="opacity-60 text-[10px]">{tab.num}</span>
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. LEGAL CHARTER DOCUMENT ── */}
        <div className={`max-w-4xl mx-auto p-6 sm:p-10 border transition-colors ${
          isLight 
            ? 'bg-[#FAF8F3] border-[#DDD5C7]' 
            : 'bg-[#121914] border-white/10'
        }`}>
            {/* Document Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#15803D] dark:text-[#48C765]">
                  {currentData.category}
                </span>
                <span className="opacity-40 font-mono text-[10px]">·</span>
                <span className="font-mono text-[10px] opacity-60 tracking-wider">
                  {currentData.code}
                </span>
              </div>

              <h2 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl lg:text-4xl font-[900] uppercase tracking-normal leading-tight ${
                isLight ? 'text-[#14170F]' : 'text-white'
              }`}>
                {currentData.title}
              </h2>

              <p className={`font-sans text-xs sm:text-sm leading-relaxed pt-1 ${
                isLight ? 'text-neutral-700' : 'text-neutral-300'
              }`}>
                {currentData.desc}
              </p>
            </div>

            {/* Document Key Technical Parameters Strip (Non-redundant) */}
            {currentData.metrics.length > 0 && (
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 my-6 border-y ${
                isLight ? 'border-[#DDD5C7]' : 'border-white/10'
              }`}>
                {currentData.metrics.map((m, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="font-mono text-[9px] uppercase tracking-wider opacity-60 font-semibold mb-0.5">
                      {m.label}
                    </span>
                    <span className={`font-mono text-xs font-bold ${
                      isLight ? 'text-[#14170F]' : 'text-white'
                    }`}>
                      {m.val}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Continuous Enforceable Articles (§ 01 - § 04) */}
            {currentData.articles.length > 0 && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-current/15">
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#15803D] dark:text-[#48C765]">
                    {isEs ? 'CLÁUSULAS Y ESTATUTOS VINCULANTES' : 'BINDING ARTICLES & STATUTES'}
                  </span>
                  <span className="font-mono text-[9px] opacity-50 tracking-widest uppercase">
                    {isEs ? 'VIGENCIA 2026' : 'ENFORCEABLE 2026'}
                  </span>
                </div>

                <div className="divide-y divide-current/10">
                  {currentData.articles.map((art) => (
                    <div key={art.num} className="py-5 first:pt-2 last:pb-0 space-y-2">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#15803D] dark:text-[#48C765] shrink-0">
                          § {art.num}
                        </span>
                        <h3 className={`font-['Nunito',sans-serif] text-base sm:text-lg font-[900] uppercase tracking-normal ${
                          isLight ? 'text-[#14170F]' : 'text-white'
                        }`}>
                          {art.title}
                        </h3>
                      </div>
                      <p className={`font-sans text-xs sm:text-sm leading-relaxed pl-6 sm:pl-7 ${
                        isLight ? 'text-neutral-700' : 'text-neutral-300'
                      }`}>
                        {art.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
  );
};
