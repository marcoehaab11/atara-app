import { Board } from '../game/board';
import type { JarPosition } from '../game/board';
import { GameSession } from '../core/session';
import { loadLevel } from '../content/levelLoader';
import { starsForMoves } from '../core/stars';
import { cleanShopName, validateShopName } from '../core/shopName';
import { grantWin, unlocked } from '../meta/player';
import { loadPlayer, savePlayer } from '../services/storage';
import { findHint } from '../services/hints';
import { track } from '../services/analytics';
import { t } from '../i18n';
import type { StringKey } from '../i18n';
import hassan from '../../assets/svg/char_hassan.svg';
import coin from '../../assets/svg/ui_coin.svg';
import { SHOP_NAME } from '../config';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text?: string): HTMLElementTagNameMap[K] => {
  const n = document.createElement(tag); n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const paths = {
  undo: 'M9 5 3 11l6 6M3 11h11a6 6 0 0 1 0 12',
  hint: 'M9 19h6M10 23h4M8 16c0-3-4-4-4-8a8 8 0 0 1 16 0c0 4-4 5-4 8Z',
  extra: 'M5 4h14M6 4v3L4 10v12h16V10l-2-3V4M8 15h8M12 11v8',
  restart: 'M4 9a9 9 0 1 1-1 8M4 2v7h7',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
  shop: 'M3 9h18l-2-6H5ZM5 9v13h14V9M9 22v-8h6v8',
  daily: 'M3 5h18v17H3ZM7 2v6M17 2v6M3 11h18M8 15h2M14 15h2',
} as const;
function icon(key: keyof typeof paths) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 26'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(svg.namespaceURI, 'path');
  path.setAttribute('d', paths[key]); path.setAttribute('fill', 'none'); path.setAttribute('stroke', 'currentColor'); path.setAttribute('stroke-width', '1.6'); path.setAttribute('stroke-linecap', 'round'); path.setAttribute('stroke-linejoin', 'round');
  svg.append(path); return svg;
}

export class App {
  private player = loadPlayer();
  private session!: GameSession;
  private board: Board;
  private busy = false;
  private activePour: Promise<void> | null = null;
  private get blocked() { return this.busy && !this.board.animating; }
  private async afterMotion(action: () => void) {
    if (this.board.animating) { this.board.skip(); await this.activePour; }
    if (this.dialog.open) return;
    action();
  }
  private won = false;
  private toastTimer = 0;
  private bubbleTimer = 0;
  private speech: { key: StringKey; params: Record<string, string | number> } = { key: 'hassan.tut1', params: {} };
  private cancelModal: () => void = () => this.close();
  private readonly levelLabel = el('strong');
  private readonly movesLabel = el('div', 'moves');
  private readonly badge = el('span', 'level-badge');
  private readonly coinPill = el('span', 'coin-pill');
  private readonly sign = el('button', 'shop-sign');
  private readonly signName = el('span', 'sign-name');
  private readonly signWorld = el('span', 'sign-world');
  private readonly bubble = el('p', 'speech');
  private readonly boardHost = el('div', 'canvas-host');
  private readonly hits = el('div', 'jar-controls');
  private readonly toastLine = el('div', 'toast');
  private readonly toolbar = el('nav', 'toolbar');
  private readonly dialog = el('dialog', 'modal');
  private readonly shopButton = el('button', 'icon-button');
  private readonly dailyButton = el('button', 'icon-button');
  private readonly settingsButton = el('button', 'icon-button');

  constructor(root: HTMLElement) {
    root.replaceChildren(); root.className = 'game-shell';
    const header = el('header', 'hud'), info = el('div', 'level-info'), levelLine = el('div', 'level-line');
    levelLine.append(this.levelLabel, this.badge); info.append(levelLine, this.movesLabel);
    const actions = el('div', 'hud-actions');
    this.shopButton.append(icon('shop')); this.dailyButton.append(icon('daily')); this.settingsButton.append(icon('settings'));
    this.shopButton.onclick = () => void this.afterMotion(() => this.comingSoon()); this.dailyButton.onclick = () => void this.afterMotion(() => this.comingSoon()); this.settingsButton.onclick = () => void this.afterMotion(() => this.settings());
    actions.append(this.coinPill, this.dailyButton, this.shopButton, this.settingsButton); header.append(info, actions);
    const signRow = el('div', 'sign-row');
    this.sign.type = 'button'; this.sign.append(this.signName, this.signWorld); this.sign.onclick = () => void this.afterMotion(() => this.naming(false)); signRow.append(this.sign);
    const mentor = el('div', 'mentor'), avatar = el('img', 'avatar'); avatar.src = hassan; avatar.alt = '';
    this.bubble.setAttribute('aria-live', 'polite'); mentor.append(avatar, this.bubble);
    const stage = el('section', 'stage'); stage.append(this.boardHost, this.hits);
    this.toastLine.setAttribute('role', 'status');
    root.append(header, signRow, mentor, stage, this.toastLine, this.toolbar, this.dialog);
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.cancelModal(); });
    this.board = new Board(this.boardHost, (positions, height) => { stage.style.height = `${height}px`; this.drawJarControls(positions); });
    this.board.configure(this.player.motion, this.player.sound);
    root.addEventListener('pointerdown', event => {
      this.board.unlockAudio();
      if (!(event.target as Element).closest('button') && this.board.animating) this.board.skip();
    });
    root.addEventListener('keydown', () => this.board.unlockAudio());
    track('app_open', { level: this.player.level, returning: this.player.nameAnswered });
    this.startLevel();
    if (!this.player.nameAnswered && SHOP_NAME.timing === 'first_launch') { this.say('hassan.nameAsk'); this.naming(true); }
  }
  private text(key: StringKey, params: Record<string, string | number> = {}) { return t(this.player.locale, key, params); }
  private number(value: number) { return new Intl.NumberFormat(this.player.locale).format(value); }
  private shopLabel(name = this.player.name) { return this.text('shop.label', { name: name ?? this.text('shop.defaultName') }); }
  private button(key: StringKey, action: () => void, secondary = false) {
    const b = el('button', secondary ? 'cta secondary' : 'cta', this.text(key)); b.type = 'button'; b.onclick = action; return b;
  }
  private persist() { if (!savePlayer(this.player)) this.toast('ui.saveUnavailable', 4500); }
  private say(key: StringKey, params: Record<string, string | number> = {}) {
    this.speech = { key, params }; this.bubble.textContent = this.text(key, params);
    this.bubble.classList.remove('pop'); void this.bubble.offsetWidth; this.bubble.classList.add('pop');
  }
  private toast(key: StringKey, duration = 1900) {
    clearTimeout(this.toastTimer); this.toastLine.textContent = this.text(key);
    this.toastTimer = window.setTimeout(() => { this.toastLine.textContent = ''; }, duration);
  }
  private startLevel() {
    clearTimeout(this.bubbleTimer); this.busy = false; this.won = false;
    try { this.session = new GameSession(loadLevel(this.player.level)); } catch { this.toast('ui.loadingError', 10000); return; }
    const level = this.session.level;
    if (level.level >= 2 && level.level <= 5 && !this.player.announced.includes(level.level)) {
      this.player.announced.push(level.level); this.persist(); this.say(`hassan.unlock${level.level}` as StringKey);
    } else if (level.level === 1) this.say('hassan.tut1');
    else if (level.level === 12) this.say('hassan.hidden12');
    else this.say(level.type === 'hard' ? 'hassan.hard' : level.type === 'rest' ? 'hassan.rest' : 'hassan.normal.1');
    track('level_start', { level: level.level, type: level.type, order: 'none' }); this.update();
  }
  private update(renderBoard = true) {
    document.documentElement.lang = this.player.locale; document.documentElement.dir = this.player.locale === 'ar' ? 'rtl' : 'ltr';
    document.title = this.text('app.name');
    const level = this.session.level;
    this.levelLabel.textContent = this.text('ui.level', { n: this.number(level.level) });
    this.movesLabel.textContent = this.text('ui.moves', { m: this.number(this.session.moves) }) + (level.level >= 2 ? ` · ${this.text('ui.target', { p: this.number(level.par) })}` : '');
    this.badge.hidden = level.type !== 'hard' && level.type !== 'rest'; this.badge.className = `level-badge ${level.type}`;
    this.badge.textContent = level.type === 'hard' ? this.text('ui.badge.hard') : level.type === 'rest' ? this.text('ui.badge.rest') : '';
    this.coinPill.replaceChildren(); const img = el('img'); img.src = coin; img.alt = ''; this.coinPill.append(img, this.number(this.player.coins));
    this.coinPill.hidden = !unlocked(this.player, 'coins'); this.coinPill.setAttribute('aria-label', this.text('ui.coins', { n: this.number(this.player.coins) }));
    this.shopButton.hidden = !unlocked(this.player, 'shop'); this.dailyButton.hidden = !unlocked(this.player, 'daily');
    for (const [b, key] of [[this.shopButton, 'ui.shop'], [this.dailyButton, 'ui.daily'], [this.settingsButton, 'ui.settings']] as const) { b.title = this.text(key); b.setAttribute('aria-label', this.text(key)); b.disabled = this.blocked; }
    this.sign.disabled = this.blocked; this.signName.textContent = this.shopLabel(); this.sign.title = this.text('name.title.rename');
    this.signName.style.fontSize = `${this.shopLabel().length > 24 ? 13 : this.shopLabel().length > 19 ? 14 : 16}px`;
    this.signWorld.textContent = this.text('ui.world', { n: this.number(Math.floor((level.level - 1) / 20) + 1), name: this.text(`world.${level.world}` as StringKey) });
    this.bubble.textContent = this.text(this.speech.key, { ...this.speech.params, ...('shop' in this.speech.params ? { shop: this.shopLabel() } : {}) });
    this.toolbar.replaceChildren(); this.toolbar.hidden = !unlocked(this.player, 'undo');
    const definitions = [
      { key: 'undo', title: 'ui.undo', badge: this.session.undoLeft > 0 ? this.number(this.session.undoLeft) : this.text('ui.ad'), run: () => this.undo() },
      { key: 'hint', title: 'ui.hint', badge: this.session.hintFree + this.player.hints > 0 ? this.number(this.session.hintFree + this.player.hints) : this.text('ui.ad'), run: () => void this.hint() },
      { key: 'extra', title: 'ui.extra', badge: this.text('ui.ad'), run: () => this.comingSoon() },
      { key: 'restart', title: 'ui.restart', badge: '', run: () => this.restart() },
    ] as const;
    for (const d of definitions) {
      if (!unlocked(this.player, d.key)) continue;
      const b = el('button', 'tool-button'); b.type = 'button'; b.disabled = this.blocked || this.won;
      b.append(icon(d.key), el('span', '', this.text(d.title)));
      if (d.badge) b.append(el('small', 'tool-badge', d.badge));
      b.onclick = () => void this.afterMotion(d.run); this.toolbar.append(b);
    }
    if (renderBoard) void this.board.render({ session: this.session });
  }
  private drawJarControls(positions: JarPosition[]) {
    const focused = (document.activeElement as HTMLElement | null)?.dataset.jar; this.hits.replaceChildren();
    positions.forEach((p, i) => {
      const b = el('button', 'jar-hit'); b.type = 'button'; b.dataset.jar = String(i);
      b.style.cssText = `left:${p.x}px;top:${p.y - 5}px;width:${p.width}px;height:${p.height + 10}px`;
      const contents = this.session.vessels[i].map(id => this.session.hidden.has(id) ? this.text('jar.hidden') : this.text(`spice.${this.session.level.layerSpices[id]}` as StringKey)).join(this.player.locale === 'ar' ? '، ' : ', ') || this.text('jar.empty');
      b.setAttribute('aria-label', this.text('jar.label', { n: this.number(i + 1), contents }) + (p.complete ? ` · ${this.text('jar.complete')}` : ''));
      b.setAttribute('aria-pressed', String(this.session.selected === i)); b.disabled = this.blocked || this.won;
      b.onclick = () => void this.tap(i);
      b.append(el('span', `jar-caption ${p.complete ? 'complete' : ''}`, p.complete ? this.text(`spice.${this.session.state()[i][0]}` as StringKey) : this.number(i + 1)));
      this.hits.append(b);
    });
    if (focused !== undefined) this.hits.querySelector<HTMLButtonElement>(`[data-jar="${focused}"]`)?.focus({ preventScroll: true });
  }
  private async tap(index: number) {
    if (this.board.animating) { this.board.skip(); await this.activePour; }
    if (this.busy || this.won || this.dialog.open) return;
    clearTimeout(this.bubbleTimer); const result = this.session.tap(index);
    if (result.kind !== 'pour') {
      this.update();
      if (result.kind === 'select') this.board.play('select');
      if (result.kind === 'invalid') { this.board.play('invalid'); this.board.shake(index); this.toast(`toast.${result.reason}` as StringKey); if (this.session.invalidTaps % 3 === 0) this.say('hassan.invalid'); }
      return;
    }
    this.busy = true;
    const animation = this.board.render({ session: this.session, motion: result });
    this.update(false);
    this.activePour = (async () => {
      await animation;
      this.busy = false; this.update();
      if (result.won) { this.win(); return; }
      if (result.complete) { this.say('hassan.praise.1'); this.board.play('complete'); this.board.pulse(result.target); }
      if (result.stuck) { this.say('hassan.stuck'); this.stuck(); }
    })();
    await this.activePour;
  }
  private undo() {
    if (this.busy || this.won) return;
    const result = this.session.undo();
    if (result === 'empty') this.toast('toast.noUndo'); else if (result === 'ad') this.comingSoon(); else this.update();
  }
  private restart() {
    if (this.busy || this.won) return;
    this.session.restart(); this.update(); this.toast('toast.restarted'); track('level_restart', { level: this.session.level.level, mode: 'level' });
  }
  private async hint() {
    if (this.busy || this.won) return;
    if (this.session.hintFree <= 0 && this.player.hints <= 0) { this.comingSoon(); return; }
    this.busy = true; this.update(); this.toast('ui.hintBusy', 5000);
    try {
      const result = this.session.applyHint(await findHint(this.session.state()), this.player.hints); this.player.hints = result.inventory;
      if (result.status === 'ok') { this.persist(); this.toast('toast.hint'); track('hint_used', { src: result.source! }); }
      else this.toast(result.status === 'unsolvable' ? 'toast.hintUnsolvable' : 'toast.hintNotFound');
    } catch { this.toast('toast.hintNotFound'); }
    finally { this.busy = false; this.update(); }
  }
  private win() {
    this.won = true;
    this.board.play('win');
    const level = this.session.level, stars = starsForMoves(this.session.moves, level.par);
    const reward = grantWin(this.player, level.level, stars, level.type === 'hard'); this.persist();
    track('level_complete', { level: level.level, moves: this.session.moves, par: level.par, stars, hints: this.session.usedHints, undos: this.session.usedUndos, order: 'none' });
    this.say(stars === 3 ? 'hassan.win3stars' : 'hassan.win.1', { shop: this.shopLabel() }); this.update();
    const card = this.open('win.title');
    card.append(el('div', 'stars', '★'.repeat(stars) + '☆'.repeat(3 - stars)), el('p', '', this.text('win.body', { n: this.number(level.level), m: this.number(this.session.moves), p: this.number(level.par) })), el('div', 'earn', this.text('win.coins', { c: this.number(reward) })));
    if (level.type === 'hard') card.append(el('p', 'note', this.text('win.hardNote')));
    if (unlocked(this.player, 'double')) {
      const double = this.button('win.double', () => {}, true); double.disabled = true; double.title = this.text('ui.nextFeature'); card.append(double);
    }
    const next = () => { this.board.play('coin'); this.close(); this.startLevel(); if (level.level === 1 && !this.player.nameAnswered && SHOP_NAME.timing === 'after_level_1') this.naming(true); };
    card.append(this.button('win.next', next)); this.cancelModal = next;
  }
  private stuck() {
    track('stuck_shown', { level: this.session.level.level, mode: 'level' });
    const card = this.open('stuck.title'); card.append(el('p', '', this.text('stuck.body')), this.button('stuck.undo', () => { this.close(); this.undo(); }), this.button('stuck.extra', () => this.comingSoon(), true), this.button('stuck.restart', () => { this.close(); this.restart(); }, true), this.button('ui.close', () => this.close(), true));
  }
  private open(title: StringKey) {
    this.dialog.replaceChildren(); const card = el('div', 'modal-card'), h = el('h2', '', this.text(title));
    h.id = 'modal-title'; this.dialog.setAttribute('aria-labelledby', h.id); card.append(h); this.dialog.append(card);
    this.cancelModal = () => this.close(); if (!this.dialog.open) this.dialog.showModal(); return card;
  }
  private close() { this.dialog.close(); }
  private comingSoon() { const card = this.open('ui.nextFeature'); card.append(el('p', '', this.text('ui.featureBody')), this.button('ui.close', () => this.close())); }
  private naming(first: boolean) {
    const card = this.open(first ? 'name.title.first' : 'name.title.rename');
    const form = el('form'), label = el('label', 'name-label', this.text('name.field'));
    const input = el('input', 'name-input'); input.type = 'text'; input.autocomplete = 'off'; input.enterKeyHint = 'done'; input.placeholder = this.text('name.placeholder'); input.value = this.player.name ?? ''; input.id = 'shop-name'; label.htmlFor = input.id;
    const field = el('div', `name-field ${this.player.locale}`); field.append(el('span', '', this.text('name.prefixLabel')), input);
    const suggestions = el('div', 'suggestions'); let suggested = false;
    for (const name of this.text('name.suggestions').split(/[،,]\s*/)) {
      const chip = el('button', 'chip', name); chip.type = 'button'; chip.onclick = () => { input.value = name; suggested = true; refresh(); }; suggestions.append(chip);
    }
    const preview = el('p', 'name-preview'), error = el('p', 'form-error'); error.id = 'name-error'; error.setAttribute('role', 'alert'); input.setAttribute('aria-describedby', error.id);
    const refresh = () => { preview.textContent = `${this.text('name.preview')} ${this.shopLabel(cleanShopName(input.value) || null)}`; error.textContent = ''; input.removeAttribute('aria-invalid'); };
    input.oninput = () => { suggested = false; refresh(); }; refresh();
    const finish = (skip: boolean) => {
      const validation = validateShopName(input.value);
      if (!skip && validation.error) { error.textContent = this.text(validation.error); input.setAttribute('aria-invalid', 'true'); input.focus(); return; }
      if (!skip) this.player.name = validation.value;
      if (first) this.player.nameAnswered = true;
      this.persist(); this.close(); this.update(); track(first ? 'shop_named' : 'shop_renamed', { skipped: skip, len: skip ? 0 : [...validation.value].length, suggested });
      this.say(first ? skip ? 'hassan.welcomeSkipped' : 'hassan.welcomeNamed' : 'hassan.renamed', { shop: this.shopLabel() });
      if (first && this.session.level.level === 1) this.bubbleTimer = window.setTimeout(() => this.say('hassan.tut1'), 2200);
    };
    form.onsubmit = e => { e.preventDefault(); finish(false); };
    const submit = this.button(first ? 'name.save.first' : 'name.save.rename', () => {}); submit.type = 'submit';
    const cancel = () => { if (first) finish(true); else this.close(); };
    form.append(el('p', '', this.text(first ? 'name.body.first' : 'name.body.rename')), label, field, suggestions, preview, error, submit, this.button(first ? 'name.skip' : 'name.cancel', cancel, true), el('p', 'note', this.text('name.note')));
    card.append(form); this.cancelModal = cancel;
  }
  private settings() {
    const card = this.open('settings.title'); card.append(this.button('settings.shopName', () => this.naming(false), true));
    for (const key of ['sound', 'motion'] as const) {
      const toggle = el('button', 'cta secondary', `${this.text(`settings.${key}`)}: ${this.text(this.player[key] ? 'settings.on' : 'settings.off')}`);
      toggle.setAttribute('aria-pressed', String(this.player[key]));
      toggle.onclick = () => { this.player[key] = !this.player[key]; this.board.configure(this.player.motion, this.player.sound); this.persist(); this.update(); this.settings(); };
      card.append(toggle);
    }
    const languages = el('div', 'language-options');
    for (const locale of ['ar', 'en'] as const) {
      const b = el('button', `chip ${this.player.locale === locale ? 'active' : ''}`, t(locale, 'ui.languageName')); b.setAttribute('aria-pressed', String(locale === this.player.locale));
      b.onclick = () => { this.player.locale = locale; this.persist(); this.update(); this.settings(); }; languages.append(b);
    }
    card.append(el('h3', '', this.text('ui.language')), languages, el('h3', '', this.text('ui.help')), el('p', '', this.text('ui.helpBody')), this.button('ui.close', () => this.close()));
  }
}
