'use client';
import { Clock, Star, TriangleAlert, User, Users, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Ключи = статусы бэкенда. awaiting_manager_confirmation → короткая подпись «На подтверждении» (полная — в title). */
export type OrderStatus =
  | 'draft' | 'pending_payment' | 'awaiting_manager_confirmation' | 'partially_paid' | 'paid'
  | 'confirmed' | 'completed' | 'cancelled' | 'refunded' | 'expired';

const statusStyle: Record<OrderStatus, { bg: string; dot: string; text: string }> = {
  draft: { bg: 'bg-dark-100', dot: 'bg-dark-400', text: 'text-dark-700' },
  pending_payment: { bg: 'bg-warning-100', dot: 'bg-warning-500', text: 'text-warning-700' },
  awaiting_manager_confirmation: { bg: 'bg-accent-100', dot: 'bg-accent-500', text: 'text-warning-700' },
  partially_paid: { bg: 'bg-warning-100', dot: 'bg-warning-500', text: 'text-warning-700' },
  paid: { bg: 'bg-primary-100', dot: 'bg-primary-500', text: 'text-primary-600' },
  confirmed: { bg: 'bg-success-100', dot: 'bg-success-600', text: 'text-success-700' },
  completed: { bg: 'bg-dark-100', dot: 'bg-dark-900', text: 'text-dark-900' },
  cancelled: { bg: 'bg-error-100', dot: 'bg-error-600', text: 'text-error-700' },
  refunded: { bg: 'bg-primary-50', dot: 'bg-primary-500', text: 'text-primary-600' },
  expired: { bg: 'bg-dark-100', dot: 'bg-dark-400', text: 'text-dark-500' },
};

/** Статус = точка + текст, никогда только цвет. Figma: Status Badge (9:312). */
export function StatusBadge({ status, label, title, className }: { status: OrderStatus; label: string; title?: string; className?: string }) {
  const s = statusStyle[status];
  return (
    <span title={title} className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-body-s-medium whitespace-nowrap', s.bg, s.text, className)}>
      <span aria-hidden="true" className={cn('size-2 rounded-full', s.dot)} />
      {label}
    </span>
  );
}

export type TagType = 'hit' | 'discount' | 'seatsLeft' | 'priceRising' | 'new' | 'individual' | 'group';
const tagStyle: Record<TagType, { cls: string; icon?: ReactNode }> = {
  hit: { cls: 'bg-accent-500 text-dark-900', icon: <Star /> },
  discount: { cls: 'bg-error-600 text-white' },
  seatsLeft: { cls: 'bg-warning-100 text-warning-700', icon: <Clock /> },
  priceRising: { cls: 'bg-error-100 text-error-700', icon: <TriangleAlert /> },
  new: { cls: 'bg-primary-500 text-white' },
  individual: { cls: 'bg-dark-900 text-white', icon: <User /> },
  group: { cls: 'border border-dark-200 bg-white text-dark-900', icon: <Users /> },
};

/** Маркетинговые метки на карточке тура. Не более 2 на карточку. Figma: Tag (9:347). */
export function Tag({ type, children, className }: { type: TagType; children: ReactNode; className?: string }) {
  const t = tagStyle[type];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-caption whitespace-nowrap [&>svg]:size-3.5', t.cls, className)}>
      {t.icon && <span aria-hidden="true" className="inline-flex [&>svg]:size-3.5">{t.icon}</span>}
      {children}
    </span>
  );
}

export interface ChipProps {
  children: ReactNode; selected?: boolean; onClick?: () => void;
  onRemove?: () => void; removeLabel?: string; className?: string;
}

/** Figma: Chip — Default / Selected / Removable. */
export function Chip({ children, selected, onClick, onRemove, removeLabel, className }: ChipProps) {
  const active = selected || Boolean(onRemove);
  const cls = cn(
    'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-body-s-medium focus-visible:focus-ring',
    active ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-dark-200 bg-white text-dark-700 hover:bg-dark-100',
    className,
  );
  if (onRemove) {
    return (
      <span className={cls}>
        {children}
        <button type="button" onClick={onRemove} aria-label={removeLabel} className="inline-flex size-6 items-center justify-center rounded-full focus-visible:focus-ring">
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </span>
    );
  }
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cls}>{children}</button>
  );
}
