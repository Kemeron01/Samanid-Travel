import { beforeEach, describe, expect, it } from 'vitest';
import { adminApi, AdminError, DEMO_BACKUP, DEMO_TOTP } from './index';

async function signIn(email: string) {
  const r = await adminApi.auth.login(email, 'Samanid2027');
  if (r.twofa) await adminApi.auth.verify(r.challenge, DEMO_TOTP);
}
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { return (e as AdminError).code; } };

describe('admin mock API', () => {
  beforeEach(async () => { localStorage.clear(); sessionStorage.clear(); await adminApi.auth.logout(); adminApi._reset(); });

  it('2FA: wrong code rejected, backup code accepted, staff without 2FA skip the step', async () => {
    const r = await adminApi.auth.login('d.rakhimov@samanid.travel', 'Samanid2027');
    expect(r.twofa).toBe(true);
    expect(await code(adminApi.auth.verify(r.challenge, '000000'))).toBe('invalid_code');
    const s = await adminApi.auth.verify(r.challenge, DEMO_BACKUP, { backup: true });
    expect(s.staff.role).toBe('admin');
    await adminApi.auth.logout();
    const c = await adminApi.auth.login('s.nazarova@samanid.travel', 'Samanid2027');
    expect(c.twofa).toBe(false);
  });

  it('locks after 5 wrong passwords', async () => {
    for (let i = 0; i < 5; i++) expect(await code(adminApi.auth.login('k.yuldasheva@samanid.travel', 'nope'))).toBe('invalid_credentials');
    expect(await code(adminApi.auth.login('k.yuldasheva@samanid.travel', 'Samanid2027'))).toBe('locked');
  });

  it('RBAC is enforced by the API, not only by the menu', async () => {
    await signIn('s.nazarova@samanid.travel');
    expect(await code(adminApi.orders.list({}))).toBe('forbidden');
    expect(await code(adminApi.catalog.tours())).toBe('ok');
    await adminApi.auth.logout(); await signIn('k.yuldasheva@samanid.travel');
    expect(await code(adminApi.marketing.promos())).toBe('forbidden');
    expect(await code(adminApi.security.fraud())).toBe('ok');                       // чтение
    expect(await code(adminApi.security.decide('f1', 'approved'))).toBe('forbidden'); // но не решения
    const o = await adminApi.orders.get('o4990');
    expect(o.email).not.toBe('•••'); // менеджер видит ПД (чтение)
  });

  it('status machine allows only valid transitions', async () => {
    await signIn('d.rakhimov@samanid.travel');
    const o = await adminApi.orders.get('o4990');
    expect(o.allowed_transitions).toEqual(['paid', 'cancelled']);
    expect(await code(adminApi.orders.transition('o4990', 'completed'))).toBe('invalid_transition');
    const p = await adminApi.orders.transition('o4990', 'paid');
    expect(p.status).toBe('paid');
    expect(p.history[0]!.details).toBe('partially_paid → paid');
  });

  it('manual refund: capped by paid amount and posts a ledger entry', async () => {
    await signIn('d.rakhimov@samanid.travel');
    expect(await code(adminApi.orders.refund('o4990', 421, 'x'))).toBe('validation');
    const before = (await adminApi.ledger.list()).entries.length;
    const o = await adminApi.orders.refund('o4990', 120.5, 'Компенсация');
    expect(o.refundable).toBe(299.5);
    const after = await adminApi.ledger.list();
    expect(after.entries.length).toBe(before + 1);
    expect(after.entries[0]).toMatchObject({ order: 'ST-2027-04990', debit: 'Возвраты', amount: 120.5 });
  });

  it('resource conflicts are not saved', async () => {
    await signIn('d.rakhimov@samanid.travel');
    expect(await code(adminApi.resources.assign('g1', 'X', '2027-03-26', '2027-03-27'))).toBe('conflict');
    expect(await code(adminApi.resources.assign('g4', 'X', '2027-04-01', '2027-04-02'))).toBe('ok');
    const w = await adminApi.resources.week('guide', '2027-03-24');
    expect(w.conflicts).toHaveLength(1);
    // Конфликт «Навруз» → переназначаем на свободного гида: конфликт уходит.
    await adminApi.resources.reassign('a2', 'g4');
    expect((await adminApi.resources.week('guide', '2027-03-24')).conflicts).toHaveLength(0);
  });

  it('publishing requires all readiness checks', async () => {
    await signIn('s.nazarova@samanid.travel');
    expect(await code(adminApi.catalog.save('navruz-2027', {}, true))).toBe('validation');
  });
});
