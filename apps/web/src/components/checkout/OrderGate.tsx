'use client';
import { api, type Order, type Settings } from '@samanid/api';
import { Button, PageContainer } from '@samanid/ui';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useOrder } from './useOrder';

/** Загружает заказ и разводит по экранам по статусу (README: expired → 2.7c, paid/confirmed → 2.8). */
export function OrderGate({ id, allow, children }: { id: string; allow?: 'any' | 'open'; children: (o: Order, settings: Settings) => ReactNode }) {
  const t = useTranslations('checkout.errors'); const router = useRouter();
  const { data: o, isLoading, refetch } = useOrder(id);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  useEffect(() => {
    if (!o || allow === 'any') return;
    if (o.status === 'expired') router.replace(`/checkout/${o.id}/expired` as never);
    else if (['paid', 'confirmed', 'partially_paid'].includes(o.status)) router.replace(`/checkout/${o.id}/success` as never);
  }, [o?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  if (isLoading || !settings) return <PageContainer className="flex items-center justify-center gap-3 py-24 text-body-m text-dark-600"><Loader2 className="size-5 animate-spin" aria-hidden="true" /><span role="status">{t('loading')}</span></PageContainer>;
  if (!o) return <PageContainer className="flex flex-col items-center gap-4 py-24 text-center"><p className="text-h4 text-dark-900">{t('notFound')}</p><Link href="/tours" className="text-primary-500">←</Link><Button variant="outline" onClick={() => void refetch()}>{t('retry')}</Button></PageContainer>;
  if (allow !== 'any' && (o.status === 'expired' || ['paid', 'confirmed', 'partially_paid'].includes(o.status))) return null;
  return <>{children(o, settings)}</>;
}
