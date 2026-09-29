import { ORDERS } from '../config';
import { isComplete } from './rules';
import { mulberry32, shuffle } from './rng';
import { solve } from './solver';
import type { Order, State } from './types';

export function orderGuard(order: Order): (s: State) => boolean {
  return s => {
    const completed = s.filter(isComplete).map(v => v[0]);
    return order.every(x => completed.includes(x)) || completed.every(x => order.includes(x));
  };
}
export function chooseOrder(state: State, seed: number): Order | null {
  const spices = shuffle([...new Set(state.flat())], mulberry32(seed * 53 + 11));
  for (let i = 0; i < ORDERS.pairs * 2 && i + 1 < spices.length; i += 2) {
    const order: Order = [spices[i], spices[i + 1]];
    if (solve(state, ORDERS.limit, orderGuard(order)).path !== null) return order;
  }
  return null;
}
export function orderStatus(state: State, order: Order, alreadyGranted: boolean): 'delivered' | 'missed' | 'waiting' {
  if (alreadyGranted) return 'delivered';
  const complete = state.filter(isComplete).map(v => v[0]);
  if (complete.some(x => !order.includes(x))) return 'missed';
  if (order.every(x => complete.includes(x))) return 'delivered';
  return orderGuard(order)(state) ? 'waiting' : 'missed';
}
