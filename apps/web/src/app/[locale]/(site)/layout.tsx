import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { WaitlistBanner } from '@/components/waitlist/WaitlistBanner';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WaitlistBanner />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
