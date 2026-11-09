import { formatMoney, intlLocale, type Locale } from '@samanid/i18n';
import { useTranslation } from 'react-i18next';

/** Форматтеры по текущему языку админки (Intl). Суммы — USD, приходят из API. */
export function useFmt() {
  const { i18n } = useTranslation(); const l = (i18n.resolvedLanguage ?? 'ru') as Locale; const loc = intlLocale[l];
  const uzMonths = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
  const d = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return {
    locale: l,
    money: (n: number) => formatMoney(n, l),
    money2: (n: number) => formatMoney(n, l, 'USD', 2),
    num: (n: number) => new Intl.NumberFormat(loc).format(n).replace(/ /g, ' '),
    /** «12 мая» / «12-may» / «May 12» */
    day: (iso: string) => l === 'uz' ? `${d(iso).getDate()}-${['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'][d(iso).getMonth()]}` : new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long' }).format(d(iso)),
    /** «14 апр» */
    dayShort: (iso: string) => l === 'uz' ? `${d(iso).getDate()}-${uzMonths[d(iso).getMonth()]}` : new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }).format(d(iso)).replace('.', ''),
    date: (iso: string) => new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric' }).format(d(iso)).replace(/\s*г\.$/, ''),
    /** «14.04 09:12» */
    stamp: (iso: string, secs = false) => { const x = d(iso); const p = (n: number) => String(n).padStart(2, '0'); return `${p(x.getDate())}.${p(x.getMonth() + 1)} ${p(x.getHours())}:${p(x.getMinutes())}${secs ? `:${p(x.getSeconds())}` : ''}`; },
    /** «14 апр, 09:12» */
    dayTime: (iso: string) => { const x = d(iso); return `${l === 'uz' ? `${x.getDate()}-${uzMonths[x.getMonth()]}` : new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }).format(x).replace('.', '')}, ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; },
    time: (iso: string) => d(iso).toTimeString().slice(0, 8),
    weekday: (iso: string) => new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(d(iso)).replace('.', ''),
    range: (a: string, b: string) => { const A = d(a); const B = d(b); const sameMonth = A.getMonth() === B.getMonth(); const f = (x: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(loc, o).format(x); return sameMonth ? `${A.getDate()}–${f(B, { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '')}` : `${f(A, { day: 'numeric', month: 'long' })} — ${f(B, { day: 'numeric', month: 'long', year: 'numeric' }).replace(/\s*г\.$/, '')}`; },
  };
}
