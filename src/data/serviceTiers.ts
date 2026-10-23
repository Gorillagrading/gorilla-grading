import { ServiceTier } from '../types';

/**
 * Servicios y precios que muestra la web. Son datos reales de la empresa y deben coincidir con la tabla
 * service_tiers de la base de datos (que es la que manda al calcular y cobrar un pedido).
 */

export const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Remesas regulares, sets modernos y colecciones particulares.',
    turnaroundDays: 10,
    turnaroundLabel: '10 Business Days',
    priceEur: 19.00,
    maxDeclaredValueEur: 500,
    subgradesIncluded: false,
    highResScans: true,
    priorityQueue: false,
    recommendedFor: 'Base cards, personal binders & modern expansion sets',
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'El estándar de alta precisión con 4 subgrados métricos y registro público.',
    turnaroundDays: 5,
    turnaroundLabel: '5 Business Days',
    priceEur: 25.00,
    maxDeclaredValueEur: 1500,
    subgradesIncluded: true,
    highResScans: true,
    priorityQueue: false,
    recommendedFor: 'Modern Pokémon, One Piece, Magic & Lorcana sets',
    badge: 'Most Popular'
  },
  {
    id: 'express',
    name: 'Express',
    tagline: 'Velocidad de laboratorio en cola preferente para torneos y mercado.',
    turnaroundDays: 2,
    turnaroundLabel: '2 Business Days',
    priceEur: 50.00,
    maxDeclaredValueEur: 3000,
    subgradesIncluded: true,
    highResScans: true,
    priorityQueue: true,
    recommendedFor: 'High-value hits, tournament decks & fast market flipping',
    badge: 'Priority'
  },
  {
    id: 'event',
    name: 'Event',
    tagline: 'Solo entrega presencial en pop ups y ferias oficiales.',
    turnaroundDays: 2,
    turnaroundLabel: '48 Hours',
    priceEur: 15.00,
    maxDeclaredValueEur: 1000,
    subgradesIncluded: false,
    highResScans: true,
    priorityQueue: true,
    recommendedFor: 'Solo entrega presencial en pop ups oficiales de Gorilla Grading',
    badge: 'Pop-Up Exclusive'
  }
];

export const GRADING_SECURITY_FEATURES = [
  {
    title: 'Ultrasonic Hermetic Weld',
    description: 'Aircraft-grade UV-resistant acrylic fused under 35kHz ultrasonic sound waves for complete moisture and atmospheric isolation.',
    icon: 'ShieldCheck'
  },
  {
    title: 'Unique QR & Public Certificate',
    description: 'Each slab carries a unique QR code that links directly to its digitally signed certificate in the public registry.',
    icon: 'Cpu'
  },
  {
    title: 'Micro-Fiber Precision Sub-labels',
    description: 'Tamper-evident holographic foil header with metallic micro-text and dual-sided numeric subgrade breakdown.',
    icon: 'Layers'
  },
  {
    title: 'European Custody Tracking',
    description: 'Zero transatlantic customs risk. Fully insured transport within EU boundaries with continuous chain-of-custody logging.',
    icon: 'Truck'
  }
];
