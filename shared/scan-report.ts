/**
 * Informe del escáner de gradeo: lo que el laboratorio importa del PDF que genera el programa del escáner
 * y lo que el cliente ve en su certificado. Solo tipos; el lector del PDF está en server/scanner/.
 *
 * El escáner califica con números enteros del 1 al 10 y con sus propios criterios (versión en `criteria`):
 * la nota final es la media de las cuatro subnotas, a la nota más cercana, y nunca más de 2 puntos por
 * encima de la peor. La base de datos comprueba esa regla para los resultados que vienen del escáner.
 */

export type ScanSide = 'front' | 'back';
export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
export type DamageArea = 'corners' | 'edges' | 'surface';
export type DamageSize = 'small' | 'medium' | 'large';

export const CORNER_POSITIONS: readonly CornerPosition[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];

/** Ancho del marco impreso en cada lado de una cara, en mm, y cómo queda repartido. */
export interface ScanCentering {
  leftMm: number;
  rightMm: number;
  topMm: number;
  bottomMm: number;
  /** Reparto izquierda/derecha y arriba/abajo, tal como lo da el escáner ("50/50", "51/49"). */
  horizontal: string;
  vertical: string;
  score: number;
}

export interface ScanCorner {
  position: CornerPosition;
  /** Radio del arco que mejor encaja con el contorno, en mm. */
  radiusMm: number | null;
  /** Lo más hondo que se mete el contorno, en micras. Null si el escáner lo quitó por no ser de la esquina. */
  biteUm: number | null;
  biteRemoved: boolean;
  /** La forma frente a una esquina perfecta (1-10). */
  measure: number | null;
  /** 10 sin daños; cada daño resta según su tipo y tamaño (1-10). */
  condition: number | null;
  score: number;
}

export interface ScanDamage {
  /** Número con el que aparece en el dibujo y en la lista del informe. */
  n: number;
  area: DamageArea;
  /** Tipo de daño tal como lo escribe el escáner, por ejemplo "Filo comido". */
  kind: string;
  size: DamageSize | null;
  /** Dónde está, si el escáner lo dice ("borde de arriba"). */
  location: string | null;
  lengthMm: number | null;
  /** Posición en porcentaje (0-100) sobre la carta. */
  x: number;
  y: number;
}

export interface ScanFace {
  side: ScanSide;
  centering: ScanCentering | null;
  /** Nota de las esquinas de esta cara. */
  cornersScore: number | null;
  corners: ScanCorner[];
  damages: ScanDamage[];
}

export interface ScanSubgrade {
  score: number;
  /** Nota corta que pone el escáner debajo de la subnota ("Solo anverso.", "4 defectos."). */
  note: string | null;
}

/** Lo que se guarda del informe. Las claves de imagen son privadas: al cliente le llegan enlaces firmados. */
export interface ScanReport {
  v: 1;
  certificateNumber: string;
  /** Versión de los criterios del escáner, por ejemplo "3.20". */
  criteria: string;
  /** Fecha y hora en que el escáner emitió las notas, tal como la escribe ("02/11/2026 15:26"). */
  gradedAt: string;
  card: { name: string | null; game: string | null };
  ppi: number | null;
  widthMm: number | null;
  heightMm: number | null;
  sides: 'front' | 'both';
  final: number;
  /** Media exacta de las cuatro subnotas. */
  average: number;
  subgrades: { centering: ScanSubgrade; corners: ScanSubgrade; edges: ScanSubgrade; surface: ScanSubgrade };
  faces: ScanFace[];
  /** Explicación del cálculo que trae el informe, palabra por palabra. */
  method: string | null;
  images: {
    /** Escaneo de cada cara. */
    scan: Partial<Record<ScanSide, string>>;
    /** Recorte ampliado de cada esquina, por cara. */
    corners: Partial<Record<ScanSide, Partial<Record<CornerPosition, string>>>>;
  };
  pdf: { key: string; sha256: string; bytes: number };
}

/** El informe tal como lo ve el cliente: las imágenes ya son enlaces firmados y no hay rutas privadas. */
export type PublicScanReport = Omit<ScanReport, 'images' | 'pdf'> & {
  images: {
    scan: Partial<Record<ScanSide, string>>;
    corners: Partial<Record<ScanSide, Partial<Record<CornerPosition, string>>>>;
  };
};
