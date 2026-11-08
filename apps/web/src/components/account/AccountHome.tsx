'use client';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { MobileMenu } from './AccountShell';

/** /account: на desktop сразу «Мои заказы», на mobile — меню разделов (3.15). */
export function AccountHome() {
  const router = useRouter(); const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => { const m = window.matchMedia('(min-width: 1024px)'); if (m.matches) router.replace('/account/orders' as never); else setMobile(true); }, [router]);
  return mobile ? <MobileMenu /> : null;
}
