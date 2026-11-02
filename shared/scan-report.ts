/**
 * Resultado del escáner de la carta: las medidas y los recortes que acompañan a la nota en el informe de gradeo.
 * Todo es opcional: el informe solo muestra lo que el escáner o el laboratorio han registrado, y lo que no se midió
 * no se dibuja. Solo tipos: el servidor y el frontend los comparten.
 */

export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

/** Distancia (mm) entre el borde de la carta y el recuadro de la imagen, por cada lado. */
export interface MarginsMm {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface ScanCornerDto {
  position: CornerPosition;
  /** Recorte ampliado de la esquina (enlace de lectura). */
  image: string | null;
  /** Radio de la esquina en mm. */
  radiusMm: number | null;
  /** Desgaste o "mordisco" de la esquina en micras. */
  biteUm: number | null;
  /** Notas parciales de 1 a 10: lo medido y el estado. */
  measureScore: number | null;
  conditionScore: number | null;
  /** Nota de la esquina. */
  score: number;
}

export interface ScanReportDto {
  /** Resolución del escaneo, en puntos por pulgada. */
  dpi: number | null;
  widthMm: number | null;
  heightMm: number | null;
  /** Versión de los criterios con los que se calificó, por ejemplo "3.20". */
  criteriaVersion: string | null;
  scannedAt: string | null;
  /** Cara que se escaneó: si solo se hizo una, el informe lo indica. */
  sides: 'front' | 'both';
  margins: { front: MarginsMm | null; back: MarginsMm | null };
  corners: ScanCornerDto[];
  /** Texto libre del laboratorio. */
  notes: string | null;
}
