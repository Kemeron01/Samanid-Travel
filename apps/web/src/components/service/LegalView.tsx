'use client';
import type { ContentLang, LegalDoc } from '@samanid/api';
import type { Locale } from '@samanid/i18n';
import { Alert, Breadcrumbs, buttonVariants, cn } from '@samanid/ui';
import { ArrowLeft, ChevronDown, ChevronUp, List } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { dateLong } from '@/lib/format';
import { AppLink } from '@/lib/ui-link';

const LANGS: ContentLang[] = ['ru', 'uz', 'en'];

/** Активный раздел по прокрутке (scrollspy). */
function useActive(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id);
    }, { rootMargin: '-96px 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return [active, setActive] as const;
}

/**
 * 5.7–5.9 Юридические документы — один шаблон (42:1203, 42:1380, 42:1545; mobile 70:1911, 70:2064).
 * Оглавление слева (на mobile — выпадающее «Содержание»), переключатель языка документа, «Скачать PDF», блок «Коротко», кнопка «наверх».
 */
export function LegalView({ docs }: { docs: LegalDoc[] }) {
  const t = useTranslations('service.legal'); const locale = useLocale() as Locale;
  const [lang, setLang] = useState<ContentLang>((docs.find((d) => d.lang === locale) ?? docs[0]!).lang);
  const doc = docs.find((d) => d.lang === lang) ?? docs[0]!;
  const ids = doc.sections.map((s) => s.id);
  const [active, setActive] = useActive(ids);
  const [tocOpen, setTocOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const on = () => setShowTop(window.scrollY > window.innerHeight);
    on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on);
  }, []);
  const go = (id: string) => { setActive(id); setTocOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${id}`); };
  const activeTitle = doc.sections.find((s) => s.id === active)?.title ?? doc.sections[0]?.title;
  const pdf = () => { if (doc.pdf_url) window.open(doc.pdf_url, '_blank', 'noopener'); else window.print(); };

  const tocItems = (mobile: boolean) => doc.sections.map((s) => (
    <li key={s.id}>
      <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); go(s.id); }} aria-current={active === s.id ? 'location' : undefined}
        className={cn('block rounded-[10px] px-3 py-2 text-body-s focus-visible:focus-ring', mobile && 'rounded-none border-t border-dark-100 px-4 py-3', active === s.id ? 'bg-primary-50 text-primary-600' : 'text-dark-700 hover:bg-dark-100')}>{s.title}</a>
    </li>
  ));

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <div className="hidden md:block print:hidden"><Breadcrumbs Link={AppLink} label={t('docs')} items={[{ label: t('home'), href: '/' }, { label: t('docs') }, { label: doc.title }]} /></div>
      <Link href="/" className="inline-flex items-center gap-2 self-start rounded-md text-body-s text-dark-500 focus-visible:focus-ring md:hidden print:hidden"><ArrowLeft aria-hidden="true" className="size-4" />{t('back')}</Link>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-16">
        <nav aria-label={t('toc')} className="sticky top-24 hidden w-[280px] shrink-0 rounded-[20px] border border-dark-200 bg-white p-4 lg:block print:hidden">
          <p className="mb-1 text-overline text-dark-500">{t('toc')}</p>
          <ul className="flex flex-col gap-1">{tocItems(false)}</ul>
        </nav>
        <article lang={doc.lang} className="flex min-w-0 max-w-[800px] flex-1 flex-col gap-5">
          <h1 className="text-h2 text-dark-900 md:text-h1">{doc.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-body-s text-dark-500"><span className="md:hidden">{t('editionShort', { date: dateLong(doc.edition, locale) })}</span><span className="hidden md:inline">{t('edition', { date: dateLong(doc.edition, locale) })}</span></p>
            <div role="group" aria-label={t('docLang')} className="flex gap-1.5 print:hidden">
              {LANGS.filter((l) => docs.some((d) => d.lang === l)).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
                  className={cn('relative rounded-xs px-2 py-0.5 text-caption uppercase focus-visible:focus-ring after:absolute after:-inset-2.5', lang === l ? 'bg-dark-900 text-white' : 'bg-dark-100 text-dark-700 hover:bg-dark-200')}>{l}</button>
              ))}
            </div>
            <button type="button" onClick={pdf} className="hidden rounded-md text-body-s-medium text-primary-500 hover:underline focus-visible:focus-ring md:inline print:hidden">{t('pdf')}</button>
          </div>
          <nav aria-label={t('toc')} className={cn('overflow-hidden rounded-[20px] border bg-white lg:hidden print:hidden', tocOpen ? 'border-primary-500' : 'border-dark-200')}>
            <button type="button" aria-expanded={tocOpen} aria-controls="toc-mobile" onClick={() => setTocOpen((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:focus-ring">
              <List aria-hidden="true" className="size-5 shrink-0 text-dark-700" />
              <span className="flex min-w-0 flex-1 flex-col"><span className="text-caption text-dark-500">{t('toc')}</span><span className="truncate text-body-s-medium text-dark-900">{activeTitle}</span></span>
              <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 text-dark-500 transition-transform', tocOpen && 'rotate-180')} />
            </button>
            <ul id="toc-mobile" hidden={!tocOpen}>{tocItems(true)}</ul>
          </nav>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex scroll-mt-24 flex-col gap-5">
              <h2 id={`${s.id}-h`} className="text-h5 text-dark-900 md:text-h4">{s.title}</h2>
              {s.summary && <Alert type="info" title={doc.summary_label || t('summary')}>{s.summary}</Alert>}
              {s.paragraphs.map((p, i) => <p key={i} className="text-body-m text-dark-700">{p}</p>)}
            </section>
          ))}
          <button type="button" onClick={pdf} className={buttonVariants({ variant: 'ghost', size: 'L', className: 'mt-2 w-full border-[1.5px] border-primary-500 md:hidden print:hidden' })}>{t('pdf')}</button>
        </article>
      </div>
      <button type="button" aria-label={t('toTop')} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn('fixed right-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-30 flex size-12 items-center justify-center rounded-full bg-dark-900 text-white shadow-lg transition-opacity focus-visible:focus-ring lg:hidden print:hidden', showTop ? 'opacity-100' : 'pointer-events-none opacity-0')}
        tabIndex={showTop ? 0 : -1} aria-hidden={!showTop}>
        <ChevronUp aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
