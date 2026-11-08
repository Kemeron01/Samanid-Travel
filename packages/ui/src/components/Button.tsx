'use client';
import type { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../cn';
import { buttonVariants } from './button-variants';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ variant, size, loading, disabled, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
