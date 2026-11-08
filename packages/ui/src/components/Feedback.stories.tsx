import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './Button';
import { Alert, CookieBanner, EmptyState, HoldTimer, Modal, NetworkErrorBanner, SkeletonTourCard, ToastView } from './Feedback';

const meta: Meta = { title: 'UI-Kit/Feedback', parameters: { layout: 'padded' } };
export default meta;
type S = StoryObj;

export const Toasts: S = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      <ToastView type="success" title="Промокод применён" description="Скидка −10% уже в итоговой цене" onClose={() => {}} closeLabel="Закрыть" />
      <ToastView type="error" title="Оплата не прошла" description="Банк отклонил платёж. Попробуйте другую карту" onClose={() => {}} closeLabel="Закрыть" />
      <ToastView type="info" title="Ссылка скопирована" description="Отправьте её друзьям и получите баллы" onClose={() => {}} closeLabel="Закрыть" />
    </div>
  ),
};

export const Alerts: S = {
  render: () => (
    <div className="grid max-w-[1280px] gap-4 md:grid-cols-2">
      <Alert type="info" title="Возврат в течение 7 дней">Деньги вернутся тем же способом, которым вы платили.</Alert>
      <Alert type="success" title="Заказ подтверждён">Ваучер отправлен на email и в Telegram.</Alert>
      <Alert type="warning" title="Платёж по рассрочке через 2 дня">Внесите $120 до 15 мая, иначе начислится пеня 0.5% в день.</Alert>
      <Alert type="error" title="Выезд заблокирован">Долг по рассрочке не погашен за 7 дней до выезда.</Alert>
    </div>
  ),
};

export const ModalStory: S = {
  name: 'Modal',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Открыть модалку</Button>
        <Modal open={open} onOpenChange={setOpen} title="Заголовок модального окна" closeLabel="Закрыть"
          description="Короткое описание действия и его последствий. Модалка закрывается по Esc, клику на подложку и кнопке ×. Фокус заперт внутри."
          footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Отмена</Button><Button onClick={() => setOpen(false)}>Подтвердить</Button></>}>
          <div className="rounded-md bg-bg-page p-4 text-body-s text-dark-500">Слот для контента</div>
        </Modal>
      </>
    );
  },
};

export const HoldTimerStates: S = {
  render: () => {
    const labels = { normal: 'Места закреплены за вами', warning: 'Осталось меньше 3 минут', expired: 'Время брони истекло' };
    return (
      <div className="flex flex-wrap gap-4">
        <HoldTimer remainingSeconds={14 * 60 + 32} labels={labels} />
        <HoldTimer remainingSeconds={2 * 60 + 47} labels={labels} />
        <HoldTimer remainingSeconds={0} labels={labels} />
      </div>
    );
  },
};

export const States: S = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start gap-8">
        <EmptyState title="Ничего не найдено" text="Попробуйте изменить даты или убрать часть фильтров" actionLabel="Сбросить фильтры" />
        <SkeletonTourCard />
      </div>
      <NetworkErrorBanner message="Нет соединения с сервером. Ваши данные сохранены — повторяем попытку…" retryLabel="Обновить" onRetry={() => {}} />
      <CookieBanner title="Мы используем cookie" text="Необходимые cookie нужны для входа и бронирования. Аналитические — только с вашего согласия. Подробнее в политике конфиденциальности." necessaryLabel="Только необходимые" acceptLabel="Принять все" onNecessary={() => {}} onAccept={() => {}} />
    </div>
  ),
};
