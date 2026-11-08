'use client';
import type { LinkComponent } from '@samanid/ui';
import { Link } from '@/i18n/routing';

/** Адаптер locale-aware Link для компонентов @samanid/ui (они принимают строковый href). */
export const AppLink: LinkComponent = ({ href, children, ...rest }) => (
  <Link href={href as never} {...(rest as object)}>{children}</Link>
);
