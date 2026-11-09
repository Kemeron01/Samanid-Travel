/** Контракты админки (`/v1/admin/*`). Моки — в ./index.ts. */
export type Role = 'content' | 'manager' | 'admin';
export type Perm = 'catalog' | 'orders' | 'refunds' | 'resources' | 'pii' | 'marketing' | 'security' | 'system';
export type Level = 'none' | 'read' | 'full';
export type Matrix = Record<Perm, Record<Role, Level>>;
export interface Staff { id: string; name: string; short: string; email: string; role: Role; twofa: boolean }
export interface AdminSession { token: string; staff: Staff; perms: Record<Perm, Level>; trusted_until: string | null }

export type AdminOrderStatus = 'draft' | 'pending_payment' | 'awaiting_manager_confirmation' | 'partially_paid' | 'paid' | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'expired';
export type PaymentNote = { kind: 'installment'; paid: number; total: number } | { kind: 'overdue'; days: number } | { kind: 'full' } | { kind: 'awaiting' } | { kind: 'refund'; date: string } | { kind: 'hold_expired' } | { kind: 'none' };
export interface AdminOrderRow { id: string; number: string; customer: string; tour: string; tour_slug: string; departure: string; individual: boolean; pax: number; total: number; payment: PaymentNote; status: AdminOrderStatus; flags: ('overdue' | 'manual_refund' | 'fraud')[] }
export interface AuditEntry { id: string; at: string; actor: string; actor_role?: Role | 'system' | 'webhook' | 'antifraud'; action: string; object: string; object_href?: string; details: string; ip: string | null }
export interface AdminOrderDetail extends AdminOrderRow { email: string; phone: string; seats: string[]; adults: number; children: number; guide: string | null; vehicle: string | null; paid: number; allowed_transitions: AdminOrderStatus[]; risk: { title: string; text: string } | null; history: AuditEntry[]; refundable: number }
export interface OrdersQuery { segment?: 'all' | 'awaiting' | 'refunds' | 'overdue' | 'fraud'; status?: AdminOrderStatus | 'all'; tour?: string; type?: 'all' | 'group' | 'individual'; from?: string; to?: string; q?: string; page?: number; per_page?: number }
export interface OrdersPage { items: AdminOrderRow[]; total: number; page: number; pages: number; counts: Record<'all' | 'awaiting' | 'refunds' | 'overdue' | 'fraud', number> }

export type Period = '7d' | '30d' | 'quarter' | 'year';
export interface Dashboard {
  from: string; to: string;
  kpi: { revenue: number; revenue_delta_pct: number; paid_orders: number; paid_delta: number; occupancy_pct: number; occupancy_delta_pp: number; avg_check: number; avg_delta: number };
  revenue_by_day: { date: string; amount: number; orders: number }[];
  top_destinations: { name: string; amount: number }[];
  funnel: { key: 'views' | 'started' | 'held' | 'paid'; value: number }[];
  attention: { individual: number; manual_refunds: number; overdue: number; fraud: number; webhook_failures: number };
}

export type TourStatus = 'published' | 'draft' | 'hidden';
export interface CatalogTour { slug: string; title: Record<'ru' | 'uz' | 'en', string>; description: Record<'ru' | 'uz' | 'en', string>; type: 'group' | 'individual'; destination: string; duration_days: number; group_max: number; price: number; child_pct: number; next: { date: string; sold: number; capacity: number } | null; status: TourStatus; tone: 'sky' | 'sand' | 'sunset' | 'mountain' | 'night'; photos: number; program_days: number; updated_at: string; updated_by: string }
export interface Departure { id: string; tour_slug: string; from: string; to: string; vehicle_id: string; guide_id: string | null; sold: number; capacity: number; base: number; dynamic: number | null; conflict: string | null }
export type SeatKind = 'seat' | 'child' | 'blocked' | 'aisle' | 'driver' | 'empty';
export interface SeatCell { kind: SeatKind; label?: string; surcharge?: number; online?: boolean }
export interface VehicleLayout { id: string; name: string; plate: string; rows: number; cols: number; cells: SeatCell[][]; used_in: number }

export interface Resource { id: string; name: string; meta: string; kind: 'guide' | 'vehicle' }
export interface Assignment { id: string; resource_id: string; title: string; from: string; to: string; state: 'assigned' | 'pending' | 'conflict'; departure_id?: string }
export interface ResourceWeek { from: string; to: string; resources: Resource[]; assignments: Assignment[]; conflicts: { resource: string; a: string; a_range: string; b: string; b_range: string }[] }

export interface ManifestRow { seat: string; name: string; age: number; child: boolean; child_seat: boolean; citizenship: string; contact: string | null; notes: string | null; order: string }
export interface ManifestSummary { departure_id: string; tour: string; date: string; sold: number; capacity: number }
export interface Manifest { pax_total: number; departure_id: string; tour: string; date: string; vehicle: string; plate: string; guide: string; meeting_time: string; meeting_place: string; capacity: number; rows: ManifestRow[]; unpaid: number; link_until: string; link_token: string }

export interface Promo { code: string; kind: 'percent' | 'amount' | 'points'; value: number; used: number; limit: number | null; until: string | null; restriction: string; status: 'active' | 'system' | 'finished' }
export interface PricingRule { id: string; label: string; delta_pct: number; enabled: boolean }
export interface Rules { pricing: PricingRule[]; clamp: [number, number]; penalty: { per_day_pct: number; max_pct: number; block_days: number; reminder_days: number }; loyalty: { rate: number; referral: number; cashback_pct: number; max_pct: number; ttl_months: number } }
export interface ReviewItem { id: string; author: string; tour: string; date: string; rating: number; text: string; spam: string | null; status: 'pending' | 'published' | 'rejected'; reply?: string }
export interface FraudCase { id: string; level: 'high' | 'medium'; score: number; title: string; amount: number | null; signals: string; kind: 'payment' | 'signup'; status: 'open' | 'approved' | 'rejected' | 'cleared' | 'blocked' }
export interface LedgerEntry { id: string; at: string; order: string; debit: string; credit: string; amount: number; storno_of?: string }
export interface LedgerSummary { cash: number; receivables: number; revenue: number; bonus: number; refunds: number; balanced: boolean; total: number; reconciled_at: string }
export interface Customer { id: string; name: string | null; email: string; phone: string; orders: number; paid: number; points: number; flag: 'overdue' | 'fraud' | null; since: string; lang: 'ru' | 'uz' | 'en'; telegram: boolean; referral: { code: string; friends: number } | null; consent_at: string | null }
export interface PaymentEvent { id: string; at: string; type: string; payment: string; order: string; amount: number; result: 'duplicate' | 'ok' | 'error' | 'pending'; note: string }
export interface OutboxItem { id: string; event: string; aggregate: string; handler: string; attempts: number; status: 'ok' | 'pending' | 'dead'; error: string | null }
export interface SystemSettings { hold_minutes: number; cancellation_deadline_days: number | null; refund_days: number; waitlist_window_hours: number; currency: string; languages: string[]; provider: string; require_2fa: boolean; telegram_alerts: boolean }
export interface Template { id: string; key: string; warn: boolean; body: Record<'email' | 'telegram', Record<'ru' | 'uz' | 'en', { subject: string; text: string }>> }
export interface ReportJob { id: string; kind: string; period: string; format: 'csv' | 'xlsx'; status: 'ready' | 'running' }

/** Уведомления топбара: текст собирается на клиенте из kind + params (i18n), видимость — по праву perm. */
export type NotificationKind = 'individual_request' | 'manual_refund' | 'overdue' | 'fraud' | 'review_pending' | 'webhook_failed';
export interface AdminNotification { id: string; kind: NotificationKind; at: string; perm: Perm; href: string; params: Record<string, string | number>; read_by: string[] }
