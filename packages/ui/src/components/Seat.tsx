'use client';
import { Baby, X } from 'lucide-react';
import { cn } from '../cn';

export type SeatState = 'available' | 'selected' | 'held' | 'occupied' | 'unavailable' | 'child';

/** Цвета частей кресла по состоянию (Figma: Seat 14:608). Статус = форма/иконка + цвет, занятые с ×. */
const tone: Record<SeatState, { part: string; text: string }> = {
  available: { part: 'bg-success-700', text: 'text-white' },
  selected: { part: 'bg-primary-500', text: 'text-white' },
  held: { part: 'border-[1.5px] border-primary-500 bg-primary-100', text: 'text-primary-600' },
  occupied: { part: 'bg-dark-300', text: 'text-dark-700' },
  unavailable: { part: 'bg-dark-200', text: 'text-dark-500' },
  child: { part: 'bg-accent-500', text: 'text-dark-900' },
};

export interface SeatProps {
  code: string;            // «4A»
  state: SeatState;
  /** Подписи для скринридера: «Место 4A, свободно». */
  stateLabel: string;
  onSelect?: (code: string) => void;
}

/** Кресло, вид сверху. Зона нажатия 44×48. Интерактивно только в available/selected/held/child. */
export function Seat({ code, state, stateLabel, onSelect }: SeatProps) {
  const t = tone[state];
  const interactive = state === 'available' || state === 'selected' || state === 'held' || state === 'child';
  const part = cn('absolute', t.part);
  return (
    <button
      type="button"
      disabled={!interactive}
      aria-pressed={state === 'selected' || state === 'held' ? true : interactive ? false : undefined}
      aria-label={`${code}, ${stateLabel}`}
      onClick={() => onSelect?.(code)}
      className={cn('relative h-12 w-11 shrink-0 rounded-sm focus-visible:focus-ring disabled:cursor-not-allowed', state === 'unavailable' && 'opacity-60')}
    >
      <span aria-hidden="true" className={cn(part, 'top-[18px] left-0 h-5 w-[5px] rounded-[2.5px]')} />
      <span aria-hidden="true" className={cn(part, 'top-[18px] left-[39px] h-5 w-[5px] rounded-[2.5px]')} />
      <span aria-hidden="true" className={cn(part, 'top-0.5 left-[7px] h-9 w-[30px] rounded-[9px]')} />
      <span aria-hidden="true" className={cn(part, 'top-[42px] left-0.5 h-[5px] w-10 rounded-[2.5px]')} />
      <span aria-hidden="true" className={cn('absolute top-3 left-[7px] flex h-4 w-[30px] items-center justify-center text-caption font-bold', t.text)}>
        {state === 'occupied' || state === 'unavailable' ? <X className="size-4" /> : state === 'child' ? <Baby className="size-4" /> : code}
      </span>
    </button>
  );
}

export type SeatMapCell = { kind: 'seat'; code: string; state: SeatState } | { kind: 'aisle'; label?: string } | { kind: 'empty' };

/** Схема транспорта (Minibus 18 — 14:610). Раскладка приходит из API (ресурсы), здесь только отрисовка. */
export function SeatMap({ rows, stateLabels, onSelect, entranceLabel, driverLabel, className }: {
  rows: SeatMapCell[][]; stateLabels: Record<SeatState, string>; onSelect?: (code: string) => void;
  entranceLabel: string; driverLabel: string; className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Seat map"
      className={cn('inline-flex flex-col gap-2.5 rounded-t-[80px] rounded-b-[40px] border-2 border-dark-300 bg-bg-page p-6', className)}
    >
      <div className="flex items-center justify-between pb-2 text-caption text-dark-500">
        <span>{entranceLabel}</span>
        <span className="flex size-11 items-center justify-center rounded-full border-2 border-dark-400">{driverLabel}</span>
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-2">
          {row.map((c, ci) =>
            c.kind === 'seat' ? (
              <Seat key={c.code} code={c.code} state={c.state} stateLabel={stateLabels[c.state]} onSelect={onSelect} />
            ) : c.kind === 'aisle' ? (
              <span key={ci} aria-hidden="true" className="flex h-11 w-7 items-center justify-center text-caption text-dark-400">{c.label}</span>
            ) : (
              <span key={ci} aria-hidden="true" className="h-12 w-11" />
            ),
          )}
        </div>
      ))}
    </div>
  );
}

export function MiniSeat({ state, code }: { state: SeatState; code?: string }) {
  const t = tone[state];
  return (
    <span aria-hidden="true" className={cn('relative inline-block h-[33.6px] w-[30.8px] shrink-0', state === 'unavailable' && 'opacity-60')}>
      <span className={cn('absolute top-[12.6px] left-0 h-3.5 w-[3.5px] rounded-[1.75px]', t.part)} />
      <span className={cn('absolute top-[12.6px] left-[27.3px] h-3.5 w-[3.5px] rounded-[1.75px]', t.part)} />
      <span className={cn('absolute top-[1.4px] left-[4.9px] h-[25.2px] w-[21px] rounded-[6.3px]', t.part)} />
      <span className={cn('absolute top-[29.4px] left-[1.4px] h-[3.5px] w-7 rounded-[1.75px]', t.part)} />
      <span className={cn('absolute top-[8.4px] left-[4.9px] flex w-[21px] items-center justify-center text-[8.4px] leading-[11.2px] font-bold', t.text)}>
        {state === 'occupied' || state === 'unavailable' ? <X className="size-[11.2px]" /> : state === 'child' ? <Baby className="size-[11.2px]" /> : code}
      </span>
    </span>
  );
}

export function SeatLegend({ title, items, className }: { title: string; items: { state: SeatState; label: string }[]; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="text-h6 text-dark-900">{title}</p>
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.state} className="flex items-center gap-3 text-body-s text-dark-700">
            <MiniSeat state={i.state} code="4A" />{i.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
