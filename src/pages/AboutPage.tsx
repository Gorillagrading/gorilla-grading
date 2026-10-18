import React from 'react';
import { CompanyStorySection } from '../components/luxury/CompanyStorySection';
import { MissionBanner } from '../components/luxury/MissionBanner';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, ShieldCheck, Microscope, Award, Users } from 'lucide-react';

interface AboutPageProps {
  onNavigate?: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`about-page w-full min-h-screen flex flex-col selection:bg-[#48C765] selection:text-black transition-colors duration-300 ${
      isLight ? 'bg-[#ECE5D8] text-[#14170F]' : 'bg-[#454545] text-white'
    }`}>
      
      {/* Top Breadcrumb bar */}
      <div className="max-w-[1200px] w-full mx-auto px-6 lg:px-12 pt-10">
        <button 
          onClick={() => onNavigate && onNavigate('/#faq')}
          className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest transition-colors w-fit ${
            isLight ? 'text-[#4A5048] hover:text-[#14170F]' : 'text-[#A4ACA1] hover:text-white'
          }`}
        >
          <ArrowLeft size={14} />
          {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
        </button>
      </div>

      {/* 1. Main Story Section */}
      <CompanyStorySection />

      {/* 2. Deep Dive: Precision, Philosophy & Laboratory Ethics */}
      <section className={`w-full py-20 px-6 lg:px-12 border-y relative overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#E5DDCF] border-black/[0.08]' : 'bg-[#2B302B] border-white/[0.06]'
      }`}>
        <div className="max-w-[1200px] mx-auto relative z-10">
          
          <div className="flex flex-col mb-16 text-center items-center">
            <span className={`font-mono text-[10px] tracking-[0.25em] uppercase font-bold mb-3 ${
              isLight ? 'text-[#15803D]' : 'text-[#48C765]'
            }`}>
              {language === 'es' ? 'FILOSOFÍA & VALORES' : 'PHILOSOPHY & VALUES'}
            </span>
            <h2 className={`font-['Nunito',sans-serif] font-[900] text-3xl sm:text-5xl uppercase tracking-normal leading-tight mb-6 ${
              isLight ? 'text-[#14170F]' : 'text-white'
            }`}>
              {language === 'es' ? 'Nuestros Compromisos Fundamentales' : 'Our Fundamental Commitments'}
            </h2>
            <p className={`font-sans text-sm sm:text-base max-w-2xl text-center sm:text-justify leading-relaxed ${
              isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
            }`}>
              {language === 'es'
                ? 'En Gorilla Grading entendemos que cada carta representa una inversión, una memoria o una joya histórica de colección. No aplicamos atajos ni juicios subjetivos: cada veredicto está respaldado por trazabilidad matemática y los más altos estándares éticos del mercado.'
                : 'At Gorilla Grading, we understand that every card represents an investment, a cherished memory, or a historic jewel of collecting. We apply no shortcuts and no subjective bias: each verdict is supported by mathematical traceability and the highest ethical standards in the market.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Box 1 */}
            <div className={`p-8 flex flex-col gap-4 border transition-colors duration-300 ${
              isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#161B16] border-white/[0.05]'
            }`}>
              <div className="flex items-center gap-3">
                <Microscope size={24} className={`shrink-0 ${isLight ? 'text-[#15803D]' : 'text-[#48C765]'}`} strokeWidth={1.75} />
                <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Precisión Nanométrica Imparcial' : 'Impartial Nanometric Precision'}
                </h3>
              </div>
              <p className={`font-sans text-xs sm:text-sm leading-relaxed text-justify ${
                isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es'
                  ? 'Eliminamos la fatiga del ojo humano mediante sistemas de visión computacional y fotogrametría de ultra-alta definición. Las dimensiones, el centrado exacto y la textura microscópica se calculan con tolerancias inferiores a 0.01 mm, garantizando que una carta calificada hoy reciba exactamente la misma nota si se evaluase dentro de diez años.'
                  : 'We eliminate human grader fatigue through advanced computer vision and ultra-high-definition photogrammetry. Centering ratios, physical dimensions, and microscopic surface textures are computed with tolerances under 0.01 mm, guaranteeing consistent grading repeatability.'}
              </p>
            </div>

            {/* Box 2 */}
            <div className={`p-8 flex flex-col gap-4 border transition-colors duration-300 ${
              isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#161B16] border-white/[0.05]'
            }`}>
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className={`shrink-0 ${isLight ? 'text-[#15803D]' : 'text-[#48C765]'}`} strokeWidth={1.75} />
                <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Cadena de Custodia Inviolable' : 'Tamper-Evident Chain of Custody'}
                </h3>
              </div>
              <p className={`font-sans text-xs sm:text-sm leading-relaxed text-justify ${
                isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es'
                  ? 'Desde que un paquete cruza el umbral de nuestras instalaciones acorazadas, se somete a un registro continuo mediante circuito cerrado con doble verificación de precinto. La encapsulación final mediante soldadura sónica de policarbonato con filtro UV asegura protección química, física y atmosférica de por vida.'
                  : 'From the moment a parcel enters our vault perimeter, it is tracked via continuous CCTV and dual-operator intake scanning. Final ultrasonic ballistic polycarbonate encapsulation seals the card permanently against atmospheric degradation and UV light.'}
              </p>
            </div>

            {/* Box 3 */}
            <div className={`p-8 flex flex-col gap-4 border transition-colors duration-300 ${
              isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#161B16] border-white/[0.05]'
            }`}>
              <div className="flex items-center gap-3">
                <Award size={24} className={`shrink-0 ${isLight ? 'text-[#15803D]' : 'text-[#48C765]'}`} strokeWidth={1.75} />
                <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Transparencia de Datos en Blockchain' : 'Verifiable Public Cert Registry'}
                </h3>
              </div>
              <p className={`font-sans text-xs sm:text-sm leading-relaxed text-justify ${
                isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es'
                  ? 'Cada certificación incluye un código QR único grabado en láser sobre placa metálica que da acceso instantáneo al informe completo de inspección: imágenes microscópicas en 12.000 DPI, desglose de subnotas y hash criptográfico de autenticidad accesible para cualquier comprador futuro en el mercado secundario.'
                  : 'Each certified holder features an engraved QR code linking directly to our public database: 12,000 DPI microscopic imagery, four-point sub-grade breakdowns, and cryptographic verification hashes readily accessible to any collector or marketplace buyer worldwide.'}
              </p>
            </div>

            {/* Box 4 */}
            <div className={`p-8 flex flex-col gap-4 border transition-colors duration-300 ${
              isLight ? 'bg-[#F2ECE1] border-black/[0.08] shadow-sm' : 'bg-[#161B16] border-white/[0.05]'
            }`}>
              <div className="flex items-center gap-3">
                <Users size={24} className={`shrink-0 ${isLight ? 'text-[#15803D]' : 'text-[#48C765]'}`} strokeWidth={1.75} />
                <h3 className={`font-['Nunito',sans-serif] text-xl uppercase font-[900] tracking-normal ${
                  isLight ? 'text-[#14170F]' : 'text-white'
                }`}>
                  {language === 'es' ? 'Construido por Coleccionistas Reales' : 'Built by Passionate Collectors'}
                </h3>
              </div>
              <p className={`font-sans text-xs sm:text-sm leading-relaxed text-justify ${
                isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
              }`}>
                {language === 'es'
                  ? 'Nuestra sede y laboratorio nacen de la comunidad. No tratamos las cartas como meros activos financieros sin contexto: conocemos la historia de cada expansión, cada holo bleed y cada detalle de impresión, respetando el patrimonio cultural de los juegos de cartas coleccionables.'
                  : 'Our headquarters and laboratories were founded by collectors, for collectors. We do not view cards merely as speculative tokens: we know the history of print runs, foil patterns, and rarity nuances, honoring the cultural legacy of trading card games.'}
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Mission Banner */}
      <MissionBanner onNavigate={onNavigate} />

      {/* 4. Quick Links Navigation */}
      <section className={`w-full py-16 px-6 lg:px-12 border-t transition-colors duration-300 ${
        isLight ? 'bg-[#ECE5D8] border-black/[0.08]' : 'bg-[#454545] border-white/[0.04]'
      }`}>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className={`font-sans text-xs text-justify max-w-lg ${
            isLight ? 'text-[#4A5048]' : 'text-[#A4ACA1]'
          }`}>
            {language === 'es'
              ? '¿Tienes dudas sobre cómo enviar tus cartas o necesitas hablar con nuestro equipo técnico? Explora nuestro centro de preguntas frecuentes o escríbenos directamente.'
              : 'Have questions about submitting or want to consult our technical team? Explore our FAQ hub or reach out via our contact form.'}
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => onNavigate && onNavigate('/faq')}
              className={`px-6 py-3 font-mono text-xs uppercase tracking-widest border transition-all ${
                isLight 
                  ? 'bg-[#F2ECE1] hover:bg-[#EAE2D5] text-[#14170F] border-black/[0.12] shadow-sm' 
                  : 'bg-[#161B16] hover:bg-white/10 text-white border-white/15'
              }`}
            >
              {language === 'es' ? 'Preguntas Frecuentes' : 'FAQ Hub'}
            </button>
            <button
              onClick={() => onNavigate && onNavigate('/contact')}
              className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all ${
                isLight 
                  ? 'bg-[#15803D] hover:bg-[#166534] text-white shadow-md' 
                  : 'bg-[#48C765] hover:bg-[#3A9F50] text-[#14170F] shadow-[0_0_15px_rgba(72,199,101,0.2)]'
              }`}
            >
              {language === 'es' ? 'Formulario de Contacto' : 'Contact Us'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
