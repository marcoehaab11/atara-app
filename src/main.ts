import { t } from './i18n';
import type { Locale } from './i18n';
import './style.css';
import hassan from '../assets/svg/char_hassan.svg';
import turmeric from '../assets/svg/spice_0_turmeric.svg';
import chili from '../assets/svg/spice_1_chili.svg';
import mint from '../assets/svg/spice_3_mint.svg';

let locale: Locale = 'ar';
const app = document.querySelector<HTMLElement>('#app')!;
function render() {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  document.title = t(locale, 'app.name');
  app.replaceChildren();
  const card = document.createElement('section');
  const badge = document.createElement('p'); badge.className = 'badge'; badge.textContent = t(locale, 'setup.status');
  const name = document.createElement('h1'); name.textContent = t(locale, 'app.name');
  const avatar = document.createElement('img'); avatar.src = hassan; avatar.alt = ''; avatar.className = 'avatar';
  const title = document.createElement('h2'); title.textContent = t(locale, 'setup.title');
  const body = document.createElement('p'); body.textContent = t(locale, 'setup.body');
  const art = document.createElement('div'); art.className = 'spices'; art.setAttribute('aria-hidden', 'true');
  for (const src of [turmeric, chili, mint]) { const img = document.createElement('img'); img.src = src; img.alt = ''; art.append(img); }
  const note = document.createElement('p'); note.className = 'note'; note.textContent = t(locale, 'setup.note');
  const language = document.createElement('button'); language.textContent = t(locale, 'setup.language');
  language.addEventListener('click', () => { locale = locale === 'ar' ? 'en' : 'ar'; render(); });
  card.append(badge, name, avatar, title, body, art, note, language);
  app.append(card);
}
render();
