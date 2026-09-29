import Phaser from 'phaser';
import { SPICES } from '../content/spices';
import { pileLayout } from '../core/piles';
import { isComplete } from '../core/rules';
import type { GameSession } from '../core/session';

const assets = import.meta.glob<string>('../../assets/svg/spice_*.svg', { eager: true, query: '?url&no-inline', import: 'default' });
export interface JarPosition { x: number; y: number; width: number; height: number; complete: boolean }
export interface BoardView { session: GameSession; motion?: { moved: number[]; target: number } }

class BoardScene extends Phaser.Scene {
  ready = false;
  view: BoardView | null = null;
  positions: JarPosition[] = [];
  jars: Phaser.GameObjects.Container[] = [];
  onLayout: (positions: JarPosition[], height: number) => void = () => {};
  onReady: () => void = () => {};
  private completeMotion: (() => void) | null = null;
  constructor() { super('Board'); }
  preload() {
    for (const spice of SPICES) {
      const url = assets[`../../assets/svg/${spice.asset}`];
      this.load.svg(`spice-${spice.id}`, url, { width: 100, height: 100 });
    }
  }
  create() { this.ready = true; this.onReady(); }
  finishMotion() {
    this.tweens.killAll();
    this.completeMotion?.(); this.completeMotion = null;
  }
  render(view: BoardView): Promise<void> {
    this.view = view;
    if (!this.ready) return Promise.resolve();
    this.finishMotion();
    this.children.removeAll(true);
    this.jars = []; this.positions = [];
    const { session } = view, count = session.vessels.length;
    const width = this.scale.width;
    const rows = count <= 5 ? 1 : count > 10 && width < 440 ? 3 : 2;
    const perRow = Math.ceil(count / rows);
    const jarW = Math.max(34, Math.min(rows === 3 ? 52 : 60, Math.floor((Math.min(width, 520) - 40 - (perRow - 1) * 10) / perRow)));
    const jarH = jarW * (rows === 3 ? 2.3 : 2.55), layerH = Math.floor((jarH - 16) / 4);
    const height = rows * (jarH + 52) + 38;
    if (this.scale.height !== height) this.scale.resize(width, height);
    const state = session.state();
    const motionObjects: { object: Phaser.GameObjects.Container; y: number; delay: number }[] = [];
    const shelf = this.add.graphics();
    for (let row = 0; row < rows; row++) {
      const y = 38 + row * (jarH + 52) + jarH;
      shelf.fillStyle(0x080605, 0.4).fillRoundedRect(10, y + 12, width - 20, 16, 5);
      shelf.fillStyle(0x6a4226).fillRoundedRect(6, y, width - 12, 12, 3);
      shelf.lineStyle(1, 0xb5894c, 0.65).lineBetween(9, y + 1, width - 9, y + 1);
      shelf.lineStyle(1, 0x2a190f, 0.5).lineBetween(14, y + 7, width - 14, y + 7);
    }
    session.vessels.forEach((ids, i) => {
      const row = Math.floor(i / perRow), col = i % perRow;
      const inRow = Math.min(perRow, count - row * perRow);
      const startX = (width - (inRow * jarW + (inRow - 1) * 10)) / 2;
      const x = startX + col * (jarW + 10), baseY = 38 + row * (jarH + 52);
      const highlighted = session.selected === i || (session.selected === null && session.hintPair?.[0] === i);
      const y = baseY - (highlighted ? 18 : 0), complete = isComplete(state[i]);
      const container = this.add.container(x, y); this.jars.push(container);
      this.positions.push({ x, y, width: jarW, height: jarH, complete });
      const back = this.add.graphics(); container.add(back);
      if (highlighted || session.hintPair?.[1] === i) {
        back.fillStyle(0xf0c674, 0.13).fillRoundedRect(-4, -5, jarW + 8, jarH + 9, 14);
        back.lineStyle(2, 0xf0c674, 0.85).strokeRoundedRect(-3, -4, jarW + 6, jarH + 7, 13);
        this.tweens.add({ targets: back, alpha: 0.5, duration: 650, yoyo: true, repeat: -1 });
      }
      back.fillStyle(0xcbd5d4, 0.1).fillRoundedRect(0, 0, jarW, jarH, { tl: 5, tr: 5, bl: 13, br: 13 });
      ids.forEach((id, index) => {
        const spice = session.level.layerSpices[id], data = SPICES[spice];
        const layerY = jarH - 8 - (index + 1) * layerH;
        const layer = this.add.container(3, layerY); container.add(layer);
        const band = this.add.graphics(); layer.add(band);
        band.fillStyle(session.hidden.has(id) ? 0x3b2f27 : Number.parseInt(data.color.slice(1), 16), session.hidden.has(id) ? 1 : 0.38).fillRect(0, 0, jarW - 6, layerH);
        if (session.hidden.has(id)) {
          band.lineStyle(1, 0x8c7350, 0.35);
          for (let sx = 0; sx < jarW - 6; sx += 7) band.lineBetween(sx, layerH, Math.min(jarW - 6, sx + 9), 0);
          // Nonlinguistic hidden-layer symbol; spoken description is in the HTML overlay.
          const dot = this.add.graphics().fillStyle(0xf0c674, 0.8).fillCircle((jarW - 6) / 2, layerH / 2, 2);
          layer.add(dot);
        } else {
          for (const piece of pileLayout(id, session.level.seed, spice, layerH)) {
            const size = Math.min(piece.size, layerH * 1.1, jarW - 8);
            // Keep sprite bounds within glass; layout remains keyed to stable layer ID.
            const px = Math.max(size / 2, Math.min(jarW - 6 - size / 2, piece.xPercent / 100 * (jarW - 6)));
            const py = Math.max(size / 2, Math.min(layerH - size / 2, piece.yPercent / 100 * layerH));
            layer.add(this.add.image(px, py, `spice-${spice}`).setDisplaySize(size, size).setAngle(piece.rotation));
          }
        }
        if (view.motion?.moved.includes(id)) {
          motionObjects.push({ object: layer, y: layerY, delay: view.motion.moved.indexOf(id) * 45 });
          layer.y = layerY - 70; layer.alpha = 0;
        }
      });
      const front = this.add.graphics(); container.add(front);
      front.lineStyle(1.5, complete ? 0xf0c674 : 0xbdcecd, complete ? 0.9 : 0.45).strokeRoundedRect(0, 0, jarW, jarH, { tl: 5, tr: 5, bl: 13, br: 13 });
      front.fillStyle(0xffffff, 0.10).fillRoundedRect(5, 13, 4, jarH - 30, 2);
      front.fillStyle(complete ? 0xd4a24c : 0x898d88).fillRoundedRect(-2, -4, jarW + 4, 10, 3);
      front.lineStyle(1, complete ? 0xffdfa0 : 0xc9ceca, 0.55).lineBetween(1, -2, jarW - 1, -2);
    });
    this.onLayout(this.positions, height);
    if (!motionObjects.length) return Promise.resolve();
    return new Promise(resolve => {
      this.completeMotion = () => {
        motionObjects.forEach(({ object, y }) => { if (object.active) { object.y = y; object.alpha = 1; } });
        resolve();
      };
      const lastDelay = Math.max(...motionObjects.map(x => x.delay));
      motionObjects.forEach(({ object, y, delay }) => this.tweens.add({ targets: object, y, alpha: 1, duration: 300, delay, ease: 'Bounce.Out',
        onComplete: delay === lastDelay ? () => { this.completeMotion?.(); this.completeMotion = null; } : undefined }));
    });
  }
  shake(index: number) {
    const jar = this.jars[index];
    if (jar) this.tweens.add({ targets: jar, x: jar.x + 5, duration: 45, yoyo: true, repeat: 3 });
  }
}

export class Board {
  private readonly scene = new BoardScene();
  private readonly game: Phaser.Game;
  private readonly observer: ResizeObserver;
  private pending: BoardView | null = null;
  constructor(host: HTMLElement, onLayout: (positions: JarPosition[], height: number) => void) {
    this.scene.onLayout = onLayout;
    this.scene.onReady = () => { if (this.pending) void this.scene.render(this.pending); };
    this.game = new Phaser.Game({ type: Phaser.AUTO, parent: host, width: host.clientWidth || 480, height: 250, transparent: true, scene: this.scene, banner: false, audio: { noAudio: true }, render: { antialias: true } });
    this.observer = new ResizeObserver(() => {
      if (!this.scene.ready || host.clientWidth < 1 || this.scene.scale.width === host.clientWidth) return;
      this.scene.scale.resize(host.clientWidth, this.scene.scale.height);
      if (this.pending) void this.scene.render({ session: this.pending.session });
    });
    this.observer.observe(host);
  }
  render(view: BoardView): Promise<void> { this.pending = { session: view.session }; return this.scene.render(view); }
  shake(index: number) { this.scene.shake(index); }
  destroy() { this.observer.disconnect(); this.game.destroy(true); }
}
