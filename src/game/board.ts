import Phaser from 'phaser';
import { SPICES } from '../content/spices';
import { pileLayout } from '../core/piles';
import { isComplete } from '../core/rules';
import { MOTION } from '../config';
import { CompletionGate, easeInOut, flightFrames, flightStagger, landingScale, rotatePoint, sampleFlight } from '../core/flight';
import type { FlightFrame } from '../core/flight';
import { EFFECTS, wavUrl } from '../services/synth';
import type { Effect } from '../services/synth';
import type { GameSession } from '../core/session';

const assets = import.meta.glob<string>('../../assets/svg/spice_*.svg', { eager: true, query: '?url&no-inline', import: 'default' });
export interface JarPosition { x: number; y: number; width: number; height: number; complete: boolean }
export interface BoardView { session: GameSession; motion?: { moved: number[]; source: number; target: number } }
interface Piece { image?: Phaser.GameObjects.Image; x: number; y: number; size: number; rotation: number; spice: number }
interface Flight { sprite: Phaser.GameObjects.Image; target: Piece; frames: FlightFrame[]; delay: number; landed: boolean }
export interface MotionMetrics { pieces: number; fps: number; p95FrameMs: number; durationMs: number; skipped: boolean; motion: boolean; poolSize: number }
interface ActiveMotion {
  view: BoardView; before: Map<number, Piece[]>; origin: JarPosition; tilt: number;
  startedAt: number; lastFrame: number; deltas: number[]; flights: Flight[];
  startedFlight: boolean; reduced: boolean; gate: CompletionGate; pieces: number;
}

class BoardScene extends Phaser.Scene {
  ready = false;
  view: BoardView | null = null;
  positions: JarPosition[] = [];
  jars: Phaser.GameObjects.Container[] = [];
  onLayout: (positions: JarPosition[], height: number) => void = () => {};
  onReady: () => void = () => {};
  onMetrics: (metrics: MotionMetrics) => void = () => {};
  motionEnabled = true;
  soundEnabled = true;
  private root?: Phaser.GameObjects.Container;
  private pieces = new Map<number, Piece[]>();
  private layers = new Map<number, { container: Phaser.GameObjects.Container; y: number }>();
  private pool: Phaser.GameObjects.Image[] = [];
  private activeMotion: ActiveMotion | null = null;
  private lastLanding = -Infinity;
  private soundCounter = 0;
  constructor() { super('Board'); }
  get animating() { return this.activeMotion !== null; }
  preload() {
    const textureSize = Math.ceil(40 * Math.max(1, Math.min(4, window.devicePixelRatio || 1)));
    for (const spice of SPICES) this.load.svg(`spice-${spice.id}`, assets[`../../assets/svg/${spice.asset}`], { width: textureSize, height: textureSize });
    for (const effect of EFFECTS) this.load.audio(effect, wavUrl(effect));
  }
  create() {
    for (let i = 0; i < MOTION.poolSize; i++) this.pool.push(this.add.image(0, 0, 'spice-2').setDepth(100).setVisible(false).setActive(false));
    this.ready = true; this.onReady();
  }
  unlockAudio() {
    if (this.sound instanceof Phaser.Sound.WebAudioSoundManager && this.sound.context.state === 'suspended') void this.sound.context.resume().catch(() => {});
  }
  play(effect: Effect) {
    if (!this.ready || !this.soundEnabled || document.hidden || !this.cache.audio.exists(effect)) return;
    const landing = effect === 'hard' || effect === 'soft', now = performance.now();
    if (landing && now - this.lastLanding < MOTION.landingSoundGapMs) return;
    if (landing) this.lastLanding = now;
    // Deterministic pitch variation avoids allocating a RNG in the landing loop.
    const rate = landing ? .94 + ((this.soundCounter++ * 17) % 13) / 100 : 1;
    this.sound.play(effect, { volume: landing ? .24 : .3, rate });
  }
  configure(motion: boolean, sound: boolean) { this.motionEnabled = motion; this.soundEnabled = sound; if (!sound && this.ready) this.sound.stopAll(); }
  pauseAudio() { if (this.ready) this.sound.stopAll(); }
  render(view: BoardView): Promise<void> {
    if (!this.ready) { this.view = view; return Promise.resolve(); }
    this.finishMotion(true);
    if (!view.motion || !this.positions[view.motion.source]) { this.draw(view); return Promise.resolve(); }
    const origin = { ...this.positions[view.motion.source] }, target = this.positions[view.motion.target];
    const before = new Map(this.pieces), tilt = target.x < origin.x ? -MOTION.tiltDegrees : MOTION.tiltDegrees;
    return new Promise(resolve => {
      const now = performance.now();
      this.activeMotion = { view, before, origin, tilt, startedAt: now, lastFrame: now, deltas: [], flights: [], startedFlight: false,
        reduced: !this.motionEnabled, gate: new CompletionGate(resolve), pieces: view.motion!.moved.reduce((n, id) => n + SPICES[view.session.level.layerSpices[id]].count, 0) };
      this.play('pour');
      if (!this.motionEnabled) this.beginFlight(this.activeMotion);
    });
  }
  private draw(view: BoardView, moving = new Set<number>()) {
    this.view = { session: view.session };
    this.tweens.killAll(); this.root?.destroy(true); this.root = this.add.container(0, 0);
    this.jars = []; this.positions = []; this.pieces.clear(); this.layers.clear();
    const { session } = view, count = session.vessels.length, width = this.scale.width;
    const rows = count <= 5 ? 1 : count > 10 && width < 440 ? 3 : 2, perRow = Math.ceil(count / rows);
    const jarW = Math.max(34, Math.min(rows === 3 ? 52 : 60, Math.floor((Math.min(width, 520) - 40 - (perRow - 1) * 10) / perRow)));
    const jarH = jarW * (rows === 3 ? 2.3 : 2.55), layerH = Math.floor((jarH - 16) / 4), height = rows * (jarH + 52) + 38;
    if (this.scale.height !== height) this.scale.resize(width, height);
    const state = session.state(), shelf = this.add.graphics(); this.root.add(shelf);
    for (let row = 0; row < rows; row++) {
      const y = 38 + row * (jarH + 52) + jarH;
      shelf.fillStyle(0x080605, .4).fillRoundedRect(10, y + 12, width - 20, 16, 5);
      shelf.fillStyle(0x6a4226).fillRoundedRect(6, y, width - 12, 12, 3);
      shelf.lineStyle(1, 0xb5894c, .65).lineBetween(9, y + 1, width - 9, y + 1);
      shelf.lineStyle(1, 0x2a190f, .5).lineBetween(14, y + 7, width - 14, y + 7);
    }
    session.vessels.forEach((ids, i) => {
      const row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, count - row * perRow);
      const x = (width - (inRow * jarW + (inRow - 1) * 10)) / 2 + col * (jarW + 10);
      const highlighted = session.selected === i || (session.selected === null && session.hintPair?.[0] === i);
      const y = 38 + row * (jarH + 52) - (highlighted ? 18 : 0), complete = isComplete(state[i]);
      const container = this.add.container(x, y); this.root!.add(container); this.jars.push(container);
      this.positions.push({ x, y, width: jarW, height: jarH, complete });
      const back = this.add.graphics(); container.add(back);
      if (highlighted || session.hintPair?.[1] === i) {
        back.fillStyle(0xf0c674, .13).fillRoundedRect(-4, -5, jarW + 8, jarH + 9, 14);
        back.lineStyle(2, 0xf0c674, .85).strokeRoundedRect(-3, -4, jarW + 6, jarH + 7, 13);
        if (this.motionEnabled) this.tweens.add({ targets: back, alpha: .5, duration: 650, yoyo: true, repeat: -1 });
      }
      const world = session.level.world;
      back.fillStyle(world === 1 ? 0x9e794b : world === 2 ? 0xa66d25 : 0xcbd5d4, world ? .65 : .1).fillRoundedRect(0, 0, jarW, jarH, { tl: 5, tr: 5, bl: 13, br: 13 });
      if (world === 1) {
        back.lineStyle(1, 0x302314, .35);
        for (let x = 4; x < jarW; x += 6) back.lineBetween(x, 10, x, jarH - 8);
        for (let y = 12; y < jarH - 8; y += 6) back.lineBetween(3, y, jarW - 3, y);
      }
      ids.forEach((id, index) => {
        const spice = session.level.layerSpices[id], data = SPICES[spice], layerY = jarH - 8 - (index + 1) * layerH;
        const layer = this.add.container(3, layerY); container.add(layer); this.layers.set(id, { container: layer, y: layerY });
        const band = this.add.graphics(); layer.add(band);
        band.fillStyle(session.hidden.has(id) ? 0x3b2f27 : Number.parseInt(data.color.slice(1), 16), session.hidden.has(id) ? 1 : .38).fillRect(0, 0, jarW - 6, layerH);
        if (session.hidden.has(id)) {
          band.lineStyle(1, 0x8c7350, .35);
          for (let sx = 0; sx < jarW - 6; sx += 7) band.lineBetween(sx, layerH, Math.min(jarW - 6, sx + 9), 0);
          layer.add(this.add.text((jarW - 6) / 2, layerH / 2, '؟', { fontFamily: 'Cairo', fontSize: `${Math.floor(layerH * .65)}px`, color: '#f0c674' }).setOrigin(.5));
        }
        const records: Piece[] = [];
        for (const piece of pileLayout(id, session.level.seed, spice, layerH)) {
          const size = Math.min(piece.size, layerH * 1.1, jarW - 8);
          const px = Math.max(size / 2, Math.min(jarW - 6 - size / 2, piece.xPercent / 100 * (jarW - 6)));
          const py = Math.max(size / 2, Math.min(layerH - size / 2, piece.yPercent / 100 * layerH));
          let image: Phaser.GameObjects.Image | undefined;
          if (!session.hidden.has(id)) {
            image = this.add.image(px, py, `spice-${spice}`).setDisplaySize(size, size).setAngle(piece.rotation).setVisible(!moving.has(id)); layer.add(image);
          }
          records.push({ image, x: px + 3, y: layerY + py, size, rotation: piece.rotation, spice });
        }
        this.pieces.set(id, records);
      });
      const front = this.add.graphics(); container.add(front);
      const sealed = complete && !ids.some(id => moving.has(id));
      front.lineStyle(1.5, sealed ? 0xf0c674 : world ? 0xb99155 : 0xbdcecd, sealed ? .9 : .55).strokeRoundedRect(0, 0, jarW, jarH, { tl: 5, tr: 5, bl: 13, br: 13 });
      if (world !== 1) front.fillStyle(0xffffff, world === 2 ? .2 : .1).fillRoundedRect(5, 13, 4, jarH - 30, 2);
      if (world === 1) {
        front.lineStyle(sealed ? 4 : 7, sealed ? 0xd4a24c : 0xc39a62).strokeRoundedRect(-1, -3, jarW + 2, 8, 4);
        if (sealed) { front.lineBetween(jarW / 2 - 7, 0, jarW / 2 + 7, 7); front.lineBetween(jarW / 2 + 7, 0, jarW / 2 - 7, 7); }
      } else if (world === 2) {
        front.fillStyle(sealed ? 0xf0c674 : 0xbb8b3f).fillEllipse(jarW / 2, -2, jarW + 4, 18);
        front.fillStyle(sealed ? 0xffdfa0 : 0xd4a24c).fillCircle(jarW / 2, -12, 4);
      } else {
        front.fillStyle(sealed ? 0xd4a24c : 0x898d88).fillRoundedRect(-2, -4, jarW + 4, 10, 3);
        front.lineStyle(1, sealed ? 0xffdfa0 : 0xc9ceca, .55).lineBetween(1, -2, jarW - 1, -2);
      }
    });
    this.onLayout(this.positions, height);
  }
  private beginFlight(active: ActiveMotion) {
    const motion = active.view.motion!;
    active.startedFlight = true; this.draw(active.view, new Set(motion.moved));
    if (active.reduced) {
      for (const id of motion.moved) {
        const layer = this.layers.get(id)!; layer.container.y = layer.y - MOTION.dropHeight;
        this.pieces.get(id)!.forEach(p => p.image?.setVisible(true));
      }
      return;
    }
    const origin = { x: active.origin.x + Math.sign(active.tilt) * 8, y: active.origin.y - 24 };
    this.jars[motion.source].setPosition(origin.x, origin.y).setAngle(active.tilt);
    const sourceMouth = rotatePoint({ x: active.origin.width / 2, y: 0 }, origin, active.tilt);
    const targetJar = this.positions[motion.target], targetMouth = { x: targetJar.x + targetJar.width / 2, y: targetJar.y };
    let index = 0;
    for (const id of motion.moved) {
      const targets = this.pieces.get(id)!, sources = active.before.get(id)!;
      targets.forEach((target, pieceIndex) => {
        const source = sources[pieceIndex], sprite = this.pool[index];
        const start = rotatePoint({ x: source.x, y: source.y }, origin, active.tilt);
        const end = { x: targetJar.x + target.x, y: targetJar.y + target.y };
        sprite.setTexture(`spice-${target.spice}`).setDisplaySize(target.size, target.size).setActive(true).setVisible(false);
        active.flights.push({ sprite, target, frames: flightFrames(start, end, sourceMouth, targetMouth, target.rotation, active.tilt, active.view.session.level.seed * 997 + id * 31 + pieceIndex), delay: index * flightStagger(active.pieces), landed: false });
        index++;
      });
    }
  }
  update() {
    const a = this.activeMotion; if (!a) return;
    const now = performance.now(), elapsed = now - a.startedAt;
    a.deltas.push(now - a.lastFrame); a.lastFrame = now;
    const motion = a.view.motion!;
    if (a.reduced) {
      motion.moved.forEach((id, i) => {
        const layer = this.layers.get(id)!, t = Math.max(0, Math.min(1, (elapsed - i * MOTION.dropStaggerMs) / MOTION.dropMs));
        layer.container.y = layer.y - MOTION.dropHeight * (1 - easeInOut(t));
      });
      if (elapsed >= MOTION.dropMs + (motion.moved.length - 1) * MOTION.dropStaggerMs) this.finishMotion(false);
      return;
    }
    if (!a.startedFlight) {
      const t = easeInOut(Math.min(1, elapsed / MOTION.leadMs));
      this.jars[motion.source].setPosition(a.origin.x + Math.sign(a.tilt) * 8 * t, a.origin.y - 24 * t).setAngle(a.tilt * t);
      if (elapsed < MOTION.leadMs) return;
      this.beginFlight(a);
    }
    let settled = true;
    for (const f of a.flights) {
      const flightTime = elapsed - MOTION.leadMs - f.delay;
      if (flightTime < 0) { settled = false; continue; }
      if (flightTime < MOTION.flightMs) {
        settled = false;
        const point = sampleFlight(f.frames, flightTime / MOTION.flightMs);
        f.sprite.setVisible(true).setPosition(point.x, point.y).setAngle(point.rotation);
      } else {
        if (!f.landed) { f.landed = true; f.sprite.setVisible(false).setActive(false); f.target.image?.setVisible(true); this.play(SPICES[f.target.spice].material); }
        const bounce = (flightTime - MOTION.flightMs) / MOTION.bounceMs;
        const size = f.target.size * landingScale(bounce); f.target.image?.setDisplaySize(size, size);
        if (bounce < 1) settled = false;
      }
    }
    if (settled) this.finishMotion(false);
  }
  finishMotion(skipped: boolean) {
    const a = this.activeMotion; if (!a) return;
    this.activeMotion = null;
    this.pool.forEach(sprite => sprite.setVisible(false).setActive(false));
    this.draw({ session: a.view.session });
    const deltas = a.deltas.filter(x => x > 0).sort((x, y) => x - y);
    const total = deltas.reduce((x, y) => x + y, 0);
    this.onMetrics({ pieces: a.pieces, durationMs: performance.now() - a.startedAt, fps: total ? deltas.length * 1000 / total : 0,
      p95FrameMs: deltas[Math.floor((deltas.length - 1) * .95)] ?? 0, skipped, motion: !a.reduced, poolSize: this.pool.length });
    a.gate.finish();
  }
  pulse(index: number) {
    const jar = this.jars[index];
    if (jar && this.motionEnabled) this.tweens.add({ targets: jar, alpha: .5, duration: 300, yoyo: true });
  }
  shake(index: number) {
    const jar = this.jars[index];
    if (jar && this.motionEnabled) this.tweens.add({ targets: jar, x: jar.x + 5, duration: 45, yoyo: true, repeat: 3 });
  }
}

export class Board {
  private readonly scene = new BoardScene();
  private readonly game: Phaser.Game;
  private readonly observer: ResizeObserver;
  private pending: BoardView | null = null;
  readonly ready: Promise<void>;
  onMetrics: (metrics: MotionMetrics) => void = () => {};
  private readonly visibility = () => { if (document.hidden) { this.skip(); this.scene.pauseAudio(); } };
  constructor(host: HTMLElement, onLayout: (positions: JarPosition[], height: number) => void) {
    this.scene.onLayout = onLayout; this.scene.onMetrics = metrics => this.onMetrics(metrics);
    this.ready = new Promise(resolve => { this.scene.onReady = () => { if (this.pending) void this.scene.render(this.pending); resolve(); }; });
    this.game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth || 480, height: 250, transparent: true, scene: this.scene, banner: false, render: { antialias: true } });
    this.observer = new ResizeObserver(() => {
      if (!this.scene.ready || host.clientWidth < 1 || this.scene.scale.width === Math.round(host.clientWidth)) return;
      this.skip(); this.scene.scale.resize(Math.round(host.clientWidth), this.scene.scale.height);
      if (this.pending) void this.scene.render(this.pending);
    });
    this.observer.observe(host); document.addEventListener('visibilitychange', this.visibility);
  }
  get animating() { return this.scene.animating; }
  configure(motion: boolean, sound: boolean) { this.scene.configure(motion, sound); }
  render(view: BoardView): Promise<void> { this.pending = { session: view.session }; return this.scene.render(view); }
  skip() { this.scene.finishMotion(true); }
  unlockAudio() { this.scene.unlockAudio(); }
  play(effect: Effect) { this.scene.play(effect); }
  pulse(index: number) { this.scene.pulse(index); }
  shake(index: number) { this.scene.shake(index); }
  destroy() { this.skip(); this.observer.disconnect(); document.removeEventListener('visibilitychange', this.visibility); this.game.destroy(true); }
}
