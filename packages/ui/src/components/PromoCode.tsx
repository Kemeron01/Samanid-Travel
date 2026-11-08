'use client';
import { CircleCheck, Ticket } from 'lucide-react';
import { useId, type FormEvent } from 'react';
import { cn } from '../cn';
import { Button } from './Button';
import { FieldShell } from './Field';

export interface PromoCodeProps {
  label: string; placeholder: string; applyLabel: string; removeLabel: string;
  value: string; onValueChange: (v: string) => void;
  onApply: () => void; onRemove: () => void;
  applied?: boolean; loading?: boolean;
  helper?: string; error?: string; appliedMessage?: string;
}

/** Figma: Promo Code (Default / Applied / Error). Размер скидки приходит из API, на фронте не считается. */
export function PromoCode(p: PromoCodeProps) {
  const id = useId();
  const invalid = Boolean(p.error);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!p.applied) p.onApply(); };
  return (
    <form onSubmit={submit}>
      <FieldShell id={id} label={p.label} error={p.error} helper={p.applied ? undefined : p.helper}>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-13 min-w-0 flex-1 items-center gap-2.5 rounded-md px-4',
              invalid ? 'border-[1.5px] border-error-600 bg-white'
                : p.applied ? 'border-[1.5px] border-success-600 bg-success-100'
                : 'border border-dark-200 bg-white focus-within:border-[1.5px] focus-within:border-primary-500 focus-within:focus-ring',
            )}
          >
            <Ticket className="size-5 shrink-0 text-dark-500" aria-hidden="true" />
            <input
              id={id}
              value={p.value}
              readOnly={p.applied}
              onChange={(e) => p.onValueChange(e.target.value)}
              placeholder={p.placeholder}
              aria-invalid={invalid || undefined}
              className="min-w-0 flex-1 bg-transparent text-body-m-medium text-dark-900 outline-none placeholder:text-dark-400"
            />
            {p.applied && <CircleCheck className="size-5 shrink-0 text-success-700" aria-hidden="true" />}
          </div>
          {p.applied ? (
            <Button variant="ghost" onClick={p.onRemove}>{p.removeLabel}</Button>
          ) : (
            <Button type="submit" variant="secondary" loading={p.loading}>{p.applyLabel}</Button>
          )}
        </div>
        {p.applied && p.appliedMessage && <p className="text-caption text-success-700" role="status">{p.appliedMessage}</p>}
      </FieldShell>
    </form>
  );
}
