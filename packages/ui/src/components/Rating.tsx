'use client';
import { Star } from 'lucide-react';

export function Rating({ value, countLabel }: { value: number; countLabel?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-s">
      <Star className="size-4 fill-accent-500 text-accent-500" aria-hidden="true" />
      <span className="text-body-s-medium text-dark-900">{value.toFixed(1)}</span>
      {countLabel && <span className="text-dark-500">({countLabel})</span>}
    </span>
  );
}
