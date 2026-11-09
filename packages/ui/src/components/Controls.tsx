'use client';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SliderPrimitive from '@radix-ui/react-slider';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { Check, Minus } from 'lucide-react';
import { useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '../cn';

const row = 'flex min-h-10 items-center gap-3 py-2';
const labelCls = 'text-body-m text-dark-900 peer-disabled:text-dark-400 cursor-pointer';

/** Чекбокс всегда с текстовым лейблом (Figma: Controls). Для форм; для мгновенных настроек — Switch. */
export function Checkbox({ label, className, id, ...rest }: ComponentProps<typeof CheckboxPrimitive.Root> & { label: ReactNode }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn(row, className)}>
      <CheckboxPrimitive.Root
        id={fid}
        className="peer flex size-[22px] shrink-0 items-center justify-center rounded-xs border-[1.5px] border-dark-300 bg-white text-white focus-visible:focus-ring data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500 data-[state=indeterminate]:border-primary-500 data-[state=indeterminate]:bg-primary-500 disabled:border-dark-200 disabled:bg-dark-100"
        {...rest}
      >
        <CheckboxPrimitive.Indicator>
          {rest.checked === 'indeterminate' ? <Minus className="size-4" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={fid} className={cn(labelCls, rest.disabled && 'cursor-not-allowed text-dark-400')}>{label}</label>
    </div>
  );
}

export interface RadioOption { value: string; label: ReactNode; disabled?: boolean }

export function RadioGroup({ options, className, ...rest }: ComponentProps<typeof RadioGroupPrimitive.Root> & { options: RadioOption[] }) {
  const gid = useId();
  return (
    <RadioGroupPrimitive.Root className={cn('flex flex-col', className)} {...rest}>
      {options.map((o) => {
        const id = `${gid}-${o.value}`;
        return (
          <div key={o.value} className={row}>
            <RadioGroupPrimitive.Item
              id={id}
              value={o.value}
              disabled={o.disabled}
              className="peer flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-dark-300 bg-white focus-visible:focus-ring data-[state=checked]:border-primary-500 disabled:border-dark-200 disabled:bg-dark-100"
            >
              <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary-500" />
            </RadioGroupPrimitive.Item>
            <label htmlFor={id} className={cn(labelCls, o.disabled && 'cursor-not-allowed text-dark-400')}>{o.label}</label>
          </div>
        );
      })}
    </RadioGroupPrimitive.Root>
  );
}

/** Toggle — для мгновенных настроек (track 44×26). */
export function Switch({ label, className, id, ...rest }: ComponentProps<typeof SwitchPrimitive.Root> & { label: ReactNode }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className={cn(row, className)}>
      <SwitchPrimitive.Root
        id={fid}
        className="peer relative h-[26px] w-11 shrink-0 rounded-full bg-dark-300 transition-colors focus-visible:focus-ring data-[state=checked]:bg-primary-500 disabled:bg-dark-100"
        {...rest}
      >
        <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" />
      </SwitchPrimitive.Root>
      <label htmlFor={fid} className={cn(labelCls, rest.disabled && 'cursor-not-allowed text-dark-400')}>{label}</label>
    </div>
  );
}

export interface SegmentedOption { value: string; label: ReactNode }

/** Segmented control: «Полностью / Рассрочка». */
export function SegmentedControl({ options, value, onValueChange, label, className, allowEmpty = false }: {
  options: SegmentedOption[]; value: string; onValueChange: (v: string) => void; label: string; className?: string;
  /** Повторное нажатие на активный вариант снимает выбор (onValueChange('')). */
  allowEmpty?: boolean;
}) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      aria-label={label}
      onValueChange={(v) => (v || allowEmpty) && onValueChange(v)}
      className={cn('inline-flex gap-1 rounded-full bg-dark-100 p-1', className)}
    >
      {options.map((o) => (
        <ToggleGroupPrimitive.Item
          key={o.value}
          value={o.value}
          className="min-h-10 rounded-full px-6 py-2.5 text-body-s-medium text-dark-600 focus-visible:focus-ring data-[state=on]:bg-white data-[state=on]:text-dark-900 data-[state=on]:shadow-sm"
        >
          {o.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}

export interface TabItem { value: string; label: ReactNode; content?: ReactNode }

/** Табы тура: подчёркивание 3px. На mobile прокручиваются пальцем (scroll-snap). */
export function Tabs({ items, className, ...rest }: ComponentProps<typeof TabsPrimitive.Root> & { items: TabItem[] }) {
  return (
    <TabsPrimitive.Root className={className} {...rest}>
      <TabsPrimitive.List className="flex snap-x gap-8 overflow-x-auto [scrollbar-width:none]">
        {items.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            className="relative min-h-11 shrink-0 snap-start whitespace-nowrap py-2.5 text-body-m-medium text-dark-600 focus-visible:focus-ring data-[state=active]:text-primary-500 data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-[3px] data-[state=active]:after:rounded-xs data-[state=active]:after:bg-primary-500"
          >
            {t.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((t) => t.content && <TabsPrimitive.Content key={t.value} value={t.value} className="pt-6">{t.content}</TabsPrimitive.Content>)}
    </TabsPrimitive.Root>
  );
}

/** Слайдер цены (два ползунка). Подписи/форматирование приходят снаружи (Intl по локали). */
export function PriceRangeSlider({ label, valueLabel, minLabel, maxLabel, thumbLabels, className, ...rest }: ComponentProps<typeof SliderPrimitive.Root> & {
  label: string; valueLabel: string; minLabel: string; maxLabel: string; thumbLabels: [string, string];
}) {
  return (
    <div className={cn('flex w-full max-w-80 flex-col gap-4', className)}>
      <div className="flex justify-between text-body-s-medium">
        <span className="text-dark-700">{label}</span>
        <span className="text-primary-500">{valueLabel}</span>
      </div>
      <SliderPrimitive.Root className="relative flex h-6 touch-none items-center select-none" minStepsBetweenThumbs={1} {...rest}>
        <SliderPrimitive.Track className="relative h-1 grow rounded-xs bg-dark-200">
          <SliderPrimitive.Range className="absolute h-full rounded-xs bg-primary-500" />
        </SliderPrimitive.Track>
        {thumbLabels.map((l, i) => (
          <SliderPrimitive.Thumb key={i} aria-label={l} className="block size-6 rounded-full border-2 border-primary-500 bg-white shadow-md focus-visible:focus-ring" />
        ))}
      </SliderPrimitive.Root>
      <div className="flex justify-between text-caption text-dark-500"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  );
}

/** Слайдер с одним ползунком (баллы). Подписи приходят снаружи (Intl). */
export function SingleSlider({ label, valueLabel, minLabel, maxLabel, thumbLabel, className, ...rest }: Omit<ComponentProps<typeof SliderPrimitive.Root>, 'value' | 'onValueChange'> & {
  label: string; valueLabel: string; minLabel: string; maxLabel: string; thumbLabel: string; value: number; onValueChange: (v: number) => void;
}) {
  const { value, onValueChange, ...root } = rest as typeof rest & { value: number; onValueChange: (v: number) => void };
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex justify-between text-body-s-medium"><span className="text-dark-700">{label}</span><span className="text-primary-500">{valueLabel}</span></div>
      <SliderPrimitive.Root className="relative flex h-6 touch-none items-center select-none" value={[value]} onValueChange={([v]) => onValueChange(v ?? 0)} {...root}>
        <SliderPrimitive.Track className="relative h-1 grow rounded-xs bg-dark-200"><SliderPrimitive.Range className="absolute h-full rounded-xs bg-primary-500" /></SliderPrimitive.Track>
        <SliderPrimitive.Thumb aria-label={thumbLabel} className="block size-6 rounded-full border-2 border-primary-500 bg-white shadow-md focus-visible:focus-ring" />
      </SliderPrimitive.Root>
      <div className="flex justify-between text-caption text-dark-500"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  );
}
