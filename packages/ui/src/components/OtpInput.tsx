'use client';
import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '../cn';

export interface OtpInputProps {
  value: string; onChange: (v: string) => void; length?: number;
  helper?: string; error?: string; label: string; className?: string;
}

/** Figma: OTP Code (2FA). 6 ячеек 52×60 с разделителем после 3-й. */
export function OtpInput({ value, onChange, length = 6, helper, error, label, className }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? '');
  // Актуальное значение между рендерами: быстрый ввод/автозаполнение не должен терять цифры из-за устаревшего замыкания.
  const latest = useRef(chars);
  latest.current = chars;
  const focusAt = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  /** Записывает одну или несколько цифр начиная с ячейки i (автозаполнение one-time-code приходит строкой). */
  const set = (i: number, digits: string) => {
    const next = latest.current.slice();
    if (!digits) next[i] = '';
    digits.split('').forEach((d, k) => { if (i + k < length) next[i + k] = d; });
    latest.current = next;
    onChange(next.join('').slice(0, length));
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !chars[i]) { focusAt(i - 1); }
    if (e.key === 'ArrowLeft') focusAt(i - 1);
    if (e.key === 'ArrowRight') focusAt(i + 1);
  };
  const onPaste = (e: ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (digits) { e.preventDefault(); onChange(digits); focusAt(digits.length); }
  };
  const invalid = Boolean(error);

  return (
    <div role="group" aria-label={label} className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3" onPaste={onPaste}>
        {chars.map((ch, i) => (
          <span key={i} className="contents">
            {i === length / 2 && <span aria-hidden="true" className="text-h4 text-dark-300">–</span>}
            <input
              ref={(el) => { refs.current[i] = el; }}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={i === 0 ? length : 1}
              value={ch}
              aria-label={`${i + 1} / ${length}`}
              aria-invalid={invalid || undefined}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                // Ячейка уже содержала цифру → берём новую (последнюю); иначе — всё введённое (автозаполнение).
                const d = raw.length > 1 && ch ? raw.slice(-1) : raw.slice(0, length - i);
                set(i, d);
                if (d) focusAt(i + d.length);
              }}
              onKeyDown={(e) => onKey(i, e)}
              className={cn(
                'h-15 w-13 rounded-md bg-white text-center text-h4 text-dark-900 outline-none',
                invalid
                  ? 'border-[1.5px] border-error-600'
                  : 'border border-dark-200 focus:border-[1.5px] focus:border-primary-500 focus:focus-ring',
              )}
            />
          </span>
        ))}
      </div>
      {(error || helper) && (
        <p role={error ? 'alert' : undefined} className={cn('text-caption', error ? 'text-error-700' : 'text-dark-500')}>
          {error ?? helper}
        </p>
      )}
    </div>
  );
}
