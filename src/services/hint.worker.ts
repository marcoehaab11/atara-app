import { solve } from '../core/solver';
import { HELPERS } from '../config';
import type { State } from '../core/types';
const worker = self as unknown as { onmessage: (event: MessageEvent<State>) => void; postMessage: (data: unknown) => void };
worker.onmessage = event => worker.postMessage(solve(event.data, HELPERS.hintLimit));
