import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDER_HOUR, nextReminderTimes, REMINDER_NOTIFICATION_IDS } from '../src/meta/reminders';

describe('local reminder queue', () => {
  it('queues three future days at the usual hour and never schedules for today', () => {
    const now = new Date(2026, 8, 29, 10, 25);
    const times = nextReminderTimes(now, 21);
    expect(times).toHaveLength(REMINDER_NOTIFICATION_IDS.length);
    expect(times.map(date => [date.getDate(), date.getHours(), date.getMinutes()])).toEqual([[30, 21, 0], [1, 21, 0], [2, 21, 0]]);
    expect(times.every(date => date > now)).toBe(true);
  });

  it('uses 19:00 as the fallback play hour', () => {
    expect(DEFAULT_REMINDER_HOUR).toBe(19);
    expect(nextReminderTimes(new Date(2026, 0, 1, 20), DEFAULT_REMINDER_HOUR)[0]).toEqual(new Date(2026, 0, 2, 19));
  });
});
