import { Board } from '../game/board';
import type { JarPosition } from '../game/board';
import { GameSession } from '../core/session';
import { loadLevel } from '../content/levelLoader';
import { starsForMoves } from '../core/stars';
import { cleanShopName, validateShopName } from '../core/shopName';
import { grantWin, unlocked, newPlayer } from '../meta/player';
import type { Player } from '../meta/player';
import { savePlayer } from '../services/storage';
import { findHint } from '../services/hints';
import { track } from '../services/analytics';
import { t } from '../i18n';
import type { StringKey } from '../i18n';
import hassan from '../../assets/svg/char_hassan.svg';
import coin from '../../assets/svg/ui_coin.svg';
import { SHOP_NAME, SHOP_PRICES, ORDERS } from '../config';
import { buyDecoration } from '../meta/shop';
import type { ShopItem } from '../meta/shop';
import { activeTheme, themes } from '../meta/themes';
import { settleOrder } from '../meta/orderReward';
import { isComplete, isWon } from '../core/rules';
import { art, spiceArt, garland } from './decorations';
import { mulberry32 } from '../core/rng';
import { dailySeed } from '../core/daily';
import { claimDaily, completeDaily, dailyStatus, observeClock } from '../meta/daily';
import { loadDaily } from '../services/daily';
import { dayCount, fillDailyHub } from './dailyHub';
import { isNativeAdsPlatform, showInterstitialAd, showRewardedAd, showPrivacyOptions } from '../services/ads';
import { beginStarterOffer, markDoubleClaimed, markInterstitialShown, mockBuyStarterPack, shouldShowInterstitial, starterOfferAvailable } from '../meta/monetization';
import { DEFAULT_REMINDER_HOUR, nextReminderTimes, REMINDER_NOTIFICATION_IDS } from '../meta/reminders';
import { mergeCloudPlayers } from '../meta/cloudSave';
import { queuePlayGamesSave, showPlayGamesAchievements, unlockPlayGamesAchievement } from '../services/playGames';

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
  private player;
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
  private previewDate: Date | undefined;
  private dailyDate: number | null = null;
  private booting = true;
  private now() { return this.previewDate ? new Date(this.previewDate) : new Date(); }
  private shownTheme: ReturnType<typeof activeTheme> = 'normal';
  private orderState: 'none' | 'waiting' | 'delivered' | 'missed' = 'none';
  private rewardedThisWin = false;
  private nativeBackListenerReady = false;
  private reminderSyncedDay: number | null = null;
  private readonly counter = el('div', 'counter');
  private readonly orderCard = el('section', 'order-card');
  private readonly seasonal = el('div', 'garland');
  private readonly hangingA = el('span', 'hanging');
  private readonly hangingB = el('span', 'hanging');
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

  constructor(root: HTMLElement, player: Player) {
    this.player = player;
    this.shownTheme = activeTheme(this.player.theme);
    root.replaceChildren(); root.className = 'game-shell';
    const header = el('header', 'hud'), info = el('div', 'level-info'), levelLine = el('div', 'level-line');
    levelLine.append(this.levelLabel, this.badge); info.append(levelLine, this.movesLabel);
    const actions = el('div', 'hud-actions');
    this.shopButton.append(icon('shop')); this.dailyButton.append(icon('daily')); this.settingsButton.append(icon('settings'));
    this.shopButton.onclick = () => void this.afterMotion(() => this.shop()); this.dailyButton.onclick = () => void this.afterMotion(() => this.dailyHub()); this.settingsButton.onclick = () => void this.afterMotion(() => this.settings());
    actions.append(this.coinPill, this.dailyButton, this.shopButton, this.settingsButton); header.append(info, actions);
    const signRow = el('div', 'sign-row');
    this.sign.type = 'button'; this.sign.append(this.signName, this.signWorld); this.sign.onclick = () => void this.afterMotion(() => this.naming(false)); signRow.append(this.sign);
    signRow.prepend(this.hangingA); signRow.append(this.hangingB);
    const mentor = el('div', 'mentor'), avatar = el('img', 'avatar'); avatar.src = hassan; avatar.alt = '';
    this.bubble.setAttribute('aria-live', 'polite'); mentor.append(avatar, this.bubble);
    const stage = el('section', 'stage'); stage.append(this.boardHost, this.hits);
    this.toastLine.setAttribute('role', 'status');
    root.append(this.seasonal, header, signRow, mentor, this.orderCard, stage, this.counter, this.toastLine, this.toolbar, this.dialog);
    this.dialog.addEventListener('cancel', e => { e.preventDefault(); this.cancelModal(); });
    this.board = new Board(this.boardHost, (positions, height) => { stage.style.height = `${height}px`; this.drawJarControls(positions); });
    this.board.configure(this.player.motion, this.player.sound, this.player.music);
    this.recordSessionStart();
    if (isNativeAdsPlatform) void this.installPlatformListeners();
    root.addEventListener('pointerdown', event => {
      this.board.unlockAudio();
      if (!(event.target as Element).closest('button') && this.board.animating) this.board.skip();
    });
    root.addEventListener('keydown', () => this.board.unlockAudio());
    document.addEventListener('visibilitychange', () => { this.persist(); if (!document.hidden) this.refreshDaily(); });
    window.setInterval(() => { if (!document.hidden) { this.persist(); this.refreshDaily(); } }, 60_000);
    track('app_open', { level: this.player.level, returning: this.player.nameAnswered });
    this.startLevel();
    this.booting = false;
    if (!this.player.nameAnswered && SHOP_NAME.timing === 'first_launch') { this.say('hassan.nameAsk'); this.naming(true); }
    else if (this.player.daily.run?.date === dailySeed(this.now()) && !dailyStatus(this.player, this.now()).completed) void this.startDaily(this.player.daily.run.snapshot);
    else { this.player.daily.run = null; this.maybeDaily(); }
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('debug')) {
      void import('../dev/metaPanel').then(({ metaPanel }) => metaPanel(root, {
        coins: () => { this.player.coins += 200; this.persist(); this.update(false); },
        jump: level => void this.afterMotion(() => { this.dailyDate = null; this.player.daily.run = null; this.player.level = level; this.player.maxLevel = Math.max(level, this.player.maxLevel); this.player.session = null; this.startLevel(); }),
        day: () => { this.previewDate ??= new Date(); this.previewDate.setDate(this.previewDate.getDate() + 1); this.persist(); this.refreshDaily(); this.maybeDaily(); },
        reset: () => void this.afterMotion(() => { this.player = newPlayer(); this.board.configure(this.player.motion, this.player.sound, this.player.music); this.startLevel(); this.naming(true); }),
      }));
    }
  }
  private text(key: StringKey, params: Record<string, string | number> = {}) { return t(this.player.locale, key, params); }
  private number(value: number) { return new Intl.NumberFormat(this.player.locale).format(value); }
  private async installPlatformListeners() {
    try {
      const { App: NativeApp } = await import('@capacitor/app');
      await NativeApp.addListener('backButton', () => this.handleBack());
      this.nativeBackListenerReady = true;
      const { Keyboard } = await import('@capacitor/keyboard');
      await Keyboard.addListener('keyboardDidShow', () => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active.matches('input, textarea')) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.addListener('localNotificationActionPerformed', action => {
        if (action.notification.extra?.reminder === true) {
          track('reminder_opened'); this.reminderSyncedDay = null; void this.syncReminder();
        }
      });
    } catch { /* Platform plugins are optional in browser builds. */ }
  }
  private handleBack() {
    if (this.dialog.open) { this.cancelModal(); return; }
    if (this.board.animating) { this.board.skip(); return; }
    if (!this.nativeBackListenerReady) return;
    const card = this.open('exit.title');
    card.append(el('p', '', this.text('exit.body')));
    card.append(this.button('exit.confirm', () => {
      void import('@capacitor/app').then(({ App: NativeApp }) => NativeApp.exitApp()).catch(() => undefined);
    }));
    card.append(this.button('exit.cancel', () => this.close(), true));
    this.cancelModal = () => this.close();
  }
  private shopLabel(name = this.player.name) { return this.text('shop.label', { name: name ?? this.text('shop.defaultName') }); }
  private button(key: StringKey, action: () => void, secondary = false) {
    const b = el('button', secondary ? 'cta secondary' : 'cta', this.text(key)); b.type = 'button'; b.onclick = action; return b;
  }
  private persist() {
    observeClock(this.player.daily, this.now());
    if (this.dailyDate !== null) {
      this.player.daily.run = this.player.daily.lastComplete === this.dailyDate ? null : { date: this.dailyDate, snapshot: this.session.snapshot() };
    } else this.player.session = this.session && this.session.level.level === this.player.level ? this.session.snapshot() : null;
    if (!savePlayer(this.player)) this.toast('ui.saveUnavailable', 4500);
    queuePlayGamesSave(JSON.stringify(this.player));
    this.syncReminder();
  }
  applyCloudPlayer(cloud: Player) {
    this.player = mergeCloudPlayers(this.player, cloud);
    savePlayer(this.player);
    queuePlayGamesSave(JSON.stringify(this.player));
    this.startLevel();
    this.update();
    const dailyRun = this.player.daily.run;
    if (dailyRun?.date === dailySeed(this.now()) && !dailyStatus(this.player, this.now()).completed) void this.startDaily(dailyRun.snapshot);
    if (this.player.owned.length === 8) unlockPlayGamesAchievement('all_decorations');
  }
  private vibrate(ms: number) {
    if (!this.player.haptics) return;
    if (isNativeAdsPlatform) void import('@capacitor/haptics').then(({ Haptics }) => Haptics.vibrate({ duration: ms })).catch(() => undefined);
    else navigator.vibrate?.(ms);
  }
  private async syncReminder() {
    if (!isNativeAdsPlatform) return;
    const today = dailySeed(new Date());
    if (this.reminderSyncedDay === today) return;
    this.reminderSyncedDay = today;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: REMINDER_NOTIFICATION_IDS.map(id => ({ id })) }).catch(() => undefined);
    const delivered = await LocalNotifications.getDeliveredNotifications().catch(() => ({ notifications: [] }));
    const deliveredIds = delivered.notifications.filter(item => REMINDER_NOTIFICATION_IDS.includes(item.id as typeof REMINDER_NOTIFICATION_IDS[number])).map(item => item.id);
    if (deliveredIds.length) await LocalNotifications.removeDeliveredNotificationsById({ ids: deliveredIds }).catch(() => undefined);
    if (!this.player.reminderEnabled || this.player.daily.lastComplete === today) return;
    const times = nextReminderTimes(new Date(), this.player.reminderHour ?? DEFAULT_REMINDER_HOUR);
    const key = this.player.daily.streak > 0 ? 'reminder.streak' : this.player.name ? 'reminder.reward' : 'reminder.generic';
    await LocalNotifications.schedule({ notifications: times.map((at, index) => ({ id: REMINDER_NOTIFICATION_IDS[index], title: this.text('app.name'), body: this.text(key, { days: this.player.daily.streak, shop: this.shopLabel() }), schedule: { at }, extra: { reminder: true } })) }).catch(() => undefined);
  }
  private async askReminder() {
    if (!isNativeAdsPlatform || this.player.reminderAsked || this.player.reminderDenied || this.player.daily.completions < 2) return;
    this.player.reminderAsked = true;
    const card = this.open('reminder.ask.title'); card.append(el('p', '', this.text('reminder.ask.body')));
    card.append(this.button('reminder.ask.yes', () => {
      this.close();
      void import('@capacitor/local-notifications').then(async ({ LocalNotifications }) => {
        const permission = await LocalNotifications.checkPermissions();
        const result = permission.display === 'granted' ? permission : await LocalNotifications.requestPermissions();
        const allowed = result.display === 'granted';
        this.player.reminderEnabled = allowed; this.player.reminderDenied = !allowed;
        this.reminderSyncedDay = null;
        track('reminder_permission', { result: allowed ? 'granted' : 'denied' });
        this.persist(); this.settings();
      }).catch(() => { this.player.reminderEnabled = false; this.player.reminderDenied = true; this.persist(); });
    }));
    card.append(this.button('reminder.ask.no', () => { this.player.reminderDenied = true; this.persist(); this.close(); }));
    this.cancelModal = () => { this.player.reminderDenied = true; this.persist(); this.close(); };
  }
  private recordSessionStart() {
    const hour = new Date().getHours(); this.player.sessionStartHours.push(hour);
    this.player.sessionStartHours = this.player.sessionStartHours.slice(-7);
    const sorted = [...this.player.sessionStartHours].sort((a, b) => a - b);
    this.player.reminderHour = sorted[Math.floor(sorted.length / 2)] ?? 19;
  }
  private async toggleReminder() {
    if (!isNativeAdsPlatform) { this.infoModal('settings.reminder', 'ui.servicesLater'); return; }
    if (this.player.reminderEnabled) {
      this.player.reminderEnabled = false;
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: REMINDER_NOTIFICATION_IDS.map(id => ({ id })) });
    } else {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const current = await LocalNotifications.checkPermissions();
      const permission = current.display === 'granted' ? current : await LocalNotifications.requestPermissions();
      if (permission.display !== 'granted') { this.player.reminderDenied = true; this.player.reminderEnabled = false; }
      else { this.player.reminderEnabled = true; this.player.reminderDenied = false; this.player.reminderAsked = true; }
    }
    this.reminderSyncedDay = null;
    this.persist(); this.settings();
  }
  private say(key: StringKey, params: Record<string, string | number> = {}) {
    this.speech = { key, params }; this.bubble.textContent = this.text(key, params);
    this.bubble.classList.remove('pop'); void this.bubble.offsetWidth; this.bubble.classList.add('pop');
  }
  private toast(key: StringKey, duration = 1900) {
    clearTimeout(this.toastTimer); this.toastLine.textContent = this.text(key);
    this.toastTimer = window.setTimeout(() => { this.toastLine.textContent = ''; }, duration);
  }
  private startLevel() {
    this.dailyDate = null;
    clearTimeout(this.bubbleTimer); this.busy = false; this.won = false;
    try { this.session = new GameSession(loadLevel(this.player.level)); } catch { this.toast('ui.loadingError', 10000); return; }
    this.session.restore(this.player.session);
    this.orderState = settleOrder(this.player, this.session).status;
    const level = this.session.level;
    if (level.level >= 2 && level.level <= 5 && !this.player.announced.includes(level.level)) {
      this.player.announced.push(level.level); this.persist(); this.say(`hassan.unlock${level.level}` as StringKey);
    } else if (level.level === 1) this.say('hassan.tut1');
    else if (level.level === 12) this.say('hassan.hidden12');
    else if (level.level > 1 && (level.level - 1) % 20 === 0) this.say(level.world === 0 ? 'hassan.world0again' : level.world === 1 ? 'hassan.world1' : 'hassan.world2');
    else if (level.order && this.orderState === 'waiting') this.say('hassan.order', { a: this.text(`spice.${level.order[0]}` as StringKey), b: this.text(`spice.${level.order[1]}` as StringKey) });
    else this.say(level.type === 'hard' ? 'hassan.hard' : level.type === 'rest' ? 'hassan.rest' : `hassan.normal.${1 + Math.floor(mulberry32(level.seed)() * 4)}` as StringKey);
    track('level_start', { level: level.level, type: level.type, order: this.orderState }); this.update(); this.persist();
    if (isWon(this.session.state())) this.win(); else this.maybeDaily();
  }
  private update(renderBoard = true) {
    document.documentElement.lang = this.player.locale; document.documentElement.dir = this.player.locale === 'ar' ? 'rtl' : 'ltr';
    document.title = this.text('app.name');
    const level = this.session.level;
    this.levelLabel.textContent = this.text('ui.level', { n: this.number(level.level) });
    this.movesLabel.textContent = this.text('ui.moves', { m: this.number(this.session.moves) }) + (level.level >= 2 ? ` · ${this.text('ui.target', { p: this.number(level.par) })}` : '');
    this.badge.hidden = level.type !== 'hard' && level.type !== 'rest'; this.badge.className = `level-badge ${level.type}`;
    this.badge.textContent = level.type === 'hard' ? this.text('ui.badge.hard') : level.type === 'rest' ? this.text('ui.badge.rest') : '';
    const daily = dailyStatus(this.player, this.now());
    this.dailyButton.classList.toggle('has-reward', daily.available && (!daily.claimed || !daily.completed));
    if (this.dailyDate !== null) { this.levelLabel.textContent = this.text('ui.daily.title'); this.badge.hidden = false; this.badge.className = 'level-badge rest'; this.badge.textContent = this.text('ui.badge.streak', { n: this.number(daily.streak) }); }
    this.coinPill.replaceChildren(); const img = el('img'); img.src = coin; img.alt = ''; this.coinPill.append(img, this.number(this.player.coins));
    this.coinPill.hidden = !unlocked(this.player, 'coins'); this.coinPill.setAttribute('aria-label', this.text('ui.coins', { n: this.number(this.player.coins) }));
    this.shopButton.hidden = !unlocked(this.player, 'shop'); this.dailyButton.hidden = !unlocked(this.player, 'daily');
    for (const [b, key] of [[this.shopButton, 'ui.shop'], [this.dailyButton, 'ui.daily'], [this.settingsButton, 'ui.settings']] as const) { b.title = this.text(key); b.setAttribute('aria-label', this.text(key)); b.disabled = this.blocked; }
    this.sign.disabled = this.blocked; this.signName.textContent = this.shopLabel(); this.sign.title = this.text('name.title.rename');
    this.signName.style.fontSize = `${this.shopLabel().length > 24 ? 13 : this.shopLabel().length > 19 ? 14 : 16}px`;
    this.signWorld.textContent = this.text('ui.world', { n: this.number(Math.floor((level.level - 1) / 20) + 1), name: this.text(`world.${level.world}` as StringKey) });
    if (this.dailyDate !== null) this.signWorld.textContent = this.text('ui.daily.title');
    this.drawMeta();
    this.bubble.textContent = this.text(this.speech.key, { ...this.speech.params, ...('shop' in this.speech.params ? { shop: this.shopLabel() } : {}),
      ...(this.speech.key === 'hassan.order' && level.order ? { a: this.text(`spice.${level.order[0]}` as StringKey), b: this.text(`spice.${level.order[1]}` as StringKey) } : {}) });
    this.toolbar.hidden = !unlocked(this.player, 'undo');
    const definitions = [
      { key: 'undo', title: 'ui.undo', badge: this.session.undoLeft > 0 ? this.number(this.session.undoLeft) : this.text('ui.ad'), run: () => this.undo() },
      { key: 'hint', title: 'ui.hint', badge: this.session.hintFree + this.player.hints > 0 ? this.number(this.session.hintFree + this.player.hints) : this.text('ui.ad'), run: () => void this.hint() },
      { key: 'extra', title: 'ui.extra', badge: this.session.extraJarUsed ? this.text('ui.used') : this.text('ui.ad'), run: () => this.session.extraJarUsed ? undefined : this.requestRewarded('extra_jar', 'reward.extra', () => { if (this.session.addExtraJar()) { this.update(); this.persist(); } }) },
      { key: 'restart', title: 'ui.restart', badge: '', run: () => this.restart() },
    ] as const;
    for (const d of definitions) {
      const b = this.toolbar.querySelector<HTMLButtonElement>(`[data-tool="${d.key}"]`) ?? el('button', 'tool-button'); b.type = 'button'; b.dataset.tool = d.key;
      b.hidden = !unlocked(this.player, d.key); b.disabled = this.blocked || this.won;
      b.replaceChildren(icon(d.key), el('span', '', this.text(d.title)));
      if (d.badge) b.append(el('small', 'tool-badge', d.badge));
      b.onclick = () => void this.afterMotion(d.run); if (!b.parentElement) this.toolbar.append(b);
    }
    if (renderBoard) void this.board.render({ session: this.session });
  }
  private drawJarControls(positions: JarPosition[]) {
    if (this.hits.children.length !== positions.length) this.hits.replaceChildren();
    positions.forEach((p, i) => {
      const b = this.hits.children[i] as HTMLButtonElement | undefined ?? el('button', 'jar-hit'); b.type = 'button'; b.dataset.jar = String(i);
      b.style.cssText = `left:${p.x}px;top:${p.y - 5}px;width:${p.width}px;height:${p.height + 10}px`;
      const contents = this.session.vessels[i].map(id => this.session.hidden.has(id) ? this.text('jar.hidden') : this.text(`spice.${this.session.level.layerSpices[id]}` as StringKey)).join(this.player.locale === 'ar' ? '، ' : ', ') || this.text('jar.empty');
      b.setAttribute('aria-label', this.text('jar.label', { n: this.number(i + 1), contents }) + (p.complete ? ` · ${this.text('jar.complete')}` : ''));
      b.setAttribute('aria-pressed', String(this.session.selected === i)); b.disabled = this.blocked || this.won;
      b.onclick = () => void this.tap(i);
      b.replaceChildren(el('span', `jar-caption ${p.complete ? 'complete' : ''}`, p.complete ? this.text(`spice.${this.session.state()[i][0]}` as StringKey) : this.number(i + 1)));
      if (!b.parentElement) this.hits.append(b);
    });
  }
  private async tap(index: number) {
    if (this.board.animating) { this.board.skip(); await this.activePour; }
    if (this.busy || this.won || this.dialog.open) return;
    clearTimeout(this.bubbleTimer); const result = this.session.tap(index);
    if (result.kind !== 'pour') {
      this.update();
      if (result.kind === 'select') this.board.play('select');
      if (result.kind === 'invalid') { this.vibrate(30); this.board.play('invalid'); this.board.shake(index); this.toast(`toast.${result.reason}` as StringKey); if (this.session.invalidTaps % 3 === 0) this.say('hassan.invalid'); }
      this.persist();
      return;
    }
    this.busy = true;
    this.vibrate(15);
    const orderChanged = this.checkOrder(); this.persist();
    const animation = this.board.render({ session: this.session, motion: result });
    this.update(false);
    this.activePour = (async () => {
      await animation;
      this.busy = false; this.update();
      if (result.won) { this.win(); return; }
      if (result.complete) { const r = mulberry32(this.session.level.seed * 101 + this.session.moves); if (!orderChanged && r() < .6) this.say(`hassan.praise.${1 + Math.floor(r() * 5)}` as StringKey); this.board.play('complete'); this.board.pulse(result.target); }
      if (result.stuck) { this.say('hassan.stuck'); this.stuck(); }
    })();
    await this.activePour;
  }
  private undo() {
    if (this.busy || this.won) return;
    const result = this.session.undo();
    if (result === 'empty') this.toast('toast.noUndo'); else if (result === 'ad') this.requestRewarded('undo', 'reward.undo', () => this.session.grantUndos()); else { this.checkOrder(); this.update(); this.persist(); }
  }
  private restart() {
    if (this.busy || this.won) return;
    this.session.restart(); this.checkOrder(); this.update(); this.persist(); this.toast('toast.restarted'); track('level_restart', { level: this.session.level.level, mode: 'level' });
  }
  private async hint() {
    if (this.busy || this.won) return;
    if (this.session.hintFree <= 0 && this.player.hints <= 0) { this.requestRewarded('hint', 'reward.hint', () => { this.player.hints++; }); return; }
    this.busy = true; this.update(); this.toast('ui.hintBusy', 5000);
    try {
      const result = this.session.applyHint(await findHint(this.session.state()), this.player.hints); this.player.hints = result.inventory;
      if (result.status === 'ok') { this.persist(); this.toast('toast.hint'); track('hint_used', { src: result.source! }); }
      else this.toast(result.status === 'unsolvable' ? 'toast.hintUnsolvable' : 'toast.hintNotFound');
    } catch { this.toast('toast.hintNotFound'); }
    finally { this.busy = false; this.update(); }
  }
  private win() {
    if (this.dailyDate !== null) { this.dailyWin(); return; }
    this.won = true;
    this.board.play('win');
    this.vibrate(40);
    const level = this.session.level, stars = starsForMoves(this.session.moves, level.par);
    const hadThreeStarWin = Object.values(this.player.stars).includes(3);
    const reward = grantWin(this.player, level.level, stars, level.type === 'hard');
    if (stars === 3 && !hadThreeStarWin) unlockPlayGamesAchievement('first_three_star');
    if (level.level === 50) unlockPlayGamesAchievement('levels_50');
    if (level.level === 100) unlockPlayGamesAchievement('levels_100');
    this.persist();
    track('level_complete', { level: level.level, moves: this.session.moves, par: level.par, stars, hints: this.session.usedHints, undos: this.session.usedUndos, order: this.orderState === 'delivered' ? 'done' : this.orderState === 'missed' ? 'missed' : 'none' });
    this.say(stars === 3 ? 'hassan.win3stars' : `hassan.win.${1 + Math.floor(mulberry32(level.seed * 7)() * 3)}` as StringKey, { shop: this.shopLabel() }); this.update();
    const card = this.open('win.title');
    card.append(el('div', 'stars', '★'.repeat(stars) + '☆'.repeat(3 - stars)), el('p', '', this.text('win.body', { n: this.number(level.level), m: this.number(this.session.moves), p: this.number(level.par) })), el('div', 'earn', this.text('win.coins', { c: this.number(reward) })));
    if (level.type === 'hard') card.append(el('p', 'note', this.text('win.hardNote')));
    this.rewardedThisWin = false;
    if (unlocked(this.player, 'double') && !this.player.monetization.doubledLevels.includes(level.level)) {
      const double = this.button('win.double', () => this.requestRewarded('double_coins', 'reward.double', () => {
        if (!markDoubleClaimed(this.player, level.level)) return;
        this.player.coins += reward; this.rewardedThisWin = true; double.disabled = true; double.textContent = this.text('win.doubled');
        this.update(false); this.persist();
      }, { c: this.number(reward) }), true); card.append(double);
    }
    const next = () => { void this.advanceAfterWin(level.level, stars, this.orderState === 'missed'); };
    card.append(this.button('win.next', next)); this.cancelModal = next;
  }
  private async advanceAfterWin(completedLevel: number, stars: number, missedOrder: boolean) {
    this.board.play('coin');
    const afterOffer = async () => {
      const eligible = shouldShowInterstitial(this.player, completedLevel, Date.now(), this.rewardedThisWin);
      let interstitialShown = false;
      if (eligible) {
        if (isNativeAdsPlatform) {
          if (await showInterstitialAd()) { interstitialShown = true; markInterstitialShown(this.player, Date.now()); track('interstitial_shown', { level: completedLevel }); }
        } else await this.mockInterstitial();
      }
      this.close(); this.startLevel();
      if (completedLevel === 1 && !this.player.nameAnswered && SHOP_NAME.timing === 'after_level_1') this.naming(true);
      if (isNativeAdsPlatform && stars === 3 && completedLevel >= 15 && !missedOrder && !this.rewardedThisWin && !interstitialShown) await this.requestInAppReview();
    };
    if (beginStarterOffer(this.player, completedLevel, Date.now())) {
      this.persist(); track('starter_offer_shown'); this.starterPack(afterOffer); return;
    }
    await afterOffer();
  }
  private async requestInAppReview() {
    const now = Date.now(), previous = this.player.reviewLastRequestedAt;
    if (previous !== null && now - previous < 30 * 24 * 60 * 60 * 1000) return;
    this.player.reviewLastRequestedAt = now; this.persist();
    try {
      const { InAppReview } = await import('@capacitor-community/in-app-review');
      await InAppReview.requestReview();
      track('review_requested');
    } catch { /* Review API availability and display are controlled by Google Play. */ }
  }
  private async requestRewarded(placement: 'undo' | 'hint' | 'extra_jar' | 'double_coins', rewardKey: StringKey, grant: () => void, params: Record<string, string | number> = {}) {
    const modal = el('dialog', 'modal'), card = el('div', 'modal-card');
    const close = () => { if (modal.open) modal.close(); };
    modal.append(card); document.body.append(modal);
    modal.addEventListener('close', () => modal.remove(), { once: true });
    modal.addEventListener('cancel', event => { event.preventDefault(); close(); });
    card.append(el('h2', '', this.text('rewarded.title')), el('p', '', this.text('rewarded.body', { reward: this.text(rewardKey, params) })));
    if (!isNativeAdsPlatform) card.append(el('p', 'note', this.text('reward.mockNote')));
    const cancel = this.button('rewarded.no', close, true), watch = this.button(isNativeAdsPlatform ? 'rewarded.claim' : 'reward.demo', () => {}, true);
    watch.onclick = async () => {
      watch.disabled = true; cancel.disabled = true;
      const sound = this.player.sound;
      this.board.configure(this.player.motion, sound, false);
      track('rewarded_offer', { placement });
      let earned = false;
      try { earned = await showRewardedAd(); }
      finally { this.board.configure(this.player.motion, sound, this.player.music); }
      close();
      if (earned) {
        grant(); this.persist(); this.update(false); track('rewarded_complete', { placement });
        if (placement === 'undo') this.toast('toast.undoAdded');
        else if (placement === 'extra_jar') this.toast('toast.extraAdded');
      } else this.toast('ad.unavailable');
    };
    card.append(watch, cancel); modal.showModal();
  }
  private async mockInterstitial() {
    const modal = el('dialog', 'modal'), card = el('div', 'modal-card');
    modal.append(card); document.body.append(modal);
    modal.addEventListener('close', () => modal.remove(), { once: true });
    modal.addEventListener('cancel', event => { event.preventDefault(); modal.close(); });
    card.append(el('h2', '', this.text('interstitial.mockTitle')), el('p', '', this.text('interstitial.mockBody')),
      this.button('interstitial.mockClose', () => { modal.close(); track('interstitial_shown', { level: this.player.level - 1 }); markInterstitialShown(this.player, Date.now()); this.persist(); }));
    modal.showModal();
    await new Promise<void>(resolve => modal.addEventListener('close', () => resolve(), { once: true }));
  }
  private stuck() {
    track('stuck_shown', { level: this.session.level.level, mode: 'level' });
    const card = this.open('stuck.title'); card.append(el('p', '', this.text('stuck.body')), this.button('stuck.undo', () => { this.close(); this.undo(); }));
    if (!this.session.extraJarUsed) card.append(this.button('stuck.extra', () => this.requestRewarded('extra_jar', 'reward.extra', () => {
      if (this.session.addExtraJar()) { this.close(); this.update(); this.persist(); }
    }), true));
    card.append(this.button('stuck.restart', () => { this.close(); this.restart(); }, true), this.button('ui.close', () => this.close(), true));
  }
  private open(title: StringKey) {
    this.dialog.dataset.kind = title;
    this.dialog.replaceChildren(); const card = el('div', 'modal-card'), h = el('h2', '', this.text(title));
    h.id = 'modal-title'; this.dialog.setAttribute('aria-labelledby', h.id); card.append(h); this.dialog.append(card);
    this.cancelModal = () => this.close(); if (!this.dialog.open) this.dialog.showModal(); return card;
  }
  private close() { this.dialog.close(); }
  private refreshDaily() {
    this.update(false);
    if (this.dialog.open && this.dialog.dataset.kind === 'daily.title') this.dailyHub();
  }
  private maybeDaily() {
    if (this.player.daily.completions >= 2 && !this.player.reminderAsked && !this.player.reminderDenied) { void this.askReminder(); return; }
    const status = dailyStatus(this.player, this.now());
    if (this.booting || this.busy || this.won || this.dailyDate !== null || this.dialog.open || !this.player.nameAnswered || !status.available || status.claimed || this.player.daily.hubShown === status.today) return;
    this.player.daily.hubShown = status.today; this.persist(); this.dailyHub();
  }
  private dailyHub() {
    if (!unlocked(this.player, 'daily')) return;
    this.persist();
    const card = this.open('daily.title');
    fillDailyHub(card, this.player, this.now(), {
      claim: () => {
        const reward = claimDaily(this.player, this.now());
        if (reward) { this.persist(); this.board.play('coin'); this.say(reward.tray ? 'hassan.day7' : 'hassan.dailyReward', { shop: this.shopLabel() }); track('daily_reward_claim', { day: reward.day }); if (this.player.owned.length === 8) unlockPlayGamesAchievement('all_decorations'); }
        this.update(false); this.dailyHub();
      },
      play: () => { if (this.dailyDate === dailySeed(this.now()) && !this.won) this.close(); else void this.startDaily(); },
      back: () => this.close(),
      ...(this.dailyDate !== null ? { leave: () => this.leaveDaily() } : {}),
    });
  }
  private async startDaily(snapshot?: unknown) {
    if (this.busy) return;
    const status = dailyStatus(this.player, this.now());
    if (!status.available || status.completed) { this.dailyHub(); return; }
    this.close(); this.busy = true; this.update(false); this.toast('ui.loading', 15000);
    try {
      const level = await loadDaily(status.today);
      const current = dailyStatus(this.player, this.now());
      if (current.today !== status.today || !current.available || current.completed) { this.busy = false; this.dailyHub(); return; }
      this.dailyDate = status.today; this.player.session = null; this.won = false; this.orderState = 'none';
      this.session = new GameSession(level); if (snapshot) this.session.restore(snapshot);
      this.say('hassan.dailyStart'); this.persist(); this.busy = false; this.update();
      track('daily_challenge_start', { date: status.today });
      if (isWon(this.session.state())) this.dailyWin();
    } catch { this.toast('ui.loadingError', 5000); }
    finally { this.busy = false; if (this.toastLine.textContent === this.text('ui.loading')) { clearTimeout(this.toastTimer); this.toastLine.textContent = ''; } this.update(); }
  }
  private leaveDaily() {
    this.close(); this.dailyDate = null; this.player.daily.run = null; this.player.session = null; this.startLevel();
  }
  private dailyWin() {
    if (this.dailyDate === null) return;
    const result = completeDaily(this.player, this.dailyDate, this.now());
    if (result && result.streak >= 7) unlockPlayGamesAchievement('streak_7');
    this.won = true; this.persist(); this.update();
    const card = this.open('dailyWin.title'), stars = starsForMoves(this.session.moves, this.session.level.par);
    card.append(el('div', 'stars', '★'.repeat(stars) + '☆'.repeat(3 - stars)));
    if (result) {
      this.board.play('win'); this.vibrate(40);
      this.say(result.streak === 1 ? 'hassan.streakFirst' : 'hassan.streakMore', { days: dayCount(this.player.locale, result.streak) });
      card.append(el('p', '', this.text('dailyWin.body', { m: this.number(this.session.moves), days: dayCount(this.player.locale, result.streak), best: dayCount(this.player.locale, result.best) })), el('div', 'earn', this.text('win.coins', { c: this.number(result.reward) })));
      track('daily_challenge_complete', { streak: result.streak, moves: this.session.moves, stars });
    } else {
      const status = dailyStatus(this.player, this.now());
      card.append(el('p', '', this.text(!status.clockOK ? 'daily.clockBlocked' : status.completed ? 'daily.done' : 'daily.expired')));
      if (!status.clockOK && status.today === this.dailyDate) card.append(this.button('daily.retry', () => this.dailyWin(), true));
    }
    card.append(this.button('dailyWin.back', () => this.leaveDaily())); this.cancelModal = () => this.leaveDaily();
  }
  private checkOrder() {
    if (this.dailyDate !== null) return false;
    const previous = this.orderState, result = settleOrder(this.player, this.session);
    this.orderState = result.status;
    if (result.reward) { this.board.play('coin'); this.say('hassan.orderDone', { coins: this.number(result.reward) }); track('order_complete', { level: this.session.level.level, reward: result.reward }); if (this.player.orderRewards.length === 20) unlockPlayGamesAchievement('orders_20'); }
    else if (result.status === 'missed' && previous !== 'missed') { this.say('hassan.orderMissed'); track('order_fail', { level: this.session.level.level }); }
    return previous !== result.status;
  }
  private drawMeta() {
    const theme = activeTheme(this.player.theme, this.previewDate);
    if (theme !== this.shownTheme) { this.shownTheme = theme; this.say(`hassan.theme.${theme}`); }
    document.body.dataset.theme = theme;
    this.seasonal.hidden = theme === 'normal'; this.seasonal.replaceChildren();
    if (theme !== 'normal') {
      this.seasonal.append(garland(theme));
      this.signWorld.textContent = `${this.text(`greet.${theme}`)} · ${this.signWorld.textContent}`;
    }
    this.sign.classList.toggle('brass-sign', this.player.owned.includes('sign'));
    this.hangingA.replaceChildren(); this.hangingB.replaceChildren();
    if (this.player.owned.includes('lantern')) this.hangingA.append(art('lantern', this.text('item.lantern')));
    if (this.player.owned.includes('chili')) this.hangingB.append(art('chili', this.text('item.chili')));
    this.counter.hidden = !unlocked(this.player, 'shop'); this.counter.replaceChildren();
    for (const item of ['plant', 'scale', 'tray', 'radio', 'cat'] as const) {
      if (!this.player.owned.includes(item)) continue;
      if (item === 'cat') {
        const cat = el('button', 'cat'); cat.setAttribute('aria-label', this.text('item.cat')); cat.append(art('cat'));
        cat.onclick = () => void this.afterMotion(() => { this.board.play('cat'); this.say('hassan.cat'); }); this.counter.append(cat);
      } else this.counter.append(art(item, this.text(`item.${item}`)));
    }
    if (theme === 'spring') this.counter.append(art('eggs', this.text('theme.spring')));
    if (!this.player.owned.length) this.counter.append(el('p', 'note', this.text('ui.counterEmpty')));
    this.orderCard.replaceChildren(); const order = this.session.level.order;
    this.orderCard.hidden = !order;
    if (order) {
      const info = el('div', 'order-info'), title = el('div', 'order-title');
      const statusKey = this.orderState === 'delivered' ? 'done' : this.orderState === 'missed' ? 'missed' : 'waiting';
      title.append(el('strong', '', this.text('order.title')), el('span', `order-status ${statusKey}`, this.text(`order.${statusKey}`)));
      const items = el('div', 'order-items'), state = this.session.state();
      for (const id of order) {
        const item = el('span', 'order-item');
        item.append(spiceArt(id), this.text(`spice.${id}` as StringKey));
        if (state.some(v => isComplete(v) && v[0] === id)) item.append(el('span', 'order-check', '✓'));
        items.append(item);
      }
      info.append(title, items, el('small', '', this.text('order.sub', { coins: this.number(order.length * ORDERS.rewardPerSpice * (this.session.level.type === 'hard' ? 2 : 1)) })));
      this.orderCard.append(art('customer'), info);
    }
  }
  private shop() {
    const card = this.open('shop.title'); card.querySelector('h2')!.textContent = this.text('shop.title', { shop: this.shopLabel() });
    card.append(el('p', 'shop-balance', this.text('shop.balance', { c: this.number(this.player.coins) })), el('p', 'note', this.text('shop.note')));
    for (const item of Object.keys(SHOP_PRICES) as ShopItem[]) {
      const owned = this.player.owned.includes(item), price = SHOP_PRICES[item], row = el('div', 'shop-item'), info = el('div');
      info.append(el('strong', '', this.text(`item.${item}`)), el('small', '', owned ? this.text('shop.owned') : this.text('ui.coins', { n: this.number(price) })));
      const buy = this.button(owned ? 'shop.owned' : 'shop.buy', () => {
        if (!buyDecoration(this.player, item)) return;
        this.persist(); this.board.play('coin'); this.say('hassan.purchase', { shop: this.shopLabel() }); this.update(false); this.shop(); track('shop_purchase', { item, price });
        if (this.player.owned.length === 8) unlockPlayGamesAchievement('all_decorations');
      });
      buy.disabled = owned || this.player.coins < price;
      if (!owned && this.player.coins < price) buy.textContent = this.text('shop.need', { c: this.number(price - this.player.coins) });
      row.append(art(item), info, buy); card.append(row);
    }
    card.append(el('p', 'note', this.text('shop.hintsHave', { n: this.number(this.player.hints) })));
    if (starterOfferAvailable(this.player, Date.now())) card.append(this.button('shop.starter', () => this.starterPack(() => this.shop()), true), el('p', 'note', this.text('starter.timer', { h: this.number(Math.ceil((this.player.monetization.starterOfferExpiresAt! - Date.now()) / 3_600_000)) })));
    else if (this.player.monetization.starterPurchased) card.append(el('p', 'note', this.text('starter.owned')));
    card.append(el('h3', '', this.text('shop.realProducts')));
    card.append(this.purchaseButton('shop.hints', 'hints_10'), this.purchaseButton('shop.removeAds', 'remove_ads'));
    card.append(el('p', 'note', this.text(isNativeAdsPlatform ? 'ui.purchasesLater' : 'shop.mockNote')), this.button('shop.back', () => this.close()));
  }
  private purchaseButton(label: StringKey, product: 'hints_10' | 'remove_ads') {
    const button = this.button(label, () => {}, true);
    const owned = product === 'remove_ads' && this.player.monetization.removeAds;
    button.disabled = isNativeAdsPlatform || owned;
    if (owned) button.textContent = this.text('shop.owned');
    else if (!isNativeAdsPlatform) button.textContent = `${this.text(label)} · ${this.text('shop.mock')}`;
    button.onclick = () => {
      if (isNativeAdsPlatform) return;
      if (product === 'hints_10') this.player.hints += 10;
      else this.player.monetization.removeAds = true;
      this.persist(); this.update(false); this.shop();
    };
    return button;
  }
  private starterPack(after: () => void) {
    const card = this.open('starter.title');
    const items = el('ul', 'starter-items');
    for (const key of ['starter.item1', 'starter.item2', 'starter.item3'] as const) items.append(el('li', '', this.text(key)));
    card.append(el('p', '', this.text('starter.body')), items);
    const expiresAt = this.player.monetization.starterOfferExpiresAt ?? 0;
    card.append(el('p', 'note', starterOfferAvailable(this.player, Date.now()) ? this.text('starter.timer', { h: this.number(Math.ceil((expiresAt - Date.now()) / 3_600_000)) }) : this.text('starter.expired')));
    const later = () => { this.close(); void after(); };
    const buy = this.button(isNativeAdsPlatform ? 'starter.buy' : 'starter.demoBuy', () => {
      if (isNativeAdsPlatform || !mockBuyStarterPack(this.player, Date.now())) return;
      this.persist(); this.say('hassan.starterThanks'); this.update(false); this.close();
      void after();
    });
    buy.disabled = isNativeAdsPlatform || !starterOfferAvailable(this.player, Date.now());
    card.append(buy, this.button('starter.later', later, true)); this.cancelModal = later;
  }
  private async privacyOptions() {
    if (isNativeAdsPlatform) {
      if (!await showPrivacyOptions()) this.toast('ad.unavailable');
    } else this.infoModal('settings.privacy', 'privacy.mockBody');
  }
  private infoModal(title: StringKey, body: StringKey) {
    const card = this.open(title); card.append(el('p', '', this.text(body)), this.button('ui.close', () => this.close()));
  }
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
    for (const key of ['sound', 'motion', 'haptics'] as const) {
      const toggle = el('button', 'cta secondary', `${this.text(`settings.${key}`)}: ${this.text(this.player[key] ? 'settings.on' : 'settings.off')}`);
      toggle.setAttribute('aria-pressed', String(this.player[key]));
      toggle.onclick = () => { this.player[key] = !this.player[key]; this.board.configure(this.player.motion, this.player.sound, this.player.music); this.persist(); this.update(); this.settings(); };
      card.append(toggle);
    }
    const music = el('button', 'cta secondary', `${this.text('settings.music')}: ${this.text(this.player.music ? 'settings.on' : 'settings.off')}`);
    music.setAttribute('aria-pressed', String(this.player.music)); music.disabled = !import.meta.env.DEV;
    music.onclick = () => { this.player.music = !this.player.music; this.board.configure(this.player.motion, this.player.sound, this.player.music); this.persist(); this.settings(); };
    card.append(music, el('p', 'note', this.text(import.meta.env.DEV ? 'settings.musicPreview' : 'settings.musicLater')));
    card.append(el('h3', '', this.text('settings.theme')));
    const choices = el('div', 'language-options');
    for (const theme of themes) {
      const b = el('button', `chip ${this.player.theme === theme ? 'active' : ''}`, this.text(`theme.${theme}`)); b.setAttribute('aria-pressed', String(this.player.theme === theme));
      b.onclick = () => { this.player.theme = theme; this.persist(); this.say(`hassan.theme.${activeTheme(theme)}`); track('theme_change', { theme }); this.update(); this.settings(); }; choices.append(b);
    }
    card.append(choices);
    const languages = el('div', 'language-options');
    for (const locale of ['ar', 'en'] as const) {
      const b = el('button', `chip ${this.player.locale === locale ? 'active' : ''}`, t(locale, 'ui.languageName')); b.setAttribute('aria-pressed', String(locale === this.player.locale));
      b.onclick = () => { this.player.locale = locale; this.persist(); this.update(); this.settings(); }; languages.append(b);
    }
    card.append(el('h3', '', this.text('ui.language')), languages, el('h3', '', this.text('ui.help')), el('p', '', this.text('ui.helpBody')));
    for (const key of ['settings.reminder', 'settings.privacy', 'settings.restore', 'settings.playGames'] as const) {
      const button = this.button(key, () => { if (key === 'settings.privacy') void this.privacyOptions(); else if (key === 'settings.reminder') void this.toggleReminder(); else if (key === 'settings.playGames') showPlayGamesAchievements(); else this.infoModal(key, 'ui.servicesLater'); }, true);
      if (key === 'settings.reminder') { button.setAttribute('aria-pressed', String(this.player.reminderEnabled)); button.textContent += `: ${this.text(this.player.reminderEnabled ? 'settings.on' : 'settings.off')}`; }
      else if (key === 'settings.restore') button.disabled = true;
      card.append(button);
    }
    card.append(el('p', 'note', this.text('ui.servicesLater')), el('p', 'note', this.text('settings.version', { v: '0.1.0' })), this.button('ui.close', () => this.close()));
  }
}
