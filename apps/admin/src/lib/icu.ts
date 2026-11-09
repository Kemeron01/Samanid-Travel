import { intlLocale, type Locale } from '@samanid/i18n';

/** Мини-ICU для превью карточки сайта: «{count, plural, one {# день} …}» и «{var}». Словари сайта — в формате next-intl. */
export function icu(msg: string, vars: Record<string, string | number>, locale: Locale): string {
  const pr = new Intl.PluralRules(intlLocale[locale]);
  let out = msg.replace(/\{(\w+), plural, ((?:[^{}]*\{[^{}]*\})+)\}/g, (_m, name: string, body: string) => {
    const n = Number(vars[name]); const cats: Record<string, string> = {};
    body.replace(/(\w+|=\d+)\s*\{([^{}]*)\}/g, (_x, k: string, v: string) => { cats[k] = v; return ''; });
    const branch = cats[`=${n}`] ?? cats[pr.select(n)] ?? cats.other ?? '';
    return branch.replace(/#/g, String(n));
  });
  out = out.replace(/\{(\w+)\}/g, (_m, k: string) => String(vars[k] ?? `{${k}}`));
  return out;
}
