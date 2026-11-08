import { setRequestLocale } from 'next-intl/server';
import { RequestGate } from '@/components/checkout/RequestGate';
export default async function RequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params; setRequestLocale(locale);
  return <RequestGate id={id} />;
}
