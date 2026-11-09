import { api } from '@samanid/api';
import { PageContainer } from '@samanid/ui';
import { locales } from '@samanid/i18n';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TransferBuilder } from '@/components/transfer/TransferBuilder';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://samanid.travel';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'transferPage.meta' });
  return { title: t('title'), description: t('description'), alternates: { canonical: `${SITE}/${locale}/transfer`, languages: Object.fromEntries(locales.map((l) => [l, `${SITE}/${l}/transfer`])) } };
}
export default async function TransferPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const [options, t] = [await api.transferOptions(), await getTranslations({ locale, namespace: 'transferPage' })];
  return (
    <PageContainer className="pt-5 pb-28 md:pt-8 md:pb-24">
      <h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1>
      <p className="mt-2 mb-8 max-w-[960px] text-body-l text-dark-500 max-md:hidden">{t('subtitle')}</p>
      <div className="mt-4 md:mt-0"><TransferBuilder options={options} /></div>
    </PageContainer>
  );
}
