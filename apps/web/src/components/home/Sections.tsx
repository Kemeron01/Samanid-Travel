import { Media, buttonVariants, cn, DestinationCard, PageContainer } from '@samanid/ui';
import type { Destination, Holiday, HomeStats, Settings } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Calendar, CreditCard, Gift, Send, Shield, Bus, Star, Ticket, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { SubscribeForm } from './SubscribeForm';
import { SearchBar } from './SearchBar';
import { compact, dateRange, dayMonth, money } from '@/lib/format';

export async function Hero({ locale, stats, destinations }: { locale: Locale; stats: HomeStats; destinations: Destination[] }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  return (
    <section aria-labelledby="hero-title" className="pt-6 md:pt-14">
      <PageContainer>
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 md:items-center md:text-center">
          <p className="hidden items-center gap-2 self-center rounded-full border border-dark-200 bg-white px-3.5 py-1.5 text-body-s-medium text-dark-700 md:inline-flex">
            <Star className="size-3.5 text-accent-500" aria-hidden="true" />{t('badge', { rating: stats.rating.toFixed(1), count: compact(stats.reviews, locale) })}
          </p>
          <h1 id="hero-title" className="text-h2 text-dark-900 md:text-display md:text-balance">{t('title')}</h1>
          <p className="text-body-m text-dark-500 md:max-w-[720px] md:text-body-l"><span className="md:hidden">{t('subtitleShort')}</span><span className="hidden md:inline">{t('subtitle')}</span></p>
        </div>
        <div className="mt-4 md:mt-10 lg:pb-11">
          <Media tone="night" caption={t('heroAlt')} className="relative h-[220px] w-full rounded-2xl md:h-[540px] md:rounded-[40px]" />
          <div className="relative mt-4 lg:-mt-[100px] lg:px-10 xl:px-20"><SearchBar destinations={destinations} /></div>
        </div>
      </PageContainer>
    </section>
  );
}

export async function Stats({ locale, stats }: { locale: Locale; stats: HomeStats }) {
  const t = await getTranslations({ locale, namespace: 'home.stats' });
  const items = [
    { v: `${compact(stats.travellers, locale)}+`, l: t('travellers'), s: t('travellersShort') },
    { v: String(stats.tours), l: t('tours', { count: stats.destinations }), s: t('toursShort') },
    { v: stats.rating.toFixed(1), l: t('rating', { count: compact(stats.reviews, locale) }), s: t('ratingShort') },
    { v: '0 $', l: t('penalty'), s: t('penaltyShort') },
  ];
  return (
    <section aria-label="stats" className="pt-8 md:pt-16">
      <PageContainer>
        {/* Figma 16:136: 4 колонки по 220px, justify-between, разделители 1×64 dark-200 по центру промежутка. */}
        <dl className="grid grid-cols-2 gap-3 xl:flex xl:items-center xl:justify-between xl:gap-0">
          {items.map((i, n) => (
            <div key={n} className={cn('flex flex-col-reverse gap-0.5 rounded-lg border border-dark-200 bg-white p-4 md:gap-1.5 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0',
              n > 0 && 'xl:relative xl:pl-[66px] xl:before:absolute xl:before:top-1/2 xl:before:left-0 xl:before:h-16 xl:before:w-px xl:before:-translate-y-1/2 xl:before:bg-dark-200')}>
              <dt className="text-caption text-dark-600 md:text-body-s xl:w-[220px]"><span className="md:hidden">{i.s}</span><span className="hidden md:inline">{i.l}</span></dt>
              <dd className="text-h3 text-primary-500 md:text-[44px] md:leading-[52px] md:font-bold md:tracking-[-1px]">{i.v}</dd>
            </div>
          ))}
        </dl>
      </PageContainer>
    </section>
  );
}

export async function HolidayBanner({ locale, holiday }: { locale: Locale; holiday: Holiday }) {
  const t = await getTranslations({ locale, namespace: 'home.holiday' });
  const price = money(holiday.price_from, locale);
  const facts = [
    { i: Calendar, v: t('daysDeparture', { days: holiday.days, date: dayMonth(holiday.departure, locale) }) },
    { i: Users, v: t('group', { max: holiday.group_max }) },
    { i: Ticket, v: t('priceInstallments', { price, count: holiday.installments }) },
  ];
  // Mobile (18:1001): одна строка «19–23 марта · группа до 16 человек · от $590, рассрочка на 3 платежа».
  const end = new Date(Date.parse(`${holiday.departure}T00:00:00Z`) + (holiday.days - 1) * 86_400_000).toISOString().slice(0, 10);
  const dates = dateRange(holiday.departure, end, locale);
  return (
    <section aria-labelledby="holiday-title" className="pt-12 md:pt-24">
      <PageContainer>
        {/* Desktop 16:511: фото 760px + белая панель 600px, заходящая на фото на 120px и выступающая на 8px сверху/снизу. */}
        <div className="grid overflow-hidden rounded-2xl border border-dark-200 bg-white lg:grid-cols-[1fr_520px] lg:overflow-visible lg:rounded-[32px] lg:border-0 lg:bg-dark-900">
          <Media tone={holiday.image.tone} src={holiday.image.src} alt={holiday.image.alt} caption={holiday.title} className="relative h-[180px] lg:h-auto lg:rounded-l-[32px]" />
          <div className="relative z-10 flex flex-col gap-3 bg-white p-5 lg:-my-2 lg:mr-10 lg:-ml-[120px] lg:gap-6 lg:rounded-[28px] lg:p-12">
            <span className="self-start rounded-sm bg-primary-500 px-2.5 py-1.5 text-caption text-white">{t('tag')}</span>
            <h2 id="holiday-title" className="text-h4 text-dark-900 lg:text-h2">{holiday.title}</h2>
            <p className="hidden text-body-m text-dark-600 lg:block">{holiday.description}</p>
            {facts.map(({ i: I, v }) => (
              <p key={v} className="hidden items-center gap-3 text-body-m-medium text-dark-900 lg:flex"><span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500"><I className="size-[18px]" /></span>{v}</p>
            ))}
            <p className="text-body-s text-dark-600 lg:hidden">{t('summary', { dates, max: holiday.group_max, price, count: holiday.installments })}</p>
            <div className="flex items-center gap-3">
              <Link href={`/tours/${holiday.slug}` as never} className={cn(buttonVariants({ variant: 'primary', size: 'M' }), 'w-full lg:h-14 lg:w-auto lg:px-7 lg:text-button-l')}>{t('view')}</Link>
              <Link href="/tours" className="hidden h-14 items-center rounded-full px-7 text-button-l text-primary-500 hover:bg-primary-50 focus-visible:focus-ring lg:inline-flex">{t('all')}</Link>
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export async function Destinations({ locale, items, total }: { locale: Locale; items: Destination[]; total: number }) {
  const t = await getTranslations({ locale, namespace: 'home.destinations' });
  return (
    <section aria-labelledby="dest-title" className="pt-12 md:pt-24">
      <PageContainer>
        <div className="mb-4 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 id="dest-title" className="text-h3 text-dark-900 md:text-h2"><span className="md:hidden">{t('titleShort')}</span><span className="hidden md:inline">{t('title')}</span></h2>
            <p className="mt-2 hidden text-body-l text-dark-500 md:block">{t('subtitle', { count: total })}</p>
          </div>
          <Link href="/destinations" className={cn(buttonVariants({ variant: 'outline', size: 'M' }), 'max-md:hidden border-primary-500 text-primary-500')}>{t('all')}</Link>
          <Link href="/destinations" className="rounded-xs text-body-s-medium text-primary-500 focus-visible:focus-ring md:hidden">{t('allShort')}</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {items.slice(0, 4).map((d) => (
            <li key={d.slug}>
              <DestinationCard Link={AppLink} href={`/destinations/${d.slug}`} name={d.name} meta={t('meta', { count: d.tours_count, price: money(d.price_from, locale) })} metaShort={t('metaShort', { count: d.tours_count })} image={{ tone: d.image.tone, src: d.image.src, alt: d.image.alt, caption: d.name }} />
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

export async function WhyUs({ locale, settings }: { locale: Locale; settings: Settings }) {
  const t = await getTranslations({ locale, namespace: 'home.why' });
  const dl = settings.cancellation_deadline_days;
  const items = [
    { i: Shield, t: t('refundTitle'), d: dl ? t('refundText', { days: dl, refund: settings.refund_days }) : t('refundTextNoDeadline', { refund: settings.refund_days }), s: dl ? t('refundTextShort', { days: dl, refund: settings.refund_days }) : t('refundTextShortNoDeadline', { refund: settings.refund_days }) },
    { i: CreditCard, t: t('installmentTitle', { count: settings.installments_count }), d: t('installmentText'), s: t('installmentTextShort') },
    { i: Bus, t: t('seatTitle'), d: t('seatText'), s: t('seatTextShort') },
    { i: Send, t: t('voucherTitle'), d: t('voucherText'), s: t('voucherTextShort') },
  ];
  return (
    <section aria-labelledby="why-title" className="pt-12 md:pt-24">
      <PageContainer>
        <h2 id="why-title" className="text-h3 text-dark-900 md:text-h2">{t('title')}</h2>
        <p className="mt-2 hidden text-body-l text-dark-500 md:block">{t('subtitle')}</p>
        <ul className="mt-3 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {items.map(({ i: I, t: title, d, s: short }) => (
            <li key={title} className="flex items-center gap-3.5 rounded-lg border border-dark-200 bg-white p-[15px] md:flex-col md:items-start md:gap-4 md:rounded-2xl md:p-[27px]">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-500 md:size-14 md:rounded-lg"><I className="size-[22px] md:size-[26px]" /></span>
              <div className="flex min-w-0 flex-col gap-0.5 md:gap-4">
                <h3 className="text-body-m-medium text-dark-900 md:text-h5">{title}</h3>
                <p className="text-caption text-dark-500 md:text-body-s md:text-dark-600"><span className="md:hidden">{short}</span><span className="hidden md:inline">{d}</span></p>
              </div>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

export async function Referral({ locale, settings }: { locale: Locale; settings: Settings }) {
  const t = await getTranslations({ locale, namespace: 'home.referral' });
  const points = compact(settings.referral_bonus_points, locale);
  return (
    <section aria-labelledby="ref-title" className="pt-12 md:pt-24">
      <PageContainer>
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-primary-500 p-6 md:flex-row md:items-center md:gap-10 md:rounded-[32px] md:px-14 md:py-12">
          <span aria-hidden="true" className="flex shrink-0 items-center justify-center text-white md:size-24 md:rounded-[28px] md:bg-white md:text-accent-500"><Gift className="size-8 md:size-11" /></span>
          <div className="flex flex-1 flex-col gap-3 md:gap-2">
            <h2 id="ref-title" className="text-h4 text-white md:text-h3"><span className="md:hidden">{t('titleShort', { points })}</span><span className="hidden md:inline">{t('title')}</span></h2>
            <p className="text-body-s text-primary-100 md:text-body-m"><span className="md:hidden">{t('textShort')}</span><span className="hidden md:inline">{t('text', { points, usd: money(settings.referral_bonus_usd, locale), cap: settings.bonus_cap_percent })}</span></p>
          </div>
          <Link href="/account/bonuses" className={cn(buttonVariants({ variant: 'primary', size: 'M' }), 'w-full md:h-14 md:w-auto md:px-7 md:text-button-l')}><span className="md:hidden">{t('ctaShort')}</span><span className="hidden md:inline">{t('cta')}</span></Link>
        </div>
      </PageContainer>
    </section>
  );
}

export async function Subscribe({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'home.subscribe' });
  return (
    <section aria-labelledby="sub-title" className="py-12 md:py-24">
      <PageContainer>
        <div className="flex flex-col gap-6 md:rounded-[32px] md:border md:border-dark-200 md:bg-white md:px-12 md:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 id="sub-title" className="text-h3 text-dark-900 md:text-h4">{t('title')}</h2>
            <p className="mt-1 hidden text-body-s text-dark-500 md:block">{t('text')}</p>
          </div>
          <SubscribeForm />
        </div>
      </PageContainer>
    </section>
  );
}
export { intlLocale };
