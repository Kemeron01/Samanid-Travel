'use client';
import { cn } from '@samanid/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Горизонтальная карусель со scroll-snap; на mobile листается пальцем, стрелки — только на desktop.
 * Figma (16:166): стрелки 48px в строке заголовка справа; доступное направление — primary, недоступное — белая с обводкой.
 * `head` — заголовок секции (слева от стрелок), `toolbar` — содержимое между заголовком и лентой (чипы).
 */
export function Carousel({ children, prevLabel, nextLabel, label, head, toolbar, dots = true, arrows: showArrows = true, className, itemClassName, gapClassName = 'md:gap-[26px]', headClassName = 'mb-4 md:mb-6' }: {
  children: ReactNode[]; prevLabel: string; nextLabel: string; label?: string; head?: ReactNode; toolbar?: ReactNode; dots?: boolean; arrows?: boolean;
  className?: string; itemClassName?: string; gapClassName?: string; headClassName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ prev: false, next: true });
  const [active, setActive] = useState(0);
  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setEdge({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setActive(atEnd ? el.children.length - 1 : Math.round(el.scrollLeft / step));
  }, []);
  useEffect(() => {
    update();
    const el = ref.current; if (!el) return;
    el.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [update, children.length]);
  const scroll = (dir: 1 | -1) => { const el = ref.current; if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' }); };
  const arrow = (dir: 1 | -1) => {
    const on = dir === 1 ? edge.next : edge.prev; const Icon = dir === 1 ? ChevronRight : ChevronLeft;
    return (
      <button type="button" aria-label={dir === 1 ? nextLabel : prevLabel} aria-disabled={!on} onClick={() => on && scroll(dir)}
        className={cn('inline-flex size-12 items-center justify-center rounded-full focus-visible:focus-ring',
          on ? 'bg-primary-500 text-white hover:bg-primary-600' : 'cursor-default border border-dark-200 bg-white text-dark-900')}>
        <Icon className="size-5" aria-hidden="true" />
      </button>
    );
  };
  const arrows = showArrows ? <div className="hidden shrink-0 gap-3 md:flex" data-carousel-controls>{arrow(-1)}{arrow(1)}</div> : null;
  return (
    <div className={cn('relative', className)}>
      {head ? <div className={cn('flex items-end justify-between gap-4', headClassName)}>{head}{arrows}</div> : arrows && <div className="mb-6 hidden justify-end md:flex">{arrows}</div>}
      {toolbar}
      <ul ref={ref} tabIndex={0} aria-label={label} className={cn('-mx-4 flex scroll-px-4 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 -mb-4 md:scroll-px-0 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden', gapClassName)}>
        {children.map((c, i) => <li key={i} className={cn('w-[280px] shrink-0 snap-start md:w-[300px]', itemClassName)}>{c}</li>)}
      </ul>
      {/* Figma 18:984: точки пагинации только на mobile — активная 20×6, остальные 6×6, шаг 6px. */}
      {dots && children.length > 1 && (
        <div aria-hidden="true" className="mt-4 flex justify-center gap-1.5 md:hidden">
          {children.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full', i === active ? 'w-5 bg-primary-500' : 'w-1.5 bg-dark-300')} />)}
        </div>
      )}
    </div>
  );
}
