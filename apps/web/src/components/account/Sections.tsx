'use client';
import { Alert, Button, Chip, EmptyState, Input, Media, Modal, PaymentScheduleRow, PhoneInput, ReviewCard, SegmentedControl, StatusBadge, Switch, Textarea, ToastView, cn } from '@samanid/ui';
import { api, type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CircleCheck, Clock, Copy, Globe, Gift, Loader2, LockKeyhole, Phone, Send, Shield, Smartphone, Star, TriangleAlert, Users, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { TourCardView } from '@/components/tours/TourCardView';
import { hms, useCountdown } from '@/components/waitlist/useCountdown';
import { compact, dateRange, dayMonth, money, money2 } from '@/lib/format';
import { useSession } from '@/lib/session';
import { PageTitle } from './AccountShell';

const card = 'rounded-xl border border-dark-200 bg-white p-5 md:p-6';
const today = () => new Date().toISOString().slice(0, 10);
const diffDays = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);
const dateY = (d: string, l: Locale) => `${dayMonth(d, l)} ${d.slice(0, 4)}`;

/* 3.8 Рассрочка */
export function InstallmentsPage() {
  const t = useTranslations('account.inst'); const to = useTranslations('account.order'); const ts = useTranslations('status'); const locale = useLocale() as Locale; const qc = useQueryClient(); const router = useRouter();
  const { data } = useQuery({ queryKey: ['me', 'installments'], queryFn: () => api.me.installments() });
  const { data: s } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const [busy, setBusy] = useState<string>();
  const pay = async (o: Order, n: number) => { setBusy(o.id); await api.me.payInstallment(o.id, n); await qc.invalidateQueries({ queryKey: ['me'] }); setBusy(undefined); };
  const risky = (data ?? []).map((o) => ({ o, r: o.snapshot.installments.find((r) => o.installment_state?.[r.n] === 'overdue') })).find((x) => x.r);
  return (
    <>
      <PageTitle title={t('title')} lead={t('lead')} />
      {risky && s && <div className="mb-6"><Alert type="error" title={t('risk', { tour: risky.o.tour.title.split(':')[0]!, date: dayMonth(risky.o.departure.from, locale) })}>{t('riskText', { n: risky.r!.n, days: -diffDays(today(), risky.r!.due), deadline: dayMonth((() => { const d = new Date(`${risky.o.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - s.installment_block_days); return d.toISOString().slice(0, 10); })(), locale) })}</Alert></div>}
      {!data?.length ? <EmptyState title={t('empty')} /> : (
        <ul className="flex flex-col gap-4">{data.map((o) => {
          const st = o.installment_state ?? {}; const due = o.snapshot.installments.find((r) => st[r.n] !== 'paid'); const paid = o.paid_amount ?? 0; const pct = Math.round((paid / o.snapshot.total) * 100);
          const overdue = due && st[due.n] === 'overdue'; const expanded = overdue || data.length === 1;
          return (
            <li key={o.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-h5 text-dark-900">{o.tour.title.split(':')[0]}</h2><p className="text-caption text-dark-500">{t('meta', { number: o.number, date: dateY(o.departure.from, locale) })}</p></div><StatusBadge status={o.status} label={ts(o.status)} /></div>
              {expanded ? (<>
                <div className="mt-4"><div className="flex justify-between text-body-s"><span className="text-dark-700">{t('progress', { paid: money(paid, locale), total: money(o.snapshot.total, locale) })}</span><span className="text-primary-600">{pct}%</span></div>
                  <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-2 overflow-hidden rounded-full bg-dark-100"><div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} /></div></div>
                <ul className="mt-4 flex flex-col gap-3">{o.snapshot.installments.map((r) => { const x = st[r.n]; const d = diffDays(today(), r.due); return (
                  <li key={r.n}><PaymentScheduleRow state={x === 'paid' ? 'paid' : x === 'overdue' ? 'overdue' : r.n === due?.n ? 'upcoming' : 'scheduled'} title={r.n === 1 ? to('deposit') : to('installment', { n: r.n })} date={dateY(r.due, locale)}
                    amount={x === 'overdue' && o.penalty ? t('penalty', { amount: money(r.amount, locale), penalty: money2(o.penalty, locale) }) : money(r.amount, locale)} statusLabel={x === 'paid' ? to('paidOk') : x === 'overdue' ? to('overdue', { days: -d }) : r.n === due?.n ? to('inDays', { days: d }) : to('scheduled')} /></li>); })}</ul>
                {due ? <div className="mt-4 flex flex-wrap items-center justify-end gap-4"><a href="/legal/cancellation#penalty" className="text-body-s-medium text-primary-500">{t('rules')}</a>
                  <Button variant="primary" loading={busy === o.id} onClick={() => pay(o, due.n)}>{t('pay', { amount: money2(due.amount + (overdue ? o.penalty ?? 0 : 0), locale) })}</Button></div> : <p className="mt-4 text-body-s text-success-700">{t('paidAll')}</p>}
              </>) : (
                <div className="mt-3 flex items-center justify-between gap-4"><p className="text-caption text-dark-500">{due ? t('next', { number: o.number, amount: money(due.amount, locale), when: to('inDays', { days: diffDays(today(), due.due) }).toLowerCase() }) : t('paidAll')}</p>
                  <Button variant="outline" className="border-primary-500 text-primary-500" onClick={() => router.push(`/account/orders/${o.id}` as never)}>{t('schedule')}</Button></div>
              )}
            </li>);
        })}</ul>)}
    </>
  );
}

/* 3.9 Избранное */
export function FavoritesPage() {
  const t = useTranslations('account.fav'); const router = useRouter();
  const { data } = useQuery({ queryKey: ['me', 'favorites'], queryFn: () => api.me.favorites() });
  return (<><PageTitle title={t('title')} lead={t('lead')} />
    {!data?.length ? <EmptyState title={t('empty')} text={t('emptyText')} actionLabel={t('browse')} onAction={() => router.push('/tours' as never)} />
      : <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{data.map((x) => <li key={x.slug}><TourCardView tour={x} /></li>)}</ul>}</>);
}

/* 3.10 Бонусы и рефералы */
export function BonusesPage() {
  const t = useTranslations('account.bonus'); const ta = useTranslations('account'); const locale = useLocale() as Locale;
  const { data: b } = useQuery({ queryKey: ['me', 'bonuses'], queryFn: () => api.me.bonuses() });
  const { data: s } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  const [copied, setCopied] = useState(false);
  if (!b || !s) return <PageTitle title={t('title')} />;
  const link = `https://samanid.travel/?ref=${b.code}`;
  const copy = async () => { try { await navigator.clipboard.writeText(b.code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };
  const fIcon = { travelled: <CircleCheck className="size-5 text-success-600" />, registered: <Clock className="size-5 text-warning-700" />, invited: <Send className="size-5 text-dark-500" /> };
  return (
    <>
      <PageTitle title={t('title')} />
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-2xl bg-primary-500 p-6 text-white"><p className="text-body-s text-primary-100">{t('balance')}</p><p className="flex items-baseline gap-3"><span className="text-[56px] leading-[64px] font-extrabold">{compact(b.balance, locale)}</span><span className="text-body-m text-primary-100">{t('equals', { usd: money(b.balance / 100, locale) })}</span></p><p className="text-body-s text-primary-100">{t('note', { cap: s.bonus_cap_percent, points: b.burn.points, date: b.burn.date.split('-').reverse().join('.') })}</p></section>
        <section className={`${card} flex flex-col gap-3`}><Gift className="size-6 text-accent-500" aria-hidden="true" /><h2 className="text-h5 text-dark-900">{t('invite')}</h2><p className="text-body-s text-dark-600">{t('inviteText', { points: b.reward })}</p>
          <div className="flex items-center justify-between gap-3 rounded-full border border-dashed border-dark-300 bg-bg-page p-1.5 pl-5"><span className="text-h6 text-primary-600">{b.code}</span><Button variant="secondary" onClick={copy}>{copied ? ta('copied') : ta('copy')} <Copy className="size-4" aria-hidden="true" /></Button></div>
          <div className="flex flex-wrap gap-2"><Chip onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}`, '_blank', 'noopener')}>{t('share.telegram')}</Chip><Chip onClick={() => { window.location.href = `mailto:?body=${encodeURIComponent(link)}`; }}>{t('share.email')}</Chip><Chip onClick={() => void navigator.clipboard?.writeText(link)}>{t('share.link')}</Chip></div>
          <span className="sr-only" role="status">{copied ? ta('copied') : ''}</span></section>
      </div>
      <section className={`${card} mt-6`}><h2 className="text-h5 text-dark-900">{t('friends', { count: b.friends.length })}</h2>
        <ul className="mt-4 flex flex-col gap-2">{b.friends.map((f) => <li key={f.name} className="flex items-center gap-3 rounded-lg bg-bg-page px-4 py-3"><span aria-hidden="true">{fIcon[f.status]}</span><div className="flex-1"><p className="text-body-s-medium text-dark-900">{f.name}</p><p className="text-caption text-dark-500">{t(`fs.${f.status}`)}</p></div><span className={cn('text-body-s-medium', f.points ? 'text-success-700' : 'text-dark-400')}>{f.points ? `+${f.points}` : '—'}</span></li>)}</ul></section>
      <section className={`${card} mt-6`}><h2 className="text-h5 text-dark-900">{t('history')}</h2>
        <table className="mt-4 w-full text-body-s"><tbody>{b.history.map((h, i) => <tr key={i} className="border-b border-dark-100 last:border-0"><td className="py-3 pr-4 text-caption whitespace-nowrap text-dark-500">{dateY(h.date, locale)}</td><td className="py-3 text-dark-900">{t(`hk.${h.kind}`, { ref: h.ref })}</td><td className={cn('py-3 text-right font-semibold whitespace-nowrap', h.points < 0 ? 'text-error-600' : 'text-success-700')}>{h.points > 0 ? '+' : '−'}{compact(Math.abs(h.points), locale)}</td></tr>)}</tbody></table></section>
    </>
  );
}

/* 3.11 Лист ожидания */
function OfferTimer({ iso, children }: { iso: string; children: (s: string) => React.ReactNode }) { const left = useCountdown(iso); return <>{children(hms(left))}</>; }
export function WaitlistPage() {
  const t = useTranslations('account.wait'); const locale = useLocale() as Locale; const router = useRouter(); const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['me', 'waitlist'], queryFn: () => api.me.waitlist() });
  const leave = async (id: string) => { await api.me.leaveWaitlist(id); await qc.invalidateQueries({ queryKey: ['me', 'waitlist'] }); };
  return (<><PageTitle title={t('title')} lead={t('lead')} />
    {!data?.length ? <EmptyState title={t('empty')} /> : <ul className="flex flex-col gap-4">{data.map((w) => (
      <li key={w.id} className={cn('flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center', w.status === 'offer' ? 'border-success-600 bg-success-100' : 'border-dark-200 bg-white')}>
        <Media tone={w.tour.image.tone} className="relative h-20 w-full shrink-0 rounded-md md:w-[100px]" />
        <div className="flex-1"><h2 className="text-body-m-medium text-dark-900">{w.tour.title.split(':')[0]}</h2><p className="text-caption text-dark-500">{t('meta', { date: dateY(w.date, locale), seats: w.seats })}</p>
          {w.status === 'offer' && 'expires_at' in w && <p className="mt-1 flex items-center gap-1.5 text-caption text-success-700" role="status"><Bell className="size-4" aria-hidden="true" /><OfferTimer iso={w.expires_at!}>{(s) => t('offer', { time: s })}</OfferTimer></p>}
          {w.status === 'waiting' && 'position' in w && <div className="mt-1"><p className="flex items-center gap-1.5 text-caption text-primary-600"><Users className="size-4" aria-hidden="true" />{t('position', { pos: w.position!, queue: w.queue! })}</p><div aria-hidden="true" className="mt-2 flex gap-1">{Array.from({ length: w.queue! }, (_, i) => <span key={i} className={cn('h-1 w-5 rounded-full', i < w.position! - 1 ? 'bg-dark-400' : i === w.position! - 1 ? 'bg-primary-500' : 'bg-dark-200')} />)}</div></div>}
          {w.status === 'expired' && <p className="mt-1 flex items-center gap-1.5 text-caption text-dark-500"><Clock className="size-4" aria-hidden="true" />{t('expired')}</p>}</div>
        {w.status === 'offer' && <Button variant="primary" onClick={() => router.push(`/waitlist/offer/${'offer_id' in w ? w.offer_id : ''}` as never)}>{t('book')}</Button>}
        {w.status === 'waiting' && <Button variant="ghost" onClick={() => leave(w.id)}>{t('leave')}</Button>}
        {w.status === 'expired' && <Button variant="outline" className="border-primary-500 text-primary-500" onClick={() => router.push(`/tours/${w.tour.slug}` as never)}>{t('rejoin')}</Button>}
      </li>))}</ul>}</>);
}

/* 3.12 Мои отзывы */
function Stars({ value, onChange, size = 'lg', label }: { value: number; onChange?: (v: number) => void; size?: 'lg' | 'sm'; label: string }) {
  return (<div role={onChange ? 'radiogroup' : 'img'} aria-label={label} className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => onChange
    ? <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)} className="rounded-xs focus-visible:focus-ring"><Star className={cn(size === 'lg' ? 'size-7' : 'size-4', n <= value ? 'fill-accent-500 text-accent-500' : 'text-dark-300')} aria-hidden="true" /></button>
    : <Star key={n} aria-hidden="true" className={cn('size-4', n <= value ? 'fill-accent-500 text-accent-500' : 'text-dark-300')} />)}</div>);
}
function ReviewForm({ o }: { o: Order }) {
  const t = useTranslations('account.rev'); const locale = useLocale() as Locale; const qc = useQueryClient();
  const [rating, setRating] = useState(0); const [aspects, setAspects] = useState({ guide: 0, transport: 0, stay: 0 }); const [text, setText] = useState(''); const [err, setErr] = useState<string>(); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const submit = async () => { if (!rating) { setErr(t('needRating')); return; } setBusy(true); await api.me.submitReview({ order_id: o.id, rating, aspects, text }); setSent(true); setBusy(false); void qc.invalidateQueries({ queryKey: ['me', 'reviews'] }); };
  if (sent) return <Alert type="success" title={t('sent')} />;
  return (
    <section className={`${card} flex flex-col gap-4`}>
      <div className="flex items-center gap-4"><Media tone={o.tour.image.tone} className="relative size-16 shrink-0 rounded-md" /><div className="flex-1"><h2 className="text-h6 text-dark-900">{o.tour.title.split(':')[0]}</h2><p className="text-caption text-dark-500">{t('finished', { date: dateY(o.departure.to, locale) })}</p></div><StatusBadge status="completed" label={t('status')} /></div>
      <div><p className="mb-2 text-body-s-medium text-dark-700">{t('rating')}</p><div className="flex items-center gap-3"><Stars value={rating} onChange={(v) => { setRating(v); setErr(undefined); }} label={t('rating')} />{rating > 0 && <span className="text-body-m text-accent-600">{t(`levels.${rating}` as never)}</span>}</div>{err && <p role="alert" className="mt-1 text-caption text-error-700">{err}</p>}</div>
      <div className="flex flex-wrap gap-6">{(['guide', 'transport', 'stay'] as const).map((k) => <div key={k}><p className="mb-1 text-caption text-dark-500">{t(`aspects.${k}`)}</p><Stars size="sm" value={aspects[k]} onChange={(v) => setAspects({ ...aspects, [k]: v })} label={t(`aspects.${k}`)} /></div>)}</div>
      <div><Textarea label={t('text')} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} /><p className="mt-1 text-caption text-dark-500">{text.length} / 500</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-caption text-dark-500">{t('moderation')}</p><Button variant="secondary" loading={busy} onClick={submit}>{t('publish')}</Button></div>
    </section>
  );
}
export function ReviewsPage() {
  const t = useTranslations('account.rev'); const locale = useLocale() as Locale; const { user } = useSession();
  const { data } = useQuery({ queryKey: ['me', 'reviews'], queryFn: () => api.me.reviews() });
  const month = (d: string) => { const s = new Intl.DateTimeFormat(locale === 'uz' ? 'uz-UZ' : locale === 'en' ? 'en-US' : 'ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`)); return s.charAt(0).toUpperCase() + s.slice(1); };
  return (<><PageTitle title={t('title')} lead={t('lead')} />
    <div className="flex flex-col gap-4">{data?.pending.length ? data.pending.map((o) => <ReviewForm key={o.id} o={o} />) : <p className="text-body-s text-dark-500">{t('none')}</p>}</div>
    {!!data?.written.length && <><h2 className="mt-8 mb-4 text-h5 text-dark-900">{t('published')}</h2><ul className="flex flex-col gap-4">{data.written.map((w, i) => <li key={i}><ReviewCard initials={`${user?.first_name[0] ?? ''}${user?.last_name[0] ?? ''}`} name={`${user?.first_name ?? ''} ${user?.last_name[0] ?? ''}.`} meta={`${month(w.date)} · ${w.tour_title}`} rating={w.rating} text={w.text} verifiedLabel={t('verified')} /></li>)}</ul></>}</>);
}

/* 3.13 Уведомления */
type Ev = 'voucher' | 'departure' | 'installments' | 'waitlist' | 'price' | 'promo';
type NotifState = { events: Record<Ev, { email: boolean; telegram: boolean; locked?: boolean }>; language: 'ru' | 'uz' | 'en' };
export function NotificationsPage() {
  const t = useTranslations('account.notif'); const { user, setUser } = useSession();
  const { data } = useQuery({ queryKey: ['me', 'notif'], queryFn: () => api.me.notifications() as Promise<NotifState> });
  const [st, setSt] = useState<NotifState | null>(null); useEffect(() => { if (data) setSt(data); }, [data]);
  const [code, setCode] = useState<{ code: string; expires_at: string; bot: string } | null>(null);
  const left = useCountdown(code?.expires_at ?? new Date(0).toISOString());
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (!user?.telegram_linked) void api.me.telegramCode().then(setCode); }, [user?.telegram_linked]);
  const update = (n: NotifState) => { setSt(n); void api.me.saveNotifications(n); setSaved(true); setTimeout(() => setSaved(false), 1500); };
  const evs: Ev[] = ['voucher', 'departure', 'installments', 'waitlist', 'price', 'promo'];
  return (<><PageTitle title={t('title')} lead={t('lead')} />
    {user?.telegram_linked ? <Alert type="success" title={t('linked')} /> : (
      <section className={`${card} flex flex-col gap-4`}>
        <div className="flex items-center gap-4"><span aria-hidden="true" className="flex size-12 items-center justify-center rounded-md bg-primary-500 text-white"><Send className="size-6" /></span><div><h2 className="text-h6 text-dark-900">{t('tgTitle')}</h2><p className="text-body-s text-dark-600">{t('tgText')}</p></div></div>
        <ol className="grid gap-3 md:grid-cols-3">
          <li className="flex flex-col gap-3 rounded-lg bg-bg-page p-4"><p className="text-body-s-medium text-dark-900">{t('s1')}</p><a href={`https://t.me/${code?.bot ?? 'SamanidTravelBot'}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-500 px-5 text-button-m text-white focus-visible:focus-ring">{t('open', { bot: code?.bot ?? 'SamanidTravelBot' })}</a></li>
          <li className="flex flex-col gap-2 rounded-lg bg-bg-page p-4"><p className="text-body-s-medium text-dark-900">{t('s2')}</p>{code && left > 0 ? <><p className="flex items-center gap-2 text-h3 font-extrabold tracking-wide text-primary-500">{code.code.replace(/(\d{3})(\d{3})/, '$1 $2')}<button type="button" aria-label="Copy" onClick={() => void navigator.clipboard?.writeText(code.code)} className="rounded-xs focus-visible:focus-ring"><Copy className="size-5" aria-hidden="true" /></button></p><p className="text-caption text-dark-500">{t('codeValid', { minutes: Math.ceil(left / 60) })}</p></> : <Button variant="outline" onClick={() => void api.me.telegramCode().then(setCode)}>{t('newCode')}</Button>}</li>
          <li className="flex flex-col gap-2 rounded-lg bg-bg-page p-4"><p className="text-body-s-medium text-dark-900">{t('s3')}</p><p className="flex items-center gap-2 text-body-s text-dark-600" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" />{t('waiting')}</p>
            {process.env.NODE_ENV !== 'production' && <button type="button" className="self-start text-caption text-primary-500 underline" onClick={async () => setUser(await api.auth.updateUser({ telegram_linked: true }))}>demo: link</button>}</li>
        </ol>
      </section>)}
    {st && <section className={`${card} mt-6`}>
      <div className="flex items-center justify-between"><h2 className="text-h6 text-dark-900">{t('what')}</h2><span role="status" className="text-caption text-success-700">{saved ? t('saved') : ''}</span></div>
      <table className="mt-2 w-full"><thead><tr><th className="sr-only">{t('what')}</th><th className="w-20 pb-2 text-center text-caption font-normal text-dark-500">{t('ch.email')}</th><th className="w-20 pb-2 text-center text-caption font-normal text-dark-500">{t('ch.telegram')}</th></tr></thead>
        <tbody>{evs.map((e) => { const v = st.events[e]; return (<tr key={e} className="border-t border-dark-100"><th scope="row" className="py-3 text-left font-normal"><p className="flex items-center gap-1.5 text-body-m text-dark-900">{t(`ev.${e}`)}{v.locked && <LockKeyhole className="size-4 text-dark-400" aria-hidden="true" />}</p><p className="text-caption text-dark-500">{t(`ev.${e}H`)}</p></th>
          {(['email', 'telegram'] as const).map((ch) => <td key={ch} className="text-center"><div className="inline-flex"><Switch label={<span className="sr-only">{`${t(`ev.${e}`)} · ${t(`ch.${ch}`)}`}</span>} checked={v[ch]} disabled={v.locked} onCheckedChange={(c) => update({ ...st, events: { ...st.events, [e]: { ...v, [ch]: c } } })} className="min-h-0 py-0" /></div></td>)}</tr>); })}</tbody></table>
      <p className="mt-3 flex items-center gap-2 text-caption text-dark-500"><LockKeyhole className="size-4" aria-hidden="true" />{t('locked')}</p></section>}
    {st && <section className={`${card} mt-6`}><h2 className="mb-3 text-h6 text-dark-900">{t('lang')}</h2><SegmentedControl label={t('lang')} value={st.language} onValueChange={(v) => update({ ...st, language: v as NotifState['language'] })} options={[{ value: 'ru', label: 'Русский' }, { value: 'uz', label: 'Oʻzbekcha' }, { value: 'en', label: 'English' }]} /></section>}
  </>);
}

/* 3.14 Профиль и безопасность */
export function ProfilePage() {
  const t = useTranslations('account.profile'); const tt = useTranslations('checkout.travellers'); const { user, setUser, logout } = useSession(); const router = useRouter(); const qc = useQueryClient();
  const [form, setForm] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', phone: user?.phone ?? '' });
  const [saved, setSaved] = useState(false); const [del, setDel] = useState(false); const [tfa, setTfa] = useState(false);
  const { data: sessions } = useQuery({ queryKey: ['me', 'sessions'], queryFn: () => api.me.sessions() });
  const save = async () => { setUser(await api.auth.updateUser(form)); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const revoke = async (id: string) => { await api.me.revokeSession(id); await qc.invalidateQueries({ queryKey: ['me', 'sessions'] }); };
  const exportData = async () => { const b = await api.me.exportData(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'samanid-my-data.json'; a.click(); URL.revokeObjectURL(a.href); };
  const row = (I: typeof Shield, title: string, hint: string, action: React.ReactNode) => <li className="flex flex-wrap items-center gap-4 border-b border-dark-100 py-4 last:border-0"><I className="size-5 text-dark-600" aria-hidden="true" /><div className="flex-1"><p className="text-body-m text-dark-900">{title}</p><p className="text-caption text-dark-500">{hint}</p></div>{action}</li>;
  const outline = 'border-primary-500 text-primary-500';
  if (!user) return null;
  return (<><PageTitle title={t('title')} />
    <section className={`${card} flex flex-col gap-4`}><h2 className="text-h6 text-dark-900">{t('personal')}</h2>
      <div className="grid gap-4 md:grid-cols-2"><Input label={t('first')} autoComplete="given-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /><Input label={t('last')} autoComplete="family-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <Input label="Email" value={user.email} readOnly disabled /><PhoneInput label={tt('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      <div className="flex items-center justify-end gap-3"><span role="status" className="text-caption text-success-700">{saved ? t('saved') : ''}</span><Button variant="secondary" onClick={save}>{t('save')}</Button></div></section>
    <section className={`${card} mt-6`}><h2 className="text-h6 text-dark-900">{t('security')}</h2><ul className="mt-2">
      {row(LockKeyhole, t('pwd'), t('pwdH'), <Button variant="outline" className={outline} onClick={() => router.push('/reset-password' as never)}>{t('pwdBtn')}</Button>)}
      {row(Shield, t('tfa'), tfa ? t('tfaSoon') : t('tfaH'), <Button variant="outline" className={outline} onClick={() => setTfa(true)}>{t('enable')}</Button>)}
      {row(Globe, t('google'), t('googleH', { email: user.email }), <Button variant="outline" className={outline}>{t('disconnect')}</Button>)}</ul></section>
    <section className={`${card} mt-6`}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-h6 text-dark-900">{t('sessions')}</h2>{(sessions?.length ?? 0) > 1 && <button type="button" onClick={() => revoke('others')} className="text-body-s-medium text-error-600 focus-visible:focus-ring">{t('endOthers')}</button>}</div>
      <ul className="mt-4 flex flex-col gap-3">{sessions?.map((s) => <li key={s.id} className={cn('flex items-center gap-4 rounded-lg p-4', s.current ? 'bg-primary-50' : 'bg-bg-page')}>{s.device.includes('macOS') ? <Smartphone className="size-5 text-dark-600" aria-hidden="true" /> : <Phone className="size-5 text-dark-600" aria-hidden="true" />}
        <div className="flex-1"><p className="flex flex-wrap items-center gap-2 text-body-m text-dark-900">{s.device}{s.current && <span className="rounded-full bg-primary-500 px-2 py-0.5 text-caption text-white">{t('thisSession')}</span>}</p><p className="text-caption text-dark-500">{s.place} · {s.current ? t('now') : s.last}</p></div>
        {!s.current && <button type="button" onClick={() => revoke(s.id)} className="text-body-s-medium text-error-600 focus-visible:focus-ring">{t('end')}</button>}</li>)}</ul></section>
    <section className={`${card} mt-6 flex flex-col gap-3`}><h2 className="text-h6 text-dark-900">{t('data')}</h2><p className="text-body-s text-dark-600">{t('dataText')}</p>
      <div className="flex flex-wrap items-center gap-4"><Button variant="outline" className={outline} onClick={exportData}>{t('export')}</Button><button type="button" onClick={() => setDel(true)} className="text-body-s-medium text-error-600 focus-visible:focus-ring">{t('delete')}</button></div></section>
    <Modal open={del} onOpenChange={setDel} title={t('deleteTitle')} description={t('deleteText')} closeLabel="×"
      footer={<><Button variant="ghost" onClick={() => setDel(false)}>{t('keep')}</Button><Button variant="danger" onClick={async () => { await logout(); router.replace('/' as never); }}>{t('deleteConfirm')}</Button></>} />
  </>);
}
export { TriangleAlert, X, ToastView };
