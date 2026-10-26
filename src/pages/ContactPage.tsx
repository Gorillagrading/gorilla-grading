import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Mail, Clock, ShieldCheck, HelpCircle, CheckCircle2, Send, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { ApiError, api } from '../api/client';

interface ContactPageProps {
  onNavigate: (path: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('shipping');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [submitError, setSubmitError] = useState('');
  // Campo trampa: invisible para las personas; los robots lo rellenan.
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const { ticket } = await api<{ ticket: string | null }>('/contact', {
        body: {
          name: fullName,
          email,
          subject,
          orderCode: orderNumber.trim() || undefined,
          message,
          locale: language === 'es' ? 'es' : 'en',
          website: website || undefined,
        },
      });
      setTicketId(ticket ?? '');
      setIsSubmitted(true);
    } catch (err) {
      const es = language === 'es';
      setSubmitError(
        err instanceof ApiError && err.status === 429
          ? (es ? 'Has enviado varios mensajes seguidos. Espera un rato y vuelve a intentarlo.' : 'You have sent several messages in a row. Please wait a while and try again.')
          : err instanceof ApiError && err.status === 422
            ? (es ? 'Revisa los datos: el correo debe ser válido y el mensaje no puede estar vacío.' : 'Please check your details: the email must be valid and the message cannot be empty.')
            : (es ? 'No hemos podido enviar tu mensaje. Inténtalo de nuevo en unos minutos.' : 'We could not send your message. Please try again in a few minutes.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setSubject('shipping');
    setOrderNumber('');
    setMessage('');
    setSubmitError('');
    setIsSubmitted(false);
  };

  return (
    <div className={`min-h-screen pt-24 pb-24 px-6 lg:px-12 selection:bg-[#48C765] selection:text-black relative overflow-hidden flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#454545] text-white'
    }`}>
      {/* Background glow effects */}
      <div className={`absolute top-1/4 right-0 w-[600px] h-[600px] blur-[150px] pointer-events-none rounded-full ${
        isLight ? 'bg-[#15803D]/[0.03]' : 'bg-[#48C765]/[0.02]'
      }`} />
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] blur-[120px] pointer-events-none rounded-full ${
        isLight ? 'bg-black/[0.02]' : 'bg-white/[0.01]'
      }`} />

      <div className="max-w-[1240px] w-full mx-auto relative z-10">
        
        {/* Navigation back */}
        <button 
          onClick={() => onNavigate('/#faq')}
          className={`mb-10 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors w-fit ${
            isLight ? 'text-[#4A5048] hover:text-[#14170F]' : 'text-[#A4ACA1] hover:text-white'
          }`}
        >
          <ArrowLeft size={14} />
          {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>

        {/* Section Header */}
        <div className="flex flex-col mb-16 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-8 h-[1px] ${isLight ? 'bg-[#15803D]' : 'bg-[#48C765]'}`}></span>
            <span className={`font-mono text-[10px] font-bold tracking-[0.25em] uppercase ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'CANAL DIRECTO & ATENCIÓN AL COLECCIONISTA' : 'DIRECT INQUIRY & COLLECTOR DESK'}
            </span>
          </div>

          <h1 className={`font-['Nunito',sans-serif] font-[900] text-4xl sm:text-5xl lg:text-6xl uppercase tracking-normal leading-[1.05] mb-6 ${
            isLight ? 'text-[#14170F]' : 'text-white'
          }`}>
            {language === 'es' ? 'Formulario de Contacto' : 'Contact & Inquiries'}
          </h1>

          <p className={`font-sans text-sm sm:text-base max-w-3xl leading-relaxed text-justify ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {language === 'es'
              ? 'Nuestro equipo técnico y de atención especializada está a tu total disposición para resolver consultas sobre envíos en tránsito, verificación de autenticidad, solicitudes corporativas o el estado de tus órdenes en laboratorio. Cada mensaje es asignado a un especialista dedicado con una respuesta garantizada en menos de 24 horas hábiles.'
              : 'Our technical and collector care team is entirely at your disposal to answer questions regarding in-transit shipments, authenticity verification, corporate B2B requests, or current laboratory orders. Every ticket is routed to a dedicated specialist with guaranteed response within 24 business hours.'}
          </p>
        </div>

        {/* Main Grid: Form + Side Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form (7 cols) */}
          <div className={`lg:col-span-7 border p-8 sm:p-10 relative overflow-hidden transition-colors duration-300 ${
            isLight 
              ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' 
              : 'bg-[#2B302B] border-white/[0.06] shadow-2xl'
          }`}>
            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl pointer-events-none ${
              isLight ? 'bg-[#15803D]/10' : 'bg-[#48C765]/5'
            }`} />

            {isSubmitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                  isLight 
                    ? 'bg-[#14170F] text-white shadow-sm' 
                    : 'bg-white/10 text-[#48C765] border border-white/20'
                }`}>
                  <CheckCircle2 size={32} />
                </div>

                <span className={`font-mono text-xs tracking-widest uppercase mb-2 ${
                  isLight ? 'text-[#15803D]' : 'text-[#48C765]'
                }`}>
                  {language === 'es' ? 'TICKET REGISTRADO' : 'TICKET REGISTERED'}
                </span>

                <h3 className={`font-['Nunito',sans-serif] text-2xl sm:text-3xl uppercase font-[900] tracking-normal mb-4 ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? '¡Mensaje Enviado con Éxito!' : 'Message Sent Successfully!'}
                </h3>

                <div className={`border px-4 py-2 mb-6 font-mono text-xs ${
                  isLight 
                    ? 'bg-black/5 border-black/10 text-[#4A5048]' 
                    : 'bg-black/20 border-white/10 text-[#A4ACA1]'
                }`}>
                  <span>{language === 'es' ? 'REFERENCIA: ' : 'REFERENCE ID: '}</span>
                  <strong className={isLight ? 'text-[#15803D]' : 'text-[#48C765]'}>{ticketId}</strong>
                </div>

                <p className={`font-sans text-sm max-w-md leading-relaxed text-center sm:text-justify mb-8 ${
                  isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                }`}>
                  {language === 'es'
                    ? 'Hemos recibido tu mensaje y te hemos enviado una confirmación por correo con tu número de ticket. Nuestro equipo te responderá a ese correo lo antes posible.'
                    : 'We have received your message and sent you a confirmation email with your ticket number. Our team will reply to that email as soon as possible.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={handleReset}
                    className={`px-6 py-3 font-mono text-xs uppercase tracking-widest border transition-all ${
                      isLight 
                        ? 'bg-black/5 hover:bg-black/10 text-[#14170F] border-black/15 shadow-sm' 
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
                    }`}
                  >
                    {language === 'es' ? 'Enviar Otra Consulta' : 'Submit Another Inquiry'}
                  </button>
                  <button
                    onClick={() => onNavigate('/#faq')}
                    className={`px-6 py-3 font-bold font-mono text-xs uppercase tracking-widest transition-all shadow-md ${
                      isLight 
                        ? 'bg-[#15803D] hover:bg-[#166534] text-white' 
                        : 'bg-[#48C765] hover:bg-[#3A9F50] text-[#14170F] shadow-[0_0_15px_rgba(72,199,101,0.2)]'
                    }`}
                  >
                    {language === 'es' ? 'Ir al Inicio' : 'Return to Home'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className={`flex items-center gap-2 pb-4 border-b ${
                  isLight ? 'border-black/[0.08]' : 'border-white/10'
                }`}>
                  <MessageSquare size={18} className={isLight ? 'text-[#15803D]' : 'text-[#48C765]'} />
                  <span className={`font-mono text-xs tracking-wider uppercase font-bold ${
                    isLight ? 'text-[#14170F]' : 'text-white'
                  }`}>
                    {language === 'es' ? 'Enviar una Consulta' : 'Submit an Inquiry'}
                  </span>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                      isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                    }`}>
                      {language === 'es' ? 'Nombre Completo *' : 'Full Name *'}
                    </label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={language === 'es' ? 'Ej. Alejandro Torres' : 'e.g. John Doe'}
                      className={`w-full px-4 py-3 text-sm focus:outline-none transition-colors border ${
                        isLight 
                          ? 'bg-[#EAE2D5] border-black/15 text-[#14170F] placeholder-black/40 focus:border-[#15803D]' 
                          : 'bg-[#161B16] border-white/10 focus:border-[#48C765]/60 text-white placeholder-white/30'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                      isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                    }`}>
                      {language === 'es' ? 'Correo Electrónico *' : 'Email Address *'}
                    </label>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className={`w-full px-4 py-3 text-sm focus:outline-none transition-colors border ${
                        isLight 
                          ? 'bg-[#EAE2D5] border-black/15 text-[#14170F] placeholder-black/40 focus:border-[#15803D]' 
                          : 'bg-[#161B16] border-white/10 focus:border-[#48C765]/60 text-white placeholder-white/30'
                      }`}
                    />
                  </div>
                </div>

                {/* Subject & Order ID Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                      isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                    }`}>
                      {language === 'es' ? 'Motivo de Consulta *' : 'Topic *'}
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={`w-full px-4 py-3 text-sm focus:outline-none transition-colors cursor-pointer border ${
                        isLight 
                          ? 'bg-[#EAE2D5] border-black/15 text-[#14170F] focus:border-[#15803D]' 
                          : 'bg-[#161B16] border-white/10 focus:border-[#48C765]/60 text-white'
                      }`}
                    >
                      <option value="shipping" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Envíos, Empaque & Seguimiento' : 'Shipping, Packing & Tracking'}
                      </option>
                      <option value="order" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Estado de Orden en Curso' : 'Existing Order Status'}
                      </option>
                      <option value="pricing" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Tarifas, Facturación & Lotes' : 'Pricing, Invoicing & Bulk Tiers'}
                      </option>
                      <option value="technical" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Tecnología Óptica & Criterios' : 'Optical Tech & Grading Scale'}
                      </option>
                      <option value="events" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Puntos de Entrega & Eventos' : 'Dropoff Points & Events'}
                      </option>
                      <option value="other" className={isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#161B16] text-white'}>
                        {language === 'es' ? 'Otra Consulta' : 'Other Inquiries'}
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                      isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                    }`}>
                      {language === 'es' ? 'Nº de Pedido (Opcional)' : 'Order / Submission ID (Optional)'}
                    </label>
                    <input 
                      type="text" 
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder={language === 'es' ? 'Ej. 284719365' : 'e.g. 284719365'}
                      className={`w-full px-4 py-3 text-sm focus:outline-none transition-colors border ${
                        isLight 
                          ? 'bg-[#EAE2D5] border-black/15 text-[#14170F] placeholder-black/40 focus:border-[#15803D]' 
                          : 'bg-[#161B16] border-white/10 focus:border-[#48C765]/60 text-white placeholder-white/30'
                      }`}
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="flex flex-col gap-2">
                  <label className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' ? 'Mensaje Detallado *' : 'Your Detailed Message *'}
                  </label>
                  <textarea 
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={language === 'es' 
                      ? 'Describe tu consulta con el mayor detalle posible para darte una respuesta precisa...' 
                      : 'Please describe your inquiry with as much detail as possible...'}
                    className={`w-full p-4 text-sm focus:outline-none transition-colors resize-y border ${
                      isLight 
                        ? 'bg-[#EAE2D5] border-black/15 text-[#14170F] placeholder-black/40 focus:border-[#15803D]' 
                        : 'bg-[#161B16] border-white/10 focus:border-[#48C765]/60 text-white placeholder-white/30'
                    }`}
                  />
                </div>

                {/* Campo trampa para robots: fuera de la vista y del teclado. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="absolute -left-[9999px] w-px h-px opacity-0"
                />

                {submitError && (
                  <p role="alert" className={`text-sm font-bold ${isLight ? 'text-red-700' : 'text-red-400'}`}>{submitError}</p>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 font-mono font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer shadow-md ${
                    isLight 
                      ? 'bg-[#15803D] hover:bg-[#166534] text-white shadow-[#15803D]/20' 
                      : 'bg-[#48C765] hover:bg-[#3A9F50] text-[#14170F] shadow-[0_0_20px_rgba(72,199,101,0.2)] hover:shadow-[0_0_30px_rgba(72,199,101,0.35)]'
                  }`}
                >
                  {isSubmitting ? (
                    <span>{language === 'es' ? 'Enviando Mensaje...' : 'Submitting Message...'}</span>
                  ) : (
                    <>
                      <span>{language === 'es' ? 'Enviar Formulario de Contacto' : 'Submit Contact Inquiry'}</span>
                      <Send size={14} />
                    </>
                  )}
                </button>

                <p className={`font-sans text-[11px] text-justify leading-relaxed ${
                  isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                }`}>
                  {language === 'es'
                    ? 'Al enviar este formulario aceptas el tratamiento de tus datos para responder a tu consulta conforme a nuestra Política de Privacidad. No compartimos tu información con terceros bajo ninguna circunstancia.'
                    : 'By submitting this form you consent to the processing of your data to respond to your inquiry according to our Privacy Policy. We do not share your information with third parties.'}
                </p>
              </form>
            )}
          </div>

          {/* Right Column: Direct Info & Quick FAQ link (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Direct Support Card */}
            <div className={`border p-8 flex flex-col gap-6 transition-colors duration-300 ${
              isLight 
                ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' 
                : 'bg-[#2B302B] border-white/[0.06]'
            }`}>
              <span className={`font-mono text-[10px] tracking-[0.2em] uppercase font-bold ${
                isLight ? 'text-[#15803D]' : 'text-[#48C765]'
              }`}>
                {language === 'es' ? 'CANALES OFICIALES' : 'OFFICIAL CHANNELS'}
              </span>

              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-none border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isLight 
                    ? 'bg-black/[0.04] border-black/[0.12] text-[#14170F]' 
                    : 'bg-white/[0.05] border-white/10 text-white'
                }`}>
                  <Mail size={18} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' ? 'Correo Electrónico Directo' : 'Direct Email Desk'}
                  </span>
                  <a href="mailto:info@gorillagrading.com" className={`font-sans text-sm font-bold transition-colors ${
                    isLight ? 'text-[#14170F] hover:text-[#15803D]' : 'text-white hover:text-[#48C765]'
                  }`}>
                    info@gorillagrading.com
                  </a>
                  <p className={`font-sans text-xs mt-1 text-justify leading-relaxed ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' 
                      ? 'Monitoreado por nuestro equipo de guardia. Ideal para envíos masivos o adjuntar documentación fotográfica de piezas de alto valor.' 
                      : 'Monitored by our on-duty team. Ideal for bulk submissions or attaching photographic documentation.'}
                  </p>
                </div>
              </div>

              <div className={`h-[1px] w-full ${isLight ? 'bg-black/[0.08]' : 'bg-white/10'}`} />

              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-none border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isLight 
                    ? 'bg-black/[0.04] border-black/[0.12] text-[#14170F]' 
                    : 'bg-white/[0.05] border-white/10 text-white'
                }`}>
                  <Clock size={18} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' ? 'Horario de Custodia & Atención' : 'Operating Desk Hours'}
                  </span>
                  <span className={`font-sans text-sm font-semibold ${
                    isLight ? 'text-[#14170F]' : 'text-white'
                  }`}>
                    {language === 'es' ? 'Lunes a Viernes · 09:00 - 18:00 CET' : 'Monday to Friday · 09:00 - 18:00 CET'}
                  </span>
                  <p className={`font-sans text-xs mt-1 text-justify leading-relaxed ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' 
                      ? 'Procesamiento continuo de admisión, escaneo espectrométrico e inspección óptica en cámara limpia durante días hábiles.' 
                      : 'Continuous intake, cleanroom spectrometric scan, and optical grading active on all business days.'}
                  </p>
                </div>
              </div>

              <div className={`h-[1px] w-full ${isLight ? 'bg-black/[0.08]' : 'bg-white/10'}`} />

              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-none border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  isLight 
                    ? 'bg-black/[0.04] border-black/[0.12] text-[#14170F]' 
                    : 'bg-white/[0.05] border-white/10 text-white'
                }`}>
                  <ShieldCheck size={18} strokeWidth={1.75} />
                </div>
                <div className="flex flex-col">
                  <span className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' ? 'Seguridad & Cadena de Custodia' : 'Security & Chain of Custody'}
                  </span>
                  <p className={`font-sans text-xs mt-1 text-justify leading-relaxed ${
                    isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
                  }`}>
                    {language === 'es' 
                      ? 'Todas las aperturas de paquetes se graban en circuito cerrado de alta definición (CCTV) con doble verificación de precinto para garantizar absoluta tranquilidad.' 
                      : 'All package unboxings are recorded in closed-circuit HD video (CCTV) with double seal verification to guarantee full peace of mind.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick FAQ Link Card */}
            <div className={`border p-8 flex flex-col gap-5 transition-colors duration-300 ${
              isLight 
                ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' 
                : 'bg-[#2B302B] border-white/[0.06]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-none border flex items-center justify-center shrink-0 ${
                  isLight ? 'bg-black/[0.04] border-black/[0.12] text-[#14170F]' : 'bg-white/[0.05] border-white/10 text-white'
                }`}>
                  <HelpCircle size={16} strokeWidth={2} />
                </div>
                <h3 className={`font-['Nunito',sans-serif] text-lg uppercase font-[900] tracking-normal ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? '¿Buscas Respuestas Inmediatas?' : 'Looking for Instant Answers?'}
                </h3>
              </div>

              <p className={`font-sans text-xs text-justify leading-relaxed ${
                isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es'
                  ? 'Hemos recopilado todas las dudas más frecuentes sobre empaque seguro, tiempos de entrega en laboratorio, eventos presenciales y pólizas de seguro en nuestro centro de ayuda interactivo.'
                  : 'We have compiled all frequently asked questions regarding secure packaging, turnaround schedules, in-person events, and insurance policies in our interactive help hub.'}
              </p>

              <button
                onClick={() => onNavigate('/faq')}
                className={`mt-2 py-3.5 px-6 font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between group cursor-pointer ${
                  isLight 
                    ? 'bg-black text-white hover:bg-neutral-800 shadow-sm' 
                    : 'bg-[#161B16] hover:bg-white/10 text-white border border-white/15'
                }`}
              >
                <span className="text-white font-bold">{language === 'es' ? 'Ver Todas las Preguntas (FAQ)' : 'Browse Full FAQ Hub'}</span>
                <span className="text-sm font-bold text-[#16A34A] dark:text-[#48C765] transition-transform group-hover:translate-x-1.5">→</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
