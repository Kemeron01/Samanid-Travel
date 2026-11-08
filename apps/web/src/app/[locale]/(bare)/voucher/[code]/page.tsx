import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VoucherResult } from '@/components/service/VoucherCheck';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'service.voucher' });
  return { title: t('meta'), robots: { index: false, follow: false } };
}
export default async function VoucherPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params; setRequestLocale(locale);
  return <div className="flex justify-center px-4 pt-6 pb-16 md:pt-16 md:pb-24"><VoucherResult code={decodeURIComponent(code)} /></div>;
}
