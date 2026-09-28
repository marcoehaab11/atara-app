import ar from './ar.json';
import en from './en.json';
export type Locale = 'ar' | 'en';
export type StringKey = keyof typeof ar;
const dictionaries: Record<Locale, Record<StringKey, string>> = { ar, en };
export function t(locale: Locale, key: StringKey, params: Record<string, string | number> = {}): string {
  return dictionaries[locale][key].replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}
