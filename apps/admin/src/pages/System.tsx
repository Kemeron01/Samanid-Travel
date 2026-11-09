import { adminApi, type OutboxItem, type ReportJob, type SystemSettings, type Template } from '@samanid/api/admin';
import { Button, Input, Select, Switch, Textarea, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AlertTriangle, Bus, CreditCard, MapPin, RefreshCw, Route, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { DataTable, ErrorBox, Loading, PageHeader, Pill, RouteTabs, Stat, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

export function SystemLayout() {
  const { t } = useTranslation(); const { session } = useSession();
  const items = [{ to: '/settings', label: t('system.tabs.settings') }, { to: '/settings/templates', label: t('system.tabs.templates') }, { to: '/settings/outbox', label: t('system.tabs.outbox') }];
  if (can(session?.perms, 'security')) items.push({ to: '/settings/reports', label: t('system.tabs.reports') });
  return <><RouteTabs label={t('nav.settings')} items={items} /><Outlet /></>;
}

/** 6.22 Настройки системы (53:4032): сроки — источник правды для сайта (hold, отмена, возврат, лист ожидания). */
export function SettingsPage() {
  const { t } = useTranslation(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['settings'], queryFn: adminApi.system.settings });
  const [s, setS] = useState<SystemSettings | null>(null);
  useEffect(() => { if (q.data) setS({ ...q.data }); }, [q.data]);
  const editable = can(session?.perms, 'system', 'full');
  const save = useMutation({ mutationFn: () => adminApi.system.saveSettings(s!), onSuccess: (d) => { qc.setQueryData(['settings'], d); toast({ type: 'success', title: t('system.saved') }); }, onError });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!s) return <Loading rows={5} />;
  const n = (v: string) => (v.trim() === '' ? NaN : Number(v.replace(/\D/g, '')));
  const err = (v: number | null, min: number, max: number, optional = false) => (v === null && optional ? undefined : v === null || !(v >= min && v <= max) ? t('system.range', { min, max }) : undefined);
  const errors = [err(s.hold_minutes, 5, 60), err(s.cancellation_deadline_days, 0, 60, true), err(s.refund_days, 1, 30), err(s.waitlist_window_hours, 1, 48)];
  return (
    <>
      <PageHeader title={t('system.settingsTitle')} meta={t('system.settingsMeta')} actions={editable && <Button variant="secondary" loading={save.isPending} disabled={errors.some(Boolean)} onClick={() => save.mutate()}>{t('common.save')}</Button>} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section aria-labelledby="bk-h" className={cn(card, 'flex flex-col gap-4 p-6')}>
          <h2 id="bk-h" className="text-h5 text-dark-900">{t('system.booking')}</h2>
          <Input label={t('system.hold')} inputMode="numeric" disabled={!editable} value={Number.isNaN(s.hold_minutes) ? '' : String(s.hold_minutes)} onChange={(e) => setS({ ...s, hold_minutes: n(e.target.value) })} helper={t('system.holdHelp')} error={errors[0]} />
          <Input label={t('system.deadline')} inputMode="numeric" disabled={!editable} value={s.cancellation_deadline_days === null ? '' : String(s.cancellation_deadline_days)} onChange={(e) => setS({ ...s, cancellation_deadline_days: e.target.value.trim() === '' ? null : n(e.target.value) })} helper={t('system.deadlineHelp')} error={errors[1]} />
          <Input label={t('system.refund')} inputMode="numeric" disabled={!editable} value={Number.isNaN(s.refund_days) ? '' : String(s.refund_days)} onChange={(e) => setS({ ...s, refund_days: n(e.target.value) })} helper={t('system.refundHelp')} error={errors[2]} />
          <Input label={t('system.waitlist')} inputMode="numeric" disabled={!editable} value={Number.isNaN(s.waitlist_window_hours) ? '' : String(s.waitlist_window_hours)} onChange={(e) => setS({ ...s, waitlist_window_hours: n(e.target.value) })} helper={t('system.waitlistHelp')} error={errors[3]} />
        </section>
        <section aria-labelledby="gn-h" className={cn(card, 'flex flex-col gap-4 p-6')}>
          <h2 id="gn-h" className="text-h5 text-dark-900">{t('system.general')}</h2>
          <Select label={t('system.currency')} placeholder="USD" value={s.currency} disabled onValueChange={() => undefined} options={[{ value: 'USD', label: 'USD' }]} />
          <Select label={t('system.languages')} placeholder="RU, UZ, EN" value="all" disabled onValueChange={() => undefined} options={[{ value: 'all', label: s.languages.map((l) => l.toUpperCase()).join(', ') }]} />
          <Select label={t('system.provider')} placeholder={t('system.providerMock')} value={s.provider} disabled={!editable} onValueChange={(v) => setS({ ...s, provider: v })} options={[{ value: 'mock-pay', label: t('system.providerMock') }]} />
          <Switch label={t('system.require2fa')} checked={s.require_2fa} disabled={!editable} onCheckedChange={(v) => setS({ ...s, require_2fa: v })} />
          <Switch label={t('system.tgAlerts')} checked={s.telegram_alerts} disabled={!editable} onCheckedChange={(v) => setS({ ...s, telegram_alerts: v })} />
        </section>
      </div>
    </>
  );
}

const VARS = ['customer.first_name', 'order.number', 'tour.title', 'departure.date', 'departure.meeting_time', 'departure.meeting_point', 'voucher.url', 'installment.date', 'offer.expires_at', 'refund.days', 'reset.url'];
const SAMPLE: Record<string, string> = { 'customer.first_name': 'Азиз', 'order.number': 'ST-2027-04812', 'tour.title': 'Самарканд и Бухара за 5 дней', 'departure.date': '12.05.2027', 'departure.meeting_time': '07:30', 'departure.meeting_point': 'отель Registan Plaza', 'voucher.url': 'samanid.travel/voucher/ST-2027-04812', 'installment.date': '12.04.2027', 'offer.expires_at': '14:30', 'refund.days': '7', 'reset.url': 'samanid.travel/reset/…' };
const render = (s: string) => s.replace(/\{\{([\w.]+)\}\}/g, (_m, k: string) => SAMPLE[k] ?? `{{${k}}}`);

/** 6.23 Шаблоны уведомлений (53:4235): Email/Telegram × RU/UZ/EN, переменные, превью, тест себе. */
export function TemplatesPage() {
  const { t } = useTranslation(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['templates'], queryFn: adminApi.system.templates });
  const [selId, setSelId] = useState<string>(); const [channel, setChannel] = useState<'email' | 'telegram'>('email'); const [lang, setLang] = useState<'ru' | 'uz' | 'en'>('ru');
  const [draft, setDraft] = useState<Template | null>(null);
  const sel = q.data?.find((x) => x.id === (selId ?? q.data?.[0]?.id));
  useEffect(() => { if (sel) setDraft(structuredClone(sel)); }, [sel?.id, q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  const editable = can(session?.perms, 'system', 'full');
  const save = useMutation({ mutationFn: () => adminApi.system.saveTemplate(draft!), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['templates'] }); toast({ type: 'success', title: t('system.tplSaved') }); }, onError });
  const test = useMutation({ mutationFn: () => adminApi.system.testTemplate(draft!.id), onSuccess: (r) => toast({ type: 'success', title: t('system.testSent', { email: r.sent_to }) }), onError });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data || !draft) return <Loading rows={5} />;
  const body = draft.body[channel][lang];
  const setBody = (p: Partial<typeof body>) => setDraft({ ...draft, body: { ...draft.body, [channel]: { ...draft.body[channel], [lang]: { ...body, ...p } } } });
  const unknown = [...body.text.matchAll(/\{\{([\w.]+)\}\}/g), ...body.subject.matchAll(/\{\{([\w.]+)\}\}/g)].map((m) => m[1]!).filter((v) => !VARS.includes(v));
  const insert = (v: string) => { const el = document.getElementById('tpl-text') as HTMLTextAreaElement | null; const pos = el?.selectionStart ?? body.text.length; const next = `${body.text.slice(0, pos)}{{${v}}}${body.text.slice(pos)}`; setBody({ text: next.slice(0, 500) }); requestAnimationFrame(() => el?.focus()); };
  const pill = (active: boolean) => cn('h-10 rounded-full border px-4 text-body-s-medium focus-visible:focus-ring', active ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-dark-200 bg-white text-dark-900 hover:bg-dark-100');
  return (
    <>
      <PageHeader title={t('system.templatesTitle')} meta={t('system.templatesMeta')} actions={editable && <Button variant="secondary" loading={save.isPending} disabled={unknown.length > 0} onClick={() => save.mutate()}>{t('system.saveTemplate')}</Button>} />
      <div className="grid items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <nav aria-label={t('system.templatesTitle')} className={cn(card, 'p-3')}>
          <ul className="flex flex-col gap-1">
            {q.data.map((x) => (
              <li key={x.id}><button type="button" aria-current={x.id === draft.id ? 'true' : undefined} onClick={() => setSelId(x.id)} className={cn('flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-body-s focus-visible:focus-ring', x.id === draft.id ? 'bg-primary-50 text-primary-600' : 'text-dark-900 hover:bg-dark-100')}>
                {t(`system.tpl.${x.key}`)}{x.warn && <><AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-error-600" /><span className="sr-only">{t('system.tplWarn')}</span></>}
              </button></li>
            ))}
          </ul>
        </nav>
        <section aria-label={t(`system.tpl.${draft.key}`)} className={cn(card, 'flex flex-col gap-4 p-6')}>
          <div className="flex flex-wrap gap-6">
            <div role="radiogroup" aria-label={t('system.channel')} className="flex gap-2">{(['email', 'telegram'] as const).map((c) => <button key={c} type="button" role="radio" aria-checked={channel === c} onClick={() => setChannel(c)} className={pill(channel === c)}>{c === 'email' ? 'Email' : 'Telegram'}</button>)}</div>
            <div role="radiogroup" aria-label={t('system.tplLang')} className="flex gap-2">{(['ru', 'uz', 'en'] as const).map((l) => <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} className={cn(pill(lang === l), 'uppercase')}>{l}</button>)}</div>
          </div>
          {channel === 'email' && <Input lang={lang} label={t('system.subject')} value={body.subject} disabled={!editable} onChange={(e) => setBody({ subject: e.target.value })} />}
          <Textarea id="tpl-text" lang={lang} label={t('system.text')} rows={4} maxLength={500} value={body.text} disabled={!editable} onChange={(e) => setBody({ text: e.target.value })} helper={`${body.text.length} / 500`} error={unknown.length ? t('system.unknownVar', { v: unknown.join(', ') }) : undefined} />
          {!body.text && lang !== 'ru' && <p className="flex items-center gap-2 text-caption text-warning-700"><AlertTriangle aria-hidden="true" className="size-4" />{t('system.emptyTpl')}</p>}
          {editable && <div className="flex flex-wrap gap-2">{VARS.slice(0, 5).map((v) => <button key={v} type="button" onClick={() => insert(v)} aria-label={t('system.insertVar', { v })} className="rounded-full bg-dark-100 px-3 py-1 font-mono text-caption text-dark-700 hover:bg-dark-200 focus-visible:focus-ring">{`{{${v}}}`}</button>)}</div>}
        </section>
        <section aria-labelledby="pv-h" className="flex flex-col gap-3 rounded-[20px] border border-dark-200 bg-bg-page p-5">
          <h2 id="pv-h" className="text-caption font-semibold text-dark-500">{t('system.preview')}</h2>
          <div lang={lang} className="flex flex-col gap-2">
            {channel === 'email' && <p className="text-h6 text-dark-900">{render(body.subject || draft.body.email.ru.subject)}</p>}
            <p className="text-body-s text-dark-700">{render(body.text || draft.body[channel].ru.text)}</p>
          </div>
          <button type="button" className={cn(outlineBtn, 'w-fit')} disabled={test.isPending} onClick={() => test.mutate()}>{t('system.testSend')}</button>
        </section>
      </div>
    </>
  );
}

const ostTone = { ok: 'success', pending: 'warning', dead: 'error' } as const;
/** 6.21 Очередь событий / outbox (53:3793): dead letter можно отправить повторно. */
export function OutboxPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['outbox'], queryFn: adminApi.system.outbox, refetchInterval: 15_000 });
  const retry = useMutation({ mutationFn: (id: string) => adminApi.system.retry(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['outbox'] }); toast({ type: 'success', title: t('system.retried') }); }, onError });
  const col = createColumnHelper<OutboxItem>();
  const columns = useMemo(() => [
    col.accessor('event', { header: t('system.col.event'), size: 170, cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    col.accessor('aggregate', { header: t('system.col.aggregate'), size: 140 }),
    col.accessor('handler', { header: t('system.col.handler'), size: 150 }),
    col.accessor('attempts', { header: t('system.col.attempts'), size: 80 }),
    col.accessor('status', { header: t('system.col.status'), size: 130, cell: (c) => <Pill tone={ostTone[c.getValue()]}>{t(`system.ost.${c.getValue()}`)}</Pill> }),
    col.accessor('error', { header: t('system.col.error'), cell: (c) => c.getValue() ? <span className="text-error-700">{c.getValue()}</span> : '—' }),
    col.display({ id: 'r', size: 140, header: () => <span className="sr-only">{t('system.retry')}</span>, cell: (c) => c.row.original.status === 'dead' && can(session?.perms, 'system', 'full') ? <button type="button" className={outlineBtn} onClick={() => retry.mutate(c.row.original.id)}><RefreshCw aria-hidden="true" className="size-4" />{t('system.retry')}</button> : null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, session]);
  const d = q.data;
  return (
    <>
      <PageHeader title={t('system.outboxTitle')} meta={t('system.outboxMeta')} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
            <Stat label={t('system.queued')} value={f.num(d.stats.queued)} />
            <Stat label={t('system.sentHour')} value={f.num(d.stats.sent_hour)} />
            <Stat label={t('system.retries')} value={d.stats.retries} valueClass="text-warning-700" />
            <Stat label={t('system.dead')} value={d.stats.dead} valueClass="text-error-700" />
          </div>
          <DataTable caption={t('system.outboxTitle')} columns={columns} data={d.items} getRowId={(r) => r.id} />
        </>
      )}
    </>
  );
}

const REPORTS = [{ k: 'revenue', icon: CreditCard }, { k: 'occupancy', icon: Bus }, { k: 'destinations', icon: MapPin }, { k: 'ledger', icon: Route }, { k: 'customers', icon: Users }, { k: 'refunds', icon: RefreshCw }] as const;
/** 6.24 Отчёты и экспорт (53:4434): формируются в фоне, статус опрашивается. */
export function ReportsPage() {
  const { t } = useTranslation(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError();
  const q = useQuery({ queryKey: ['reports'], queryFn: adminApi.system.reports, refetchInterval: (qq) => (qq.state.data?.some((r) => r.status === 'running') ? 1500 : false) });
  const req = useMutation({ mutationFn: ({ k, fmt }: { k: string; fmt: 'csv' | 'xlsx' }) => adminApi.system.requestReport(k, fmt, '1–30 апр 2027'), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['reports'] }); toast({ type: 'info', title: t('system.requested') }); }, onError });
  const col = createColumnHelper<ReportJob>();
  const columns = useMemo(() => [
    col.accessor('kind', { header: t('system.rcol.report'), cell: (c) => t(`system.rep.${c.getValue()}`) }),
    col.accessor('period', { header: t('system.rcol.period'), size: 180 }),
    col.accessor('format', { header: t('system.rcol.format'), size: 100, cell: (c) => (c.getValue() === 'xlsx' ? 'Excel' : 'CSV') }),
    col.accessor('status', { header: t('system.rcol.status'), size: 160, cell: (c) => <Pill tone={c.getValue() === 'ready' ? 'success' : 'warning'}>{t(`system.rst.${c.getValue()}`)}</Pill> }),
    col.display({ id: 'dl', size: 120, header: () => <span className="sr-only">{t('system.download')}</span>, cell: (c) => c.row.original.status === 'ready' ? <a href={`data:text/csv;charset=utf-8,${encodeURIComponent('report,period\n' + c.row.original.kind + ',' + c.row.original.period)}`} download={`${c.row.original.kind}.${c.row.original.format === 'xlsx' ? 'csv' : 'csv'}`} className="text-body-s-medium text-primary-500 hover:underline">{t('system.download')}</a> : null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);
  return (
    <>
      <PageHeader title={t('system.reportsTitle')} meta={t('system.reportsMeta')} />
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map(({ k, icon: Icon }) => (
          <li key={k} className={cn(card, 'flex flex-col gap-3 p-5')}>
            <Icon aria-hidden="true" className="size-6 text-primary-500" />
            <h2 className="text-h5 text-dark-900">{t(`system.rep.${k}`)}</h2>
            <p className="text-body-s text-dark-600">{t(`system.rep.${k}D`)}</p>
            <div className="flex gap-2">
              {(['csv', 'xlsx'] as const).map((fmt) => <button key={fmt} type="button" className={outlineBtn} aria-label={t('system.reportFmt', { kind: t(`system.rep.${k}`), fmt: fmt === 'csv' ? 'CSV' : 'Excel' })} onClick={() => req.mutate({ k, fmt })}>{fmt === 'csv' ? 'CSV' : 'Excel'}</button>)}
            </div>
          </li>
        ))}
      </ul>
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : <DataTable caption={t('system.reportsTitle')} columns={columns} data={q.data} getRowId={(r) => r.id} />}
    </>
  );
}
