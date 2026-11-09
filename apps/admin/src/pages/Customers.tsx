import { adminApi, type Customer, type PaymentEvent } from '@samanid/api/admin';
import { Button, Input, Modal, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { DataTable, ErrorBox, Loading, PageHeader, Pill, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

/** 6.19 Клиенты (53:3330): таблица + карточка выбранного клиента, начисление баллов (проводка в леджере). */
export function CustomersPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['customers'], queryFn: () => adminApi.customers.list() });
  const [selId, setSelId] = useState<string>(); const [grantOpen, setGrantOpen] = useState(false); const [points, setPoints] = useState('500'); const [reason, setReason] = useState('');
  const items = q.data?.items ?? []; const sel = items.find((c) => c.id === selId) ?? items[0];
  const grant = useMutation({ mutationFn: () => adminApi.customers.grantPoints(sel!.id, Number(points), reason || '—'), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['customers'] }); setGrantOpen(false); toast({ type: 'success', title: t('customers.granted') }); }, onError });
  const col = createColumnHelper<Customer>();
  const columns = useMemo(() => [
    col.display({ id: 'c', header: t('customers.col.customer'), cell: (c) => <button type="button" onClick={(e) => { e.stopPropagation(); setSelId(c.row.original.id); }} className="rounded-xs text-left text-body-s-medium text-dark-900 hover:underline focus-visible:focus-ring">{c.row.original.name ? `${c.row.original.name} · ${c.row.original.email}` : c.row.original.email}</button> }),
    col.accessor('orders', { header: t('customers.col.orders'), size: 90 }),
    col.accessor('paid', { header: t('customers.col.paid'), size: 110, cell: (c) => f.money(c.getValue()) }),
    col.accessor('points', { header: t('customers.col.points'), size: 90, cell: (c) => f.num(c.getValue()) }),
    col.accessor('flag', { header: t('customers.col.flag'), size: 130, cell: (c) => (c.getValue() ? <Pill tone="error">{t(`customers.flag.${c.getValue()}`)}</Pill> : '—') }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  const exportCsv = () => download('customers.csv', ['name,email,orders,paid_usd,points,flag', ...items.map((c) => [c.name ?? '', c.email, c.orders, c.paid, c.points, c.flag ?? ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n'));
  return (
    <>
      <PageHeader title={t('customers.title')} meta={q.data ? t('customers.count', { count: f.num(q.data.total) as unknown as number }) : ' '} actions={<button type="button" onClick={exportCsv} className={outlineBtn}>{t('common.exportCsv')}</button>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <DataTable caption={t('customers.title')} columns={columns} data={items} getRowId={(r) => r.id} onRowClick={(r) => setSelId(r.id)} rowClassName={(r) => (r.id === sel?.id ? 'bg-primary-50' : undefined)} />
          {sel && (
            <section aria-label={sel.name ?? sel.email} className={cn(card, 'flex flex-col gap-4 p-6')}>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-body-m text-primary-500">{(sel.name ?? sel.email).split(/[ @]/).map((p) => p[0]?.toUpperCase()).join('').slice(0, 2)}</span>
                <div className="min-w-0"><h2 className="text-h5 text-dark-900">{sel.name ?? t('customers.noName')}</h2><p className="text-caption text-dark-500">{t('customers.since', { year: sel.since.slice(0, 4), lang: sel.lang.toUpperCase(), tg: sel.telegram ? t('customers.tgOn') : t('customers.tgOff') })}</p></div>
              </div>
              <dl className="flex flex-col gap-3 text-body-s">
                {([[t('customers.email'), sel.email], [t('customers.phone'), sel.phone], [t('customers.referral'), sel.referral ? t('customers.referralValue', { code: sel.referral.code, n: sel.referral.friends }) : '—'], [t('customers.consent'), sel.consent_at ? t('customers.consentValue', { date: f.stamp(sel.consent_at).slice(0, 5) + '.' + sel.consent_at.slice(0, 4) }) : '—']] as const).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-dark-500">{k}</dt><dd className="text-right font-semibold text-dark-900">{v}</dd></div>)}
              </dl>
              {can(session?.perms, 'marketing', 'full') && <button type="button" onClick={() => setGrantOpen(true)} className={cn(outlineBtn, 'w-full')}>{t('customers.grant')}</button>}
            </section>
          )}
        </div>
      )}
      <Modal open={grantOpen} onOpenChange={setGrantOpen} title={t('customers.grantTitle', { name: sel?.name ?? sel?.email ?? '' })} closeLabel={t('common.close')}
        footer={<><Button variant="ghost" onClick={() => setGrantOpen(false)}>{t('common.cancel')}</Button><Button variant="secondary" loading={grant.isPending} disabled={!(Number(points) > 0)} onClick={() => grant.mutate()}>{t('customers.grant')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label={t('customers.pointsLabel')} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/\D/g, ''))} />
          <Input label={t('customers.reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </>
  );
}

const resTone = { duplicate: 'primary', ok: 'success', error: 'error', pending: 'warning' } as const;
/** 6.20 Платежи и вебхуки (53:3568): журнал событий провайдера, дубли по event_id — «пропущен», сверка. */
export function PaymentsPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['payments'], queryFn: adminApi.payments.events });
  const rec = useMutation({ mutationFn: adminApi.payments.reconcile, onSuccess: (r) => { void qc.invalidateQueries({ queryKey: ['payments'] }); toast({ type: 'success', title: t('payments.reconciled', { n: r.mismatches }) }); }, onError });
  const col = createColumnHelper<PaymentEvent>();
  const columns = useMemo(() => [
    col.accessor('at', { header: t('payments.col.time'), size: 110, cell: (c) => f.time(c.getValue()) }),
    col.accessor('type', { header: t('payments.col.event'), size: 170, cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    col.accessor('payment', { header: t('payments.col.payment'), size: 120 }),
    col.accessor('order', { header: t('payments.col.order'), size: 130, cell: (c) => <Link to={`/orders?q=${c.getValue()}`} className="text-primary-600 hover:underline">{c.getValue()}</Link> }),
    col.accessor('amount', { header: t('payments.col.amount'), size: 90, cell: (c) => f.money(c.getValue()) }),
    col.accessor('result', { header: t('payments.col.result'), size: 160, cell: (c) => <Pill tone={resTone[c.getValue()]}>{t(`payments.res.${c.getValue()}`)}</Pill> }),
    col.accessor('note', { header: () => <span className="sr-only">{t('payments.col.note')}</span>, cell: (c) => <span className="text-dark-500">{c.getValue()}</span> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  return (
    <>
      <PageHeader title={t('payments.title')} meta={t('payments.meta')} actions={can(session?.perms, 'security', 'full') && <Button variant="secondary" loading={rec.isPending} onClick={() => rec.mutate()}>{t('payments.reconcile')}</Button>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <>
          {q.data.mismatch && (
            <p role="status" className="flex items-start gap-3 rounded-lg border border-warning-500 bg-warning-100 px-5 py-3.5 text-body-s text-warning-700">
              <RefreshCw aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              {t('payments.mismatch', { time: f.time(q.data.mismatch.at).slice(0, 5), payment: q.data.mismatch.payment, status: q.data.mismatch.order })}
            </p>
          )}
          <DataTable caption={t('payments.title')} columns={columns} data={q.data.items} getRowId={(r) => r.id} />
        </>
      )}
    </>
  );
}
