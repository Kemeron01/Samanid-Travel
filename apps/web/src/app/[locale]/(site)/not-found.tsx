import { api } from '@samanid/api';
import { buttonVariants } from '@samanid/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ErrorHero } from '@/components/service/ErrorHero';

/** 5.1 404. Число туров — из API (homeStats), не константа. */
export default async function NotFound() {
  const [t, stats] = await Promise.all([getTranslations('service.notFound'), api.homeStats()]);
  return (
    <div className="bg-bg-page">
      <title>{t('meta')}</title>
      <meta name="robots" content="noindex" />
      <ErrorHero
        code="404"
        title={t('title')}
        text={`${t('text')} ${t('textCount', { count: stats.tours })}`}
        actions={<>
          <Link href="/tours" className={buttonVariants({ variant: 'secondary', size: 'L' })}>{t('catalog')}</Link>
          <Link href="/" className={buttonVariants({ variant: 'ghost', size: 'L' })}>{t('home')}</Link>
        </>}
      />
    </div>
  );
}
