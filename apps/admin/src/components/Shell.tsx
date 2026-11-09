import { adminApi, type NotificationKind } from '@samanid/api/admin';
import { locales, type Locale } from '@samanid/i18n';
import { Logo, Popover, cn } from '@samanid/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, LogOut, RefreshCw, Search, ShieldAlert, Star, User, XCircle } from 'lucide-react';
import { Suspense, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { visibleNav } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { Loading } from '@/lib/ui';
import { useFmt } from '@/lib/format';

/** Тег ADMIN рядом с логотипом (Figma 43:1409): accent-500, тёмный текст. */
export const AdminTag = () => <span className="rounded-xs bg-accent-500 px-1.5 py-0.5 text-caption text-dark-900">ADMIN</span>;

function Sidebar() {
  const { t } = useTranslation(); const { session, logout } = useSession(); const nav = useNavigate();
  const badges = useQuery({ queryKey: ['badges'], queryFn: adminApi.badges, refetchInterval: 60_000 });
  const groups = visibleNav(session?.perms);
  const initials = session?.staff.name.split(' ').map((p) => p[0]).join('').slice(0, 2) ?? '';
  return (
    <aside className="sticky top-0 flex h-dvh w-[264px] shrink-0 flex-col bg-dark-900 px-4 py-5">
      <div className="flex items-center gap-2 pb-5 pl-2"><Logo onDark /><AdminTag /></div>
      <nav aria-label={t('shell.menu')} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:thin]">
        {groups.map((g) => (
          <div key={g.key ?? 'root'} className="flex flex-col gap-1">
            {g.key && <p className="pt-4 pb-1.5 pl-3 text-overline uppercase text-dark-500">{t(`nav.${g.key}`)}</p>}
            {g.items.map((i) => {
              const count = i.badge ? badges.data?.[i.badge] : undefined;
              return (
                <NavLink key={i.key} to={i.to} end={false}
                  className={({ isActive }) => cn('flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-body-s-medium focus-visible:focus-ring', isActive ? 'bg-primary-500 text-white' : 'text-dark-300 hover:bg-dark-700/60 hover:text-white')}>
                  <i.icon aria-hidden="true" className="size-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t(`nav.${i.key}`)}</span>
                  {count ? <span className="rounded-full bg-accent-500 px-2 py-0.5 text-caption text-dark-900"><span aria-hidden="true">{count}</span><span className="sr-only">{t('shell.newBadge', { count })}</span></span> : null}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      {session && (
        <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-dark-700 p-3">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-caption text-white">{initials}</span>
          <span className="flex min-w-0 flex-1 flex-col"><span className="truncate text-body-s-medium text-white">{session.staff.name}</span><span className="text-caption text-dark-400">{t(`roles.${session.staff.role}`)}</span></span>
          <button type="button" aria-label={t('shell.logout')} onClick={async () => { await logout(); nav('/login'); }} className="inline-flex size-9 items-center justify-center rounded-full text-dark-300 hover:bg-dark-900 hover:text-white focus-visible:focus-ring"><LogOut className="size-[18px]" /></button>
        </div>
      )}
    </aside>
  );
}

function Topbar() {
  const { t, i18n } = useTranslation(); const nav = useNavigate(); const [q, setQ] = useState('');
  const submit = (e: FormEvent) => { e.preventDefault(); if (q.trim()) nav(`/orders?q=${encodeURIComponent(q.trim())}`); };
  return (
    <header className="flex items-center gap-4 border-b border-dark-200 bg-white px-8 py-3.5">
      <form role="search" onSubmit={submit} className="w-[420px] max-w-full">
        <label className="flex h-[52px] items-center gap-2.5 rounded-md border border-dark-200 bg-white px-4 focus-within:focus-ring">
          <Search aria-hidden="true" className="size-5 text-dark-500" />
          <span className="sr-only">{t('shell.search')}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('shell.search')} className="min-w-0 flex-1 bg-transparent text-body-m outline-none placeholder:text-dark-400" />
        </label>
      </form>
      <div className="flex-1" />
      <label className="relative">
        <span className="sr-only">{t('shell.language')}</span>
        <select value={i18n.resolvedLanguage} onChange={(e) => void i18n.changeLanguage(e.target.value as Locale)} className="h-10 cursor-pointer appearance-none rounded-full bg-transparent px-3 text-body-s-medium text-dark-700 uppercase hover:bg-dark-100 focus-visible:focus-ring">
          {locales.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
        </select>
      </label>
      <Notifications />
    </header>
  );
}

const notifIcon: Record<NotificationKind, typeof Bell> = { individual_request: User, fraud: ShieldAlert, manual_refund: RefreshCw, overdue: AlertTriangle, review_pending: Star, webhook_failed: XCircle };
const notifTone: Record<NotificationKind, string> = { individual_request: 'text-warning-700', fraud: 'text-error-700', manual_refund: 'text-primary-600', overdue: 'text-error-700', review_pending: 'text-accent-600', webhook_failed: 'text-error-700' };

/** Колокольчик топбара: список событий по правам роли (данные из API), точка — только при непрочитанных. */
function Notifications() {
  const { t } = useTranslation(); const f = useFmt(); const nav = useNavigate(); const qc = useQueryClient(); const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => adminApi.notifications.list(), refetchInterval: 60_000 });
  const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const unread = q.data?.unread ?? 0;
  const go = async (n: { id: string; href: string; read: boolean }) => { setOpen(false); if (!n.read) { await adminApi.notifications.markRead(n.id); void refresh(); } nav(n.href); };
  const text = (n: { kind: NotificationKind; params: Record<string, string | number> }) => t(`shell.notif.${n.kind}`, { ...n.params, ...(typeof n.params.number === 'string' ? { number: n.params.number.replace(/-/g, '\u2011') } : {}), ...(typeof n.params.amount === 'number' ? { amount: f.money(n.params.amount) } : {}) });
  return (
    <Popover open={open} onOpenChange={setOpen} align="end" className="w-[380px] p-0"
      triggerLabel={unread ? t('shell.notificationsUnread', { count: unread }) : t('shell.notifications')}
      triggerClassName="relative inline-flex size-10 items-center justify-center rounded-full text-dark-900 hover:bg-dark-100 focus-visible:focus-ring data-[state=open]:bg-dark-100"
      trigger={<><Bell aria-hidden="true" className="size-[22px]" />{unread > 0 && <span aria-hidden="true" className="absolute top-2 right-2.5 size-2 rounded-full bg-error-600" />}</>}>
      <div className="flex items-center justify-between gap-3 border-b border-dark-200 px-4 py-3">
        <p className="text-h6 text-dark-900">{t('shell.notifications')}</p>
        {unread > 0 && <button type="button" onClick={async () => { await adminApi.notifications.markAllRead(); void refresh(); }} className="rounded-xs text-body-s-medium text-primary-500 hover:underline focus-visible:focus-ring">{t('shell.notifMarkAll')}</button>}
      </div>
      {!q.data ? <div className="p-4"><Loading rows={3} /></div> : q.data.items.length === 0 ? <p className="px-4 py-8 text-center text-body-s text-dark-500">{t('shell.notifEmpty')}</p> : (
        <ul className="max-h-[420px] overflow-y-auto py-1">
          {q.data.items.map((n) => { const I = notifIcon[n.kind]; return (
            <li key={n.id}><button type="button" onClick={() => void go(n)} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-dark-100 focus-visible:bg-dark-100 focus-visible:outline-none', !n.read && 'bg-primary-50/60')}>
              <span aria-hidden="true" className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-page"><I className={cn('size-[18px]', notifTone[n.kind])} /></span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className={cn('text-body-s text-dark-900', !n.read && 'font-semibold')}>{text(n)}</span><span className="text-caption text-dark-500">{f.dayTime(n.at)}</span></span>
              {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary-500"><span className="sr-only">{t('shell.notifUnreadLabel')}</span></span>}
            </button></li>); })}
        </ul>
      )}
    </Popover>
  );
}

/** Каркас админки: защищённый маршрут. Без сессии — на вход. */
export function Shell() {
  const { session } = useSession(); const loc = useLocation(); const { t } = useTranslation();
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return (
    <div className="flex min-h-dvh bg-bg-page">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">{t('shell.skip')}</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main id="main" className="flex min-w-0 flex-col gap-6 p-8">
          <Suspense fallback={<Loading rows={6} />}><Outlet /></Suspense>
        </main>
      </div>
    </div>
  );
}
