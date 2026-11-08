'use client';
import { api, type Order, type OrderPatch } from '@samanid/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useCountdown } from '@/components/waitlist/useCountdown';

export const orderKey = (id: string) => ['order', id] as const;

export function useOrder(id: string) {
  return useQuery({ queryKey: orderKey(id), queryFn: () => api.orders.get(id) });
}
export function usePatchOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: OrderPatch) => api.orders.patch(id, p), onSuccess: (o) => qc.setQueryData(orderKey(id), o) });
}
export function useSetOrder(id: string) { const qc = useQueryClient(); return (o: Order) => qc.setQueryData(orderKey(id), o); }

/** Секунды hold из hold_expires_at (приходит из API). По истечении — на экран 2.7c. */
export function useHold(order: Order | null | undefined, redirect = true) {
  const router = useRouter();
  const left = useCountdown(order?.hold_expires_at ?? new Date(0).toISOString());
  const active = Boolean(order?.hold_expires_at);
  useEffect(() => { if (redirect && order && active && left === 0) router.replace(`/checkout/${order.id}/expired` as never); }, [left, active, redirect, order, router]);
  return { left, active };
}
export const STEPS = ['travellers', 'seats', 'addons', 'discounts', 'review'] as const;
export type StepKey = (typeof STEPS)[number];
