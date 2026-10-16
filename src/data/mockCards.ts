import { GradedCard } from '../types';

export const MOCK_GRADED_CARDS: GradedCard[] = [
  {
    id: 'gg-cert-001',
    certNumber: 'GGI-892401',
    name: 'Charizard — Holo 1st Edition',
    set: 'Base Set (Shadowless)',
    year: 1999,
    cardNumber: '4/102',
    rarity: 'Rare Holo',
    game: 'Pokemon',
    language: 'English',
    grade: 9.5,
    gradeLabel: 'Gem Mint 10',
    subgrades: {
      centering: {
        score: 9.5,
        frontRatio: '51/49 L/R, 50/50 T/B',
        backRatio: '52/48 L/R, 51/49 T/B',
        description: 'Optical laser measurement shows sub-millimeter precision alignment exceeding 99th percentile for Base Set.'
      },
      corners: {
        score: 9.5,
        frontScore: 9.5,
        backScore: 9.5,
        description: 'Microscopic radius inspection reveals microscopic fiber fray on top-right rear corner (<0.04mm).'
      },
      edges: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Pristine foil cut with zero silvering or edge whitening under polarized 40x darkfield illumination.'
      },
      surface: {
        score: 9.5,
        frontScore: 9.5,
        backScore: 9.5,
        description: 'High-gloss holographic finish preserved. One single faint hairline scratch detectable only under 45° specular reflection.'
      }
    },
    frontImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    backImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    defects: [
      {
        id: 'd1',
        category: 'Centering',
        title: 'Front Left/Right 51/49 Deviation',
        description: 'Slight 0.08mm shift towards right border, within Gem-Mint tolerances.',
        severity: 'minor',
        x: 48,
        y: 12,
        deduction: 0.1
      },
      {
        id: 'd2',
        category: 'Corners',
        title: 'Micro Corner Whitening (Top-Right)',
        description: 'Minor optical fiber exposure on rear top right corner under 40x magnification.',
        severity: 'minor',
        x: 88,
        y: 8,
        deduction: 0.2
      },
      {
        id: 'd3',
        category: 'Surface',
        title: 'Specular Micro-Hairline',
        description: '1.2mm hairline across holo foil layer; unnoticeable in ambient diffuse lighting.',
        severity: 'minor',
        x: 62,
        y: 42,
        deduction: 0.2
      }
    ],
    population: {
      totalGraded: 142,
      higherCount: 3,
      equalCount: 18
    },
    certDate: '2026-08-14',
    verifier: 'Gorilla Lab Madrid (Station #04 - Optical Tech ID: M-802)',
    securityHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    declaredValueEur: 14500,
    isAuthentic: true
  },
  {
    id: 'gg-cert-002',
    certNumber: 'GGI-774102',
    name: 'Pikachu Illustrator — Trophy Promo',
    set: 'CoroCoro Illustration Contest',
    year: 1998,
    cardNumber: 'Promo',
    rarity: 'Ultra Rare Trophy',
    game: 'Pokemon',
    language: 'Japanese',
    grade: 10.0,
    gradeLabel: 'Pristine 10',
    subgrades: {
      centering: {
        score: 10.0,
        frontRatio: '50/50 L/R, 50/50 T/B',
        backRatio: '50/50 L/R, 50/50 T/B',
        description: 'Absolute geometric perfection across all 4 axes with zero measurable variance.'
      },
      corners: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Flawless 90-degree die cut, sharp crisp paper corners without compression.'
      },
      edges: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Complete absence of edge wear, micro-burrs or printing residue.'
      },
      surface: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Museum grade gloss. Holographic foil and double-star insignia entirely intact.'
      }
    },
    frontImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    backImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    defects: [],
    population: {
      totalGraded: 4,
      higherCount: 0,
      equalCount: 1
    },
    certDate: '2026-09-02',
    verifier: 'Gorilla European Master Lab (Senior Inspector ID: G-001)',
    securityHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    declaredValueEur: 450000,
    isAuthentic: true
  },
  {
    id: 'gg-cert-003',
    certNumber: 'GGI-901552',
    name: 'Black Lotus — Alpha Edition',
    set: 'Limited Edition Alpha',
    year: 1993,
    cardNumber: 'Rare Artifact',
    rarity: 'Rare',
    game: 'Magic: The Gathering',
    language: 'English',
    grade: 8.5,
    gradeLabel: 'Near Mint-Mint 8.5',
    subgrades: {
      centering: {
        score: 9.0,
        frontRatio: '54/46 L/R, 52/48 T/B',
        backRatio: '53/47 L/R, 50/50 T/B',
        description: 'Distinctive Alpha round corner geometry. Minor horizontal bias.'
      },
      corners: {
        score: 8.5,
        frontScore: 8.5,
        backScore: 8.5,
        description: 'Alpha characteristic heavy curvature with minor natural corner aging.'
      },
      edges: {
        score: 8.5,
        frontScore: 8.5,
        backScore: 8.5,
        description: 'Occasional micro-chipping typical of 1993 Jesper Myrfors black border print run.'
      },
      surface: {
        score: 9.0,
        frontScore: 9.0,
        backScore: 9.0,
        description: 'Clean matte finish without clouding, watermarks or ink fading.'
      }
    },
    frontImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    backImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    defects: [
      {
        id: 'd4',
        category: 'Edges',
        title: 'Alpha Left Border Micro-Fleck',
        description: '0.3mm print ink vacancy along left black perimeter.',
        severity: 'minor',
        x: 14,
        y: 55,
        deduction: 0.5
      },
      {
        id: 'd5',
        category: 'Corners',
        title: 'Bottom-Left Corner Wear',
        description: 'Light fiber softening consistent with early 1990s card handling.',
        severity: 'minor',
        x: 12,
        y: 91,
        deduction: 0.5
      }
    ],
    population: {
      totalGraded: 28,
      higherCount: 6,
      equalCount: 4
    },
    certDate: '2026-07-28',
    verifier: 'Gorilla Lab Madrid (Station #02 - Vintage Specialist ID: V-104)',
    securityHash: '2c624232cdd221771294dfbb310aca000a0df6ec9b5feb9bb7dd73cc11049f1f',
    declaredValueEur: 85000,
    isAuthentic: true
  },
  {
    id: 'gg-cert-004',
    certNumber: 'GGI-632918',
    name: 'Shanks — Manga Alternate Art Secret Rare',
    set: 'Romance Dawn (OP-01)',
    year: 2022,
    cardNumber: 'OP01-120 SEC',
    rarity: 'Secret Rare Manga',
    game: 'One Piece',
    language: 'Japanese',
    grade: 10.0,
    gradeLabel: 'Gem Mint 10',
    subgrades: {
      centering: {
        score: 10.0,
        frontRatio: '50/50 L/R, 50/50 T/B',
        backRatio: '50/50 L/R, 50/50 T/B',
        description: 'Precision Japanese print centering with zero deviation.'
      },
      corners: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Ultra-crisp razor die-cut corners with zero fiber delamination.'
      },
      edges: {
        score: 9.5,
        frontScore: 10.0,
        backScore: 9.5,
        description: 'Near flawless perimeter with microscopic texture boundary on lower edge.'
      },
      surface: {
        score: 10.0,
        frontScore: 10.0,
        backScore: 10.0,
        description: 'Deep textured foil stamping and background manga screentones pristine.'
      }
    },
    frontImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    backImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?auto=format&fit=crop&w=800&q=85',
    defects: [],
    population: {
      totalGraded: 64,
      higherCount: 0,
      equalCount: 22
    },
    certDate: '2026-08-30',
    verifier: 'Gorilla Lab Lisbon (Station #01 - Modern Specialist ID: L-042)',
    securityHash: '19e7dd562e84d9f697ee58d927d2c38d4f4fcbe1a8080f33d7b8782cf2fcb9d7',
    declaredValueEur: 1850,
    isAuthentic: true
  }
];

export const MOCK_POPULAR_SEARCHES = [
  'GGI-892401',
  'GGI-774102',
  'GGI-901552',
  'GGI-632918'
];
