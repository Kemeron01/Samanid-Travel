import type { Perm } from '@samanid/api/admin';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { can, homeFor } from '@/lib/rbac';
import { useSession } from '@/lib/session';
import { outlineBtn } from '@/lib/ui';

/** Маршрут виден только при наличии права (UI); сервер мока тоже проверяет права. */
export function Guard({ perm, children }: { perm: Perm | Perm[]; children: ReactNode }) {
  const { session } = useSession();
  const ok = (Array.isArray(perm) ? perm : [perm]).some((p) => can(session?.perms, p));
  return ok ? <>{children}</> : <NotFound />;
}
export function Home() { const { session } = useSession(); return <Navigate to={homeFor(session?.perms)} replace />; }
export function NotFound() {
  const { t } = useTranslation();
  return <div className="flex flex-col items-start gap-4 py-16"><h1 className="text-h3 text-dark-900">{t('notFound.title')}</h1><Link to="/" className={outlineBtn}>{t('notFound.back')}</Link></div>;
}

/** /security → первая доступная вкладка (роли — только с правом system). */
export function SecurityIndex() { const { session } = useSession(); return <Navigate to={can(session?.perms, 'system') ? '/security/roles' : '/security/fraud'} replace />; }
