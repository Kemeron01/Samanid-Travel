import { beforeEach, describe, expect, it } from 'vitest';
import { AuthError, DEMO_EMAIL, DEMO_PASSWORD, MAX_LOGIN_ATTEMPTS, authApi, passwordStrength } from './auth';
import { meApi } from './me';

describe('auth mock', () => {
  beforeEach(() => localStorage.clear());
  it('logs in and rotates the refresh token (old one becomes invalid)', async () => {
    const s = await authApi.login(DEMO_EMAIL, DEMO_PASSWORD);
    const n = await authApi.refresh();
    expect(n.refresh).not.toBe(s.refresh);
    localStorage.setItem('st_session_v1', JSON.stringify(s)); // повтор старого refresh
    await expect(authApi.refresh()).rejects.toBeInstanceOf(AuthError);
  });
  it('counts attempts and locks after the limit', async () => {
    let last: AuthError | null = null;
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) { try { await authApi.login(DEMO_EMAIL, 'bad'); } catch (e) { last = e as AuthError; } }
    expect(last?.code).toBe('locked');
    await expect(authApi.login(DEMO_EMAIL, DEMO_PASSWORD)).rejects.toMatchObject({ code: 'locked' });
  });
  it('rates password strength', () => { expect(passwordStrength('abc')).toBeLessThan(2); expect(passwordStrength('Samanid2027')).toBeGreaterThanOrEqual(3); });
});

describe('account mock', () => {
  beforeEach(() => localStorage.clear());
  it('seeds once even with parallel requests', async () => {
    const [a, b] = await Promise.all([meApi.orders('upcoming'), meApi.installments()]);
    expect(b).toHaveLength(1);
    expect(a.counts.upcoming).toBe(3);
  });
  it('cancels with full refund before the deadline', async () => {
    const [kh] = await meApi.installments();
    const p = await meApi.cancelPreview(kh!.id);
    expect(p.allowed).toBe(true); expect(p.refund).toBe(p.paid);
    const o = await meApi.cancel(kh!.id);
    expect(o.status).toBe('refunded');
  });
});
