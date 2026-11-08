import { MapPin, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';

/** Figma 5.1 / 5.2 (41:6, 41:205, 41:352, 70:1406): крупный код ошибки, где «0» — кольцо с иконкой. */
function Ring({ kind }: { kind: 'pin' | 'refresh' }) {
  const Icon = kind === 'pin' ? MapPin : RefreshCw;
  return (
    <span className="flex size-[88px] shrink-0 items-center justify-center rounded-full border-[6px] border-primary-500 bg-primary-50 md:size-40 md:border-[10px]">
      <Icon className="size-9 text-primary-500 md:size-16" strokeWidth={kind === 'pin' ? 2 : 1.75} />
    </span>
  );
}
const Digit = ({ children }: { children: ReactNode }) => (
  <span className="text-[112px] leading-[120px] font-extrabold tracking-[-1.5px] text-dark-900 md:text-[200px] md:leading-[210px]">{children}</span>
);

export function ErrorHero({ code, title, text, actions }: { code: '404' | '500'; title: string; text: string; actions: ReactNode }) {
  return (
    <section className="flex flex-col items-center gap-4 px-4 pt-12 pb-16 text-center md:gap-5 md:pt-[120px] md:pb-[140px]">
      <p aria-label={code} className="flex items-center gap-2 md:gap-4">
        <span aria-hidden="true" className="contents">
          {code === '404' ? <><Digit>4</Digit><Ring kind="pin" /><Digit>4</Digit></> : <><Digit>5</Digit><Ring kind="refresh" /><Ring kind="refresh" /></>}
        </span>
      </p>
      <h1 className="text-h3 text-dark-900 md:text-h1">{title}</h1>
      <p className="max-w-[560px] text-body-m text-dark-600 md:text-body-l">{text}</p>
      <div className="mt-1 flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">{actions}</div>
    </section>
  );
}
