'use client';
import * as Popover from '@radix-ui/react-popover';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Calendar as CalendarIcon, Check, ChevronDown, MapPin } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '../cn';
import { Calendar, formatISO, type ISODate } from './Calendar';
import { ErrorIcon, FieldShell, fieldBoxClass, fieldInputClass } from './Field';

interface BaseFieldProps { label?: string; helper?: string; error?: string; disabled?: boolean; required?: boolean; id?: string; className?: string }

/** Figma: Input / Select (Radix Select, клавиатура и ARIA из коробки). */
export function Select({ label, helper, error, disabled, required, id, className, placeholder, options, value, onValueChange }: BaseFieldProps & {
  placeholder: string; options: { value: string; label: string }[]; value?: string; onValueChange: (v: string) => void;
}) {
  const auto = useId(); const fid = id ?? auto; const invalid = Boolean(error);
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled} required={required}>
        <SelectPrimitive.Trigger id={fid} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${fid}-error` : helper ? `${fid}-helper` : undefined}
          className={cn(fieldBoxClass({ invalid, disabled }), 'text-left text-body-m text-dark-900 outline-none focus-visible:border-[1.5px] focus-visible:border-primary-500 focus-visible:focus-ring data-[placeholder]:text-dark-400')}>
          <span className="min-w-0 flex-1 truncate"><SelectPrimitive.Value placeholder={placeholder} /></span>
          <SelectPrimitive.Icon><ChevronDown className="size-5 text-dark-500" aria-hidden="true" /></SelectPrimitive.Icon>
          {invalid && <ErrorIcon />}
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content position="popper" sideOffset={8} className="z-50 max-h-72 w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-dark-200 bg-white p-2 shadow-lg">
            <SelectPrimitive.Viewport>
              {options.map((o) => (
                <SelectPrimitive.Item key={o.value} value={o.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-body-m text-dark-900 outline-none data-[highlighted]:bg-dark-100 data-[state=checked]:bg-primary-50">
                  <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="ml-auto"><Check className="size-[18px] text-primary-500" aria-hidden="true" /></SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FieldShell>
  );
}

/** Figma: Input / Phone. Код страны слева (+998), разделитель, номер. Формат номера — на стороне валидации (zod). */
export function PhoneInput({ label, helper, error, disabled, required, id, className, countryCode = '+998', ...rest }: BaseFieldProps & { countryCode?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'disabled' | 'required'>) {
  const auto = useId(); const fid = id ?? auto; const invalid = Boolean(error);
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <div className={fieldBoxClass({ invalid, disabled })}>
        <span className="text-body-m-medium text-dark-900">{countryCode}</span>
        <span aria-hidden="true" className="h-6 w-px bg-dark-200" />
        <input id={fid} type="tel" inputMode="tel" autoComplete="tel-national" disabled={disabled} required={required} aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${fid}-error` : helper ? `${fid}-helper` : undefined} className={fieldInputClass} {...rest} />
        {invalid && <ErrorIcon />}
      </div>
    </FieldShell>
  );
}

export interface AddressOption { id: string; title: string; subtitle: string }

/** Figma: Input / Address + Dropdown / Address suggestions. Источник подсказок — снаружи (API/геокодер). */
export function AddressInput({ label, helper, error, disabled, required, id, className, value, onValueChange, suggestions, onSelect, placeholder, listLabel }: BaseFieldProps & {
  value: string; onValueChange: (v: string) => void; suggestions: AddressOption[]; onSelect: (o: AddressOption) => void; placeholder?: string; listLabel: string;
}) {
  const auto = useId(); const fid = id ?? auto; const invalid = Boolean(error);
  const [open, setOpen] = useState(false); const [active, setActive] = useState(0);
  const show = open && suggestions.length > 0;
  const choose = (o: AddressOption) => { onSelect(o); setOpen(false); };
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={cn('relative', className)}>
      <div className={fieldBoxClass({ invalid, disabled })}>
        <MapPin className="size-5 shrink-0 text-dark-500" aria-hidden="true" />
        <input id={fid} role="combobox" aria-expanded={show} aria-controls={`${fid}-list`} aria-autocomplete="list" aria-activedescendant={show ? `${fid}-o${active}` : undefined}
          aria-invalid={invalid || undefined} disabled={disabled} required={required} placeholder={placeholder} value={value} autoComplete="off" className={fieldInputClass}
          onChange={(e) => { onValueChange(e.target.value); setOpen(true); setActive(0); }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && show && suggestions[active]) { e.preventDefault(); choose(suggestions[active]!); }
            else if (e.key === 'Escape') setOpen(false);
          }} />
        {invalid && <ErrorIcon />}
      </div>
      {show && (
        <ul id={`${fid}-list`} role="listbox" aria-label={listLabel} className="absolute top-full z-50 mt-2 flex w-full flex-col gap-0.5 rounded-lg border border-dark-200 bg-white p-2 shadow-lg">
          {suggestions.map((o, i) => (
            <li key={o.id} id={`${fid}-o${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => { e.preventDefault(); choose(o); }} onMouseEnter={() => setActive(i)}
              className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5', i === active && 'bg-primary-50')}>
              <MapPin className={cn('size-5 shrink-0', i === active ? 'text-primary-500' : 'text-dark-500')} aria-hidden="true" />
              <span className="flex min-w-0 flex-col"><span className="truncate text-body-s-medium text-dark-900">{o.title}</span><span className="truncate text-caption text-dark-500">{o.subtitle}</span></span>
            </li>
          ))}
        </ul>
      )}
    </FieldShell>
  );
}

type DateBase = BaseFieldProps & { locale: string; placeholder: string; prevLabel: string; nextLabel: string; hint?: string; minDate?: ISODate; maxDate?: ISODate };

function DatePopover({ label, helper, error, disabled, required, id, className, display, placeholder, calendar }: BaseFieldProps & { display?: string; placeholder: string; calendar: (close: () => void) => React.ReactNode }) {
  const auto = useId(); const fid = id ?? auto; const invalid = Boolean(error); const [open, setOpen] = useState(false);
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger id={fid} disabled={disabled} aria-invalid={invalid || undefined}
          className={cn(fieldBoxClass({ invalid, disabled }), 'text-left text-body-m outline-none focus-visible:border-[1.5px] focus-visible:border-primary-500 focus-visible:focus-ring', display ? 'text-dark-900' : 'text-dark-400')}>
          <CalendarIcon className="size-5 shrink-0 text-dark-500" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{display ?? placeholder}</span>
          {invalid && <ErrorIcon />}
        </Popover.Trigger>
        <Popover.Portal><Popover.Content align="start" sideOffset={8} className="z-50 max-w-[calc(100vw-2rem)]">{calendar(() => setOpen(false))}</Popover.Content></Popover.Portal>
      </Popover.Root>
    </FieldShell>
  );
}

/** Figma: Input / Date. */
export function DateInput({ value, onValueChange, locale, placeholder, prevLabel, nextLabel, hint, minDate, maxDate, ...f }: DateBase & { value?: ISODate; onValueChange: (v: ISODate) => void }) {
  return (
    <DatePopover {...f} placeholder={placeholder} display={value ? formatISO(value, locale, { day: 'numeric', month: 'long', year: 'numeric' }) : undefined}
      calendar={(close) => <Calendar mode="single" value={value ? [value] : []} onChange={([d]) => { if (d) { onValueChange(d); close(); } }} locale={locale} minDate={minDate} maxDate={maxDate} prevLabel={prevLabel} nextLabel={nextLabel} hint={hint} />} />
  );
}

/** Figma: Input / Date range. */
export function DateRangeInput({ value, onValueChange, locale, placeholder, prevLabel, nextLabel, hint, minDate, maxDate, ...f }: DateBase & { value: ISODate[]; onValueChange: (v: ISODate[]) => void }) {
  const [s, e] = value;
  // Figma 19:1261: «12 мая — 31 мая 2027» — длинное тире, год только у конечной даты (без «г.»).
  const withYear = (d: ISODate) => `${formatISO(d, locale)}${locale.startsWith('en') ? ',' : ''} ${d.slice(0, 4)}`;
  const display = s ? `${formatISO(s, locale)} — ${e ? withYear(e) : ''}`.trimEnd() : undefined;
  return (
    <DatePopover {...f} placeholder={placeholder} display={display}
      calendar={(close) => <Calendar mode="range" value={value} onChange={(v) => { onValueChange(v); if (v.length === 2) close(); }} locale={locale} minDate={minDate} maxDate={maxDate} prevLabel={prevLabel} nextLabel={nextLabel} hint={hint} />} />
  );
}

const toText = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); return m ? `${m[3]}.${m[2]}.${m[1]}` : ''; };
const maskDate = (raw: string) => { const d = raw.replace(/\D/g, '').slice(0, 8); return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('.'); };
const toISO = (txt: string) => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(txt); if (!m) return '';
  const [, dd, mm, yyyy] = m; const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
  return d.getUTCFullYear() === Number(yyyy) && d.getUTCMonth() + 1 === Number(mm) && d.getUTCDate() === Number(dd) ? `${yyyy}-${mm}-${dd}` : '';
};

/** Дата текстом ДД.ММ.ГГГГ с маской (паспортные данные, даты рождения). Значение наружу — ISO или ''. Figma: поле даты с иконкой календаря. */
export function DateTextInput({ label, helper, error, disabled, required, id, className, value, onValueChange, placeholder = 'DD.MM.YYYY' }: BaseFieldProps & { value: string; onValueChange: (iso: string) => void; placeholder?: string }) {
  const auto = useId(); const fid = id ?? auto; const invalid = Boolean(error);
  const [txt, setTxt] = useState(toText(value));
  const [prev, setPrev] = useState(value);
  if (value !== prev) { setPrev(value); if (toISO(txt) !== value) setTxt(toText(value)); }
  return (
    <FieldShell id={fid} label={label} helper={helper} error={error} required={required} className={className}>
      <div className={fieldBoxClass({ invalid, disabled })}>
        <CalendarIcon className="size-5 shrink-0 text-dark-500" aria-hidden="true" />
        <input id={fid} inputMode="numeric" autoComplete="off" placeholder={placeholder} disabled={disabled} required={required} value={txt} aria-invalid={invalid || undefined}
          aria-describedby={invalid ? `${fid}-error` : helper ? `${fid}-helper` : undefined} className={fieldInputClass}
          onChange={(e) => { const m = maskDate(e.target.value); setTxt(m); const iso = toISO(m); setPrev(iso); onValueChange(iso); }} />
        {invalid && <ErrorIcon />}
      </div>
    </FieldShell>
  );
}
