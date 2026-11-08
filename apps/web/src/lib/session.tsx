'use client';
import { api, type Session, type User } from '@samanid/api';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Status = 'loading' | 'guest' | 'auth';
interface Ctx { status: Status; user: User | null; setSession: (s: Session | null) => void; setUser: (u: User) => void; logout: () => Promise<void> }
const C = createContext<Ctx | null>(null);
export const useSession = () => { const c = useContext(C); if (!c) throw new Error('SessionProvider missing'); return c; };

/** Сессия на клиенте. Мок хранит токены в localStorage; в проде — httpOnly-cookie + refresh с ротацией на сервере. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, set] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  useEffect(() => {
    const s = api.auth.current();
    if (!s) { setStatus('guest'); return; }
    // access истёк → refresh (ротация токена)
    if (new Date(s.access_expires_at).getTime() < Date.now()) api.auth.refresh().then((n) => { set(n); setStatus('auth'); }).catch(() => setStatus('guest'));
    else { set(s); setStatus('auth'); }
  }, []);
  const setSession = useCallback((s: Session | null) => { set(s); setStatus(s ? 'auth' : 'guest'); }, []);
  const setUser = useCallback((u: User) => set((s) => (s ? { ...s, user: u } : s)), []);
  const logout = useCallback(async () => { await api.auth.logout(); set(null); setStatus('guest'); }, []);
  const v = useMemo(() => ({ status, user: session?.user ?? null, setSession, setUser, logout }), [status, session, setSession, setUser, logout]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
