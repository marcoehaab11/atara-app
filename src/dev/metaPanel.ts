import { t } from '../i18n';
import { recentEvents } from '../services/analytics';
export function metaPanel(root: HTMLElement, callbacks: { coins: () => void; jump: (level: number) => void; day: () => void; reset: () => void }) {
  const panel = document.createElement('details'); panel.className = 'debug-panel';
  const title = document.createElement('summary'); title.textContent = t('en', 'debug.title'); panel.append(title);
  const button = (key: 'debug.coins' | 'debug.jump' | 'debug.day' | 'debug.reset' | 'debug.events', action: () => void) => {
    const b = document.createElement('button'); b.className = 'cta secondary'; b.textContent = t('en', key); b.onclick = action; panel.append(b); return b;
  };
  button('debug.coins', callbacks.coins);
  const level = document.createElement('input'); level.type = 'number'; level.min = '1'; level.max = '1000'; level.value = '7'; level.setAttribute('aria-label', t('en', 'debug.level')); panel.append(level);
  button('debug.jump', () => { const n = Number(level.value); if (Number.isInteger(n) && n >= 1 && n <= 1000) callbacks.jump(n); });
  button('debug.day', callbacks.day);
  let armed = false;
  const reset = button('debug.reset', () => { if (armed) { callbacks.reset(); armed = false; reset.textContent = t('en', 'debug.reset'); } else { armed = true; reset.textContent = t('en', 'debug.confirm'); } });
  const log = document.createElement('pre');
  button('debug.events', () => { log.textContent = JSON.stringify(recentEvents(), null, 2); }); panel.append(log); root.append(panel);
}
