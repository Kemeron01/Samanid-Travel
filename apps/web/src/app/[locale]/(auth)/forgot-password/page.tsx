import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForgotForm } from '@/components/auth/AuthForms';
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; const t = await getTranslations({ locale, namespace: 'auth.forgot' }); return { title: t('meta'), robots: { index: false } }; }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; setRequestLocale(locale); return <ForgotForm />; }
