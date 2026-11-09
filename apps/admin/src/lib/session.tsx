import { adminApi, type AdminSession } from '@samanid/api/admin';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface Ctx { session: AdminSession | null; setSession: (s: AdminSession | null) => void; logout: () => Promise<void> }
const SessionCtx = createContext<Ctx | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => adminApi.auth.session());
  const logout = useCallback(async () => { await adminApi.auth.logout(); setSession(null); }, []);
  const value = useMemo(() => ({ session, setSession, logout }), [session, logout]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}
export function useSession() { const c = useContext(SessionCtx); if (!c) throw new Error('SessionProvider missing'); return c; }
