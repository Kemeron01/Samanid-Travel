import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ordersApi } from './orders';

const trav = (kind: 'adult' | 'child', i: number) => ({ id: `t${i}`, kind, full_name: 'X', birth_date: kind === 'adult' ? '1994-03-14' : '2019-06-20', citizenship: 'UZ', passport_expires: '2031-08-12' });

async function ready() {
  const o = await ordersApi.create({ tour: 'samarkand-bukhara-5d', departure: 'samarkand-bukhara-5d-1', adults: 2, children: 1 });
  await ordersApi.patch(o.id, { travellers: [trav('adult', 1), trav('adult', 2), trav('child', 3)], addon_ids: ['ins', 'seat'] });
  await ordersApi.applyPromo(o.id, 'spring10');
  return ordersApi.patch(o.id, { points_used: 1200 });
}

describe('order price snapshot', () => {
  beforeEach(() => { localStorage.clear(); });
  it('matches the agreed total from design dev notes ($1 579) and keeps line order', async () => {
    const o = await ready();
    expect(o.snapshot.total).toBe(1579);
    expect(o.snapshot.lines.map((l) => l.kind)).toEqual(['adults', 'children', 'dynamic', 'addon', 'addon', 'promo', 'points']);
    expect(o.snapshot.installments.map((r) => r.amount)).toEqual([527, 526, 526]);
  });
  it('caps points at 20% of the order', async () => {
    const o = await ordersApi.create({ tour: 'samarkand-bukhara-5d', departure: 'samarkand-bukhara-5d-1', adults: 1, children: 0 });
    const p = await ordersApi.patch(o.id, { points_used: 99999 });
    expect(p.snapshot.lines.find((l) => l.kind === 'points')!.amount).toBe(-p.snapshot.points_max);
    expect(p.snapshot.points_max).toBeLessThanOrEqual(Math.floor(p.snapshot.total * 0.25));
  });
  it('rejects an invalid promo code', async () => {
    const o = await ordersApi.create({ tour: 'samarkand-bukhara-5d', departure: 'samarkand-bukhara-5d-1', adults: 1, children: 0 });
    await expect(ordersApi.applyPromo(o.id, 'NOPE')).rejects.toThrow('promo_invalid');
  });
});

describe('hold and payments', () => {
  beforeEach(() => { localStorage.clear(); vi.useRealTimers(); });
  it('starts hold once and does not extend it', async () => {
    const o = await ordersApi.create({ tour: 'samarkand-bukhara-5d', departure: 'samarkand-bukhara-5d-1', adults: 1, children: 0 });
    const a = await ordersApi.startHold(o.id); const b = await ordersApi.startHold(o.id);
    expect(a.hold_expires_at).toBe(b.hold_expires_at);
    expect(new Date(a.hold_expires_at!).getTime() - Date.now()).toBeGreaterThan(14 * 60_000);
  });
  it('is idempotent: the same key never creates a second payment', async () => {
    const o = await ready();
    const r = { plan: 'full' as const, idempotency_key: 'k1', card_last4: '9010', card_token: 'tok_ok' };
    const p1 = await ordersApi.createPayment(o.id, r); const p2 = await ordersApi.createPayment(o.id, r);
    expect(p2.id).toBe(p1.id);
  });
  it('resolves to paid / failed after the webhook delay', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const o = await ready();
    const ok = await ordersApi.createPayment(o.id, { plan: 'installment', idempotency_key: 'a', card_last4: '9010', card_token: 'tok_ok' });
    const bad = await ordersApi.createPayment(o.id, { plan: 'full', idempotency_key: 'b', card_last4: '0002', card_token: 'tok_fail' });
    expect((await ordersApi.getPayment(ok.id))!.status).toBe('processing');
    vi.setSystemTime(Date.now() + 5000);
    expect((await ordersApi.getPayment(ok.id))!.status).toBe('paid');
    expect((await ordersApi.getPayment(bad.id))!.failure?.code).toBe('51');
    expect((await ordersApi.get(o.id))!.status).toBe('partially_paid');
  });
  it('expires the order when hold runs out', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const o = await ordersApi.create({ tour: 'samarkand-bukhara-5d', departure: 'samarkand-bukhara-5d-1', adults: 1, children: 0 });
    await ordersApi.patch(o.id, { seats: ['2A'] }); await ordersApi.startHold(o.id);
    vi.setSystemTime(Date.now() + 16 * 60_000);
    const e = await ordersApi.get(o.id);
    expect(e!.status).toBe('expired'); expect(e!.released_seats).toEqual(['2A']);
  });
});

describe('waitlist offer', () => {
  beforeEach(() => localStorage.clear());
  it('a sold-out departure can be booked only with a waitlist offer', async () => {
    const { tours, buildDetail } = await import('./fixtures');
    const t = tours.find((x) => x.slug === 'samarkand-bukhara-5d')!;
    const sold = buildDetail(t).departures.find((d) => d.seats_left === 0);
    if (!sold) return; // фикстура без распроданной даты — проверять нечего
    await expect(ordersApi.create({ tour: t.slug, departure: sold.id, adults: 2, children: 0 })).rejects.toThrow('sold_out');
    const o = await ordersApi.create({ tour: t.slug, departure: sold.id, adults: 2, children: 0, waitlist_offer_id: 'wo_1' });
    expect(o.status).toBe('draft');
  });
});
