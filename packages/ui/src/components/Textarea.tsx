'use client';
import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '../cn';
import { FieldShell } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode; helper?: string; error?: string;
}

export function Textarea({ label, helper, error, id, className, disabled, required, ...rest }: TextareaProps) {
  const auto = useId();
  const fid = id ?? auto;
  const invalid = Boolean(error);
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <textarea
        id={fid}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? `${fid}-error` : helper ? `${fid}-helper` : undefined}
        className={cn(
          'min-h-28 w-full resize-y rounded-md px-4 py-3.5 text-body-m text-dark-900 outline-none placeholder:text-dark-400',
          disabled
            ? 'border border-dark-200 bg-dark-100'
            : invalid
              ? 'border-[1.5px] border-error-600 bg-white'
              : 'border border-dark-200 bg-white focus:border-[1.5px] focus:border-primary-500 focus:focus-ring',
        )}
        {...rest}
      />
    </FieldShell>
  );
}
