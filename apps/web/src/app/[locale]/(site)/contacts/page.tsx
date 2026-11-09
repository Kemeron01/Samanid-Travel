import { api } from '@samanid/api';
import { PageContainer, buttonVariants, cn } from '@samanid/ui';
import { ChevronRight, Info, Mail, MapPin, Phone, Send } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import { alternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'service.contacts' });
  return { title: t('meta'), alternates: alternates(locale, '/contacts') };
}

function ContactCard({ href, icon, label, value, note, noteShort, external }: { href: string; icon: ReactNode; label: string; value: string; note: string; noteShort: string; external?: boolean }) {
  return (
    <li>
      <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="flex items-center gap-4 rounded-xl border border-dark-200 bg-white p-4 transition-colors hover:border-primary-500 focus-visible:focus-ring md:p-5">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-primary-50 text-primary-500 [&>svg]:size-[22px]">{icon}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5 font-medium">
          <span className="text-caption text-dark-500">{label}</span>
          <span className="text-body-m-medium break-words text-dark-900">{value}</span>
          <span className="text-caption text-dark-500"><span className="md:hidden">{noteShort}</span><span className="hidden md:inline">{note}</span></span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-dark-400 md:hidden" />
      </a>
    </li>
  );
}

/** 5.5 «Контакты» (42:666 / 70:1713). На mobile — «Позвонить» и Telegram сверху, превью карты + «Открыть в картах». */
export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const [t, f, c] = await Promise.all([getTranslations({ locale, namespace: 'service.contacts' }), getTranslations({ locale, namespace: 'footer' }), api.content.company()]);
  const tel = `tel:${c.phone}`; const tg = `https://t.me/${c.telegram}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${c.geo.lat},${c.geo.lng}`;
  return (
    <PageContainer className="flex flex-col gap-6 pt-6 pb-16 md:gap-10 md:pt-12 md:pb-24">
      <h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1>
      <div className="grid grid-cols-2 gap-3 md:hidden">
        <a href={tel} className={buttonVariants({ variant: 'secondary', size: 'M', className: 'h-12' })}>{t('call')}</a>
        <a href={tg} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'M', className: 'h-12 border-[1.5px] border-primary-500' })}>{t('telegram')}</a>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <ul className="flex flex-col gap-3 md:gap-4 lg:w-[520px] lg:shrink-0">
          <ContactCard href={tel} icon={<Phone />} label={t('phone')} value={f('phone')} note={t('phoneNote')} noteShort={t('phoneNoteShort')} />
          <ContactCard href={tg} external icon={<Send />} label={t('telegram')} value={`@${c.telegram}`} note={t('telegramNote')} noteShort={t('telegramNoteShort')} />
          <ContactCard href={`mailto:${c.email}`} icon={<Mail />} label={t('email')} value={c.email} note={t('emailNote')} noteShort={t('emailNoteShort')} />
          <ContactCard href={mapUrl} external icon={<MapPin />} label={t('office')} value={f('address')} note={t('officeNote')} noteShort={t('officeNoteShort')} />
        </ul>
        <div className="flex flex-col gap-3 lg:flex-1">
          {/* Превью карты: в проде — статичный тайл / iframe провайдера (вопрос к дизайнеру и BE: Google или Yandex). */}
          <div role="img" aria-label={`${t('mapLabel')}: ${f('address')}`} className={cn('relative flex h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-dark-200 bg-primary-50 md:h-[480px]')}>
            <MapPin aria-hidden="true" className="size-12 fill-accent-500 text-white" strokeWidth={1.5} />
            <span className="absolute bottom-4 left-4 hidden text-caption text-dark-500 md:block">{t('mapCaption')}</span>
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'ghost', size: 'M', className: 'absolute bottom-5 left-1/2 -translate-x-1/2 border-[1.5px] border-primary-500 bg-white md:hidden' })}>{t('openMap')}</a>
          </div>
          <p className="flex gap-2 text-caption text-dark-500 md:hidden"><Info aria-hidden="true" className="mt-px size-3.5 shrink-0" />{t('mapNote')}</p>
        </div>
      </div>
    </PageContainer>
  );
}
