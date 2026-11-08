'use client';
import { buttonVariants } from '@samanid/ui';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ErrorHero } from '@/components/service/ErrorHero';

/** 5.2 500. По Dev notes: «Мы уже чиним…», выход — обновить страницу или в статус заказа (кабинет). */
export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('service.error');
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="bg-bg-page">
      <ErrorHero
        code="500"
        title={t('title')}
        text={t('text')}
        actions={<>
          <button type="button" onClick={() => { reset(); window.location.reload(); }} className={buttonVariants({ variant: 'secondary', size: 'L' })}>{t('reload')}</button>
          <Link href="/account/orders" className={buttonVariants({ variant: 'ghost', size: 'L' })}>{t('orderStatus')}</Link>
        </>}
      />
    </div>
  );
}
