import type { GradedCardDto, OrderSummaryDto } from '../../shared/account';
import type { GradedCard } from '../types';
import { api } from './client';

export const fetchOrders = () => api<{ orders: OrderSummaryDto[] }>('/orders').then((r) => r.orders);

/** Cartas certificadas del usuario. El DTO tiene la misma forma que `GradedCard`, solo con tipos más amplios. */
export const fetchCards = () => api<{ cards: GradedCardDto[] }>('/me/cards').then((r) => r.cards as GradedCard[]);
