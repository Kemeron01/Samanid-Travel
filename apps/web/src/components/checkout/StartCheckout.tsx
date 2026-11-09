'use client';
import { api } from '@samanid/api';
import { Button, PageContainer } from '@samanid/ui';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';

/** Создаёт черновик заказа (POST /orders) и уводит на шаг 1. Для трансфера/допуслуг макета оформления нет (вопрос к дизайнеру). */
export function StartCheckout({ q }: { q: Record<string, string | undefined> }) {
  const t = useTranslations('checkout.errors'); const router = useRouter();
  const [err, setErr] = useState<string>(); const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    if (q.type && q.type !== 'tour') { setErr(t('unsupported')); return; }
    if (!q.tour || !q.departure) { setErr(t('notFound')); return; }
    api.orders.create({ tour: q.tour, departure: q.departure, adults: Number(q.adults ?? 1) || 1, children: Number(q.children ?? 0) || 0, waitlist_offer_id: q.offer })
      .then((o) => router.replace(`/checkout/${o.id}/travellers` as never)).catch((e: Error) => setErr(e.message === 'sold_out' ? t('soldOut') : t('generic')));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return <PageContainer className="flex flex-col items-center gap-4 py-24 text-center"><p role="alert" className="text-h4 text-dark-900">{err}</p><Link href="/tours"><Button variant="outline">←</Button></Link></PageContainer>;
  return <PageContainer className="flex items-center justify-center gap-3 py-24 text-body-m text-dark-600"><Loader2 className="size-5 animate-spin" aria-hidden="true" /><span role="status">{t('loading')}</span></PageContainer>;
}
