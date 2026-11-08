import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { StartCheckout } from '@/components/checkout/StartCheckout';

export const metadata: Metadata = { robots: { index: false } };
type SP = Record<string, string | string[] | undefined>;
export default async function CheckoutStart({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params; setRequestLocale(locale);
  const sp = await searchParams; const q = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  return <StartCheckout q={q} />;
}
