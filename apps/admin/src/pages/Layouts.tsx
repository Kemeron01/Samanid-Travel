import { adminApi, type SeatCell, type SeatKind, type VehicleLayout } from '@samanid/api/admin';
import { Button, Input, Select, Switch, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Baby, Eraser, GripVertical, Info, User, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { ErrorBox, Loading, PageHeader, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

export function LayoutsTab() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ['layouts'], queryFn: adminApi.catalog.layouts });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data) return <Loading />;
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {q.data.map((l) => (
        <li key={l.id}><Link to={`/catalog/layouts/${l.id}`} className={cn(card, 'flex flex-col gap-1 p-5 hover:border-primary-500 focus-visible:focus-ring')}>
          <span className="text-h6 text-dark-900">{l.name}</span>
          <span className="text-caption text-dark-500">{l.plate} · {t('layout.total')}: {count(l.cells).total}</span>
        </Link></li>
      ))}
    </ul>
  );
}

const isSeat = (c: SeatCell) => c.kind === 'seat' || c.kind === 'child' || c.kind === 'blocked';
function count(cells: SeatCell[][]) { const all = cells.flat().filter(isSeat); return { total: all.length, online: all.filter((c) => c.kind !== 'blocked' && c.online !== false).length, child: all.filter((c) => c.kind === 'child').length }; }
/** Автонумерация: ряд (1…) + буква по номеру места в ряду (A, B, C…). Проход и пустые клетки не считаются. */
function renumber(cells: SeatCell[][]): SeatCell[][] {
  return cells.map((row, r) => { let k = 0; return row.map((c) => (isSeat(c) ? { ...c, label: `${r + 1}${String.fromCharCode(65 + k++)}` } : { kind: c.kind })); });
}
function resize(cells: SeatCell[][], rows: number, cols: number): SeatCell[][] {
  return renumber(Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => cells[r]?.[c] ?? { kind: 'empty' as SeatKind })));
}

const palette: { kind: SeatKind; icon: ReactNode }[] = [
  { kind: 'seat', icon: <span className="flex size-7 items-center justify-center rounded-[6px] bg-success-700 text-[9px] font-bold text-white">4A</span> },
  { kind: 'child', icon: <span className="flex size-7 items-center justify-center rounded-[6px] bg-accent-500 text-dark-900"><Baby className="size-4" /></span> },
  { kind: 'blocked', icon: <span className="flex size-7 items-center justify-center rounded-[6px] bg-dark-100 text-dark-400"><X className="size-4" /></span> },
  { kind: 'aisle', icon: <span className="flex size-7 items-center justify-center rounded-[6px] border border-dark-200 text-dark-500"><GripVertical className="size-4" /></span> },
  { kind: 'driver', icon: <span className="flex size-7 items-center justify-center rounded-[6px] border border-dark-200 text-dark-700"><User className="size-4" /></span> },
  { kind: 'empty', icon: <span className="flex size-7 items-center justify-center rounded-[6px] border border-dark-200 text-dark-700"><Eraser className="size-4" /></span> },
];

function CellView({ c }: { c: SeatCell }) {
  if (c.kind === 'aisle') return <span aria-hidden="true" className="block h-12 w-11" />;
  if (c.kind === 'empty') return <span aria-hidden="true" className="block h-12 w-11 rounded-sm border border-dashed border-dark-200" />;
  if (c.kind === 'driver') return <span aria-hidden="true" className="flex h-12 w-11 items-center justify-center rounded-full border-[1.5px] border-dark-300 text-dark-500"><User className="size-4" /></span>;
  const bg = c.kind === 'child' ? 'bg-accent-500 text-dark-900' : c.kind === 'blocked' ? 'bg-dark-100 text-dark-400' : 'bg-success-700 text-white';
  return (
    <span aria-hidden="true" className="relative block h-12 w-11">
      <span className={cn('absolute top-[18px] left-0 h-5 w-[5px] rounded-[2.5px]', bg)} /><span className={cn('absolute top-[18px] left-[39px] h-5 w-[5px] rounded-[2.5px]', bg)} />
      <span className={cn('absolute top-0.5 left-[7px] flex h-9 w-[30px] items-center justify-center rounded-[9px] text-caption font-bold', bg)}>{c.kind === 'child' ? <Baby className="size-4" /> : c.kind === 'blocked' ? <X className="size-4" /> : c.label}</span>
      <span className={cn('absolute top-[42px] left-0.5 h-[5px] w-10 rounded-[2.5px]', bg)} />
    </span>
  );
}

/** 6.8 Редактор схемы транспорта (46:1990). Кликом ставится выбранный элемент; места нумеруются автоматически. */
export function LayoutEditorPage() {
  const { id = '' } = useParams(); const { t } = useTranslation(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const nav = useNavigate(); const { session } = useSession();
  const q = useQuery({ queryKey: ['layout', id], queryFn: () => adminApi.catalog.layout(id) });
  const [l, setL] = useState<VehicleLayout | null>(null); const [tool, setTool] = useState<SeatKind>('seat'); const [sel, setSel] = useState<[number, number] | null>(null);
  useEffect(() => { if (q.data) { setL({ ...q.data, cells: renumber(q.data.cells) }); setSel(null); } }, [q.data]);
  const editable = can(session?.perms, 'catalog', 'full');
  const save = useMutation({ mutationFn: () => adminApi.catalog.saveLayout(l!), onSuccess: (d) => { qc.setQueryData(['layout', id], d); void qc.invalidateQueries({ queryKey: ['layouts'] }); toast({ type: 'success', title: t('layout.saved') }); }, onError });
  const dup = useMutation({ mutationFn: () => adminApi.catalog.duplicateLayout(id), onSuccess: (d) => { void qc.invalidateQueries({ queryKey: ['layouts'] }); nav(`/catalog/layouts/${d.id}`); }, onError });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!l) return <Loading rows={6} />;
  const place = (r: number, c: number) => {
    const cur = l.cells[r]![c]!;
    if (isSeat(cur) && tool !== 'empty' && tool === cur.kind) { setSel([r, c]); return; }
    const next = l.cells.map((row) => row.slice());
    next[r]![c] = tool === 'seat' || tool === 'child' || tool === 'blocked' ? { kind: tool, surcharge: 0, online: tool !== 'blocked' } : { kind: tool };
    setL({ ...l, cells: renumber(next) }); setSel(isSeat(next[r]![c]!) ? [r, c] : null);
  };
  const selected = sel ? l.cells[sel[0]]![sel[1]]! : null;
  const patchSel = (p: Partial<SeatCell>) => { if (!sel) return; const next = l.cells.map((row) => row.slice()); next[sel[0]]![sel[1]] = { ...selected!, ...p }; setL({ ...l, cells: renumber(next) }); };
  const n = count(l.cells);
  return (
    <>
      <PageHeader title={t('layout.title', { name: l.name })} meta={t('layout.meta', { count: l.used_in })}
        actions={editable && <><button type="button" className={outlineBtn} onClick={() => dup.mutate()}>{t('layout.duplicate')}</button><Button variant="secondary" loading={save.isPending} onClick={() => save.mutate()}>{t('layout.save')}</Button></>} />
      <div className="grid items-start gap-6 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <section aria-labelledby="el-h" className={cn(card, 'flex flex-col gap-1 p-4')}>
          <h2 id="el-h" className="mb-1 text-caption font-semibold text-dark-500">{t('layout.elements')}</h2>
          <div role="radiogroup" aria-labelledby="el-h" className="flex flex-col gap-1">
            {palette.map((p) => (
              <button key={p.kind} type="button" role="radio" aria-checked={tool === p.kind} disabled={!editable} onClick={() => setTool(p.kind)}
                className={cn('flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-body-s text-dark-900 focus-visible:focus-ring', tool === p.kind ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-[1.5px] border-transparent hover:bg-dark-100')}>
                <span aria-hidden="true">{p.icon}</span>{t(`layout.kinds.${p.kind}`)}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Input label={t('layout.rows')} inputMode="numeric" value={String(l.rows)} disabled={!editable} onChange={(e) => { const v = Math.min(20, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)); setL({ ...l, rows: v, cells: resize(l.cells, v, l.cols) }); }} />
            <Input label={t('layout.cols')} inputMode="numeric" value={String(l.cols)} disabled={!editable} onChange={(e) => { const v = Math.min(8, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)); setL({ ...l, cols: v, cells: resize(l.cells, l.rows, v) }); }} />
          </div>
        </section>
        <section aria-label={t('layout.title', { name: l.name })} className={cn(card, 'flex flex-col items-center gap-4 p-6')}>
          <div className="flex flex-col gap-3 rounded-[48px] border-2 border-dark-200 px-7 pt-6 pb-7">
            <div className="flex items-center justify-between text-caption text-dark-600"><span>{t('layout.entrance')}</span><span className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-dark-300 text-[11px]">{t('layout.driverShort')}</span></div>
            <div role="grid" aria-label={t('layout.title', { name: l.name })} className="flex flex-col gap-2">
              {l.cells.map((row, r) => (
                <div role="row" key={r} className="flex items-center gap-2">
                  {row.map((c, ci) => (
                    <button key={ci} role="gridcell" type="button" disabled={!editable} onClick={() => place(r, ci)} aria-selected={sel?.[0] === r && sel?.[1] === ci}
                      aria-label={t('layout.cell', { row: r + 1, col: ci + 1, kind: c.label ? `${t(`layout.kinds.${c.kind}`)} ${c.label}` : t(`layout.kinds.${c.kind}`) })}
                      className={cn('rounded-sm focus-visible:focus-ring', sel?.[0] === r && sel?.[1] === ci && 'ring-2 ring-primary-500 ring-offset-2')}>
                      {c.kind === 'aisle' ? <span aria-hidden="true" className="flex h-12 w-11 items-center justify-center text-caption text-dark-400">{r + 1}</span> : <CellView c={c} />}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="flex max-w-[480px] items-start gap-2 text-center text-caption text-dark-500"><Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />{t('layout.hint')}</p>
        </section>
        <section aria-labelledby="seat-h" className={cn(card, 'flex flex-col gap-4 p-5')}>
          {selected && isSeat(selected) ? <>
            <h2 id="seat-h" className="text-h5 text-dark-900">{t('layout.seatTitle', { label: selected.label })}</h2>
            <Select label={t('layout.seatType')} placeholder={t('layout.seatType')} value={selected.kind} disabled={!editable} onValueChange={(v) => patchSel({ kind: v as SeatKind, online: v !== 'blocked' })} options={(['seat', 'child', 'blocked'] as const).map((k) => ({ value: k, label: t(`layout.kinds.${k}`) }))} />
            <Input label={t('layout.surcharge')} inputMode="numeric" value={String(selected.surcharge ?? 0)} disabled={!editable} onChange={(e) => patchSel({ surcharge: Number(e.target.value.replace(/\D/g, '')) })} />
            <Switch label={t('layout.online')} checked={selected.kind !== 'blocked' && selected.online !== false} disabled={!editable || selected.kind === 'blocked'} onCheckedChange={(v) => patchSel({ online: v })} />
          </> : <p id="seat-h" className="text-body-s text-dark-500">{t('layout.selectCell')}</p>}
          <dl className="flex flex-col gap-2 rounded-[14px] bg-bg-page p-4 text-body-s">
            {([[t('layout.total'), n.total], [t('layout.onlineCount'), n.online], [t('layout.childCount'), n.child]] as const).map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-dark-500">{k}</dt><dd className="font-semibold text-dark-900">{v}</dd></div>)}
          </dl>
        </section>
      </div>
    </>
  );
}
