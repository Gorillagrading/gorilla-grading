import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';

interface BrandEcosystemRibbonProps {
  isHeroEmbedded?: boolean;
}

export const BrandEcosystemRibbon: React.FC<BrandEcosystemRibbonProps> = ({ isHeroEmbedded = false }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const brands = [
    { 
      id: 'gundam', 
      name: 'Gundam', 
      component: (
        <img 
          src={isLight ? "/images/logos/Gundam_black.png" : "/images/logos/Gundam.png"} 
          alt="Gundam" 
          className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain opacity-90 hover:opacity-100 transition-opacity" 
        />
      )
    },
    { 
      id: 'cyberpunk', 
      name: 'Cyberpunk TCG', 
      component: <img src="/images/logos/cyberpunk.png" alt="Cyberpunk" className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'finalfantasy', 
      name: 'Final Fantasy', 
      component: (
        <img 
          src="/images/logos/finalFantasy.png" 
          alt="Final Fantasy" 
          className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain opacity-90 hover:opacity-100 transition-opacity" 
        />
      ) 
    },
    { 
      id: 'force', 
      name: 'Force of Will', 
      component: <img src="/images/logos/force.png" alt="Force of Will" className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'vanguard', 
      name: 'Cardfight!! Vanguard', 
      component: <img src="/images/logos/vanguar.png" alt="Cardfight!! Vanguard" className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'riftbound', 
      name: 'Riftbound League of Legends', 
      component: <img src="/images/logos/fbf7fc57-3966-4943-afbe-16d3b649b314.png" alt="Riftbound" className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'pokemon', 
      name: 'Pokémon', 
      component: <img src="/images/logos/pokemon.png" alt="Pokémon" className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'magic', 
      name: 'Magic: The Gathering', 
      component: (
        <img 
          src={isLight ? "/images/logos/magic_black_text.png" : "/images/logos/magic-logo.webp"} 
          alt="Magic: The Gathering" 
          className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain opacity-95 hover:opacity-100 transition-opacity" 
        />
      )
    },
    { 
      id: 'onepiece', 
      name: 'One Piece', 
      component: (
        <img 
          src={isLight ? "/images/logos/onepiece.png" : "/images/logos/onepiece_white.png"} 
          alt="One Piece" 
          className="h-7 sm:h-8 md:h-9 max-w-[135px] sm:max-w-[155px] object-contain opacity-90 hover:opacity-100 transition-opacity" 
        />
      ) 
    },
    { 
      id: 'lorcana', 
      name: 'Lorcana', 
      component: (
        <img 
          src="/images/logos/lorcana.png" 
          alt="Lorcana" 
          className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain opacity-95 hover:opacity-100 transition-opacity" 
        />
      ) 
    },
    { 
      id: 'yugioh', 
      name: 'Yu-Gi-Oh!', 
      component: <img src="/images/logos/You-Gi-OH.png" alt="Yu-Gi-Oh!" className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'panini', 
      name: 'Panini', 
      component: (
        <div className="h-8 sm:h-9 md:h-10 w-28 sm:w-32 md:w-36 overflow-hidden flex items-center justify-center shrink-0">
          <img 
            src="/images/logos/panini.png" 
            alt="Panini" 
            className="h-[145px] sm:h-[165px] md:h-[185px] max-w-none object-contain pointer-events-none" 
          />
        </div>
      )
    },
    { 
      id: 'dragonball', 
      name: 'Dragon Ball', 
      component: (
        <img 
          src={isLight ? "/images/logos/DragonBall.png" : "/images/logos/DragonBall_white.png"} 
          alt="Dragon Ball" 
          className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain opacity-95 hover:opacity-100 transition-opacity" 
        />
      ) 
    },
    { 
      id: 'digimon', 
      name: 'Digimon', 
      component: <img src="/images/logos/DigimonCard.png" alt="Digimon" className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
    { 
      id: 'fleshblood', 
      name: 'Flesh and Blood', 
      component: <img src="/images/logos/FleshBlood.png" alt="Flesh and Blood" className="h-8 sm:h-9 md:h-10 max-w-[135px] sm:max-w-[155px] object-contain" /> 
    },
  ];

  // Duplicate the array multiple times to create a seamless infinite scroll effect
  const marqueeBrands = [...brands, ...brands, ...brands, ...brands];

  return (
    <div 
      id="brands" 
      className={`w-full select-none overflow-hidden relative transition-colors duration-300 py-3 sm:py-3.5 lg:py-4 border-y ${
        isLight ? 'bg-[#F5F8F5] border-[#E2E8F0]' : 'bg-[#111712] border-white/[0.08]'
      }`}
    >
      <div className="flex flex-col gap-2 sm:gap-2.5">
        
        {/* Infinite Scrolling Marquee with Smooth Edge Fade */}
        <div 
          className="relative flex overflow-x-hidden pt-1 sm:pt-1.5 pointer-events-none select-none"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)'
          }}
        >
          <div className="animate-marquee transform-gpu will-change-transform whitespace-nowrap flex w-max items-center gap-11 sm:gap-14 md:gap-16 px-8 shrink-0 pointer-events-none" style={{ animationDuration: '220s' }}>
            {marqueeBrands.map((brand, idx) => (
              <div 
                key={`${brand.id}-${idx}`}
                className="h-8 sm:h-9 md:h-10 flex items-center justify-center opacity-90 hover:opacity-100 drop-shadow-xs shrink-0 pointer-events-none select-none transition-opacity"
              >
                {brand.component}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BrandEcosystemRibbon;
