import { setRequestLocale } from 'next-intl/server';
import { SuccessPage } from '@/components/checkout/Screens';
export default async function Success({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale, orderId } = await params; setRequestLocale(locale);
  return <SuccessPage id={orderId} />;
}
