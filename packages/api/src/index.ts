import * as fx from './fixtures';
import type { Addon, AddonsSummary, Destination, WaitlistOffer, Place, TransferOptions, TransferQuote, TransferQuoteRequest, DestinationDetail, Holiday, HomeStats, Quote, QuoteRequest, Review, Settings, Tour, TourDetail, TourQuery, ToursPage } from './types';

export * from './types';
export * from './orders';
export * from './auth';
export * from './me';
export * from './content';
import { contentApi } from './content';
import { meApi } from './me';
import { authApi } from './auth';
import { ordersApi } from './orders';
export const API_PREFIX = '/v1';

/** Статусы заказа = ключи бэкенда (см. README на Cover в Figma). */
export const orderStatuses = [
  'draft', 'pending_payment', 'awaiting_manager_confirmation', 'partially_paid', 'paid',
  'confirmed', 'completed', 'cancelled', 'refunded', 'expired',
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const useMocks = !baseUrl || process.env.NEXT_PUBLIC_USE_MOCKS === '1';

async function get<T>(path: string, mock: () => T, init?: RequestInit): Promise<T> {
  if (useMocks) return mock();
  const res = await fetch(`${baseUrl}${API_PREFIX}${path}`, init);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return (await res.json()) as T;
}

const qs = (q: Record<string, unknown>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const api = {
  orders: ordersApi,
  auth: authApi,
  me: meApi,
  content: contentApi,
  settings: (): Promise<Settings> => get('/settings', () => fx.settings),
  tours: (q: TourQuery = {}): Promise<Tour[]> => get(`/tours${qs(q as Record<string, unknown>)}`, () => queryTours(fx.tours, { ...q, per_page: 100 }).items),
  toursPage: (q: TourQuery = {}): Promise<ToursPage> => get(`/tours${qs(q as Record<string, unknown>)}`, () => queryTours(fx.tours, q)),
  destination: async (slug: string): Promise<DestinationDetail | null> => {
    if (useMocks) { const d = fx.destinations.find((x) => x.slug === slug); return d ? fx.buildDestinationDetail(d) : null; }
    const res = await fetch(`${baseUrl}${API_PREFIX}/destinations/${slug}`); return res.status === 404 ? null : ((await res.json()) as DestinationDetail);
  },
  addons: (): Promise<Addon[]> => get('/addons', () => fx.addons),
  /** Итог по выбранным допуслугам считает бэкенд (мок повторяет контракт). */
  addonsSummary: async (ids: string[]): Promise<AddonsSummary> => {
    const sel = fx.addons.filter((a) => ids.includes(a.id)); const sum = (u: Addon['unit']) => sel.filter((a) => a.unit === u).reduce((s, a) => s + a.price, 0);
    return { count: sel.length, per_person: sum('person'), per_group: sum('group'), per_trip: sum('trip'), order_number: 'ST-2027-04812' };
  },
  /** Активное предложение из листа ожидания (мок включается флагом localStorage.st_demo_offer=1 на клиенте). */
  waitlistOffer: async (id: string): Promise<WaitlistOffer | null> => {
    if (!useMocks) { const r = await fetch(`${baseUrl}${API_PREFIX}/waitlist/offers/${id}`); return r.ok ? ((await r.json()) as WaitlistOffer) : null; }
    const t = fx.tours[0]!;
    return { id, tour: { slug: t.slug, title: 'Самарканд и Бухара за 5 дней', image: t.image, region: 'Самарканд' }, from: '2027-06-02', to: '2027-06-06', seats: 2, unit_price: 600, total: 1200, expires_at: new Date(Date.now() + (1 * 3600 + 47 * 60 + 12) * 1000).toISOString(), was_first: true, departure: `${t.slug}-3` };
  },
  declineOffer: async (_id: string): Promise<{ ok: true }> => { if (!useMocks) await fetch(`${baseUrl}${API_PREFIX}/waitlist/offers/${_id}/decline`, { method: 'POST' }); return { ok: true }; },
  places: async (q: string): Promise<Place[]> => {
    if (!useMocks) return (await (await fetch(`${baseUrl}${API_PREFIX}/places?q=${encodeURIComponent(q)}`)).json()) as Place[];
    const s = q.trim().toLowerCase(); return fx.places.filter((p) => !s || `${p.title} ${p.subtitle}`.toLowerCase().includes(s)).slice(0, 6);
  },
  transferOptions: (): Promise<TransferOptions> => get('/transfers/options', () => fx.transferOptions),
  /** POST /transfers/quote → сегменты, км, время, цена. Мок: км детерминированно из названий точек. */
  transferQuote: async (r: TransferQuoteRequest): Promise<TransferQuote> => {
    if (!useMocks) return (await (await fetch(`${baseUrl}${API_PREFIX}/transfers/quote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) })).json()) as TransferQuote;
    await new Promise((x) => setTimeout(x, 150));
    const o = fx.transferOptions; const car = o.classes.find((c) => c.id === r.car)!;
    const h = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const dist = (a: string, b: string) => 20 + (h([a, b].sort().join('|')) % 80);
    let order = r.points.map((_, i) => i); let saved = 0;
    if (r.optimize && r.points.length > 3) {
      const mid = order.slice(1, -1); const sorted = [...mid].sort((a, b) => dist(r.points[0]!, r.points[a]!) - dist(r.points[0]!, r.points[b]!));
      if (sorted.join() !== mid.join()) { order = [0, ...sorted, order.length - 1]; saved = 34; }
    }
    const pts = order.map((i) => r.points[i]!);
    const segments = pts.slice(1).map((to, i) => { const km = dist(pts[i]!, to); return { from: pts[i]!, to, km, amount: Math.round(km * car.price_per_km * 100) / 100 }; });
    const total_km = segments.reduce((s, x) => s + x.km, 0); const drive_minutes = Math.round((total_km / 53) * 60);
    const time = Math.round((drive_minutes / 60) * o.hourly_rate * 100) / 100;
    const lines: TransferQuote['lines'] = [{ kind: 'base', amount: o.base_fare }, ...segments.map((s, i) => ({ kind: 'segment' as const, label: `${s.from} → ${s.to}`, km: s.km, amount: s.amount, segment: i })), { kind: 'time', amount: time }];
    if (r.child_seat) lines.push({ kind: 'child_seat', amount: o.child_seat_price });
    return { order, saved_km: saved, total_km, drive_minutes, segments, lines, total: Math.round(lines.reduce((s, l) => s + l.amount, 0) * 100) / 100 };
  },
  tour: async (slug: string): Promise<TourDetail | null> => {
    if (useMocks) { const t = fx.tours.find((x) => x.slug === slug); return t ? fx.buildDetail(t) : null; }
    const res = await fetch(`${baseUrl}${API_PREFIX}/tours/${slug}`);
    return res.status === 404 ? null : ((await res.json()) as TourDetail);
  },
  /** Расчёт суммы — на бэкенде (снимок цены). Мок повторяет контракт POST /quotes. */
  quote: async (r: QuoteRequest): Promise<Quote> => {
    if (!useMocks) { const res = await fetch(`${baseUrl}${API_PREFIX}/quotes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }); return (await res.json()) as Quote; }
    const t = fx.tours.find((x) => x.slug === r.tour); const d = t ? fx.buildDetail(t) : null; const dep = d?.departures.find((x) => x.id === r.departure);
    const unit = dep?.price ?? 0; const child = Math.round(unit * (1 - (d?.child_discount_percent ?? 50) / 100));
    const lines: Quote['lines'] = [{ kind: 'adults', count: r.adults, unit_price: unit, amount: unit * r.adults }];
    if (r.children > 0) lines.push({ kind: 'children', count: r.children, unit_price: child, amount: child * r.children });
    return { lines, total: lines.reduce((s, l) => s + l.amount, 0) };
  },
  joinWaitlist: async (_r: { tour: string; departure: string; seats: number }): Promise<{ position: number; queue: number }> => {
    if (useMocks) { await new Promise((r) => setTimeout(r, 300)); return { position: 5, queue: 5 }; }
    const res = await fetch(`${baseUrl}${API_PREFIX}/waitlist`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(_r) }); return (await res.json()) as { position: number; queue: number };
  },
  /** POST /individual-requests → заявка (статус «На подтверждении», экран 2.7d). */
  requestIndividual: (r: { tour: string; date_from: string; date_to: string; adults: number; children: number }) => ordersApi.requestIndividual2(r),
  destinations: (): Promise<Destination[]> => get('/destinations', () => fx.destinations),
  reviews: (): Promise<Review[]> => get('/reviews', () => fx.reviews),
  homeStats: (): Promise<HomeStats> => get('/stats', () => fx.homeStats),
  holiday: (): Promise<Holiday> => get('/holidays/current', () => fx.holiday),
  subscribe: async (email: string): Promise<{ ok: true }> => {
    if (useMocks) { await new Promise((r) => setTimeout(r, 400)); if (email.endsWith('@fail.test')) throw new Error('mock failure'); return { ok: true }; }
    const res = await fetch(`${baseUrl}${API_PREFIX}/subscriptions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return { ok: true };
  },
};

const bucket = (d: number) => (d <= 3 ? '1-3' : d <= 7 ? '4-7' : '8+');

/** Мок-фильтрация каталога по контракту GET /tours?destination&price_min&price_max&date_from&date_to&duration&type&available. */
export function queryTours(all: Tour[], q: TourQuery): ToursPage {
  const dests = q.destination ? q.destination.split(',').filter(Boolean) : [];
  let list = all.filter((t) =>
    (!q.season || t.season === q.season) &&
    (dests.length === 0 || dests.some((d) => t.destinations.includes(d))) &&
    (q.price_min === undefined || t.price_from >= q.price_min) &&
    (q.price_max === undefined || t.price_from <= q.price_max) &&
    (!q.duration || bucket(t.duration_days) === q.duration) &&
    (!q.type || t.type === q.type) &&
    (!q.available || (t.seats_left !== 0 && t.next_departure !== null)) &&
    (!q.date_from || (t.next_departure !== null && t.next_departure >= q.date_from)) &&
    (!q.date_to || (t.next_departure !== null && t.next_departure <= q.date_to)) &&
    (!q.q || `${t.title} ${t.region}`.toLowerCase().includes(q.q.toLowerCase())),
  );
  const sort = q.sort ?? 'popular';
  list = [...list].sort((a, b) =>
    sort === 'price_asc' ? a.price_from - b.price_from : sort === 'price_desc' ? b.price_from - a.price_from
    : sort === 'date' ? (a.next_departure ?? '9').localeCompare(b.next_departure ?? '9') : b.reviews_count - a.reviews_count);
  const per = q.per_page ?? 9;
  const page_count = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(Math.max(1, q.page ?? 1), page_count);
  return { items: list.slice((page - 1) * per, page * per), total: list.length, page, page_count };
}
