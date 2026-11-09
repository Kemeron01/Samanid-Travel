import * as fx from '../fixtures';
import type {
  AdminOrderDetail, AdminOrderStatus, AuditEntry, CatalogTour, Customer, Departure, FraudCase, LedgerEntry, Matrix, OutboxItem, PaymentEvent,
  Promo, ReportJob, Resource, Assignment, ReviewItem, Rules, SeatCell, Staff, SystemSettings, Template, VehicleLayout, ManifestRow, AdminNotification } from './types';

/** Демо-«сегодня» админки — совпадает с макетами 05 Admin (14 апреля 2027). */
export const ADMIN_NOW = '2027-04-14T09:15:00';

export const staff: (Staff & { password: string })[] = [
  { id: 's1', name: 'Дилшод Рахимов', short: 'Дилшод Р.', email: 'd.rakhimov@samanid.travel', role: 'admin', twofa: true, password: 'Samanid2027' },
  { id: 's2', name: 'Камила Юлдашева', short: 'Камила Ю.', email: 'k.yuldasheva@samanid.travel', role: 'manager', twofa: true, password: 'Samanid2027' },
  { id: 's3', name: 'Севара Назарова', short: 'Севара Н.', email: 's.nazarova@samanid.travel', role: 'content', twofa: false, password: 'Samanid2027' },
];
/** Демо-коды: TOTP и резервный. В проде — проверка на сервере. */
export const DEMO_TOTP = '482913';
export const DEMO_BACKUP = 'A1B2-C3D4';

export const matrix: Matrix = {
  catalog: { content: 'full', manager: 'full', admin: 'full' },
  orders: { content: 'none', manager: 'full', admin: 'full' },
  refunds: { content: 'none', manager: 'full', admin: 'full' },
  resources: { content: 'none', manager: 'full', admin: 'full' },
  pii: { content: 'none', manager: 'read', admin: 'full' },
  marketing: { content: 'none', manager: 'none', admin: 'full' },
  security: { content: 'none', manager: 'read', admin: 'full' },
  system: { content: 'none', manager: 'none', admin: 'full' },
};

/** Допустимые переходы статусной машины заказа (как на бэкенде). */
export const TRANSITIONS: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  draft: ['pending_payment', 'cancelled'],
  pending_payment: ['paid', 'partially_paid', 'cancelled', 'expired'],
  awaiting_manager_confirmation: ['pending_payment', 'cancelled'],
  partially_paid: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: ['refunded'],
  completed: [], refunded: [], expired: [],
};

// Детерминированный генератор — одинаковые данные при каждом засеве.
function rng(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

const names = ['Азиз Каримов', 'Малика Юсупова', 'James Smith', 'Ольга Ким', 'Тимур Расулов', 'Нодира Алиева', 'Anna Müller', 'Бобур Турсунов', 'Lena Fischer', 'Шахзод Мирзаев', 'Дильноза Саидова', 'Marco Rossi', 'Сардор Хакимов', 'Emma Wilson', 'Гульнора Исмаилова'];
const emailOf = (n: string) => `${n.split(' ')[0]!.toLowerCase().replace(/[^a-z]/g, '') || 'client'}${n.length}@mail.uz`;

function detail(o: Omit<AdminOrderDetail, 'allowed_transitions' | 'refundable' | 'history' | 'risk'> & { history?: AuditEntry[]; risk?: AdminOrderDetail['risk'] }): AdminOrderDetail {
  return { ...o, allowed_transitions: TRANSITIONS[o.status], refundable: o.paid, history: o.history ?? [{ id: `h-${o.id}-1`, at: '2027-03-10T14:02:00', actor: o.customer, action: 'order.created', object: o.number, details: `Заказ создан, hold мест ${o.seats.join(', ') || '—'}`, ip: null }], risk: o.risk ?? null };
}

export function seedOrders(): AdminOrderDetail[] {
  const base: AdminOrderDetail[] = [
    detail({ id: 'o4812', number: 'ST-2027-04812', customer: 'Азиз Каримов', email: 'aziz@example.com', phone: '+998 90 123 45 67', tour: 'Самарканд и Бухара', tour_slug: 'samarkand-bukhara-5d', departure: '2027-05-12', individual: false, pax: 3, adults: 2, children: 1, seats: ['2A', '2B', '4A'], total: 1579, paid: 527, payment: { kind: 'installment', paid: 1, total: 3 }, status: 'confirmed', flags: [], guide: 'Фарход М.', vehicle: 'Mercedes Sprinter 18 · 01 A 123 BC' }),
    detail({ id: 'o4990', number: 'ST-2027-04990', customer: 'Малика Юсупова', email: 'malika@mail.uz', phone: '+998 90 555 12 34', tour: 'Хива', tour_slug: 'khiva-open-air-4d', departure: '2027-06-03', individual: false, pax: 2, adults: 2, children: 0, seats: ['1A', '1B'], total: 1260, paid: 420, payment: { kind: 'overdue', days: 3 }, status: 'partially_paid', flags: ['overdue'], guide: 'Рустам Х.', vehicle: 'Hyundai County · 01 A 777 AA',
      risk: { title: 'Риск блокировки выезда 27 мая', text: 'Взнос 2 просрочен на 3 дня, пеня $6.30. Клиенту отправлено 2 напоминания.' },
      history: [
        { id: 'h1', at: '2027-04-14T09:12:00', actor: 'Система', actor_role: 'system', action: 'penalty.accrued', object: 'ST-2027-04990', details: 'Пеня +$2.10 за 13.04 (проводка L-88213)', ip: null },
        { id: 'h2', at: '2027-04-13T10:00:00', actor: 'Система', actor_role: 'system', action: 'notify.sent', object: 'ST-2027-04990', details: 'Напоминание о просрочке → Telegram, email', ip: null },
        { id: 'h3', at: '2027-04-10T00:05:00', actor: 'Система', actor_role: 'system', action: 'installment.overdue', object: 'ST-2027-04990', details: 'Взнос 2 не оплачен → статус «просрочен»', ip: null },
        { id: 'h4', at: '2027-03-10T14:09:00', actor: 'Webhook mock-pay', actor_role: 'webhook', action: 'payment.succeeded', object: 'ST-2027-04990', details: 'Платёж PAY-55A1 $420 подтверждён (idempotency key ok)', ip: null },
        { id: 'h5', at: '2027-03-10T14:02:00', actor: 'Малика Юсупова', action: 'order.created', object: 'ST-2027-04990', details: 'Заказ создан, hold мест 1A, 1B', ip: null },
      ] }),
    detail({ id: 'o5117', number: 'ST-2027-05117', customer: 'Азиз Каримов', email: 'aziz@example.com', phone: '+998 90 123 45 67', tour: 'Индивидуальный: Самарканд', tour_slug: 'samarkand-private', departure: '2027-06-03', individual: true, pax: 2, adults: 2, children: 0, seats: [], total: 1440, paid: 0, payment: { kind: 'none' }, status: 'awaiting_manager_confirmation', flags: [], guide: null, vehicle: null }),
    detail({ id: 'o5120', number: 'ST-2027-05120', customer: 'James Smith', email: 'j.smith@mail.co.uk', phone: '+44 7700 900123', tour: 'Чимган', tour_slug: 'tashkent-chimgan-2d', departure: '2027-05-20', individual: false, pax: 1, adults: 1, children: 0, seats: ['3B'], total: 190, paid: 0, payment: { kind: 'awaiting' }, status: 'pending_payment', flags: [], guide: 'Камила Ю.', vehicle: 'Toyota Hiace · 01 B 555 CC' }),
    detail({ id: 'o5098', number: 'ST-2027-05098', customer: 'Ольга Ким', email: 'olga.kim@mail.ru', phone: '+7 916 000 11 22', tour: 'Бухара', tour_slug: 'bukhara-caravanserai', departure: '2027-05-19', individual: false, pax: 2, adults: 2, children: 0, seats: ['5A', '5B'], total: 760, paid: 760, payment: { kind: 'full' }, status: 'paid', flags: [], guide: 'Фарход М.', vehicle: 'Mercedes Sprinter 18 · 01 A 123 BC' }),
    detail({ id: 'o4771', number: 'ST-2027-04771', customer: 'Тимур Расулов', email: 'timur.r@mail.uz', phone: '+998 93 444 55 66', tour: 'Самарканд за 2 дня', tour_slug: 'samarkand-afrosiyob-2d', departure: '2027-05-02', individual: false, pax: 4, adults: 4, children: 0, seats: [], total: 1040, paid: 1040, payment: { kind: 'refund', date: '2027-05-07' }, status: 'cancelled', flags: ['manual_refund'], guide: null, vehicle: null }),
    detail({ id: 'o4412', number: 'ST-2027-04412', customer: 'Нодира А.', email: 'nodira.a@mail.uz', phone: '+998 97 222 33 44', tour: 'Хива', tour_slug: 'khiva-open-air-4d', departure: '2027-04-03', individual: false, pax: 2, adults: 2, children: 0, seats: ['2C', '2D'], total: 840, paid: 840, payment: { kind: 'full' }, status: 'completed', flags: [], guide: 'Рустам Х.', vehicle: 'Hyundai County · 01 A 777 AA' }),
    detail({ id: 'o5131', number: 'ST-2027-05131', customer: 'Anna Müller', email: 'anna.mueller@web.de', phone: '+49 151 0000 1111', tour: 'Классика', tour_slug: 'classic-uzbekistan-7d', departure: '2027-05-12', individual: false, pax: 2, adults: 2, children: 0, seats: [], total: 1960, paid: 0, payment: { kind: 'hold_expired' }, status: 'expired', flags: [], guide: null, vehicle: null }),
    detail({ id: 'o5140', number: 'ST-2027-05140', customer: 'user4471', email: 'user4471@temp-mail.io', phone: '—', tour: 'Великий шёлковый путь', tour_slug: 'great-silk-road-10d', departure: '2027-06-10', individual: false, pax: 2, adults: 2, children: 0, seats: ['6A', '6B'], total: 2380, paid: 0, payment: { kind: 'awaiting' }, status: 'pending_payment', flags: ['fraud'], guide: null, vehicle: null }),
  ];
  const r = rng(42); const statuses: AdminOrderStatus[] = ['confirmed', 'paid', 'pending_payment', 'partially_paid', 'completed', 'confirmed', 'paid', 'cancelled', 'expired', 'confirmed'];
  const extra: AdminOrderDetail[] = [];
  for (let i = 0; i < 88; i++) {
    const t = fx.tours[Math.floor(r() * fx.tours.length)]!; const n = names[Math.floor(r() * names.length)]!;
    const status = statuses[Math.floor(r() * statuses.length)]!; const pax = 1 + Math.floor(r() * 4);
    const day = 1 + Math.floor(r() * 60); const dep = new Date(Date.UTC(2027, 3, 20 + day)).toISOString().slice(0, 10);
    const total = Math.round(t.price_from * pax * (0.9 + r() * 0.3));
    const paid = ['paid', 'confirmed', 'completed'].includes(status) ? total : status === 'partially_paid' ? Math.round(total / 3) : 0;
    const num = `ST-2027-${String(4000 + i * 13).padStart(5, '0')}`;
    const payment = status === 'partially_paid' ? { kind: 'installment' as const, paid: 1, total: 3 } : paid ? { kind: 'full' as const } : status === 'expired' ? { kind: 'hold_expired' as const } : status === 'pending_payment' ? { kind: 'awaiting' as const } : { kind: 'none' as const };
    extra.push(detail({ id: `g${i}`, number: num, customer: n, email: emailOf(n), phone: '+998 90 000 00 00', tour: t.title.split(':')[0]!, tour_slug: t.slug, departure: dep, individual: t.type === 'individual', pax, adults: pax, children: 0, seats: [], total, paid, payment, status, flags: [], guide: null, vehicle: null }));
  }
  return [...base, ...extra];
}

export function seedTours(): CatalogTour[] {
  const dest = (slug: string) => fx.destinations.find((d) => d.slug === slug)?.name ?? slug;
  const custom: Record<string, Partial<CatalogTour>> = {
    'samarkand-bukhara-5d': { next: { date: '2027-05-12', sold: 3, capacity: 16 } },
    'samarkand-private': { next: null },
    'khiva-open-air-4d': { next: { date: '2027-06-03', sold: 0, capacity: 14 }, title: { ru: 'Хива: город-музей за 3 дня', uz: 'Xiva: 3 kunda shahar-muzey', en: '' } },
    'navruz-2027': { status: 'draft', next: { date: '2027-03-19', sold: 9, capacity: 16 }, title: { ru: 'Навруз 2027 в Самарканде', uz: '', en: '' }, description: { ru: '19–23 марта. Народные гуляния на Регистане, сумаляк, мастер-класс плова и ночная экскурсия по подсвеченным медресе.', uz: '', en: '' }, price: 590, duration_days: 5, photos: 5, updated_by: 'Севара Н.' },
    'bukhara-nurata-yurts': { status: 'hidden', next: { date: '2027-05-14', sold: 4, capacity: 12 }, title: { ru: 'Ночь в юрте у Айдаркуля', uz: 'Aydarkoʻl boʻyida oʻtovda tun', en: 'A night in a yurt by Aydarkul' } },
  };
  const base = fx.tours.map((t, i) => ({
    slug: t.slug, title: { ru: t.title, uz: i % 3 === 0 ? '' : `${t.title} (UZ)`, en: i % 4 === 0 ? '' : `${t.title} (EN)` },
    description: { ru: `${t.region}. ${t.duration_days} дн.`, uz: '', en: '' },
    type: t.type, destination: dest(t.destinations[0]!), duration_days: t.duration_days, group_max: t.group_max, price: t.price_from, child_pct: 50,
    next: t.next_departure ? { date: t.next_departure, sold: Math.max(0, t.group_max - (t.seats_left ?? 6)), capacity: t.group_max } : null,
    status: 'published' as const, tone: t.image.tone, photos: 6, program_days: t.duration_days, updated_at: '2027-04-14T09:10:00', updated_by: 'Севара Н.',
    ...custom[t.slug],
  }));
  // «Навруз 2027» — тур из макета 6.7 (на сайте он показан праздничным баннером, в каталоге сайта его нет).
  if (!base.some((t) => t.slug === 'navruz-2027')) base.push({ slug: 'navruz-2027', type: 'group', destination: 'Самарканд', group_max: 16, child_pct: 50, tone: 'sunset', program_days: 5, updated_at: '2027-04-14T09:10:00', ...custom['navruz-2027'] } as CatalogTour);
  return base;
}

export const departures: Departure[] = [
  { id: 'd-nav-1', tour_slug: 'navruz-2027', from: '2027-03-19', to: '2027-03-23', vehicle_id: 'v1', guide_id: 'g1', sold: 7, capacity: 16, base: 590, dynamic: 626, conflict: null },
  { id: 'd-nav-2', tour_slug: 'navruz-2027', from: '2027-03-26', to: '2027-03-30', vehicle_id: 'v1', guide_id: 'g1', sold: 0, capacity: 16, base: 590, dynamic: null, conflict: 'Гид занят: Бухара 25–28 марта' },
  { id: 'DEP-0512', tour_slug: 'samarkand-bukhara-5d', from: '2027-05-12', to: '2027-05-16', vehicle_id: 'v1', guide_id: 'g1', sold: 15, capacity: 18, base: 640, dynamic: 691, conflict: null },
];

function layoutCells(): SeatCell[][] {
  const L = (label: string, kind: SeatCell['kind'] = 'seat'): SeatCell => ({ kind, label, surcharge: 0, online: kind !== 'blocked' });
  const A: SeatCell = { kind: 'aisle' };
  return [
    [L('1A'), L('1B'), A, { kind: 'empty' }, L('1D')],
    [L('2A'), L('2B'), A, { kind: 'empty' }, L('2D')],
    [L('3A'), L('3B'), A, { kind: 'empty' }, L('3D')],
    [L('4A', 'child'), L('4B'), A, { kind: 'empty' }, L('4D')],
    [L('5A'), L('5B'), A, { kind: 'empty' }, L('5D', 'blocked')],
    [L('6A'), L('6B'), L('6C'), { kind: 'empty' }, L('6D')],
  ];
}
export const layouts: VehicleLayout[] = [
  { id: 'v1', name: 'Mercedes Sprinter 18', plate: '01 A 123 BC', rows: 6, cols: 5, cells: layoutCells(), used_in: 6 },
  { id: 'v2', name: 'Hyundai County', plate: '01 A 777 AA', rows: 6, cols: 5, cells: layoutCells(), used_in: 4 },
];

export const resources: Resource[] = [
  { id: 'g1', name: 'Фарход М.', meta: 'RU · EN', kind: 'guide' },
  { id: 'g2', name: 'Рустам Х.', meta: 'RU · UZ', kind: 'guide' },
  { id: 'g3', name: 'Дильноза С.', meta: 'EN · FR', kind: 'guide' },
  { id: 'g4', name: 'Бобур Т.', meta: 'RU', kind: 'guide' },
  { id: 'g5', name: 'Камила Ю.', meta: 'RU · EN · DE', kind: 'guide' },
  { id: 'v1', name: 'Mercedes Sprinter 18', meta: '01 A 123 BC · 18 мест', kind: 'vehicle' },
  { id: 'v2', name: 'Hyundai County', meta: '01 A 777 AA · 25 мест', kind: 'vehicle' },
  { id: 'v3', name: 'Toyota Hiace', meta: '01 B 555 CC · 12 мест', kind: 'vehicle' },
];
export const assignments: Assignment[] = [
  { id: 'a1', resource_id: 'g1', title: 'Бухара: ремёсла', from: '2027-03-25', to: '2027-03-28', state: 'assigned' },
  { id: 'a2', resource_id: 'g1', title: 'Навруз 2027', from: '2027-03-26', to: '2027-03-29', state: 'conflict', departure_id: 'd-nav-2' },
  { id: 'a3', resource_id: 'g2', title: 'Хива: город-музей', from: '2027-03-24', to: '2027-03-26', state: 'assigned' },
  { id: 'a4', resource_id: 'g2', title: 'Хива: город-музей', from: '2027-03-28', to: '2027-03-30', state: 'assigned' },
  { id: 'a5', resource_id: 'g3', title: 'Индивид.: Самарканд', from: '2027-03-27', to: '2027-03-27', state: 'pending' },
  { id: 'a6', resource_id: 'g5', title: 'Чимган', from: '2027-03-24', to: '2027-03-25', state: 'assigned' },
  { id: 'a7', resource_id: 'g5', title: 'Чимган', from: '2027-03-29', to: '2027-03-30', state: 'assigned' },
  { id: 'a8', resource_id: 'v1', title: 'Бухара: ремёсла', from: '2027-03-25', to: '2027-03-28', state: 'assigned' },
  { id: 'a9', resource_id: 'v2', title: 'Хива: город-музей', from: '2027-03-24', to: '2027-03-26', state: 'assigned' },
  { id: 'a10', resource_id: 'v3', title: 'Чимган', from: '2027-03-24', to: '2027-03-25', state: 'assigned' },
];

export const manifestRows: ManifestRow[] = [
  { seat: '1A', name: 'ABDULLAEV RUSTAM', age: 42, child: false, child_seat: false, citizenship: 'Узбекистан', contact: '+998 90 111 22 33', notes: null, order: 'ST-2027-04790' },
  { seat: '2A', name: 'AZIZOV AZIZ', age: 33, child: false, child_seat: false, citizenship: 'Узбекистан', contact: '+998 90 123 45 67', notes: 'Вегетарианское меню', order: 'ST-2027-04812' },
  { seat: '2B', name: 'AZIZOVA MALIKA', age: 30, child: false, child_seat: false, citizenship: 'Узбекистан', contact: null, notes: null, order: 'ST-2027-04812' },
  { seat: '4A', name: 'AZIZOV TIMUR', age: 7, child: true, child_seat: true, citizenship: 'Узбекистан', contact: null, notes: 'Детское кресло', order: 'ST-2027-04812' },
  { seat: '5A', name: 'SMITH JAMES', age: 51, child: false, child_seat: false, citizenship: 'UK', contact: '+44 7700 900123', notes: 'Поздний прилёт, ждать до 07:50', order: 'ST-2027-04903' },
  { seat: '5B', name: 'SMITH EMMA', age: 12, child: true, child_seat: true, citizenship: 'UK', contact: null, notes: 'Детское кресло', order: 'ST-2027-04903' },
];

export const promos: Promo[] = [
  { code: 'SPRING10', kind: 'percent', value: 10, used: 412, limit: 1000, until: '2027-05-31', restriction: 'мин. $300 · 1 на клиента', status: 'active' },
  { code: 'NAVRUZ27', kind: 'amount', value: 50, used: 88, limit: 200, until: '2027-03-21', restriction: 'только «Навруз 2027»', status: 'active' },
  { code: 'FRIEND-*', kind: 'points', value: 500, used: 0, limit: null, until: null, restriction: 'рефералы, авто', status: 'system' },
  { code: 'BLACK26', kind: 'percent', value: 15, used: 1000, limit: 1000, until: '2026-11-30', restriction: '—', status: 'finished' },
];
export const rules: Rules = {
  pricing: [
    { id: 'occ80', label: 'Заполняемость ≥ 80%', delta_pct: 8, enabled: true },
    { id: 'occ60', label: 'Заполняемость ≥ 60%', delta_pct: 4, enabled: true },
    { id: 'last7', label: 'До выезда ≤ 7 дней и мест ≥ 50%', delta_pct: -10, enabled: true },
    { id: 'early90', label: 'До выезда ≥ 90 дней (ранняя бронь)', delta_pct: -5, enabled: false },
  ],
  clamp: [-20, 25],
  penalty: { per_day_pct: fx.settings.installment_penalty_percent, max_pct: 10, block_days: fx.settings.installment_block_days, reminder_days: fx.settings.installment_reminder_days },
  loyalty: { rate: 100, referral: fx.settings.referral_bonus_points, cashback_pct: 1, max_pct: fx.settings.bonus_cap_percent, ttl_months: 12 },
};
export const reviews: ReviewItem[] = [
  { id: 'r1', author: 'Азиз К.', tour: 'Хива: город-музей', date: '2027-04-05', rating: 4, text: 'Ичан-Кала на закате — невероятно. Гид Рустам отвечал на все вопросы. Минус — жаркий микроавтобус в первый день.', spam: null, status: 'pending' },
  { id: 'r2', author: 'Пользователь #4471', tour: 'Самарканд за 2 дня', date: '2027-05-02', rating: 1, text: 'ПЕРЕХОДИТЕ НА САЙТ cheap-tours… ДЕШЕВЛЕ!!!', spam: 'Ссылка и капс — похоже на спам', status: 'pending' },
  { id: 'r3', author: 'Ольга К.', tour: 'Бухара: ночь в караван-сарае', date: '2027-04-02', rating: 5, text: 'Ночь в караван-сарае — лучшая часть поездки.', spam: null, status: 'pending' },
  { id: 'r4', author: 'Marco R.', tour: 'Классика Узбекистана', date: '2027-03-30', rating: 5, text: 'Great organisation, small group, friendly guide.', spam: null, status: 'pending' },
  { id: 'r5', author: 'Нодира А.', tour: 'Хива: город-музей', date: '2027-04-06', rating: 5, text: 'Всё понравилось, спасибо!', spam: null, status: 'pending' },
];
export const fraud: FraudCase[] = [
  { id: 'f1', level: 'high', score: 92, title: 'Платёж PAY-9C12 · заказ ST-2027-05140', amount: 2380, signals: '3 карты за 10 минут с одного устройства · страна карты ≠ IP · новая учётная запись', kind: 'payment', status: 'open' },
  { id: 'f2', level: 'medium', score: 64, title: 'Регистрации: 14 аккаунтов за час', amount: null, signals: 'Один IP 185.22.x.x · реферальный код AZIZ-K24 у всех · похожие email', kind: 'signup', status: 'open' },
];
export const audit: AuditEntry[] = [
  { id: 'au1', at: '2027-04-14T09:12:04', actor: 'Система', actor_role: 'system', action: 'penalty.accrued', object: 'ST-2027-04990', details: '+$2.10, проводка L-88213', ip: null },
  { id: 'au2', at: '2027-04-14T08:55:31', actor: 'Камила Ю.', actor_role: 'manager', action: 'order.status_changed', object: 'ST-2027-05098', details: 'paid → confirmed', ip: '10.0.4.12' },
  { id: 'au3', at: '2027-04-14T08:41:10', actor: 'Дилшод Р.', actor_role: 'admin', action: 'pii.viewed', object: 'Манифест 12 мая', details: 'Просмотр паспортных данных', ip: '10.0.4.7' },
  { id: 'au4', at: '2027-04-14T08:30:02', actor: 'Система', actor_role: 'system', action: 'refund.created', object: 'ST-2027-04771', details: '$1 040, провайдер mock-pay', ip: null },
  { id: 'au5', at: '2027-04-14T08:12:47', actor: 'Севара Н.', actor_role: 'content', action: 'tour.updated', object: 'Навруз 2027', details: 'Описание RU, 118 симв.', ip: '10.0.4.21' },
  { id: 'au6', at: '2027-04-14T07:58:19', actor: 'Антифрод', actor_role: 'antifraud', action: 'payment.flagged', object: 'PAY-9C12', details: 'risk 92 → ручная проверка', ip: null },
];
export const ledger: LedgerEntry[] = [
  { id: 'L-88214', at: '2027-04-14T09:12:00', order: 'ST-2027-04990', debit: 'Расчёты с клиентами', credit: 'Доход от пеней', amount: 2.1 },
  { id: 'L-88190', at: '2027-04-13T18:40:00', order: 'ST-2027-04771', debit: 'Возвраты', credit: 'Денежные поступления', amount: 1040 },
  { id: 'L-88190-S', at: '2027-04-13T18:41:00', order: 'ST-2027-04771', debit: 'Денежные поступления', credit: 'Возвраты', amount: -1040, storno_of: 'L-88190' },
  { id: 'L-88102', at: '2027-03-10T14:09:00', order: 'ST-2027-04812', debit: 'Денежные поступления', credit: 'Расчёты с клиентами', amount: 527 },
  { id: 'L-88103', at: '2027-03-10T14:09:00', order: 'ST-2027-04812', debit: 'Скидки по промокодам', credit: 'Расчёты с клиентами', amount: 160 },
  { id: 'L-88104', at: '2027-03-10T14:09:00', order: 'ST-2027-04812', debit: 'Бонусные обязательства', credit: 'Расчёты с клиентами', amount: 12 },
];
export const customers: Customer[] = [
  { id: 'c1', name: 'Азиз Каримов', email: 'aziz@example.com', phone: '+998 90 123 45 67', orders: 6, paid: 4210, points: 1200, flag: null, since: '2024-01-12', lang: 'ru', telegram: true, referral: { code: 'AZIZ-K24', friends: 3 }, consent_at: '2024-01-12' },
  { id: 'c2', name: 'Малика Юсупова', email: 'malika@mail.uz', phone: '+998 90 555 12 34', orders: 2, paid: 1680, points: 500, flag: 'overdue', since: '2025-06-02', lang: 'uz', telegram: true, referral: null, consent_at: '2025-06-02' },
  { id: 'c3', name: 'James Smith', email: 'j.smith@mail.co.uk', phone: '+44 7700 900123', orders: 1, paid: 380, points: 0, flag: null, since: '2027-03-01', lang: 'en', telegram: false, referral: null, consent_at: '2027-03-01' },
  { id: 'c4', name: null, email: 'user4471@temp-mail.io', phone: '—', orders: 0, paid: 0, points: 0, flag: 'fraud', since: '2027-04-14', lang: 'ru', telegram: false, referral: null, consent_at: '2027-04-14' },
];
export const paymentEvents: PaymentEvent[] = [
  { id: 'e1', at: '2027-04-14T09:14:22', type: 'payment.succeeded', payment: 'PAY-7F3A21', order: 'ST-2027-04812', amount: 527, result: 'duplicate', note: 'повтор того же event_id' },
  { id: 'e2', at: '2027-04-14T09:14:20', type: 'payment.succeeded', payment: 'PAY-7F3A21', order: 'ST-2027-04812', amount: 527, result: 'ok', note: 'заказ → partially_paid' },
  { id: 'e3', at: '2027-04-14T08:30:02', type: 'refund.succeeded', payment: 'RF-1102', order: 'ST-2027-04771', amount: 1040, result: 'ok', note: 'проводка L-88190' },
  { id: 'e4', at: '2027-04-14T07:58:19', type: 'payment.failed', payment: 'PAY-9C12', order: 'ST-2027-05140', amount: 2380, result: 'error', note: 'card_declined (51)' },
  { id: 'e5', at: '2027-04-14T07:58:10', type: 'payment.created', payment: 'PAY-9C12', order: 'ST-2027-05140', amount: 2380, result: 'pending', note: 'ожидаем вебхук' },
];
export const outbox: OutboxItem[] = [
  { id: 'ob1', event: 'order.paid', aggregate: 'ST-2027-04812', handler: 'voucher.generate', attempts: 1, status: 'ok', error: null },
  { id: 'ob2', event: 'waitlist.offer', aggregate: 'WL-2210', handler: 'telegram.send', attempts: 3, status: 'pending', error: '429 Too Many Requests, retry 30s' },
  { id: 'ob3', event: 'order.cancelled', aggregate: 'ST-2027-04771', handler: 'email.send', attempts: 5, status: 'dead', error: 'SMTP timeout ×5' },
  { id: 'ob4', event: 'seat.released', aggregate: 'DEP-0512', handler: 'waitlist.notify', attempts: 5, status: 'dead', error: 'Template UZ not found' },
];
export const systemSettings: SystemSettings = {
  hold_minutes: fx.settings.hold_minutes, cancellation_deadline_days: fx.settings.cancellation_deadline_days, refund_days: fx.settings.refund_days, waitlist_window_hours: fx.settings.waitlist_window_hours,
  currency: 'USD', languages: ['ru', 'uz', 'en'], provider: 'mock-pay', require_2fa: true, telegram_alerts: true,
};
const tpl = (subject: string, text: string) => ({ subject, text });
const emptyLang = { ru: tpl('', ''), uz: tpl('', ''), en: tpl('', '') };
export const templates: Template[] = [
  { id: 't1', key: 'order_confirmed', warn: false, body: {
    email: { ru: tpl('Ваш тур подтверждён — {{tour.title}}', 'Здравствуйте, {{customer.first_name}}! Бронь {{order.number}} подтверждена. Сбор {{departure.meeting_time}}, {{departure.meeting_point}}. Ваучер во вложении.'), uz: tpl('Turingiz tasdiqlandi — {{tour.title}}', 'Assalomu alaykum, {{customer.first_name}}! {{order.number}} bron tasdiqlandi. Yigʻilish {{departure.meeting_time}}, {{departure.meeting_point}}. Vaucher ilovada.'), en: tpl('Your tour is confirmed — {{tour.title}}', 'Hello {{customer.first_name}}! Booking {{order.number}} is confirmed. Meeting at {{departure.meeting_time}}, {{departure.meeting_point}}. Voucher attached.') },
    telegram: { ru: tpl('', 'Бронь {{order.number}} подтверждена ✅ Ваучер: {{voucher.url}}'), uz: tpl('', '{{order.number}} bron tasdiqlandi ✅ Vaucher: {{voucher.url}}'), en: tpl('', 'Booking {{order.number}} confirmed ✅ Voucher: {{voucher.url}}') } } },
  { id: 't2', key: 'departure_reminder', warn: false, body: { email: { ...emptyLang, ru: tpl('Скоро выезд — {{tour.title}}', 'Напоминаем: выезд {{departure.date}}, сбор {{departure.meeting_time}}.') }, telegram: emptyLang } },
  { id: 't3', key: 'payment_reminder', warn: false, body: { email: { ...emptyLang, ru: tpl('Напоминание о платеже', 'Следующий взнос по заказу {{order.number}} — {{installment.date}}.') }, telegram: emptyLang } },
  { id: 't4', key: 'payment_overdue', warn: false, body: { email: { ...emptyLang, ru: tpl('Платёж просрочен', 'Взнос по заказу {{order.number}} просрочен. Начисляется пеня.') }, telegram: emptyLang } },
  { id: 't5', key: 'seat_released', warn: true, body: { email: { ...emptyLang, ru: tpl('Место освободилось', 'На {{tour.title}} освободилось место — забронируйте до {{offer.expires_at}}.') }, telegram: emptyLang } },
  { id: 't6', key: 'order_cancelled', warn: false, body: { email: { ...emptyLang, ru: tpl('Заказ отменён', 'Заказ {{order.number}} отменён. Возврат придёт в течение {{refund.days}} дней.') }, telegram: emptyLang } },
  { id: 't7', key: 'password_reset', warn: false, body: { email: { ...emptyLang, ru: tpl('Сброс пароля', 'Ссылка для сброса: {{reset.url}}') }, telegram: emptyLang } },
];
export const reportJobs: ReportJob[] = [
  { id: 'rp1', kind: 'revenue', period: '1–30 апр 2027', format: 'xlsx', status: 'ready' },
  { id: 'rp2', kind: 'ledger', period: 'Q1 2027', format: 'csv', status: 'running' },
];

export const notifications: AdminNotification[] = [
  { id: 'n1', kind: 'individual_request', at: '2027-04-14T09:05:00', perm: 'orders', href: '/orders?segment=awaiting', params: { number: 'ST-2027-05117', tour: 'Индивидуальный: Самарканд' }, read_by: [] },
  { id: 'n2', kind: 'fraud', at: '2027-04-14T08:47:00', perm: 'security', href: '/security/fraud', params: { number: 'ST-2027-05131' }, read_by: [] },
  { id: 'n3', kind: 'manual_refund', at: '2027-04-14T07:30:00', perm: 'refunds', href: '/orders?segment=refunds', params: { number: 'ST-2027-04771', amount: 520 }, read_by: [] },
  { id: 'n4', kind: 'overdue', at: '2027-04-13T18:02:00', perm: 'orders', href: '/orders?segment=overdue', params: { number: 'ST-2027-04990', days: 3 }, read_by: [] },
  { id: 'n5', kind: 'review_pending', at: '2027-04-13T12:20:00', perm: 'marketing', href: '/marketing/reviews', params: { count: 5 }, read_by: [] },
  { id: 'n6', kind: 'webhook_failed', at: '2027-04-12T22:41:00', perm: 'system', href: '/payments', params: { provider: 'Payme' }, read_by: ['s1', 's2', 's3'] },
];
