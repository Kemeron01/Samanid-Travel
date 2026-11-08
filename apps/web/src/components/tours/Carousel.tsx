'use client';
import { IconButton, cn } from '@samanid/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRef, type ReactNode } from 'react';

/** Горизонтальная карусель со scroll-snap; на mobile листается пальцем, стрелки — только на desktop. */
export function Carousel({ children, prevLabel, nextLabel, className, itemClassName }: {
  children: ReactNode[]; prevLabel: string; nextLabel: string; className?: string; itemClassName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => { const el = ref.current; if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' }); };
  return (
    <div className={cn('relative', className)}>
      <div className="mb-6 hidden justify-end gap-3 md:flex" data-carousel-controls>
        <IconButton label={prevLabel} onClick={() => scroll(-1)} className="size-12 border border-dark-200 bg-white"><ArrowLeft className="size-5" aria-hidden="true" /></IconButton>
        <IconButton label={nextLabel} onClick={() => scroll(1)} className="size-12 border border-dark-200 bg-white"><ArrowRight className="size-5" aria-hidden="true" /></IconButton>
      </div>
      <ul ref={ref} tabIndex={0} aria-label="carousel" className="-mx-4 flex scroll-px-4 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:scroll-px-0 [scrollbar-width:none] md:mx-0 md:gap-6 md:px-0 [&::-webkit-scrollbar]:hidden">
        {children.map((c, i) => <li key={i} className={cn('w-[78%] shrink-0 snap-start md:w-[300px]', itemClassName)}>{c}</li>)}
      </ul>
    </div>
  );
}
