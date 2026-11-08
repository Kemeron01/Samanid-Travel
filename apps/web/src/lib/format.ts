import { formatDayMonth, formatMoney, intlLocale, type Locale } from '@samanid/i18n';

export const money = (n: number, l: Locale) => formatMoney(n, l);
export const money2 = (n: number, l: Locale) => formatMoney(n, l, 'USD', 2);
export const dayMonth = (d: string, l: Locale) => formatDayMonth(d, l);
export const compact = (n: number, l: Locale) => new Intl.NumberFormat(intlLocale[l]).format(n).replace(/ /g, ' ');

/** «12–16 мая» / «May 12–16» / «12–16-may» — диапазон в одном месяце сворачивается; в разных — «30 мая – 3 июня». */
export const dateRange = (from: string, to: string, l: Locale) => {
  const [fm, tm] = [from.slice(5, 7), to.slice(5, 7)];
  if (fm !== tm) return `${dayMonth(from, l)} – ${dayMonth(to, l)}`;
  const d1 = Number(from.slice(8)); const d2 = Number(to.slice(8));
  if (l === 'en') return `${dayMonth(to, l).replace(/\d+/, `${d1}–${d2}`)}`;
  return dayMonth(to, l).replace(String(d2), `${d1}–${d2}`);
};

/** «12 мая 2027» / «May 12, 2027» / «12-may, 2027». */
export const dateLong = (d: string, l: Locale) => {
  const y = new Date(d.length === 10 ? `${d}T00:00:00Z` : d).getUTCFullYear();
  return l === 'en' ? `${dayMonth(d, l)}, ${y}` : l === 'uz' ? `${dayMonth(d, l)}, ${y}` : `${dayMonth(d, l)} ${y}`;
};
/** «12 мая 2027, 07:21» — время по местной зоне устройства (для «Проверено …»). */
export const dateTimeLocal = (iso: string, l: Locale) => {
  const dt = new Date(iso);
  const local = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  return `${dateLong(local, l)}, ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};
