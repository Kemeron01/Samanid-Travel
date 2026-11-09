import { api, type ContentLang } from '@samanid/api';
import { PageContainer } from '@samanid/ui';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FaqView } from '@/components/service/FaqView';
import { alternates } from '@/lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params; const t = await getTranslations({ locale, namespace: 'service.faq' });
  return { title: t('meta'), alternates: alternates(locale, '/faq') };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const [t, items, c] = await Promise.all([getTranslations({ locale, namespace: 'service.faq' }), api.content.faq(locale as ContentLang), api.content.company()]);
  // FAQPage JSON-LD для поисковиков.
  const ld = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
  return (
    <PageContainer className="pt-6 pb-16 md:pt-14 md:pb-24">
      <div className="mx-auto flex max-w-[880px] flex-col gap-4">
        <h1 className="text-h2 text-dark-900 md:text-h1">{t('title')}</h1>
        <FaqView items={items} telegram={c.telegram} />
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </PageContainer>
  );
}
