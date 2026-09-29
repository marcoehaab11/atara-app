export const REMINDER_NOTIFICATION_IDS = [8101, 8102, 8103] as const;
export const DEFAULT_REMINDER_HOUR = 19;

/** A rolling three-day queue stops after three notifications until the player opens the app again. */
export function nextReminderTimes(now: Date, hour: number): Date[] {
  const times: Date[] = [];
  for (let offset = 1; offset <= REMINDER_NOTIFICATION_IDS.length; offset++) {
    const at = new Date(now);
    at.setDate(at.getDate() + offset);
    at.setHours(hour, 0, 0, 0);
    times.push(at);
  }
  return times;
}
