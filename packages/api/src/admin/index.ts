import * as S from './seed';
import type {
  AdminOrderDetail, AdminOrderStatus, AdminSession, Assignment, AuditEntry, CatalogTour, Customer, Dashboard, Departure, FraudCase, LedgerEntry, LedgerSummary,
  Level, Manifest, ManifestSummary, Matrix, OrdersPage, Resource, OrdersQuery, OutboxItem, PaymentEvent, Perm, Period, Promo, ReportJob, ResourceWeek, ReviewItem, Role, Rules, Staff,
  SystemSettings, Template, VehicleLayout, AdminNotification } from './types';

export * from './types';
export { ADMIN_NOW, DEMO_TOTP, DEMO_BACKUP } from './seed';

/* ---------------- Хранилище моков (localStorage, ключ st_admin_v2) ---------------- */
interface DB {
  orders: AdminOrderDetail[]; tours: CatalogTour[]; departures: Departure[]; layouts: VehicleLayout[]; assignments: Assignment[];
  promos: Promo[]; rules: Rules; reviews: ReviewItem[]; fraud: FraudCase[]; audit: AuditEntry[]; ledger: LedgerEntry[]; customers: Customer[];
  payments: PaymentEvent[]; outbox: OutboxItem[]; settings: SystemSettings; templates: Template[]; reports: ReportJob[]; matrix: Matrix; staff: Staff[];
  notifications: AdminNotification[]; seq: number;
}
const KEY = 'st_admin_v2';
const ls = () => (typeof window !== 'undefined' ? window.localStorage : null);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
function fresh(): DB {
  return {
    orders: S.seedOrders(), tours: S.seedTours(), departures: clone(S.departures), layouts: clone(S.layouts), assignments: clone(S.assignments),
    promos: clone(S.promos), rules: clone(S.rules), reviews: clone(S.reviews), fraud: clone(S.fraud), audit: clone(S.audit), ledger: clone(S.ledger),
    customers: clone(S.customers), payments: clone(S.paymentEvents), outbox: clone(S.outbox), settings: clone(S.systemSettings), templates: clone(S.templates),
    reports: clone(S.reportJobs), matrix: clone(S.matrix), staff: S.staff.map(({ password: _p, ...s }) => s), notifications: clone(S.notifications), seq: 1,
  };
}
let mem: DB | null = null;
function db(): DB {
  if (mem) return mem;
  const raw = ls()?.getItem(KEY);
  mem = raw ? (JSON.parse(raw) as DB) : fresh();
  mem.notifications ??= clone(S.notifications); // старые сохранённые базы без уведомлений
  return mem;
}
function save() { ls()?.setItem(KEY, JSON.stringify(db())); }
const sleep = (ms = 120) => new Promise((r) => setTimeout(r, ms));
const id = (p: string) => `${p}-${Date.now().toString(36)}${(db().seq++).toString(36)}`;
const now = () => new Date().toISOString();

/* ---------------- Сессия и RBAC ---------------- */
const SKEY = 'st_admin_session';
const ss = () => (typeof window !== 'undefined' ? window.sessionStorage : null);
let session: AdminSession | null = null;
function current(): AdminSession {
  if (!session) { const raw = ss()?.getItem(SKEY); session = raw ? (JSON.parse(raw) as AdminSession) : null; }
  if (!session) throw new AdminError('unauthorized');
  return session;
}
export class AdminError extends Error { constructor(public code: 'unauthorized' | 'forbidden' | 'invalid_credentials' | 'locked' | 'invalid_code' | 'conflict' | 'invalid_transition' | 'validation' | 'not_found', public detail?: string) { super(code); } }
const permsFor = (role: Role): Record<Perm, Level> => Object.fromEntries(Object.entries(db().matrix).map(([p, r]) => [p, r[role]])) as Record<Perm, Level>;
/** Проверка права на «сервере» мока: UI тоже прячет, но доверять только UI нельзя. */
function need(perm: Perm, level: 'read' | 'full' = 'read') {
  const s = current(); const have = permsFor(s.staff.role)[perm];
  if (have === 'none' || (level === 'full' && have !== 'full')) throw new AdminError('forbidden', perm);
  return s;
}
function log(action: string, object: string, details: string) {
  const s = session; db().audit.unshift({ id: id('au'), at: now(), actor: s?.staff.short ?? 'Система', actor_role: s?.staff.role ?? 'system', action, object, details, ip: '10.0.4.7' });
}

const challenges = new Map<string, { staffId: string; exp: number }>();
const attempts = new Map<string, number>();

export const adminApi = {
  auth: {
    async login(email: string, password: string): Promise<{ challenge: string; twofa: boolean }> {
      await sleep(300);
      const key = email.trim().toLowerCase(); const n = attempts.get(key) ?? 0;
      if (n >= 5) throw new AdminError('locked');
      const s = S.staff.find((x) => x.email === key && x.password === password);
      if (!s) { attempts.set(key, n + 1); throw new AdminError('invalid_credentials'); }
      attempts.delete(key);
      const challenge = `ch_${Math.random().toString(36).slice(2)}`;
      challenges.set(challenge, { staffId: s.id, exp: Date.now() + 5 * 60_000 });
      const twofa = s.twofa || db().settings.require_2fa && s.role !== 'content';
      const trusted = ls()?.getItem(`st_admin_trust_${s.id}`);
      if (!twofa || (trusted && Number(trusted) > Date.now())) return { challenge: await adminApi.auth._issue(challenge, null), twofa: false };
      return { challenge, twofa: true };
    },
    /** Подтверждение 2FA (TOTP или резервный код). trust — «Доверять 30 дней» на этом устройстве. */
    async verify(challenge: string, code: string, opts: { backup?: boolean; trust?: boolean } = {}): Promise<AdminSession> {
      await sleep(300);
      const ch = challenges.get(challenge);
      if (!ch || ch.exp < Date.now()) throw new AdminError('unauthorized');
      const ok = opts.backup ? code.trim().toUpperCase() === S.DEMO_BACKUP : code === S.DEMO_TOTP;
      if (!ok) throw new AdminError('invalid_code');
      const until = opts.trust ? Date.now() + 30 * 86400_000 : null;
      if (until) ls()?.setItem(`st_admin_trust_${ch.staffId}`, String(until));
      await adminApi.auth._issue(challenge, until);
      return current();
    },
    async _issue(challenge: string, trustedUntil: number | null): Promise<string> {
      const ch = challenges.get(challenge)!; challenges.delete(challenge);
      const s = db().staff.find((x) => x.id === ch.staffId)!;
      session = { token: `adm_${Math.random().toString(36).slice(2)}`, staff: s, perms: permsFor(s.role), trusted_until: trustedUntil ? new Date(trustedUntil).toISOString() : null };
      ss()?.setItem(SKEY, JSON.stringify(session));
      log('auth.login', s.short, '2FA ok'); save();
      return session.token;
    },
    session(): AdminSession | null { try { const s = current(); return { ...s, perms: permsFor(s.staff.role) }; } catch { return null; } },
    async logout() { if (session) { log('auth.logout', session.staff.short, ''); save(); } session = null; ss()?.removeItem(SKEY); },
  },

  /** Уведомления топбара: только те, на которые у роли есть право (проверка на «сервере»). */
  notifications: {
    async list(): Promise<{ items: (Omit<AdminNotification, 'read_by'> & { read: boolean })[]; unread: number }> {
      const s = current(); await sleep(80); const perms = permsFor(s.staff.role);
      const items = db().notifications.filter((n) => perms[n.perm] !== 'none').sort((a, b) => b.at.localeCompare(a.at))
        .map(({ read_by, ...n }) => ({ ...n, read: read_by.includes(s.staff.id) }));
      return { items, unread: items.filter((n) => !n.read).length };
    },
    async markRead(nid: string): Promise<void> {
      const s = current(); const n = db().notifications.find((x) => x.id === nid);
      if (!n) throw new AdminError('not_found'); if (permsFor(s.staff.role)[n.perm] === 'none') throw new AdminError('forbidden', n.perm);
      if (!n.read_by.includes(s.staff.id)) n.read_by.push(s.staff.id); save();
    },
    async markAllRead(): Promise<void> {
      const s = current(); const perms = permsFor(s.staff.role);
      db().notifications.forEach((n) => { if (perms[n.perm] !== 'none' && !n.read_by.includes(s.staff.id)) n.read_by.push(s.staff.id); }); save();
    },
  },

  async badges(): Promise<{ orders: number; reviews: number }> {
    current(); const d = db();
    return { orders: d.orders.filter((o) => o.status === 'awaiting_manager_confirmation' || o.flags.length).length + 9, reviews: d.reviews.filter((r) => r.status === 'pending').length };
  },

  async dashboard(period: Period): Promise<Dashboard> {
    need('orders'); await sleep();
    const days = { '7d': 7, '30d': 30, quarter: 90, year: 365 }[period];
    const end = new Date('2027-04-30T00:00:00Z'); const start = new Date(end.getTime() - (days - 1) * 86400_000);
    const pattern = [1.75, 2.35, 2.05, 3.1, 2.85, 1.6, 1.15, 2.45, 2.85, 3.25, 2.7, 3.45, 1.95, 1.5, 2.6, 2.95, 3.65, 3.2, 4.0, 2.4, 1.85, 2.85, 3.35, 3.85, 4.23, 3.45, 2.15, 3.05, 3.65, 4.4];
    const revenue_by_day = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const d = new Date(end.getTime() - (Math.min(days, 30) - 1 - i) * 86400_000);
      const k = pattern[i % pattern.length]! * (days > 30 ? days / 30 : 1);
      return { date: d.toISOString().slice(0, 10), amount: Math.round(k * 1000), orders: Math.max(1, Math.round(k * 2.6)) };
    });
    const scale = days / 30;
    return {
      from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10),
      kpi: { revenue: Math.round(84320 * scale), revenue_delta_pct: 12, paid_orders: Math.round(214 * scale), paid_delta: Math.round(18 * scale), occupancy_pct: 78, occupancy_delta_pp: -3, avg_check: 394, avg_delta: -6 },
      revenue_by_day,
      top_destinations: [{ name: 'Самарканд', amount: 31200 }, { name: 'Бухара', amount: 22800 }, { name: 'Хива', amount: 12400 }, { name: 'Чимган', amount: 9900 }, { name: 'Нурата', amount: 8020 }].map((x) => ({ ...x, amount: Math.round(x.amount * scale) })),
      funnel: [{ key: 'views', value: Math.round(18420 * scale) }, { key: 'started', value: Math.round(1240 * scale) }, { key: 'held', value: Math.round(486 * scale) }, { key: 'paid', value: Math.round(214 * scale) }],
      attention: { individual: db().orders.filter((o) => o.status === 'awaiting_manager_confirmation').length + 2, manual_refunds: db().orders.filter((o) => o.flags.includes('manual_refund')).length + 1, overdue: db().orders.filter((o) => o.flags.includes('overdue')).length + 3, fraud: db().fraud.filter((f) => f.status === 'open' && f.kind === 'payment').length, webhook_failures: 0 },
    };
  },

  orders: {
    async list(q: OrdersQuery): Promise<OrdersPage> {
      need('orders'); await sleep();
      const all = db().orders;
      const seg = (o: AdminOrderDetail, s: OrdersQuery['segment']) => s === 'awaiting' ? o.status === 'awaiting_manager_confirmation' : s === 'refunds' ? o.flags.includes('manual_refund') : s === 'overdue' ? o.flags.includes('overdue') : s === 'fraud' ? o.flags.includes('fraud') : true;
      const counts = { all: all.length, awaiting: all.filter((o) => seg(o, 'awaiting')).length, refunds: all.filter((o) => seg(o, 'refunds')).length, overdue: all.filter((o) => seg(o, 'overdue')).length, fraud: all.filter((o) => seg(o, 'fraud')).length };
      const text = q.q?.trim().toLowerCase();
      const items = all.filter((o) => seg(o, q.segment)
        && (!q.status || q.status === 'all' || o.status === q.status)
        && (!q.tour || q.tour === 'all' || o.tour_slug === q.tour)
        && (!q.type || q.type === 'all' || (q.type === 'individual') === o.individual)
        && (!q.from || o.departure >= q.from) && (!q.to || o.departure <= q.to)
        && (!text || `${o.number} ${o.customer} ${o.email} ${o.tour}`.toLowerCase().includes(text)));
      const per = q.per_page ?? 8; const pages = Math.max(1, Math.ceil(items.length / per)); const page = Math.min(Math.max(1, q.page ?? 1), pages);
      return { items: items.slice((page - 1) * per, page * per).map(({ email: _e, phone: _p, history: _h, ...row }) => row) as never, total: items.length, page, pages, counts };
    },
    async get(orderId: string): Promise<AdminOrderDetail> {
      const s = need('orders'); await sleep(80);
      const o = db().orders.find((x) => x.id === orderId || x.number === orderId);
      if (!o) throw new AdminError('not_found');
      const pii = permsFor(s.staff.role).pii;
      const masked = pii === 'none' ? { email: '•••', phone: '•••' } : {};
      return { ...o, ...masked, allowed_transitions: S.TRANSITIONS[o.status] };
    },
    /** Смена статуса — только по статусной машине; недопустимый переход отклоняется. */
    async transition(orderId: string, to: AdminOrderStatus): Promise<AdminOrderDetail> {
      need('orders', 'full'); await sleep();
      const o = db().orders.find((x) => x.id === orderId)!;
      if (!S.TRANSITIONS[o.status].includes(to)) throw new AdminError('invalid_transition', `${o.status} → ${to}`);
      const from = o.status; o.status = to; o.allowed_transitions = S.TRANSITIONS[to];
      if (to === 'paid') { o.paid = o.total; o.payment = { kind: 'full' }; o.flags = o.flags.filter((f) => f !== 'overdue'); o.risk = null; }
      log('order.status_changed', o.number, `${from} → ${to}`);
      o.history.unshift({ ...db().audit[0]! });
      save(); return adminApi.orders.get(orderId);
    },
    /** Ручной возврат: создаёт проводку в леджере и запись аудита. Сумма ≤ оплачено. */
    async refund(orderId: string, amount: number, reason: string): Promise<AdminOrderDetail> {
      need('refunds', 'full'); await sleep(300);
      const o = db().orders.find((x) => x.id === orderId)!;
      if (!(amount > 0) || amount > o.refundable + 1e-9) throw new AdminError('validation', 'amount');
      o.refundable = Math.round((o.refundable - amount) * 100) / 100;
      const entry: LedgerEntry = { id: `L-${88300 + db().seq++}`, at: now(), order: o.number, debit: 'Возвраты', credit: 'Денежные поступления', amount };
      db().ledger.unshift(entry);
      log('refund.created', o.number, `$${amount.toFixed(2)} · ${reason} · проводка ${entry.id}`);
      o.history.unshift({ ...db().audit[0]! });
      save(); return adminApi.orders.get(orderId);
    },
    exportCsv(rows: { number: string; customer: string; tour: string; departure: string; pax: number; total: number; status: string }[]): string {
      const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
      return ['number,customer,tour,departure,pax,total_usd,status', ...rows.map((r) => [r.number, r.customer, r.tour, r.departure, r.pax, r.total, r.status].map(esc).join(','))].join('\n');
    },
  },

  catalog: {
    async tours(): Promise<CatalogTour[]> { need('catalog'); await sleep(); return db().tours; },
    async tour(slug: string): Promise<{ tour: CatalogTour; departures: Departure[] }> {
      need('catalog'); await sleep(80);
      const tour = db().tours.find((t) => t.slug === slug); if (!tour) throw new AdminError('not_found');
      return { tour, departures: db().departures.filter((d) => d.tour_slug === slug) };
    },
    /** Готовность к публикации — те же проверки делает бэкенд при publish. */
    readiness(t: CatalogTour, deps: Departure[]) {
      return { ru: Boolean(t.title.ru && t.description.ru), translations: Boolean(t.title.uz && t.title.en && t.description.uz && t.description.en), photos: t.photos >= 5, program: t.program_days >= t.duration_days, no_conflicts: !deps.some((d) => d.conflict) };
    },
    async save(slug: string, patch: Partial<CatalogTour>, publish = false): Promise<CatalogTour> {
      need('catalog', 'full'); await sleep(250);
      const t = db().tours.find((x) => x.slug === slug)!;
      Object.assign(t, patch, { updated_at: now(), updated_by: current().staff.short });
      if (publish) {
        const r = adminApi.catalog.readiness(t, db().departures.filter((d) => d.tour_slug === slug));
        if (!Object.values(r).every(Boolean)) throw new AdminError('validation', 'not_ready');
        t.status = 'published';
      }
      log(publish ? 'tour.published' : 'tour.updated', t.title.ru, publish ? 'Опубликован' : 'Черновик сохранён'); save(); return t;
    },
    async addDeparture(slug: string, from: string, to: string, guide_id: string | null, vehicle_id: string): Promise<Departure> {
      need('catalog', 'full'); await sleep(200);
      const t = db().tours.find((x) => x.slug === slug)!;
      const conflict = guide_id ? adminApi.resources._conflict(guide_id, from, to) : null;
      if (conflict) throw new AdminError('conflict', conflict);
      const d: Departure = { id: id('dep'), tour_slug: slug, from, to, vehicle_id, guide_id, sold: 0, capacity: t.group_max, base: t.price, dynamic: null, conflict: null };
      db().departures.push(d); save(); return d;
    },
    async layout(vehicleId: string): Promise<VehicleLayout> { need('catalog'); await sleep(80); const l = db().layouts.find((x) => x.id === vehicleId); if (!l) throw new AdminError('not_found'); return l; },
    async layouts(): Promise<VehicleLayout[]> { need('catalog'); return db().layouts; },
    async saveLayout(l: VehicleLayout): Promise<VehicleLayout> {
      need('catalog', 'full'); await sleep(250);
      const i = db().layouts.findIndex((x) => x.id === l.id); db().layouts[i] = l;
      log('layout.updated', l.name, `${l.cells.flat().filter((c) => c.kind === 'seat' || c.kind === 'child').length} мест`); save(); return l;
    },
    async duplicateLayout(vehicleId: string): Promise<VehicleLayout> {
      need('catalog', 'full'); const src = db().layouts.find((x) => x.id === vehicleId)!;
      const copy = { ...clone(src), id: id('v'), name: `${src.name} (копия)`, used_in: 0 }; db().layouts.push(copy); save(); return copy;
    },
  },

  resources: {
    async list(kind?: 'guide' | 'vehicle'): Promise<Resource[]> { need('catalog'); return S.resources.filter((r) => !kind || r.kind === kind); },
    _conflict(resourceId: string, from: string, to: string, ignore?: string): string | null {
      const hit = db().assignments.find((a) => a.resource_id === resourceId && a.id !== ignore && a.state !== 'conflict' && a.from <= to && from <= a.to);
      return hit ? `${hit.title} (${hit.from.slice(8)}–${hit.to.slice(8)}.${hit.to.slice(5, 7)})` : null;
    },
    async week(kind: 'guide' | 'vehicle', from: string): Promise<ResourceWeek> {
      need('resources'); await sleep();
      const to = new Date(new Date(`${from}T00:00:00Z`).getTime() + 6 * 86400_000).toISOString().slice(0, 10);
      const resources = S.resources.filter((r) => r.kind === kind);
      const assignments = db().assignments.filter((a) => resources.some((r) => r.id === a.resource_id) && a.from <= to && from <= a.to);
      const conflicts = assignments.filter((a) => a.state === 'conflict').map((a) => {
        const other = assignments.find((b) => b.resource_id === a.resource_id && b.id !== a.id && b.from <= a.to && a.from <= b.to)!;
        return { resource: resources.find((r) => r.id === a.resource_id)!.name, a: other.title, a_range: `${other.from}/${other.to}`, b: a.title, b_range: `${a.from}/${a.to}` };
      });
      return { from, to, resources, assignments, conflicts };
    },
    /** Назначение с конфликтом не сохраняется — бэкенд возвращает 409. */
    async assign(resourceId: string, title: string, from: string, to: string): Promise<Assignment> {
      need('resources', 'full'); await sleep(200);
      const c = adminApi.resources._conflict(resourceId, from, to);
      if (c) throw new AdminError('conflict', c);
      const a: Assignment = { id: id('as'), resource_id: resourceId, title, from, to, state: 'assigned' };
      db().assignments.push(a); log('resource.assigned', title, `${resourceId} ${from}–${to}`); save(); return a;
    },
    async reassign(assignmentId: string, resourceId: string): Promise<Assignment> {
      need('resources', 'full'); await sleep(200);
      const a = db().assignments.find((x) => x.id === assignmentId)!;
      const c = adminApi.resources._conflict(resourceId, a.from, a.to, a.id);
      if (c) throw new AdminError('conflict', c);
      a.resource_id = resourceId; a.state = 'assigned';
      const dep = db().departures.find((d) => d.id === a.departure_id); if (dep) { dep.guide_id = resourceId; dep.conflict = null; }
      log('resource.reassigned', a.title, resourceId); save(); return a;
    },
  },

  manifests: {
    async list(): Promise<ManifestSummary[]> {
      need('resources'); await sleep();
      return db().departures.filter((d) => d.from >= '2027-04-14').map((d) => ({ departure_id: d.id, tour: db().tours.find((t) => t.slug === d.tour_slug)?.title.ru.split(':')[0] ?? d.tour_slug, date: d.from, sold: d.sold, capacity: d.capacity }));
    },
    async get(departureId: string): Promise<Manifest> {
      need('resources'); need('pii'); await sleep();
      log('pii.viewed', `Манифест ${departureId}`, 'Просмотр паспортных данных'); save();
      return { pax_total: 15, departure_id: departureId, tour: 'Самарканд и Бухара', date: '2027-05-12', vehicle: 'Mercedes Sprinter 18', plate: '01 A 123 BC', guide: 'Фарход М.', meeting_time: '07:30', meeting_place: 'отель Registan Plaza', capacity: 18, rows: S.manifestRows, unpaid: 0, link_until: '2027-05-17', link_token: 'gm_7Kq2' };
    },
    async sendLink(departureId: string): Promise<{ url: string; until: string }> {
      need('resources', 'full'); await sleep(250);
      log('manifest.link_sent', departureId, 'Ссылка для гида, только просмотр'); save();
      return { url: `/guide/gm_7Kq2`, until: '2027-05-17' };
    },
    /** Публичная ссылка для гида: только просмотр, срок ограничен, без контактов. */
    async guide(token: string): Promise<Omit<Manifest, 'rows'> & { rows: Omit<Manifest['rows'][number], 'contact' | 'citizenship'>[] } | null> {
      await sleep(); if (token !== 'gm_7Kq2') return null;
      return { pax_total: 15, departure_id: 'DEP-0512', tour: 'Самарканд и Бухара', date: '2027-05-12', vehicle: 'Mercedes Sprinter 18', plate: '01 A 123 BC', guide: 'Фарход М.', meeting_time: '07:30', meeting_place: 'Registan Plaza', capacity: 18, unpaid: 0, link_until: '2027-05-17', link_token: token, rows: S.manifestRows.map(({ contact: _c, citizenship: _z, ...r }) => r) };
    },
  },

  marketing: {
    async promos(): Promise<Promo[]> { need('marketing'); await sleep(); return db().promos; },
    async createPromo(p: Omit<Promo, 'used' | 'status'>): Promise<Promo> {
      need('marketing', 'full'); await sleep(250);
      if (db().promos.some((x) => x.code === p.code)) throw new AdminError('validation', 'code_taken');
      const promo: Promo = { ...p, used: 0, status: 'active' }; db().promos.unshift(promo); log('promo.created', p.code, `${p.kind} ${p.value}`); save(); return promo;
    },
    async rules(): Promise<Rules> { need('marketing'); await sleep(); return db().rules; },
    async saveRules(r: Rules): Promise<Rules> { need('marketing', 'full'); await sleep(250); db().rules = r; log('rules.updated', 'pricing', 'Правила цен, пеней и лояльности'); save(); return r; },
    async reviews(): Promise<ReviewItem[]> { need('marketing'); await sleep(); return db().reviews.filter((r) => r.status === 'pending'); },
    async moderate(reviewId: string, action: 'publish' | 'reject' | 'reply', reply?: string): Promise<void> {
      need('marketing', 'full'); await sleep(200);
      const r = db().reviews.find((x) => x.id === reviewId)!;
      if (action === 'reply') r.reply = reply; else r.status = action === 'publish' ? 'published' : 'rejected';
      log(`review.${action}`, r.author, r.tour); save();
    },
  },

  security: {
    async roles(): Promise<{ matrix: Matrix; staff: Staff[] }> { need('system', 'read'); await sleep(); return { matrix: db().matrix, staff: db().staff }; },
    async invite(email: string, role: Role): Promise<void> { need('system', 'full'); await sleep(250); log('staff.invited', email, role); save(); },
    async fraud(): Promise<FraudCase[]> { need('security'); await sleep(); return db().fraud.filter((f) => f.status === 'open'); },
    async limits() { need('security'); return { promo: 5, login: [10, 15] as const, holds: 3, manual_over: 3000 }; },
    async decide(caseId: string, decision: 'approved' | 'rejected' | 'cleared' | 'blocked'): Promise<void> {
      need('security', 'full'); await sleep(250);
      const f = db().fraud.find((x) => x.id === caseId)!; f.status = decision; log(`fraud.${decision}`, f.title, `risk ${f.score}`); save();
    },
    async audit(q: { who?: string; action?: string; date?: string }): Promise<AuditEntry[]> {
      need('security'); await sleep();
      return db().audit.filter((a) => (!q.who || q.who === 'all' || a.actor === q.who) && (!q.action || q.action === 'all' || a.action === q.action) && (!q.date || a.at.startsWith(q.date)));
    },
  },

  ledger: {
    async list(): Promise<{ entries: LedgerEntry[]; summary: LedgerSummary }> {
      need('security'); await sleep();
      return { entries: db().ledger, summary: { cash: 84320, receivables: 12410.5, revenue: 71909.5, bonus: 1842, refunds: 3216 + db().ledger.filter((l) => l.id.startsWith('L-883')).reduce((s, l) => s + l.amount, 0), balanced: true, total: 612480.5, reconciled_at: '2027-04-14T06:00:00' } };
    },
  },

  customers: {
    async list(q?: string): Promise<{ items: Customer[]; total: number }> {
      need('orders'); await sleep();
      const t = q?.trim().toLowerCase(); const items = db().customers.filter((c) => !t || `${c.name} ${c.email}`.toLowerCase().includes(t));
      return { items, total: 8412 };
    },
    async grantPoints(customerId: string, points: number, reason: string): Promise<Customer> {
      need('marketing', 'full'); await sleep(250);
      const c = db().customers.find((x) => x.id === customerId)!; c.points += points;
      db().ledger.unshift({ id: `L-${88400 + db().seq++}`, at: now(), order: '—', debit: 'Маркетинговые расходы', credit: 'Бонусные обязательства', amount: points / db().rules.loyalty.rate });
      log('points.granted', c.email, `+${points} · ${reason}`); save(); return c;
    },
  },

  payments: {
    async events(): Promise<{ items: PaymentEvent[]; mismatch: { at: string; payment: string; order: string } | null }> {
      need('orders'); await sleep();
      return { items: db().payments, mismatch: { at: '2027-04-14T06:00:00', payment: 'PAY-7F3A21', order: 'pending_payment' } };
    },
    async reconcile(): Promise<{ mismatches: number }> { need('security', 'full'); await sleep(600); log('payments.reconciled', 'mock-pay', '1 расхождение'); save(); return { mismatches: 1 }; },
  },

  system: {
    async outbox(): Promise<{ items: OutboxItem[]; stats: { queued: number; sent_hour: number; retries: number; dead: number } }> {
      need('system', 'read'); await sleep();
      const items = db().outbox;
      return { items, stats: { queued: 12, sent_hour: 1284, retries: items.filter((i) => i.status === 'pending').length + 2, dead: items.filter((i) => i.status === 'dead').length } };
    },
    async retry(itemId: string): Promise<OutboxItem> {
      need('system', 'full'); await sleep(400);
      const i = db().outbox.find((x) => x.id === itemId)!; i.attempts += 1; i.status = 'pending'; i.error = null;
      log('outbox.retry', i.event, i.aggregate); save(); return i;
    },
    async settings(): Promise<SystemSettings> { need('system', 'read'); await sleep(); return db().settings; },
    async saveSettings(s: SystemSettings): Promise<SystemSettings> { need('system', 'full'); await sleep(250); db().settings = s; log('settings.updated', 'system', 'Настройки системы'); save(); return s; },
    async templates(): Promise<Template[]> { need('system', 'read'); await sleep(); return db().templates; },
    async saveTemplate(t: Template): Promise<Template> { need('system', 'full'); await sleep(250); const i = db().templates.findIndex((x) => x.id === t.id); db().templates[i] = t; log('template.updated', t.key, ''); save(); return t; },
    async testTemplate(templateId: string): Promise<{ sent_to: string }> { const s = need('system', 'read'); await sleep(300); log('template.test_sent', templateId, s.staff.email); save(); return { sent_to: s.staff.email }; },
    async reports(): Promise<ReportJob[]> { need('security'); await sleep(); return db().reports; },
    async requestReport(kind: string, format: 'csv' | 'xlsx', period: string): Promise<ReportJob> {
      need('security'); await sleep(250);
      const job: ReportJob = { id: id('rp'), kind, period, format, status: 'running' }; db().reports.unshift(job); save();
      setTimeout(() => { job.status = 'ready'; const j = db().reports.find((x) => x.id === job.id); if (j) j.status = 'ready'; save(); }, 2500);
      return job;
    },
  },

  /** Сброс демо-данных (для e2e). */
  _reset() { mem = fresh(); attempts.clear(); challenges.clear(); save(); },
};
export type AdminApi = typeof adminApi;
