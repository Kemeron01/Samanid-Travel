'use client';
import { TriangleAlert } from 'lucide-react';
import { cn } from '../cn';

/** Общие классы «рамки» поля. Figma: UI-Kit / Inputs — высота 52, радиус 12. */
export function fieldBoxClass(opts: { invalid?: boolean; disabled?: boolean }) {
  return cn(
    'flex h-13 w-full items-center gap-2.5 overflow-hidden rounded-md px-4 transition-shadow',
    opts.disabled
      ? 'border border-dark-200 bg-dark-100'
      : opts.invalid
        ? 'border-[1.5px] border-error-600 bg-white'
        : 'border border-dark-200 bg-white focus-within:border-[1.5px] focus-within:border-primary-500 focus-within:focus-ring',
  );
}

export const fieldInputClass =
  'min-w-0 flex-1 bg-transparent text-body-m text-dark-900 outline-none placeholder:text-dark-400 disabled:text-dark-700';

/** Лейбл всегда над полем; ошибка = красная рамка + иконка + текст (не только цвет). */
export function FieldShell({
  id, label, helper, error, required, children, className,
}: {
  id: string; label?: React.ReactNode; helper?: string; error?: string; required?: boolean;
  children: React.ReactNode; className?: string;
}) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;
  return (
    <div className={cn('flex flex-col gap-2', className)} data-described-by={describedBy}>
      {label && (
        <label htmlFor={id} className="text-body-s-medium text-dark-700">
          {label}
          {required && <span aria-hidden="true" className="text-error-600"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-error-700">{error}</p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-caption text-dark-500">{helper}</p>
      ) : null}
    </div>
  );
}

export function ErrorIcon() {
  return <TriangleAlert className="size-5 shrink-0 text-error-600" aria-hidden="true" />;
}
