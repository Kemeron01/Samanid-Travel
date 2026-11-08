import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ResetForm } from '@/components/auth/AuthForms';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; const t = await getTranslations({ locale, namespace: 'auth.reset' }); return { title: t('meta'), robots: { index: false } }; }
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string }> }) { const { locale } = await params; setRequestLocale(locale); const { token } = await searchParams; return <ResetForm token={token ?? ''} />; }
