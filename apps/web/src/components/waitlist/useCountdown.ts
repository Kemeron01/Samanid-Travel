'use client';
import { useEffect, useState } from 'react';

/** Секунды до `expiresAt` (ISO). Время «сейчас» тикает раз в секунду; левый край — из API (expires_at), не константа.
 *  Значение выводится синхронно из now, поэтому при смене expiresAt нет кадра с ложным нулём. */
export function useCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [expiresAt]);
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}
export const hms = (s: number) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':');
