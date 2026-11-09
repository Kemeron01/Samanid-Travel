'use client';
import type { FaqCategory, FaqItem } from '@samanid/api';
import { Button, Chip, EmptyState, Input, cn } from '@samanid/ui';
import { Minus, Plus, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useDeferredValue, useId, useMemo, useState } from 'react';

const CATS: ('all' | FaqCategory)[] = ['all', 'payment', 'cancel', 'visa', 'trip'];

function Item({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const id = useId();
  return (
    <li className={cn('rounded-[20px] bg-white px-5 py-4 md:px-6 md:py-5', open ? 'border-[1.5px] border-primary-500' : 'border border-dark-200')}>
      <h2>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="flex w-full items-center gap-3 rounded-md text-left focus-visible:focus-ring">
          <span className="min-w-0 flex-1 text-h6 text-dark-900">{item.q}</span>
          <span aria-hidden="true" className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', open ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-700')}>
            {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
          </span>
        </button>
      </h2>
      <div id={id} role="region" hidden={!open} className="mt-2.5 text-body-s text-dark-600">{item.a}</div>
    </li>
  );
}

/** 5.6 FAQ (42:831 / 42:1026): поиск, чипы категорий, аккордеон, блок «Не нашли ответ?». */
export function FaqView({ items, telegram }: { items: FaqItem[]; telegram: string }) {
  const t = useTranslations('service.faq');
  const [query, setQuery] = useState(''); const [cat, setCat] = useState<'all' | FaqCategory>('all');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const q = useDeferredValue(query.trim().toLocaleLowerCase());
  const list = useMemo(() => items.filter((i) => (cat === 'all' || i.category === cat) && (!q || `${i.q} ${i.a}`.toLocaleLowerCase().includes(q))), [items, cat, q]);
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="flex flex-col gap-4">
      <Input variant="search" type="search" aria-label={t('search')} placeholder={t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div role="group" aria-label={t('categories')} className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {CATS.map((c) => <Chip key={c} selected={cat === c} onClick={() => setCat(c)} className="shrink-0 snap-start" >{t(`cat.${c}`)}</Chip>)}
      </div>
      <p className="sr-only" aria-live="polite">{t('results', { count: list.length })}</p>
      {list.length ? (
        <ul className="flex flex-col gap-3 md:gap-4">{list.map((i) => <Item key={i.id} item={i} open={open.has(i.id)} onToggle={() => toggle(i.id)} />)}</ul>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <EmptyState title={t('empty')} text={t('emptyText')} className="w-full" />
          <Button variant="ghost" onClick={() => { setQuery(''); setCat('all'); }}>{t('reset')}</Button>
        </div>
      )}
      <a href={`https://t.me/${telegram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-[20px] bg-primary-50 p-5 focus-visible:focus-ring">
        <Send aria-hidden="true" className="size-6 shrink-0 text-primary-500" />
        <span className="flex min-w-0 flex-col gap-0.5 font-medium">
          <span className="text-body-m-medium text-dark-900">{t('helpTitle')}</span>
          <span className="text-caption text-dark-600">{t('helpText', { handle: telegram })}</span>
        </span>
      </a>
    </div>
  );
}
