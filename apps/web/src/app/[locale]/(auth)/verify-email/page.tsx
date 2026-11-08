import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { VerifyEmail } from '@/components/auth/AuthForms';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; const t = await getTranslations({ locale, namespace: 'auth.verify' }); return { title: t('meta'), robots: { index: false } }; }
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string }> }) { const { locale } = await params; setRequestLocale(locale); const { email } = await searchParams; return <VerifyEmail email={email ?? ''} />; }
