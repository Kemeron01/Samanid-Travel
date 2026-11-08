'use client';
import { Logo, Media, cn } from '@samanid/ui';
import { locales, type Locale } from '@samanid/i18n';
import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';

/** Каркас экранов 3.1–3.5: фото с цитатой слева (на mobile скрыто), форма справа, переключатель языка. */
export function AuthShell({ children, icon, iconTone = 'blue' }: { children: ReactNode; icon?: ReactNode; iconTone?: 'blue' | 'green' }) {
  const t = useTranslations('auth'); const locale = useLocale() as Locale; const router = useRouter(); const pathname = usePathname();
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[640fr_800fr]">
      <aside className="relative hidden overflow-hidden text-white lg:block">
        <Media tone="night" caption={t('photo')} className="absolute inset-0" />
        <div className="absolute inset-0 flex flex-col justify-between p-12">
          <Link href="/" aria-label="Samanid Travel" className="self-start rounded-md focus-visible:focus-ring"><Logo onDark /></Link>
          <figure className="max-w-[460px]"><blockquote className="text-h3 text-white">{t('quote')}</blockquote><figcaption className="mt-3 text-body-s text-dark-200">{t('quoteAuthor')}</figcaption></figure>
        </div>
      </aside>
      <main id="main" className="flex flex-col px-4 py-6 md:px-12 md:py-10">
        <div className="flex items-center justify-between lg:justify-end">
          <Link href="/" aria-label="Samanid Travel" className="rounded-md focus-visible:focus-ring lg:hidden"><Logo compact /></Link>
          <nav aria-label="Language" className="flex items-center gap-1 text-caption text-dark-700"><Globe className="size-4" aria-hidden="true" />
            {locales.map((l, i) => <span key={l} className="flex items-center gap-1">{i > 0 && <span aria-hidden="true">·</span>}<button type="button" aria-current={l === locale ? 'true' : undefined} onClick={() => router.replace(pathname as never, { locale: l })} className={cn('min-h-8 rounded-xs px-0.5 uppercase focus-visible:focus-ring', l === locale && 'font-bold text-dark-900')}>{l}</button></span>)}</nav>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center gap-6 py-8">
          {icon && <span aria-hidden="true" className={cn('flex size-14 items-center justify-center rounded-lg [&>svg]:size-6', iconTone === 'green' ? 'bg-success-100 text-success-700' : 'bg-primary-50 text-primary-500')}>{icon}</span>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function GoogleButton({ onClick, label, loading }: { onClick: () => void; label: string; loading?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-dark-200 bg-white text-button-l text-dark-900 hover:bg-dark-100 focus-visible:focus-ring disabled:opacity-60">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
      {label}
    </button>
  );
}
export const Divider = ({ label }: { label: string }) => <div className="flex items-center gap-3 text-caption text-dark-500" role="separator"><span className="h-px flex-1 bg-dark-200" />{label}<span className="h-px flex-1 bg-dark-200" /></div>;

export function StrengthMeter({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <p className="text-caption text-dark-500">{label}</p>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-1 rounded-full', i < score ? (score >= 3 ? 'bg-success-600' : score === 2 ? 'bg-warning-500' : 'bg-error-600') : 'bg-dark-200')} />)}</div>
    </div>
  );
}
