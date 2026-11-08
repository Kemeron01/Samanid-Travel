import { setRequestLocale } from 'next-intl/server';
import { PendingPage } from '@/components/checkout/Screens';
export default async function Pending({ params, searchParams }: { params: Promise<{ locale: string; orderId: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { locale, orderId } = await params; setRequestLocale(locale); const { payment } = await searchParams;
  return <PendingPage id={orderId} payment={payment ?? ''} />;
}
