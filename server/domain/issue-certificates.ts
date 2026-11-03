import { and, desc, eq, inArray, isNotNull, isNull, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, cardIdentities, certificates, gradingResults, itemImages, orderItems, slabs } from '../../db/schema.js';
import { newCertificateNumber, slabSerialFor } from '../codes.js';
import { publicBaseUrl } from '../env.js';
import { ProblemError } from '../problem.js';
import type { Signer } from '../signing.js';
import type { ScanReport } from '../../shared/scan-report.js';

type Tx = Pick<Db, 'select' | 'insert' | 'update'>;

const MAX_NUMBER_ATTEMPTS = 25;

/** Lo que se emitió para cada carta, para el email de salida del pedido. */
export type IssuedCard =
  | { position: number; cardName: string | null; authentic: true; number: string; grade: number }
  | { position: number; cardName: string | null; authentic: false };

/** Registro que se firma. Cualquiera puede verificarlo con la clave pública, sin acceder a nada privado. */
export interface SignedRecord {
  v: 1;
  number: string;
  slab: string;
  issuedAt: string;
  card: { game: string; set: string; number: string; name: string; language: string; year: number | null };
  grade: {
    final: number;
    /** Solo en los certificados antiguos ("Mint 9"); ya no se pone etiqueta a la nota. */
    label?: string;
    subgrades: { centering: number; corners: number; edges: number; surface: number };
  };
  /** Versión del resultado de graduación del que sale. */
  resultVersion: number;
  /** Si la nota sale del escáner: sus criterios y la huella SHA-256 del PDF del informe. */
  scanner?: { criteria: string; pdfSha256: string };
}

/**
 * Emite el slab y el certificado firmado de cada carta auténtica de un pedido. Se llama dentro de la
 * transacción que aprueba la salida del pedido: si algo falla, el pedido no sale y no queda nada a medias.
 * Las cartas no auténticas no reciben certificado.
 */
export async function issueCertificates(
  tx: Tx,
  args: { orderId: string; orderCode: string; actorId: string; signer: Signer; now: Date },
): Promise<IssuedCard[]> {
  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, args.orderId));
  if (items.length === 0) return [];
  const itemIds = items.map((i) => i.id);

  const [results, existingSlabs, photos] = await Promise.all([
    tx
      .select()
      .from(gradingResults)
      .where(and(inArray(gradingResults.orderItemId, itemIds), ne(gradingResults.status, 'superseded'))),
    tx.select({ itemId: slabs.orderItemId }).from(slabs).where(inArray(slabs.orderItemId, itemIds)),
    tx
      .select()
      .from(itemImages)
      .where(and(inArray(itemImages.orderItemId, itemIds), isNotNull(itemImages.uploadedAt)))
      .orderBy(desc(itemImages.createdAt)),
  ]);

  const issued: IssuedCard[] = [];
  for (const item of items) {
    if (existingSlabs.some((s) => s.itemId === item.id)) continue;
    const result = results.find((r) => r.orderItemId === item.id);
    if (!result || result.status !== 'approved') {
      throw new ProblemError(409, 'Conflict', 'Falta el resultado aprobado de una carta.', { code: 'grading_incomplete' });
    }
    if (!result.isAuthentic) {
      issued.push({ position: item.position, cardName: item.cardName, authentic: false });
      continue;
    }
    if (
      result.finalGrade === null || result.centeringScore === null || result.cornersScore === null ||
      result.edgesScore === null || result.surfaceScore === null
    ) {
      throw new ProblemError(409, 'Conflict', 'El resultado de una carta está incompleto.', { code: 'grading_incomplete' });
    }

    // Sin saber qué carta es no hay certificado: el laboratorio la identifica al recibirla.
    if (!item.cardName || !item.game) {
      throw new ProblemError(409, 'Conflict', 'Hay una carta sin identificar.', { code: 'card_unidentified' });
    }

    // La carta canónica: se reutiliza si esa misma carta ya se graduó antes.
    const identity = {
      game: item.game,
      setName: item.setName ?? 'Unknown',
      cardNumber: item.cardNumber ?? 'N/A',
      name: item.cardName,
      language: item.language ?? 'Unspecified',
      year: item.year,
    };
    await tx.insert(cardIdentities).values(identity).onConflictDoNothing();
    const [card] = await tx
      .select()
      .from(cardIdentities)
      .where(
        and(
          eq(cardIdentities.game, identity.game),
          eq(cardIdentities.setName, identity.setName),
          eq(cardIdentities.cardNumber, identity.cardNumber),
          eq(cardIdentities.language, identity.language),
          eq(cardIdentities.name, identity.name),
        ),
      )
      .limit(1);

    // El número es el del informe del escáner; si la carta se graduó a mano, uno al azar (si choca, se prueba otro).
    // El slab lleva sus mismos dígitos.
    const fixed = result.certificateNumber;
    let number = '';
    let slab: { id: string; serial: string } | undefined;
    for (let attempt = 0; attempt < (fixed ? 1 : MAX_NUMBER_ATTEMPTS) && !slab; attempt++) {
      number = fixed ?? newCertificateNumber();
      const serial = slabSerialFor(number);
      [slab] = await tx
        .insert(slabs)
        .values({
          orderItemId: item.id,
          gradingResultId: result.id,
          serial,
          qrPayload: `${publicBaseUrl()}/certificates/${number}?via=qr`,
          encapsulatedAt: args.now,
        })
        .onConflictDoNothing({ target: slabs.serial })
        .returning({ id: slabs.id, serial: slabs.serial });
    }
    if (!slab && fixed) {
      throw new ProblemError(409, 'Conflict', `El número de certificado ${fixed} del informe del escáner ya está en uso.`, { code: 'certificate_number_taken' });
    }
    if (!slab) throw new Error('No se pudo generar un número de certificado libre');

    const scan = result.scanReport as ScanReport | null;
    const record: SignedRecord = {
      v: 1,
      number,
      slab: slab.serial,
      issuedAt: args.now.toISOString(),
      card: {
        game: card.game,
        set: card.setName,
        number: card.cardNumber,
        name: card.name,
        language: card.language,
        year: card.year,
      },
      grade: {
        final: result.finalGrade,
        subgrades: {
          centering: result.centeringScore,
          corners: result.cornersScore,
          edges: result.edgesScore,
          surface: result.surfaceScore,
        },
      },
      resultVersion: result.version,
      ...(scan && { scanner: { criteria: scan.criteria, pdfSha256: scan.pdf.sha256 } }),
    };

    // La foto de cada cara: el escaneo del informe (los daños están marcados sobre él) o, si no hay, la foto más
    // reciente del laboratorio. Se enlazan por su clave privada; se firman enlaces temporales al mostrarlas.
    const front = scan?.images.scan.front ? { storageKey: scan.images.scan.front } : photos.find((p) => p.orderItemId === item.id && p.kind === 'front');
    const back = scan?.images.scan.back ? { storageKey: scan.images.scan.back } : photos.find((p) => p.orderItemId === item.id && p.kind === 'back');

    await tx.insert(certificates).values({
      number,
      slabId: slab.id,
      gradingResultId: result.id,
      cardIdentityId: card.id,
      status: 'active',
      payload: { ...record, images: { frontKey: front?.storageKey ?? null, backKey: back?.storageKey ?? null } },
      signature: args.signer.sign(record),
      keyId: args.signer.keyId,
      issuedAt: args.now,
      issuedBy: args.actorId,
    });
    await tx.update(orderItems).set({ cardIdentityId: card.id }).where(eq(orderItems.id, item.id));
    await tx.insert(auditLogs).values({
      actorId: args.actorId,
      action: 'certificate.issued',
      entityType: 'certificate',
      entityId: number,
      after: { order: args.orderCode, slab: slab.serial, grade: result.finalGrade },
    });
    issued.push({ position: item.position, cardName: item.cardName, authentic: true, number, grade: result.finalGrade });
  }
  return issued.sort((a, b) => a.position - b.position);
}

/**
 * Firma los certificados que se quedaron sin firma (por ejemplo, tras convertir su número a otro
 * formato: el número forma parte del registro firmado). Lo llama la tarea diaria. Devuelve cuántos firmó.
 */
export async function signUnsignedCertificates(db: Db, signer: Signer): Promise<number> {
  const pending = await db
    .select({ id: certificates.id, payload: certificates.payload })
    .from(certificates)
    .where(isNull(certificates.signature));
  for (const cert of pending) {
    // El registro firmado es el payload sin las rutas privadas de las fotos, igual que al emitirlo.
    const { images: _images, ...record } = cert.payload as Record<string, unknown>;
    await db
      .update(certificates)
      .set({ signature: signer.sign(record), keyId: signer.keyId })
      .where(and(eq(certificates.id, cert.id), isNull(certificates.signature)));
  }
  return pending.length;
}
