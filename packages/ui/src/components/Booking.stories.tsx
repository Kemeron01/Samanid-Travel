import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PaymentScheduleRow, PriceRow, StatusTimeline } from './Booking';
import { Seat, SeatLegend, SeatMap, type SeatMapCell, type SeatState } from './Seat';

const meta: Meta = { title: 'UI-Kit/Booking-specific' };
export default meta;
type S = StoryObj;

const stateLabels: Record<SeatState, string> = {
  available: 'свободно', selected: 'выбрано вами', held: 'закреплено за вами', occupied: 'занято', unavailable: 'недоступно', child: 'место с детским креслом',
};

export const SeatStates: S = {
  render: () => (
    <div className="flex gap-4">
      {(Object.keys(stateLabels) as SeatState[]).map((s) => <Seat key={s} code="4A" state={s} stateLabel={stateLabels[s]} />)}
    </div>
  ),
};

const o = (code: string): SeatMapCell => ({ kind: 'seat', code, state: 'occupied' });
const a = (code: string): SeatMapCell => ({ kind: 'seat', code, state: 'available' });
const aisle = (label: string): SeatMapCell => ({ kind: 'aisle', label });

export const Minibus18: S = {
  render: () => {
    const [sel, setSel] = useState<string[]>(['2A', '2B']);
    const base: SeatMapCell[][] = [
      [o('1A'), o('1B'), aisle('1'), a('1D')],
      [a('2A'), a('2B'), aisle('2'), o('2D')],
      [{ kind: 'seat' as const, code: '3A', state: 'held' as const }, a('3B'), aisle('3'), a('3D')],
      [{ kind: 'seat' as const, code: '4A', state: 'child' as const }, o('4B'), aisle('4'), o('4D')],
      [a('5A'), a('5B'), aisle('5'), { kind: 'seat', code: '5D', state: 'unavailable' as const }],
      [o('6A'), a('6B'), a('6C'), a('6D')],
    ];
    const rows: SeatMapCell[][] = base.map((r) => r.map((c): SeatMapCell => (c.kind === 'seat' && sel.includes(c.code) ? { ...c, state: 'selected' } : c)));
    return (
      <div className="flex flex-wrap gap-10">
        <SeatMap rows={rows} stateLabels={stateLabels} entranceLabel="Вход" driverLabel="Вод."
          onSelect={(c) => setSel((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))} />
        <SeatLegend title="Обозначения" items={[
          { state: 'available', label: 'Свободно' }, { state: 'selected', label: 'Выбрано вами' }, { state: 'held', label: 'Закреплено за вами (hold)' },
          { state: 'occupied', label: 'Занято' }, { state: 'unavailable', label: 'Недоступно' }, { state: 'child', label: 'Место с детским креслом' },
        ]} />
      </div>
    );
  },
};

export const Prices: S = {
  render: () => (
    <div className="flex max-w-[380px] flex-col gap-2">
      <PriceRow label="2 взрослых × $640" amount="$1 280" />
      <PriceRow type="discount" label="Промокод SPRING10 (−10%)" amount="−$160" />
      <PriceRow type="dynamic" label="Высокий спрос (+6%)" amount="+$96" hint="Цена выросла из-за высокого спроса" />
      <PriceRow type="total" label="Итого" amount="$1 536" />
    </div>
  ),
};

export const Schedule: S = {
  render: () => (
    <div className="flex max-w-[640px] flex-col gap-3">
      <PaymentScheduleRow state="paid" title="Взнос 1 (депозит)" date="10 мая 2027" amount="$512" statusLabel="Оплачен" />
      <PaymentScheduleRow state="upcoming" title="Взнос 2" date="10 июня 2027" amount="$512" statusLabel="Через 12 дней" />
      <PaymentScheduleRow state="overdue" title="Взнос 2" date="10 июня 2027" amount="$512 + пеня $7.68" statusLabel="Просрочен 3 дня" />
      <PaymentScheduleRow state="scheduled" title="Взнос 3" date="10 июля 2027" amount="$512" statusLabel="По графику" />
    </div>
  ),
};

export const Timeline: S = {
  render: () => (
    <StatusTimeline className="max-w-[380px]" steps={[
      { title: 'Заказ создан', meta: '10 мая, 14:02', state: 'done' },
      { title: 'Депозит оплачен · $527', meta: '10 мая, 14:09 · карта •• 4417', state: 'done' },
      { title: 'Подтверждён', meta: '10 мая, 14:09 · ваучер отправлен', state: 'done' },
      { title: 'Ждём выезда', meta: '12 мая, 07:30 · сбор у отеля', state: 'current' },
      { title: 'Завершён', state: 'todo' },
    ]} />
  ),
};
