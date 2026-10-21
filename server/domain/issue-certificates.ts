import { and, desc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, cardIdentities, certificates, gradingResults, itemImages, orderItems, slabs } from '../../db/schema.js';
import { newCertificateNumber, slabSerialFor } from '../codes.js';
import { ProblemError } from '../problem.js';
import type { Signer } from '../signing.js';

type Tx = Pick<Db, 'select' | 'insert' | 'update'>;

const MAX_NUMBER_ATTEMPTS = 25;
const PUBLIC_BASE_URL = () => (process.env.PUBLIC_BASE_URL ?? 'https://gorillagrading.com').replace(/\/+$/, '');

/** Registro que se firma. Cualquiera puede verificarlo con la clave pública, sin acceder a nada privado. */
export interface SignedRecord {
  v: 1;
  number: string;
  slab: string;
  issuedAt: string;
  card: { game: string; set: string; number: string; name: string; language: string; year: number | null };
  grade: {
    final: number;
    label: string;
    subgrades: { centering: number; corners: number; edges: number; surface: number };
  };
  /** Versión del resultado de graduación del que sale. */
  resultVersion: number;
}

/**
 * Emite el slab y el certificado firmado de cada carta auténtica de un pedido. Se llama dentro de la
 * transacción que aprueba la salida del pedido: si algo falla, el pedido no sale y no queda nada a medias.
 * Las cartas no auténticas no reciben certificado.
 */
export async function issueCertificates(
  tx: Tx,
  args: { orderId: string; orderCode: string; actorId: string; signer: Signer; now: Date },
): Promise<string[]> {
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

  const issued: string[] = [];
  for (const item of items) {
    if (existingSlabs.some((s) => s.itemId === item.id)) continue;
    const result = results.find((r) => r.orderItemId === item.id);
    if (!result || result.status !== 'approved') {
      throw new ProblemError(409, 'Conflict', 'Falta el resultado aprobado de una carta.', { code: 'grading_incomplete' });
    }
    if (!result.isAuthentic) continue;
    if (
      result.finalGrade === null || !result.gradeLabel || result.centeringScore === null || result.cornersScore === null ||
      result.edgesScore === null || result.surfaceScore === null
    ) {
      throw new ProblemError(409, 'Conflict', 'El resultado de una carta está incompleto.', { code: 'grading_incomplete' });
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

    // El número del certificado es aleatorio; el slab lleva sus mismos dígitos. Si choca, se prueba otro.
    let number = '';
    let slab: { id: string; serial: string } | undefined;
    for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS && !slab; attempt++) {
      number = newCertificateNumber();
      const serial = slabSerialFor(number);
      [slab] = await tx
        .insert(slabs)
        .values({
          orderItemId: item.id,
          gradingResultId: result.id,
          serial,
          qrPayload: `${PUBLIC_BASE_URL()}/certificates/${number}?via=qr`,
          encapsulatedAt: args.now,
        })
        .onConflictDoNothing({ target: slabs.serial })
        .returning({ id: slabs.id, serial: slabs.serial });
    }
    if (!slab) throw new Error('No se pudo generar un número de certificado libre');

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
        label: result.gradeLabel,
        subgrades: {
          centering: result.centeringScore,
          corners: result.cornersScore,
          edges: result.edgesScore,
          surface: result.surfaceScore,
        },
      },
      resultVersion: result.version,
    };

    // Las fotos de anverso y reverso más recientes se enlazan por su clave privada; se firman enlaces temporales al mostrarlas.
    const front = photos.find((p) => p.orderItemId === item.id && p.kind === 'front');
    const back = photos.find((p) => p.orderItemId === item.id && p.kind === 'back');

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
    issued.push(number);
  }
  return issued;
}
