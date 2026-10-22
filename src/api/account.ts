import type { GradedCardDto, OrderSummaryDto, PaymentReceiptDto } from '../../shared/account';
import type { GradedCard } from '../types';
import { api } from './client';

export const fetchOrders = () => api<{ orders: OrderSummaryDto[] }>('/orders').then((r) => r.orders);

/** Cartas certificadas del usuario. El DTO tiene la misma forma que `GradedCard`, solo con tipos más amplios. */
export const fetchCards = () => api<{ cards: GradedCardDto[] }>('/me/cards').then((r) => r.cards as GradedCard[]);

/** Pagos cobrados del usuario con su recibo de Stripe. */
export const fetchPayments = () => api<{ payments: PaymentReceiptDto[] }>('/me/payments').then((r) => r.payments);
