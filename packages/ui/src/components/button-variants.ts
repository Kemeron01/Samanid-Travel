import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Figma: UI-Kit / Buttons (7:503).
 * Primary (оранжевая) — одна на экран, текст тёмный (белый на #FF7A1A запрещён: контраст 2.6:1).
 * Danger — только для необратимых действий, всегда через подтверждение в модалке.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full transition-colors select-none disabled:cursor-not-allowed focus-visible:focus-ring',
  {
    variants: {
      variant: {
        primary: 'bg-accent-500 text-dark-900 hover:bg-accent-600 disabled:bg-dark-200 disabled:text-dark-500',
        secondary: 'bg-primary-500 text-white hover:bg-primary-600 disabled:bg-dark-200 disabled:text-dark-500',
        outline: 'border border-dark-300 bg-bg-surface text-dark-900 hover:bg-dark-100 disabled:text-dark-400 disabled:border-dark-200',
        ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 disabled:text-dark-400',
        danger: 'bg-error-600 text-white hover:bg-error-700 disabled:bg-dark-200 disabled:text-dark-500',
      },
      size: {
        L: 'h-14 px-8 text-button-l',
        M: 'h-11 px-6 text-button-m',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'M' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
