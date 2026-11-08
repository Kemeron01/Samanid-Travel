'use client';
import { Header, Modal, cn } from '@samanid/ui';
import { locales, type Locale } from '@samanid/i18n';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { AppLink } from '@/lib/ui-link';
import { useSession } from '@/lib/session';

const langNames: Record<Locale, string> = { ru: 'Русский', uz: 'Oʻzbekcha', en: 'English' };

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const { user } = useSession();
  const nav = [
    { href: '/tours', label: t('header.nav.tours') },
    { href: '/transfer', label: t('header.nav.transfers') },
    { href: '/destinations', label: t('header.nav.destinations') },
    { href: '/addons', label: t('header.nav.addons') },
    { href: '/about', label: t('header.nav.about') },
  ].map((n) => ({ ...n, active: pathname.startsWith(n.href) }));

  const changeLocale = (code: string) => router.replace(pathname as never, { locale: code as Locale });

  return (
    <>
      <Header
        nav={nav}
        language={{ value: locale, options: locales.map((c) => ({ code: c, name: langNames[c] })), onChange: changeLocale, label: t('a11y.language') }}
        user={user ? { initials: `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase(), name: user.first_name, href: '/account' } : undefined}
        loginLabel={t('header.login')} loginHref="/login"
        favoritesLabel={t('a11y.favorites')} favoritesHref="/account/favorites"
        menuLabel={t('a11y.openMenu')} onMenuClick={() => setMenu(true)}
        Link={AppLink}
      />
      <Modal open={menu} onOpenChange={setMenu} title="Samanid Travel" closeLabel={t('a11y.closeMenu')}>
        <nav aria-label="Main" className="flex flex-col">
          {nav.map((n) => (
            <Link key={n.href} href={n.href as never} onClick={() => setMenu(false)} aria-current={n.active ? 'page' : undefined}
              className={cn('flex min-h-12 items-center border-b border-dark-100 text-body-m-medium', n.active ? 'text-primary-500' : 'text-dark-900')}>
              {n.label}
            </Link>
          ))}
          <Link href={(user ? '/account' : '/login') as never} onClick={() => setMenu(false)} className="flex min-h-12 items-center text-body-m-medium text-primary-500">{user ? t('account.meta') : t('header.login')}</Link>
        </nav>
        <div className="flex gap-2" role="group" aria-label={t('a11y.language')}>
          {locales.map((c) => (
            <button key={c} type="button" aria-pressed={c === locale} onClick={() => { changeLocale(c); setMenu(false); }}
              className={cn('min-h-11 flex-1 rounded-full border text-body-s-medium', c === locale ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-dark-200 text-dark-700')}>
              {c.toUpperCase()}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
