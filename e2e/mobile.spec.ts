import { expect, test, type Page } from '@playwright/test';
import { dismissCookies, fillTravellers, resetStorage, visibleButton } from './helpers';

/** На каждом экране mobile-сценария — без горизонтального скролла. */
async function noHScroll(page: Page) {
  const [sw, w] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw, `horizontal scroll on ${page.url()}`).toBeLessThanOrEqual(w);
}

/** Mobile (390): тот же путь до успешной оплаты — кнопки шагов в закреплённой нижней панели. */
test('mobile: поиск → тур → 5 шагов → оплата → успех', async ({ page }) => {
  await resetStorage(page, '/ru');
  await page.goto('/ru');
  await dismissCookies(page);
  await noHScroll(page);

  await visibleButton(page, 'Найти туры').click();
  await expect(page).toHaveURL(/\/ru\/tours/);
  await noHScroll(page);
  await page.locator('article').first().getByRole('link').first().click();
  await expect(page).toHaveURL(/\/ru\/tours\/[\w-]+$/);
  await noHScroll(page);
  await visibleButton(page, 'Забронировать').click();

  await fillTravellers(page);
  await noHScroll(page);
  await visibleButton(page, /^Далее/).click();
  await expect(page).toHaveURL(/\/seats$/);
  for (const seat of ['4A, место с детским креслом', '3A, свободно', '3B, свободно']) await page.getByRole('button', { name: seat }).click();
  await noHScroll(page);
  await visibleButton(page, /^Далее/).click();
  await expect(page).toHaveURL(/\/addons$/);
  await noHScroll(page);
  await visibleButton(page, /^Далее/).click();
  await expect(page).toHaveURL(/\/discounts$/);
  await noHScroll(page);
  await visibleButton(page, /^Далее/).click();
  await expect(page).toHaveURL(/\/review$/);
  await page.getByRole('checkbox', { name: /принимаю условия/ }).check();
  await noHScroll(page);
  await visibleButton(page, /^К оплате$|Перейти к оплате/).click();

  // Рассрочка: оплачивается депозит
  await page.getByRole('radio', { name: 'Рассрочка' }).click();
  await page.getByLabel('Номер карты').fill('4242 4242 4242 4242');
  await page.getByLabel('Срок действия').fill('0829');
  await page.getByLabel('CVC').fill('123');
  await page.getByLabel('Имя на карте').fill('AZIZ AZIZOV');
  await noHScroll(page);
  await expect(page.getByText(/депозит/).first()).toBeVisible();
  await visibleButton(page, /^Оплатить/).click();

  await expect(page.getByRole('heading', { level: 1, name: /Оплата прошла/ })).toBeVisible({ timeout: 20_000 });
  // Mobile 31:2492: блока «Что дальше» нет — график рассрочки остаётся в DOM для desktop-разметки.
  await expect(page.getByText('Следующий платёж')).toBeAttached();
  await expect(page.getByText(/ST-\d{4}-\d{5}/).first()).toBeVisible();
  await noHScroll(page);
});
