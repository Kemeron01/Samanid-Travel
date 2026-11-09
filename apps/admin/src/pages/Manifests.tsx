import { adminApi } from '@samanid/api/admin';
import { Button, Checkbox, Logo, cn } from '@samanid/ui';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AlertCircle, Baby, Download, Eye, Lock, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { DataTable, ErrorBox, Loading, PageHeader, Stat, card, outlineBtn, useApiError, useToast } from '@/lib/ui';
import type { ManifestRow } from '@samanid/api/admin';

/** Список выездов с манифестами. В макете отдельного экрана нет — ведёт на 6.10. */
export function ManifestsList() {
  const { t } = useTranslation(); const f = useFmt();
  const q = useQuery({ queryKey: ['manifests'], queryFn: adminApi.manifests.list });
  return (
    <>
      <PageHeader title={t('nav.manifests')} meta={t('manifest.list')} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {q.data.map((m) => <li key={m.departure_id}><Link to={`/manifests/${m.departure_id}`} className={cn(card, 'flex flex-col gap-1 p-5 hover:border-primary-500 focus-visible:focus-ring')}><span className="text-h6 text-dark-900">{m.tour}</span><span className="text-caption text-dark-500">{f.day(m.date)} · {m.sold} / {m.capacity}</span></Link></li>)}
        </ul>
      )}
    </>
  );
}

/** 6.10 Манифест рейса (50:5203): ПД — просмотр и выгрузка пишутся в аудит. «Скачать PDF» — печать страницы (print CSS). */
export function ManifestPage() {
  const { id = '' } = useParams(); const { t } = useTranslation(); const f = useFmt(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['manifest', id], queryFn: () => adminApi.manifests.get(id) });
  const send = useMutation({ mutationFn: () => adminApi.manifests.sendLink(id), onSuccess: (r) => toast({ type: 'success', title: t('manifest.sent', { date: f.day(r.until) }) }), onError });
  const col = createColumnHelper<ManifestRow>();
  const columns = useMemo(() => [
    col.accessor('seat', { header: t('manifest.col.seat'), size: 80, cell: (c) => <span className="inline-flex h-8 w-10 items-center justify-center rounded-[8px] bg-primary-500 text-caption text-white">{c.getValue()}</span> }),
    col.accessor('name', { header: t('manifest.col.name'), size: 240, cell: (c) => <span className="font-semibold">{c.getValue()}</span> }),
    col.display({ id: 'age', header: t('manifest.col.age'), size: 100, cell: (c) => `${c.row.original.age}${c.row.original.child ? ` · ${t('manifest.child')}` : ''}` }),
    col.accessor('citizenship', { header: t('manifest.col.citizenship'), size: 130 }),
    col.accessor('contact', { header: t('manifest.col.contact'), size: 170, cell: (c) => c.getValue() ?? <span className="text-dark-400">—</span> }),
    col.accessor('notes', { header: t('manifest.col.notes'), cell: (c) => c.getValue() ?? <span className="text-dark-400">—</span> }),
    col.accessor('order', { header: t('manifest.col.order'), size: 140, cell: (c) => <Link to={`/orders?q=${c.getValue()}`} className="text-primary-600 hover:underline">{c.getValue()}</Link> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t]);
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  const m = q.data; if (!m) return <Loading rows={6} />;
  const kids = m.rows.filter((r) => r.child);
  return (
    <>
      <PageHeader title={t('manifest.title', { tour: m.tour, date: f.day(m.date) })} meta={t('manifest.meta', { vehicle: m.vehicle, plate: m.plate, guide: m.guide, time: m.meeting_time, place: m.meeting_place })}
        actions={<div className="flex gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className={outlineBtn}>{t('manifest.pdf')}<Download aria-hidden="true" className="size-[18px]" /></button>
          {can(session?.perms, 'resources', 'full') && <Button variant="secondary" loading={send.isPending} onClick={() => send.mutate()}>{t('manifest.send')}<Send aria-hidden="true" className="size-[18px]" /></Button>}
        </div>} />
      <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Stat label={t('manifest.pax')} value={t('manifest.paxOf', { n: m.pax_total, cap: m.capacity })} />
        <Stat label={t('manifest.kids')} value={t('manifest.kidsValue', { n: kids.length, seats: kids.filter((k) => k.child_seat).length })} />
        <Stat label={t('manifest.unpaid')} value={m.unpaid} />
        <Stat label={t('manifest.wishes')} value={m.rows.filter((r) => r.notes).length} />
      </div>
      <DataTable caption={t('manifest.title', { tour: m.tour, date: f.day(m.date) })} columns={columns} data={m.rows} getRowId={(r) => r.seat} rowClassName={(r) => (r.child ? 'bg-accent-100' : undefined)} />
      <p className="flex items-center gap-2 text-caption text-dark-500"><Lock aria-hidden="true" className="size-3.5" />{t('manifest.pii', { date: f.day(m.link_until) })}</p>
    </>
  );
}

/** 6.11 Манифест для гида (публичная ссылка, mobile 390): только просмотр, без контактов, отметка посадки локально. */
export function GuideManifestPage() {
  const { token = '' } = useParams(); const { t } = useTranslation(); const f = useFmt();
  const q = useQuery({ queryKey: ['guide', token], queryFn: () => adminApi.manifests.guide(token) });
  const key = `st_guide_${token}`;
  const [boarded, setBoarded] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]') as string[]; } catch { return []; } });
  const toggle = (seat: string) => setBoarded((b) => { const n = b.includes(seat) ? b.filter((x) => x !== seat) : [...b, seat]; try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  if (q.isPending) return <main className="p-4"><Loading /></main>;
  const m = q.data;
  if (!m) return <main className="flex min-h-dvh items-center justify-center bg-bg-page p-4"><p role="alert" className="text-body-m text-dark-700">{t('manifest.expired')}</p></main>;
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-[480px] flex-col bg-bg-page">
      <header className="flex flex-col gap-2 bg-dark-900 px-4 pt-4 pb-5">
        <Logo onDark compact />
        <h1 className="text-h5 text-white">{m.tour} · {f.day(m.date)}</h1>
        <p className="text-caption text-dark-300">{t('manifest.guideMeta', { time: m.meeting_time, place: m.meeting_place, count: m.pax_total })}</p>
      </header>
      <p className="flex items-center gap-2 px-4 pt-3 pb-2 text-caption text-dark-500"><Eye aria-hidden="true" className="size-3.5" />{t('manifest.viewOnly', { date: f.day(m.link_until) })}</p>
      <p className="sr-only" aria-live="polite">{t('manifest.boarded', { n: boarded.length, total: m.rows.length })}</p>
      <ul className="flex flex-col gap-2 px-4 pb-4">
        {m.rows.map((r) => (
          <li key={r.seat} className={cn('flex items-center gap-3 rounded-lg border px-3 py-3', r.child ? 'border-accent-500/40 bg-accent-100' : 'border-dark-200 bg-white')}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-primary-500 text-caption text-white">{r.seat}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-s-medium text-dark-900">{r.name}</span>
              <span className="text-caption text-dark-500">{t('manifest.years', { n: r.age })}</span>
              {r.notes && <span className="flex items-center gap-1 text-caption text-warning-700">{r.child ? <Baby aria-hidden="true" className="size-3.5" /> : <AlertCircle aria-hidden="true" className="size-3.5" />}{r.notes}</span>}
            </span>
            <Checkbox label={<span className="sr-only">{t('manifest.checkin', { name: r.name })}</span>} checked={boarded.includes(r.seat)} onCheckedChange={() => toggle(r.seat)} />
          </li>
        ))}
      </ul>
      <div className="sticky bottom-0 mt-auto bg-bg-page px-0 pb-[env(safe-area-inset-bottom)]">
        <button type="button" onClick={() => window.print()} className={cn(outlineBtn, 'h-[59px] w-full rounded-full text-button-l')}>{t('manifest.pdf')}</button>
      </div>
    </main>
  );
}
