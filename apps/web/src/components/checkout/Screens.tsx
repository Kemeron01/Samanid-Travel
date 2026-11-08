'use client';
import { AddonsStep } from './AddonsStep';
import { DiscountsStep } from './DiscountsStep';
import { OrderGate } from './OrderGate';
import { PaymentStep } from './PaymentStep';
import { ReviewStep } from './ReviewStep';
import { SeatsStep } from './SeatsStep';
import { ExpiredScreen, FailedScreen, PendingScreen } from './StatusScreens';
import { SuccessScreen } from './SuccessScreen';
import { TravellersStep } from './TravellersStep';

/** Клиентские обёртки: render-функции нельзя передавать из серверных страниц, поэтому маршруты монтируют эти компоненты. */
export function StepScreen({ id, step }: { id: string; step: string }) {
  return <OrderGate id={id}>{(o, s) => step === 'travellers' ? <TravellersStep order={o} /> : step === 'seats' ? <SeatsStep order={o} /> : step === 'addons' ? <AddonsStep order={o} /> : step === 'discounts' ? <DiscountsStep order={o} /> : step === 'review' ? <ReviewStep order={o} /> : <PaymentStep order={o} settings={s} />}</OrderGate>;
}
export const PendingPage = ({ id, payment }: { id: string; payment: string }) => <OrderGate id={id} allow="any">{(o) => <PendingScreen order={o} paymentId={payment} />}</OrderGate>;
export const FailedPage = ({ id, payment }: { id: string; payment: string }) => <OrderGate id={id} allow="any">{(o) => <FailedScreen order={o} paymentId={payment} />}</OrderGate>;
export const ExpiredPage = ({ id }: { id: string }) => <OrderGate id={id} allow="any">{(o) => <ExpiredScreen order={o} />}</OrderGate>;
export const SuccessPage = ({ id }: { id: string }) => <OrderGate id={id} allow="any">{(o, s) => <SuccessScreen order={o} reminderDays={s.installment_reminder_days} />}</OrderGate>;
