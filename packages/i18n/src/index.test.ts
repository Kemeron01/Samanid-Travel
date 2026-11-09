import { describe, expect, it } from 'vitest';
import { adminMessages, formatDayMonth, formatPriceFrom, messages } from './index';

const keys = (o: object, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])).sort();

describe('i18n formatters', () => {
  it('price template per locale', () => {
    expect(formatPriceFrom(640, 'ru')).toBe('от $640');
    expect(formatPriceFrom(640, 'en')).toBe('from $640');
    expect(formatPriceFrom(640, 'uz')).toBe('$640 dan');
  });
  it('thousands separator', () => {
    expect(formatPriceFrom(1280, 'en')).toContain('1,280');
    expect(formatPriceFrom(1280, 'ru')).toContain('1 280');
  });
  it('dates', () => {
    expect(formatDayMonth('2026-05-12', 'ru')).toBe('12 мая');
    expect(formatDayMonth('2026-05-12', 'uz')).toBe('12-may');
    expect(formatDayMonth('2026-05-12', 'en')).toBe('May 12');
  });
  it('uz uses U+02BB', () => {
    expect(JSON.stringify(messages.uz)).not.toContain('‘');
  });
  it('same keys in RU/UZ/EN (site and admin)', () => {
    for (const dict of [messages, adminMessages]) {
      expect(keys(dict.uz)).toEqual(keys(dict.ru));
      expect(keys(dict.en)).toEqual(keys(dict.ru));
    }
  });
  it('admin uz uses U+02BB', () => {
    expect(JSON.stringify(adminMessages.uz)).not.toMatch(/[‘']/);
  });
});
