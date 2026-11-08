import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginForm } from '@/components/auth/AuthForms';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; const t = await getTranslations({ locale, namespace: 'auth.login' }); return { title: t('meta'), robots: { index: false } }; }
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) { const { locale } = await params; setRequestLocale(locale); const { next } = await searchParams; return <LoginForm next={next} />; }
