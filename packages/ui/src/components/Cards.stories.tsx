import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Shield, Baby } from 'lucide-react';
import { AddonCard, DestinationCard, Media, OrderCard, ReviewCard, TourCard, type TourCardProps } from './Cards';

const meta: Meta = { title: 'UI-Kit/Cards & Images' };
export default meta;
type S = StoryObj;

export const Images: S = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['sky', 'sand', 'sunset', 'mountain', 'night'] as const).map((t) => <Media key={t} tone={t} caption="Фото" className="relative h-[220px] w-[320px]" />)}
    </div>
  ),
};

const base: TourCardProps = {
  href: '#', title: 'Самарканд и Бухара за 5 дней: шёлковый путь', region: 'Самарканд · Бухара',
  image: { caption: 'Самарканд, Регистан' }, tags: [{ type: 'hit', label: 'Хит продаж' }, { type: 'discount', label: '−20%' }],
  favorite: { active: false, onToggle: () => {}, label: 'В избранное' },
  facts: { duration: '5 дней', group: 'до 16 чел.', nextDate: '12 мая' }, rating: { value: 4.9, count: 128 },
  oldPrice: '$800', priceTemplate: 'от {amount}', price: '$640', perPerson: '/ чел.', seatsLeft: 'Осталось 3 места',
};

export const TourCards: S = {
  render: () => (
    <div className="grid max-w-[1000px] grid-cols-1 gap-6 sm:grid-cols-3">
      <TourCard {...base} />
      <TourCard {...base} priceTemplate="{amount} dan" />
      <TourCard {...base} image={{ tone: 'sand', caption: 'Хива' }} tags={[]} oldPrice={undefined} seatsLeft={undefined}
        soldOut={{ label: 'Нет мест', nextDepartureLabel: 'Следующий выезд', nextDeparture: '2 июня', waitlistLabel: 'В лист ожидания', onWaitlist: () => {} }} />
    </div>
  ),
};

export const Misc: S = {
  render: () => {
    const [a, setA] = useState(false);
    return (
      <div className="flex flex-wrap items-start gap-8">
        <div className="w-[280px]"><DestinationCard href="#" name="Чимган и Чарвак" meta="12 туров · от $90" image={{ caption: 'Чимган' }} /></div>
        <div className="w-[400px]"><ReviewCard initials="ДМ" name="Дильноза М." meta="Май 2026 · Самарканд и Бухара" rating={5} text="Отличная организация: гид Фарход знал историю каждого медресе, трансфер ждал вовремя. Обязательно поедем ещё в Хиву!" verifiedLabel="Подтверждённая поездка" /></div>
        <div className="flex w-[420px] flex-col gap-4">
          <AddonCard icon={<Shield />} title="Страховка путешественника" description="Медицина и несчастный случай, покрытие $30 000" price="+$15 / чел." checked={a} onCheckedChange={setA} checkboxLabel="Добавить страховку" />
          <AddonCard icon={<Shield />} title="Страховка путешественника" description="Медицина и несчастный случай, покрытие $30 000" price="+$15 / чел." checked onCheckedChange={() => {}} checkboxLabel="Добавить страховку" />
          <AddonCard icon={<Baby />} title="Детское кресло" description="Доступно, если в заказе отмечен ребёнок" price="+$10 / шт." checked={false} disabled onCheckedChange={() => {}} checkboxLabel="Добавить кресло" />
        </div>
      </div>
    );
  },
};

const hold = { normal: 'Места закреплены за вами', warning: 'Осталось меньше 3 минут', expired: 'Время брони истекло' };
export const Orders: S = {
  render: () => (
    <div className="flex max-w-[860px] flex-col gap-4">
      <OrderCard status="confirmed" statusLabel="Подтверждён" number="Бронь № ST-2027-04812" title="Самарканд и Бухара за 5 дней" dates="12–16 мая 2027" travellers="2 взрослых, 1 ребёнок" seats="Места 4A, 4B, 5A" totalLabel="Итого" total="$1 536" action={{ label: 'Подробнее', variant: 'outline', onClick: () => {} }} />
      <OrderCard status="pending_payment" statusLabel="Ждёт оплаты" number="Бронь № ST-2027-04812" title="Самарканд и Бухара за 5 дней" dates="12–16 мая 2027" travellers="2 взрослых, 1 ребёнок" seats="Места 4A, 4B, 5A" hold={{ remainingSeconds: 167, labels: hold }} totalLabel="Итого" total="$1 536" action={{ label: 'Оплатить', variant: 'primary', onClick: () => {} }} />
      <OrderCard status="completed" statusLabel="Завершён" image={{ tone: 'sand' }} number="Бронь № ST-2027-04812" title="Хива: город-музей за 3 дня" dates="3–5 апреля 2026" travellers="2 взрослых, 1 ребёнок" seats="Места 4A, 4B, 5A" totalLabel="Итого" total="$1 536" action={{ label: 'Оставить отзыв', variant: 'outline', onClick: () => {} }} />
    </div>
  ),
};
