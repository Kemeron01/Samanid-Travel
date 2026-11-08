/** Мок auth: email/пароль, Google OAuth, refresh-токены с ротацией. В проде токены — в httpOnly-cookie, не в localStorage. */
export interface User { id: string; first_name: string; last_name: string; email: string; phone: string; points: number; referral_code: string; email_verified: boolean; telegram_linked: boolean; marketing: boolean }
export interface Session { user: User; access: string; refresh: string; access_expires_at: string }
export class AuthError extends Error { constructor(public code: 'invalid' | 'locked' | 'exists' | 'weak' | 'token', public attempts_left?: number) { super(code); } }

const UKEY = 'st_users_v1'; const SKEY = 'st_session_v1'; const FKEY = 'st_login_fail_v1'; const RKEY = 'st_refresh_v1';
const has = () => typeof localStorage !== 'undefined';
const read = <T,>(k: string, d: T): T => { if (!has()) return d; try { return JSON.parse(localStorage.getItem(k) ?? '') as T; } catch { return d; } };
const write = (k: string, v: unknown) => { if (has()) try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rnd = () => Math.random().toString(36).slice(2, 12);
export const MAX_LOGIN_ATTEMPTS = 5;
/** Демо-пароль для моков (не секрет: живёт только в браузере разработчика). */
export const DEMO_EMAIL = 'aziz@example.com'; export const DEMO_PASSWORD = 'Samanid2027';

type Stored = User & { password: string };
const demo: Stored = { id: 'u_demo', first_name: 'Азиз', last_name: 'Каримов', email: DEMO_EMAIL, phone: '90 123 45 67', points: 1200, referral_code: 'FRIEND-AK24', email_verified: true, telegram_linked: false, marketing: false, password: DEMO_PASSWORD };
const users = (): Record<string, Stored> => { const u = read<Record<string, Stored>>(UKEY, {}); if (!u[DEMO_EMAIL]) { u[DEMO_EMAIL] = demo; write(UKEY, u); } return u; };
const pub = ({ password: _p, ...u }: Stored): User => (void _p, u);
function issue(u: Stored): Session {
  const s: Session = { user: pub(u), access: `acc_${rnd()}`, refresh: `ref_${rnd()}`, access_expires_at: new Date(Date.now() + 15 * 60_000).toISOString() };
  write(SKEY, s); const r = read<Record<string, string>>(RKEY, {}); r[s.refresh] = u.email; write(RKEY, r); return s;
}
/** Сила пароля 0..4 (для индикатора на регистрации/смене пароля). */
export function passwordStrength(p: string) { let s = 0; if (p.length >= 8) s++; if (/[a-zа-я]/.test(p) && /[A-ZА-Я]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-zА-Яа-я0-9]/.test(p) || p.length >= 12) s++; return s; }

export const authApi = {
  current(): Session | null { return read<Session | null>(SKEY, null); },
  async login(email: string, password: string): Promise<Session> {
    await sleep(300); const e = email.trim().toLowerCase(); const fails = read<Record<string, number>>(FKEY, {});
    if ((fails[e] ?? 0) >= MAX_LOGIN_ATTEMPTS) throw new AuthError('locked', 0);
    const u = users()[e];
    if (!u || u.password !== password) { fails[e] = (fails[e] ?? 0) + 1; write(FKEY, fails); throw new AuthError(fails[e]! >= MAX_LOGIN_ATTEMPTS ? 'locked' : 'invalid', MAX_LOGIN_ATTEMPTS - fails[e]!); }
    fails[e] = 0; write(FKEY, fails); return issue(u);
  },
  async google(): Promise<Session> { await sleep(400); return issue(users()[DEMO_EMAIL]!); },
  async register(r: { first_name: string; email: string; password: string; referral?: string; marketing: boolean }): Promise<{ email: string }> {
    await sleep(350); const all = users(); const e = r.email.trim().toLowerCase();
    if (all[e]) throw new AuthError('exists'); if (passwordStrength(r.password) < 2) throw new AuthError('weak');
    all[e] = { id: `u_${rnd()}`, first_name: r.first_name, last_name: '', email: e, phone: '', points: r.referral ? 500 : 0, referral_code: `FRIEND-${rnd().slice(0, 4).toUpperCase()}`, email_verified: false, telegram_linked: false, marketing: r.marketing, password: r.password };
    write(UKEY, all); return { email: e };
  },
  async resendVerification(_email: string): Promise<{ next_in_seconds: number }> { await sleep(200); return { next_in_seconds: 60 }; },
  async forgot(_email: string): Promise<{ ok: true }> { await sleep(300); return { ok: true }; },
  /** Сброс пароля завершает все остальные сессии (по макету 3.5). */
  async reset(_token: string, password: string): Promise<{ ok: true }> { await sleep(300); if (passwordStrength(password) < 2) throw new AuthError('weak'); write(RKEY, {}); return { ok: true }; },
  /** Ротация refresh: старый токен становится недействительным. */
  async refresh(): Promise<Session> {
    const s = read<Session | null>(SKEY, null); const r = read<Record<string, string>>(RKEY, {});
    if (!s || !r[s.refresh]) { write(SKEY, null); throw new AuthError('token'); }
    const email = r[s.refresh]!; delete r[s.refresh]; write(RKEY, r); return issue(users()[email]!);
  },
  async updateUser(p: Partial<Pick<User, 'first_name' | 'last_name' | 'phone' | 'marketing' | 'telegram_linked'>>): Promise<User> {
    const s = read<Session | null>(SKEY, null); if (!s) throw new AuthError('token'); const all = users(); const u = { ...all[s.user.email]!, ...p }; all[u.email] = u; write(UKEY, all);
    const ns = { ...s, user: pub(u) }; write(SKEY, ns); return ns.user;
  },
  async logout(): Promise<void> { const s = read<Session | null>(SKEY, null); if (s) { const r = read<Record<string, string>>(RKEY, {}); delete r[s.refresh]; write(RKEY, r); } write(SKEY, null); },
};
