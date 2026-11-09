import { adminApi, AdminError, type AdminOrderDetail, type AdminOrderRow, type AdminOrderStatus, type OrdersQuery } from '@samanid/api/admin';
import { Alert, Button, Checkbox, DateRangeInput, Input, Pagination, Select, StatusBadge, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { Confirm, DataTable, Drawer, ErrorBox, Loading, PageHeader, outlineBtn, useApiError, useToast } from '@/lib/ui';

const SEGMENTS = ['all', 'awaiting', 'refunds', 'overdue', 'fraud'] as const;
const STATUSES: AdminOrderStatus[] = ['pending_payment', 'awaiting_manager_confirmation', 'partially_paid', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded', 'expired'];
const segTone: Record<(typeof SEGMENTS)[number], string> = { all: 'text-white', awaiting: 'text-warning-700', refunds: 'text-primary-600', overdue: 'text-error-700', fraud: 'text-error-700' };

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function useStatusLabel() {
  const { t } = useTranslation();
  return (s: AdminOrderStatus, short = true) => (short && s === 'awaiting_manager_confirmation' ? t('orders.awaitingShort') : t(`status.${s}`));
}

/** 6.4 Заказы (45:786): быстрые сегменты, фильтры, таблица (TanStack), пагинация, экспорт CSV. Клик по строке — боковая панель 6.5. */
export function OrdersPage() {
  const { t } = useTranslation(); const f = useFmt(); const label = useStatusLabel();
  const [sp, setSp] = useSearchParams();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [range, setRange] = useState<string[]>([]);
  const query: OrdersQuery = {
    segment: (sp.get('segment') as OrdersQuery['segment']) ?? 'all', status: (sp.get('status') as AdminOrderStatus) ?? 'all', tour: sp.get('tour') ?? 'all',
    type: (sp.get('type') as OrdersQuery['type']) ?? 'all', from: range[0], to: range[1], q: sp.get('q') ?? undefined, page: Number(sp.get('page') ?? 1),
  };
  const set = (k: string, v: string | null) => { const n = new URLSearchParams(sp); if (v && v !== 'all') n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); if (k !== 'order') setSelected(new Set()); setSp(n); };
  const q = useQuery({ queryKey: ['orders', query], queryFn: () => adminApi.orders.list(query), placeholderData: (p) => p });
  const tours = useQuery({ queryKey: ['catalog-tours'], queryFn: adminApi.catalog.tours, enabled: true, retry: false });
  const openId = sp.get('order');
  const col = createColumnHelper<AdminOrderRow>();
  const payText = (r: AdminOrderRow) => { const p = r.payment; return p.kind === 'installment' ? t('orders.pay.installment', { paid: p.paid, total: p.total }) : p.kind === 'overdue' ? t('orders.pay.overdue', { days: p.days }) : p.kind === 'refund' ? t('orders.pay.refund', { date: f.day(p.date) }) : t(`orders.pay.${p.kind}`); };
  const columns = useMemo(() => [
    col.display({ id: 'select', size: 52, header: () => <span className="sr-only">{t('orders.col.select')}</span>, cell: (c) => (
      <span onClick={(e) => e.stopPropagation()}><Checkbox label={<span className="sr-only">{t('orders.col.select')} {c.row.original.number}</span>} checked={selected.has(c.row.id)} onCheckedChange={(v) => setSelected((s) => { const n = new Set(s); if (v) n.add(c.row.id); else n.delete(c.row.id); return n; })} /></span>
    ) }),
    col.accessor('number', { header: t('orders.col.order'), size: 150, cell: (c) => <button type="button" onClick={(e) => { e.stopPropagation(); set('order', c.row.original.id); }} className="rounded-xs text-body-s-medium whitespace-nowrap text-primary-600 hover:underline focus-visible:focus-ring">{c.getValue()}</button> }),
    // Figma 45:981: колонки фиксированной ширины, текст в одну строку (длинное — с многоточием).
    col.accessor('customer', { header: t('orders.col.customer'), size: 166, cell: (c) => <span className="block truncate whitespace-nowrap" title={c.getValue()}>{c.getValue()}</span> }),
    col.display({ id: 'tour', header: t('orders.col.tour'), cell: (c) => <span className="block max-w-[260px] truncate text-dark-700" title={`${c.row.original.tour} · ${f.day(c.row.original.departure)}`}>{c.row.original.tour} · {f.day(c.row.original.departure)}</span> }),
    col.accessor('pax', { header: t('orders.col.pax'), size: 60 }),
    col.accessor('total', { header: t('orders.col.total'), size: 100, cell: (c) => <span className="font-semibold">{f.money(c.getValue())}</span> }),
    col.display({ id: 'payment', header: t('orders.col.payment'), size: 130, cell: (c) => <span className={cn('text-caption whitespace-nowrap', c.row.original.payment.kind === 'overdue' ? 'text-error-700' : 'text-dark-600')}>{payText(c.row.original)}</span> }),
    col.accessor('status', { header: t('orders.col.status'), size: 230, cell: (c) => <StatusBadge status={c.getValue()} label={label(c.getValue())} title={t(`status.${c.getValue()}`)} /> }),
    col.display({ id: 'open', size: 40, header: () => <span className="sr-only">{t('orders.col.open')}</span>, cell: () => <ChevronRight aria-hidden="true" className="size-[18px] text-dark-400" /> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale, selected, sp]);
  const data = q.data;
  const exportCsv = () => {
    const rows = (data?.items ?? []).filter((r) => !selected.size || selected.has(r.id));
    download(`orders-${new Date().toISOString().slice(0, 10)}.csv`, adminApi.orders.exportCsv(rows.map((r) => ({ ...r, status: r.status }))));
  };
  return (
    <>
      <PageHeader title={t('orders.title')} meta={data ? `${t('orders.count', { count: data.counts.all })} · ${t('common.justNow')}` : ' '}
        actions={<button type="button" onClick={exportCsv} className={outlineBtn}>{selected.size ? `${t('orders.exportSelected')} (${selected.size})` : t('common.exportCsv')}</button>} />
      <div role="group" aria-label={t('orders.segments')} className="flex flex-wrap gap-2">
        {SEGMENTS.map((s) => {
          const active = (query.segment ?? 'all') === s; const n = data?.counts[s];
          return (
            <button key={s} type="button" aria-pressed={active} onClick={() => set('segment', s)}
              className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-body-s-medium focus-visible:focus-ring', active ? 'bg-dark-900 text-white' : 'border border-dark-200 bg-white text-dark-700 hover:bg-dark-100')}>
              {t(`orders.seg.${s}`)}
              {n !== undefined && <span className={cn('rounded-full px-[7px] py-px text-caption', active ? 'bg-dark-700 text-white' : cn('bg-dark-100', segTone[s]))}>{f.num(n)}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-[200px]"><Select label={t('orders.status')} placeholder={t('orders.allStatuses')} value={query.status} onValueChange={(v) => set('status', v)} options={[{ value: 'all', label: t('orders.allStatuses') }, ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))]} /></div>
        <div className="w-[220px]"><Select label={t('orders.tour')} placeholder={t('orders.allTours')} value={query.tour} onValueChange={(v) => set('tour', v)} options={[{ value: 'all', label: t('orders.allTours') }, ...(tours.data ?? []).map((x) => ({ value: x.slug, label: x.title.ru }))]} /></div>
        <div className="w-[260px]"><DateRangeInput label={t('orders.departure')} placeholder={t('orders.departure')} value={range} onValueChange={(v) => { setRange(v); set('page', null); }} locale={f.locale} prevLabel={t('common.prev')} nextLabel={t('common.next')} /></div>
        <div className="w-[160px]"><Select label={t('orders.type')} placeholder={t('common.all')} value={query.type} onValueChange={(v) => set('type', v)} options={[{ value: 'all', label: t('common.all') }, { value: 'group', label: t('orders.group') }, { value: 'individual', label: t('orders.individual') }]} /></div>
        {query.q && <Button variant="ghost" onClick={() => set('q', null)}>«{query.q}» ✕</Button>}
      </div>
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !data ? <Loading rows={8} /> : (
        <>
          <DataTable caption={t('orders.title')} columns={columns} data={data.items} getRowId={(r) => r.id} onRowClick={(r) => set('order', r.id)} rowClassName={(r) => (r.flags.includes('overdue') || openId === r.id ? 'bg-primary-50' : undefined)} />
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-caption text-dark-500">{t('common.shown', { from: data.total ? (data.page - 1) * 8 + 1 : 0, to: Math.min(data.page * 8, data.total), total: f.num(data.total) })}</p>
            {data.pages > 1 && <Pagination page={data.page} pageCount={data.pages} onChange={(p) => set('page', String(p))} labels={{ nav: t('common.pagination'), prev: t('common.prev'), next: t('common.next') }} />}
          </div>
        </>
      )}
      <OrderDrawer id={openId} onClose={() => set('order', null)} />
    </>
  );
}

/** 6.5 Карточка заказа (drawer): смена статуса только по статусной машине, ручной возврат, история из аудита. */
function OrderDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t } = useTranslation(); const f = useFmt(); const label = useStatusLabel(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError();
  const { session } = useSession();
  const q = useQuery({ queryKey: ['order', id], queryFn: () => adminApi.orders.get(id!), enabled: Boolean(id) });
  const [to, setTo] = useState<string>(''); const [confirm, setConfirm] = useState<'status' | 'refund' | null>(null);
  const [amount, setAmount] = useState(''); const [reason, setReason] = useState('customer');
  const o = q.data;
  const refresh = (d: AdminOrderDetail) => { qc.setQueryData(['order', id], d); void qc.invalidateQueries({ queryKey: ['orders'] }); void qc.invalidateQueries({ queryKey: ['badges'] }); };
  const tr = useMutation({ mutationFn: () => adminApi.orders.transition(id!, to as AdminOrderStatus), onSuccess: (d) => { refresh(d); setTo(''); setConfirm(null); toast({ type: 'success', title: t('orders.statusChanged') }); }, onError: (e) => { setConfirm(null); onError(e); } });
  const amt = Number(amount.replace(',', '.'));
  const rf = useMutation({ mutationFn: () => adminApi.orders.refund(id!, amt, t(`orders.reasons.${reason}`)), onSuccess: (d) => { refresh(d); setAmount(''); setConfirm(null); toast({ type: 'success', title: t('orders.refundDone') }); }, onError: (e) => { setConfirm(null); if (e instanceof AdminError && e.code === 'validation') toast({ type: 'error', title: t('orders.refundMax', { amount: f.money2(o?.refundable ?? 0) }) }); else onError(e); } });
  const canStatus = can(session?.perms, 'orders', 'full'); const canRefund = can(session?.perms, 'refunds', 'full');
  const amountError = amount && (!(amt > 0) || amt > (o?.refundable ?? 0)) ? t('orders.refundMax', { amount: f.money2(o?.refundable ?? 0) }) : undefined;
  return (
    <Drawer open={Boolean(id)} onOpenChange={(v) => { if (!v) { onClose(); setTo(''); setAmount(''); } }} title={o?.number ?? '…'} description={o ? [o.customer, o.email, o.phone].filter(Boolean).join(' · ') : undefined}>
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !o ? <Loading rows={5} /> : (
        <>
          {o.email === '•••' && <p className="text-caption text-dark-500">{t('orders.piiHidden')}</p>}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2"><span className="text-body-s-medium text-dark-700">{t('orders.currentStatus')}</span><StatusBadge status={o.status} label={label(o.status)} title={t(`status.${o.status}`)} /></div>
            {o.allowed_transitions.length > 0 && canStatus && <>
              <div className="min-w-[200px] flex-1"><Select label={t('orders.moveTo')} placeholder={t('orders.chooseStatus')} value={to} onValueChange={setTo} options={o.allowed_transitions.map((s) => ({ value: s, label: `${s} — ${t(`status.${s}`).toLowerCase()}` }))} /></div>
              <Button variant="secondary" disabled={!to} onClick={() => setConfirm('status')}>{t('common.apply')}</Button>
            </>}
          </div>
          <p className="flex items-center gap-2 text-caption text-dark-500"><Info aria-hidden="true" className="size-3.5 shrink-0" />{o.allowed_transitions.length ? t('orders.allowed', { list: o.allowed_transitions.join(', ') }) : t('orders.noTransitions')}</p>
          {o.risk && <Alert type="error" title={o.risk.title}>{o.risk.text}</Alert>}
          <dl className="flex flex-col gap-2 rounded-[14px] bg-bg-page p-4 text-body-s">
            {([
              [t('orders.info.tour'), `${o.tour} · ${f.day(o.departure)}`],
              [t('orders.info.pax'), t('orders.info.paxValue', { adults: o.adults, children: o.children ? t('orders.info.children', { count: o.children }) : '', seats: o.seats.length ? o.seats.join(', ') : t('orders.info.noSeats') })],
              [t('orders.info.resources'), o.guide || o.vehicle ? [o.guide, o.vehicle].filter(Boolean).join(' · ') : t('orders.info.notAssigned')],
              [t('orders.info.money'), `${f.money(o.total)} / ${f.money(o.paid)}`],
            ] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="shrink-0 text-dark-500">{k}</dt><dd className="text-right font-semibold text-dark-900">{v}</dd></div>)}
          </dl>
          {canRefund && (
            <section aria-labelledby="refund-h" className="flex flex-col gap-3 rounded-[14px] border border-dark-200 p-4">
              <h3 id="refund-h" className="text-h6 text-dark-900">{t('orders.refund')}</h3>
              {o.refundable > 0 ? <>
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t('orders.refundAmount')} inputMode="decimal" placeholder={o.refundable.toFixed(2)} value={amount} onChange={(e) => setAmount(e.target.value)} error={amountError} />
                  <Select label={t('orders.refundReason')} placeholder={t('orders.refundReason')} value={reason} onValueChange={setReason} options={(['customer', 'agency', 'goodwill', 'duplicate'] as const).map((r) => ({ value: r, label: t(`orders.reasons.${r}`) }))} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-caption text-dark-500">{t('orders.refundHint')}</p>
                  <button type="button" disabled={!(amt > 0) || Boolean(amountError)} onClick={() => setConfirm('refund')} className={outlineBtn}>{t('orders.refundBtn', { amount: f.money(amt > 0 ? amt : o.refundable) })}</button>
                </div>
              </> : <p className="text-body-s text-dark-500">{t('orders.nothingToRefund')}</p>}
            </section>
          )}
          <section aria-labelledby="hist-h" className="flex flex-col gap-4">
            <h3 id="hist-h" className="text-h6 text-dark-900">{t('orders.history')}</h3>
            <ol className="flex flex-col gap-4">
              {o.history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <time dateTime={h.at} className="w-24 shrink-0 text-caption text-dark-500">{f.dayTime(h.at)}</time>
                  <div className="flex min-w-0 flex-col gap-0.5"><span className="text-caption text-dark-700">{h.actor}</span><span className="text-body-s text-dark-900">{h.details}</span></div>
                </li>
              ))}
            </ol>
          </section>
          <Confirm open={confirm === 'status'} onOpenChange={(v) => !v && setConfirm(null)} danger={to === 'cancelled'} busy={tr.isPending}
            title={t('orders.confirmStatus', { number: o.number, status: to ? t(`status.${to}`) : '' })} text={t('orders.confirmStatusText')} confirmLabel={t('common.confirm')} onConfirm={() => tr.mutate()} />
          <Confirm open={confirm === 'refund'} onOpenChange={(v) => !v && setConfirm(null)} busy={rf.isPending}
            title={t('orders.refundConfirm', { amount: f.money2(amt || 0), number: o.number })} text={t('orders.refundConfirmText')} confirmLabel={t('orders.refundBtn', { amount: f.money2(amt || 0) })} onConfirm={() => rf.mutate()} />
        </>
      )}
    </Drawer>
  );
}
