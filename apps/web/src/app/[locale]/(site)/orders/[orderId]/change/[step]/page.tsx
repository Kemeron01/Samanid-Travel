import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { ChangeScreen } from '@/components/checkout/ChangeFlow';

export const metadata: Metadata = { robots: { index: false } };
export default async function ChangePage({ params }: { params: Promise<{ locale: string; orderId: string; step: string }> }) {
  const { locale, orderId, step } = await params; setRequestLocale(locale);
  if (!['what', 'details', 'recalc', 'done'].includes(step)) notFound();
  return <ChangeScreen id={orderId} step={step} />;
}
