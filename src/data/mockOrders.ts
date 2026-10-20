import { Order } from '../types';

export const MOCK_ORDERS: Order[] = [
  {
    id: 'GGI-ORD-7K4M9Q',
    trackingNumber: 'ES-GLS-9928174620',
    carrier: 'GLS Express EU Insured',
    createdAt: '2026-09-18',
    status: 'OPTICAL_GRADING',
    totalPriceEur: 126.00,
    shippingMethod: 'COURIER_INSURED',
    shippingAddress: {
      fullName: 'Carlos Mendes',
      country: 'Spain',
      city: 'Madrid',
      postalCode: '28001',
      line1: 'Calle Gran Vía 42, 4º B'
    },
    items: [
      {
        id: 'item-1',
        cardName: 'Charizard Holo 1st Edition',
        game: 'Pokemon',
        set: 'Base Set',
        declaredValue: 8500,
        serviceTierId: 'express',
        frontImagePreview: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'item-2',
        cardName: 'Gengar VMAX Alternate Art',
        game: 'Pokemon',
        set: 'Fusion Strike',
        declaredValue: 380,
        serviceTierId: 'express',
        frontImagePreview: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'item-3',
        cardName: 'Mewtwo & Mew GX Secret Rare',
        game: 'Pokemon',
        set: 'Unified Minds',
        declaredValue: 220,
        serviceTierId: 'express',
        frontImagePreview: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80'
      }
    ],
    steps: [
      {
        status: 'SUBMITTED',
        label: 'Submission Initialized',
        description: 'Electronic submission declared online. Shipping barcode generated.',
        timestamp: '18 Sep 2026, 10:24 CET',
        completed: true,
        current: false
      },
      {
        status: 'PACKAGE_RECEIVED',
        label: 'Safe Vault Reception',
        description: 'Package received at Madrid Grading Facility. Tamper seal verified in climate-controlled vault.',
        timestamp: '19 Sep 2026, 14:10 CET',
        completed: true,
        current: false
      },
      {
        status: 'PRE_INSPECTION',
        label: 'Optical Pre-Inspection',
        description: 'Spectroscopic card identification and surface dust eradication via ionized nitrogen airflow.',
        timestamp: '20 Sep 2026, 09:30 CET',
        completed: true,
        current: false
      },
      {
        status: 'OPTICAL_GRADING',
        label: 'Laser Subgrading Active',
        description: 'Micro-caliper centering calculation, corner geometry mapping, edge inspection and defect logging in progress.',
        timestamp: '22 Sep 2026, 11:45 CET',
        completed: false,
        current: true
      },
      {
        status: 'ENCAPSULATION',
        label: 'Sonic Encapsulation',
        description: 'Ultrasonic hermetic slab sealing with holographic serial foil and cryptographic NFC embedding.',
        completed: false,
        current: false
      },
      {
        status: 'QUALITY_ASSURANCE',
        label: 'Master Grader Sign-Off',
        description: 'Final human QA sign-off and digital certificate synchronization.',
        completed: false,
        current: false
      },
      {
        status: 'SHIPPED',
        label: 'Insured Return Dispatch',
        description: 'Secured in armored courier packaging and dispatched with signature required.',
        completed: false,
        current: false
      }
    ],
    estimatedCompletion: '25 Sep 2026'
  },
  {
    id: 'GGI-ORD-3FX8RB',
    trackingNumber: 'PT-CTT-441029410',
    carrier: 'CTT Express Portugal',
    createdAt: '2026-09-08',
    status: 'DELIVERED',
    totalPriceEur: 59.97,
    shippingMethod: 'CARD_SHOW_DROPOFF',
    items: [
      {
        id: 'item-4',
        cardName: 'Monkey D. Luffy Gear 5 Manga',
        game: 'One Piece',
        set: 'Awakening of the New Era',
        declaredValue: 2400,
        serviceTierId: 'standard',
        frontImagePreview: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80'
      }
    ],
    steps: [
      {
        status: 'SUBMITTED',
        label: 'Card Show Intake',
        description: 'Handed directly to Gorilla staff at Iberia Card Show (Lisbon Expo).',
        timestamp: '08 Sep 2026, 16:30 WEST',
        completed: true,
        current: false
      },
      {
        status: 'PACKAGE_RECEIVED',
        label: 'Vault Transfer',
        description: 'Direct courier transfer from show floor to Iberian Grading Lab.',
        timestamp: '09 Sep 2026, 10:00 WEST',
        completed: true,
        current: false
      },
      {
        status: 'PRE_INSPECTION',
        label: 'Inspection Complete',
        description: 'Surface authenticated, no artificial alterations detected.',
        timestamp: '11 Sep 2026, 11:20 WEST',
        completed: true,
        current: false
      },
      {
        status: 'OPTICAL_GRADING',
        label: 'Graded (Pristine 10)',
        description: 'Flawless optical scores across all 4 subgrade quadrants.',
        timestamp: '13 Sep 2026, 15:40 WEST',
        completed: true,
        current: false
      },
      {
        status: 'ENCAPSULATION',
        label: 'Sonic Encapsulated',
        description: 'Slab serial #GGI-SLB-774102 generated.',
        timestamp: '14 Sep 2026, 12:00 WEST',
        completed: true,
        current: false
      },
      {
        status: 'QUALITY_ASSURANCE',
        label: 'QA Approved',
        description: 'Holographic registry verified.',
        timestamp: '14 Sep 2026, 17:30 WEST',
        completed: true,
        current: false
      },
      {
        status: 'DELIVERED',
        label: 'Delivered to Customer',
        description: 'Signed and delivered at Partner Hobby Store (Lisbon).',
        timestamp: '16 Sep 2026, 14:15 WEST',
        completed: true,
        current: false
      }
    ],
    estimatedCompletion: 'Completed (16 Sep 2026)'
  }
];
