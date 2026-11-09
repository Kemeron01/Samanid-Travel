import { expect, test } from '@playwright/test';
import { dismissCookies, loginSite, resetStorage } from './helpers';

/** Лист ожидания (06 Prototype): «Мои заказы» → баннер «Забронировать» → 1.7 предложение места → бронирование. */
test('лист ожидания: баннер в кабинете → предложение места → оформление', async ({ page }) => {
  await resetStorage(page, '/ru');
  await loginSite(page, '/account/orders');
  await expect(page.getByRole('heading', { level: 1, name: 'Мои заказы' })).toBeVisible();

  const banner = page.getByText(/Место освободилось/).first();
  await expect(banner).toBeVisible();
  await page.getByRole('link', { name: 'Забронировать' }).or(page.getByRole('button', { name: 'Забронировать', exact: true })).first().click();

  // 1.7: предложение с таймером окна (из настроек API) и ценой на момент предложения
  await expect(page.getByRole('heading', { level: 1, name: 'Место освободилось!' })).toBeVisible();
  await expect(page.getByText('Предложение действует ещё').first()).toBeVisible();
  await expect(page.getByText(/\d{2}:\d{2}:\d{2}/).first()).toBeVisible();
  await page.getByRole('button', { name: 'Забронировать сейчас' }).or(page.getByRole('link', { name: 'Забронировать сейчас' })).first().click();

  // Переход в оформление: шаг 1
  await expect(page.getByRole('heading', { name: 'Кто едет' })).toBeVisible({ timeout: 15_000 });
});

/** Встать в лист ожидания на распроданный тур со страницы тура. */
test('лист ожидания: запись со страницы распроданного тура', async ({ page }) => {
  await resetStorage(page, '/ru');
  await loginSite(page, '/tours/samarkand-afrosiyob-2d');
  await dismissCookies(page);
  await page.getByRole('combobox', { name: 'Дата выезда' }).first().click();
  await page.getByRole('option', { name: /нет мест/ }).first().click();
  await expect(page.getByText('На эту дату мест нет').first()).toBeVisible();
  await page.getByRole('button', { name: 'Встать в лист ожидания' }).first().click();
  await expect(page.getByText('Вы в листе ожидания').first()).toBeVisible();
  await expect(page.getByText('Мы пришлём уведомление, когда место освободится.').first()).toBeVisible();
});
