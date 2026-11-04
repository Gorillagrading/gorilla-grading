import type { PublicScanReport } from '../../shared/scan-report';

export interface CardDefect {
  /** Número del daño en el informe del escáner (el mismo que en su dibujo). */
  n?: number;
  id: string;
  category: 'Centering' | 'Corners' | 'Edges' | 'Surface';
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'critical' | 'flawless';
  /** Cara en la que está el defecto. Los datos antiguos no la tienen: se toma el anverso. */
  side?: 'front' | 'back';
  x: number; // percentage coordinates 0-100 on card image
  y: number;
  deduction: number;
}

export interface Subgrades {
  centering: {
    score: number;
    frontRatio: string; // e.g. "52/48 L/R, 50/50 T/B"
    backRatio: string;
    description: string;
  };
  corners: {
    score: number;
    frontScore: number;
    backScore: number;
    description: string;
  };
  edges: {
    score: number;
    frontScore: number;
    backScore: number;
    description: string;
  };
  surface: {
    score: number;
    frontScore: number;
    backScore: number;
    description: string;
  };
}

export interface GradedCard {
  id: string;
  certNumber: string;
  name: string;
  set: string;
  year: number;
  cardNumber: string;
  rarity: string;
  game: 'Pokemon' | 'Magic: The Gathering' | 'Yu-Gi-Oh!' | 'One Piece' | 'Lorcana' | 'Sports';
  language: string;
  grade: number;
  /** Etiqueta de los certificados antiguos ("Mint+ 9.5"). Ya no se muestra. */
  gradeLabel: string;
  subgrades: Subgrades;
  frontImage: string;
  backImage: string;
  slabMockupImage?: string;
  defects: CardDefect[];
  population: {
    totalGraded: number;
    higherCount: number;
    equalCount: number;
  };
  certDate: string;
  verifier: string;
  securityHash: string;
  declaredValueEur: number;
  isAuthentic: boolean;
  /** Informe del escáner, si la nota sale de él. */
  scan?: PublicScanReport | null;
  /** Fotos de la carta ya encapsulada en su slab. */
  slabImages?: { front: string; back: string } | null;
}

/** Carta certificada tal como la ve el público: sin el valor declarado, que es del dueño. */
export type PublicGradedCard = Omit<GradedCard, 'declaredValueEur'>;

export interface ServiceTier {
  id: string;
  name: string;
  tagline: string;
  turnaroundDays: number;
  turnaroundLabel: string;
  priceEur: number;
  maxDeclaredValueEur: number;
  subgradesIncluded: boolean;
  highResScans: boolean;
  priorityQueue: boolean;
  recommendedFor: string;
  badge?: string;
}

export interface OrderItem {
  id: string;
  cardName: string;
  game: string;
  set: string;
  declaredValue: number;
  serviceTierId: string;
  year?: number;
  language?: string;
  notes?: string;
  frontImagePreview?: string;
}

export type OrderStatus = 
  | 'SUBMITTED'
  | 'PACKAGE_RECEIVED'
  | 'PRE_INSPECTION'
  | 'OPTICAL_GRADING'
  | 'ENCAPSULATION'
  | 'QUALITY_ASSURANCE'
  | 'SHIPPED'
  | 'DELIVERED';

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
  current: boolean;
}

export interface Order {
  id: string;
  trackingNumber: string;
  carrier: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  totalPriceEur: number;
  shippingMethod: 'COURIER_INSURED' | 'CARD_SHOW_DROPOFF' | 'VAULT_STORE';
  shippingAddress?: {
    fullName: string;
    country: string;
    city: string;
    postalCode: string;
    line1: string;
  };
  steps: TrackingStep[];
  estimatedCompletion: string;
}
