'use client';
import { Alert, Checkbox, DateTextInput, Input, PhoneInput, Select } from '@samanid/ui';
import { api, ageOn, type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { TriangleAlert, User, Baby } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useRouter } from '@/i18n/routing';
import { money } from '@/lib/format';
import { CheckoutShell, card } from './CheckoutShell';
import { usePatchOrder } from './useOrder';

const COUNTRIES = ['UZ', 'KZ', 'KG', 'TJ', 'RU', 'TR', 'US', 'GB', 'DE'];

export function TravellersStep({ order }: { order: Order }) {
  const t = useTranslations('checkout.travellers');
  const tc = useTranslations('checkout');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const patch = usePatchOrder(order.id);
  const [me, setMe] = useState(false);
  const { from, to } = order.departure;

  const schema = useMemo(() => {
    const date = z.string().min(1, t('required')).regex(/^\d{4}-\d{2}-\d{2}$/, t('badDate'));
    const trav = z.object({ id: z.string(), kind: z.enum(['adult', 'child']), full_name: z.string().min(1, t('required')).regex(/^[A-Za-z][A-Za-z '’-]*$/, t('latin')), birth_date: date, citizenship: z.string().min(1, t('required')), passport_expires: date })
      .superRefine((v, ctx) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(v.birth_date)) { const a = ageOn(v.birth_date, from); if (v.kind === 'adult' && a < 12) ctx.addIssue({ code: 'custom', path: ['birth_date'], message: t('adultAge') }); if (v.kind === 'child' && (a >= 12 || a < 0)) ctx.addIssue({ code: 'custom', path: ['birth_date'], message: t('childAge') }); }
        if (/^\d{4}-\d{2}-\d{2}$/.test(v.passport_expires) && v.passport_expires <= to) ctx.addIssue({ code: 'custom', path: ['passport_expires'], message: t('passportEarly') });
      });
    return z.object({ travellers: z.array(trav), email: z.string().min(1, t('required')).email(t('emailBad')), phone: z.string().min(1, t('required')).regex(/^\d{2} ?\d{3} ?\d{2} ?\d{2}$/, t('phoneBad')), consent: z.literal(true, { errorMap: () => ({ message: t('consentReq') }) }) });
  }, [t, from, to]);
  type F = z.infer<typeof schema>;
  const { control, register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema), mode: 'onBlur',
    defaultValues: { travellers: order.travellers, email: order.contacts.email, phone: order.contacts.phone, consent: order.consent_pd as true },
  });
  const watched = useWatch({ control, name: 'travellers' });

  const toggleMe = async (on: boolean) => {
    setMe(on);
    const p = on ? await api.orders.profile() : null;
    setValue('travellers.0.full_name', p?.full_name ?? '', { shouldValidate: on }); setValue('travellers.0.birth_date', p?.birth_date ?? '');
    setValue('travellers.0.citizenship', p?.citizenship ?? 'UZ'); setValue('travellers.0.passport_expires', p?.passport_expires ?? '');
    if (p) { if (!getValues('email')) setValue('email', p.email); if (!getValues('phone')) setValue('phone', p.phone); }
  };
  const submit = handleSubmit(async (v) => {
    await patch.mutateAsync({ travellers: v.travellers, contacts: { email: v.email, phone: v.phone }, consent_pd: true });
    router.push(`/checkout/${order.id}/seats` as never);
  });

  const childUnit = order.snapshot.lines.find((l) => l.kind === 'children')?.unit_price;
  return (
    <CheckoutShell order={order} step="travellers" title={t('title')} lead={t('lead')} leadShort={t('leadShort')} showTimer={false}
      nav={{ nextLabel: t('next'), onNext: () => void submit(), loading: isSubmitting || patch.isPending }}>
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        {watched.map((tr, i) => {
          const e = errors.travellers?.[i]; const n = e ? Object.keys(e).length : 0; const child = tr.kind === 'child';
          const a = /^\d{4}-\d{2}-\d{2}$/.test(tr.birth_date) ? ageOn(tr.birth_date, from) : null;
          return (
            <section key={tr.id} aria-labelledby={`tr-${i}`} className={`${card} flex flex-col gap-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 id={`tr-${i}`} className="flex items-center gap-3 text-body-m-medium text-dark-900 max-md:text-h6"><span aria-hidden="true" className={`flex size-8 items-center max-md:hidden justify-center rounded-full ${child ? 'bg-accent-100 text-accent-600' : 'bg-primary-50 text-primary-500'}`}>{child ? <Baby className="size-[18px]" /> : <User className="size-[18px]" />}</span><span className="md:hidden">{i + 1} · {child ? t('child') : t('adult')}</span><span className="max-md:hidden">{t('card', { n: i + 1, kind: child ? t('child') : t('adult') })}</span></h2>
                {i === 0 ? <Checkbox label={t('me')} checked={me} onCheckedChange={(c) => void toggleMe(c === true)} /> : n > 0 ? <p role="alert" className="flex items-center gap-1.5 text-caption text-error-700"><TriangleAlert className="size-4" aria-hidden="true" />{t('fill', { count: n })}</p> : null}
              </div>
              <Input label={t('fullName')} helper={t('fullNameHint')} className="max-md:[&_[id$=-helper]]:hidden" autoComplete="off" autoCapitalize="characters" error={e?.full_name?.message} {...register(`travellers.${i}.full_name`, { setValueAs: (v: string) => v.toUpperCase() })} />
              <div className="grid gap-4 md:grid-cols-3">
                <Controller control={control} name={`travellers.${i}.birth_date`} render={({ field }) => <DateTextInput label={t('birth')} placeholder={t('datePh')} value={field.value} onValueChange={field.onChange} error={e?.birth_date?.message} />} />
                <Controller control={control} name={`travellers.${i}.citizenship`} render={({ field }) => <Select label={t('citizenship')} placeholder={t('citizenshipPh')} value={field.value} onValueChange={field.onChange} error={e?.citizenship?.message} options={COUNTRIES.map((c) => ({ value: c, label: t(`countries.${c}` as never) }))} />} />
                <Controller control={control} name={`travellers.${i}.passport_expires`} render={({ field }) => <DateTextInput label={t('passport')} placeholder={t('datePh')} value={field.value} onValueChange={field.onChange} error={e?.passport_expires?.message} />} />
              </div>
              {child && a !== null && childUnit !== undefined && a >= 0 && a < 12 && <Alert type="info" title={t('childInfo')}>{t('childInfoText', { name: (tr.full_name.split(' ')[1] ?? tr.full_name) || '—', age: a, price: money(childUnit, locale), percent: 50 })}</Alert>}
            </section>
          );
        })}
        <section aria-labelledby="contacts" className={`${card} flex flex-col gap-4`}>
          <h2 id="contacts" className="text-body-m-medium text-dark-900">{t('contacts')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input type="email" autoComplete="email" label={t('email')} error={errors.email?.message} {...register('email')} />
            <PhoneInput label={t('phone')} placeholder="90 123 45 67" error={errors.phone?.message} {...register('phone')} />
          </div>
          <Controller control={control} name="consent" render={({ field }) => <div><Checkbox label={t('consent')} checked={field.value === true} onCheckedChange={(c) => field.onChange(c === true)} />{errors.consent && <p role="alert" className="text-caption text-error-700">{errors.consent.message}</p>}</div>} />
        </section>
        <button type="submit" className="sr-only">{t('next')}</button>
      </form>
      {tc('stepsNav') && null}
    </CheckoutShell>
  );
}
