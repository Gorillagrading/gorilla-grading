import type {
  CornerPosition,
  DamageArea,
  DamageSize,
  ScanCentering,
  ScanCorner,
  ScanDamage,
  ScanFace,
  ScanReport,
  ScanSide,
  ScanSubgrade,
} from '../../shared/scan-report.js';
import type { PdfContents, PdfRect, TextItem } from './read-pdf.js';

/** El informe no se ha podido leer entero o no cuadra. Lleva la lista de lo que falla, para el técnico. */
export class ScanReportError extends Error {
  constructor(readonly problems: string[]) {
    super(problems.join(' '));
  }
}

export type ParsedScanReport = Omit<ScanReport, 'images' | 'pdf'>;

/** Los JPEG del informe: el escaneo de cada cara y los recortes de sus esquinas. */
export interface ScanImages {
  scan: Partial<Record<ScanSide, Uint8Array>>;
  corners: Partial<Record<ScanSide, Partial<Record<CornerPosition, Uint8Array>>>>;
}

const CORNER_NAMES: Record<string, CornerPosition> = {
  'superior izquierda': 'topLeft',
  'superior derecha': 'topRight',
  'inferior izquierda': 'bottomLeft',
  'inferior derecha': 'bottomRight',
};
const AREA_NAMES: Record<string, DamageArea> = { bordes: 'edges', superficie: 'surface', esquinas: 'corners' };
const SIZE_NAMES: Record<string, DamageSize> = {
  pequeño: 'small', pequeña: 'small', mediano: 'medium', mediana: 'medium', grande: 'large',
};

/** "2,47 mm" → 2.47; "24 µm" → 24. Null si no hay número. */
const toNumber = (s: string): number | null => {
  const m = s.replace(/\s/g, '').match(/-?\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(',', '.')) : null;
};
const isInteger = (s: string) => /^\d+$/.test(s);
const norm = (s: string) => s.trim().toLowerCase();
/** Orden de lectura: página y, dentro de ella, de arriba abajo. */
const at = (i: { page: number; y: number }) => (i.page - 1) * 100_000 + i.y;
const near = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;
const round1 = (n: number) => Math.round(n * 10) / 10;
const clampPct = (n: number) => Math.min(100, Math.max(0, round1(n)));

/**
 * Interpreta el informe de gradeo del escáner a partir del texto y las imágenes del PDF.
 * Está hecho para el formato del programa del escáner (criterios 3.x): si algo no aparece o no cuadra,
 * no se adivina: se lanza ScanReportError con la lista de problemas.
 */
export function parseScanReport(pdf: PdfContents): { report: ParsedScanReport; images: ScanImages } {
  const problems: string[] = [];
  const text = [...pdf.text].sort((a, b) => at(a) - at(b) || a.x - b.x);

  // --- Pie: número de certificado, fecha y criterios -------------------------------------------
  const footerItem = text.find((i) => /^Certificado\s+[\d\s]+·\s*notas emitidas/i.test(i.str));
  const footer = footerItem?.str.match(
    /^Certificado\s+([\d\s]+?)\s*·\s*notas emitidas el\s+(\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2})?)\s+con los criterios\s+(\d+(?:\.\d+)*)\.?\s*(.*)$/i,
  );
  if (!footer) problems.push('No se encuentra el pie del informe con el número de certificado, la fecha y los criterios.');
  const certificateNumber = footer ? footer[1].replace(/\s/g, '') : '';
  if (footer && !/^\d{8,9}$/.test(certificateNumber)) problems.push(`El número de certificado "${footer[1]}" no tiene 8 o 9 cifras.`);
  if (footer && /provisional/i.test(footer[4])) problems.push('El informe dice que las notas son provisionales. Importa el informe definitivo.');
  // El número grande de la cabecera tiene que ser el mismo.
  const headerNumber = text.find((i) => i.page === 1 && i.size >= 12 && /^\d[\d\s]{6,}\d$/.test(i.str));
  if (headerNumber && footer && headerNumber.str.replace(/\s/g, '') !== certificateNumber) {
    problems.push(`El número de la cabecera (${headerNumber.str}) no coincide con el del pie (${footer[1]}).`);
  }

  // --- Carta y escaneo --------------------------------------------------------------------------
  const infoLine = text.find((i) => /\d+\s*ppp\b/i.test(i.str));
  const nameItem = text.find(
    (i) => i.page === 1 && i.size >= 13 && i !== headerNumber && !/^\d/.test(i.str) && (!infoLine || i.y < infoLine.y) && i.y > (headerNumber?.y ?? 0),
  );
  const gameItem = nameItem && infoLine
    ? text.find((i) => i.page === 1 && i.y > nameItem.y + 2 && i.y < infoLine.y - 2 && near(i.x, nameItem.x, 3))
    : undefined;
  const info = infoLine?.str ?? '';
  const ppi = toNumber(info.match(/(\d+)\s*ppp/i)?.[1] ?? '');
  const dims = info.match(/([\d,.]+)\s*[×x]\s*([\d,.]+)\s*mm/i);
  const cardName = nameItem && !/^carta sin nombre$/i.test(nameItem.str) ? nameItem.str : null;

  // --- Resumen: nota final y subnotas ------------------------------------------------------------
  const faceHeaders = text.filter((i) => i.size >= 10 && /^(Anverso|Reverso)$/i.test(i.str));
  const summaryEnd = faceHeaders.length ? at(faceHeaders[0]) : Infinity;
  const inSummary = text.filter((i) => at(i) < summaryEnd);

  const finalLabel = inSummary.find((i) => /^Nota final$/i.test(i.str));
  /** La cifra grande a la derecha de una etiqueta del resumen. */
  const scoreRightOf = (label: TextItem) =>
    inSummary
      .filter((i) => i.page === label.page && isInteger(i.str) && i.x > label.x + 100 && i.y > label.y - 12 && i.y < label.y + 16)
      .sort((a, b) => b.size - a.size)[0];
  const finalItem = finalLabel ? scoreRightOf(finalLabel) : undefined;
  if (!finalItem) problems.push('No se encuentra la nota final.');
  const averageItem = inSummary.find((i) => /^media\s+[\d,.]+$/i.test(i.str));
  const final = finalItem ? Number(finalItem.str) : NaN;
  const average = averageItem ? toNumber(averageItem.str)! : NaN;

  const subgrade = (label: string): ScanSubgrade | null => {
    const item = inSummary.find(
      (i) => i.str === label && i.size >= 7 && i.size <= 10 && (!finalLabel || at(i) > at(finalLabel)),
    );
    const score = item && scoreRightOf(item);
    if (!item || !score) {
      problems.push(`No se encuentra la subnota de ${label.toLowerCase()}.`);
      return null;
    }
    const note = inSummary.find((i) => i.page === item.page && near(i.x, item.x, 1.5) && i.y > item.y + 3 && i.y < item.y + 14 && i.size < item.size);
    return { score: Number(score.str), note: note?.str ?? null };
  };
  const centering = subgrade('Centrado');
  const corners = subgrade('Esquinas');
  const edges = subgrade('Bordes');
  const surface = subgrade('Superficie');

  // --- Caras -----------------------------------------------------------------------------------
  const faces: ScanFace[] = [];
  const images: ScanImages = { scan: {}, corners: {} };
  if (faceHeaders.length === 0) problems.push('No se encuentra el detalle de ninguna cara (Anverso o Reverso).');
  faceHeaders.forEach((header, index) => {
    const side: ScanSide = /^anverso$/i.test(header.str) ? 'front' : 'back';
    const end = index + 1 < faceHeaders.length ? at(faceHeaders[index + 1]) : at(footerItem ?? { page: Infinity, y: 0 });
    // Lo que va en la misma línea que el título de la cara puede quedar un poco más arriba.
    const section = text.filter((i) => at(i) >= at(header) - 3 && at(i) < end);
    const face = parseFace(side, header, section, pdf, problems);
    faces.push(face.face);
    if (face.cornerImages) images.corners[side] = face.cornerImages;
  });
  if (faceHeaders.length && !faces.some((f) => f.side === 'front')) problems.push('Falta el detalle del anverso.');

  // El escaneo de cada cara, con su rótulo debajo ("Anverso", "Reverso").
  const portraits = pdf.images.filter((img) => img.pixelHeight > img.pixelWidth * 1.2);
  portraits.forEach((img, index) => {
    const caption = text.find(
      (i) => i.page === img.page && i.x >= img.x - 5 && i.x <= img.x + img.width && i.y > img.y + img.height && i.y < img.y + img.height + 20,
    );
    const side: ScanSide = caption && /^reverso$/i.test(caption.str) ? 'back' : caption && /^anverso$/i.test(caption.str) ? 'front' : index === 0 ? 'front' : 'back';
    images.scan[side] ??= img.jpeg;
  });

  // --- Método -----------------------------------------------------------------------------------
  const method = methodParagraph(text, faces.length ? at(faceHeaders[faceHeaders.length - 1]) : 0, footerItem);

  // --- Comprobaciones --------------------------------------------------------------------------
  const scores = [centering, corners, edges, surface];
  for (const n of [final, ...scores.map((s) => s?.score ?? 1)]) {
    if (!Number.isInteger(n) || n < 1 || n > 10) problems.push(`La nota "${n}" no es un número entero del 1 al 10.`);
  }
  if (scores.every(Boolean) && Number.isFinite(final)) {
    const values = scores.map((s) => s!.score);
    const mean = values.reduce((a, b) => a + b, 0) / 4;
    if (Number.isFinite(average) && Math.abs(mean - average) > 0.005) {
      problems.push(`La media del informe (${average}) no coincide con la de las subnotas (${mean}).`);
    }
    if (final > Math.min(...values) + 2 || final > Math.floor(mean + 0.5)) {
      problems.push(`La nota final ${final} no cuadra con las subnotas ${values.join(', ')}.`);
    }
  }
  // "4 defectos." debajo de bordes y superficie: tiene que haber esos mismos daños en la lista.
  for (const [area, sub] of [['edges', edges], ['surface', surface]] as const) {
    const expected = sub?.note?.match(/^(\d+)\s+defectos?\.?$/i)?.[1] ?? (sub?.note && /^sin defectos\.?$/i.test(sub.note) ? '0' : null);
    const found = faces.reduce((n, f) => n + f.damages.filter((d) => d.area === area).length, 0);
    if (expected !== null && Number(expected) !== found) {
      problems.push(`El resumen dice ${expected} defectos de ${area === 'edges' ? 'bordes' : 'superficie'} y en la lista hay ${found}.`);
    }
  }

  if (problems.length) throw new ScanReportError(problems);

  const report: ParsedScanReport = {
    v: 1,
    certificateNumber,
    criteria: footer![3],
    gradedAt: footer![2],
    card: { name: cardName, game: gameItem?.str ?? null },
    ppi,
    widthMm: dims ? toNumber(dims[1]) : null,
    heightMm: dims ? toNumber(dims[2]) : null,
    sides: /solo anverso/i.test(info) ? 'front' : faces.some((f) => f.side === 'back') ? 'both' : 'front',
    final,
    average: Number.isFinite(average) ? average : scores.reduce((a, s) => a + s!.score, 0) / 4,
    subgrades: { centering: centering!, corners: corners!, edges: edges!, surface: surface! },
    faces,
    method,
  };
  return { report, images };
}

function parseFace(
  side: ScanSide,
  header: TextItem,
  section: TextItem[],
  pdf: PdfContents,
  problems: string[],
): { face: ScanFace; cornerImages?: Partial<Record<CornerPosition, Uint8Array>> } {
  const sideName = side === 'front' ? 'anverso' : 'reverso';
  const headerLine = section.filter((i) => i.page === header.page && near(i.y, header.y, 2)).map((i) => i.str).join(' ');
  const cornersScore = toNumber(headerLine.match(/Esquinas\s+(\d+)/i)?.[1] ?? '');

  const damagesTitle = section.find((i) => i.str === 'DAÑOS');
  const centeringTitle = section.find((i) => i.str === 'CENTRADO');
  const cornersTitle = section.find((i) => i.str === 'ESQUINAS');
  const sectionEnd = section.length ? at(section[section.length - 1]) + 1 : 0;
  const between = (from: TextItem | undefined, to: TextItem | undefined) =>
    from ? section.filter((i) => at(i) > at(from) && at(i) < (to ? at(to) : sectionEnd)) : [];

  // --- Daños -------------------------------------------------------------------------------------
  const damages = damagesTitle
    ? parseDamages(between(damagesTitle, centeringTitle ?? cornersTitle), pdf.rects, sideName, problems)
    : [];

  // --- Centrado ----------------------------------------------------------------------------------
  let centering: ScanCentering | null = null;
  if (centeringTitle) {
    const zone = between(centeringTitle, cornersTitle);
    const columns = tableColumns(zone, ['Izquierda', 'Derecha', 'Izq./dcha.', 'Arriba', 'Abajo', 'Arriba / abajo', 'Nota']);
    const row = columns && zone.filter((i) => i.y > columns.y + 5 && i.y < columns.y + 25);
    const cell = (name: string) => row?.find((i) => near(i.x, columns!.x[name], 20))?.str;
    const values = { left: cell('Izquierda'), right: cell('Derecha'), top: cell('Arriba'), bottom: cell('Abajo'), score: cell('Nota') };
    if (!columns || Object.values(values).some((v) => v === undefined || toNumber(v) === null)) {
      problems.push(`No se puede leer la tabla de centrado del ${sideName}.`);
    } else {
      centering = {
        leftMm: toNumber(values.left!)!,
        rightMm: toNumber(values.right!)!,
        topMm: toNumber(values.top!)!,
        bottomMm: toNumber(values.bottom!)!,
        horizontal: cell('Izq./dcha.') ?? '',
        vertical: cell('Arriba / abajo') ?? '',
        score: toNumber(values.score!)!,
      };
    }
  } else if (side === 'front') {
    problems.push('Falta la tabla de centrado del anverso.');
  }

  // --- Esquinas ----------------------------------------------------------------------------------
  const corners: ScanCorner[] = [];
  let cornerImages: Partial<Record<CornerPosition, Uint8Array>> | undefined;
  if (cornersTitle) {
    const zone = between(cornersTitle, undefined);
    const columns = tableColumns(zone, ['Esquina', 'Radio', 'Mordisco', 'Medida', 'Estado', 'Nota']);
    if (!columns) {
      problems.push(`No se puede leer la tabla de esquinas del ${sideName}.`);
    } else {
      for (const rowLabel of zone.filter((i) => i.y > columns.y + 3 && CORNER_NAMES[norm(i.str)] && near(i.x, columns.x.Esquina, 4))) {
        const row = zone.filter((i) => i.page === rowLabel.page && near(i.y, rowLabel.y, 2) && i !== rowLabel);
        const cell = (name: string) => row.find((i) => near(i.x, columns.x[name], 20))?.str ?? '';
        const score = toNumber(cell('Nota'));
        if (score === null) {
          problems.push(`Falta la nota de la esquina ${norm(rowLabel.str)} del ${sideName}.`);
          continue;
        }
        const bite = cell('Mordisco');
        corners.push({
          position: CORNER_NAMES[norm(rowLabel.str)],
          radiusMm: toNumber(cell('Radio')),
          biteUm: /quitado/i.test(bite) ? null : toNumber(bite),
          biteRemoved: /quitado/i.test(bite),
          measure: toNumber(cell('Medida')),
          condition: toNumber(cell('Estado')),
          score,
        });
      }
      if (corners.length !== 4) problems.push(`La tabla de esquinas del ${sideName} no tiene las cuatro esquinas.`);

      // Los recortes de las esquinas: imágenes cuadradas de esta parte del informe, con su rótulo debajo.
      const squares = pdf.images
        .filter((img) => near(img.pixelWidth, img.pixelHeight, img.pixelWidth * 0.1))
        .filter((img) => at(img) > at(cornersTitle) && at(img) < at(columns))
        .sort((a, b) => a.x - b.x);
      if (squares.length) {
        cornerImages = {};
        const fallback: CornerPosition[] = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        squares.forEach((img, index) => {
          const caption = zone.find((i) => i.page === img.page && i.x >= img.x - 4 && i.x <= img.x + img.width && i.y > img.y + img.height && i.y < img.y + img.height + 15 && CORNER_NAMES[norm(i.str)]);
          const position = caption ? CORNER_NAMES[norm(caption.str)] : fallback[index];
          if (position) cornerImages![position] ??= img.jpeg;
        });
      }
    }
  } else if (side === 'front') {
    problems.push('Falta la tabla de esquinas del anverso.');
  }

  return { face: { side, centering, cornersScore, corners, damages }, cornerImages };
}

/** Posición horizontal de cada columna de una tabla, a partir de su fila de títulos. */
function tableColumns(zone: TextItem[], names: string[]): { page: number; y: number; x: Record<string, number> } | null {
  const first = zone.find((i) => i.str === names[0]);
  if (!first) return null;
  const headers = zone.filter((i) => i.page === first.page && near(i.y, first.y, 2));
  const x: Record<string, number> = {};
  for (const name of names) {
    const found = headers.find((i) => i.str === name);
    if (!found) return null;
    x[name] = found.x;
  }
  return { page: first.page, y: first.y, x };
}

/**
 * La lista de daños de una cara y su dibujo: a la izquierda, la carta con cada daño numerado en su sitio;
 * a la derecha, la lista en una o varias columnas, agrupada por bordes, superficie o esquinas.
 */
function parseDamages(zone: TextItem[], rects: PdfRect[], sideName: string, problems: string[]): ScanDamage[] {
  const headings = zone.filter((i) => AREA_NAMES[norm(i.str)]);
  if (headings.length === 0) return [];
  const legendLeft = Math.min(...headings.map((h) => h.x));
  const markers = zone.filter((i) => isInteger(i.str) && i.x + i.width < legendLeft - 1);
  const bullets = zone.filter((i) => isInteger(i.str) && i.x >= legendLeft - 4);

  // Columnas de la lista: se agrupan por su posición horizontal.
  const starts = [...headings, ...bullets].map((i) => i.x).sort((a, b) => a - b);
  const columnStarts = starts.filter((x, i) => i === 0 || x - starts[i - 1] > 20);
  const columnOf = (i: TextItem) => columnStarts.reduce((best, x, k) => (Math.abs(i.x - x) < Math.abs(i.x - columnStarts[best]) ? k : best), 0);

  const entries: Omit<ScanDamage, 'x' | 'y'>[] = [];
  let area: DamageArea | null = null;
  columnStarts.forEach((_, column) => {
    const items = [...headings, ...bullets].filter((i) => columnOf(i) === column).sort((a, b) => at(a) - at(b));
    for (const item of items) {
      if (!isInteger(item.str)) {
        area = AREA_NAMES[norm(item.str)];
        continue;
      }
      const description = zone.find((i) => i.page === item.page && !isInteger(i.str) && i.x > item.x + 4 && i.x < item.x + 60 && near(i.y, item.y, 2));
      if (!description || !area) {
        problems.push(`No se puede leer el daño ${item.str} del ${sideName}.`);
        continue;
      }
      const detail = zone.find(
        (i) => i.page === item.page && near(i.x, description.x, 1.5) && i.y > description.y + 3 && i.y < description.y + 12 && i.size < description.size,
      );
      const comma = description.str.lastIndexOf(',');
      const sizeWord = comma > 0 ? norm(description.str.slice(comma + 1)) : '';
      const size = SIZE_NAMES[sizeWord] ?? null;
      const parts = detail ? detail.str.split('·').map((p) => p.trim()).filter(Boolean) : [];
      const length = parts.find((p) => /^[\d,.]+\s*mm$/i.test(p));
      entries.push({
        n: Number(item.str),
        area,
        kind: size ? description.str.slice(0, comma).trim() : description.str,
        size,
        location: parts.filter((p) => p !== length).join(' · ') || null,
        lengthMm: length ? toNumber(length) : null,
      });
    }
  });

  // El dibujo: el recuadro de la carta que contiene los números, y cada número en su sitio.
  const centers = markers.map((m) => ({ n: Number(m.str), page: m.page, x: m.x + m.width / 2, y: m.y - m.size * 0.35 }));
  const box = rects
    .filter((r) => centers.length > 0 && r.page === centers[0].page && r.width / r.height > 0.55 && r.width / r.height < 0.85)
    .filter((r) => centers.filter((c) => c.x >= r.x - 6 && c.x <= r.x + r.width + 6 && c.y >= r.y - 6 && c.y <= r.y + r.height + 6).length >= centers.length / 2)
    .sort((a, b) => a.width * a.height - b.width * b.height)[0];
  if (!box && entries.length) problems.push(`No se encuentra el dibujo de la carta con los daños del ${sideName}.`);

  const damages: ScanDamage[] = [];
  for (const entry of entries) {
    const marker = centers.find((c) => c.n === entry.n);
    if (!marker) {
      problems.push(`El daño ${entry.n} del ${sideName} no está marcado en el dibujo.`);
      continue;
    }
    damages.push({
      ...entry,
      x: box ? clampPct(((marker.x - box.x) / box.width) * 100) : 50,
      y: box ? clampPct(((marker.y - box.y) / box.height) * 100) : 50,
    });
  }
  const listed = new Set(entries.map((e) => e.n));
  for (const c of centers) if (!listed.has(c.n)) problems.push(`El daño ${c.n} del ${sideName} está en el dibujo pero no en la lista.`);
  return damages.sort((a, b) => a.n - b.n);
}

/** El párrafo que explica el cálculo: el texto pequeño seguido que va justo encima del pie. */
function methodParagraph(text: TextItem[], after: number, footer: TextItem | undefined): string | null {
  if (!footer) return null;
  const lines = text.filter((i) => at(i) > after && at(i) < at(footer) && i.page === footer.page);
  // Se empieza por abajo: las líneas pegadas al pie, con el mismo tamaño y el mismo margen izquierdo.
  const last = [...lines].reverse().find((i) => i.size < footer.size);
  if (!last) return null;
  const paragraph: TextItem[] = [];
  for (const line of [...lines].reverse()) {
    if (!near(line.x, last.x, 2) || !near(line.size, last.size, 0.2)) {
      if (paragraph.length) break;
      continue;
    }
    if (paragraph.length && paragraph[0].y - line.y > line.size * 2.2) break;
    paragraph.unshift(line);
  }
  return paragraph.map((l) => l.str).join(' ').replace(/\s+/g, ' ').trim() || null;
}
