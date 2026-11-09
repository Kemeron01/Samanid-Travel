'use client';
import { PageContainer, cn } from '@samanid/ui';
import { api } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronRight, Copy, CreditCard, Gift, Heart, Loader2, LogOut, Settings, Star, Ticket, Users, ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, type ReactNode } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { compact } from '@/lib/format';
import { useSession } from '@/lib/session';

export const NAV = [
  { key: 'orders', href: '/account/orders', I: Ticket }, { key: 'installments', href: '/account/installments', I: CreditCard },
  { key: 'favorites', href: '/account/favorites', I: Heart }, { key: 'bonuses', href: '/account/bonuses', I: Gift },
  { key: 'waitlist', href: '/account/waitlist', I: Users }, { key: 'reviews', href: '/account/reviews', I: Star },
  { key: 'notifications', href: '/account/notifications', I: Bell }, { key: 'profile', href: '/account/profile', I: Settings },
] as const;

export function useCounts() {
  const { status } = useSession();
  const o = useQuery({ queryKey: ['me', 'orders', 'upcoming'], queryFn: () => api.me.orders('upcoming'), enabled: status === 'auth' });
  const i = useQuery({ queryKey: ['me', 'installments'], queryFn: () => api.me.installments(), enabled: status === 'auth' });
  const w = useQuery({ queryKey: ['me', 'waitlist'], queryFn: () => api.me.waitlist(), enabled: status === 'auth' });
  return { orders: o.data?.counts.upcoming ?? 0, installments: i.data?.length ?? 0, waitlist: w.data?.filter((x) => x.status !== 'expired').length ?? 0 } as Record<string, number>;
}

/** Account / Sidebar (Figma 35:743). Активный пункт — по текущему пути. */
export function Sidebar() {
  const t = useTranslations('account'); const locale = useLocale() as Locale; const pathname = usePathname(); const router = useRouter();
  const { user, logout } = useSession(); const counts = useCounts();
  if (!user) return null;
  return (
    <nav aria-label={t('menu')} className="flex flex-col gap-1 rounded-2xl border border-dark-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-3 px-2 py-2"><span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-primary-50 text-h6 text-primary-600">{user.first_name[0]}{user.last_name[0]}</span>
        <div><p className="text-body-m-medium text-dark-900">{user.first_name} {user.last_name}</p><p className="text-caption text-accent-600">{t('points', { count: compact(user.points, locale) })}</p></div></div>
      <ul className="flex flex-col gap-1">{NAV.map(({ key, href, I }) => { const active = pathname.startsWith(href); const n = counts[key] ?? 0; return (
        <li key={key}><Link href={href as never} aria-current={active ? 'page' : undefined} className={cn('flex min-h-11 items-center gap-3 rounded-md px-3 text-body-s focus-visible:focus-ring', active ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-dark-700 hover:bg-dark-100')}>
          <I className="size-5" aria-hidden="true" /><span className="flex-1">{t(`nav.${key}`)}</span>{n > 0 && <span className={cn('min-w-6 rounded-full px-1.5 text-center text-caption', active ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-600')}>{n}</span>}</Link></li>); })}</ul>
      <hr className="my-2 border-dark-200" />
      <button type="button" onClick={async () => { await logout(); router.replace('/' as never); }} className="flex min-h-11 items-center gap-3 rounded-md px-3 text-body-s text-error-600 hover:bg-error-100 focus-visible:focus-ring"><LogOut className="size-5" aria-hidden="true" />{t('logout')}</button>
    </nav>
  );
}

/** Каркас кабинета: защита (редирект на вход), сайдбар на desktop, контент. */
export function AccountShell({ children }: { children: ReactNode }) {
  const { status } = useSession(); const router = useRouter(); const pathname = usePathname(); const t = useTranslations('checkout.errors'); const tm = useTranslations('account');
  useEffect(() => { if (status === 'guest') router.replace({ pathname: '/login', query: { next: pathname } } as never); }, [status, pathname, router]);
  if (status !== 'auth') return <PageContainer className="flex items-center justify-center gap-3 py-24 text-dark-600"><Loader2 className="size-5 animate-spin" aria-hidden="true" /><span role="status">{t('loading')}</span></PageContainer>;
  return (
    <PageContainer className="grid gap-8 pb-20 md:pt-10 lg:grid-cols-[280px_1fr]">
      <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start"><Sidebar /></div>
      <div className="min-w-0">
        {/* Mobile (39:2278): панель «← Раздел» вместо шапки сайта; на планшете — ссылка «← Личный кабинет». */}
        {pathname !== '/account' && <div className="sticky top-0 z-40 -mx-4 mb-4 flex h-16 items-center gap-3 bg-white px-4 md:hidden"><Link href="/account" aria-label={tm('meta')} className="inline-flex rounded-xs text-dark-900 focus-visible:focus-ring"><ArrowLeft className="size-6" aria-hidden="true" /></Link><span className="text-h5 text-dark-900">{(() => { const n = NAV.find((x) => pathname.startsWith(x.href)); return n ? tm(`nav.${n.key}`) : tm('meta'); })()}</span></div>}
        {pathname !== '/account' && <Link href="/account" className="mb-4 inline-flex min-h-10 items-center gap-2 text-body-s text-dark-700 max-md:hidden lg:hidden"><ChevronRight className="size-4 rotate-180" aria-hidden="true" />{tm('meta')}</Link>}
        {children}
      </div>
    </PageContainer>
  );
}

/** 3.15: меню кабинета на mobile. */
export function MobileMenu() {
  const t = useTranslations('account'); const locale = useLocale() as Locale; const { user, logout } = useSession(); const counts = useCounts(); const router = useRouter();
  const { data: b } = useQuery({ queryKey: ['me', 'bonuses'], queryFn: () => api.me.bonuses() });
  if (!user) return null;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 rounded-2xl border border-dark-200 bg-white p-4"><span aria-hidden="true" className="flex size-[52px] items-center justify-center rounded-full bg-primary-50 text-h5 text-primary-600">{user.first_name[0]}{user.last_name[0]}</span><div><p className="text-h6 text-dark-900">{user.first_name} {user.last_name}</p><p className="text-body-s text-dark-500">{user.email}</p></div></div>
      <div className="flex items-center gap-3 rounded-2xl bg-primary-500 p-4 text-white"><Gift className="size-6" aria-hidden="true" /><div className="flex-1"><p className="text-h5">{t('points', { count: compact(user.points, locale) })}</p><p className="text-caption text-primary-100">{t('friendCode', { code: b?.code ?? user.referral_code })}</p></div>
        <button type="button" aria-label={t('copy')} onClick={() => void navigator.clipboard?.writeText(b?.code ?? user.referral_code)} className="inline-flex size-10 items-center justify-center rounded-full focus-visible:focus-ring"><Copy className="size-5" aria-hidden="true" /></button></div>
      <ul className="overflow-hidden rounded-2xl border border-dark-200 bg-white">{NAV.filter((x) => x.key !== 'bonuses').map(({ key, href, I }) => { const n = counts[key] ?? 0; return (
        <li key={key} className="border-b border-dark-100 last:border-0"><Link href={href as never} className="flex min-h-14 items-center gap-4 px-5 text-body-m text-dark-900 focus-visible:focus-ring"><I className="size-6" aria-hidden="true" /><span className="flex-1">{t(`nav.${key}`)}</span>{n > 0 && <span className="min-w-6 rounded-full bg-accent-500 px-1.5 text-center text-caption text-dark-900">{n}</span>}<ChevronRight className="size-5 text-dark-400" aria-hidden="true" /></Link></li>); })}</ul>
      <button type="button" onClick={async () => { await logout(); router.replace('/' as never); }} className="flex min-h-12 items-center gap-3 px-3 text-body-m text-error-600"><LogOut className="size-5" aria-hidden="true" />{t('logout')}</button>
    </div>
  );
}

export const PageTitle = ({ title, lead, back }: { title: string; lead?: string; back?: ReactNode }) => (
  <div className="mb-6 max-md:mb-4">{back}<h1 className="text-h3 text-dark-900 max-md:sr-only md:text-h1">{title}</h1>{lead && <p className="mt-1 text-body-s text-dark-500 md:text-body-m">{lead}</p>}</div>
);
