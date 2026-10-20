import type {
  AdminOrderDetail, AdminOrderList, ShipmentBody, TransitionBody,
} from '../../shared/admin';
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

/** Mensaje para el personal a partir de un error del panel. */
export function adminErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Algo salió mal. Inténtalo de nuevo.';
  switch (err.code) {
    case 'order_changed':
      return 'Otra persona ha cambiado este pedido mientras lo mirabas. Hemos recargado su estado actual.';
    case 'two_person_rule':
      return 'Quien encapsuló el pedido no puede aprobar su salida de control de calidad. Tiene que hacerlo otra persona.';
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
      return 'Algo salió mal. Inténtalo de nuevo.';
  }
}
