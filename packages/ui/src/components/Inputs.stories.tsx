import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Counter } from './Counter';
import { Input } from './Input';
import { OtpInput } from './OtpInput';
import { PromoCode } from './PromoCode';
import { Textarea } from './Textarea';

const meta: Meta = { title: 'UI-Kit/Inputs' };
export default meta;
type S = StoryObj;

export const TextStates: S = {
  render: () => (
    <div className="grid max-w-[1200px] grid-cols-1 gap-6 md:grid-cols-3">
      <Input label="ФИО как в паспорте" placeholder="Например, ALIEV AZIZ" helper="Латиницей, как в загранпаспорте" />
      <Input label="ФИО как в паспорте" defaultValue="ALIEV AZIZ" helper="Латиницей, как в загранпаспорте" />
      <Input label="ФИО как в паспорте" defaultValue="ALIEV AZIZ" error="Используйте только латинские буквы" />
      <Input label="ФИО как в паспорте" placeholder="Например, ALIEV AZIZ" helper="Латиницей, как в загранпаспорте" disabled />
      <Input label="Поиск" variant="search" placeholder="Направление или тур" />
    </div>
  ),
};

export const TextareaStates: S = {
  render: () => (
    <div className="grid max-w-[1200px] grid-cols-1 gap-6 md:grid-cols-3">
      <Textarea label="Комментарий" placeholder="Пожелания к туру" />
      <Textarea label="Комментарий" defaultValue="Нужен детский стульчик" />
      <Textarea label="Комментарий" error="Слишком длинный текст" defaultValue="…" />
      <Textarea label="Комментарий" disabled />
    </div>
  ),
};

export const CounterStates: S = {
  render: () => {
    const [v, setV] = useState(2);
    const p = { label: 'Путешественники', decrementLabel: 'Меньше', incrementLabel: 'Больше' };
    return (
      <div className="flex gap-8">
        <Counter {...p} value={v} onChange={setV} />
        <Counter {...p} value={1} onChange={() => {}} />
        <Counter {...p} value={9} onChange={() => {}} />
      </div>
    );
  },
};

export const Otp: S = {
  render: () => {
    const [v, setV] = useState('482');
    return (
      <div className="flex flex-col gap-8">
        <OtpInput label="Код 2FA" value={v} onChange={setV} helper="Введите 6-значный код из приложения-аутентификатора" />
        <OtpInput label="Код 2FA" value="482913" onChange={() => {}} error="Неверный код. Осталось попыток: 2" />
      </div>
    );
  },
};

export const Promo: S = {
  render: () => {
    const common = { label: 'Промокод', placeholder: 'Введите код', applyLabel: 'Применить', removeLabel: 'Убрать', onValueChange: () => {}, onApply: () => {}, onRemove: () => {} };
    return (
      <div className="flex max-w-[400px] flex-col gap-6">
        <PromoCode {...common} value="" helper="Один промокод на заказ" />
        <PromoCode {...common} value="SPRING10" applied appliedMessage="Скидка −10% применена: −$160" />
        <PromoCode {...common} value="SPRING10" error="Промокод недействителен или истёк" />
      </div>
    );
  },
};
