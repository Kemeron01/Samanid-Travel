import { api } from '@samanid/api';
import { PageContainer } from '@samanid/ui';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OfferView } from '@/components/waitlist/OfferView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'waitlistOffer.meta' });
  return { title: t('title'), robots: { index: false } };
}
export const dynamic = 'force-dynamic'; // expires_at считается на момент запроса
export default async function OfferPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; setRequestLocale(locale);
  const offer = await api.waitlistOffer(id);
  if (!offer) notFound();
  return <PageContainer className="py-6 md:py-12"><OfferView offer={offer} /></PageContainer>;
}
