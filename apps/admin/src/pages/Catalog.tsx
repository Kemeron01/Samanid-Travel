import { adminApi, AdminError, type CatalogTour, type TourStatus } from '@samanid/api/admin';
import { formatMoney, messages, type Locale } from '@samanid/i18n';
import { Alert, Button, Input, Media, Modal, Select, Textarea, TourCard, cn } from '@samanid/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import { AlertTriangle, CheckCircle2, Pencil, User, Users, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useFmt } from '@/lib/format';
import { icu } from '@/lib/icu';
import { can } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { DataTable, ErrorBox, Field, Loading, PageHeader, Pill, RouteTabs, card, outlineBtn, useApiError, useToast } from '@/lib/ui';

const LANGS: Locale[] = ['ru', 'uz', 'en'];
const statusTone: Record<TourStatus, 'success' | 'neutral' | 'warning'> = { published: 'success', draft: 'neutral', hidden: 'warning' };

/** 6.6 Каталог туров (46:1187): шапка + вкладки разделов каталога. */
export function CatalogLayout() {
  const { t } = useTranslation(); const { session } = useSession(); const toast = useToast();
  const tours = useQuery({ queryKey: ['catalog-tours'], queryFn: adminApi.catalog.tours });
  const dest = new Set(tours.data?.map((x) => x.destination)).size;
  return (
    <>
      <PageHeader title={t('catalog.title')} meta={tours.data ? t('catalog.count', { tours: tours.data.length, dest }) : ' '}
        actions={can(session?.perms, 'catalog', 'full') && <>
          <button type="button" className={outlineBtn} onClick={() => toast({ type: 'info', title: t('catalog.notInDesign') })}>{t('catalog.import')}</button>
          <Button variant="secondary" onClick={() => toast({ type: 'info', title: t('catalog.notInDesign') })}>{t('catalog.new')}</Button>
        </>} />
      <RouteTabs label={t('catalog.title')} items={[
        { to: '/catalog', label: t('catalog.tabs.tours') }, { to: '/catalog/departures', label: t('catalog.tabs.departures') }, { to: '/catalog/addons', label: t('catalog.tabs.addons') },
        { to: '/catalog/transfers', label: t('catalog.tabs.transfers') }, { to: '/catalog/layouts', label: t('catalog.tabs.layouts'), end: false },
      ]} />
      <Outlet />
    </>
  );
}

export function ToursTab() {
  const { t } = useTranslation(); const f = useFmt(); const nav = useNavigate();
  const q = useQuery({ queryKey: ['catalog-tours'], queryFn: adminApi.catalog.tours });
  const col = createColumnHelper<CatalogTour>();
  const columns = useMemo(() => [
    col.display({ id: 'tour', header: t('catalog.col.tour'), size: 230, cell: (c) => (
      <span className="flex items-center gap-3">
        <Media tone={c.row.original.tone} className="relative size-12 shrink-0 rounded-[10px] [&_svg]:size-6" />
        <Link to={`/catalog/tours/${c.row.original.slug}`} onClick={(e) => e.stopPropagation()} className="line-clamp-2 text-body-s-medium text-dark-900 hover:underline">{c.row.original.title.ru}</Link>
      </span>
    ) }),
    col.accessor('type', { header: t('catalog.col.type'), size: 170, cell: (c) => c.getValue() === 'individual'
      ? <span className="inline-flex items-center gap-1.5 rounded-sm bg-dark-900 px-2.5 py-1.5 text-caption text-white"><User aria-hidden="true" className="size-3.5" />{t('orders.individual')}</span>
      : <span className="inline-flex items-center gap-1.5 rounded-sm border border-dark-200 px-2.5 py-1.5 text-caption text-dark-900"><Users aria-hidden="true" className="size-3.5" />{t('orders.group')}</span> }),
    col.accessor('destination', { header: t('catalog.col.dest'), size: 140 }),
    col.accessor('next', { header: t('catalog.col.next'), size: 150, cell: (c) => { const n = c.getValue(); return n ? <span className={n.sold === 0 ? 'text-error-700' : 'text-dark-700'}>{f.day(n.date)} · {n.sold}/{n.capacity}</span> : <span className="text-dark-700">{t('catalog.onRequest')}</span>; } }),
    col.accessor('price', { header: t('catalog.col.price'), size: 100, cell: (c) => <span className="font-semibold">{f.money(c.getValue())}</span> }),
    col.display({ id: 'langs', header: t('catalog.col.langs'), size: 140, cell: (c) => <span className="flex gap-1">{LANGS.map((l) => { const ok = Boolean(c.row.original.title[l] && (l === 'ru' || c.row.original.description[l] || c.row.original.title[l])); return <span key={l} title={ok ? t('catalog.langOk') : t('catalog.langMissing')} className={cn('rounded-xs px-1.5 py-0.5 text-caption uppercase', ok ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700')}>{l}<span className="sr-only">: {ok ? t('catalog.langOk') : t('catalog.langMissing')}</span></span>; })}</span> }),
    col.accessor('status', { header: t('catalog.col.status'), size: 130, cell: (c) => <Pill tone={statusTone[c.getValue()]}>{t(`catalog.st.${c.getValue()}`)}</Pill> }),
    col.display({ id: 'edit', size: 48, header: () => <span className="sr-only">{t('common.edit')}</span>, cell: (c) => <Link to={`/catalog/tours/${c.row.original.slug}`} aria-label={`${t('common.edit')}: ${c.row.original.title.ru}`} onClick={(e) => e.stopPropagation()} className="inline-flex size-9 items-center justify-center rounded-full text-dark-500 hover:bg-dark-100 focus-visible:focus-ring"><Pencil className="size-[18px]" /></Link> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [t, f.locale]);
  return q.isError ? <ErrorBox error={q.error} onRetry={() => q.refetch()} /> : !q.data ? <Loading /> : <DataTable caption={t('catalog.title')} columns={columns} data={q.data} getRowId={(r) => r.slug} onRowClick={(r) => nav(`/catalog/tours/${r.slug}`)} />;
}

export function DeparturesTab() {
  const { t } = useTranslation(); const f = useFmt();
  const tours = useQuery({ queryKey: ['catalog-tours'], queryFn: adminApi.catalog.tours });
  const rows = (tours.data ?? []).filter((x) => x.next).map((x) => ({ slug: x.slug, title: x.title.ru, ...x.next! })).sort((a, b) => a.date.localeCompare(b.date));
  const col = createColumnHelper<(typeof rows)[number]>();
  const columns = [
    col.accessor('date', { header: t('catalog.col.next'), size: 160, cell: (c) => f.day(c.getValue()) }),
    col.accessor('title', { header: t('catalog.col.tour'), cell: (c) => <Link className="text-primary-600 hover:underline" to={`/catalog/tours/${c.row.original.slug}`}>{c.getValue()}</Link> }),
    col.display({ id: 'sold', header: t('manifest.pax'), size: 140, cell: (c) => `${c.row.original.sold} / ${c.row.original.capacity}` }),
  ];
  return tours.isError ? <ErrorBox error={tours.error} onRetry={() => tours.refetch()} /> : !tours.data ? <Loading /> : <DataTable caption={t('catalog.tabs.departures')} columns={columns} data={rows} getRowId={(r) => r.slug} />;
}

export function NotInDesignTab() {
  const { t } = useTranslation();
  return <p className={cn(card, 'p-8 text-body-m text-dark-600')}>{t('catalog.notInDesign')}</p>;
}

function ReadyItem({ ok, label }: { ok: boolean; label: string }) {
  const { t } = useTranslation();
  return <li className={cn('flex items-center gap-2 text-body-s', ok ? 'text-dark-700' : 'text-error-700')}>{ok ? <CheckCircle2 aria-hidden="true" className="size-[18px] text-success-700" /> : <XCircle aria-hidden="true" className="size-[18px]" />}{label}<span className="sr-only">: {ok ? t('tour.filled') : t('tour.missing')}</span></li>;
}

/** 6.7 Редактирование тура (46:1569): RU/UZ/EN, параметры, выезды с конфликтами, превью карточки, чек-лист готовности. */
export function TourEditPage() {
  const { slug = '' } = useParams(); const { t } = useTranslation(); const f = useFmt(); const qc = useQueryClient(); const toast = useToast(); const onError = useApiError(); const { session } = useSession();
  const q = useQuery({ queryKey: ['catalog-tour', slug], queryFn: () => adminApi.catalog.tour(slug) });
  const [draft, setDraft] = useState<CatalogTour | null>(null); const [lang, setLang] = useState<Locale>('ru'); const [tab, setTab] = useState('main');
  const [depOpen, setDepOpen] = useState(false);
  const res = useQuery({ queryKey: ['resources-list'], queryFn: () => adminApi.resources.list() });
  const rname = (id: string | null) => res.data?.find((r) => r.id === id)?.name ?? id ?? '—';
  const rmeta = (id: string) => { const r = res.data?.find((x) => x.id === id); return r ? `${r.name} · ${r.meta.split(' · ')[0]}` : id; };
  useEffect(() => { if (q.data) setDraft(q.data.tour); }, [q.data]);
  const editable = can(session?.perms, 'catalog', 'full');
  const save = useMutation({ mutationFn: (publish: boolean) => adminApi.catalog.save(slug, draft!, publish), onSuccess: (_d, publish) => { void qc.invalidateQueries({ queryKey: ['catalog-tour', slug] }); void qc.invalidateQueries({ queryKey: ['catalog-tours'] }); toast({ type: 'success', title: publish ? t('tour.published') : t('tour.draftSaved') }); }, onError: (e) => (e instanceof AdminError && e.code === 'validation' ? toast({ type: 'error', title: t('tour.notReady') }) : onError(e)) });
  if (q.isError) return <ErrorBox error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data || !draft) return <Loading rows={6} />;
  const deps = q.data.departures;
  const ready = adminApi.catalog.readiness(draft, deps);
  const missing = LANGS.filter((l) => l !== 'ru' && !(draft.title[l] && draft.description[l])).map((l) => l.toUpperCase());
  const set = <K extends keyof CatalogTour>(k: K, v: CatalogTour[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const setText = (k: 'title' | 'description', v: string) => setDraft((d) => (d ? { ...d, [k]: { ...d[k], [lang]: v } } : d));
  const numErr = (v: number, min = 1, max?: number) => (!Number.isFinite(v) || v < min || (max !== undefined && v > max) ? (max ? t('tour.pct') : t('tour.min1')) : undefined);
  const site = messages[lang];
  const tabs = ['main', 'program', 'departures', 'addons', 'media', 'seo'] as const;
  return (
    <>
      <PageHeader title={draft.title.ru || slug} meta={t('tour.meta', { status: t(`catalog.st.${draft.status}`), when: f.dayTime(draft.updated_at), who: draft.updated_by })}
        actions={editable && <>
          <a href={`${import.meta.env.VITE_SITE_URL ?? 'http://localhost:3000'}/${lang}/tours/${slug}`} target="_blank" rel="noopener noreferrer" className="rounded-xs px-3 text-body-s-medium text-primary-500 hover:underline focus-visible:focus-ring">{t('tour.preview')}</a>
          <button type="button" className={outlineBtn} disabled={save.isPending} onClick={() => save.mutate(false)}>{t('tour.saveDraft')}</button>
          <Button variant="secondary" loading={save.isPending} disabled={!Object.values(ready).every(Boolean)} title={Object.values(ready).every(Boolean) ? undefined : t('tour.notReady')} onClick={() => save.mutate(true)}>{t('tour.publish')}</Button>
        </>} />
      <div role="tablist" aria-label={draft.title.ru} className="flex gap-7 overflow-x-auto border-b border-dark-200">
        {tabs.map((k) => <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cn('-mb-px shrink-0 border-b-2 pb-3 text-body-m focus-visible:focus-ring', tab === k ? 'border-primary-500 text-primary-500' : 'border-transparent text-dark-600 hover:text-dark-900')}>{t(`tour.tabs.${k}`)}</button>)}
      </div>
      {tab !== 'main' && tab !== 'departures' ? <p className={cn(card, 'p-8 text-body-m text-dark-600')}>{t('tour.sectionTodo')}</p> : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col gap-6">
            {tab === 'main' && <>
              <section aria-labelledby="nd-h" className={cn(card, 'flex flex-col gap-4 p-6')}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="nd-h" className="text-h5 text-dark-900">{t('tour.nameDesc')}</h2>
                  <div role="radiogroup" aria-label={t('tour.nameDesc')} className="flex gap-2">
                    {LANGS.map((l) => { const ok = Boolean(draft.title[l] && draft.description[l]); return (
                      <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)} aria-label={t('tour.langState', { lang: l.toUpperCase(), state: ok ? t('tour.filled') : t('tour.missing') })}
                        className={cn('inline-flex h-10 items-center gap-2 rounded-full px-3.5 text-body-s-medium uppercase focus-visible:focus-ring', lang === l ? 'bg-dark-900 text-white' : 'border border-dark-200 bg-white text-dark-900')}>
                        {l}<span aria-hidden="true" className={cn('size-2 rounded-full', ok ? 'bg-success-600' : 'bg-warning-500')} />
                      </button>); })}
                  </div>
                </div>
                <Input lang={lang} label={t('tour.name', { lang: lang.toUpperCase() })} value={draft.title[lang]} disabled={!editable} onChange={(e) => setText('title', e.target.value)} error={lang === 'ru' && !draft.title.ru ? t('tour.required') : undefined} />
                <Textarea lang={lang} label={t('tour.desc', { lang: lang.toUpperCase() })} rows={4} maxLength={500} value={draft.description[lang]} disabled={!editable} onChange={(e) => setText('description', e.target.value)} helper={`${draft.description[lang].length} / 500`} />
                {missing.length > 0 && <Alert type="warning" title={t('tour.noTrTitle', { langs: missing.join(' и ') })}>{t('tour.noTrText')}</Alert>}
              </section>
              <section aria-labelledby="pr-h" className={cn(card, 'flex flex-col gap-4 p-6')}>
                <h2 id="pr-h" className="text-h5 text-dark-900">{t('tour.params')}</h2>
                <div className="grid max-w-[556px] grid-cols-2 gap-4">
                  <Select label={t('tour.type')} placeholder={t('tour.type')} value={draft.type} disabled={!editable} onValueChange={(v) => set('type', v as CatalogTour['type'])} options={[{ value: 'group', label: t('orders.group') }, { value: 'individual', label: t('orders.individual') }]} />
                  <Input label={t('tour.dest')} value={draft.destination} disabled={!editable} onChange={(e) => set('destination', e.target.value)} />
                  <Input label={t('tour.days')} inputMode="numeric" value={String(draft.duration_days)} disabled={!editable} onChange={(e) => set('duration_days', Number(e.target.value.replace(/\D/g, '')))} error={numErr(draft.duration_days)} />
                  <Input label={t('tour.group')} inputMode="numeric" value={String(draft.group_max)} disabled={!editable} onChange={(e) => set('group_max', Number(e.target.value.replace(/\D/g, '')))} error={numErr(draft.group_max)} />
                  <Input label={t('tour.price')} inputMode="numeric" value={String(draft.price)} disabled={!editable} onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')))} error={numErr(draft.price)} />
                  <Input label={t('tour.child')} inputMode="numeric" value={String(draft.child_pct)} disabled={!editable} onChange={(e) => set('child_pct', Number(e.target.value.replace(/\D/g, '')))} error={numErr(draft.child_pct, 0, 100)} />
                </div>
              </section>
            </>}
            <section aria-labelledby="dp-h" className={cn(card, 'flex flex-col gap-3 p-6')}>
              <div className="flex items-center justify-between gap-3"><h2 id="dp-h" className="text-h5 text-dark-900">{t('tour.departures')}</h2>{editable && <button type="button" className={outlineBtn} onClick={() => setDepOpen(true)}>{t('tour.addDeparture')}</button>}</div>
              <ul className="flex flex-col gap-3">
                {deps.map((d) => (
                  <li key={d.id} className={cn('flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg px-4 py-3', d.conflict ? 'border-[1.5px] border-error-600 bg-error-100' : 'bg-bg-page')}>
                    <div className="flex min-w-0 flex-1 flex-col"><span className="text-body-s-medium text-dark-900">{f.range(d.from, d.to)}</span><span className="text-caption text-dark-500">{rmeta(d.vehicle_id)}</span></div>
                    {d.conflict ? <span className="flex items-center gap-1.5 text-caption text-error-700"><AlertTriangle aria-hidden="true" className="size-4" />{d.conflict}</span> : <span className="flex items-center gap-1.5 text-caption text-dark-700"><User aria-hidden="true" className="size-4" />{rname(d.guide_id)}</span>}
                    <span className="text-caption text-dark-700">{t('tour.sold', { sold: d.sold, cap: d.capacity })}</span>
                    <span className="text-body-s-medium text-dark-900">{d.dynamic ? `${f.money(d.base)} → ${f.money(d.dynamic)} ${t('tour.demand')}` : f.money(d.base)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <aside className="flex flex-col gap-6">
            <section aria-labelledby="cp-h" className={cn(card, 'flex flex-col gap-3 p-4')}>
              <h2 id="cp-h" className="text-body-s-medium text-dark-700">{t('tour.cardPreview')}</h2>
              <div lang={lang} inert className="pointer-events-none">
                <TourCard href="#" title={draft.title[lang] || draft.title.ru} region={draft.destination} image={{ tone: draft.tone, caption: draft.destination }}
                  tags={[{ type: 'hit', label: site.tour.tags.hit }]} favorite={{ active: false, onToggle: () => undefined, label: site.tour.favoriteAdd }}
                  facts={{ duration: icu(site.tour.days, { count: draft.duration_days }, lang), group: icu(site.tour.groupMax, { count: draft.group_max }, lang), nextDate: deps[0] ? f.day(deps[0].from) : '—' }}
                  rating={{ value: 4.9, count: 128 }} priceTemplate={site.price.from} price={formatMoney(draft.price, lang)} perPerson={site.tour.perPerson}
                  seatsLeft={deps[0] ? icu(site.tour.seatsLeft, { count: Math.max(0, deps[0].capacity - deps[0].sold) }, lang) : undefined} />
              </div>
            </section>
            <section aria-labelledby="rd-h" className={cn(card, 'flex flex-col gap-3 p-5')}>
              <h2 id="rd-h" className="text-h6 text-dark-900">{t('tour.readiness')}</h2>
              <ul className="flex flex-col gap-2">{(Object.keys(ready) as (keyof typeof ready)[]).map((k) => <ReadyItem key={k} ok={ready[k]} label={t(`tour.ready.${k}`)} />)}</ul>
            </section>
          </aside>
        </div>
      )}
      <AddDeparture open={depOpen} onOpenChange={setDepOpen} slug={slug} onDone={() => void qc.invalidateQueries({ queryKey: ['catalog-tour', slug] })} />
    </>
  );
}

function AddDeparture({ open, onOpenChange, slug, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string; onDone: () => void }) {
  const { t } = useTranslation(); const toast = useToast(); const onError = useApiError();
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [guide, setGuide] = useState(''); const [conflict, setConflict] = useState<string>();
  const guides = useQuery({ queryKey: ['resources-list', 'guide'], queryFn: () => adminApi.resources.list('guide') });
  const m = useMutation({ mutationFn: () => adminApi.catalog.addDeparture(slug, from, to, guide || null, 'v1'), onSuccess: () => { onDone(); onOpenChange(false); toast({ type: 'success', title: t('resources.saved') }); }, onError: (e) => (e instanceof AdminError && e.code === 'conflict' ? setConflict(e.detail) : onError(e)) });
  return (
    <Modal open={open} onOpenChange={(o) => { onOpenChange(o); setConflict(undefined); }} title={t('tour.newDeparture')} closeLabel={t('common.close')}
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button><Button variant="secondary" loading={m.isPending} disabled={!from || !to || to < from} onClick={() => m.mutate()}>{t('common.save')}</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <Field id="dep-from" label={t('tour.from')}><input id="dep-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setConflict(undefined); }} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" /></Field>
        <Field id="dep-to" label={t('tour.to')}><input id="dep-to" type="date" value={to} min={from} onChange={(e) => { setTo(e.target.value); setConflict(undefined); }} className="h-[52px] rounded-md border border-dark-200 px-4 text-body-m focus-visible:focus-ring" /></Field>
        <div className="col-span-2"><Select label={t('tour.guide')} placeholder={t('tour.guide')} value={guide} onValueChange={(v) => { setGuide(v); setConflict(undefined); }} options={(guides.data ?? []).map((g) => ({ value: g.id, label: `${g.name} · ${g.meta}` }))} /></div>
        {conflict && <div className="col-span-2"><Alert type="error" title={t('tour.conflict', { detail: conflict })} /></div>}
      </div>
    </Modal>
  );
}
