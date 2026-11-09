'use client';
import { Checkbox, Textarea, cn } from '@samanid/ui';
import { api, type Addon, type Order } from '@samanid/api';
import { type Locale } from '@samanid/i18n';
import { useQuery } from '@tanstack/react-query';
import { Baby, Eye, MapPin, Shield, Ticket, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { money } from '@/lib/format';
import { CheckoutShell } from './CheckoutShell';
import { usePatchOrder } from './useOrder';

const icons = { shield: Shield, user: User, 'map-pin': MapPin, baby: Baby, eye: Eye, ticket: Ticket } as const;
const STEP_ADDONS = ['ins', 'seat', 'guide', 'shahi'];

export function AddonsStep({ order }: { order: Order }) {
  const t = useTranslations('checkout.addons');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const patch = usePatchOrder(order.id);
  const { data } = useQuery({ queryKey: ['addons'], queryFn: () => api.addons() });
  const [ids, setIds] = useState<string[]>(order.addon_ids);
  const [comment, setComment] = useState(order.comment);
  const pax = order.travellers.length;
  const hasChild = order.children > 0;
  // Пересчёт цены — на сервере: при каждом изменении шлём patch, сводка берёт снимок из ответа
  useEffect(() => { const h = setTimeout(() => { if (JSON.stringify(ids) !== JSON.stringify(order.addon_ids)) patch.mutate({ addon_ids: ids }); }, 100); return () => clearTimeout(h); }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  const list = (data ?? []).filter((a) => STEP_ADDONS.includes(a.id));
  const price = (a: Addon) => a.unit === 'person' ? t('person', { price: money(a.price, locale), count: pax, total: money(a.price * pax, locale) }) : a.unit === 'group' ? t('group', { price: money(a.price, locale) }) : t('trip', { price: money(a.price, locale) });
  return (
    <CheckoutShell order={order} step="addons" title={t('title')} lead={t('lead')} leadShort={t('leadShort')}
      nav={{ backHref: `/checkout/${order.id}/seats`, nextLabel: t('next'), loading: patch.isPending, onNext: async () => { await patch.mutateAsync({ addon_ids: ids, comment }); router.push(`/checkout/${order.id}/discounts` as never); } }}>
      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((a) => { const I = icons[a.icon]; const disabled = a.id === 'seat' && !hasChild; const on = ids.includes(a.id) && !disabled; return (
          <li key={a.id} className={cn('flex items-start gap-4 rounded-lg border p-5', disabled ? 'border-dark-200 bg-dark-100' : on ? 'border-[1.5px] border-primary-500 bg-primary-50' : 'border-dark-200 bg-white')}>
            <span aria-hidden="true" className={cn('flex size-11 shrink-0 items-center justify-center rounded-md [&>svg]:size-[22px]', disabled ? 'bg-dark-200 text-dark-500' : 'bg-white text-primary-500')}><I /></span>
            <div className="flex min-w-0 flex-1 flex-col gap-1"><h2 className={cn('text-body-m-medium', disabled ? 'text-dark-500' : 'text-dark-900')}>{a.title}</h2><p className="text-body-s text-dark-600">{disabled ? t('needChild') : a.text}</p><p className={cn('text-body-s-medium', disabled ? 'text-dark-400' : 'text-primary-600')}>{price(a)}</p></div>
            <Checkbox label={<span className="sr-only">{a.title}</span>} checked={on} disabled={disabled} onCheckedChange={(c) => setIds((s) => c === true ? [...s, a.id] : s.filter((x) => x !== a.id))} />
          </li>); })}
      </ul>
      <div><Textarea label={t('comment')} placeholder={t('commentPh')} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} /><p className="mt-1 text-caption text-dark-500">{comment.length} / 500</p></div>
    </CheckoutShell>
  );
}
