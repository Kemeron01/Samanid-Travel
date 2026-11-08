import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox, PriceRangeSlider, RadioGroup, SegmentedControl, Switch, Tabs } from './Controls';

const meta: Meta = { title: 'UI-Kit/Controls' };
export default meta;
type S = StoryObj;

export const CheckboxStates: S = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <Checkbox label="Едет ребёнок (до 12 лет)" />
      <Checkbox label="Едет ребёнок (до 12 лет)" defaultChecked />
      <Checkbox label="Едет ребёнок (до 12 лет)" checked="indeterminate" />
      <Checkbox label="Едет ребёнок (до 12 лет)" disabled />
    </div>
  ),
};

export const Radios: S = {
  render: () => (
    <RadioGroup defaultValue="full" options={[{ value: 'full', label: 'Оплатить полностью' }, { value: 'inst', label: 'В рассрочку' }, { value: 'x', label: 'Недоступно', disabled: true }]} />
  ),
};

export const Switches: S = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      <Switch label="Уведомления в Telegram" /><Switch label="Уведомления в Telegram" defaultChecked /><Switch label="Уведомления в Telegram" disabled />
    </div>
  ),
};

export const Segmented: S = {
  render: () => {
    const [v, setV] = useState('full');
    return <SegmentedControl label="Способ оплаты" value={v} onValueChange={setV} options={[{ value: 'full', label: 'Полностью' }, { value: 'inst', label: 'Рассрочка' }]} />;
  },
};

export const TabsStory: S = {
  name: 'Tabs',
  render: () => (
    <Tabs defaultValue="overview" items={['overview:Обзор', 'days:Программа по дням', 'incl:Включено', 'prices:Даты и цены', 'reviews:Отзывы (128)'].map((x) => { const [value, label] = x.split(':'); return { value: value!, label, content: label }; })} />
  ),
};

export const Slider: S = {
  render: () => {
    const [v, setV] = useState([150, 1200]);
    return <PriceRangeSlider label="Цена" valueLabel={`$${v[0]} — $${v[1]}`} minLabel="$50" maxLabel="$3 000+" min={50} max={3000} step={10} value={v} onValueChange={setV} thumbLabels={['Минимальная цена', 'Максимальная цена']} />;
  },
};
