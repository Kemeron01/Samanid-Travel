'use client';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ReactNode } from 'react';
import { cn } from '../cn';

/** Тонкая обёртка над Radix Popover: триггер — любой элемент, содержимое — карточка с тенью. */
export function Popover({ trigger, children, open, onOpenChange, align = 'start', className, triggerClassName, triggerLabel }: {
  trigger: ReactNode; children: ReactNode; open?: boolean; onOpenChange?: (o: boolean) => void;
  align?: 'start' | 'center' | 'end'; className?: string; triggerClassName?: string; triggerLabel?: string;
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger aria-label={triggerLabel} className={triggerClassName}>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align={align} sideOffset={8} className={cn('z-50 max-w-[calc(100vw-2rem)] rounded-xl border border-dark-200 bg-white shadow-lg', className)}>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
