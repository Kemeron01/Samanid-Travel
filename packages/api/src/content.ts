import * as fx from './fixtures';
import { _store } from './orders';

/**
 * Контент служебных страниц (в проде — CMS/API: GET /v1/faq?lang=, GET /v1/legal/{slug}?lang=, GET /v1/vouchers/{code}/verify).
 * Сроки и проценты подставляются из настроек API, а не захардкожены в тексте.
 */
export type ContentLang = 'ru' | 'uz' | 'en';
export type FaqCategory = 'payment' | 'cancel' | 'visa' | 'trip';
export interface FaqItem { id: string; category: FaqCategory; q: string; a: string }
export type LegalSlug = 'cancellation' | 'privacy' | 'consent';
export interface LegalSection { id: string; title: string; summary?: string; paragraphs: string[] }
export interface LegalDoc { slug: LegalSlug; lang: ContentLang; title: string; edition: string; /** подпись блока «Коротко» на языке документа */ summary_label: string; sections: LegalSection[]; /** null → PDF не сгенерирован, фронт предлагает печать в PDF */ pdf_url: string | null }
export type VoucherStatus = 'pending' | 'confirmed' | 'partially_paid' | 'cancelled' | 'refunded' | 'expired' | 'completed';
/** Публичная проверка: только номер, тур, выезд, кол-во пассажиров, места и статус — без персональных данных. */
export interface VoucherCheck { valid: boolean; number: string; tour: string; departure: string; meeting_time: string; passengers: number; seats: string[]; status: VoucherStatus; checked_at: string; cancelled_at?: string }
export interface CompanyInfo { founded: number; travellers: number; tours: number; guides: number; rating: number; group_max: number; telegram: string; phone: string; email: string; geo: { lat: number; lng: number } }

const s = fx.settings;
const pct = (n: number, l: ContentLang) => (l === 'en' ? String(n) : String(n).replace('.', ','));
const D = s.cancellation_deadline_days;

function faqFor(l: ContentLang): FaqItem[] {
  const p = pct(s.installment_penalty_percent, l);
  if (l === 'en') return [
    { id: 'price', category: 'trip', q: 'What is included in the tour price?', a: 'Accommodation, breakfasts, transfers on the itinerary, a guide and entrance tickets. The exact list is in the “Included” section on the tour page.' },
    { id: 'cancel', category: 'cancel', q: 'How do I cancel an order and get a refund?', a: `In your account → My orders → “Cancel”.${D ? ` Free of charge up to ${D} days before departure.` : ''} The money is returned the same way within ${s.refund_days} days.` },
    { id: 'installments', category: 'payment', q: 'Can I pay in instalments?', a: `Yes, ${s.installments_count} payments with no extra charges: a deposit when booking, the rest on schedule before departure.` },
    { id: 'missed', category: 'payment', q: 'What happens if I miss a payment?', a: `A penalty of ${p}% per day is charged. If the debt is not paid ${s.installment_block_days} days before departure, the booking is cancelled under the rules.` },
    { id: 'visa', category: 'visa', q: 'Do I need a visa for Uzbekistan?', a: 'Citizens of 90+ countries enter visa-free for up to 30 days. Others need an e-visa, which takes 2–3 business days.' },
    { id: 'waitlist', category: 'trip', q: 'How does the waitlist work?', a: `If a seat frees up, we notify you in Telegram and by email. You have ${s.waitlist_window_hours} hours to book, then the seat goes to the next person.` },
  ];
  if (l === 'uz') return [
    { id: 'price', category: 'trip', q: 'Tur narxiga nimalar kiradi?', a: 'Turar joy, nonushta, dastur boʻyicha transferlar, gid va kirish chiptalari. Aniq roʻyxat tur sahifasidagi «Narxga kiradi» boʻlimida.' },
    { id: 'cancel', category: 'cancel', q: 'Buyurtmani qanday bekor qilib, pulni qaytarish mumkin?', a: `Shaxsiy kabinet → Buyurtmalarim → «Bekor qilish».${D ? ` Joʻnashdan ${D} kun oldingacha — bepul.` : ''} Pul ${s.refund_days} kun ichida toʻlov usuli orqali qaytariladi.` },
    { id: 'installments', category: 'payment', q: 'Boʻlib toʻlash mumkinmi?', a: `Ha, ortiqcha toʻlovsiz ${s.installments_count} ta toʻlov: bron qilishda depozit, qolgani joʻnashgacha jadval boʻyicha.` },
    { id: 'missed', category: 'payment', q: 'Toʻlovni oʻtkazib yuborsam nima boʻladi?', a: `Kuniga ${p}% penya hisoblanadi. Qarz joʻnashdan ${s.installment_block_days} kun oldin toʻlanmasa, bron qoidalarga koʻra bekor qilinadi.` },
    { id: 'visa', category: 'visa', q: 'Oʻzbekistonga viza kerakmi?', a: '90 dan ortiq davlat fuqarolari 30 kungacha vizasiz kiradi. Boshqalar uchun elektron viza, rasmiylashtirish 2–3 ish kuni.' },
    { id: 'waitlist', category: 'trip', q: 'Kutish roʻyxati qanday ishlaydi?', a: `Joy boʻshasa, Telegram va emailga xabar yuboramiz. Bron qilish uchun ${s.waitlist_window_hours} soat vaqtingiz boʻladi, keyin joy navbatdagi kishiga oʻtadi.` },
  ];
  return [
    { id: 'price', category: 'trip', q: 'Что входит в стоимость тура?', a: 'Проживание, завтраки, трансферы по программе, гид и входные билеты. Точный список — в разделе «Включено» на странице тура.' },
    { id: 'cancel', category: 'cancel', q: 'Как отменить заказ и вернуть деньги?', a: `В личном кабинете → Мои заказы → «Отменить».${D ? ` Бесплатно — до ${D} дней до выезда.` : ''} Деньги вернутся тем же способом в течение ${s.refund_days} дней.` },
    { id: 'installments', category: 'payment', q: 'Можно ли платить в рассрочку?', a: `Да, ${s.installments_count} платежа без переплат: депозит при бронировании, остальное — по графику до выезда.` },
    { id: 'missed', category: 'payment', q: 'Что будет, если я пропущу платёж?', a: `Начисляется пеня ${p}% в день. Если долг не погашен за ${s.installment_block_days} дней до выезда, бронь отменяется по правилам.` },
    { id: 'visa', category: 'visa', q: 'Нужна ли виза в Узбекистан?', a: 'Граждане 90+ стран въезжают без визы до 30 дней. Для остальных — электронная виза, оформление занимает 2–3 рабочих дня.' },
    { id: 'waitlist', category: 'trip', q: 'Как работает лист ожидания?', a: `Если место освободится, мы пришлём уведомление в Telegram и на email. У вас будет ${s.waitlist_window_hours} часа, чтобы забронировать, затем место перейдёт следующему.` },
  ];
}

type Sec = [id: string, title: string, paragraphs: string[], summary?: string];
const sec = (list: Sec[]): LegalSection[] => list.map(([id, title, paragraphs, summary], i) => ({ id, title: `${i + 1}. ${title}`, paragraphs, ...(summary ? { summary } : {}) }));

function legalFor(slug: LegalSlug, l: ContentLang): LegalDoc {
  const r = s.refund_days; const n = s.installments_count; const p = pct(s.installment_penalty_percent, l); const b = s.installment_block_days;
  const T: Record<LegalSlug, Record<ContentLang, { title: string; sections: Sec[] }>> = {
    cancellation: {
      ru: { title: 'Политика отмены и возврата', sections: [
        ['free', 'Бесплатная отмена', D ? [`Вы можете отменить заказ в личном кабинете не позднее чем за ${D} дней до даты выезда. Штраф за отмену не взимается, стоимость возвращается полностью.`, `Если до выезда осталось меньше ${D} дней, онлайн-отмена недоступна — свяжитесь с менеджером, мы предложим перенос даты.`] : ['Условия отмены указаны в договоре по конкретному туру. Свяжитесь с менеджером, чтобы отменить заказ.'], D ? `Отмена за ${D}+ дней до выезда — возврат 100%, деньги придут в течение ${r} дней.` : undefined],
        ['refund', 'Сроки возврата', [`Деньги возвращаются тем же способом, которым была произведена оплата, в течение ${r} дней с момента отмены. Срок зачисления зависит от банка-эмитента карты.`]],
        ['points', 'Баллы и промокоды', ['Списанные бонусные баллы возвращаются на счёт сразу после отмены. Использованный промокод снова становится активным, если срок его действия не истёк.']],
        ['installments', 'Рассрочка', [`Оплата в рассрочку — ${n} платежа без переплат. При просрочке начисляется пеня ${p}% в день. Если долг не погашен за ${b} дней до выезда, заказ отменяется по правилам этого раздела.`]],
        ['change', 'Изменение заказа', [`Дату, состав путешественников и допуслуги можно изменить до начала тура. Если новая цена выше — потребуется доплата, если ниже — разницу вернём в течение ${r} дней.`]],
        ['agency', 'Отмена агентством', ['Если тур отменяем мы, вы получаете полный возврат или перенос на другую дату по вашему выбору.']],
      ] },
      uz: { title: 'Bekor qilish va qaytarish siyosati', sections: [
        ['free', 'Bepul bekor qilish', D ? [`Buyurtmani shaxsiy kabinetda joʻnash sanasidan kamida ${D} kun oldin bekor qilishingiz mumkin. Jarima olinmaydi, narx toʻliq qaytariladi.`, `Joʻnashgacha ${D} kundan kam qolgan boʻlsa, onlayn bekor qilish mavjud emas — menejer bilan bogʻlaning, sanani koʻchirishni taklif qilamiz.`] : ['Bekor qilish shartlari tur shartnomasida koʻrsatilgan. Buyurtmani bekor qilish uchun menejer bilan bogʻlaning.'], D ? `Joʻnashdan ${D}+ kun oldin bekor qilish — 100% qaytariladi, pul ${r} kun ichida keladi.` : undefined],
        ['refund', 'Qaytarish muddatlari', [`Pul bekor qilingan paytdan boshlab ${r} kun ichida toʻlov qilingan usul orqali qaytariladi. Hisobga tushish muddati karta bankiga bogʻliq.`]],
        ['points', 'Ballar va promokodlar', ['Yechilgan bonus ballar bekor qilingandan soʻng darhol hisobga qaytadi. Ishlatilgan promokod amal qilish muddati tugamagan boʻlsa, yana faol boʻladi.']],
        ['installments', 'Boʻlib toʻlash', [`Boʻlib toʻlash — ortiqcha toʻlovsiz ${n} ta toʻlov. Kechiktirilganda kuniga ${p}% penya hisoblanadi. Qarz joʻnashdan ${b} kun oldin toʻlanmasa, buyurtma ushbu boʻlim qoidalariga koʻra bekor qilinadi.`]],
        ['change', 'Buyurtmani oʻzgartirish', [`Sana, sayohatchilar tarkibi va qoʻshimcha xizmatlarni tur boshlanguncha oʻzgartirish mumkin. Yangi narx yuqori boʻlsa — qoʻshimcha toʻlov, past boʻlsa — farqni ${r} kun ichida qaytaramiz.`]],
        ['agency', 'Agentlik tomonidan bekor qilish', ['Turni biz bekor qilsak, tanlovingizga koʻra toʻliq qaytarish yoki boshqa sanaga koʻchirish taklif qilinadi.']],
      ] },
      en: { title: 'Cancellation and refund policy', sections: [
        ['free', 'Free cancellation', D ? [`You can cancel an order in your account no later than ${D} days before departure. No cancellation fee is charged and the full price is refunded.`, `If fewer than ${D} days remain before departure, online cancellation is unavailable — contact a manager and we will offer a date change.`] : ['Cancellation terms are set in the contract for each tour. Contact a manager to cancel an order.'], D ? `Cancel ${D}+ days before departure — 100% refund, the money arrives within ${r} days.` : undefined],
        ['refund', 'Refund timing', [`Money is returned to the original payment method within ${r} days of cancellation. The crediting time depends on the card issuer.`]],
        ['points', 'Points and promo codes', ['Redeemed bonus points return to your balance immediately after cancellation. A used promo code becomes active again if it has not expired.']],
        ['installments', 'Instalments', [`Instalment plan — ${n} payments with no extra charges. A penalty of ${p}% per day applies to overdue payments. If the debt is not paid ${b} days before departure, the order is cancelled under this section.`]],
        ['change', 'Changing an order', [`The date, travellers and add-ons can be changed before the tour starts. If the new price is higher, you pay the difference; if lower, we refund it within ${r} days.`]],
        ['agency', 'Cancellation by the agency', ['If we cancel the tour, you get a full refund or a transfer to another date of your choice.']],
      ] },
    },
    privacy: {
      ru: { title: 'Политика конфиденциальности', sections: [
        ['what', 'Какие данные мы собираем', ['Имя, контакты, паспортные данные путешественников, история заказов и платежей. Данные карт обрабатывает платёжный провайдер, мы их не храним.'], 'Собираем только то, что нужно для бронирования и поездки. Данные карт не храним.'],
        ['why', 'Зачем', ['Для оформления ваучеров и манифестов, связи в день выезда, уведомлений о платежах и — только с вашего согласия — рассылки подборок.']],
        ['store', 'Хранение и защита', ['Данные хранятся на серверах в Узбекистане и передаются по защищённым каналам. Доступ есть только у сотрудников, которым он нужен для работы.']],
        ['rights', 'Ваши права', ['Вы можете выгрузить свои данные или удалить аккаунт в разделе «Профиль и безопасность». Данные по оплаченным заказам храним столько, сколько требует закон.']],
      ] },
      uz: { title: 'Maxfiylik siyosati', sections: [
        ['what', 'Qanday maʼlumotlarni yigʻamiz', ['Ism, kontaktlar, sayohatchilarning pasport maʼlumotlari, buyurtma va toʻlovlar tarixi. Karta maʼlumotlarini toʻlov provayderi qayta ishlaydi, biz ularni saqlamaymiz.'], 'Faqat bron va sayohat uchun keraklisini yigʻamiz. Karta maʼlumotlarini saqlamaymiz.'],
        ['why', 'Nima uchun', ['Vaucher va manifestlarni rasmiylashtirish, joʻnash kuni aloqa, toʻlov bildirishnomalari va — faqat roziligingiz bilan — tanlovlar yuborish uchun.']],
        ['store', 'Saqlash va himoya', ['Maʼlumotlar Oʻzbekistondagi serverlarda saqlanadi va himoyalangan kanallar orqali uzatiladi. Kirish faqat ish uchun zarur xodimlarda bor.']],
        ['rights', 'Huquqlaringiz', ['«Profil va xavfsizlik» boʻlimida maʼlumotlaringizni yuklab olishingiz yoki akkauntni oʻchirishingiz mumkin. Toʻlangan buyurtmalar boʻyicha maʼlumotlar qonun talab qilgan muddat saqlanadi.']],
      ] },
      en: { title: 'Privacy policy', sections: [
        ['what', 'What data we collect', ['Name, contacts, travellers’ passport details, order and payment history. Card data is processed by the payment provider; we do not store it.'], 'We collect only what is needed for booking and the trip. We do not store card data.'],
        ['why', 'Why', ['To issue vouchers and manifests, reach you on departure day, send payment notifications and — only with your consent — newsletters.']],
        ['store', 'Storage and protection', ['Data is stored on servers in Uzbekistan and transmitted over secure channels. Only staff who need it for their work have access.']],
        ['rights', 'Your rights', ['You can export your data or delete your account in “Profile and security”. Data on paid orders is kept as long as the law requires.']],
      ] },
    },
    consent: {
      ru: { title: 'Согласие на обработку персональных данных', sections: [
        ['scope', 'Предмет согласия', ['Регистрируясь или оформляя заказ, вы даёте согласие ООО «Samanid Travel» на обработку персональных данных, указанных в форме, в целях исполнения договора.'], 'Согласие нужно, чтобы оформить поездку. Отозвать его можно в любой момент.'],
        ['data', 'Перечень данных', ['ФИО, дата рождения, паспортные данные, телефон и email — ваши и путешественников, которых вы добавили в заказ.']],
        ['term', 'Срок действия и отзыв', ['Согласие действует до его отзыва. Отозвать согласие можно, удалив аккаунт или написав на hello@samanid.travel.']],
      ] },
      uz: { title: 'Shaxsiy maʼlumotlarni qayta ishlashga rozilik', sections: [
        ['scope', 'Rozilik predmeti', ['Roʻyxatdan oʻtish yoki buyurtma berish orqali siz «Samanid Travel» MChJga shartnomani bajarish maqsadida shaklda koʻrsatilgan shaxsiy maʼlumotlarni qayta ishlashga rozilik berasiz.'], 'Rozilik sayohatni rasmiylashtirish uchun kerak. Uni istalgan vaqtda qaytarib olish mumkin.'],
        ['data', 'Maʼlumotlar roʻyxati', ['F.I.Sh., tugʻilgan sana, pasport maʼlumotlari, telefon va email — sizniki va buyurtmaga qoʻshgan sayohatchilarniki.']],
        ['term', 'Amal qilish muddati va qaytarib olish', ['Rozilik qaytarib olinguncha amal qiladi. Akkauntni oʻchirish yoki hello@samanid.travel ga yozish orqali qaytarib olishingiz mumkin.']],
      ] },
      en: { title: 'Consent to personal data processing', sections: [
        ['scope', 'Subject of consent', ['By registering or placing an order, you consent to Samanid Travel LLC processing the personal data entered in the form for the purpose of performing the contract.'], 'Consent is required to arrange your trip. You can withdraw it at any time.'],
        ['data', 'Data covered', ['Full name, date of birth, passport details, phone and email — yours and those of travellers you added to the order.']],
        ['term', 'Term and withdrawal', ['Consent is valid until withdrawn. You can withdraw it by deleting your account or writing to hello@samanid.travel.']],
      ] },
    },
  };
  const d = T[slug][l];
  return { slug, lang: l, title: d.title, edition: '2027-03-01', summary_label: { ru: 'Коротко', uz: 'Qisqacha', en: 'In short' }[l], sections: sec(d.sections), pdf_url: null };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const legalSlugs: LegalSlug[] = ['cancellation', 'privacy', 'consent'];
const langs: ContentLang[] = ['ru', 'uz', 'en'];

export const contentApi = {
  async faq(lang: ContentLang): Promise<FaqItem[]> { return faqFor(lang); },
  async legal(slug: string, lang: ContentLang): Promise<LegalDoc | null> { return (legalSlugs as string[]).includes(slug) ? legalFor(slug as LegalSlug, lang) : null; },
  /** Все языковые редакции документа — для переключателя RU/UZ/EN без перезагрузки. */
  async legalAll(slug: string): Promise<LegalDoc[] | null> { return (legalSlugs as string[]).includes(slug) ? langs.map((l) => legalFor(slug as LegalSlug, l)) : null; },
  async company(): Promise<CompanyInfo> {
    return { founded: 2014, travellers: fx.homeStats.travellers, tours: fx.homeStats.tours, guides: 26, rating: fx.homeStats.rating, group_max: 16, telegram: 'samanid_help', phone: '+998712000000', email: 'hello@samanid.travel', geo: { lat: 41.3111, lng: 69.2797 } };
  },
  /** Публичная проверка ваучера по QR: без персональных данных. null → ваучер не найден. */
  async verifyVoucher(code: string): Promise<VoucherCheck | null> {
    await sleep(150);
    const now = new Date().toISOString(); const c = code.trim().toUpperCase();
    const o = Object.values(_store.load()).find((x) => x.number === c);
    if (o) {
      const ok = ['confirmed', 'partially_paid', 'paid'].includes(o.status);
      const status: VoucherStatus = o.status === 'paid' ? 'confirmed' : ['draft', 'pending_payment', 'awaiting_manager_confirmation'].includes(o.status) ? 'pending' : (o.status as VoucherStatus);
      return { valid: ok, number: o.number, tour: o.tour.title, departure: o.departure.from, meeting_time: o.departure.meeting_time, passengers: o.travellers.length, seats: o.seats, status, checked_at: now };
    }
    // Демо-ваучеры из макета (5.3): действительный и отменённый.
    if (c === 'ST-2027-04812') return { valid: true, number: c, tour: 'Самарканд и Бухара за 5 дней', departure: '2027-05-12', meeting_time: '07:30', passengers: 3, seats: ['2A', '2B', '4A'], status: 'confirmed', checked_at: now };
    if (c === 'ST-2027-00001') return { valid: false, number: c, tour: 'Самарканд и Бухара за 5 дней', departure: '2027-05-12', meeting_time: '07:30', passengers: 3, seats: ['2A', '2B', '4A'], status: 'refunded', checked_at: now, cancelled_at: '2027-05-02' };
    return null;
  },
};
