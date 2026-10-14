import React from 'react';
import { useConcept } from '../../context/ConceptContext';
import { ShieldCheck, MapPin, Award, CheckCircle2, Lock, Cpu, Globe } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { concept } = useConcept();
  const isGallery = concept === 'gallery';

  return (
    <footer className={`pt-16 pb-24 border-t transition-colors duration-300 ${
      isGallery
        ? 'bg-stone-100 border-stone-200 text-stone-700'
        : 'bg-charcoal-950 border-slate-800 text-slate-400'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Pillars Banner */}
        <div className={`p-6 rounded-none border mb-14 grid grid-cols-1 md:grid-cols-4 gap-6 ${
          isGallery
            ? 'bg-white border-stone-200 shadow-sm'
            : 'bg-charcoal-900/60 border-slate-800'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-none bg-gorilla-500/10 text-gorilla-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
                European Chain of Custody
              </h4>
              <p className="text-xs leading-relaxed opacity-80">
                100% EU insured handling. No customs delays or overseas transit vulnerability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-none bg-gorilla-500/10 text-gorilla-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
                Sub-Millimeter Optical Scan
              </h4>
              <p className="text-xs leading-relaxed opacity-80">
                Laser telemetry centering & microscopic darkfield edge/surface defect inspection.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-none bg-gorilla-500/10 text-gorilla-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
                Sonic Acrylic Slab
              </h4>
              <p className="text-xs leading-relaxed opacity-80">
                Hermetically welded UV-resistant casing with holographic anti-counterfeit seal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-none bg-gorilla-500/10 text-gorilla-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-semibold mb-1 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
                Show Drop-Off Hubs
              </h4>
              <p className="text-xs leading-relaxed opacity-80">
                Hand delivery & expedited pre-check in Madrid, Lisbon, Barcelona, Paris & Benelux.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={isGallery ? "/brand/logo-dark.png" : "/brand/logo-green.png"}
                alt="Gorilla Grading"
                className="h-8 w-auto"
              />
              <span className={`font-display font-bold text-lg ${isGallery ? 'text-stone-900' : 'text-white'}`}>
                GORILLA GRADING
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm mb-4 opacity-80">
              Gorilla Grading is the international precision standard for collectible card authentication, optical subgrading, and sonic encapsulation. Built for serious collectors and community card shows.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-gorilla-400">
              <span className="w-2 h-2 rounded-none bg-gorilla-400" />
              <span>EU Laboratories: Madrid (HQ) • Lisbon</span>
            </div>
          </div>

          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
              Grading Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/services')} className="hover:text-gorilla-400 transition-colors">Standard (10 Days)</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-gorilla-400 transition-colors">Premium (5 Days)</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-gorilla-400 transition-colors">Express (2 Days)</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-gorilla-400 transition-colors">Event (48h Pop-Up)</button></li>
              <li><button onClick={() => onNavigate('/services')} className="hover:text-gorilla-400 transition-colors">Re-Holder Service</button></li>
            </ul>
          </div>

          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
              Platform & Verification
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/verify')} className="hover:text-gorilla-400 transition-colors">Verify Certificate</button></li>
              <li><button onClick={() => onNavigate('/certificates/demo')} className="hover:text-gorilla-400 transition-colors">Sample Inspection Report</button></li>
              <li><button onClick={() => onNavigate('/track')} className="hover:text-gorilla-400 transition-colors">Live Order Tracking</button></li>
              <li><button onClick={() => onNavigate('/account')} className="hover:text-gorilla-400 transition-colors">Collector Vault</button></li>
              <li><button onClick={() => onNavigate('/how-it-works')} className="hover:text-gorilla-400 transition-colors">Grading Scale & Rubric</button></li>
            </ul>
          </div>

          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isGallery ? 'text-stone-900' : 'text-white'}`}>
              CEO & Concepts
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => onNavigate('/concepts')} className="hover:text-amber-400 text-amber-300 font-semibold transition-colors">★ Concept Comparison</button></li>
              <li><span className="opacity-75">Model 01: Precision Lab</span></li>
              <li><span className="opacity-75">Model 02: Collector Gallery</span></li>
              <li><span className="opacity-75">Model 03: Digital Jungle</span></li>
              <li><span className="opacity-75">Model 04: Hybrid Baseline</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-75">
          <div>
            &copy; {new Date().getFullYear()} Gorilla Grading International S.L. All rights reserved. Registered in Spain & Portugal.
          </div>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Submission</span>
            <span>Security Guarantee</span>
            <span className="font-mono text-gorilla-400">v1.0-prototype</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
