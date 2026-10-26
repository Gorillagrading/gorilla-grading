import type { DashboardData, DashboardRange } from '../../shared/dashboard';
import type {
  AdminOrderDetail, AdminOrderList, ShipmentBody, TransitionBody,
} from '../../shared/admin';
import type { AdminGradingResult, GradingBody } from '../../shared/grading-admin';
import type { AdminOrderImages, ImageBody, ImageDto, UploadTarget } from '../../shared/photos';
import { ApiError, api } from './client';

export interface QueueQuery {
  status?: string;
  q?: string;
  sort: 'oldest' | 'newest';
  page: number;
}

export const fetchAdminOrders = (query: QueueQuery) => {
  const params = new URLSearchParams({ sort: query.sort, page: String(query.page) });
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  return api<AdminOrderList>(`/admin/orders?${params}`);
};

export const fetchAdminOrder = (code: string) =>
  api<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(code)}`).then((r) => r.order);

export const transitionAdminOrder = (code: string, body: TransitionBody) =>
  api<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(code)}/transitions`, { body }).then((r) => r.order);

export const addAdminShipment = (code: string, body: ShipmentBody) =>
  api<{ order: AdminOrderDetail }>(`/admin/orders/${encodeURIComponent(code)}/shipments`, { body }).then((r) => r.order);

const itemPath = (code: string, position: number) => `/admin/orders/${encodeURIComponent(code)}/items/${position}`;

export const saveGrading = (code: string, position: number, body: GradingBody) =>
  api<{ grading: AdminGradingResult }>(`${itemPath(code, position)}/grading`, { method: 'PUT', body }).then((r) => r.grading);

export const approveGrading = (code: string, position: number) =>
  api<{ grading: AdminGradingResult }>(`${itemPath(code, position)}/grading/approve`, { body: {} }).then((r) => r.grading);

export const rejectGrading = (code: string, position: number, reason: string) =>
  api<{ grading: AdminGradingResult }>(`${itemPath(code, position)}/grading/reject`, { body: { reason } }).then((r) => r.grading);

export const fetchOrderImages = (code: string) => api<AdminOrderImages>(`/admin/orders/${encodeURIComponent(code)}/images`);

export const deleteItemImage = (code: string, position: number, imageId: string) =>
  api<void>(`${itemPath(code, position)}/images/${imageId}`, { method: 'DELETE' });

/**
 * Sube una foto: la API reserva el hueco, el navegador envía el archivo directamente al almacenamiento
 * privado (sin pasar por el servidor, así no hay límite de tamaño práctico) y la API confirma que llegó.
 */
export async function uploadItemImage(code: string, position: number, kind: ImageBody['kind'], file: File): Promise<ImageDto> {
  const { image, upload } = await api<{ image: { id: string }; upload: UploadTarget }>(`${itemPath(code, position)}/images`, {
    body: { kind, contentType: file.type, byteSize: file.size },
  });
  const form = new FormData();
  form.append('cacheControl', '3600');
  form.append('', file);
  let res: Response;
  try {
    res = await fetch(upload.url, { method: upload.method, headers: upload.headers, body: form });
  } catch {
    throw new ApiError(0, 'upload_failed', 'No se pudo enviar el archivo.');
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    throw new ApiError(res.status, 'upload_failed', detail || 'sin detalle');
  }
  return api<{ image: ImageDto }>(`${itemPath(code, position)}/images/${image.id}/confirm`, { body: {} }).then((r) => r.image);
}

/** Mensaje para el personal a partir de un error del panel. */
export function adminErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.';
  switch (err.code) {
    case 'order_changed':
      return 'Otra persona ha cambiado este pedido mientras lo mirabas. Hemos recargado su estado actual.';
    case 'two_person_rule':
      return 'No puedes aprobar tu propio trabajo. Tiene que hacerlo otra persona.';
    case 'grading_incomplete':
      return 'Todas las cartas necesitan su resultado de graduación aprobado por control de calidad antes de enviar el pedido.';
    case 'grading_not_allowed':
      return 'El pedido no está en una fase en la que se pueda graduar.';
    case 'grading_approved':
      return 'El resultado ya está aprobado. Solo un administrador puede corregirlo.';
    case 'grading_not_pending':
      return 'Este resultado no está pendiente de control de calidad.';
    case 'grade_above_subgrades':
      return 'La nota final no puede superar la que dan las subnotas.';
    case 'upload_failed':
      return `No se pudo subir la foto (${err.status || 'sin conexión'}): ${err.message}`;
    case 'upload_missing':
      return 'La foto no llegó al almacenamiento. Vuelve a intentarlo.';
    case 'storage_error':
      return `Error del almacenamiento: ${err.message}`;
    case 'storage_unavailable':
      return 'El almacenamiento de fotos no está configurado todavía.';
    case 'tracking_required':
      return 'Registra primero el transportista y el número de seguimiento de la devolución.';
    case 'note_required':
      return 'Escribe el motivo: este cambio necesita una nota.';
    case 'invalid_transition':
      return 'Ese cambio de estado no está permitido desde el estado actual.';
    case 'forbidden':
      return 'Tu rol no permite hacer esto.';
    case 'order_finished':
      return 'El pedido ya está cerrado.';
    case 'validation_error':
      return 'Revisa los datos: hay algún campo vacío o con un formato no válido.';
    case 'unauthenticated':
      return 'Tu sesión ha caducado. Vuelve a iniciar sesión.';
    case 'network':
      return 'No se pudo conectar con el servidor.';
    default:
      return `Algo salió mal (${err.status}${err.code ? `, ${err.code}` : ''}). Inténtalo de nuevo.`;
  }
}

export const fetchDashboard = (range: DashboardRange) => api<DashboardData>(`/admin/dashboard?range=${range}`);
