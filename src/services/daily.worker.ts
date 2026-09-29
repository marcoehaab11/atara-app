import { generateDaily } from '../core/daily';
import { calendarDate } from '../meta/daily';
self.onmessage = (event: MessageEvent<number>) => {
  try {
    const level = generateDaily(calendarDate(event.data));
    self.postMessage({ level: { ...level, level: event.data, source: 'generated' } });
  } catch { self.postMessage({ error: true }); }
};
