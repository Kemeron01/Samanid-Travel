import { api } from '@samanid/api';
import { PageContainer } from '@samanid/ui';
import { locales } from '@samanid/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AddonsBoard } from '@/components/addons/AddonsBoard';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'addonsPage.meta' });
  return { title: t('title'), description: t('description'), alternates: { canonical: `${SITE}/${locale}/addons`, languages: Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/addons`])) } };
}
export default async function AddonsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const [addons, t] = [await api.addons(), await getTranslations({ locale, namespace: 'addonsPage' })];
  return (
    <PageContainer className="pt-5 pb-12 md:pt-8 md:pb-24">
      <h1 className="text-h2 text-dark-900 max-md:mb-3 md:text-h1">{t('title')}</h1>
      <p className="mt-2 text-body-l text-dark-500 max-md:sr-only md:mb-8">{t('subtitle')}</p>
      <AddonsBoard addons={addons} />
    </PageContainer>
  );
}
