import { Board } from '../game/board';
import type { MotionMetrics } from '../game/board';
import { GameSession } from '../core/session';
import { identifyLayers } from '../core/hidden';
import { loadLevel } from '../content/levelLoader';
import { t } from '../i18n';

export async function motionBench(root: HTMLElement) {
  root.className = 'game-shell';
  const run = document.createElement('button'), reduced = document.createElement('button'), skip = document.createElement('button');
  const host = document.createElement('div'), output = document.createElement('pre');
  run.textContent = t('en', 'ui.restart'); reduced.textContent = t('en', 'settings.motion'); skip.textContent = t('en', 'ui.close');
  for (const b of [run, reduced, skip]) b.className = 'cta';
  root.append(run, reduced, skip, host, output);
  const board = new Board(host, (_, height) => { host.style.height = `${height}px`; });
  let motion = true;
  reduced.onclick = () => { motion = !motion; reduced.setAttribute('aria-pressed', String(motion)); };
  skip.onclick = () => board.skip();
  await board.ready;
  const results: MotionMetrics[] = [];
  board.onMetrics = result => { results.push(result); output.textContent = JSON.stringify(results, null, 2); };
  run.onclick = async () => {
    run.disabled = true; reduced.disabled = true; board.unlockAudio(); board.configure(motion, true);
    const vessels = [[1, 2, 2, 2], [2], [1, 1, 1], []], ids = identifyLayers(vessels);
    const session = new GameSession({ ...loadLevel(12), vessels, layerVessels: ids.vessels, layerSpices: ids.spices, hidden: [] });
    session.tap(0); await board.render({ session });
    const result = session.tap(1);
    if (result.kind === 'pour') await board.render({ session, motion: result });
    run.disabled = false; reduced.disabled = false;
  };
}
