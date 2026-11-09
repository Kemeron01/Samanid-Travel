import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Figma: UI-Kit / Buttons (7:503). L — 56px, отступы 28px, иконка 20; M — 44px, отступы 20px, иконка 18.
 * Outline — рамка 1.5px primary-500, текст primary-500. Disabled — dark-100 / текст dark-400.
 * Primary (оранжевая) — одна на экран, текст тёмный (белый на #FF7A1A запрещён: контраст 2.6:1).
 * Danger — только для необратимых действий, всегда через подтверждение в модалке.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full transition-colors select-none disabled:cursor-not-allowed focus-visible:focus-ring',
  {
    variants: {
      variant: {
        primary: 'bg-accent-500 text-dark-900 hover:bg-accent-600 disabled:bg-dark-100 disabled:text-dark-400',
        secondary: 'bg-primary-500 text-white hover:bg-primary-600 disabled:bg-dark-100 disabled:text-dark-400',
        outline: 'border-[1.5px] border-primary-500 bg-bg-surface text-primary-500 hover:bg-primary-50 disabled:border-dark-200 disabled:bg-dark-100 disabled:text-dark-400',
        ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 disabled:text-dark-400',
        danger: 'bg-error-600 text-white hover:bg-error-700 disabled:bg-dark-100 disabled:text-dark-400',
      },
      size: {
        L: 'h-14 px-7 text-button-l [&_svg]:size-5',
        M: 'h-11 px-5 text-button-m [&_svg]:size-[18px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'M' },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
