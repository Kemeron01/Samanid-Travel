import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { StepScreen } from '@/components/checkout/Screens';

export const metadata: Metadata = { robots: { index: false } };
export default async function StepPage({ params }: { params: Promise<{ locale: string; orderId: string; step: string }> }) {
  const { locale, orderId, step } = await params; setRequestLocale(locale);
  if (!['travellers', 'seats', 'addons', 'discounts', 'review', 'payment'].includes(step)) notFound();
  return <StepScreen id={orderId} step={step} />;
}
