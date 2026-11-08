import { notFound } from 'next/navigation';

/** Любой неизвестный путь внутри локали → 404 внутри каркаса сайта (шапка + подвал). */
export default function CatchAll() { notFound(); }
