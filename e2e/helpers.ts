import { expect, type Page } from '@playwright/test';

/** Закрыть баннер cookie (минимально — только необходимые). */
export async function dismissCookies(page: Page) {
  // Баннер появляется после гидратации — ждём его недолго и выбираем «Только необходимые» (privacy by default).
  await page.getByRole('button', { name: 'Только необходимые' }).click({ timeout: 5_000 }).catch(() => undefined);
}

/** Вход демо-пользователем сайта (тестовые данные из packages/api/src/auth.ts). */
export async function loginSite(page: Page, next = '/account/orders') {
  await page.goto(`/ru/login?next=${encodeURIComponent(next)}`);
  await dismissCookies(page);
  await page.getByLabel('Email').fill('aziz@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('Samanid2027');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Чистое состояние моков (localStorage) перед сценарием. */
export async function resetStorage(page: Page, origin: string) {
  await page.goto(origin);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
}

/** Шаг 1: заполнить всех путешественников (взрослые, затем ребёнок), контакты и согласие. */
export async function fillTravellers(page: Page) {
  const people = [
    { name: 'AZIZOV AZIZ', birth: '14.03.1994' },
    { name: 'AZIZOVA MALIKA', birth: '02.07.1996' },
    { name: 'AZIZOV TIMUR', birth: '20.06.2019' },
  ];
  await expect(page.getByRole('heading', { name: 'Кто едет' })).toBeVisible();
  await page.waitForLoadState('networkidle'); // dev-режим Next может догружать чанки и перемонтировать форму
  const names = page.getByLabel('ФИО как в паспорте (латиницей)');
  const n = await names.count();
  for (let i = 0; i < n; i++) {
    const p = people[i] ?? people[0]!;
    await names.nth(i).fill(p.name);
    await page.getByLabel('Дата рождения').nth(i).fill(p.birth);
    await page.getByLabel('Паспорт действует до').nth(i).fill('12.08.2031');
    await page.getByRole('combobox', { name: 'Гражданство' }).nth(i).click();
    await page.getByRole('option', { name: 'Узбекистан' }).click();
  }
  const contacts = page.locator('section', { has: page.locator('#contacts') });
  await contacts.getByLabel('Email').fill('aziz@example.com');
  await contacts.getByLabel('Телефон').fill('90 123 45 67');
  await page.getByRole('checkbox', { name: /согласие|Согласен|персональных/i }).check();
}

/** Кнопка шага: на desktop есть копия в сводке и в нижней панели mobile — берём видимую. */
export const visibleButton = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).and(page.locator(':not(.sr-only)')).locator('visible=true').first();
