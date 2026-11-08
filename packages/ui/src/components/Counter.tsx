'use client';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../cn';

export interface CounterProps {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
  label: string; decrementLabel: string; incrementLabel: string; className?: string;
}

const btn =
  'inline-flex size-10 items-center justify-center rounded-full border bg-white transition-colors focus-visible:focus-ring disabled:cursor-not-allowed disabled:border-dark-200 disabled:text-dark-300 enabled:border-dark-300 enabled:text-dark-900 enabled:hover:bg-dark-100';

/** Figma: Counter ±. Зона нажатия 40px, на Min/Max кнопка disabled. */
export function Counter({ value, min = 1, max = 9, onChange, label, decrementLabel, incrementLabel, className }: CounterProps) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center gap-4', className)}>
      <button type="button" className={btn} aria-label={decrementLabel} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="size-[18px]" aria-hidden="true" />
      </button>
      <output className="w-6 text-center text-h5 text-dark-900" aria-live="polite">{value}</output>
      <button type="button" className={btn} aria-label={incrementLabel} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}
