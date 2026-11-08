import { Manrope } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { locales } from '@samanid/i18n';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { QueryProvider } from '@/lib/query';
import { SessionProvider } from '@/lib/session';
import '../globals.css';

const manrope = Manrope({ subsets: ['latin', 'latin-ext', 'cyrillic'], variable: '--font-manrope', display: 'swap' });
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home.meta' });
  return {
    metadataBase: new URL(SITE),
    title: { default: t('title'), template: '%s · Samanid Travel' },
    description: t('description'),
    openGraph: { siteName: 'Samanid Travel', type: 'website', locale, title: t('title'), description: t('description') },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(locales as readonly string[]).includes(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'a11y' });
  return (
    <html lang={locale === 'uz' ? 'uz' : locale} className={manrope.variable}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
         <QueryProvider><SessionProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:focus-ring">{t('skip')}</a>
          {children}
          <CookieConsent />
         </SessionProvider></QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
