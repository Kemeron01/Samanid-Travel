import { adminApi, type Period } from '@samanid/api/admin';
import { cn } from '@samanid/ui';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bus, ChevronDown, ChevronUp, CreditCard, Download, Gift, RefreshCw, ShieldAlert, Ticket, User, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFmt } from '@/lib/format';
import { ErrorBox, Kpi, Loading, PageHeader, PillSwitch, card, outlineBtn, token, useApiError, useToast } from '@/lib/ui';

function Delta({ value, text }: { value: number; text: string }) {
  const up = value >= 0; const Icon = up ? ChevronUp : ChevronDown;
  return <p className={cn('flex items-center gap-1 text-caption', up ? 'text-success-700' : 'text-error-700')}><Icon aria-hidden="true" className="size-3.5" />{text}</p>;
}

/** 6.3 Дашборд (43:2808). Все суммы приходят из API в USD. */
export function DashboardPage() {
  const { t } = useTranslation(); const f = useFmt(); const toast = useToast(); const onError = useApiError();
  const [period, setPeriod] = useState<Period>('30d'); const [asTable, setAsTable] = useState(false);
  const q = useQuery({ queryKey: ['dashboard', period], queryFn: () => adminApi.dashboard(period) });
  const exportXlsx = async () => { try { await adminApi.system.requestReport('revenue', 'xlsx', period); toast({ type: 'success', title: t('system.requested') }); } catch (e) { onError(e); } };
  const d = q.data;
  const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
  return (
    <>
      <PageHeader title={t('dashboard.title')} meta={d ? `${f.range(d.from, d.to)} · ${t('common.usd')}` : ' '}
        actions={<>
          <PillSwitch label={t('dashboard.period')} value={period} onChange={setPeriod} options={(['7d', '30d', 'quarter', 'year'] as const).map((p) => ({ value: p, label: t(`dashboard.periods.${p}`) }))} />
          <button type="button" onClick={exportXlsx} className={outlineBtn}>{t('common.exportExcel')}<Download aria-hidden="true" className="size-[18px]" /></button>
        </>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading rows={6} /> : (
        <>
          <section className="grid grid-cols-2 gap-5 xl:grid-cols-4" aria-label={t('dashboard.title')}>
            <Kpi label={t('dashboard.revenue')} icon={<CreditCard />} value={f.money(d.kpi.revenue)} foot={<Delta value={d.kpi.revenue_delta_pct} text={`${sign(d.kpi.revenue_delta_pct)}% ${t('dashboard.vsPrev')}`} />} />
            <Kpi label={t('dashboard.paidOrders')} icon={<Ticket />} value={f.num(d.kpi.paid_orders)} foot={<Delta value={d.kpi.paid_delta} text={`${sign(d.kpi.paid_delta)} ${t('dashboard.vsPrev')}`} />} />
            <Kpi label={t('dashboard.occupancy')} icon={<Bus />} value={`${d.kpi.occupancy_pct}%`} foot={<Delta value={d.kpi.occupancy_delta_pp} text={`${sign(d.kpi.occupancy_delta_pp)} ${t('dashboard.pp')} ${t('dashboard.vsPrev')}`} />} />
            <Kpi label={t('dashboard.avgCheck')} icon={<Gift />} value={f.money(d.kpi.avg_check)} foot={<Delta value={d.kpi.avg_delta} text={`${d.kpi.avg_delta < 0 ? '−' : '+'}${f.money(Math.abs(d.kpi.avg_delta))} ${t('dashboard.vsPrev')}`} />} />
          </section>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className={cn(card, 'flex min-w-0 flex-col gap-4 p-6')} aria-labelledby="rev-h">
              <div className="flex items-center justify-between gap-3">
                <h2 id="rev-h" className="text-h5 text-dark-900">{t('dashboard.revenueByDay')}</h2>
                <button type="button" aria-pressed={asTable} onClick={() => setAsTable((v) => !v)} className="rounded-xs text-body-s-medium text-primary-500 hover:underline focus-visible:focus-ring">{asTable ? t('dashboard.chart') : t('dashboard.table')}</button>
              </div>
              {asTable ? (
                <div className="max-h-[260px] overflow-y-auto">
                  <table className="w-full text-left text-body-s">
                    <thead className="sticky top-0 bg-white text-caption text-dark-500"><tr><th className="py-2">{t('dashboard.date')}</th><th className="py-2 text-right">{t('dashboard.amount')}</th><th className="py-2 text-right">{t('dashboard.orders')}</th></tr></thead>
                    <tbody>{d.revenue_by_day.map((r) => <tr key={r.date} className="border-t border-dark-100"><td className="py-2">{f.day(r.date)}</td><td className="py-2 text-right font-semibold">{f.money(r.amount)}</td><td className="py-2 text-right">{r.orders}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="h-[215px]" role="img" aria-label={t('dashboard.revenueByDay')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.revenue_by_day} margin={{ top: 4, right: 0, bottom: 0, left: -12 }}>
                      <CartesianGrid vertical={false} stroke={token('dark-200')} />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} interval={4} tick={{ fill: token('dark-500'), fontSize: 11 }} tickFormatter={(v: string) => f.dayShort(v)} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: token('dark-500'), fontSize: 11 }} tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`} />
                      <Tooltip cursor={{ fill: token('primary-50') }} content={({ active, payload }) => {
                        const p = payload?.[0]?.payload as { date: string; amount: number; orders: number } | undefined;
                        return active && p ? <div className="rounded-[10px] bg-dark-900 px-3 py-2"><p className="text-caption text-dark-300">{f.day(p.date)}</p><p className="text-body-s-medium text-white">{t('dashboard.tooltip', { amount: f.money(p.amount), count: p.orders })}</p></div> : null;
                      }} />
                      <Bar dataKey="amount" fill={token('primary-500')} radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
            <section className={cn(card, 'flex flex-col gap-3.5 p-6')} aria-labelledby="top-h">
              <div><h2 id="top-h" className="text-h5 text-dark-900">{t('dashboard.topDest')}</h2><p className="mt-1 text-caption text-dark-500">{t('dashboard.byRevenue')}</p></div>
              <ul className="flex flex-col gap-3.5">
                {d.top_destinations.map((x) => (
                  <li key={x.name} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-body-s text-dark-900"><span>{x.name}</span><span className="font-semibold">{f.money(x.amount)}</span></div>
                    <div className="h-2 rounded-[4px] bg-dark-100" aria-hidden="true"><div className="h-2 rounded-[4px] bg-primary-500" style={{ width: `${(x.amount / d.top_destinations[0]!.amount) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className={cn(card, 'flex flex-col gap-3.5 p-6')} aria-labelledby="fun-h">
              <h2 id="fun-h" className="text-h5 text-dark-900">{t('dashboard.funnel')}</h2>
              <ul className="flex flex-col gap-3.5">
                {d.funnel.map((s, i) => {
                  const prev = d.funnel[i - 1]?.value; const conv = prev ? `${((s.value / prev) * 100).toFixed(1).replace(/\.0$/, '')}%` : '—';
                  // Логарифмическая шкала: иначе этапы после просмотров были бы невидимы (как в макете).
                  const top = Math.log10(d.funnel[0]!.value); const w = Math.max(6, (100 * (Math.log10(Math.max(s.value, 1)) - 1.5)) / Math.max(top - 1.5, 0.1));
                  return (
                    <li key={s.key} className="flex items-center gap-4">
                      <span className="w-[220px] shrink-0 text-body-s text-dark-700">{t(`dashboard.funnelKeys.${s.key}`)}</span>
                      <span className="h-7 min-w-0 flex-1" aria-hidden="true"><span className="block h-7 rounded-[6px] bg-primary-500" style={{ width: `${w}%`, opacity: 1 - i * 0.16 }} /></span>
                      <span className="w-16 shrink-0 text-right text-body-s-medium text-dark-900">{f.num(s.value)}</span>
                      <span className="w-10 shrink-0 text-right text-caption text-dark-500">{conv}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className={cn(card, 'flex flex-col gap-2.5 p-6')} aria-labelledby="att-h">
              <h2 id="att-h" className="text-h5 text-dark-900">{t('dashboard.attention')}</h2>
              {([
                ['individual', User, 'text-warning-700', '/orders?segment=awaiting'],
                ['manual_refunds', RefreshCw, 'text-primary-600', '/orders?segment=refunds'],
                ['overdue', AlertTriangle, 'text-error-700', '/orders?segment=overdue'],
                ['fraud', ShieldAlert, 'text-error-700', '/security/fraud'],
                ['webhook_failures', XCircle, 'text-success-700', '/payments'],
              ] as const).map(([k, Icon, tone, to]) => {
                const n = d.attention[k];
                return (
                  <Link key={k} to={to} className="flex items-center gap-2.5 rounded-md bg-bg-page px-3 py-2.5 hover:bg-dark-100 focus-visible:focus-ring">
                    <Icon aria-hidden="true" className={cn('size-[18px] shrink-0', n === 0 ? 'text-success-700' : tone)} />
                    <span className="min-w-0 flex-1 text-body-s text-dark-900">{t(`dashboard.att.${k}`)}</span>
                    <span className={cn('text-body-s-medium', n === 0 ? 'text-success-700' : tone)}>{n}</span>
                  </Link>
                );
              })}
            </section>
          </div>
        </>
      )}
    </>
  );
}
