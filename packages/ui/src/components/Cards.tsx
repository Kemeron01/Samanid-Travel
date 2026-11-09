'use client';
import { ArrowRight, Bus, Calendar, CircleCheck, Clock, Heart, ImageIcon, MapPin, Star, Users } from 'lucide-react';
import type { ComponentType, ImgHTMLAttributes, ReactNode } from 'react';
import { cn } from '../cn';
import { Checkbox } from './Controls';
import { HoldTimer, type HoldTimerState } from './Feedback';
import { StatusBadge, Tag, type OrderStatus, type TagType } from './Badge';
import { Button } from './Button';
import type { LinkComponent } from './Navigation';

const DefaultLink: LinkComponent = (p) => <a {...p} />;

export type ImageTone = 'sky' | 'sand' | 'sunset' | 'mountain' | 'night';
const toneBg: Record<ImageTone, string> = {
  sky: 'from-primary-500 to-[#8cbfff]',
  sand: 'from-[#ed9e4d] to-[#fcdb9e]',
  sunset: 'from-accent-500 to-[#8c3c8c]',
  mountain: 'from-[#1a736b] to-[#8cccbf]',
  night: 'from-dark-900 to-primary-500',
};

export type ImageComponent = ComponentType<ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string; fill?: boolean }>;

/**
 * Фото (Figma: Image 13:423). Реальные изображения приходят из API; в web передайте next/image через `ImageComponent`.
 * Без `src` — плейсхолдер-градиент как в макете. Соотношение сторон задаётся снаружи (aspect-*).
 */
export function Media({ src, alt = '', caption, tone = 'sky', ImageComponent, className }: {
  src?: string; alt?: string; caption?: string; tone?: ImageTone; ImageComponent?: ImageComponent; className?: string;
}) {
  return (
    <div className={cn('overflow-hidden bg-linear-[145deg]', toneBg[tone], className)}>
      {src ? (
        ImageComponent ? <ImageComponent src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" /> : <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" loading="lazy" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
          <ImageIcon className="size-10" />{caption && <span className="text-caption opacity-80">{caption}</span>}
        </div>
      )}
    </div>
  );
}

/** «от $640» из шаблона локали: часть шаблона вокруг {amount} — мелким, сумма — крупно (RU/EN «от $640», UZ «$640 dan»). */
export function PriceFrom({ template, amount, suffix, className }: { template: string; amount: string; suffix?: string; className?: string }) {
  const [before = '', after = ''] = template.split('{amount}');
  return (
    <span className={cn('flex items-baseline gap-1', className)}>
      {before.trim() && <span className="text-caption text-dark-500">{before.trim()}</span>}
      <span className="text-price-m text-dark-900">{amount}</span>
      {after.trim() && <span className="text-caption text-dark-500">{after.trim()}</span>}
      {suffix && <span className="text-caption text-dark-500">{suffix}</span>}
    </span>
  );
}

export interface TourCardProps {
  href: string;
  title: string;
  region: string;
  image?: { src?: string; alt?: string; caption?: string; tone?: ImageTone };
  tags?: { type: TagType; label: string }[];      // не более 2 на карточку
  favorite: { active: boolean; onToggle: () => void; label: string };
  facts: { duration: string; group: string; nextDate: string };
  rating?: { value: number; count: number };
  oldPrice?: string;
  priceTemplate: string; price: string; perPerson: string;
  seatsLeft?: string;
  soldOut?: { label: string; nextDepartureLabel: string; nextDeparture: string; waitlistLabel: string; onWaitlist: () => void };
  Link?: LinkComponent; ImageComponent?: ImageComponent;
}

/** Figma: Tour Card 13:632. Вся карточка кликабельна (растянутая ссылка), сердечко — отдельная цель. */
export function TourCard(p: TourCardProps) {
  const Link = p.Link ?? DefaultLink;
  const tags = (p.tags ?? []).slice(0, 2);
  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-xl border border-dark-200 bg-white transition-shadow hover:border-primary-100 hover:shadow-md focus-within:focus-ring">
      <div className="relative h-[210px] shrink-0">
        <Media {...p.image} ImageComponent={p.ImageComponent} className="absolute inset-0" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {p.soldOut ? <span className="rounded-sm bg-dark-900 px-2.5 py-1.5 text-caption text-white">{p.soldOut.label}</span>
            : tags.map((t) => <Tag key={t.type} type={t.type}>{t.label}</Tag>)}
        </div>
        <button type="button" aria-label={p.favorite.label} aria-pressed={p.favorite.active} onClick={p.favorite.onToggle}
          className="absolute top-3 right-2.5 z-10 inline-flex size-10 items-center justify-center rounded-full border border-dark-200 bg-white text-dark-900 focus-visible:focus-ring">
          <Heart className={cn('size-5', p.favorite.active && 'fill-error-600 text-error-600')} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col gap-2.5 px-5 py-4">
        <p className="flex items-center gap-1.5 text-caption text-primary-600"><MapPin className="size-4" aria-hidden="true" />{p.region}</p>
        <h3 className="text-h6 text-dark-900">
          <Link href={p.href} className="outline-none after:absolute after:inset-0 after:content-['']">{p.title}</Link>
        </h3>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-dark-600">
          <li className="flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{p.facts.duration}</li>
          <li className="flex items-center gap-1"><Users className="size-3.5" aria-hidden="true" />{p.facts.group}</li>
          <li className="flex items-center gap-1"><Calendar className="size-3.5" aria-hidden="true" />{p.facts.nextDate}</li>
        </ul>
        {p.rating && (
          <p className="flex items-center gap-1 text-caption">
            <Star className="size-3.5 fill-accent-500 text-accent-500" aria-hidden="true" />
            <span className="text-dark-900">{p.rating.value.toFixed(1)}</span><span className="text-dark-500">({p.rating.count})</span>
          </p>
        )}
        <hr className="border-dark-200" />
        {p.soldOut ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col"><span className="text-caption text-dark-500">{p.soldOut.nextDepartureLabel}</span><span className="text-body-s-medium text-dark-900">{p.soldOut.nextDeparture}</span></div>
            <Button variant="outline" onClick={p.soldOut.onWaitlist} className="relative z-10 w-full border-primary-500 text-primary-500">{p.soldOut.waitlistLabel}</Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {p.oldPrice && <span className="text-caption text-dark-400 line-through">{p.oldPrice}</span>}
              <PriceFrom template={p.priceTemplate} amount={p.price} suffix={p.perPerson} />
            </div>
            {p.seatsLeft && <span className="flex items-center gap-1 text-caption text-warning-700"><Clock className="size-3.5" aria-hidden="true" />{p.seatsLeft}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

export function DestinationCard({ href, name, meta, metaShort, image, Link = DefaultLink, ImageComponent }: {
  href: string; name: string; meta: string; metaShort?: string; image?: { src?: string; alt?: string; caption?: string; tone?: ImageTone };
  Link?: LinkComponent; ImageComponent?: ImageComponent;
}) {
  // Figma 16:584 (305×400) / 18:1020 (173×200): подпись снизу-слева 20/26px; на mobile — без цены и без подписи плейсхолдера.
  return (
    <article className="relative aspect-[173/200] w-full overflow-hidden rounded-2xl focus-within:focus-ring md:aspect-[305/400]">
      <Media tone="mountain" {...image} ImageComponent={ImageComponent} className="absolute inset-0 max-md:[&_span]:hidden" />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-40% from-dark-900/0 to-dark-900/85" />
      <div className="absolute right-5 bottom-[26px] left-5 flex flex-col gap-1">
        <h3 className="text-h4 text-white"><Link href={href} className="outline-none after:absolute after:inset-0 after:content-['']">{name}</Link></h3>
        <p className="flex items-center gap-1.5 text-body-s text-dark-200">{metaShort ? <><span className="md:hidden">{metaShort}</span><span className="hidden md:inline">{meta}</span></> : meta}<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></p>
      </div>
    </article>
  );
}

export function ReviewCard({ initials, name, meta, rating, text, verifiedLabel }: {
  initials: string; name: string; meta: string; rating: number; text: string; verifiedLabel?: string;
}) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-dark-200 bg-white p-6">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-100 text-body-s-medium text-warning-700">{initials}</span>
        <div className="min-w-0 flex-1"><p className="text-body-m-medium text-dark-900">{name}</p><p className="text-caption text-dark-500">{meta}</p></div>
        <span role="img" aria-label={`${rating} / 5`} className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} aria-hidden="true" className={cn('size-4', i < rating ? 'fill-accent-500 text-accent-500' : 'text-dark-300')} />)}
        </span>
      </header>
      <p className="text-body-s text-dark-700">{text}</p>
      {verifiedLabel && <p className="flex items-center gap-1.5 text-caption text-success-700"><CircleCheck className="size-3.5" aria-hidden="true" />{verifiedLabel}</p>}
    </article>
  );
}

/** Карточка допуслуги (Default / Selected / Disabled). Цена приходит из API. */
export function AddonCard({ icon, title, description, price, checked, onCheckedChange, disabled, checkboxLabel }: {
  icon: ReactNode; title: string; description: string; price: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean; checkboxLabel: string;
}) {
  return (
    <div className={cn('flex items-start gap-4 rounded-lg border p-5',
      disabled ? 'border-dark-200 bg-dark-100' : checked ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white')}>
      <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-md [&>svg]:size-[22px]', disabled ? 'bg-dark-200 text-dark-500' : 'bg-white text-primary-500')}>{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={cn('text-body-m-medium', disabled ? 'text-dark-500' : 'text-dark-900')}>{title}</p>
        <p className={cn('text-body-s', disabled ? 'text-dark-500' : 'text-dark-600')}>{description}</p>
        <p className={cn('text-body-s-medium', disabled ? 'text-dark-400' : 'text-primary-600')}>{price}</p>
      </div>
      <Checkbox label={<span className="sr-only">{checkboxLabel}</span>} checked={checked} disabled={disabled} onCheckedChange={(v) => onCheckedChange(v === true)} className="shrink-0" />
    </div>
  );
}

/** Карточка заказа в кабинете. Статус/таймер — из API (hold_expires_at); сумма не пересчитывается. */
export function OrderCard(p: {
  image?: { src?: string; tone?: ImageTone }; status: OrderStatus; statusLabel: string; statusTitle?: string; number: string;
  title: string; dates: string; travellers: string; seats?: string;
  hold?: { remainingSeconds: number; labels: Record<HoldTimerState, string> };
  totalLabel: string; total: string; action: { label: string; variant: 'primary' | 'outline'; onClick: () => void };
  /** Mobile (39:2278): короткая мета «12–16 мая · 3 чел.» */
  metaShort?: string;
}) {
  const meta = [{ i: Calendar, t: p.dates }, { i: Users, t: p.travellers }, ...(p.seats ? [{ i: Bus, t: p.seats }] : [])];
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-dark-200 bg-white p-4 md:flex-row md:items-center md:gap-5">
      {/* Mobile: компактная карточка — миниатюра 64px, статус и название рядом, мета одной строкой, цена + кнопка. */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-start gap-3"><Media {...p.image} className="relative size-16 shrink-0 rounded-md [&_span]:hidden [&_svg]:size-7" />
          <div className="flex min-w-0 flex-col items-start gap-2"><StatusBadge status={p.status} label={p.statusLabel} title={p.statusTitle} /><h3 className="text-body-m-medium text-dark-900">{p.title}</h3></div></div>
        <p className="text-caption text-dark-500">{p.metaShort ?? p.dates}</p>
        {p.hold && <HoldTimer remainingSeconds={p.hold.remainingSeconds} labels={p.hold.labels} className="self-start" />}
        <div className="flex items-center justify-between gap-3"><span className="text-price-m text-dark-900"><span className="sr-only">{p.totalLabel}: </span>{p.total}</span>
          <Button variant={p.action.variant === 'primary' ? 'primary' : 'outline'} onClick={p.action.onClick}>{p.action.label}</Button></div>
      </div>
      <Media {...p.image} className="relative h-30 w-full shrink-0 rounded-[14px] max-md:hidden md:w-35" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 max-md:hidden">
        <div className="flex flex-wrap items-center gap-3"><StatusBadge status={p.status} label={p.statusLabel} title={p.statusTitle} /><span className="text-caption text-dark-500">{p.number}</span></div>
        <h3 className="text-h5 text-dark-900">{p.title}</h3>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-s text-dark-600">{meta.map(({ i: I, t }) => <li key={t} className="flex items-center gap-1.5"><I className="size-4" aria-hidden="true" />{t}</li>)}</ul>
        {p.hold && <HoldTimer remainingSeconds={p.hold.remainingSeconds} labels={p.hold.labels} className="self-start" />}
      </div>
      <div className="flex items-center justify-between gap-3 max-md:hidden md:flex-col md:items-end">
        <div className="flex flex-col md:items-end"><span className="text-caption text-dark-500">{p.totalLabel}</span><span className="text-price-m text-dark-900">{p.total}</span></div>
        <Button variant={p.action.variant === 'primary' ? 'primary' : 'outline'} onClick={p.action.onClick}>{p.action.label}</Button>
      </div>
    </article>
  );
}
