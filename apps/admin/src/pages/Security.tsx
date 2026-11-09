import { adminApi, type AuditEntry, type FraudCase, type LedgerEntry, type Perm, type Role } from '@samanid/api/admin';
import { Button, DateInput, Input, Modal, Select, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AlertTriangle, Check, CheckCircle2, Minus, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { Confirm, DataTable, ErrorBox, Loading, PageHeader, Pill, RouteTabs, Stat, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

const ROLES: Role[] = ['content', 'manager', 'admin'];
const PERMS: Perm[] = ['catalog', 'orders', 'refunds', 'resources', 'pii', 'marketing', 'security', 'system'];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([`﻿${text}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

export function SecurityLayout() {
  const { t } = useTranslation(); const { session } = useSession();
  const items = [can(session?.perms, 'system') && { to: '/security/roles', label: t('security.tabs.roles') }, can(session?.perms, 'security') && { to: '/security/fraud', label: t('security.tabs.fraud') }].filter(Boolean) as { to: string; label: string }[];
  return <>{items.length > 1 && <RouteTabs label={t('nav.security')} items={items} />}<Outlet /></>;
}

/** 6.15 Роли и доступы (52:2753): матрица RBAC из API — по ней же скрываются пункты меню. */
export function RolesPage() {
  const { t } = useTranslation(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['roles'], queryFn: adminApi.security.roles });
  const [open, setOpen] = useState(false); const [email, setEmail] = useState(''); const [role, setRole] = useState<Role>('manager');
  const emailErr = email && !/^[^@\s]+@samanid\.travel$/i.test(email.trim()) ? t('security.emailDomain') : undefined;
  const inv = useMutation({ mutationFn: () => adminApi.security.invite(email.trim(), role), onSuccess: () => { setOpen(false); setEmail(''); toast({ type: 'success', title: t('security.invited') }); }, onError });
  const Cell = ({ v }: { v: 'none' | 'read' | 'full' }) => v === 'full' ? <><Check aria-hidden="true" className="size-5 text-success-700" /><span className="sr-only">{t('security.level.full')}</span></>
    : v === 'read' ? <Pill tone="neutral">{t('security.level.read')}</Pill> : <><Minus aria-hidden="true" className="size-5 text-dark-300" /><span className="sr-only">{t('security.level.none')}</span></>;
  return (
    <>
      <PageHeader title={t('security.rolesTitle')} meta={t('security.rolesMeta')} actions={can(session?.perms, 'system', 'full') && <Button variant="secondary" onClick={() => setOpen(true)}>{t('security.invite')}</Button>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <>
          <div className={cn(card, 'relative overflow-x-auto rounded-2xl')}>
            <table className="w-full min-w-[720px] text-left">
              <caption className="sr-only">{t('security.rolesTitle')}</caption>
              <thead className="bg-bg-page"><tr><th scope="col" className="px-4 py-3 text-caption font-medium text-dark-500">{t('security.right')}</th>{ROLES.map((r) => <th key={r} scope="col" className="w-[176px] px-4 py-3 text-caption font-medium text-dark-500">{t(`roles.${r}`)}</th>)}</tr></thead>
              <tbody>{PERMS.map((p) => <tr key={p} className="border-t border-dark-100"><th scope="row" className="px-4 py-3 text-body-s font-normal text-dark-900">{t(`security.perm.${p}`)}</th>{ROLES.map((r) => <td key={r} className="px-4 py-3"><Cell v={q.data.matrix[p][r]} /></td>)}</tr>)}</tbody>
            </table>
          </div>
          <ul className="grid gap-5 md:grid-cols-3">
            {q.data.staff.map((s) => {
              const needs = s.role !== 'content';
              return (
                <li key={s.id} className={cn(card, 'flex flex-col gap-2 p-4')}>
                  <span className="text-body-m-medium text-dark-900">{s.short}</span>
                  <span className="text-caption text-dark-500">{t(`roles.${s.role}`)}</span>
                  {s.twofa ? <span className="flex items-center gap-1.5 text-caption text-success-700"><ShieldCheck aria-hidden="true" className="size-4" />{t('security.twofaOn')}</span>
                    : <span className="flex items-center gap-1.5 text-caption text-warning-700"><AlertTriangle aria-hidden="true" className="size-4" />{needs ? t('security.twofaOff') : t('security.twofaNotRequired')}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <Modal open={open} onOpenChange={setOpen} title={t('security.inviteTitle')} closeLabel={t('common.close')}
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="secondary" loading={inv.isPending} disabled={!email || Boolean(emailErr)} onClick={() => inv.mutate()}>{t('security.send')}</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label={t('security.inviteEmail')} type="email" placeholder="name@samanid.travel" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} />
          <Select label={t('security.inviteRole')} placeholder={t('security.inviteRole')} value={role} onValueChange={(v) => setRole(v as Role)} options={ROLES.map((r) => ({ value: r, label: t(`roles.${r}`) }))} />
        </div>
      </Modal>
    </>
  );
}

/** 6.16 Антифрод (52:3034): решения необратимы → Danger + подтверждение. */
export function FraudPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['fraud'], queryFn: adminApi.security.fraud });
  const lim = useQuery({ queryKey: ['limits'], queryFn: adminApi.security.limits });
  const [pending, setPending] = useState<{ c: FraudCase; d: 'rejected' | 'blocked' } | null>(null);
  const m = useMutation({ mutationFn: ({ id, d }: { id: string; d: 'approved' | 'rejected' | 'cleared' | 'blocked' }) => adminApi.security.decide(id, d), onSuccess: () => { void qc.invalidateQueries({ queryKey: ['fraud'] }); void qc.invalidateQueries({ queryKey: ['dashboard'] }); setPending(null); toast({ type: 'success', title: t('security.decided') }); }, onError });
  const editable = can(session?.perms, 'security', 'full');
  return (
    <>
      <PageHeader title={t('security.fraudTitle')} meta={t('security.fraudMeta')} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <>
          {!q.data.length && <p className={cn(card, 'flex items-center gap-2 p-6 text-body-m text-dark-600')}><CheckCircle2 aria-hidden="true" className="size-5 text-success-700" />{t('security.queueEmpty')}</p>}
          <ul className="flex flex-col gap-5">
            {q.data.map((c) => (
              <li key={c.id} className={cn('flex flex-col gap-3 rounded-[20px] border-[1.5px] bg-white p-5', c.level === 'high' ? 'border-error-600' : 'border-warning-500')}>
                <div className="flex flex-wrap items-center gap-3">
                  <Pill tone={c.level === 'high' ? 'error' : 'warning'}>{t(`security.risk.${c.level}`, { score: c.score })}</Pill>
                  <h2 className="min-w-0 flex-1 text-body-l text-dark-900">{c.title}</h2>
                  <span className="text-h5 font-bold text-dark-900">{c.amount ? f.money(c.amount) : '—'}</span>
                </div>
                <p className="flex items-center gap-2 text-body-s text-dark-700"><AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-dark-500" />{c.signals}</p>
                {editable && (
                  <div className="flex flex-wrap justify-end gap-3">
                    <Link to={c.kind === 'payment' ? '/orders?segment=fraud' : '/customers'} className="inline-flex h-11 items-center rounded-full px-4 text-button-m text-primary-500 hover:bg-primary-50 focus-visible:focus-ring">{t('common.more')}</Link>
                    {c.kind === 'payment' ? <>
                      <button type="button" className={outlineBtn} onClick={() => m.mutate({ id: c.id, d: 'approved' })}>{t('security.approve')}</button>
                      <Button variant="danger" onClick={() => setPending({ c, d: 'rejected' })}>{t('security.rejectRefund')}</Button>
                    </> : <>
                      <button type="button" className={outlineBtn} onClick={() => m.mutate({ id: c.id, d: 'cleared' })}>{t('security.clear')}</button>
                      <Button variant="danger" onClick={() => setPending({ c, d: 'blocked' })}>{t('security.block')}</Button>
                    </>}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {lim.data && (
            <section aria-labelledby="lim-h" className={cn(card, 'flex flex-col gap-3 p-5')}>
              <h2 id="lim-h" className="text-h6 text-dark-900">{t('security.limits')}</h2>
              <dl className="flex flex-col gap-2 text-body-s">
                {([[t('security.lim.promo'), t('security.lim.promoV', { n: lim.data.promo })], [t('security.lim.login'), t('security.lim.loginV', { n: lim.data.login[0], m: lim.data.login[1] })], [t('security.lim.holds'), t('security.lim.holdsV', { n: lim.data.holds })], [t('security.lim.manual', { amount: f.money(lim.data.manual_over) }), t('security.lim.manualV')]] as const).map(([a, b]) => <div key={a} className="flex justify-between gap-3"><dt className="text-dark-600">{a}</dt><dd className="text-right font-semibold text-dark-900">{b}</dd></div>)}
              </dl>
            </section>
          )}
        </>
      )}
      <Confirm open={Boolean(pending)} onOpenChange={(o) => !o && setPending(null)} title={pending?.d === 'rejected' ? t('security.confirmReject') : t('security.confirmBlock')} text={t('security.irreversible')}
        confirmLabel={pending?.d === 'rejected' ? t('security.rejectRefund') : t('security.block')} busy={m.isPending} onConfirm={() => m.mutate({ id: pending!.c.id, d: pending!.d })} />
    </>
  );
}

export function LedgerLayout() {
  const { t } = useTranslation();
  return <><RouteTabs label={t('nav.ledger')} items={[{ to: '/ledger', label: t('ledger.tabs.ledger') }, { to: '/ledger/audit', label: t('ledger.tabs.audit') }]} /><Outlet /></>;
}

/** 6.18 Леджер (52:3533): проводки неизменяемы, исправления — сторно (отрицательная сумма, ссылка на исходную). */
export function LedgerPage() {
  const { t } = useTranslation(); const f = useFmt();
  const q = useQuery({ queryKey: ['ledger'], queryFn: adminApi.ledger.list });
  const col = createColumnHelper<LedgerEntry>();
  const columns = useMemo(() => [
    col.accessor('id', { header: t('ledger.col.id'), size: 130, cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    col.accessor('at', { header: t('ledger.col.date'), size: 130, cell: (c) => f.stamp(c.getValue()) }),
    col.accessor('order', { header: t('ledger.col.order'), size: 150, cell: (c) => c.getValue() === '—' ? '—' : <Link to={`/orders?q=${c.getValue()}`} className="text-primary-600 hover:underline">{c.getValue()}</Link> }),
    col.accessor('debit', { header: t('ledger.col.debit') }),
    col.accessor('credit', { header: t('ledger.col.credit') }),
    col.accessor('amount', { header: t('ledger.col.amount'), size: 200, cell: (c) => c.getValue() < 0 ? <span className="font-semibold text-error-700">−{f.money2(Math.abs(c.getValue()))} · {t('ledger.storno')}</span> : <span className="font-semibold">{f.money2(c.getValue())}</span> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  const d = q.data;
  return (
    <>
      <PageHeader title={t('ledger.title')} meta={t('ledger.meta')} actions={<button type="button" className={outlineBtn} onClick={() => d && download('ledger.csv', csv([['id', 'at', 'order', 'debit', 'credit', 'amount_usd'], ...d.entries.map((e) => [e.id, e.at, e.order, e.debit, e.credit, e.amount.toFixed(2)])]))}>{t('common.exportExcel')}</button>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label={t('ledger.cash')} value={f.money2(d.summary.cash)} />
            <Stat label={t('ledger.receivables')} value={f.money2(d.summary.receivables)} />
            <Stat label={t('ledger.revenue')} value={f.money2(d.summary.revenue)} />
            <Stat label={t('ledger.bonus')} value={f.money2(d.summary.bonus)} />
            <Stat label={t('ledger.refunds')} value={f.money2(d.summary.refunds)} />
          </div>
          <p role="status" className={cn('flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-body-s-medium', d.summary.balanced ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700')}>
            {d.summary.balanced ? <CheckCircle2 aria-hidden="true" className="size-[18px]" /> : <AlertTriangle aria-hidden="true" className="size-[18px]" />}
            {d.summary.balanced ? t('ledger.balanced', { total: f.money2(d.summary.total), at: f.stamp(d.summary.reconciled_at) }) : t('ledger.unbalanced')}
          </p>
          <DataTable caption={t('ledger.title')} columns={columns} data={d.entries} getRowId={(r) => r.id} />
        </>
      )}
    </>
  );
}

const actionTone = (a: string) => (a.startsWith('pii.') ? 'warning' : 'neutral') as 'warning' | 'neutral';
/** 6.17 Аудит-лог (52:3273): неизменяемый журнал, фильтры, экспорт CSV. */
export function AuditPage() {
  const { t } = useTranslation(); const f = useFmt();
  const [who, setWho] = useState('all'); const [action, setAction] = useState('all'); const [date, setDate] = useState<string | undefined>();
  const q = useQuery({ queryKey: ['audit', who, action, date], queryFn: () => adminApi.security.audit({ who, action, date }) });
  const all = useQuery({ queryKey: ['audit-all'], queryFn: () => adminApi.security.audit({}) });
  const whos = [...new Set(all.data?.map((a) => a.actor))]; const actions = [...new Set(all.data?.map((a) => a.action))];
  const col = createColumnHelper<AuditEntry>();
  const columns = useMemo(() => [
    col.accessor('at', { header: t('ledger.acol.time'), size: 140, cell: (c) => f.stamp(c.getValue(), true) }),
    col.display({ id: 'who', header: t('ledger.acol.who'), size: 190, cell: (c) => { const r = c.row.original.actor_role; return `${c.row.original.actor}${r && ['admin', 'manager', 'content'].includes(r) ? ` (${t(`roles.${r}`).toLowerCase()})` : ''}`; } }),
    col.accessor('action', { header: t('ledger.acol.action'), size: 200, cell: (c) => <Pill tone={actionTone(c.getValue())} className="font-mono text-[12px]">{c.getValue()}</Pill> }),
    col.accessor('object', { header: t('ledger.acol.object'), size: 150, cell: (c) => /^ST-/.test(c.getValue()) ? <Link to={`/orders?q=${c.getValue()}`} className="font-semibold text-primary-600 hover:underline">{c.getValue()}</Link> : <span className="font-semibold text-primary-600">{c.getValue()}</span> }),
    col.accessor('details', { header: t('ledger.acol.details') }),
    col.accessor('ip', { header: t('ledger.acol.ip'), size: 110, cell: (c) => c.getValue() ?? '—' }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  return (
    <>
      <PageHeader title={t('ledger.auditTitle')} meta={t('ledger.auditMeta')} actions={<button type="button" className={outlineBtn} onClick={() => q.data && download('audit.csv', csv([['at', 'actor', 'action', 'object', 'details', 'ip'], ...q.data.map((a) => [a.at, a.actor, a.action, a.object, a.details, a.ip ?? ''])]))}>{t('common.exportCsv')}</button>} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-[200px]"><Select label={t('ledger.who')} placeholder={t('common.all')} value={who} onValueChange={setWho} options={[{ value: 'all', label: t('common.all') }, ...whos.map((w) => ({ value: w, label: w }))]} /></div>
        <div className="w-[220px]"><Select label={t('ledger.action')} placeholder={t('ledger.allActions')} value={action} onValueChange={setAction} options={[{ value: 'all', label: t('ledger.allActions') }, ...actions.map((a) => ({ value: a, label: a }))]} /></div>
        <div className="w-[240px]"><DateInput label={t('ledger.period')} placeholder={t('ledger.period')} value={date} onValueChange={setDate} locale={f.locale} prevLabel={t('common.prev')} nextLabel={t('common.next')} /></div>
        {date && <Button variant="ghost" onClick={() => setDate(undefined)}>✕</Button>}
      </div>
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : <DataTable caption={t('ledger.auditTitle')} columns={columns} data={q.data} getRowId={(r) => r.id} />}
    </>
  );
}
