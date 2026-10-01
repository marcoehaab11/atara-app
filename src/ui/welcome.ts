import hassan from '../../assets/svg/char_hassan.svg';
import { t } from '../i18n';
import type { Player } from '../meta/player';
import { savePlayer } from '../services/storage';
import './welcome.css';

export function showWelcome(root: HTMLElement, player: Player, enter: (view: 'game' | 'settings') => void): void {
  const locale = player.locale;
  const text = (key: Parameters<typeof t>[1], params: Record<string, string | number> = {}) => t(locale, key, params);
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title = text('app.name');

  const screen = document.createElement('section'); screen.className = 'welcome-screen';
  const door = document.createElement('div'); door.className = 'welcome-door';
  const sign = document.createElement('p'); sign.className = 'welcome-sign';
  sign.textContent = text('shop.label', { name: player.name ?? text('shop.defaultName') });
  const portrait = document.createElement('img'); portrait.className = 'welcome-hassan'; portrait.src = hassan; portrait.alt = '';
  const heading = document.createElement('h1'); heading.textContent = text('app.name');
  const subtitle = document.createElement('p'); subtitle.className = 'welcome-subtitle'; subtitle.textContent = text('welcome.subtitle');
  const level = document.createElement('p'); level.className = 'welcome-level';
  level.textContent = text('ui.level', { n: new Intl.NumberFormat(locale).format(player.level) });
  const continueButton = document.createElement('button'); continueButton.type = 'button'; continueButton.className = 'welcome-continue';
  continueButton.textContent = text('welcome.continue'); continueButton.onclick = () => enter('game');
  const actions = document.createElement('div'); actions.className = 'welcome-actions';
  const language = document.createElement('button'); language.type = 'button'; language.className = 'welcome-option';
  language.setAttribute('aria-label', text('settings.language'));
  language.textContent = t(locale === 'ar' ? 'en' : 'ar', 'ui.languageName');
  language.onclick = () => { player.locale = locale === 'ar' ? 'en' : 'ar'; savePlayer(player); showWelcome(root, player, enter); };
  const settings = document.createElement('button'); settings.type = 'button'; settings.className = 'welcome-option';
  settings.textContent = text('settings.title'); settings.onclick = () => enter('settings');
  settings.hidden = !player.nameAnswered;
  actions.append(language, settings);
  door.append(sign, portrait, heading, subtitle, level, continueButton, actions);
  screen.append(door);
  root.className = 'welcome-root'; root.replaceChildren(screen);
}
