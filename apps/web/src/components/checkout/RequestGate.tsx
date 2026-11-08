'use client';
import { api } from '@samanid/api';
import { PageContainer } from '@samanid/ui';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { RequestSent } from './StatusScreens';

export function RequestGate({ id }: { id: string }) {
  const t = useTranslations('checkout.errors');
  const { data: req, isLoading } = useQuery({ queryKey: ['request', id], queryFn: () => api.orders.getRequest(id) });
  const { data: s } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  if (isLoading || !s) return <PageContainer className="py-24 text-center text-body-m text-dark-600" ><span role="status">{t('loading')}</span></PageContainer>;
  if (!req) return <PageContainer className="py-24 text-center text-h4 text-dark-900">{t('notFound')}</PageContainer>;
  return <RequestSent req={req} hours={s.manager_response_hours} />;
}
