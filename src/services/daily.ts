import type { PlayableLevel } from '../content/levelSchema';
export function loadDaily(date: number): Promise<PlayableLevel> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./daily.worker.ts', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(new Error('Daily generation timeout')); }, 15000);
    worker.onmessage = (event: MessageEvent<{ level?: PlayableLevel; error?: boolean }>) => {
      finish(); if (event.data.level) resolve(event.data.level); else reject(new Error('Daily generation failed'));
    };
    worker.onerror = () => { finish(); reject(new Error('Daily worker failed')); };
    worker.postMessage(date);
  });
}
