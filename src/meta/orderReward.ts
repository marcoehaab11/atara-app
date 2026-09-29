import { ORDERS } from '../config';
import { orderStatus } from '../core/orders';
import type { GameSession } from '../core/session';
import type { Player } from './player';
export function settleOrder(player: Player, session: GameSession) {
  const order = session.level.order;
  if (!order) return { status: 'none' as const, reward: 0 };
  const granted = player.orderRewards.includes(session.level.level);
  const status = orderStatus(session.state(), order, granted);
  const reward = status === 'delivered' && !granted ? order.length * ORDERS.rewardPerSpice * (session.level.type === 'hard' ? 2 : 1) : 0;
  if (reward) { player.coins += reward; player.orderRewards.push(session.level.level); }
  return { status, reward };
}
