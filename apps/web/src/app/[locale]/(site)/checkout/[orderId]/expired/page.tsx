import { setRequestLocale } from 'next-intl/server';
import { ExpiredPage } from '@/components/checkout/Screens';
export default async function Expired({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale, orderId } = await params; setRequestLocale(locale);
  return <ExpiredPage id={orderId} />;
}
