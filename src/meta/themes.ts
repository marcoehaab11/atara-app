import { THEME_DATES } from '../config';
export const themes = ['auto', 'normal', 'ramadan', 'eid', 'spring'] as const;
export type ThemeChoice = typeof themes[number];
export type Theme = Exclude<ThemeChoice, 'auto'>;
export function activeTheme(choice: ThemeChoice, date = new Date(), dates = THEME_DATES): Theme {
  if (choice !== 'auto') return choice;
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return dates.find(range => range.start <= key && key <= range.end)?.theme ?? 'normal';
}
