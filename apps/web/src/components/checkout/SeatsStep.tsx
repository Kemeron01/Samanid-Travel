'use client';
import { Alert, MiniSeat, SeatLegend, SeatMap, type SeatMapCell, type SeatState } from '@samanid/ui';
import { Info, X } from 'lucide-react';
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
  // Места с детским креслом достаются детям, остальные — взрослым (порядок мест = порядок путешественников в заказе).
  const childSeat = useMemo(() => new Set((rows ?? []).flat().filter((c) => c.state === 'child').map((c) => c.code!)), [rows]);
  const arranged = useMemo(() => {
    const kids = sel.filter((c) => childSeat.has(c)); const rest = sel.filter((c) => !childSeat.has(c));
    return order.travellers.map((tr) => (tr.kind === 'child' ? kids.shift() ?? rest.shift() : rest.shift() ?? kids.shift())).filter((c): c is string => Boolean(c));
  }, [sel, childSeat, order.travellers]);
  const labels = { available: t('state.available'), selected: t('state.selected'), held: t('state.held'), occupied: t('state.occupied'), unavailable: t('state.unavailable'), child: t('state.child') } as Record<SeatState, string>;
  const done = sel.length === total;
  const { data: vehicle } = useQuery({ queryKey: ['vehicle', order.departure.id], queryFn: () => api.orders.vehicle(order.departure.id) });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => api.settings() });
  return (
    <CheckoutShell order={order} step="seats" title={t('titlePlain')} titleShort={t('title', { count: total })} leadShort=""
      barNote={done ? t('progress', { selected: sel.length, total }) : t('need', { count: total - sel.length })}
      lead={vehicle ? t('lead', { vehicle: `${t(`vehicleTypes.${vehicle.type}`)} ${vehicle.model}`, seats: vehicle.seats, count: total }) : undefined}
      nav={{ backHref: `/checkout/${order.id}/travellers`, nextLabel: t('next'), disabled: !done, loading: patch.isPending, onNext: async () => { await patch.mutateAsync({ seats: arranged }); router.push(`/checkout/${order.id}/addons` as never); } }}>
      {/* Figma 27:618 / 27:626: алерт о холде, затем карточка: схема слева, легенда + «Ваши места» справа. */}
      {settings && <Alert type="info" title={t('holdTitle', { minutes: settings.hold_minutes })} className="max-md:hidden">{t('holdText')}</Alert>}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-12 md:rounded-2xl md:border md:border-dark-200 md:bg-white md:p-8">
        <SeatMap rows={cells} stateLabels={labels} entranceLabel={t('entrance')} driverLabel={t('driver')} onSelect={toggle} className="max-w-full shrink-0" />
        {/* Mobile 30:1778: легенда строкой над схемой, под схемой — «2A · Азиз». */}
        <ul aria-hidden="true" className="order-first flex w-full flex-wrap gap-x-3 gap-y-2 md:hidden">
          {([['available', t('free')], ['selected', t('yours')], ['occupied', t('occupied')], ['child', t('withSeat')]] as const).map(([st, l]) => <li key={st} className="flex items-center gap-1.5 text-caption text-dark-700"><span className="flex h-[26px] w-6 shrink-0 [&>*]:origin-top-left [&>*]:scale-75"><MiniSeat state={st} code="4A" /></span>{l}</li>)}
        </ul>
        <p className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-caption text-primary-600 md:hidden">{arranged.map((s, i) => <span key={s}>{s} · {(order.travellers[i]?.full_name.split(' ')[1] ?? '').replace(/^(.)(.*)$/, (_, a: string, b: string) => a + b.toLowerCase())}</span>)}</p>
        <div className="flex w-full min-w-0 flex-col gap-6 max-md:hidden">
          <SeatLegend title={t('legend')} items={[{ state: 'available', label: t('free') }, { state: 'selected', label: t('yoursFull') }, { state: 'held', label: t('held') }, { state: 'occupied', label: t('occupied') }, { state: 'unavailable', label: t('unavailable') }, { state: 'child', label: t('withSeatFull') }]} />
          <div className="flex flex-col gap-2.5">
            <h2 className="text-h6 text-dark-900">{t('yourSeats')}</h2>
            <p role="status" className="sr-only">{done ? t('progress', { selected: sel.length, total }) : t('need', { count: total - sel.length })}</p>
            <ul aria-label={t('assigned')} className="flex flex-col gap-2.5">
              {order.travellers.map((tr, i) => { const seat = arranged[i]; return (
                <li key={tr.id ?? i} className="flex items-center justify-between gap-3 rounded-md bg-primary-50 px-3.5 py-3 text-body-s-medium">
                  <span className="min-w-0 truncate text-dark-900">{tr.full_name}{tr.kind === 'child' ? ` · ${t('childSuffix')}` : ''}</span>
                  {seat ? <span className="flex shrink-0 items-center gap-1.5 text-primary-600">{childSeat.has(seat) ? t('seatChild', { seat }) : seat}
                    <button type="button" aria-label={t('unassign', { seat })} onClick={() => toggle(seat)} className="-m-1 inline-flex size-6 items-center justify-center rounded-full text-dark-500 hover:bg-primary-100 focus-visible:focus-ring"><X className="size-3.5" aria-hidden="true" /></button></span>
                    : <span className="shrink-0 text-dark-400">{t('notChosen')}</span>}
                </li>); })}
            </ul>
          </div>
          <p className="flex items-center gap-2 text-caption text-dark-500"><Info className="size-4 shrink-0" aria-hidden="true" />{t('free_note')}</p>
        </div>
      </div>
    </CheckoutShell>
  );
}
export { orderKey };
