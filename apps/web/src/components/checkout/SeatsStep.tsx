'use client';
import { Chip, SeatLegend, SeatMap, type SeatMapCell, type SeatState } from '@samanid/ui';
import { api, type Order } from '@samanid/api';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { CheckoutShell } from './CheckoutShell';
import { orderKey, usePatchOrder, useSetOrder } from './useOrder';

export function SeatsStep({ order }: { order: Order }) {
  const t = useTranslations('checkout.seats');
  const router = useRouter();
  const setOrder = useSetOrder(order.id);
  const patch = usePatchOrder(order.id);
  const total = order.travellers.length;
  const [sel, setSel] = useState<string[]>(order.seats);
  // Hold стартует на шаге 2 (идемпотентно)
  useEffect(() => { if (!order.hold_expires_at) void api.orders.startHold(order.id).then(setOrder); }, [order.id, order.hold_expires_at]); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: rows } = useQuery({ queryKey: ['seatmap', order.departure.id], queryFn: () => api.orders.seatMap(order.departure.id) });
  const cells: SeatMapCell[][] = useMemo(() => (rows ?? []).map((r) => r.map((c): SeatMapCell => c.kind === 'aisle' ? { kind: 'aisle', label: c.label } : { kind: 'seat', code: c.code!, state: sel.includes(c.code!) ? 'selected' : (c.state as SeatState) })), [rows, sel]);
  const toggle = (code: string) => setSel((s) => s.includes(code) ? s.filter((x) => x !== code) : s.length < total ? [...s, code] : s);
  const names = order.travellers.map((tr) => tr.full_name.split(' ')[1] ?? tr.full_name);
  const labels = { available: t('state.available'), selected: t('state.selected'), held: t('state.held'), occupied: t('state.occupied'), unavailable: t('state.unavailable'), child: t('state.child') } as Record<SeatState, string>;
  const done = sel.length === total;
  return (
    <CheckoutShell order={order} step="seats" title={t('title', { count: total })}
      nav={{ backHref: `/checkout/${order.id}/travellers`, nextLabel: t('next'), disabled: !done, loading: patch.isPending, onNext: async () => { await patch.mutateAsync({ seats: sel }); router.push(`/checkout/${order.id}/addons` as never); } }}>
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
        <SeatMap rows={cells} stateLabels={labels} entranceLabel={t('entrance')} driverLabel={t('driver')} onSelect={toggle} className="max-w-full" />
        <div className="flex w-full flex-col gap-6">
          <SeatLegend title={t('legend')} items={[{ state: 'available', label: t('free') }, { state: 'selected', label: t('yours') }, { state: 'occupied', label: t('occupied') }, { state: 'child', label: t('withSeat') }]} />
          <p role="status" className="text-body-s text-dark-600">{done ? t('progress', { selected: sel.length, total }) : t('need', { count: total - sel.length })}</p>
          <ul aria-label={t('assigned')} className="flex flex-wrap gap-2">{sel.map((s, i) => <li key={s}><Chip>{s} · {names[i]}</Chip></li>)}</ul>
        </div>
      </div>
    </CheckoutShell>
  );
}
export { orderKey };
