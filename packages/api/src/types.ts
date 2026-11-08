/** Контракты /v1/ (моки до готовности бэкенда). Суммы — числа в USD; сроки и пороги приходят из настроек. */
export type ImageTone = 'sky' | 'sand' | 'sunset' | 'mountain' | 'night';
export interface ApiImage { src?: string; alt?: string; tone: ImageTone }

export interface Settings {
  cancellation_deadline_days: number | null; // null → блок «Бесплатная отмена до …» не показывается
  refund_days: number;
  hold_minutes: number;
  waitlist_window_hours: number;
  installments_count: number;
  bonus_cap_percent: number;
  manager_response_hours: number;
  installment_penalty_percent: number; installment_reminder_days: number; installment_block_days: number;
  referral_bonus_points: number;
  referral_bonus_usd: number;
}

export type TagKind = 'hit' | 'discount' | 'new' | 'individual' | 'group';
export interface Tour {
  slug: string; title: string; region: string; destinations: string[]; type: 'group' | 'individual'; season: 'spring' | 'summer' | 'navruz' | 'may' | 'autumn';
  duration_days: number; group_max: number; next_departure: string | null; // ISO date
  rating: number; reviews_count: number;
  price_from: number; old_price?: number; seats_left?: number;
  tags: TagKind[]; discount_percent?: number; image: ApiImage;
}
export interface Destination { slug: string; name: string; tours_count: number; price_from: number; image: ApiImage }
export interface Review { id: string; author: string; tour_title: string; date: string; rating: number; text: string; verified: boolean }
export interface HomeStats { travellers: number; tours: number; destinations: number; rating: number; reviews: number }
export interface Holiday { slug: string; title: string; description: string; departure: string; days: number; group_max: number; price_from: number; installments: number; image: ApiImage }

export type DurationBucket = '1-3' | '4-7' | '8+';
export type TourSort = 'popular' | 'price_asc' | 'price_desc' | 'date';
export interface TourQuery {
  destination?: string;            // slug или список через запятую
  price_min?: number; price_max?: number; date_from?: string; date_to?: string;
  duration?: DurationBucket; type?: Tour['type']; available?: boolean; season?: Tour['season'];
  q?: string; sort?: TourSort; page?: number; per_page?: number;
}
export interface ToursPage { items: Tour[]; total: number; page: number; page_count: number }
export const PRICE_BOUNDS = { min: 50, max: 3000 } as const;

export interface Departure { id: string; from: string; to: string; seats_left: number; capacity: number; price: number; old_price?: number; price_may_rise?: boolean }
export interface DayPlan { title: string; body?: string; badges?: { icon: 'car' | 'ticket' | 'map-pin'; label: string }[] }
export interface ReviewsSummary { rating: number; count: number; distribution: [number, number, number, number, number] } // доли 5★…1★, %
export interface TourDetail extends Tour {
  description: string; highlights: string[]; days: DayPlan[]; included: string[]; excluded: string[];
  departures: Departure[]; stops: string[]; photos_count: number; languages: string[]; nights: number;
  child_discount_percent: number; reviews_summary: ReviewsSummary; reviews: Review[]; waitlist_queue: number;
  individual?: { min_group: number; price_from: number };
}
export interface QuoteLine { kind: 'adults' | 'children'; count: number; unit_price: number; amount: number }
/** Сумма фиксируется бэкендом; фронт её только показывает (правило №5). */
export interface Quote { lines: QuoteLine[]; total: number }
export interface QuoteRequest { tour: string; departure: string; adults: number; children: number }

export interface DestinationFact { short: string; text: string }
export interface DestinationDetail extends Destination {
  tagline: string; area: string; rating: number; reviews_count: number;
  facts: { visa: DestinationFact; season: DestinationFact; currency: DestinationFact; time: DestinationFact };
  about: string[]; sights: { title: string; text: string; tone: ImageTone }[];
}

export interface Place { id: string; title: string; subtitle: string }
export type CarClass = 'sedan' | 'minivan' | 'microbus';
export interface CarOption { id: CarClass; max_passengers: number; price_per_km: number }
export interface TransferOptions { classes: CarOption[]; base_fare: number; hourly_rate: number; child_seat_price: number; max_stops: number; free_wait_minutes: number; time_slots: string[] }
export interface TransferQuoteRequest { points: string[]; date: string; time: string; passengers: number; car: CarClass; child_seat: boolean; optimize: boolean }
export interface TransferSegment { from: string; to: string; km: number; amount: number }
export type TransferLine = { kind: 'base' | 'segment' | 'time' | 'child_seat'; label?: string; km?: number; hours_label?: string; amount: number; segment?: number }
export interface TransferQuote { order: number[]; saved_km: number; total_km: number; drive_minutes: number; segments: TransferSegment[]; lines: TransferLine[]; total: number }

export type AddonCategory = 'insurance' | 'guides' | 'excursions' | 'kids';
export type AddonUnit = 'person' | 'group' | 'trip';
export interface Addon { id: string; category: AddonCategory; icon: 'shield' | 'user' | 'map-pin' | 'baby' | 'eye' | 'ticket'; title: string; text: string; price: number; unit: AddonUnit; in_order: boolean }
export interface AddonsSummary { count: number; per_person: number; per_group: number; per_trip: number; order_number: string | null }
export interface WaitlistOffer { id: string; tour: { slug: string; title: string; image: ApiImage; region: string }; from: string; to: string; seats: number; unit_price: number; total: number; expires_at: string; was_first: boolean; departure: string }
