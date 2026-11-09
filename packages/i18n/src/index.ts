import ru from './locales/ru.json';
import en from './locales/en.json';
import uz from './locales/uz.json';
import adminRu from './admin/ru.json';
import adminUz from './admin/uz.json';
import adminEn from './admin/en.json';

export const locales = ['ru', 'uz', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export const messages = { ru, uz, en } as const;
export type Messages = typeof ru;

/** Словари админки — отдельно, чтобы не попадать в бандл публичного сайта. Формат i18next: {{var}}. */
export const adminMessages = { ru: adminRu, uz: adminUz, en: adminEn } as const;
export type AdminMessages = typeof adminRu;

export const intlLocale: Record<Locale, string> = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US' };

/** Сумма в USD. Разделитель тысяч: пробел в RU/UZ, запятая в EN. */
export function formatMoney(amount: number, locale: Locale, currency = 'USD', digits = 0): string {
  const nf = new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
  const parts = nf.formatToParts(amount);
  const sym = parts.find((p) => p.type === 'currency')?.value ?? currency;
  const num = parts
    .filter((p) => p.type !== 'currency' && p.type !== 'literal')
    .map((p) => (p.type === 'group' && locale !== 'en' ? ' ' : p.value))
    .join('');
  return `${sym}${num}`;
}

/** Строка цены из шаблона локали: RU/EN «от $640», UZ «$640 dan». */
export function formatPriceFrom(amount: number, locale: Locale): string {
  return messages[locale].price.from.replace('{amount}', formatMoney(amount, locale));
}

/** Дата: «12 мая», «12-may», «May 12». */
export function formatDayMonth(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (locale === 'uz') {
    const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
    return `${d.getUTCDate()}-${months[d.getUTCMonth()]}`;
  }
  return new Intl.DateTimeFormat(intlLocale[locale], {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  }).format(d).replace(/\s*г\.$/, '');
}
