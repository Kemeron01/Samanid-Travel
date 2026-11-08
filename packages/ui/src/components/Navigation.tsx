'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Globe, Heart, Mail, MapPin, Menu, Phone, Send } from 'lucide-react';
import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
import { cn } from '../cn';
import { IconButton } from './Feedback';

export type LinkComponent = ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
const DefaultLink: LinkComponent = (p) => <a {...p} />;

/** Логотип-заглушка (Figma 10:203, ассет скачан в src/assets/logo-star.svg). Заменить на финальный. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={cn('size-6', className)}>
      <path d="M12 1L14.37 6.27L19.78 4.22L17.73 9.63L23 12L17.73 14.37L19.78 19.78L14.37 17.73L12 23L9.63 17.73L4.22 19.78L6.27 14.37L1 12L6.27 9.63L4.22 4.22L9.63 6.27L12 1Z" fill="var(--color-white)" />
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="var(--color-accent-500)" />
    </svg>
  );
}

export function Logo({ onDark, compact, className }: { onDark?: boolean; compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center', compact ? 'gap-2' : 'gap-2.5', className)}>
      <span className={cn('flex items-center justify-center bg-primary-500', compact ? 'size-[34px] rounded-[10px]' : 'size-10 rounded-md')}>
        <LogoMark className={compact ? 'size-5' : 'size-6'} />
      </span>
      <span className="flex flex-col">
        <span className={cn('font-extrabold', compact ? 'text-[15px] leading-[22px]' : 'text-h5', onDark ? 'text-white' : 'text-dark-900')}>Samanid</span>
        <span className={cn('font-bold tracking-[3px] text-primary-500', compact ? 'text-[10px] leading-[14px]' : 'text-caption')}>TRAVEL</span>
      </span>
    </span>
  );
}

export interface NavItem { href: string; label: string; active?: boolean }

export function LanguageMenu({ value, options, onChange, label }: {
  value: string; options: { code: string; name: string }[]; onChange: (code: string) => void; label: string;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger aria-label={label} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2.5 text-body-s-medium text-dark-900 hover:bg-dark-100 focus-visible:focus-ring">
        <Globe className="size-[18px]" aria-hidden="true" />{value.toUpperCase()}<ChevronDown className="size-4" aria-hidden="true" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 flex w-[220px] flex-col gap-0.5 rounded-lg border border-dark-200 bg-white p-2 shadow-lg">
          {options.map((o) => (
            <DropdownMenu.Item
              key={o.code}
              onSelect={() => onChange(o.code)}
              className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 outline-none data-[highlighted]:bg-dark-100', o.code === value && 'bg-primary-50')}
            >
              <span className={cn('text-body-s-medium', o.code === value ? 'text-primary-600' : 'text-dark-500')}>{o.code.toUpperCase()}</span>
              <span className="flex-1 text-body-m text-dark-900">{o.name}</span>
              {o.code === value && <Check className="size-[18px] text-primary-500" aria-hidden="true" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export interface HeaderProps {
  nav: NavItem[];
  language: { value: string; options: { code: string; name: string }[]; onChange: (c: string) => void; label: string };
  user?: { initials: string; name: string; href: string };
  loginLabel: string; loginHref: string;
  favoritesLabel: string; favoritesHref: string;
  menuLabel: string; onMenuClick?: () => void;
  homeHref?: string; Link?: LinkComponent;
}

/** Figma: Header 10:314 (Guest/User, Mobile). Высота 80 / 64, липкая при скролле. Активный пункт — синий. */
export function Header({ nav, language, user, loginLabel, loginHref, favoritesLabel, favoritesHref, menuLabel, onMenuClick, homeHref = '/', Link = DefaultLink }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-dark-200 bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:h-20 md:px-20">
        <Link href={homeHref} aria-label="Samanid Travel" className="rounded-md focus-visible:focus-ring">
          <Logo compact className="md:hidden" />
          <Logo className="max-md:hidden" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-9 xl:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={n.active ? 'page' : undefined}
              className={cn('text-body-m-medium whitespace-nowrap rounded-xs focus-visible:focus-ring', n.active ? 'text-primary-500' : 'text-dark-700 hover:text-dark-900')}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 md:gap-3">
          <span className="hidden md:block"><LanguageMenu {...language} /></span>
          <Link href={favoritesHref} aria-label={favoritesLabel} className="inline-flex size-10 items-center justify-center rounded-full text-dark-900 hover:bg-dark-100 focus-visible:focus-ring">
            <Heart className="size-5" aria-hidden="true" />
          </Link>
          {user ? (
            <Link href={user.href} className="hidden items-center gap-2.5 rounded-full border border-dark-200 py-1 pr-3.5 pl-1 focus-visible:focus-ring md:inline-flex">
              <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-caption text-primary-600">{user.initials}</span>
              <span className="text-body-s-medium text-dark-900">{user.name}</span>
              <ChevronDown className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <Link href={loginHref} className="hidden min-h-11 items-center rounded-full border-[1.5px] border-primary-500 bg-white px-5 text-button-m text-primary-500 hover:bg-primary-50 focus-visible:focus-ring md:inline-flex">
              {loginLabel}
            </Link>
          )}
          <IconButton label={menuLabel} onClick={onMenuClick} className="xl:hidden"><Menu className="size-5" aria-hidden="true" /></IconButton>
        </div>
      </div>
    </header>
  );
}

export function Breadcrumbs({ items, label, Link = DefaultLink }: { items: { label: string; href?: string }[]; label: string; Link?: LinkComponent }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-2 text-body-s">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-2">
              {it.href && !last ? <Link href={it.href} className="text-dark-500 hover:text-dark-900 focus-visible:focus-ring rounded-xs">{it.label}</Link>
                : <span aria-current={last ? 'page' : undefined} className={last ? 'text-dark-900' : 'text-dark-500'}>{it.label}</span>}
              {!last && <ChevronRight className="size-3.5 text-dark-400" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Pagination({ page, pageCount, onChange, labels }: {
  page: number; pageCount: number; onChange: (p: number) => void; labels: { nav: string; prev: string; next: string };
}) {
  const pages: (number | '…')[] = [];
  const add = (p: number | '…') => { if (pages[pages.length - 1] !== p) pages.push(p); };
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) add(p);
    else add('…');
  }
  const arrow = 'inline-flex size-10 items-center justify-center rounded-full border border-dark-200 bg-white text-dark-900 hover:bg-dark-100 focus-visible:focus-ring disabled:text-dark-300 disabled:hover:bg-white';
  return (
    <nav aria-label={labels.nav} className="flex items-center gap-2">
      <button type="button" className={arrow} aria-label={labels.prev} disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft className="size-5" aria-hidden="true" /></button>
      {pages.map((p, i) => p === '…'
        ? <span key={`e${i}`} className="flex size-10 items-center justify-center text-body-s-medium text-dark-700" aria-hidden="true">…</span>
        : <button key={p} type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
            className={cn('flex size-10 items-center justify-center rounded-full text-body-s-medium focus-visible:focus-ring', p === page ? 'bg-primary-500 text-white' : 'text-dark-700 hover:bg-dark-100')}>{p}</button>)}
      <button type="button" className={arrow} aria-label={labels.next} disabled={page >= pageCount} onClick={() => onChange(page + 1)}><ChevronRight className="size-5" aria-hidden="true" /></button>
    </nav>
  );
}

/** Stepper шагов бронирования: desktop — 5 шагов, mobile — «Шаг N из 5» + полоса прогресса. */
export function Stepper({ steps, current, stepOfLabel, label }: {
  steps: string[]; current: number /* 1-based */; stepOfLabel: string; label: string;
}) {
  const total = steps.length;
  return (
    <nav aria-label={label}>
      <div className="flex flex-col gap-2.5 md:hidden">
        <div className="flex items-start justify-between">
          <span className="text-caption text-dark-500">{stepOfLabel}</span>
          <span className="text-body-s-medium text-dark-900">{steps[current - 1]}</span>
        </div>
        <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current} aria-label={label} className="h-1.5 w-full overflow-hidden rounded-[3px] bg-dark-200">
          <div className="h-full rounded-[3px] bg-primary-500" style={{ width: `${(current / total) * 100}%` }} />
        </div>
      </div>
      <ol className="hidden items-center gap-3 md:flex">
        {steps.map((s, i) => {
          const n = i + 1;
          const done = n < current, cur = n === current;
          return (
            <li key={s} className={cn('flex items-center gap-3', i < total - 1 && 'flex-1')} aria-current={cur ? 'step' : undefined}>
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true" className={cn('flex size-8 items-center justify-center rounded-full text-body-s-medium',
                  done && 'bg-primary-500 text-white', cur && 'border-4 border-primary-100 bg-primary-500 text-white', !done && !cur && 'border-[1.5px] border-dark-300 bg-white text-dark-500')}>
                  {done ? <Check className="size-4" /> : n}
                </span>
                <span className={cn('text-body-s whitespace-nowrap', cur ? 'font-semibold text-dark-900' : done ? 'text-dark-900' : 'text-dark-500')}>{s}</span>
              </span>
              {i < total - 1 && <span aria-hidden="true" className={cn('h-0.5 min-w-4 flex-1 rounded-[1px]', done ? 'bg-primary-500' : 'bg-dark-200')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export interface FooterProps {
  description: string;
  columns: { title: string; links: { label: string; href: string }[] }[];
  contacts: { title: string; phone: string; email: string; address: string; hours: string };
  social: { label: string; href: string; icon: 'send' | 'mail' | 'phone' }[];
  copyright: string; payments: string[]; Link?: LinkComponent;
}

const socialIcon = { send: Send, mail: Mail, phone: Phone };

export function Footer({ description, columns, contacts, social, copyright, payments, Link = DefaultLink }: FooterProps) {
  const linkCls = 'text-body-s text-dark-300 hover:text-white focus-visible:focus-ring rounded-xs';
  return (
    <footer className="bg-dark-900">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-10 md:px-20 md:py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="flex max-w-[340px] flex-col gap-5">
            <Logo onDark />
            <p className="text-body-s text-dark-400">{description}</p>
            <div className="flex gap-3">
              {social.map((s) => { const I = socialIcon[s.icon]; return (
                <Link key={s.label} href={s.href} aria-label={s.label} className="flex size-10 items-center justify-center rounded-full bg-dark-700 text-white focus-visible:focus-ring"><I className="size-[18px]" aria-hidden="true" /></Link>
              ); })}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-8 lg:gap-14">
            {columns.map((c) => (
              <div key={c.title} className="flex flex-col gap-3.5">
                <p className="text-h6 text-white">{c.title}</p>
                <ul className="flex flex-col gap-3.5">{c.links.map((l) => <li key={l.href + l.label}><Link href={l.href} className={linkCls}>{l.label}</Link></li>)}</ul>
              </div>
            ))}
            <div className="flex flex-col gap-3.5">
              <p className="text-h6 text-white">{contacts.title}</p>
              <ul className="flex flex-col gap-3.5 text-body-s text-dark-300">
                <li className="flex items-center gap-2"><Phone className="size-4" aria-hidden="true" />{contacts.phone}</li>
                <li className="flex items-center gap-2"><Mail className="size-4" aria-hidden="true" />{contacts.email}</li>
                <li className="flex items-center gap-2"><MapPin className="size-4" aria-hidden="true" />{contacts.address}</li>
                <li className="flex items-center gap-2"><Clock className="size-4" aria-hidden="true" />{contacts.hours}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="h-px bg-dark-700" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-caption text-dark-400">{copyright}</p>
          <ul className="flex gap-2">{payments.map((p) => <li key={p} className="rounded-xs bg-dark-700 px-2.5 py-1 text-caption text-dark-200">{p}</li>)}</ul>
        </div>
      </div>
    </footer>
  );
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1440px] px-4 md:px-20', className)}>{children}</div>;
}
