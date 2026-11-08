import { getRequestConfig } from 'next-intl/server';
import { messages, type Locale } from '@samanid/i18n';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (routing.locales as readonly string[]).includes(requested ?? '') ? (requested as Locale) : routing.defaultLocale;
  return { locale, messages: messages[locale] };
});
