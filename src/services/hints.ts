import type { State } from '../core/types';
import type { SolveResult } from '../core/solver';
export function findHint(state: State): Promise<SolveResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./hint.worker.ts', import.meta.url), { type: 'module' });
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('Hint worker timeout')); }, 5000);
    worker.onmessage = (event: MessageEvent<SolveResult>) => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
    worker.onerror = () => { clearTimeout(timer); worker.terminate(); reject(new Error('Hint worker failed')); };
    worker.postMessage(state);
  });
}
