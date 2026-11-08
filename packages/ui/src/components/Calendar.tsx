'use client';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '../cn';

/** Даты — ISO «YYYY-MM-DD» (без часовых поясов). */
export type ISODate = string;
const pad = (n: number) => String(n).padStart(2, '0');
const toISO = (y: number, m: number, d: number): ISODate => `${y}-${pad(m + 1)}-${pad(d)}`;
const parse = (s: ISODate) => { const [y, m, d] = s.split('-').map(Number) as [number, number, number]; return { y, m: m - 1, d }; };
export const todayISO = (): ISODate => { const n = new Date(); return toISO(n.getFullYear(), n.getMonth(), n.getDate()); };

export interface CalendarProps {
  mode: 'single' | 'range';
  /** single: value[0]; range: [start, end?] */
  value: ISODate[];
  onChange: (v: ISODate[]) => void;
  /** Intl-локаль: ru-RU / uz-UZ / en-US */
  locale: string;
  /** Прошедшие даты недоступны: минимальная дата (по умолчанию сегодня). */
  minDate?: ISODate;
  maxDate?: ISODate;
  prevLabel: string; nextLabel: string; hint?: string;
  className?: string;
}

/** Figma: Calendar / Range (8:593). Неделя с понедельника. Названия месяцев и дней — через Intl. */
export function Calendar({ mode, value, onChange, locale, minDate, maxDate, prevLabel, nextLabel, hint, className }: CalendarProps) {
  const min = minDate ?? todayISO();
  const start0 = value[0] ?? min;
  const [view, setView] = useState(() => { const p = parse(start0 < min ? min : start0); return { y: p.y, m: p.m }; });

  const title = useMemo(() => {
    const s = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(view.y, view.m, 1)));
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [locale, view]);

  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) => f.format(new Date(Date.UTC(2024, 0, 1 + i)))); // 2024-01-01 — понедельник
  }, [locale]);

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (ISODate | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(view.y, view.m, i + 1))];
  while (cells.length % 7) cells.push(null);

  const [s, e] = value;
  const pick = (d: ISODate) => {
    if (mode === 'single') return onChange([d]);
    if (!s || e) return onChange([d]);
    onChange(d < s ? [d, s] : [s, d]);
  };
  const shift = (delta: number) => setView((v) => { const d = new Date(Date.UTC(v.y, v.m + delta, 1)); return { y: d.getUTCFullYear(), m: d.getUTCMonth() }; });
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' });
  const minMonth = parse(min);
  const canPrev = view.y > minMonth.y || (view.y === minMonth.y && view.m > minMonth.m);

  return (
    <div className={cn('inline-flex flex-col gap-4 rounded-xl border border-dark-200 bg-white p-5 shadow-lg', className)}>
      <div className="flex items-center justify-between gap-4">
        <button type="button" aria-label={prevLabel} disabled={!canPrev} onClick={() => shift(-1)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-dark-100 focus-visible:focus-ring disabled:text-dark-300 disabled:hover:bg-transparent"><ChevronLeft className="size-5" aria-hidden="true" /></button>
        <p className="text-h6 text-dark-900" aria-live="polite">{title}</p>
        <button type="button" aria-label={nextLabel} onClick={() => shift(1)} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-dark-100 focus-visible:focus-ring"><ChevronRight className="size-5" aria-hidden="true" /></button>
      </div>
      <div role="grid" aria-label={title} className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 gap-1 text-center text-caption text-dark-500">
          {weekdays.map((w) => <span key={w} role="columnheader" className="w-10">{w}</span>)}
        </div>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <div role="row" key={r} className="grid grid-cols-7 gap-1">
            {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
              if (!d) return <span key={i} role="gridcell" className="size-10" />;
              const disabled = d < min || (maxDate !== undefined && d > maxDate);
              const isEdge = d === s || d === e;
              const inRange = mode === 'range' && s && e && d > s && d < e;
              return (
                <span role="gridcell" key={d} aria-selected={isEdge || Boolean(inRange)}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={fmt.format(new Date(`${d}T00:00:00Z`))}
                    aria-pressed={isEdge}
                    onClick={() => pick(d)}
                    className={cn(
                      'flex size-10 items-center justify-center text-body-s focus-visible:focus-ring',
                      isEdge ? 'rounded-full bg-primary-500 text-body-s-medium text-white' : inRange ? 'rounded-sm bg-primary-100 text-dark-900' : 'rounded-full text-dark-900 hover:bg-dark-100',
                      disabled && 'cursor-not-allowed text-dark-300 hover:bg-transparent',
                    )}
                  >
                    {parse(d).d}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {hint && <p className="flex items-center gap-2 text-caption text-dark-500"><Info className="size-4" aria-hidden="true" />{hint}</p>}
    </div>
  );
}

export function formatISO(d: ISODate, locale: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
}
