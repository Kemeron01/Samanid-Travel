import type { Meta, StoryObj } from '@storybook/react';
import { Chip, StatusBadge, Tag, type OrderStatus } from './Badge';
import { Rating } from './Rating';

const meta: Meta = { title: 'UI-Kit/Badges & Chips' };
export default meta;
type S = StoryObj;

const labels: Record<OrderStatus, string> = {
  draft: 'Черновик', pending_payment: 'Ждёт оплаты', awaiting_manager_confirmation: 'На подтверждении', partially_paid: 'Частично оплачен',
  paid: 'Оплачен', confirmed: 'Подтверждён', completed: 'Завершён', cancelled: 'Отменён', refunded: 'Возвращён', expired: 'Истёк',
};

export const Statuses: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {(Object.keys(labels) as OrderStatus[]).map((s) => (
        <StatusBadge key={s} status={s} label={labels[s]} title={s === 'awaiting_manager_confirmation' ? 'Ждёт подтверждения менеджера' : undefined} />
      ))}
    </div>
  ),
};

export const Tags: S = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Tag type="hit">Хит продаж</Tag><Tag type="discount">−20%</Tag><Tag type="seatsLeft">Осталось 3 места</Tag>
      <Tag type="priceRising">Цена растёт</Tag><Tag type="new">Новинка</Tag><Tag type="individual">Индивидуальный</Tag><Tag type="group">Групповой</Tag>
    </div>
  ),
};

export const Chips: S = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Chip>Самарканд</Chip><Chip selected>Самарканд</Chip><Chip onRemove={() => {}} removeLabel="Убрать фильтр">до $1 200</Chip>
      <Rating value={4.9} countLabel="128 отзывов" />
    </div>
  ),
};
