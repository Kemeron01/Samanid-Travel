import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Breadcrumbs, Footer, Header, LanguageMenu, Logo, Pagination, Stepper } from './Navigation';

const meta: Meta = { title: 'UI-Kit/Navigation', parameters: { layout: 'fullscreen' } };
export default meta;
type S = StoryObj;

const langs = [{ code: 'ru', name: 'Русский' }, { code: 'uz', name: 'Oʻzbekcha' }, { code: 'en', name: 'English' }];
const nav = [
  { href: '#', label: 'Туры', active: true }, { href: '#', label: 'Трансферы' }, { href: '#', label: 'Направления' },
  { href: '#', label: 'Допуслуги' }, { href: '#', label: 'О нас' },
];

export const HeaderGuest: S = {
  render: () => <Header nav={nav} language={{ value: 'ru', options: langs, onChange: () => {}, label: 'Язык' }} loginLabel="Войти" loginHref="#" favoritesLabel="Избранное" favoritesHref="#" menuLabel="Меню" />,
};
export const HeaderUser: S = {
  render: () => <Header nav={nav} user={{ initials: 'АК', name: 'Азиз', href: '#' }} language={{ value: 'ru', options: langs, onChange: () => {}, label: 'Язык' }} loginLabel="Войти" loginHref="#" favoritesLabel="Избранное" favoritesHref="#" menuLabel="Меню" />,
};
HeaderGuest.parameters = { viewport: { defaultViewport: 'mobile' } };

export const Parts: S = {
  render: () => {
    const [page, setPage] = useState(2);
    const [lang, setLang] = useState('ru');
    return (
      <div className="flex flex-col gap-8 p-6">
        <Logo />
        <LanguageMenu value={lang} options={langs} onChange={setLang} label="Язык" />
        <Breadcrumbs label="Навигация" items={[{ label: 'Главная', href: '#' }, { label: 'Туры', href: '#' }, { label: 'Самарканд и Бухара за 5 дней' }]} />
        <Pagination page={page} pageCount={12} onChange={setPage} labels={{ nav: 'Страницы', prev: 'Назад', next: 'Вперёд' }} />
      </div>
    );
  },
};

export const Steppers: S = {
  render: () => (
    <div className="flex max-w-[880px] flex-col gap-8 p-6">
      {[1, 2, 3, 4, 5].map((n) => <Stepper key={n} current={n} label="Шаги бронирования" stepOfLabel={`Шаг ${n} из 5`} steps={['Путешественники', 'Места', 'Допуслуги', 'Скидки', 'Итог']} />)}
    </div>
  ),
};

export const FooterStory: S = {
  name: 'Footer',
  render: () => (
    <Footer
      description="Туры по Узбекистану и Центральной Азии: групповые и индивидуальные поездки, трансферы и допуслуги."
      social={[{ label: 'Telegram', href: '#', icon: 'send' }, { label: 'Email', href: '#', icon: 'mail' }, { label: 'Телефон', href: '#', icon: 'phone' }]}
      columns={[
        { title: 'Путешествия', links: ['Туры', 'Трансферы', 'Направления', 'Допуслуги'].map((label) => ({ label, href: '#' })) },
        { title: 'Компания', links: ['О нас', 'Контакты', 'Отзывы', 'FAQ'].map((label) => ({ label, href: '#' })) },
        { title: 'Помощь', links: ['Политика отмены и возврата', 'Конфиденциальность', 'Согласие на обработку данных', 'Проверить ваучер'].map((label) => ({ label, href: '#' })) },
      ]}
      contacts={{ title: 'Контакты', phone: '+998 71 200 00 00', email: 'hello@samanid.travel', address: 'Ташкент, ул. Амира Темура 1', hours: 'Пн–Сб 9:00–19:00' }}
      copyright="© 2026 Samanid Travel. Все цены в USD." payments={['Visa', 'Mastercard', 'Uzcard', 'Humo']}
    />
  ),
};
