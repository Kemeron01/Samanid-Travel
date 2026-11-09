import { locales } from '@samanid/i18n';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
/** canonical + hreflang для RU/UZ/EN (+ x-default). */
export const alternates = (locale: string, path: string) => ({
  canonical: `${SITE}/${locale}${path}`,
  languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}${path}`])), 'x-default': `${SITE}/ru${path}` },
});
