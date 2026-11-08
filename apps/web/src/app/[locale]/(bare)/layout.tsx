import { Logo } from '@samanid/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

/** Каркас без навигации (5.3 проверка ваучера): только логотип по центру — экран открывает гид/водитель по QR. */
export default async function BareLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('service.notFound');
  return (
    <>
      <header className="flex justify-center bg-white p-5">
        <Link href="/" aria-label={t('home')} className="rounded-md focus-visible:focus-ring"><Logo /></Link>
      </header>
      <main id="main" className="min-h-[calc(100dvh-80px)] bg-bg-page">{children}</main>
    </>
  );
}
