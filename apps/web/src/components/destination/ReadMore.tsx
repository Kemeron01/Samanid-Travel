'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@samanid/ui';

/** Mobile: «Читать полностью» сворачивает длинный текст в 3 строки; на desktop текст виден целиком. */
export function ReadMore({ paragraphs }: { paragraphs: string[] }) {
  const t = useTranslations('destinationPage');
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={cn('flex flex-col gap-3 text-body-s text-dark-600 md:text-body-l md:text-dark-700', !open && 'max-md:line-clamp-3')}>
        {paragraphs.map((p, i) => <p key={i} className={i > 0 ? 'md:text-body-m md:text-dark-600' : ''}>{p}</p>)}
      </div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="mt-3 min-h-10 text-body-s-medium text-primary-500 focus-visible:focus-ring md:hidden">{open ? t('readLess') : t('readMore')}</button>
    </div>
  );
}
