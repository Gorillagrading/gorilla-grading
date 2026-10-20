import type { CreateOrderBody, CreatedOrderDto, QuoteBody, QuoteResponse } from '../../shared/orders';
import { api } from './client';

/** Precio de un pedido calculado por el servidor, con los avisos que impiden enviarlo. */
export const fetchQuote = (items: QuoteBody['items'], shippingMethod: QuoteBody['shippingMethod']) =>
  api<QuoteResponse>('/quotes', { body: { items, shippingMethod } });

/** Envía el pedido a nombre de la sesión iniciada. Reenviar el mismo `clientToken` no crea otro pedido. */
export const submitOrder = (body: CreateOrderBody) =>
  api<{ order: CreatedOrderDto }>('/orders', { body }).then((r) => r.order);
