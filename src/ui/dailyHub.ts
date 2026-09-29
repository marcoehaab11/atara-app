import { DAILY_REWARDS } from '../config';
import { dailyStatus } from '../meta/daily';
import type { Player } from '../meta/player';
import { t } from '../i18n';
import type { StringKey } from '../i18n';
import { art } from './decorations';
export function dayCount(locale: Player['locale'], days: number): string {
  const n = new Intl.NumberFormat(locale).format(days);
  return t(locale, days === 1 ? 'days.one' : days === 2 && locale === 'ar' ? 'days.two' : days >= 3 && days <= 10 ? 'days.few' : 'days.many', { n });
}
export function fillDailyHub(card: HTMLElement, player: Player, now: Date, actions: { claim: () => void; play: () => void; back: () => void; leave?: () => void }) {
  const text = (key: StringKey, params: Record<string, string | number> = {}) => t(player.locale, key, params);
  const number = (n: number) => new Intl.NumberFormat(player.locale).format(n);
  const add = (tag: string, value: string, cls = '') => { const element = document.createElement(tag); element.textContent = value; element.className = cls; card.append(element); return element; };
  const button = (key: StringKey, action: () => void, disabled = false) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cta'; b.textContent = text(key); b.disabled = disabled; b.onclick = action; card.append(b); };
  const status = dailyStatus(player, now);
  add('p', new Intl.DateTimeFormat(player.locale, { dateStyle: 'long' }).format(now), 'note');
  if (!status.clockOK) add('p', text('daily.clockBlocked'), 'form-error');
  add('h3', text('daily.rewardTitle'));
  const grid = document.createElement('div'); grid.className = 'daily-grid';
  DAILY_REWARDS.forEach((reward, index) => {
    const day = index + 1, past = day < status.nextDay || (day === status.nextDay && status.claimed);
    const cell = document.createElement('div'); cell.className = `daily-cell ${past ? 'claimed' : ''} ${day === status.nextDay ? 'today' : ''}`;
    const label = document.createElement('strong'); label.textContent = text('daily.day', { n: number(day) }); cell.append(label);
    const content = document.createElement('span'); content.textContent = text(reward.coins ? 'daily.coins' : 'daily.hints', { n: number(reward.coins || reward.hints) }); cell.append(content);
    if (day === 7) cell.append(art('tray', text('item.tray')));
    if (past) { const check = document.createElement('span'); check.textContent = '✓'; check.setAttribute('aria-label', text('daily.received')); cell.append(check); }
    grid.append(cell);
  });
  card.append(grid);
  if (status.claimed) add('p', text('daily.claimed'), 'note'); else button('daily.claim', actions.claim, !status.available);
  add('h3', text('daily.challengeTitle'));
  add('p', text('daily.streakLine', { days: status.streak ? dayCount(player.locale, status.streak) : text('daily.noStreak'), best: player.daily.best ? dayCount(player.locale, player.daily.best) : text('daily.noBest') }), 'note');
  if (status.completed) add('p', text('daily.done'));
  else { if (!actions.leave) add('p', text('daily.restartNote'), 'note'); button(actions.leave ? 'daily.resume' : 'daily.play', actions.play, !status.available); }
  if (actions.leave) button('dailyWin.back', actions.leave);
  button('daily.back', actions.back);
}
