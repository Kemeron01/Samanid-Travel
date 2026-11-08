'use client';
import { Search } from 'lucide-react';
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';
import { ErrorIcon, FieldShell, fieldBoxClass, fieldInputClass } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helper?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** 'search' добавляет иконку лупы слева (Figma: Input / Search). */
  variant?: 'text' | 'search';
}

export function Input({ label, helper, error, leading, trailing, variant = 'text', id, className, disabled, required, ...rest }: InputProps) {
  const auto = useId();
  const fid = id ?? auto;
  const invalid = Boolean(error);
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <div className={fieldBoxClass({ invalid, disabled })}>
        {variant === 'search' && <Search className="size-5 shrink-0 text-dark-500" aria-hidden="true" />}
        {leading}
        <input
          id={fid}
          className={cn(fieldInputClass)}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${fid}-error` : helper ? `${fid}-helper` : undefined}
          {...rest}
        />
        {invalid ? <ErrorIcon /> : trailing}
      </div>
    </FieldShell>
  );
}
