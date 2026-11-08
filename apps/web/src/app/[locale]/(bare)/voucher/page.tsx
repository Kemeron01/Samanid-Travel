import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VoucherForm } from '@/components/service/VoucherCheck';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'service.voucher' });
  return { title: t('meta'), robots: { index: false, follow: true } };
}
export default async function VoucherFormPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'service.voucher' });
  return (
    <div className="flex justify-center px-4 pt-6 pb-16 md:pt-16 md:pb-24">
      <section className="w-full max-w-[560px] rounded-xl border border-dark-200 bg-white p-5 md:p-8">
        <h1 className="text-h4 text-dark-900 md:text-h3">{t('formTitle')}</h1>
        <p className="mt-2 mb-5 text-body-s text-dark-600">{t('formText')}</p>
        <VoucherForm />
      </section>
    </div>
  );
}
