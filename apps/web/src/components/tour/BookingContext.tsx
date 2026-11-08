'use client';
import { api, type Quote, type TourDetail } from '@samanid/api';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

interface Ctx {
  tour: TourDetail; departureId: string; setDepartureId: (id: string) => void;
  adults: number; setAdults: (n: number) => void; children: number; setChildren: (n: number) => void;
  quote: Quote | null; quoting: boolean;
}
const C = createContext<Ctx | null>(null);
export const useBooking = () => { const c = useContext(C); if (!c) throw new Error('useBooking outside provider'); return c; };

/** Состояние выбора выезда и состава группы. Цена приходит из API (/quotes), фронт её не считает. */
export function BookingProvider({ tour, children: kids }: { tour: TourDetail; children: ReactNode }) {
  const firstAvail = tour.departures.find((d) => d.seats_left > 0) ?? tour.departures[0]!;
  const [departureId, setDepartureId] = useState(firstAvail.id);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(tour.type === 'individual' ? 1 : 1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const seq = useRef(0);
  const dep = tour.departures.find((d) => d.id === departureId);

  useEffect(() => {
    if (!dep || dep.seats_left === 0 || tour.type === 'individual') { setQuote(null); return; }
    const n = ++seq.current; setQuoting(true);
    const t = setTimeout(() => {
      api.quote({ tour: tour.slug, departure: departureId, adults, children })
        .then((q) => { if (n === seq.current) setQuote(q); })
        .finally(() => { if (n === seq.current) setQuoting(false); });
    }, 150);
    return () => clearTimeout(t);
  }, [departureId, adults, children, dep, tour.slug, tour.type]);

  const value = useMemo(() => ({ tour, departureId, setDepartureId, adults, setAdults, children, setChildren, quote, quoting }), [tour, departureId, adults, children, quote, quoting]);
  return <C.Provider value={value}>{kids}</C.Provider>;
}
