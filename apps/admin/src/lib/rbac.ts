import type { Level, Perm } from '@samanid/api/admin';
import { Calendar, CreditCard, FileText, Gift, LayoutDashboard, MapPin, Route, Settings, Shield, Star, Ticket, Users, type LucideIcon } from 'lucide-react';

export interface NavItem { key: string; to: string; icon: LucideIcon; perms: Perm[]; badge?: 'orders' | 'reviews' }
export interface NavGroup { key: string | null; items: NavItem[] }
/** Figma: Admin / Sidebar (43:2695). Пункт виден, если есть хотя бы одно из прав (матрица — 6.15, из API). */
export const NAV: NavGroup[] = [
  { key: null, items: [{ key: 'dashboard', to: '/dashboard', icon: LayoutDashboard, perms: ['orders'] }] },
  { key: 'sales', items: [
    { key: 'orders', to: '/orders', icon: Ticket, perms: ['orders'], badge: 'orders' },
    { key: 'customers', to: '/customers', icon: Users, perms: ['orders'] },
    { key: 'payments', to: '/payments', icon: CreditCard, perms: ['orders'] },
  ] },
  { key: 'content', items: [
    { key: 'catalog', to: '/catalog', icon: MapPin, perms: ['catalog'] },
    { key: 'resources', to: '/resources', icon: Calendar, perms: ['resources'] },
    { key: 'manifests', to: '/manifests', icon: FileText, perms: ['resources'] },
  ] },
  { key: 'marketing', items: [
    { key: 'promos', to: '/marketing/promos', icon: Gift, perms: ['marketing'] },
    { key: 'reviews', to: '/marketing/reviews', icon: Star, perms: ['marketing'], badge: 'reviews' },
  ] },
  { key: 'system', items: [
    { key: 'security', to: '/security', icon: Shield, perms: ['system', 'security'] },
    { key: 'ledger', to: '/ledger', icon: Route, perms: ['security'] },
    { key: 'settings', to: '/settings', icon: Settings, perms: ['system'] },
  ] },
];
export const can = (perms: Record<Perm, Level> | undefined, p: Perm, level: 'read' | 'full' = 'read') => {
  const v = perms?.[p] ?? 'none'; return level === 'read' ? v !== 'none' : v === 'full';
};
export const visibleNav = (perms: Record<Perm, Level> | undefined) => NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.perms.some((p) => can(perms, p))) })).filter((g) => g.items.length);
export const homeFor = (perms: Record<Perm, Level> | undefined) => visibleNav(perms)[0]?.items[0]?.to ?? '/login';
