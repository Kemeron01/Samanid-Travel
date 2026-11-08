import * as fx from './fixtures';
import { _store, ordersApi, type Order } from './orders';
import type { Tour } from './types';

const has = () => typeof localStorage !== 'undefined';
const read = <T,>(k: string, d: T): T => { if (!has()) return d; try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return d; } };
const write = (k: string, v: unknown) => { if (has()) try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const daysFrom = (n: number) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const tr = (kind: 'adult' | 'child', name: string, birth: string, i: number) => ({ id: `s${i}`, kind, full_name: name, birth_date: birth, citizenship: 'UZ', passport_expires: '2031-08-12' });
const FAMILY = [tr('adult', 'AZIZOV AZIZ', '1994-03-14', 1), tr('adult', 'AZIZOVA MALIKA', '1996-11-02', 2), tr('child', 'AZIZOV TIMUR', '2019-06-20', 3)];

export type OrderTab = 'upcoming' | 'completed' | 'cancelled';
const TAB: Record<OrderTab, Order['status'][]> = {
  upcoming: ['draft', 'pending_payment', 'awaiting_manager_confirmation', 'partially_paid', 'paid', 'confirmed'],
  completed: ['completed'], cancelled: ['cancelled', 'refunded', 'expired'],
};

/** Демо-данные кабинета (создаются один раз в браузере). */
let seeding: Promise<void> | null = null;
/** Один общий промис: параллельные запросы кабинета ждут окончания засева. */
function seed(): Promise<void> { if (read('st_seeded_v3', false) && !seeding) return Promise.resolve(); seeding ??= doSeed().finally(() => { seeding = null; }); return seeding; }
async function doSeed() {
  if (read('st_seeded_v3', false)) return;
  const mk = async (tour: string, dep: string, a: number, c: number, patch: Partial<Order>) => {
    const o = await ordersApi.create({ tour, departure: dep, adults: a, children: c });
    return _store.put({ ...o, travellers: FAMILY.slice(0, a + c).map((x, i) => ({ ...x, kind: i < a ? 'adult' : 'child' })), contacts: { email: 'aziz@example.com', phone: '90 123 45 67' }, consent_pd: true, seats: ['4A', '4B', '5A'].slice(0, a + c), ...patch });
  };
  await mk('samarkand-bukhara-5d', 'samarkand-bukhara-5d-1', 2, 1, { status: 'pending_payment', hold_expires_at: new Date(Date.now() + 15 * 60_000).toISOString() });
  const kh = await mk('khiva-open-air-4d', 'khiva-open-air-4d-1', 2, 1, { status: 'partially_paid', payment_plan: 'installment', card_last4: '4417' });
  // put() пересчитывает снимок, поэтому даты графика для демо (просрочка 3 дня) пишем напрямую в хранилище
  const m = _store.load(); const k2 = m[kh.id]!;
  m[kh.id] = { ...k2, paid_amount: k2.snapshot.installments[0]!.amount, installment_state: { 1: 'paid', 2: 'overdue' }, penalty: 6.3, events: [{ kind: 'created', at: new Date(Date.now() - 61 * 86400000).toISOString() }, { kind: 'paid', at: new Date(Date.now() - 60 * 86400000).toISOString(), amount: k2.snapshot.installments[0]!.amount }, { kind: 'confirmed', at: new Date(Date.now() - 60 * 86400000).toISOString() }],
    snapshot: { ...k2.snapshot, installments: k2.snapshot.installments.map((r, i) => ({ ...r, due: i === 0 ? daysFrom(-60) : i === 1 ? daysFrom(-3) : daysFrom(20) })) } };
  _store.save(m);
  for (const [slug, dep, ago] of [['khiva-open-air-4d', 'khiva-open-air-4d-1', 210], ['tashkent-chimgan-2d', 'tashkent-chimgan-2d-1', 120], ['bukhara-caravanserai', 'bukhara-caravanserai-1', 60]] as const) {
    const o = await mk(slug, dep, 2, 0, { status: 'completed', paid_amount: undefined });
    _store.put({ ...o, paid_amount: o.snapshot.total, departure: { ...o.departure, from: daysFrom(-ago), to: daysFrom(-ago + 3) }, review_left: slug === 'bukhara-caravanserai' });
  }
  const x = await mk('fergana-valley-3d', 'fergana-valley-3d-1', 2, 0, { status: 'refunded' });
  _store.put({ ...x, refund: { amount: x.snapshot.total, status: 'refunded', due: daysFrom(-30) } });
  await ordersApi.requestIndividual2({ tour: 'samarkand-private', date_from: '2027-06-03', date_to: '2027-06-07', adults: 2, children: 1 });
  write('st_seeded_v3', true);
}

export interface MeRequest { id: string; number: string; tour_title: string; from: string; to: string; adults: number }
export type MeListItem = { kind: 'order'; order: Order } | { kind: 'request'; request: MeRequest };

export interface CancelPreview { allowed: boolean; paid: number; penalty: number; refund: number; card_last4: string; refund_days: number; points: number; promo: string | null; seats: string[]; deadline: string | null }

export const meApi = {
  async orders(tab: OrderTab): Promise<{ items: MeListItem[]; counts: Record<OrderTab, number> }> {
    await seed(); await sleep(120);
    const all = Object.values(_store.load()).map((o) => ordersApi.get(o.id)); const os = (await Promise.all(all)).filter(Boolean) as Order[];
    const reqs = Object.values(read<Record<string, MeRequest>>('st_requests', {}));
    const counts = { upcoming: os.filter((o) => TAB.upcoming.includes(o.status)).length + reqs.length, completed: os.filter((o) => o.status === 'completed').length, cancelled: os.filter((o) => TAB.cancelled.includes(o.status)).length };
    const items: MeListItem[] = os.filter((o) => TAB[tab].includes(o.status)).sort((a, b) => a.departure.from.localeCompare(b.departure.from)).map((order) => ({ kind: 'order', order }));
    if (tab === 'upcoming') items.push(...reqs.map((request) => ({ kind: 'request' as const, request })));
    return { items, counts };
  },
  async cancelPreview(id: string): Promise<CancelPreview> {
    await sleep(150); const o = (await ordersApi.get(id))!; const s = fx.settings;
    const deadline = s.cancellation_deadline_days === null ? null : (() => { const d = new Date(`${o.departure.from}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - s.cancellation_deadline_days!); return d.toISOString().slice(0, 10); })();
    const allowed = deadline === null || new Date().toISOString().slice(0, 10) <= deadline;
    const paid = o.paid_amount ?? 0;
    return { allowed, paid, penalty: 0, refund: paid, card_last4: o.card_last4 ?? '••••', refund_days: s.refund_days, points: o.points_used, promo: o.promo_code, seats: o.seats, deadline };
  },
  async cancel(id: string, _reason?: string): Promise<Order> {
    await sleep(350); const o = (await ordersApi.get(id))!; const p = await this.cancelPreview(id); if (!p.allowed) throw new Error('deadline_passed');
    const now = new Date().toISOString();
    return _store.put({ ...o, status: p.refund > 0 ? 'refunded' : 'cancelled', hold_expires_at: null, refund: p.refund > 0 ? { amount: p.refund, status: 'refunded', due: daysFrom(p.refund_days) } : null, events: [...(o.events ?? []), { kind: 'cancelled', at: now }, ...(p.refund > 0 ? [{ kind: 'refunded' as const, at: now, amount: p.refund }] : [])] });
  },
  async installments(): Promise<Order[]> { await seed(); return Object.values(_store.load()).filter((o) => o.payment_plan === 'installment' && o.status === 'partially_paid'); },
  async payInstallment(id: string, n: number): Promise<Order> {
    await sleep(500); const o = _store.load()[id]!; const st = { ...(o.installment_state ?? {}), [n]: 'paid' as const }; const row = o.snapshot.installments.find((r) => r.n === n)!;
    const paid = (o.paid_amount ?? 0) + row.amount + (o.installment_state?.[n] === 'overdue' ? o.penalty ?? 0 : 0);
    const all = o.snapshot.installments.every((r) => st[r.n] === 'paid');
    const m = _store.load(); m[id] = { ...o, installment_state: st, paid_amount: paid, penalty: o.installment_state?.[n] === 'overdue' ? 0 : o.penalty, status: all ? 'confirmed' : o.status }; _store.save(m); return m[id]!;
  },
  async favorites(): Promise<Tour[]> { const ids = read<string[]>('st_favorites', []); return fx.tours.filter((t) => ids.includes(t.slug)); },
  async bonuses() {
    await sleep(100);
    return { balance: 1200, burn: { points: 300, date: '2027-12-31' }, code: 'AZIZ-K24', reward: fx.settings.referral_bonus_points,
      friends: [{ name: 'Малика А.', status: 'travelled' as const, points: 500 }, { name: 'Тимур Р.', status: 'registered' as const, points: 0 }, { name: 'Jamshid T.', status: 'invited' as const, points: 0 }],
      history: [{ date: '2027-03-10', kind: 'spend' as const, ref: 'ST-2027-04812', points: -1200 }, { date: '2027-02-02', kind: 'referral' as const, ref: 'Малика А.', points: 500 }, { date: '2027-01-15', kind: 'cashback' as const, ref: 'ST-2026-03118', points: 190 }, { date: '2027-01-15', kind: 'return' as const, ref: 'ST-2026-02977', points: 400 }] };
  },
  async waitlist() {
    await sleep(100); const t = (slug: string) => fx.tours.find((x) => x.slug === slug)!;
    const left = read<string[]>('st_waitlist_left', []);
    return [
      { id: 'w1', tour: t('khiva-open-air-4d'), date: '2027-06-03', seats: 2, status: 'offer' as const, offer_id: 'demo', expires_at: new Date(Date.now() + (1 * 3600 + 47 * 60 + 12) * 1000).toISOString() },
      { id: 'w2', tour: t('samarkand-bukhara-5d'), date: '2027-06-02', seats: 2, status: 'waiting' as const, position: 3, queue: 7 },
      { id: 'w3', tour: t('bukhara-nurata-yurts'), date: '2027-05-14', seats: 4, status: 'expired' as const },
    ].filter((w) => !left.includes(w.id));
  },
  async leaveWaitlist(id: string) { const l = read<string[]>('st_waitlist_left', []); write('st_waitlist_left', [...l, id]); },
  async reviews() {
    await seed(); const os = Object.values(_store.load()).filter((o) => o.status === 'completed');
    const written = read<{ order_id: string; rating: number; text: string; date: string; tour_title: string }[]>('st_reviews', []);
    return { pending: os.filter((o) => !o.review_left && !written.some((w) => w.order_id === o.id)), written: [{ order_id: 'seed', rating: 5, text: 'Отличная организация: гид Фарход знал историю каждого медресе, трансфер ждал вовремя. Обязательно поедем ещё в Хиву!', date: '2026-05-10', tour_title: 'Самарканд и Бухара' }, ...written] };
  },
  /** Отзыв — один раз на завершённую позицию; публикуется после модерации. */
  async submitReview(r: { order_id: string; rating: number; aspects: Record<string, number>; text: string }) {
    await sleep(300); const o = _store.load()[r.order_id]; if (!o || o.status !== 'completed') throw new Error('not_allowed');
    const w = read<{ order_id: string }[]>('st_reviews', []); if (w.some((x) => x.order_id === r.order_id)) throw new Error('already');
    write('st_reviews', [...w, { order_id: r.order_id, rating: r.rating, text: r.text, date: new Date().toISOString().slice(0, 10), tour_title: o.tour.title.split(':')[0] }]); _store.put({ ...o, review_left: true });
  },
  async notifications() {
    const d = { events: { voucher: { email: true, telegram: true, locked: true }, departure: { email: true, telegram: true }, installments: { email: true, telegram: true, locked: true }, waitlist: { email: true, telegram: true }, price: { email: false, telegram: true }, promo: { email: false, telegram: false } }, language: 'ru' as 'ru' | 'uz' | 'en' };
    return read('st_notif_v1', d);
  },
  async saveNotifications(v: unknown) { write('st_notif_v1', v); },
  /** Telegram-привязка: одноразовый 6-значный код на 10 минут. */
  async telegramCode() { await sleep(150); return { code: String(Math.floor(100000 + Math.random() * 900000)), expires_at: new Date(Date.now() + 10 * 60_000).toISOString(), bot: 'SamanidTravelBot' }; },
  async sessions() { await sleep(100); const rev = read<string[]>('st_sessions_revoked', []); return [
    { id: 'cur', device: 'Chrome · macOS', place: 'Ташкент', last: 'now', current: true }, { id: 's2', device: 'Safari · iPhone 15', place: 'Ташкент', last: daysFrom(0), current: false }, { id: 's3', device: 'Telegram WebApp · Android', place: 'Самарканд', last: daysFrom(-3), current: false },
  ].filter((s) => !rev.includes(s.id)); },
  async revokeSession(id: string | 'others') { const rev = read<string[]>('st_sessions_revoked', []); write('st_sessions_revoked', id === 'others' ? ['s2', 's3'] : [...rev, id]); },
  async exportData(): Promise<Blob> { const data = { orders: Object.values(_store.load()), reviews: read('st_reviews', []), notifications: read('st_notif_v1', null) }; return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); },
};
