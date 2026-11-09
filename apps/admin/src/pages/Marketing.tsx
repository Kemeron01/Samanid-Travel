import { zodResolver } from '@hookform/resolvers/zod';
import { adminApi, AdminError, type Promo, type ReviewItem, type Rules } from '@samanid/api/admin';
import { Alert, Button, Input, Select, Switch, Textarea, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AlertTriangle, ArrowDown, ArrowUp, Clock, Info, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { z } from 'zod';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { Confirm, DataTable, ErrorBox, Loading, PageHeader, PillSwitch, Pill, RouteTabs, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

/** Раздел «Маркетинг и правила» (6.12–6.14): вкладки промокоды / динамическая цена / пени / лояльность / отзывы. */
export function MarketingLayout() {
  const { t } = useTranslation();
  return (
    <>
      <RouteTabs label={t('marketing.title')} items={(['promos', 'pricing', 'penalties', 'loyalty', 'reviews'] as const).map((k) => ({ to: `/marketing/${k}`, label: t(`marketing.tabs.${k}`) }))} />
      <Outlet />
    </>
  );
}

const pstTone = { active: 'success', system: 'primary', finished: 'neutral' } as const;
/** 6.12 Промокоды (51:2239). */
export function PromosPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['promos'], queryFn: adminApi.marketing.promos });
  const editable = can(session?.perms, 'marketing', 'full');
  const schema = z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,16}$/, t('marketing.codeFormat')),
    kind: z.enum(['percent', 'amount']), value: z.coerce.number().positive(t('marketing.positive')), min: z.coerce.number().min(0),
    limit: z.coerce.number().int().positive(t('marketing.positive')), per: z.coerce.number().int().positive(t('marketing.positive')),
    from: z.string().min(1, t('tour.required')), to: z.string().min(1, t('tour.required')), scope: z.string(),
  }).refine((v) => v.kind !== 'percent' || v.value <= 90, { path: ['value'], message: t('marketing.pctRange') });
  type F = z.infer<typeof schema>;
  const { register, handleSubmit, control, watch, reset, setError, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) as never, defaultValues: { code: '', kind: 'percent', value: 10, min: 300, limit: 500, per: 1, from: '', to: '', scope: 'all' } });
  const kind = watch('kind');
  const create = useMutation({
    mutationFn: (v: F) => adminApi.marketing.createPromo({ code: v.code, kind: v.kind, value: v.value, limit: v.limit, until: v.to, restriction: `${v.min ? `мин. $${v.min} · ` : ''}${v.per} на клиента` }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['promos'] }); reset(); toast({ type: 'success', title: t('marketing.created') }); },
    onError: (e) => (e instanceof AdminError && e.detail === 'code_taken' ? setError('code', { message: t('marketing.codeTaken') }) : onError(e)),
  });
  const col = createColumnHelper<Promo>();
  const columns = useMemo(() => [
    col.accessor('code', { header: t('marketing.col.code'), size: 110, cell: (c) => <span className="text-body-s-medium text-primary-600">{c.getValue()}</span> }),
    col.display({ id: 'd', header: t('marketing.col.discount'), size: 80, cell: (c) => { const p = c.row.original; return p.kind === 'percent' ? `−${p.value}%` : p.kind === 'amount' ? `−${f.money(p.value)}` : t('marketing.points', { n: p.value }); } }),
    col.display({ id: 'u', header: t('marketing.col.used'), size: 120, cell: (c) => { const p = c.row.original; if (!p.limit) return '—'; const pct = Math.min(100, (p.used / p.limit) * 100); return (
      <span className="flex flex-col gap-1"><span className="text-caption text-dark-900">{f.num(p.used)} / {f.num(p.limit)}</span><span className="h-1 w-24 rounded-full bg-dark-100" role="progressbar" aria-valuenow={p.used} aria-valuemin={0} aria-valuemax={p.limit} aria-label={t('marketing.col.used')}><span className={cn('block h-1 rounded-full', p.status === 'finished' ? 'bg-dark-400' : 'bg-primary-500')} style={{ width: `${pct}%` }} /></span></span>); } }),
    col.display({ id: 'until', header: t('marketing.col.until'), size: 110, cell: (c) => { const p = c.row.original; return p.status === 'finished' ? t('marketing.expired') : p.until ? t('marketing.until', { date: p.until.split('-').reverse().join('.').replace(/\.20(\d\d)$/, '.$1') }) : t('marketing.forever'); } }),
    col.accessor('restriction', { header: t('marketing.col.limits'), size: 150, cell: (c) => <span className="text-body-s text-dark-700">{c.getValue()}</span> }),
    col.accessor('status', { header: t('marketing.col.status'), size: 110, cell: (c) => <Pill tone={pstTone[c.getValue()]}>{t(`marketing.pst.${c.getValue()}`)}</Pill> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  const lim = useQuery({ queryKey: ['limits'], queryFn: adminApi.security.limits, retry: false });
  return (
    <>
      <PageHeader title={t('marketing.title')} actions={editable && <Button variant="secondary" onClick={() => document.getElementById('promo-code')?.focus()}>{t('marketing.newPromo')}</Button>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex min-w-0 flex-col gap-4">
            <DataTable caption={t('marketing.tabs.promos')} columns={columns} data={q.data} getRowId={(r) => r.code} />
            <Alert type="info" title={t('marketing.fraudTitle')}>{t('marketing.fraudText', { n: lim.data?.promo ?? 5 })}</Alert>
          </div>
          {editable && (
            <form onSubmit={handleSubmit((v) => create.mutate(v))} noValidate aria-labelledby="np-h" className={cn(card, 'flex flex-col gap-4 p-6')}>
              <h2 id="np-h" className="text-h5 text-dark-900">{t('marketing.newPromo')}</h2>
              <Input id="promo-code" label={t('marketing.code')} placeholder="SUMMER27" autoComplete="off" className="[&_input]:uppercase" error={errors.code?.message} {...register('code')} />
              <Controller control={control} name="kind" render={({ field }) => <PillSwitch label={t('marketing.kind')} value={field.value} onChange={field.onChange} options={[{ value: 'percent', label: t('marketing.percent') }, { value: 'amount', label: t('marketing.amount') }]} />} />
              <div className="grid grid-cols-2 gap-3">
                <Input label={kind === 'percent' ? t('marketing.discountPct') : t('marketing.discountUsd')} inputMode="decimal" error={errors.value?.message} {...register('value')} />
                <Input label={t('marketing.minSum')} inputMode="numeric" error={errors.min?.message} {...register('min')} />
                <Input label={t('marketing.limitTotal')} inputMode="numeric" error={errors.limit?.message} {...register('limit')} />
                <Input label={t('marketing.limitPer')} inputMode="numeric" error={errors.per?.message} {...register('per')} />
              </div>
              <fieldset className="flex flex-col gap-2"><legend className="mb-2 text-body-s-medium text-dark-700">{t('marketing.validity')}</legend>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" aria-label={`${t('marketing.validity')}: ${t('resources.from')}`} aria-invalid={Boolean(errors.from) || undefined} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" {...register('from')} />
                  <input type="date" aria-label={`${t('marketing.validity')}: ${t('resources.to')}`} aria-invalid={Boolean(errors.to) || undefined} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" {...register('to')} />
                </div>
                {(errors.from || errors.to) && <p className="text-caption text-error-700">{t('tour.required')}</p>}
              </fieldset>
              <Controller control={control} name="scope" render={({ field }) => <Select label={t('marketing.appliesTo')} placeholder={t('marketing.allTours')} value={field.value} onValueChange={field.onChange} options={[{ value: 'all', label: t('marketing.allTours') }]} />} />
              <Button type="submit" variant="secondary" size="L" loading={create.isPending} className="w-full">{t('marketing.create')}</Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

/** 6.13 Правила цен, пеней и лояльности (51:2549). Порядок правил важен — перестановка кнопками (доступно с клавиатуры). */
export function RulesPage({ focus }: { focus?: 'pricing' | 'penalties' | 'loyalty' }) {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['rules'], queryFn: adminApi.marketing.rules });
  const [r, setR] = useState<Rules | null>(null); const [loyaltyEdit, setLoyaltyEdit] = useState(false);
  useEffect(() => { if (q.data) setR(structuredClone(q.data)); }, [q.data]);
  useEffect(() => { if (focus && r) document.getElementById(`rules-${focus}`)?.scrollIntoView({ block: 'start' }); }, [focus, Boolean(r)]); // eslint-disable-line react-hooks/exhaustive-deps
  const editable = can(session?.perms, 'marketing', 'full');
  const save = useMutation({ mutationFn: () => adminApi.marketing.saveRules(r!), onSuccess: (d) => { qc.setQueryData(['rules'], d); setLoyaltyEdit(false); toast({ type: 'success', title: t('marketing.rulesSaved') }); }, onError });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!r) return <Loading rows={6} />;
  const move = (i: number, d: -1 | 1) => { const p = r.pricing.slice(); const [x] = p.splice(i, 1); p.splice(i + d, 0, x!); setR({ ...r, pricing: p }); };
  // Пример из макета: 13/16 = 81% → срабатывает первое подходящее правило заполняемости.
  const occ = r.pricing.find((p) => p.enabled && p.id.startsWith('occ') && 81 >= Number(p.id.slice(3)));
  const k = 1 + Math.max(r.clamp[0], Math.min(r.clamp[1], occ?.delta_pct ?? 0)) / 100;
  const num = (v: string) => Number(v.replace(',', '.'));
  const pen = r.penalty; const loy = r.loyalty;
  const rangeErr = (v: number, min: number, max: number) => (!(v >= min && v <= max) ? t('system.range', { min, max }) : undefined);
  return (
    <>
      <PageHeader title={t('marketing.title')} actions={editable && <Button variant="secondary" loading={save.isPending} onClick={() => save.mutate()}>{t('marketing.rulesSave')}</Button>} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section id="rules-pricing" aria-labelledby="coef-h" className={cn(card, 'flex scroll-mt-6 flex-col gap-3 p-6')}>
          <h2 id="coef-h" className="text-h5 text-dark-900">{t('marketing.coef')}</h2>
          <p className="text-body-s text-dark-600">{t('marketing.coefText', { min: r.clamp[0], max: r.clamp[1] })}</p>
          <ol className="flex flex-col gap-3">
            {r.pricing.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-bg-page px-4 py-4">
                <span className="flex flex-col">
                  <button type="button" disabled={!editable || i === 0} onClick={() => move(i, -1)} aria-label={`${t('marketing.moveUp')}: ${p.label}`} className="rounded-xs text-dark-400 hover:text-dark-900 disabled:opacity-30 focus-visible:focus-ring"><ArrowUp className="size-4" /></button>
                  <button type="button" disabled={!editable || i === r.pricing.length - 1} onClick={() => move(i, 1)} aria-label={`${t('marketing.moveDown')}: ${p.label}`} className="rounded-xs text-dark-400 hover:text-dark-900 disabled:opacity-30 focus-visible:focus-ring"><ArrowDown className="size-4" /></button>
                </span>
                <span className="min-w-0 flex-1 text-body-s text-dark-900">{p.label}</span>
                <Pill tone={p.delta_pct > 0 ? 'warning' : 'success'}>{p.delta_pct > 0 ? '+' : '−'}{Math.abs(p.delta_pct)}%</Pill>
                <Switch label={<span className="sr-only">{t('marketing.toggleRule', { label: p.label })}</span>} checked={p.enabled} disabled={!editable} onCheckedChange={(v) => setR({ ...r, pricing: r.pricing.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)) })} />
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-2 rounded-lg border border-primary-500 bg-primary-50 px-4 py-3 text-body-s text-primary-600"><Info aria-hidden="true" className="size-4 shrink-0" />{t('marketing.example', { base: f.money(600), k: k.toFixed(2), result: f.money(Math.round(600 * k)) })}</p>
        </section>
        <div className="flex flex-col gap-6">
          <section id="rules-penalties" aria-labelledby="pen-h" className={cn(card, 'flex scroll-mt-6 flex-col gap-4 p-6')}>
            <h2 id="pen-h" className="text-h5 text-dark-900">{t('marketing.penaltyTitle')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('marketing.perDay')} inputMode="decimal" disabled={!editable} value={String(pen.per_day_pct)} onChange={(e) => setR({ ...r, penalty: { ...pen, per_day_pct: num(e.target.value) } })} error={rangeErr(pen.per_day_pct, 0, 5)} />
              <Input label={t('marketing.maxPenalty')} inputMode="decimal" disabled={!editable} value={String(pen.max_pct)} onChange={(e) => setR({ ...r, penalty: { ...pen, max_pct: num(e.target.value) } })} error={rangeErr(pen.max_pct, 0, 50)} />
            </div>
            <Input label={t('marketing.block')} inputMode="numeric" disabled={!editable} value={String(pen.block_days)} onChange={(e) => setR({ ...r, penalty: { ...pen, block_days: num(e.target.value) } })} error={rangeErr(pen.block_days, 0, 60)} />
            <Input label={t('marketing.reminder')} inputMode="numeric" disabled={!editable} value={String(pen.reminder_days)} onChange={(e) => setR({ ...r, penalty: { ...pen, reminder_days: num(e.target.value) } })} error={rangeErr(pen.reminder_days, 0, 30)} />
          </section>
          <section id="rules-loyalty" aria-labelledby="loy-h" className={cn(card, 'flex scroll-mt-6 flex-col gap-3 p-6')}>
            <h2 id="loy-h" className="text-h5 text-dark-900">{t('marketing.loyaltyTitle')}</h2>
            {loyaltyEdit ? (
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('marketing.rate')} inputMode="numeric" value={String(loy.rate)} onChange={(e) => setR({ ...r, loyalty: { ...loy, rate: num(e.target.value) } })} />
                <Input label={t('marketing.referral')} inputMode="numeric" value={String(loy.referral)} onChange={(e) => setR({ ...r, loyalty: { ...loy, referral: num(e.target.value) } })} />
                <Input label={t('marketing.cashback')} inputMode="decimal" value={String(loy.cashback_pct)} onChange={(e) => setR({ ...r, loyalty: { ...loy, cashback_pct: num(e.target.value) } })} />
                <Input label={t('marketing.maxSpend')} inputMode="numeric" value={String(loy.max_pct)} onChange={(e) => setR({ ...r, loyalty: { ...loy, max_pct: num(e.target.value) } })} error={rangeErr(loy.max_pct, 0, 100)} />
                <Input label={t('marketing.ttl')} inputMode="numeric" value={String(loy.ttl_months)} onChange={(e) => setR({ ...r, loyalty: { ...loy, ttl_months: num(e.target.value) } })} />
              </div>
            ) : (
              <dl className="flex flex-col gap-2.5 text-body-s">
                {([[t('marketing.rate'), t('marketing.rateValue', { n: loy.rate })], [t('marketing.referral'), t('marketing.referralValue', { n: loy.referral })], [t('marketing.cashback'), `${loy.cashback_pct}%`], [t('marketing.maxSpend'), t('marketing.maxSpendValue', { n: loy.max_pct })], [t('marketing.ttl'), t('marketing.ttlValue', { n: loy.ttl_months })]] as const).map(([a, b]) => <div key={a} className="flex justify-between gap-3"><dt className="text-dark-600">{a}</dt><dd className="font-semibold text-dark-900">{b}</dd></div>)}
              </dl>
            )}
            {editable && !loyaltyEdit && <button type="button" className={cn(outlineBtn, 'w-full')} onClick={() => setLoyaltyEdit(true)}>{t('marketing.change')}</button>}
          </section>
        </div>
      </div>
      <p className="flex items-center gap-2 text-caption text-dark-500"><Clock aria-hidden="true" className="size-4" />{t('marketing.rulesNote')}</p>
    </>
  );
}

/** Пять звёзд (Figma 6.14). Оценка озвучивается текстом. */
function Stars({ value, label }: { value: number; label: string }) {
  return <span role="img" aria-label={label} className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} aria-hidden="true" className={cn('size-[18px]', i <= value ? 'fill-accent-500 text-accent-500' : 'text-dark-300')} />)}</span>;
}

/** 6.14 Модерация отзывов (51:2832): подозрение на спам подсвечено; «Отклонить» у спама — Danger с подтверждением. */
export function ReviewsPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['reviews'], queryFn: adminApi.marketing.reviews });
  const [replyFor, setReplyFor] = useState<string | null>(null); const [reply, setReply] = useState(''); const [reject, setReject] = useState<ReviewItem | null>(null);
  const editable = can(session?.perms, 'marketing', 'full');
  const m = useMutation({ mutationFn: ({ id, action, text }: { id: string; action: 'publish' | 'reject' | 'reply'; text?: string }) => adminApi.marketing.moderate(id, action, text), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['reviews'] }); void qc.invalidateQueries({ queryKey: ['badges'] }); setReject(null); setReplyFor(null); setReply(''); toast({ type: 'success', title: t('common.saved') }); }, onError });
  const list = q.data ?? [];
  const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length) : 0;
  return (
    <>
      <PageHeader title={t('marketing.reviewsTitle')} meta={t('marketing.reviewsMeta', { count: list.length, rating: avg.toFixed(1) })} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : !list.length ? <p className={cn(card, 'p-8 text-body-m text-dark-600')}>{t('marketing.allModerated')}</p> : (
        <ul className="flex flex-col gap-5">
          {list.map((r) => (
            <li key={r.id} className={cn(card, 'flex flex-col gap-3 p-5', r.spam && 'border-error-600')}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><h2 className="text-body-m-medium text-dark-900">{r.author}</h2><p className="text-caption text-dark-500">{t('marketing.reviewMeta', { tour: r.tour, date: f.dayShort(r.date) })}</p></div>
                <Stars value={r.rating} label={t('marketing.rating', { n: r.rating })} />
              </div>
              <p className="text-body-s text-dark-900">{r.text}</p>
              {r.spam && <p className="flex items-center gap-2 text-caption text-error-700"><AlertTriangle aria-hidden="true" className="size-4" />{r.spam}</p>}
              {replyFor === r.id && (
                <div className="flex flex-col gap-3"><Textarea label={t('marketing.replyLabel')} rows={3} value={reply} onChange={(e) => setReply(e.target.value)} /><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setReplyFor(null)}>{t('common.cancel')}</Button><Button variant="secondary" disabled={!reply.trim()} onClick={() => m.mutate({ id: r.id, action: 'reply', text: reply })}>{t('marketing.sendReply')}</Button></div></div>
              )}
              {editable && replyFor !== r.id && (
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="ghost" onClick={() => { setReplyFor(r.id); setReply(''); }}>{t('marketing.reply')}</Button>
                  {r.spam ? <Button variant="danger" onClick={() => setReject(r)}>{t('marketing.reject')}</Button> : <button type="button" className={outlineBtn} onClick={() => setReject(r)}>{t('marketing.reject')}</button>}
                  <Button variant="secondary" onClick={() => m.mutate({ id: r.id, action: 'publish' })}>{t('marketing.publishReview')}</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Confirm open={Boolean(reject)} onOpenChange={(o) => !o && setReject(null)} title={t('marketing.rejectConfirm', { author: reject?.author ?? '' })} text={t('marketing.rejectText')} confirmLabel={t('marketing.reject')} busy={m.isPending} onConfirm={() => m.mutate({ id: reject!.id, action: 'reject' })} />
    </>
  );
}
