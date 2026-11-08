import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './Calendar';
import { AddressInput, DateInput, DateRangeInput, PhoneInput, Select } from './Pickers';

const meta: Meta = { title: 'UI-Kit/Pickers' };
export default meta;
type S = StoryObj;
const countries = [{ value: 'uz', label: 'Узбекистан' }, { value: 'kz', label: 'Казахстан' }, { value: 'kg', label: 'Кыргызстан' }];

export const SelectStates: S = {
  render: () => {
    const [v, setV] = useState<string>();
    return (
      <div className="grid max-w-[1200px] gap-6 md:grid-cols-3">
        <Select label="Гражданство" placeholder="Выберите страну" options={countries} value={v} onValueChange={setV} />
        <Select label="Гражданство" placeholder="Выберите страну" options={countries} value="uz" onValueChange={() => {}} />
        <Select label="Гражданство" placeholder="Выберите страну" options={countries} value="uz" onValueChange={() => {}} error="Обязательное поле" />
        <Select label="Гражданство" placeholder="Выберите страну" options={countries} onValueChange={() => {}} disabled />
      </div>
    );
  },
};

export const Phone: S = {
  render: () => (
    <div className="grid max-w-[1200px] gap-6 md:grid-cols-3">
      <PhoneInput label="Телефон" placeholder="90 123 45 67" helper="Для связи гида в день выезда" />
      <PhoneInput label="Телефон" defaultValue="90 123 45 67" error="Неверный номер" />
      <PhoneInput label="Телефон" defaultValue="90 123 45 67" disabled />
    </div>
  ),
};

const all = [
  { id: '1', title: 'Аэропорт Ташкент (TAS)', subtitle: 'Ташкент, Узбекистан' }, { id: '2', title: 'Hotel Uzbekistan', subtitle: 'ул. Мусаханова 45, Ташкент' },
  { id: '3', title: 'Ж/д вокзал Ташкент', subtitle: 'Пр. Тараса Шевченко, Ташкент' }, { id: '4', title: 'Регистан', subtitle: 'Самарканд, Узбекистан' },
];
export const Address: S = {
  render: () => {
    const [v, setV] = useState('Ташк');
    return <div className="h-80 max-w-[360px]"><AddressInput label="Откуда" value={v} onValueChange={setV} suggestions={all} onSelect={(o) => setV(o.title)} listLabel="Подсказки" placeholder="Адрес или место" /></div>;
  },
};

export const Dates: S = {
  render: () => {
    const [d, setD] = useState<string>();
    const [r, setR] = useState<string[]>([]);
    const p = { locale: 'ru-RU', prevLabel: 'Предыдущий месяц', nextLabel: 'Следующий месяц', hint: 'Прошедшие даты недоступны' };
    return (
      <div className="grid max-w-[760px] gap-6 md:grid-cols-2">
        <DateInput {...p} label="Дата выезда" placeholder="Выберите дату" value={d} onValueChange={setD} />
        <DateRangeInput {...p} label="Даты поездки" placeholder="Выберите даты" value={r} onValueChange={setR} />
      </div>
    );
  },
};

export const CalendarRange: S = {
  render: () => {
    const [r, setR] = useState(['2027-05-12', '2027-05-18']);
    return <Calendar mode="range" value={r} onChange={setR} locale="ru-RU" minDate="2027-05-03" prevLabel="Назад" nextLabel="Вперёд" hint="Прошедшие даты недоступны" />;
  },
};
