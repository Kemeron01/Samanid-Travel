import { setRequestLocale } from 'next-intl/server';
import { FailedPage } from '@/components/checkout/Screens';
export default async function Failed({ params, searchParams }: { params: Promise<{ locale: string; orderId: string }>; searchParams: Promise<{ payment?: string }> }) {
  const { locale, orderId } = await params; setRequestLocale(locale); const { payment } = await searchParams;
  return <FailedPage id={orderId} payment={payment ?? ''} />;
}
