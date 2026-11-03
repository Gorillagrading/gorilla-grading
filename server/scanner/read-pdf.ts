import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import { getDocumentProxy } from 'unpdf';

/** Un trozo de texto del PDF. Coordenadas en puntos, con `y` medida desde arriba de la pÃ¡gina (la lÃ­nea base). */
export interface TextItem {
  page: number;
  x: number;
  y: number;
  width: number;
  size: number;
  str: string;
}

/** Una imagen JPEG incrustada y dÃ³nde estÃ¡ dibujada (desde arriba de la pÃ¡gina). */
export interface PdfImage {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  jpeg: Uint8Array;
}

export interface PdfRect {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfContents {
  pageHeights: number[];
  text: TextItem[];
  images: PdfImage[];
  rects: PdfRect[];
}

const num = String.raw`(-?[\d.]+)`;
const DRAW_IMAGE = new RegExp(String.raw`${num}\s+${num}\s+${num}\s+${num}\s+${num}\s+${num}\s+cm\s*\/([^\s/]+)\s+Do`, 'g');
const RECT = new RegExp(String.raw`${num}\s+${num}\s+${num}\s+${num}\s+re\b`, 'g');

/**
 * Lee del PDF el texto con su posiciÃ³n, las imÃ¡genes JPEG con su posiciÃ³n y los rectÃ¡ngulos dibujados.
 * El texto lo saca pdf.js; las imÃ¡genes y los rectÃ¡ngulos, el contenido de cada pÃ¡gina (pdf-lib), para
 * guardar los JPEG tal cual, sin volver a comprimirlos.
 */
export async function readPdf(bytes: Uint8Array): Promise<PdfContents> {
  const proxy = await getDocumentProxy(new Uint8Array(bytes));
  const text: TextItem[] = [];
  const pageHeights: number[] = [];
  for (let p = 1; p <= proxy.numPages; p++) {
    const page = await proxy.getPage(p);
    const height = page.getViewport({ scale: 1 }).height;
    pageHeights.push(height);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [a, b, , , x, y] = item.transform as number[];
      text.push({ page: p, x, y: height - y, width: item.width, size: Math.hypot(a, b), str: item.str.trim() });
    }
  }
  await proxy.cleanup?.();

  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const images: PdfImage[] = [];
  const rects: PdfRect[] = [];
  doc.getPages().forEach((page, index) => {
    const height = page.getHeight();
    const stream = pageContent(doc, page.node.get(PDFName.of('Contents')));
    const xobjects = page.node.Resources()?.lookupMaybe(PDFName.of('XObject'), PDFDict);

    for (const m of stream.matchAll(DRAW_IMAGE)) {
      const [a, , , d, e, f] = m.slice(1, 7).map(Number);
      const ref = xobjects?.get(PDFName.of(m[7]));
      const object = ref ? doc.context.lookup(ref) : undefined;
      if (!(object instanceof PDFRawStream)) continue;
      // Solo JPEG (DCTDecode): se guardan los bytes tal cual. Otro formato se ignora.
      if (object.dict.get(PDFName.of('Filter'))?.toString() !== '/DCTDecode') continue;
      images.push({
        page: index + 1,
        x: e,
        y: height - f - d,
        width: a,
        height: d,
        pixelWidth: Number(object.dict.get(PDFName.of('Width'))?.toString() ?? 0),
        pixelHeight: Number(object.dict.get(PDFName.of('Height'))?.toString() ?? 0),
        jpeg: object.contents,
      });
    }
    for (const m of stream.matchAll(RECT)) {
      const [x, y, w, h] = m.slice(1, 5).map(Number);
      // Los rectÃ¡ngulos pueden dibujarse hacia arriba o hacia abajo (alto negativo).
      const top = h < 0 ? y : y + h;
      rects.push({ page: index + 1, x: w < 0 ? x + w : x, y: height - top, width: Math.abs(w), height: Math.abs(h) });
    }
  });

  return { pageHeights, text, images, rects };
}

function pageContent(doc: PDFDocument, contents: unknown): string {
  if (!contents) return '';
  const object = doc.context.lookup(contents as never);
  const streams = object instanceof PDFArray ? object.asArray().map((ref) => doc.context.lookup(ref)) : [object];
  return streams
    .filter((s): s is PDFRawStream => s instanceof PDFRawStream)
    .map((s) => Buffer.from(decodePDFRawStream(s).decode()).toString('latin1'))
    .join('\n');
}
