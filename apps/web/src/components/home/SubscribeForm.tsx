'use client';
import { Button, Input } from '@samanid/ui';
import { api } from '@samanid/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function SubscribeForm() {
  const t = useTranslations('home.subscribe');
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const schema = z.object({ email: z.string().email(t('invalid')) });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const onSubmit = handleSubmit(async ({ email }) => {
    try { await api.subscribe(email); setStatus('ok'); reset(); } catch { setStatus('fail'); }
  });
  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-3 md:max-w-[552px] md:flex-row md:items-start">
      <Input className="md:flex-1" type="email" autoComplete="email" label={t('email')} placeholder={t('placeholder')} error={errors.email?.message} {...register('email')} />
      <Button type="submit" size="L" variant="secondary" loading={isSubmitting} className="w-full md:mt-[28px] md:w-auto">{t('submit')}</Button>
      <p role="status" className="text-caption md:absolute md:mt-[88px]">
        {status === 'ok' ? <span className="text-success-700">{t('success')}</span> : status === 'fail' ? <span className="text-error-700">{t('failed')}</span> : null}
      </p>
    </form>
  );
}
