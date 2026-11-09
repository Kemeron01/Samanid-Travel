import { zodResolver } from '@hookform/resolvers/zod';
import { adminApi, AdminError } from '@samanid/api/admin';
import { Button, Checkbox, Input, Logo, OtpInput } from '@samanid/ui';
import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AdminTag } from '@/components/Shell';
import { homeFor } from '@/lib/rbac';
import { useSession } from '@/lib/session';

/** Экран входа (6.1 / 6.2): тёмный фон, белая карточка 460, подпись про аудит. */
function AuthCard({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-dark-900 p-4">
      <div className="flex w-full max-w-[460px] flex-col gap-5 rounded-[28px] bg-white p-6 md:p-10">
        <div className="flex items-center gap-2"><Logo /><AdminTag /></div>
        {children}
      </div>
      <p className="text-center text-caption text-dark-400">{t('auth.footer')}</p>
    </main>
  );
}

export function LoginPage() {
  const { t } = useTranslation(); const nav = useNavigate(); const loc = useLocation(); const { session, setSession } = useSession();
  const schema = z.object({ email: z.string().trim().email(t('auth.emailInvalid')), password: z.string().min(1, t('auth.passwordRequired')) });
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const [error, setError] = useState<string>();
  const from = (loc.state as { from?: string } | null)?.from;
  if (session) return <Navigate to={from ?? homeFor(session.perms)} replace />;
  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(undefined);
    try {
      const r = await adminApi.auth.login(email, password);
      if (r.twofa) nav('/login/2fa', { state: { challenge: r.challenge, from } });
      else { const s = adminApi.auth.session()!; setSession(s); nav(from ?? homeFor(s.perms), { replace: true }); }
    } catch (e) { setError(e instanceof AdminError && e.code === 'locked' ? t('auth.locked') : t('auth.invalid')); }
  });
  return (
    <AuthCard>
      <h1 className="text-h3 text-dark-900">{t('auth.title')}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Input label={t('auth.email')} type="email" autoComplete="username" placeholder="name@samanid.travel" error={errors.email?.message} {...register('email')} />
        <Input label={t('auth.password')} type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        {error && <p role="alert" className="text-body-s text-error-700">{error}</p>}
        <Button type="submit" variant="secondary" size="L" loading={isSubmitting} className="w-full">{t('auth.continue')}</Button>
      </form>
    </AuthCard>
  );
}

export function TwoFactorPage() {
  const { t } = useTranslation(); const nav = useNavigate(); const loc = useLocation(); const { setSession } = useSession();
  const st = loc.state as { challenge?: string; from?: string } | null;
  const [code, setCode] = useState(''); const [backup, setBackup] = useState(false); const [trust, setTrust] = useState(false);
  const [error, setError] = useState<string>(); const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Фокус сразу в первую ячейку кода — сотрудник вводит код без лишнего клика.
  useEffect(() => { if (!backup) formRef.current?.querySelector<HTMLInputElement>('input')?.focus(); }, [backup]);
  if (!st?.challenge) return <Navigate to="/login" replace />;
  const submit = async () => {
    setBusy(true); setError(undefined);
    try { const s = await adminApi.auth.verify(st.challenge!, code, { backup, trust }); setSession(s); nav(st.from ?? homeFor(s.perms), { replace: true }); }
    catch (e) { if (e instanceof AdminError && e.code === 'unauthorized') { nav('/login', { replace: true }); return; } setError(t('auth.codeInvalid')); setCode(''); }
    finally { setBusy(false); }
  };
  const ready = backup ? code.trim().length >= 8 : code.length === 6;
  return (
    <AuthCard>
      <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-lg bg-primary-50 text-primary-500"><ShieldCheck className="size-7" /></span>
      <h1 className="text-h3 text-dark-900">{t('auth.twofaTitle')}</h1>
      <p className="text-body-s text-dark-600">{t('auth.twofaText')}</p>
      <form ref={formRef} onSubmit={(e) => { e.preventDefault(); if (ready) void submit(); }} className="flex flex-col gap-5">
        {backup
          ? <Input label={t('auth.backup')} autoComplete="one-time-code" placeholder="XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} error={error} autoFocus />
          : <OtpInput label={t('auth.code')} value={code} onChange={(v) => { setCode(v); setError(undefined); }} helper={t('auth.codeHelper')} error={error} />}
        <Button type="submit" variant="secondary" size="L" loading={busy} disabled={!ready} className="w-full">{t('auth.verify')}</Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => { setBackup((v) => !v); setCode(''); setError(undefined); }} className="rounded-xs text-body-s-medium text-primary-500 hover:underline focus-visible:focus-ring">{backup ? t('auth.useTotp') : t('auth.useBackup')}</button>
          <Checkbox label={t('auth.trust')} checked={trust} onCheckedChange={(v) => setTrust(v === true)} />
        </div>
      </form>
    </AuthCard>
  );
}
