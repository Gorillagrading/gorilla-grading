import { randomUUID } from 'node:crypto';
import { and, asc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { auditLogs, itemImages, orderItems, orders } from '../../db/schema.js';
import type { UserDto } from '../../shared/auth.js';
import type { AdminOrderImages, ImageBody, ImageDto, OrderResultsDto, PublicGrading, UploadTarget } from '../../shared/photos.js';
import { hashIp } from '../auth/crypto.js';
import { ProblemError } from '../problem.js';
import type { ObjectStorage } from '../storage.js';
import { loadGradingResults } from './grading-results.js';

const STAFF_URL_TTL = 10 * 60;
const CUSTOMER_URL_TTL = 15 * 60;
const EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
/** El cliente solo ve los resultados cuando el pedido ya ha salido del laboratorio. */
const RELEASED = ['SHIPPED', 'DELIVERED', 'RETURNED'];

const itemNotFound = () => new ProblemError(404, 'Not Found', 'No existe esa carta en el pedido.', { code: 'item_not_found' });
const imageNotFound = () => new ProblemError(404, 'Not Found', 'No existe esa foto.', { code: 'image_not_found' });
const orderNotFound = () => new ProblemError(404, 'Not Found', 'No existe ningún pedido con ese código.', { code: 'order_not_found' });

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

async function loadItem(db: Db, code: string, position: number) {
  const [row] = await db
    .select({ order: orders, item: orderItems })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(orders.code, code.trim().toUpperCase()), eq(orderItems.position, position), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!row) throw itemNotFound();
  return row;
}

async function loadImage(db: Db, code: string, position: number, imageId: string) {
  if (!isUuid(imageId)) throw imageNotFound();
  const { item, order } = await loadItem(db, code, position);
  const [image] = await db
    .select()
    .from(itemImages)
    .where(and(eq(itemImages.id, imageId), eq(itemImages.orderItemId, item.id)))
    .limit(1);
  if (!image) throw imageNotFound();
  return { image, order };
}

/** Una foto cuyo archivo ya no está en el almacenamiento se omite en vez de romper la lista entera. */
const toDto = async (storage: ObjectStorage, row: typeof itemImages.$inferSelect, ttl: number): Promise<ImageDto | null> => {
  try {
    return { id: row.id, kind: row.kind, contentType: row.contentType, byteSize: row.byteSize, url: await storage.createDownloadUrl(row.storageKey, ttl) };
  } catch (error) {
    console.error('[storage] no se pudo firmar una foto', row.id, error instanceof Error ? error.message : error);
    return null;
  }
};
const present = (images: (ImageDto | null)[]): ImageDto[] => images.filter((i): i is ImageDto => i !== null);

const audit = (db: Db, actor: UserDto, action: string, orderCode: string, position: number, extra: object, ip: string | null) =>
  db.insert(auditLogs).values({
    actorId: actor.id,
    action,
    entityType: 'order_item',
    entityId: `${orderCode}#${position}`,
    after: extra,
    ipHash: ip ? hashIp(ip) : null,
  });

/** Reserva el hueco de una foto y devuelve dónde subirla. La foto no cuenta hasta que se confirma. */
export async function createImageUpload(
  db: Db,
  storage: ObjectStorage,
  code: string,
  position: number,
  body: ImageBody,
): Promise<{ image: { id: string }; upload: UploadTarget }> {
  const { item } = await loadItem(db, code, position);
  const storageKey = `items/${item.id}/${body.kind}-${randomUUID()}.${EXTENSIONS[body.contentType]}`;
  const upload = await storage.createUpload(storageKey, body.contentType);
  const [image] = await db
    .insert(itemImages)
    .values({ orderItemId: item.id, kind: body.kind, storageKey, contentType: body.contentType, byteSize: body.byteSize })
    .returning({ id: itemImages.id });
  return { image, upload };
}

/** Marca la foto como subida, comprobando que el archivo está de verdad en el almacenamiento. */
export async function confirmImage(
  db: Db,
  storage: ObjectStorage,
  actor: UserDto,
  code: string,
  position: number,
  imageId: string,
  context: { ip: string | null },
): Promise<ImageDto> {
  const { image, order } = await loadImage(db, code, position, imageId);
  if (!(await storage.exists(image.storageKey))) {
    throw new ProblemError(409, 'Conflict', 'El archivo todavía no se ha subido. Vuelve a intentarlo.', { code: 'upload_missing' });
  }
  const [updated] = await db
    .update(itemImages)
    .set({ uploadedAt: image.uploadedAt ?? new Date() })
    .where(eq(itemImages.id, image.id))
    .returning();
  await audit(db, actor, 'image.uploaded', order.code, position, { imageId: image.id, kind: image.kind }, context.ip);
  return (await toDto(storage, updated, STAFF_URL_TTL))!;
}

export async function deleteImage(
  db: Db,
  storage: ObjectStorage,
  actor: UserDto,
  code: string,
  position: number,
  imageId: string,
  context: { ip: string | null },
): Promise<void> {
  const { image, order } = await loadImage(db, code, position, imageId);
  await db.delete(itemImages).where(eq(itemImages.id, image.id));
  await storage.remove(image.storageKey).catch(() => undefined);
  await audit(db, actor, 'image.deleted', order.code, position, { imageId: image.id, kind: image.kind }, context.ip);
}

async function uploadedImages(db: Db, itemIds: string[]) {
  if (itemIds.length === 0) return [];
  return db
    .select()
    .from(itemImages)
    .where(and(inArray(itemImages.orderItemId, itemIds), isNotNull(itemImages.uploadedAt)))
    .orderBy(asc(itemImages.kind), asc(itemImages.createdAt));
}

/** Fotos subidas de cada carta de un pedido, para el panel del laboratorio. */
export async function listOrderImages(db: Db, storage: ObjectStorage, code: string): Promise<AdminOrderImages> {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.code, code.trim().toUpperCase()), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!order) throw orderNotFound();
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.position));
  const images = await uploadedImages(db, items.map((i) => i.id));
  return {
    items: await Promise.all(
      items.map(async (item) => ({
        position: item.position,
        images: present(await Promise.all(images.filter((i) => i.orderItemId === item.id).map((i) => toDto(storage, i, STAFF_URL_TTL)))),
      })),
    ),
  };
}

/** Lo que ve el cliente de su pedido: nota, subnotas y fotos, solo cuando ya ha salido del laboratorio. */
export async function getOrderResults(db: Db, storage: ObjectStorage, userId: string, code: string): Promise<OrderResultsDto> {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.code, code.trim().toUpperCase()), eq(orders.userId, userId), ne(orders.status, 'DRAFT')))
    .limit(1);
  if (!order) throw orderNotFound();

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(asc(orderItems.position));
  const released = RELEASED.includes(order.status);
  const ids = items.map((i) => i.id);
  const [results, images] = released
    ? await Promise.all([loadGradingResults(db, ids), uploadedImages(db, ids)])
    : [new Map<string, never>(), []];

  return {
    code: order.code,
    status: order.status,
    released,
    items: await Promise.all(
      items.map(async (item) => {
        const result = results.get(item.id);
        const grading: PublicGrading | null =
          result?.status === 'approved'
            ? {
                isAuthentic: result.isAuthentic,
                finalGrade: result.finalGrade,
                gradeLabel: result.gradeLabel,
                centering: result.centering,
                corners: result.corners,
                edges: result.edges,
                surface: result.surface,
                defects: result.defects.map(({ deduction: _deduction, ...d }) => d),
              }
            : null;
        return {
          position: item.position,
          cardName: item.cardName,
          game: item.game,
          setName: item.setName,
          grading,
          images: present(await Promise.all(images.filter((i) => i.orderItemId === item.id).map((i) => toDto(storage, i, CUSTOMER_URL_TTL)))),
        };
      }),
    ),
  };
}
