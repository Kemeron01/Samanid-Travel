import { adminApi, AdminError, type Assignment } from '@samanid/api/admin';
import { Alert, Button, Input, Modal, Select, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFmt } from '@/lib/format';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { ErrorBox, Field, Loading, PageHeader, PillSwitch, card, useApiError, useToast } from '@/lib/ui';

const addDays = (iso: string, n: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + n * 86400_000).toISOString().slice(0, 10);
const stateCls: Record<Assignment['state'], string> = { assigned: 'border-primary-500 bg-primary-50 text-primary-600', pending: 'border-warning-500 bg-warning-100 text-warning-700', conflict: 'border-error-600 bg-error-100 text-error-700' };

/** 6.9 Гиды и транспорт (50:4937): недельный календарь, конфликты подсвечены и не сохраняются (409). */
export function ResourcesPage() {
  const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const [kind, setKind] = useState<'guide' | 'vehicle'>('guide'); const [week, setWeek] = useState('2027-03-24');
  const q = useQuery({ queryKey: ['week', kind, week], queryFn: () => adminApi.resources.week(kind, week) });
  const [assignOpen, setAssignOpen] = useState(false); const [fix, setFix] = useState<Assignment | null>(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const editable = can(session?.perms, 'resources', 'full');
  const d = q.data;
  const fmtRange = (r: string) => { const [a, b] = r.split('/'); return f.range(a!, b!).replace(/\s\d{4}$/, ''); };
  return (
    <>
      <PageHeader title={t('resources.title')} meta={t('resources.week', { range: f.range(week, addDays(week, 6)) })}
        actions={<>
          <PillSwitch label={t('resources.title')} value={kind} onChange={setKind} options={[{ value: 'guide', label: t('resources.guides') }, { value: 'vehicle', label: t('resources.vehicles') }]} />
          <div className="flex gap-1"><button type="button" aria-label={t('resources.prevWeek')} onClick={() => setWeek(addDays(week, -7))} className="inline-flex size-10 items-center justify-center rounded-full border border-dark-200 bg-white hover:bg-dark-100 focus-visible:focus-ring"><ChevronLeft className="size-5" /></button><button type="button" aria-label={t('resources.nextWeek')} onClick={() => setWeek(addDays(week, 7))} className="inline-flex size-10 items-center justify-center rounded-full border border-dark-200 bg-white hover:bg-dark-100 focus-visible:focus-ring"><ChevronRight className="size-5" /></button></div>
          {editable && <Button variant="secondary" onClick={() => setAssignOpen(true)}>{t('resources.assign')}</Button>}
        </>} />
      {q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !d ? <Loading /> : (
        <>
          {d.conflicts.length > 0 && (
            <Alert type="error" title={t('resources.conflicts', { count: d.conflicts.length })}>
              {d.conflicts.map((c) => <span key={c.b} className="block">{t('resources.conflictText', { who: c.resource, a: c.a, ar: fmtRange(c.a_range), b: c.b, br: fmtRange(c.b_range) })}</span>)}
            </Alert>
          )}
          <div className={cn(card, 'relative overflow-x-auto rounded-2xl')}>
            <table className="w-full min-w-[900px] table-fixed border-collapse">
              <caption className="sr-only">{t('resources.title')}</caption>
              <thead className="bg-bg-page"><tr>
                <th scope="col" className="w-[200px] px-4 py-3 text-left text-caption font-medium text-dark-500">{kind === 'guide' ? t('resources.guide') : t('resources.vehicle')}</th>
                {days.map((day) => { const wd = new Date(`${day}T00:00:00Z`).getUTCDay(); return <th key={day} scope="col" className={cn('py-3 text-center text-caption font-medium', wd === 0 || wd === 6 ? 'text-error-700' : 'text-dark-700')}>{f.weekday(day)} {Number(day.slice(8))}</th>; })}
              </tr></thead>
              <tbody>
                {d.resources.map((r) => {
                  const items = d.assignments.filter((a) => a.resource_id === r.id);
                  return (
                    <tr key={r.id} className="border-t border-dark-100 align-top">
                      <th scope="row" className="px-4 py-4 text-left"><span className="block text-body-s-medium text-dark-900">{r.name}</span><span className="text-caption text-dark-500">{r.meta}</span></th>
                      <td colSpan={7} className="relative p-0">
                        <div className="pointer-events-none absolute inset-0 grid grid-cols-7" aria-hidden="true">{days.map((day) => <span key={day} className="border-l border-dark-100" />)}</div>
                        <ul className="relative flex min-h-[64px] flex-col gap-1.5 py-3">
                          {items.map((a) => {
                            const s = Math.max(0, days.indexOf(a.from) === -1 ? (a.from < week ? 0 : 7) : days.indexOf(a.from));
                            const e = days.indexOf(a.to) === -1 ? (a.to > days[6]! ? 6 : -1) : days.indexOf(a.to);
                            if (e < s) return null;
                            return (
                              <li key={a.id} className="grid grid-cols-7 px-0.5">
                                <button type="button" disabled={!editable || a.state !== 'conflict'} onClick={() => setFix(a)}
                                  style={{ gridColumn: `${s + 1} / ${e + 2}` }}
                                  aria-label={`${a.title}, ${f.range(a.from, a.to)}${a.state === 'conflict' ? `, ${t('resources.legend.conflict')} — ${t('resources.resolve')}` : a.state === 'pending' ? `, ${t('resources.legend.pending')}` : ''}`}
                                  className={cn('mx-0.5 flex h-8 items-center gap-1.5 truncate rounded-[8px] border px-2.5 text-left text-body-s focus-visible:focus-ring disabled:cursor-default', stateCls[a.state], a.state === 'conflict' && 'border-[1.5px] hover:bg-error-100/70')}>
                                  {a.state === 'conflict' && <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />}<span className="truncate">{a.title}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="flex flex-wrap gap-6 text-caption text-dark-600" aria-label={t('resources.title')}>
            {(['assigned', 'pending', 'conflict'] as const).map((s) => <li key={s} className="flex items-center gap-2"><span aria-hidden="true" className={cn('h-3 w-5 rounded-[4px] border', stateCls[s])} />{t(`resources.legend.${s}`)}</li>)}
          </ul>
        </>
      )}
      <AssignModal open={assignOpen} onOpenChange={setAssignOpen} kind={kind} resources={d?.resources ?? []} defaultFrom={week} onDone={() => { void qc.invalidateQueries({ queryKey: ['week'] }); toast({ type: 'success', title: t('resources.saved') }); }} />
      <ReassignModal a={fix} onClose={() => setFix(null)} resources={d?.resources ?? []} onDone={() => { void qc.invalidateQueries({ queryKey: ['week'] }); void qc.invalidateQueries({ queryKey: ['catalog-tour'] }); setFix(null); toast({ type: 'success', title: t('resources.saved') }); }} onError={onError} />
    </>
  );
}

function AssignModal({ open, onOpenChange, kind, resources, defaultFrom, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; kind: 'guide' | 'vehicle'; resources: { id: string; name: string }[]; defaultFrom: string; onDone: () => void }) {
  const { t } = useTranslation(); const onError = useApiError();
  const [rid, setRid] = useState(''); const [title, setTitle] = useState(''); const [from, setFrom] = useState(defaultFrom); const [to, setTo] = useState(defaultFrom); const [conflict, setConflict] = useState<string>();
  const m = useMutation({ mutationFn: () => adminApi.resources.assign(rid, title, from, to), onSuccess: () => { onDone(); onOpenChange(false); setTitle(''); }, onError: (e) => (e instanceof AdminError && e.code === 'conflict' ? setConflict(e.detail) : onError(e)) });
  return (
    <Modal open={open} onOpenChange={(o) => { onOpenChange(o); setConflict(undefined); }} title={t('resources.assignTitle')} closeLabel={t('common.close')}
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button><Button variant="secondary" loading={m.isPending} disabled={!rid || !title.trim() || to < from || Boolean(conflict)} onClick={() => m.mutate()}>{t('common.save')}</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><Select label={kind === 'guide' ? t('resources.guide') : t('resources.vehicle')} placeholder={t('resources.resource')} value={rid} onValueChange={(v) => { setRid(v); setConflict(undefined); }} options={resources.map((r) => ({ value: r.id, label: r.name }))} /></div>
        <div className="col-span-2"><Input label={t('resources.what')} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <Field id="as-from" label={t('resources.from')}><input id="as-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setConflict(undefined); }} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" /></Field>
        <Field id="as-to" label={t('resources.to')}><input id="as-to" type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setConflict(undefined); }} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" /></Field>
        {conflict && <div className="col-span-2"><Alert type="error" title={t('resources.busy', { detail: conflict })} /></div>}
      </div>
    </Modal>
  );
}

function ReassignModal({ a, onClose, resources, onDone, onError }: { a: Assignment | null; onClose: () => void; resources: { id: string; name: string }[]; onDone: () => void; onError: (e: unknown) => void }) {
  const { t } = useTranslation(); const [rid, setRid] = useState(''); const [conflict, setConflict] = useState<string>();
  const m = useMutation({ mutationFn: () => adminApi.resources.reassign(a!.id, rid), onSuccess: onDone, onError: (e) => (e instanceof AdminError && e.code === 'conflict' ? setConflict(e.detail) : onError(e)) });
  return (
    <Modal open={Boolean(a)} onOpenChange={(o) => { if (!o) { onClose(); setRid(''); setConflict(undefined); } }} title={t('resources.resolveTitle', { title: a?.title ?? '' })} closeLabel={t('common.close')}
      footer={<><Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button><Button variant="secondary" loading={m.isPending} disabled={!rid || Boolean(conflict)} onClick={() => m.mutate()}>{t('resources.resolve')}</Button></>}>
      <div className="flex flex-col gap-4">
        <Select label={t('resources.resource')} placeholder={t('resources.resource')} value={rid} onValueChange={(v) => { setRid(v); setConflict(undefined); }} options={resources.filter((r) => r.id !== a?.resource_id).map((r) => ({ value: r.id, label: r.name }))} />
        {conflict && <Alert type="error" title={t('resources.busy', { detail: conflict })} />}
      </div>
    </Modal>
  );
}
