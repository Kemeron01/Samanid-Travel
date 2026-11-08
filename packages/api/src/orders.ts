import * as fx from './fixtures';
import type { ApiImage, Departure, Quote, Settings } from './types';

/** Статусы заказа = ключи бэкенда (см. README на Cover). */
export type OrderStatusKey =
  | 'draft' | 'pending_payment' | 'awaiting_manager_confirmation' | 'partially_paid' | 'paid'
  | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'expired';

export interface Traveller { id: string; kind: 'adult' | 'child'; full_name: string; birth_date: string; citizenship: string; passport_expires: string }
export interface PriceLine { kind: 'adults' | 'children' | 'dynamic' | 'addon' | 'promo' | 'points' | 'penalty'; count?: number; unit_price?: number; label?: string; percent?: number; amount: number }
export interface InstallmentRow { n: number; amount: number; due: string; status: 'now' | 'scheduled' | 'paid' | 'overdue' }
/** Снимок цены. Считает БЭКЕНД; фронт только показывает (правило №5). Порядок: база → ребёнок → динамика → допуслуги → промокод → баллы → пени. */
export interface OrderSnapshot { lines: PriceLine[]; total: number; points_max: number; points_cap: number; deposit: number; installments: InstallmentRow[] }

export interface Order {
  id: string; number: string; status: OrderStatusKey;
  tour: { slug: string; title: string; region: string; image: ApiImage; type: 'group' | 'individual' };
  departure: { id: string; from: string; to: string; meeting_time: string; meeting_place: string; seats_left: number };
  adults: number; children: number;
  travellers: Traveller[]; contacts: { email: string; phone: string }; consent_pd: boolean;
  seats: string[]; addon_ids: string[]; comment: string;
  promo_code: string | null; points_used: number; points_balance: number; points_expire: string;
  hold_expires_at: string | null; payment_plan: 'full' | 'installment';
  snapshot: OrderSnapshot; cancellation_deadline_days: number | null; refund_days: number;
  voucher: { code: string; qr: string } | null; created_at: string; released_seats?: string[];
  paid_amount?: number; installment_state?: Record<number, 'paid' | 'overdue'>; penalty?: number; card_last4?: string;
  events?: { kind: 'created' | 'paid' | 'confirmed' | 'trip' | 'completed' | 'cancelled' | 'refunded'; at: string; amount?: number }[];
  refund?: { amount: number; status: 'pending' | 'refunded'; due: string } | null; review_left?: boolean;
}

export type OrderPatch = Partial<Pick<Order, 'travellers' | 'contacts' | 'consent_pd' | 'seats' | 'addon_ids' | 'comment' | 'points_used' | 'payment_plan'>>;

export interface Payment { id: string; order_id: string; plan: 'full' | 'installment'; amount: number; status: 'processing' | 'paid' | 'failed'; failure?: { code: string; reason: string }; created_at: string; method_last4: string }
export interface SeatCellDto { kind: 'seat' | 'aisle'; code?: string; label?: string; state?: 'available' | 'occupied' | 'unavailable' | 'child' }

const KEY = 'st_orders_v1'; const PKEY = 'st_payments_v1'; const NKEY = 'st_order_seq';
const has = () => typeof localStorage !== 'undefined';
const read = <T,>(k: string, d: T): T => { if (!has()) return d; try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return d; } };
const write = (k: string, v: unknown) => { if (has()) try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const age = (birth: string, on: string) => { const b = new Date(birth), o = new Date(on); let a = o.getUTCFullYear() - b.getUTCFullYear(); if (o.getUTCMonth() < b.getUTCMonth() || (o.getUTCMonth() === b.getUTCMonth() && o.getUTCDate() < b.getUTCDate())) a--; return a; };

const PROMOS: Record<string, number> = { SPRING10: 10 };
export const TEST_FAIL_CARD = '4000000000000002';

function settingsNow(): Settings { return fx.settings; }

/** «Серверный» пересчёт снимка цены (мок). */
function snapshot(o: Omit<Order, 'snapshot'>): OrderSnapshot {
  const t = fx.tours.find((x) => x.slug === o.tour.slug)!; const d = fx.buildDetail(t); const dep = d.departures.find((x) => x.id === o.departure.id)!;
  const unit = dep.price; const childUnit = Math.round(unit * (1 - d.child_discount_percent / 100));
  const lines: PriceLine[] = [{ kind: 'adults', count: o.adults, unit_price: unit, amount: unit * o.adults }];
  if (o.children) lines.push({ kind: 'children', count: o.children, unit_price: childUnit, amount: childUnit * o.children });
  const base = lines.reduce((s, l) => s + l.amount, 0);
  if (dep.price_may_rise) lines.push({ kind: 'dynamic', percent: 6, amount: Math.round(base * 0.06) });
  const pax = o.adults + o.children;
  for (const id of o.addon_ids) {
    const a = fx.addons.find((x) => x.id === id); if (!a) continue;
    const count = a.unit === 'person' ? pax : 1; lines.push({ kind: 'addon', label: id, count, unit_price: a.price, amount: a.price * count });
  }
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  if (o.promo_code && PROMOS[o.promo_code]) lines.push({ kind: 'promo', label: o.promo_code, percent: PROMOS[o.promo_code], amount: -Math.round(base * PROMOS[o.promo_code]! / 100) });
  const afterPromo = lines.reduce((s, l) => s + l.amount, 0);
  const points_cap = Math.floor(afterPromo * settingsNow().bonus_cap_percent / 100);
  const points_max = Math.min(Math.floor(o.points_balance / 100), points_cap);
  const usedUsd = Math.min(Math.floor(o.points_used / 100), points_max);
  if (usedUsd > 0) lines.push({ kind: 'points', count: usedUsd * 100, amount: -usedUsd });
  void subtotal;
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const n = settingsNow().installments_count; const deposit = Math.ceil(total / n); const rest = total - deposit; const each = Math.floor(rest / (n - 1));
  const today = new Date(); const last = new Date(`${o.departure.from}T00:00:00Z`); last.setUTCDate(last.getUTCDate() - 14);
  const span = Math.max(last.getTime() - today.getTime(), 0);
  const installments: InstallmentRow[] = Array.from({ length: n }, (_, i) => ({
    n: i + 1, amount: i === 0 ? deposit : i === n - 1 ? rest - each * (n - 2) : each,
    due: iso(i === 0 ? today : new Date(today.getTime() + (span * i) / (n - 1))), status: i === 0 ? 'now' : 'scheduled',
  }));
  return { lines, total, points_max, points_cap, deposit, installments };
}

function normalize(o: Order): Order {
  let next = o;
  if (o.hold_expires_at && new Date(o.hold_expires_at).getTime() <= Date.now() && ['draft', 'pending_payment'].includes(o.status)) next = { ...o, status: 'expired', seats: [], released_seats: o.seats };
  return next;
}
const load = (): Record<string, Order> => read<Record<string, Order>>(KEY, {});
const save = (m: Record<string, Order>) => write(KEY, m);
const put = (o: Order) => { const m = load(); const full = { ...o, snapshot: snapshot(o) }; m[o.id] = full; save(m); return full; };

export interface ChangeRequest { departure_id?: string; seats?: string[]; addon_ids?: string[]; travellers?: Traveller[] }
export interface Breakdown { tour: number; addons: number; discounts: number; total: number }
export interface ChangePreview { change_id: string; before: Breakdown; after: Breakdown; delta: number; refund_days: number; new_departure: { id: string; from: string; to: string }; hold_expires_at: string }
const CKEY = 'st_changes_v1';
const breakdown = (sn: OrderSnapshot): Breakdown => {
  const sum = (ks: PriceLine['kind'][]) => sn.lines.filter((l) => ks.includes(l.kind)).reduce((a, l) => a + l.amount, 0);
  return { tour: sum(['adults', 'children', 'dynamic']), addons: sum(['addon']), discounts: sum(['promo', 'points']), total: sn.total };
};
function applyChange(o: Order, c: ChangeRequest): Order {
  let next: Order = { ...o };
  if (c.departure_id && c.departure_id !== o.departure.id) {
    const t = fx.tours.find((x) => x.slug === o.tour.slug)!; const dep = fx.buildDetail(t).departures.find((d) => d.id === c.departure_id)!;
    next = { ...next, departure: { ...o.departure, id: dep.id, from: dep.from, to: dep.to, seats_left: dep.seats_left } };
  }
  if (c.seats) next.seats = c.seats; if (c.addon_ids) next.addon_ids = c.addon_ids; if (c.travellers) next.travellers = c.travellers;
  return { ...next, snapshot: snapshot(next) };
}

const SEAT_ROWS: SeatCellDto[][] = [
  [{ kind: 'seat', code: '1A', state: 'occupied' }, { kind: 'seat', code: '1B', state: 'occupied' }, { kind: 'aisle', label: '1' }, { kind: 'seat', code: '1D', state: 'available' }],
  [{ kind: 'seat', code: '2A', state: 'available' }, { kind: 'seat', code: '2B', state: 'available' }, { kind: 'aisle', label: '2' }, { kind: 'seat', code: '2D', state: 'occupied' }],
  [{ kind: 'seat', code: '3A', state: 'available' }, { kind: 'seat', code: '3B', state: 'available' }, { kind: 'aisle', label: '3' }, { kind: 'seat', code: '3D', state: 'available' }],
  [{ kind: 'seat', code: '4A', state: 'child' }, { kind: 'seat', code: '4B', state: 'occupied' }, { kind: 'aisle', label: '4' }, { kind: 'seat', code: '4D', state: 'occupied' }],
  [{ kind: 'seat', code: '5A', state: 'available' }, { kind: 'seat', code: '5B', state: 'available' }, { kind: 'aisle', label: '5' }, { kind: 'seat', code: '5D', state: 'unavailable' }],
  [{ kind: 'seat', code: '6A', state: 'occupied' }, { kind: 'seat', code: '6B', state: 'available' }, { kind: 'seat', code: '6C', state: 'available' }, { kind: 'seat', code: '6D', state: 'available' }],
];

export interface Profile { email: string; phone: string; full_name: string; birth_date: string; citizenship: string; passport_expires: string }
export const ordersApi = {
  async profile(): Promise<Profile> { return { email: 'aziz@example.com', phone: '90 123 45 67', full_name: 'AZIZOV AZIZ', birth_date: '1994-03-14', citizenship: 'UZ', passport_expires: '2031-08-12' }; },
  async create(r: { tour: string; departure: string; adults: number; children: number }): Promise<Order> {
    await sleep(150);
    const t = fx.tours.find((x) => x.slug === r.tour); if (!t) throw new Error('tour not found');
    const d = fx.buildDetail(t); const dep = d.departures.find((x) => x.id === r.departure); if (!dep) throw new Error('departure not found');
    if (dep.seats_left === 0) throw new Error('sold_out');
    const seq = read<number>(NKEY, 4811) + 1; write(NKEY, seq);
    const travellers: Traveller[] = [
      ...Array.from({ length: r.adults }, (_, i) => ({ id: uid(), kind: 'adult' as const, full_name: '', birth_date: '', citizenship: 'UZ', passport_expires: '', _i: i })),
      ...Array.from({ length: r.children }, () => ({ id: uid(), kind: 'child' as const, full_name: '', birth_date: '', citizenship: 'UZ', passport_expires: '' })),
    ].map(({ ...x }) => { delete (x as { _i?: number })._i; return x as Traveller; });
    const s = settingsNow();
    const base: Omit<Order, 'snapshot'> = {
      id: `ord_${uid()}`, number: `ST-2027-0${seq}`, status: 'draft', tour: { slug: t.slug, title: t.title, region: t.region, image: t.image, type: t.type },
      departure: { id: dep.id, from: dep.from, to: dep.to, meeting_time: '07:30', meeting_place: 'у отеля в Самарканде', seats_left: dep.seats_left },
      adults: r.adults, children: r.children, travellers, contacts: { email: '', phone: '' }, consent_pd: false, seats: [], addon_ids: [], comment: '',
      promo_code: null, points_used: 0, points_balance: 1200, points_expire: '2027-12-31', hold_expires_at: null, payment_plan: 'full',
      cancellation_deadline_days: s.cancellation_deadline_days, refund_days: s.refund_days, voucher: null, created_at: new Date().toISOString(),
    };
    return put({ ...base, snapshot: undefined as never });
  },
  async get(id: string): Promise<Order | null> { await sleep(60); const o = load()[id]; if (!o) return null; const n = normalize(o); if (n !== o) put(n); return n.status === 'expired' ? { ...n } : n; },
  async patch(id: string, p: OrderPatch): Promise<Order> { await sleep(120); const o = load()[id]; if (!o) throw new Error('not_found'); return put({ ...o, ...p }); },
  /** Hold стартует на шаге 2 (идемпотентно: повторный вызов не продлевает). */
  async startHold(id: string): Promise<Order> {
    const o = load()[id]; if (!o) throw new Error('not_found');
    if (o.hold_expires_at && new Date(o.hold_expires_at).getTime() > Date.now()) return o;
    const mins = settingsNow().hold_minutes; return put({ ...o, status: 'pending_payment', hold_expires_at: new Date(Date.now() + mins * 60_000).toISOString() });
  },
  async restart(id: string): Promise<Order> { const o = load()[id]; if (!o) throw new Error('not_found'); return put({ ...o, status: 'draft', hold_expires_at: null, seats: [] }); },
  /** POST /orders/{id}/change/preview — пересчёт «было/стало», разница (доплата или возврат за refund_days). Места на новую дату удерживаются. */
  async changePreview(id: string, c: ChangeRequest): Promise<ChangePreview> {
    await sleep(250); const o = load()[id]; if (!o) throw new Error('not_found');
    const after = applyChange(o, c); const change_id = `chg_${uid()}`;
    const all = read<Record<string, { order_id: string; c: ChangeRequest }>>(CKEY, {}); all[change_id] = { order_id: id, c }; write(CKEY, all);
    return { change_id, before: breakdown(o.snapshot), after: breakdown(after.snapshot), delta: after.snapshot.total - o.snapshot.total, refund_days: settingsNow().refund_days, new_departure: { id: after.departure.id, from: after.departure.from, to: after.departure.to }, hold_expires_at: new Date(Date.now() + settingsNow().hold_minutes * 60_000).toISOString() };
  },
  /** POST /orders/{id}/change — применяет изменение; ваучер перевыпускается автоматически. */
  async changeConfirm(id: string, changeId: string): Promise<{ order: Order; delta: number }> {
    await sleep(350); const all = read<Record<string, { order_id: string; c: ChangeRequest }>>(CKEY, {}); const ch = all[changeId]; const o = load()[id];
    if (!ch || !o || ch.order_id !== id) throw new Error('not_found');
    const before = o.snapshot.total; const next = applyChange(o, ch.c); const saved = put({ ...next, voucher: { code: o.number, qr: `https://samanid.travel/voucher/${o.number}` } });
    return { order: saved, delta: saved.snapshot.total - before };
  },
  async seatMap(_departure: string): Promise<SeatCellDto[][]> { await sleep(80); return SEAT_ROWS; },
  async applyPromo(id: string, code: string): Promise<Order> {
    await sleep(250); const o = load()[id]; if (!o) throw new Error('not_found'); const c = code.trim().toUpperCase();
    if (!PROMOS[c]) throw new Error('promo_invalid'); return put({ ...o, promo_code: c });
  },
  async removePromo(id: string): Promise<Order> { const o = load()[id]; if (!o) throw new Error('not_found'); return put({ ...o, promo_code: null }); },

  /** POST /orders/{id}/payments. Повторный запрос с тем же idempotency_key возвращает тот же платёж (второй не создаётся). */
  async createPayment(id: string, r: { plan: 'full' | 'installment'; idempotency_key: string; card_last4: string; card_token: string }): Promise<Payment> {
    await sleep(200); const o = load()[id]; if (!o) throw new Error('not_found');
    const all = read<Record<string, Payment & { key: string }>>(PKEY, {});
    const dup = Object.values(all).find((p) => p.key === r.idempotency_key); if (dup) return dup;
    if (o.hold_expires_at && new Date(o.hold_expires_at).getTime() <= Date.now()) throw new Error('hold_expired');
    const amount = r.plan === 'full' ? o.snapshot.total : o.snapshot.deposit;
    const p: Payment & { key: string; fail: boolean } = { id: `PAY-${uid().toUpperCase().slice(0, 6)}`, order_id: id, plan: r.plan, amount, status: 'processing', created_at: new Date().toISOString(), method_last4: r.card_last4, key: r.idempotency_key, fail: r.card_token === 'tok_fail' };
    all[p.id] = p; write(PKEY, all); put({ ...o, payment_plan: r.plan }); return p;
  },
  /** GET /payments/{id}: вебхук «приходит» через ~4 с; дубль вебхука игнорируется (статус не меняется дважды). */
  async getPayment(pid: string): Promise<Payment | null> {
    await sleep(80); const all = read<Record<string, Payment & { fail?: boolean }>>(PKEY, {}); const p = all[pid]; if (!p) return null;
    if (p.status === 'processing' && Date.now() - new Date(p.created_at).getTime() > 4000) {
      if (p.fail) { p.status = 'failed'; p.failure = { code: '51', reason: 'insufficient_funds' }; }
      else {
        p.status = 'paid'; const o = load()[p.order_id];
        if (o && !['paid', 'confirmed', 'partially_paid'].includes(o.status)) {
          const now = new Date().toISOString();
          put({ ...o, status: p.plan === 'full' ? 'confirmed' : 'partially_paid', hold_expires_at: null, paid_amount: p.amount, card_last4: p.method_last4, installment_state: p.plan === 'installment' ? { 1: 'paid' } : undefined,
            events: [{ kind: 'created', at: o.created_at }, { kind: 'paid', at: now, amount: p.amount }, { kind: 'confirmed', at: now }], voucher: { code: o.number, qr: `https://samanid.travel/voucher/${o.number}` } });
        }
      }
      all[pid] = p; write(PKEY, all);
    }
    const { fail: _f, ...pub } = p as Payment & { fail?: boolean }; void _f; return pub;
  },
  async cardToken(number: string): Promise<{ token: string; last4: string }> { const d = number.replace(/\D/g, ''); return { token: d === TEST_FAIL_CARD ? 'tok_fail' : `tok_${uid()}`, last4: d.slice(-4) }; },
  async requestIndividual2(r: { tour: string; date_from: string; date_to: string; adults: number; children: number }): Promise<{ id: string; number: string; tour_title: string; from: string; to: string; adults: number }> {
    await sleep(250); const t = fx.tours.find((x) => x.slug === r.tour); const seq = read<number>(NKEY, 4811) + 1; write(NKEY, seq);
    const rec = { id: `req_${uid()}`, number: `ST-2027-0${seq}`, tour_title: t?.title ?? r.tour, from: r.date_from, to: r.date_to, adults: r.adults };
    const m = read<Record<string, typeof rec>>('st_requests', {}); m[rec.id] = rec; write('st_requests', m); return rec;
  },
  async getRequest(id: string) { await sleep(50); return read<Record<string, { id: string; number: string; tour_title: string; from: string; to: string; adults: number }>>('st_requests', {})[id] ?? null; },
};
export type { Quote, Departure };
export const ageOn = age;

/** Внутренний доступ к хранилищу мока (для me.ts). */
export const _store = { load, put, snapshot, save };
