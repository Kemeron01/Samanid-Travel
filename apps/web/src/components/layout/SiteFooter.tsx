'use client';
import { Footer } from '@samanid/ui';
import { useTranslations } from 'next-intl';
import { AppLink } from '@/lib/ui-link';

export function SiteFooter() {
  const t = useTranslations('footer');
  const l = (label: string, href: string) => ({ label, href });
  return (
    <Footer
      Link={AppLink}
      description={t('description')}
      social={[{ label: t('telegram'), href: 'https://t.me/', icon: 'send' }, { label: t('mail'), href: `mailto:${t('email')}`, icon: 'mail' }, { label: t('call'), href: `tel:${t('phone').replace(/\s/g, '')}`, icon: 'phone' }]}
      columns={[
        { title: t('travel'), links: [l(t('tours'), '/tours'), l(t('transfers'), '/transfer'), l(t('destinations'), '/destinations'), l(t('addons'), '/addons')] },
        { title: t('company'), links: [l(t('about'), '/about'), l(t('contactsLink'), '/contacts'), l(t('reviews'), '/reviews'), l(t('faq'), '/faq')] },
        { title: t('help'), links: [l(t('cancellation'), '/legal/cancellation'), l(t('privacy'), '/legal/privacy'), l(t('consent'), '/legal/consent'), l(t('verifyVoucher'), '/voucher')] },
      ]}
      contacts={{ title: t('contacts'), phone: t('phone'), email: t('email'), address: t('address'), hours: t('hours') }}
      copyright={t('copyright')}
      payments={['Visa', 'Mastercard', 'Uzcard', 'Humo']}
    />
  );
}
