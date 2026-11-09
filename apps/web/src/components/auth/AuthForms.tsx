'use client';
import { Alert, Button, Checkbox, Input } from '@samanid/ui';
import { AuthError, DEMO_EMAIL, DEMO_PASSWORD, api, passwordStrength } from '@samanid/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, Info, LockKeyhole, Mail, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/routing';
import { useSession } from '@/lib/session';
import { AuthShell, Divider, GoogleButton, StrengthMeter } from './AuthShell';

/** Поле пароля с кнопкой «показать». */
function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return <Input {...props} type={show ? 'text' : 'password'} trailing={<button type="button" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} onClick={() => setShow(!show)} className="inline-flex size-8 items-center justify-center rounded-full text-dark-500 focus-visible:focus-ring">{show ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}</button>} />;
}
/** Только внутренний путь (без //host); префикс локали снимаем — роутер next-intl добавит текущую локаль сам. */
const safeNext = (n?: string) => (n && n.startsWith('/') && !n.startsWith('//') ? n.replace(/^\/(ru|uz|en)(?=\/|$)/, '') || '/' : '/account');

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations('auth'); const router = useRouter(); const { setSession } = useSession();
  const [err, setErr] = useState<string>(); const [g, setG] = useState(false);
  const schema = useMemo(() => z.object({ email: z.string().min(1, t('required')).email(t('emailBad')), password: z.string().min(1, t('required')), remember: z.boolean() }), [t]);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', remember: true } });
  const onSubmit = handleSubmit(async (v) => {
    setErr(undefined);
    try { setSession(await api.auth.login(v.email, v.password)); router.replace(safeNext(next) as never); }
    catch (e) { const a = e as AuthError; setErr(a.code === 'locked' ? t('login.locked') : t('login.invalid', { left: a.attempts_left ?? 0 })); }
  });
  const google = async () => { setG(true); setSession(await api.auth.google()); router.replace(safeNext(next) as never); };
  return (
    <AuthShell>
      <div><h1 className="text-h2 text-dark-900">{t('login.title')}</h1><p className="mt-2 text-body-m text-dark-500 max-md:hidden">{t('login.lead')}</p></div>
      <GoogleButton label={t('google')} onClick={google} loading={g} />
      <Divider label={t('or')} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input type="email" autoComplete="email" label={t('email')} error={errors.email?.message} {...register('email')} />
        <PasswordInput autoComplete="current-password" label={t('password')} error={errors.password?.message ?? err} {...register('password')} />
        <div className="flex items-center justify-between gap-3">
          <Controller control={control} name="remember" render={({ field }) => <Checkbox className="max-md:hidden" label={t('login.remember')} checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />} />
          <Link href="/forgot-password" className="text-body-s-medium text-primary-500 focus-visible:focus-ring">{t('login.forgot')}</Link>
        </div>
        <Button type="submit" variant="secondary" size="L" loading={isSubmitting} className="w-full">{t('login.submit')}</Button>
      </form>
      <p className="text-center text-body-s text-dark-600">{t('login.noAccount')} <Link href="/register" className="font-semibold text-primary-500">{t('login.register')}</Link></p>
      {process.env.NODE_ENV !== 'production' && <p className="text-center text-caption text-dark-400">{t('login.demo', { email: DEMO_EMAIL, password: DEMO_PASSWORD })}</p>}
    </AuthShell>
  );
}

export function RegisterForm() {
  const t = useTranslations('auth'); const router = useRouter(); const { setSession } = useSession();
  const [err, setErr] = useState<string>();
  const schema = useMemo(() => z.object({
    first_name: z.string().min(1, t('required')), email: z.string().min(1, t('required')).email(t('emailBad')),
    password: z.string().min(1, t('required')).refine((p) => passwordStrength(p) >= 2, t('register.weak')), referral: z.string().optional(),
    consent: z.literal(true, { errorMap: () => ({ message: t('register.consentReq') }) }), marketing: z.boolean(),
  }), [t]);
  type F = z.infer<typeof schema>;
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { first_name: '', email: '', password: '', referral: '', consent: false as true, marketing: false } });
  const pwd = useWatch({ control, name: 'password' }); const score = passwordStrength(pwd ?? '');
  const onSubmit = handleSubmit(async (v) => {
    setErr(undefined);
    try { const r = await api.auth.register(v); router.push({ pathname: '/verify-email', query: { email: r.email } } as never); }
    catch (e) { setErr((e as AuthError).code === 'exists' ? t('register.exists') : t('register.weak')); }
  });
  return (
    <AuthShell>
      <div><h1 className="text-h2 text-dark-900">{t('register.title')}</h1><p className="mt-2 text-body-m text-dark-500 max-md:hidden">{t('register.lead')}</p></div>
      <GoogleButton label={t('google')} onClick={async () => { setSession(await api.auth.google()); router.replace('/account' as never); }} />
      <Divider label={t('or')} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Input autoComplete="given-name" label={t('register.name')} error={errors.first_name?.message} {...register('first_name')} />
        <Input type="email" autoComplete="email" label={t('email')} error={errors.email?.message ?? err} {...register('email')} />
        <div className="flex flex-col gap-2"><PasswordInput autoComplete="new-password" label={t('password')} error={errors.password?.message} {...register('password')} />
          {pwd && <StrengthMeter score={score} label={t(`register.strength.${score}` as never)} />}</div>
        <Input label={t('register.referral')} helper={t('register.referralHint', { points: 500 })} autoCapitalize="characters" {...register('referral')} />
        <Controller control={control} name="consent" render={({ field }) => <div><Checkbox label={t('register.consent')} checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} />{errors.consent && <p role="alert" className="text-caption text-error-700">{errors.consent.message}</p>}</div>} />
        <Controller control={control} name="marketing" render={({ field }) => <Checkbox label={t('register.marketing')} checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />} />
        <Button type="submit" variant="secondary" size="L" loading={isSubmitting} className="w-full">{t('register.submit')}</Button>
      </form>
      <p className="text-center text-body-s text-dark-600">{t('register.haveAccount')} <Link href="/login" className="font-semibold text-primary-500">{t('register.login')}</Link></p>
    </AuthShell>
  );
}

export function VerifyEmail({ email }: { email: string }) {
  const t = useTranslations('auth.verify'); const [left, setLeft] = useState(42);
  useEffect(() => { if (left <= 0) return; const h = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(h); }, [left]);
  const resend = async () => { const r = await api.auth.resendVerification(email); setLeft(r.next_in_seconds); };
  return (
    <AuthShell icon={<Mail />}>
      <div><h1 className="text-h2 text-dark-900">{t('title')}</h1><p className="mt-2 text-body-m text-dark-500">{t('text', { email, hours: 24 })}</p></div>
      <a href={`mailto:${email}`} className="flex min-h-12 items-center justify-center rounded-full bg-primary-500 text-button-l text-white focus-visible:focus-ring">{t('open')}</a>
      <p className="text-body-s text-dark-600" aria-live="polite">{t('noLetter')} {left > 0 ? <span className="text-dark-400">{t('resendIn', { time: `0:${String(left).padStart(2, '0')}` })}</span> : <button type="button" onClick={resend} className="font-semibold text-primary-500 focus-visible:focus-ring">{t('resend')}</button>}</p>
      <Alert type="info" title={t('spamTitle')}>{t('spamText', { from: 'hello@samanid.travel' })}</Alert>
    </AuthShell>
  );
}

export function ForgotForm() {
  const t = useTranslations('auth'); const [sent, setSent] = useState(false);
  const schema = useMemo(() => z.object({ email: z.string().min(1, t('required')).email(t('emailBad')) }), [t]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ resolver: zodResolver(schema) });
  return (
    <AuthShell icon={<LockKeyhole />}>
      <div><h1 className="text-h2 text-dark-900">{t('forgot.title')}</h1><p className="mt-2 text-body-m text-dark-500">{t('forgot.lead')}</p></div>
      {sent ? <Alert type="success" title={t('forgot.sent')} /> : (
        <form noValidate onSubmit={handleSubmit(async (v) => { await api.auth.forgot(v.email); setSent(true); })} className="flex flex-col gap-4">
          <Input type="email" autoComplete="email" label={t('email')} error={errors.email?.message} {...register('email')} />
          <Button type="submit" variant="secondary" size="L" loading={isSubmitting} className="w-full">{t('forgot.submit')}</Button>
        </form>)}
      <Link href="/login" className="inline-flex items-center gap-2 self-start text-body-s-medium text-primary-500"><ArrowLeft className="size-4" aria-hidden="true" />{t('forgot.back')}</Link>
    </AuthShell>
  );
}

export function ResetForm({ token }: { token: string }) {
  const t = useTranslations('auth'); const router = useRouter(); const [done, setDone] = useState(false);
  const schema = useMemo(() => z.object({ password: z.string().refine((p) => passwordStrength(p) >= 2, t('register.weak')), repeat: z.string() }).refine((v) => v.password === v.repeat, { path: ['repeat'], message: t('reset.mismatch') }), [t]);
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<{ password: string; repeat: string }>({ resolver: zodResolver(schema), mode: 'onBlur' });
  const pwd = useWatch({ control, name: 'password' }); const score = passwordStrength(pwd ?? '');
  return (
    <AuthShell icon={<Shield />} iconTone="green">
      <div><h1 className="text-h2 text-dark-900">{t('reset.title')}</h1><p className="mt-2 text-body-m text-dark-500">{t('reset.lead')}</p></div>
      {done ? (<><Alert type="success" title={t('reset.done')} /><Button variant="secondary" size="L" onClick={() => router.push('/login' as never)}>{t('login.submit')}</Button></>) : (
        <form noValidate onSubmit={handleSubmit(async (v) => { await api.auth.reset(token, v.password); setDone(true); })} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2"><PasswordInput autoComplete="new-password" label={t('reset.password')} error={errors.password?.message} {...register('password')} />{pwd && <StrengthMeter score={score} label={t(`register.strength.${score}` as never)} />}</div>
          <PasswordInput autoComplete="new-password" label={t('reset.repeat')} error={errors.repeat?.message} {...register('repeat')} />
          <Button type="submit" variant="secondary" size="L" loading={isSubmitting} className="w-full">{t('reset.submit')}</Button>
        </form>)}
      <span className="sr-only"><Info /></span>
    </AuthShell>
  );
}
