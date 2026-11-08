'use client';
import { api, type VoucherCheck as Check } from '@samanid/api';
import type { Locale } from '@samanid/i18n';
import { Button, Input, Skeleton, cn } from '@samanid/ui';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck, CircleX, Lock, SearchX } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';
import { useRouter } from '@/i18n/routing';
import { dateLong, dateTimeLocal } from '@/lib/format';

const card = 'w-full max-w-[560px] rounded-xl border border-dark-200 bg-white p-5 md:p-8';
export const VOUCHER_RE = /^ST-\d{4}-\d{5}$/i;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-body-s">
      <dt className="shrink-0 text-dark-500">{label}</dt>
      <dd className="text-right text-body-s-medium text-dark-900">{value}</dd>
    </div>
  );
}

/** 5.3 (41:521 / 41:560 / 41:599): публичный результат проверки — только номер, тур, выезд, места и статус. */
export function VoucherResult({ code }: { code: string }) {
  const t = useTranslations('service.voucher'); const locale = useLocale() as Locale;
  const q = useQuery({ queryKey: ['voucher', code], queryFn: () => api.content.verifyVoucher(code), retry: false });
  if (q.isPending) return <div className={card} aria-busy="true"><span className="sr-only">{t('checking')}</span><Skeleton className="h-[74px] rounded-lg" /><Skeleton className="mt-4 h-9 w-56" /><Skeleton className="mt-4 h-24" /></div>;
  const v: Check | null | undefined = q.data;
  if (!v) return (
    <div className={cn(card, 'flex flex-col items-center gap-3 text-center')} role="status">
      <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-dark-100 text-dark-500"><SearchX className="size-8" /></span>
      <h1 className="text-h5 text-dark-900">{t('notFound')}</h1>
      <p className="text-body-s text-dark-600">{t('notFoundText')}</p>
      <VoucherForm initial={code} className="mt-2 w-full text-left" />
    </div>
  );
  const sub = v.valid ? t('checkedAt', { date: dateTimeLocal(v.checked_at, locale) }) : v.cancelled_at ? t('cancelledAt', { date: dateLong(v.cancelled_at, locale) }) : t('noBoarding');
  return (
    <article className={cn(card, 'flex flex-col gap-4')} aria-labelledby="voucher-status">
      <div role="status" className={cn('flex items-center gap-3.5 rounded-lg p-4', v.valid ? 'bg-success-100' : 'bg-error-100')}>
        {v.valid ? <CircleCheck aria-hidden="true" className="size-8 shrink-0 text-success-700" /> : <CircleX aria-hidden="true" className="size-8 shrink-0 text-error-700" />}
        <div className="min-w-0">
          <h1 id="voucher-status" className={cn('text-h5', v.valid ? 'text-success-700' : 'text-error-700')}>{v.valid ? t('valid') : t('invalid')}</h1>
          <p className="mt-0.5 text-caption text-dark-700">{sub}</p>
        </div>
      </div>
      <p className="text-h4 text-dark-900 md:text-h3">{v.number}</p>
      <dl className="flex flex-col gap-4">
        <Row label={t('tour')} value={v.tour} />
        <Row label={t('departure')} value={`${dateLong(v.departure, locale)}, ${v.meeting_time}`} />
        <Row label={t('passengers')} value={v.seats.length ? t('seats', { count: v.passengers, seats: v.seats.join(', ') }) : String(v.passengers)} />
        <Row label={t('orderStatus')} value={t(`status.${v.status}`)} />
      </dl>
      <p className="flex items-center gap-2 text-caption text-dark-500"><Lock aria-hidden="true" className="size-3.5 shrink-0" />{t('privacy')}</p>
    </article>
  );
}

/** Ручной ввод номера (ссылка «Проверить ваучер» в подвале). В Figma отдельного макета нет — вопрос к дизайнеру. */
export function VoucherForm({ initial = '', className }: { initial?: string; className?: string }) {
  const t = useTranslations('service.voucher'); const router = useRouter();
  const [value, setValue] = useState(initial); const [error, setError] = useState<string>();
  const submit = (e: FormEvent) => {
    e.preventDefault(); const code = value.trim().toUpperCase();
    if (!VOUCHER_RE.test(code)) { setError(t('codeError')); return; }
    router.push(`/voucher/${code}`);
  };
  return (
    <form onSubmit={submit} noValidate className={cn('flex flex-col gap-3 md:flex-row md:items-start', className)}>
      <Input className="md:flex-1" label={t('codeLabel')} placeholder="ST-2027-00000" autoComplete="off" spellCheck={false} value={value} onChange={(e) => { setValue(e.target.value); setError(undefined); }} error={error} />
      <Button type="submit" variant="secondary" className="md:mt-7 md:h-[52px]">{t('check')}</Button>
    </form>
  );
}
