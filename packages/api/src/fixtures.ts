import type { Addon, CarOption, Departure, Place, TransferOptions, Destination, DestinationDetail, Holiday, HomeStats, Review, Settings, Tour, TourDetail } from './types';

export const settings: Settings = {
  cancellation_deadline_days: 7, refund_days: 7, hold_minutes: 15, waitlist_window_hours: 2,
  installments_count: 3, manager_response_hours: 24, installment_penalty_percent: 0.5, installment_reminder_days: 3, installment_block_days: 7, bonus_cap_percent: 20, referral_bonus_points: 500, referral_bonus_usd: 5,
};

const t = (o: Partial<Tour> & Pick<Tour, 'slug' | 'title' | 'region' | 'season' | 'duration_days' | 'price_from' | 'destinations'>): Tour => ({
  group_max: 16, next_departure: '2027-05-12', rating: 4.9, reviews_count: 128, tags: [], type: 'group', image: { tone: 'sky' }, ...o,
});

export const tours: Tour[] = [
  t({ slug: 'samarkand-bukhara-5d', title: 'Самарканд и Бухара за 5 дней: шёлковый путь', region: 'Самарканд · Бухара', destinations: ['samarkand', 'bukhara'], season: 'spring', duration_days: 5, price_from: 640, old_price: 800, seats_left: 3, tags: ['hit', 'discount'], discount_percent: 20, reviews_count: 340, image: { tone: 'sky' } }),
  t({ slug: 'bukhara-caravanserai', title: 'Бухара: ночь в караван-сарае', region: 'Бухара', destinations: ['bukhara'], season: 'spring', duration_days: 2, price_from: 380, next_departure: '2027-05-14', reviews_count: 96, image: { tone: 'sand' } }),
  t({ slug: 'classic-uzbekistan-7d', title: 'Классика Узбекистана: 7 дней', region: 'Ташкент · Самарканд · Бухара', destinations: ['tashkent', 'samarkand', 'bukhara'], season: 'may', duration_days: 7, price_from: 980, old_price: 1200, seats_left: 3, tags: ['discount'], discount_percent: 18, next_departure: '2027-05-16', reviews_count: 210, image: { tone: 'sunset' } }),
  t({ slug: 'samarkand-afrosiyob-2d', title: 'Самарканд за 2 дня на Afrosiyob', region: 'Самарканд', destinations: ['samarkand'], season: 'spring', duration_days: 2, price_from: 290, seats_left: 0, next_departure: '2027-06-02', reviews_count: 88, image: { tone: 'night' } }),
  t({ slug: 'bukhara-nurata-yurts', title: 'Бухара и Нурата: юрты и звёзды', region: 'Бухара · Навои', destinations: ['bukhara', 'nurata'], season: 'summer', duration_days: 3, price_from: 540, old_price: 680, seats_left: 3, tags: ['new'], next_departure: '2027-06-10', reviews_count: 64, image: { tone: 'sand' } }),
  t({ slug: 'samarkand-private', title: 'Индивидуальный тур: Самарканд на ваших датах', region: 'Самарканд', destinations: ['samarkand'], type: 'individual', season: 'spring', duration_days: 5, price_from: 720, next_departure: '2027-05-12', tags: ['individual'], reviews_count: 51, image: { tone: 'mountain' } }),
  t({ slug: 'bukhara-silk-ceramics', title: 'Шёлк и керамика: ремёсла Бухары', region: 'Бухара', destinations: ['bukhara'], season: 'autumn', duration_days: 4, price_from: 450, old_price: 560, seats_left: 3, tags: ['hit', 'discount'], discount_percent: 20, next_departure: '2027-09-12', reviews_count: 73, image: { tone: 'sky' } }),
  t({ slug: 'great-silk-road-10d', title: 'Великий шёлковый путь: 10 дней', region: '5 городов', destinations: ['tashkent', 'samarkand', 'bukhara', 'khiva'], season: 'autumn', duration_days: 10, price_from: 1190, next_departure: '2027-09-20', reviews_count: 180, image: { tone: 'sunset' } }),
  t({ slug: 'samarkand-gastro', title: 'Самарканд гастрономический', region: 'Самарканд', destinations: ['samarkand'], season: 'navruz', duration_days: 3, price_from: 410, old_price: 500, seats_left: 3, next_departure: '2027-03-19', reviews_count: 59, image: { tone: 'sand' } }),
  t({ slug: 'khiva-open-air-4d', title: 'Хива: город-музей под открытым небом', region: 'Хива', destinations: ['khiva'], season: 'spring', duration_days: 4, price_from: 420, seats_left: 5, tags: ['new'], next_departure: '2027-05-20', rating: 4.8, reviews_count: 76, image: { tone: 'sand' } }),
  t({ slug: 'tashkent-chimgan-2d', title: 'Ташкент и Чимган: город и горы за выходные', region: 'Ташкент · Чимган', destinations: ['tashkent', 'chimgan'], season: 'spring', duration_days: 2, price_from: 180, next_departure: '2027-05-15', rating: 4.7, reviews_count: 54, image: { tone: 'mountain' } }),
  t({ slug: 'fergana-valley-3d', title: 'Ферганская долина: ремесло и сады', region: 'Фергана · Маргилан', destinations: ['tashkent'], season: 'spring', duration_days: 3, price_from: 310, seats_left: 2, next_departure: '2027-05-22', reviews_count: 41, image: { tone: 'sunset' } }),
  t({ slug: 'summer-nukus-aral-6d', title: 'Нукус и Арал: дорога к морю-призраку', region: 'Каракалпакстан', destinations: ['khiva'], season: 'summer', duration_days: 6, price_from: 760, next_departure: '2027-07-04', rating: 4.8, reviews_count: 33, image: { tone: 'night' } }),
];

export const destinations: Destination[] = [
  { slug: 'samarkand', name: 'Самарканд', tours_count: 14, price_from: 120, image: { tone: 'sky' } },
  { slug: 'bukhara', name: 'Бухара', tours_count: 11, price_from: 110, image: { tone: 'sand' } },
  { slug: 'khiva', name: 'Хива', tours_count: 6, price_from: 140, image: { tone: 'sunset' } },
  { slug: 'chimgan', name: 'Чимган и Чарвак', tours_count: 12, price_from: 90, image: { tone: 'mountain' } },
  { slug: 'tashkent', name: 'Ташкент', tours_count: 9, price_from: 60, image: { tone: 'sky' } },
  { slug: 'nurata', name: 'Нурата и Айдаркуль', tours_count: 4, price_from: 150, image: { tone: 'night' } },
];

export const reviews: Review[] = [
  { id: 'r1', author: 'Дильноза М.', tour_title: 'Самарканд и Бухара', date: '2026-05-10', rating: 5, text: 'Отличная организация: гид Фарход знал историю каждого медресе, трансфер ждал вовремя. Обязательно поедем ещё в Хиву!', verified: true },
  { id: 'r2', author: 'Артём К.', tour_title: 'Хива за 4 дня', date: '2026-04-18', rating: 5, text: 'Места в автобусе выбирали заранее — очень удобно. Ваучер пришёл в Telegram.', verified: true },
  { id: 'r3', author: 'Малика Р.', tour_title: 'Чимган за выходные', date: '2026-03-02', rating: 4, text: 'Хорошая программа и понятный график платежей. Рассрочка выручила.', verified: true },
];

export const homeStats: HomeStats = { travellers: 12000, tours: 48, destinations: 9, rating: 4.9, reviews: 2400 };

export const holiday: Holiday = {
  slug: 'navruz-2027', title: 'Навруз 2027 в Самарканде',
  description: '19–23 марта. Народные гуляния на Регистане, сумаляк, мастер-класс плова и ночная экскурсия по подсвеченным медресе.',
  departure: '2027-03-19', days: 5, group_max: 16, price_from: 590, installments: 3, image: { tone: 'sunset' },
};

const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export function buildDetail(tour: Tour): TourDetail {
  const rich = tour.slug === 'samarkand-bukhara-5d';
  const start = tour.next_departure ?? '2027-06-01';
  const deps: Departure[] = [
    { id: `${tour.slug}-1`, from: start, to: addDays(start, tour.duration_days - 1), seats_left: tour.seats_left ?? 9, capacity: tour.group_max, price: tour.price_from, old_price: tour.old_price, price_may_rise: (tour.seats_left ?? 99) <= 3 },
    { id: `${tour.slug}-2`, from: addDays(start, 7), to: addDays(start, 7 + tour.duration_days - 1), seats_left: 9, capacity: tour.group_max, price: tour.price_from - 40 },
    { id: `${tour.slug}-3`, from: addDays(start, 21), to: addDays(start, 21 + tour.duration_days - 1), seats_left: 0, capacity: tour.group_max, price: tour.price_from - 40 },
    { id: `${tour.slug}-4`, from: addDays(start, 35), to: addDays(start, 35 + tour.duration_days - 1), seats_left: 14, capacity: tour.group_max, price: tour.price_from - 80 },
  ];
  const days = rich ? [
    { title: 'Прилёт в Самарканд, Регистан вечером', body: 'Встреча в аэропорту Самарканда, трансфер в отель. После отдыха — ужин в чайхане и прогулка к Регистану: ансамбль из трёх медресе в вечерней подсветке.', badges: [{ icon: 'car' as const, label: 'Трансфер' }, { icon: 'ticket' as const, label: 'Ужин включён' }, { icon: 'map-pin' as const, label: 'Отель 4★' }] },
    { title: 'Шахи-Зинда, Биби-Ханым, мастер-класс плова' }, { title: 'Поезд в Бухару, Ляби-Хауз, ночь в медресе' },
    { title: 'Арк, Пои-Калян, ремесленные мастерские' }, { title: 'Свободное утро, трансфер в аэропорт' },
  ] : Array.from({ length: tour.duration_days }, (_, i) => ({ title: i === 0 ? 'Прилёт, трансфер и вечерняя прогулка' : i === tour.duration_days - 1 ? 'Свободное утро, трансфер в аэропорт' : `Экскурсионный день ${i}` }));
  return {
    ...tour,
    description: rich ? 'Пять дней по двум жемчужинам Великого шёлкового пути. Вы увидите Регистан на рассвете и в вечерней подсветке, пройдёте по улицам старой Бухары, попробуете плов в махалле и переночуете в бутик-отеле в здании медресе. Переезд Самарканд — Бухара — на скоростном поезде Afrosiyob.' : `${tour.title}. Небольшая группа, местный гид и продуманный маршрут без спешки.`,
    highlights: rich ? ['Регистан на рассвете и ночью', 'Ночь в отеле-медресе', 'Мастер-класс плова', 'Поезд Afrosiyob', 'Мастерская шёлковых ковров', 'Трансферы из аэропорта'] : ['Местный гид', 'Небольшая группа', 'Трансферы из аэропорта'],
    days, included: ['Проживание (отели 4★, медресе)', 'Завтраки и 2 ужина', 'Билеты на поезд Afrosiyob', 'Гид на всех экскурсиях', 'Входные билеты в музеи', 'Трансферы аэропорт — отель'],
    excluded: ['Авиаперелёт', 'Обеды', 'Страховка (можно добавить, $15)', 'Чаевые гиду и водителю'],
    departures: deps, stops: rich ? ['Самарканд', 'Навои (поезд)', 'Бухара'] : tour.region.split(' · '), photos_count: 24, languages: ['RU', 'EN', 'UZ'], nights: Math.max(tour.duration_days - 1, 1),
    child_discount_percent: 50, waitlist_queue: 4,
    reviews_summary: { rating: tour.rating, count: tour.reviews_count, distribution: [88, 9, 2, 1, 0] },
    reviews: reviews.slice(0, 2),
    individual: tour.type === 'individual' ? { min_group: 2, price_from: tour.price_from } : undefined,
  };
}

export function buildDestinationDetail(d: Destination): DestinationDetail {
  const samarkand = d.slug === 'samarkand';
  return {
    ...d,
    tagline: samarkand ? 'Город, которому 2 750 лет: Регистан, Шахи-Зинда и лучшая лепёшка Узбекистана' : `${d.name}: маршруты, отели и местная кухня`,
    area: samarkand ? 'Самаркандская область' : d.name, rating: 4.9, reviews_count: 860,
    facts: {
      visa: { short: 'Безвиз до 30 дней', text: 'Безвиз до 30 дней для граждан 90+ стран, e-visa для остальных' },
      season: { short: 'Апр–июн, сен–окт', text: 'Апрель–июнь и сентябрь–октябрь, +20…28 °C' },
      currency: { short: 'UZS · цены в USD', text: 'Узбекский сум (UZS). Цены на сайте — в USD' },
      time: { short: 'UTC+5', text: 'UTC+5, на 2 часа впереди Москвы' },
    },
    about: samarkand ? ['Самарканд — сердце Великого шёлкового пути и столица империи Тимура. Здесь стоит Регистан — площадь из трёх медресе с бирюзовыми куполами, некрополь Шахи-Зинда и обсерватория Улугбека.', 'Город легко совместить с Бухарой: скоростной поезд Afrosiyob идёт 1 ч 40 мин. Лучше всего приезжать весной и осенью — летом днём бывает до +40 °C.'] : [`${d.name} — одно из ключевых направлений Узбекистана.`],
    sights: samarkand ? [{ title: 'Регистан', text: 'Три медресе XV–XVII вв.', tone: 'sky' }, { title: 'Шахи-Зинда', text: 'Улица мавзолеев с майоликой', tone: 'sunset' }, { title: 'Сиабский базар', text: 'Лепёшки, сухофрукты, специи', tone: 'sand' }] : [{ title: 'Главная достопримечательность', text: d.name, tone: d.image.tone }],
  };
}

export const places: Place[] = [
  { id: 'tas', title: 'Аэропорт Ташкент (TAS)', subtitle: 'Ташкент, Узбекистан' },
  { id: 'uzb', title: 'Hotel Uzbekistan', subtitle: 'ул. Мусаханова 45, Ташкент' },
  { id: 'rail', title: 'Ж/д вокзал Ташкент', subtitle: 'Пр. Тараса Шевченко, Ташкент' },
  { id: 'reg', title: 'Регистан', subtitle: 'Самарканд, Узбекистан' },
  { id: 'charvak', title: 'Водохранилище Чарвак, смотровая', subtitle: 'Бостанлыкский район' },
  { id: 'cable', title: 'Канатная дорога Чимган', subtitle: 'Бостанлыкский район' },
];
export const transferOptions: TransferOptions = {
  classes: [{ id: 'sedan', max_passengers: 3, price_per_km: 0.3 }, { id: 'minivan', max_passengers: 7, price_per_km: 0.4 }, { id: 'microbus', max_passengers: 16, price_per_km: 0.7 }] satisfies CarOption[],
  base_fare: 20, hourly_rate: 6, child_seat_price: 10, max_stops: 5, free_wait_minutes: 30,
  time_slots: Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`),
};

export const addons: Addon[] = [
  { id: 'ins', category: 'insurance', icon: 'shield', title: 'Страховка путешественника', text: 'Медицина и несчастный случай, покрытие $30 000 на всю поездку', price: 15, unit: 'person', in_order: true },
  { id: 'guide', category: 'guides', icon: 'user', title: 'Частный гид на день', text: 'Гид на русском, английском или узбекском, 8 часов', price: 60, unit: 'group', in_order: false },
  { id: 'shahi', category: 'excursions', icon: 'map-pin', title: 'Экскурсия: Шахи-Зинда на рассвете', text: '2 часа, малая группа до 8 человек, входные билеты включены', price: 25, unit: 'person', in_order: true },
  { id: 'seat', category: 'kids', icon: 'baby', title: 'Детское кресло', text: 'Для детей 9–36 кг. Для туров и трансферов', price: 10, unit: 'trip', in_order: false },
  { id: 'photo', category: 'excursions', icon: 'eye', title: 'Фотосессия у Регистана', text: '1 час с фотографом, 30 обработанных фото', price: 80, unit: 'group', in_order: false },
  { id: 'plov', category: 'excursions', icon: 'ticket', title: 'Мастер-класс плова', text: 'Готовим ош в махалле с семьёй, обед включён', price: 30, unit: 'person', in_order: false },
];
