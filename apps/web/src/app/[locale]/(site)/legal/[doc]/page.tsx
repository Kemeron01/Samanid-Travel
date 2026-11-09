import { api, legalSlugs, type ContentLang } from '@samanid/api';
import { locales } from '@samanid/i18n';
import { PageContainer } from '@samanid/ui';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LegalView } from '@/components/service/LegalView';
import { alternates } from '@/lib/seo';

export function generateStaticParams() { return locales.flatMap((locale) => legalSlugs.map((doc) => ({ locale, doc }))); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; doc: string }> }): Promise<Metadata> {
  const { locale, doc } = await params; const d = await api.content.legal(doc, locale as ContentLang);
  return d ? { title: d.title, description: d.sections[0]?.summary, alternates: alternates(locale, `/legal/${doc}`) } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ locale: string; doc: string }> }) {
  const { locale, doc } = await params; setRequestLocale(locale);
  const docs = await api.content.legalAll(doc);
  if (!docs) notFound();
  return <PageContainer className="pt-6 pb-16 md:pt-12 md:pb-24"><LegalView docs={docs} /></PageContainer>;
}
