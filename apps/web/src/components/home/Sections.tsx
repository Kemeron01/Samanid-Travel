import { Media, buttonVariants, cn, DestinationCard, PageContainer } from '@samanid/ui';
import type { Destination, Holiday, HomeStats, Settings } from '@samanid/api';
import { intlLocale, type Locale } from '@samanid/i18n';
import { Calendar, CreditCard, Gift, Send, Shield, Bus, Star, Ticket, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { SubscribeForm } from './SubscribeForm';
import { SearchBar } from './SearchBar';
import { compact, dayMonth, money } from '@/lib/format';

export async function Hero({ locale, stats, destinations }: { locale: Locale; stats: HomeStats; destinations: Destination[] }) {
  const t = await getTranslations({ locale, namespace: 'home.hero' });
  return (
    <section aria-labelledby="hero-title" className="pt-8 md:pt-14">
      <PageContainer>
        <div className="mx-auto flex max-w-[900px] flex-col gap-4 md:items-center md:text-center">
          <p className="hidden items-center gap-2 self-center rounded-full border border-dark-200 bg-white px-4 py-2 text-body-s-medium text-dark-900 md:inline-flex">
            <Star className="size-3.5 text-accent-500" aria-hidden="true" />{t('badge', { rating: stats.rating.toFixed(1), count: compact(stats.reviews, locale) })}
          </p>
          <h1 id="hero-title" className="text-[32px] leading-10 font-bold tracking-[-0.5px] text-dark-900 md:text-display">{t('title')}</h1>
          <p className="text-body-s text-dark-600 md:max-w-[720px] md:text-body-l">{t('subtitle')}</p>
        </div>
        <div className="mt-6 md:mt-10">
          <Media tone="night" caption={t('heroAlt')} className="relative h-[200px] w-full rounded-2xl md:h-[540px] md:rounded-[40px]" />
          <div className="relative md:-mt-24 md:px-20"><SearchBar destinations={destinations} /></div>
        </div>
      </PageContainer>
    </section>
  );
}

export async function Stats({ locale, stats }: { locale: Locale; stats: HomeStats }) {
  const t = await getTranslations({ locale, namespace: 'home.stats' });
  const items = [
    { v: `${compact(stats.travellers, locale)}+`, l: t('travellers') },
    { v: String(stats.tours), l: t('tours', { count: stats.destinations }) },
    { v: stats.rating.toFixed(1), l: t('rating', { count: compact(stats.reviews, locale) }) },
    { v: '0 $', l: t('penalty') },
  ];
  return (
    <section aria-label="stats" className="py-8 md:py-16">
      <PageContainer>
        <dl className="grid grid-cols-2 gap-3 xl:flex xl:items-stretch xl:justify-between xl:gap-0">
          {items.map((i, n) => (
            <div key={n} className="flex items-stretch xl:flex-1 xl:justify-center">
              {n > 0 && <span aria-hidden="true" className="mx-0 hidden w-px bg-dark-200 xl:mr-16 xl:block" />}
              <div className="flex w-full flex-col-reverse rounded-lg border border-dark-200 bg-white p-4 xl:w-[220px] xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0">
                <dt className="text-caption text-dark-500 md:text-body-s md:text-dark-600">{i.l}</dt>
                <dd className="text-h3 text-dark-900 md:text-[44px] md:leading-[52px] md:font-extrabold">{i.v}</dd>
              </div>
            </div>
          ))}
        </dl>
      </PageContainer>
    </section>
  );
}

export async function HolidayBanner({ locale, holiday }: { locale: Locale; holiday: Holiday }) {
  const t = await getTranslations({ locale, namespace: 'home.holiday' });
  const facts = [
    { i: Calendar, v: t('daysDeparture', { days: holiday.days, date: dayMonth(holiday.departure, locale) }) },
    { i: Users, v: t('group', { max: holiday.group_max }) },
    { i: Ticket, v: t('priceInstallments', { price: money(holiday.price_from, locale), count: holiday.installments }) },
  ];
  return (
    <section aria-labelledby="holiday-title" className="py-6 md:py-24">
      <PageContainer>
        <div className="grid overflow-hidden rounded-2xl bg-dark-900 lg:grid-cols-[1fr_600px] lg:rounded-[32px]">
          <Media tone={holiday.image.tone} src={holiday.image.src} alt={holiday.image.alt} caption={holiday.title} className="relative h-[200px] lg:h-auto" />
          <div className="m-0 flex flex-col gap-4 bg-white p-5 md:gap-6 md:p-12 relative z-10 lg:rounded-[24px] lg:-ml-[120px] lg:mr-10 lg:-my-2">
            <span className="self-start rounded-sm bg-primary-500 px-2.5 py-1.5 text-caption text-white">{t('tag')}</span>
            <h2 id="holiday-title" className="text-h4 text-dark-900 md:text-h2">{holiday.title}</h2>
            <p className="text-body-s text-dark-600 md:text-body-m">{holiday.description}</p>
            <ul className="hidden flex-col gap-4 md:flex">
              {facts.map(({ i: I, v }) => (
                <li key={v} className="flex items-center gap-3 text-body-m text-dark-900"><span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-primary-50 text-primary-500"><I className="size-[18px]" /></span>{v}</li>
              ))}
            </ul>
            <p className="text-body-s text-dark-600 md:hidden">{facts[2]!.v}</p>
            <div className="flex flex-wrap items-center gap-3 md:gap-6">
              <Link href={`/tours/${holiday.slug}` as never} className={cn(buttonVariants({ variant: 'primary', size: 'L' }), 'w-full md:w-auto')}>{t('view')}</Link>
              <Link href="/tours" className="hidden text-button-m text-primary-500 md:inline">{t('all')}</Link>
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
    <section aria-labelledby="dest-title" className="py-12 md:py-24">
      <PageContainer>
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <h2 id="dest-title" className="text-h3 text-dark-900 md:text-h2">{t('title')}</h2>
            <p className="mt-2 hidden text-body-l text-dark-600 md:block">{t('subtitle', { count: total })}</p>
          </div>
          <Link href="/destinations" className={cn(buttonVariants({ variant: 'outline' }), 'hidden border-primary-500 text-primary-500 md:inline-flex')}>{t('all')}</Link>
          <Link href="/destinations" className="text-body-s-medium text-primary-500 md:hidden">{t('all').split(' ')[0]}</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {items.map((d) => (
            <li key={d.slug}>
              <DestinationCard Link={AppLink} href={`/destinations/${d.slug}`} name={d.name} meta={t('meta', { count: d.tours_count, price: money(d.price_from, locale) })} image={{ tone: d.image.tone, src: d.image.src, alt: d.image.alt, caption: d.name }} />
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

export async function WhyUs({ locale, settings }: { locale: Locale; settings: Settings }) {
  const t = await getTranslations({ locale, namespace: 'home.why' });
  const items = [
    { i: Shield, t: t('refundTitle'), d: settings.cancellation_deadline_days ? t('refundText', { days: settings.cancellation_deadline_days, refund: settings.refund_days }) : t('refundTextNoDeadline', { refund: settings.refund_days }) },
    { i: CreditCard, t: t('installmentTitle', { count: settings.installments_count }), d: t('installmentText') },
    { i: Bus, t: t('seatTitle'), d: t('seatText') },
    { i: Send, t: t('voucherTitle'), d: t('voucherText') },
  ];
  return (
    <section aria-labelledby="why-title" className="py-12 md:py-24">
      <PageContainer>
        <h2 id="why-title" className="text-h3 text-dark-900 md:text-h2">{t('title')}</h2>
        <p className="mt-2 hidden text-body-l text-dark-600 md:block">{t('subtitle')}</p>
        <ul className="mt-6 grid gap-3 md:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
          {items.map(({ i: I, t: title, d }) => (
            <li key={title} className="flex gap-4 rounded-xl border border-dark-200 bg-white p-4 md:flex-col md:gap-4 md:p-7">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500 md:size-14"><I className="size-5 md:size-[26px]" /></span>
              <div className="flex flex-col gap-1 md:gap-3"><h3 className="text-body-m-medium text-dark-900 md:text-h5">{title}</h3><p className="text-caption text-dark-600 md:text-body-s">{d}</p></div>
            </li>
          ))}
        </ul>
      </PageContainer>
    </section>
  );
}

export async function Referral({ locale, settings }: { locale: Locale; settings: Settings }) {
  const t = await getTranslations({ locale, namespace: 'home.referral' });
  return (
    <section aria-labelledby="ref-title" className="py-6 md:py-12">
      <PageContainer>
        <div className="flex flex-col gap-5 rounded-2xl bg-primary-500 p-6 md:flex-row md:items-center md:gap-10 md:rounded-[32px] md:px-14 md:py-12">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-white/15 text-white md:size-24"><Gift className="size-6 md:size-11" /></span>
          <div className="flex flex-1 flex-col gap-2">
            <h2 id="ref-title" className="text-h4 text-white md:text-h3">{t('title')}</h2>
            <p className="text-body-s text-primary-100 md:text-body-m">{t('text', { points: compact(settings.referral_bonus_points, locale), usd: money(settings.referral_bonus_usd, locale), cap: settings.bonus_cap_percent })}</p>
          </div>
          <Link href="/account/bonuses" className={cn(buttonVariants({ variant: 'primary', size: 'L' }), 'w-full md:w-auto')}>{t('cta')}</Link>
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
