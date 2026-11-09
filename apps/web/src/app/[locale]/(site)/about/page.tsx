import { api } from '@samanid/api';
import type { Locale } from '@samanid/i18n';
import { Media, PageContainer, buttonVariants } from '@samanid/ui';
import { MapPin, ShieldCheck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';
import { compact } from '@/lib/format';
import { alternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'service.about' });
  return { title: t('meta'), description: t('title'), alternates: alternates(locale, '/about') };
}

function Value({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-dark-200 bg-white p-6 md:p-7">
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-lg bg-primary-50 text-primary-500 [&>svg]:size-[26px]">{icon}</span>
      <h3 className="text-h5 text-dark-900">{title}</h3>
      <p className="text-body-s text-dark-600">{text}</p>
    </li>
  );
}

/** 5.4 «О нас» (42:481 / 70:1545). Цифры и сроки — из API. */
export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params; const locale = raw as Locale; setRequestLocale(locale);
  const [t, c, s] = await Promise.all([getTranslations({ locale, namespace: 'service.about' }), api.content.company(), api.settings()]);
  const stats: [string, string][] = [
    [`${compact(c.travellers, locale)}+`, t('stats.travellers')],
    [String(c.tours), t('stats.tours')],
    [String(c.guides), t('stats.guides')],
    [c.rating.toFixed(1), t('stats.rating')],
  ];
  const days = s.cancellation_deadline_days;
  return (
    <PageContainer className="flex flex-col gap-8 pt-6 pb-16 md:gap-10 md:pt-12 md:pb-24">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-5">
          <p className="text-overline uppercase text-primary-500">{t('overline')}</p>
          <h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1>
          <p className="text-body-m text-dark-600 md:text-body-l">{t('lead', { year: c.founded })}</p>
        </div>
        <Media caption={t('photo')} className="relative aspect-[560/420] w-full shrink-0 rounded-2xl md:rounded-[32px] lg:w-[560px]" />
      </section>
      <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {stats.map(([v, l]) => (
          <li key={l} className="flex flex-col gap-1 rounded-xl border border-dark-200 bg-white p-4 md:p-6">
            <span className="text-h3 text-primary-500 md:text-h2">{v}</span>
            <span className="text-body-s text-dark-600">{l}</span>
          </li>
        ))}
      </ul>
      <section aria-labelledby="values" className="flex flex-col gap-5 md:gap-6">
        <h2 id="values" className="text-h3 text-dark-900 md:text-h2">{t('valuesTitle')}</h2>
        <ul className="grid gap-4 md:grid-cols-3 md:gap-5">
          <Value icon={<ShieldCheck />} title={t('fair')} text={days ? t('fairText', { days }) : t('fairTextNoDeadline')} />
          <Value icon={<Users />} title={t('groups')} text={t('groupsText', { count: c.group_max })} />
          <Value icon={<MapPin />} title={t('guides')} text={t('guidesText')} />
        </ul>
      </section>
      <section className="flex flex-col gap-5 rounded-2xl bg-dark-900 p-6 md:flex-row md:items-center md:gap-6 md:rounded-[32px] md:px-12 md:py-10">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="text-h4 text-white md:text-h3">{t('ctaTitle')}</h2>
          <p className="text-body-m text-dark-300">{t('ctaText')}</p>
        </div>
        <Link href="/tours" className={buttonVariants({ variant: 'primary', size: 'L' })}>{t('ctaButton')}</Link>
      </section>
    </PageContainer>
  );
}
