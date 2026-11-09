import { expect, test } from '@playwright/test';
import { dismissCookies, fillTravellers, resetStorage, visibleButton } from './helpers';

/**
 * Desktop-сценарий из 06 Prototype: «Найти туры» → карточка тура → «Забронировать» → шаги 1–5 → оплата → (async) успех →
 * «Мои заказы» → «Подробнее» → «Отменить заказ».
 */
test('поиск → тур → 5 шагов → оплата → успех → кабинет → отмена', async ({ page }) => {
  await resetStorage(page, '/ru');
  await page.goto('/ru');
  await dismissCookies(page);

  await page.getByRole('button', { name: 'Найти туры' }).click();
  await expect(page).toHaveURL(/\/ru\/tours/);
  await page.locator('article').first().getByRole('link').first().click();
  await expect(page).toHaveURL(/\/ru\/tours\/[\w-]+$/);
  await page.getByRole('button', { name: 'Забронировать' }).first().click();

  // Шаг 1 — путешественники
  await expect(page.getByRole('heading', { name: 'Кто едет' })).toBeVisible();
  await fillTravellers(page);
  await visibleButton(page, 'Далее: выбор мест').click();
  await expect(page).toHaveURL(/\/seats$/);

  // Шаг 2 — места: выбираем свободные кресла, пока кнопка «Далее» не станет активной
  await expect(page.getByRole('heading', { name: 'Выберите места' })).toBeVisible();
  // Ребёнку — кресло с детским сиденьем, взрослым — два свободных места рядом
  for (const seat of ['4A, место с детским креслом', '2A, свободно', '2B, свободно']) await page.getByRole('button', { name: seat }).click();
  await expect(page.getByText(/3 из 3 мест выбрано/).first()).toBeAttached();
  // Таймер удержания мест виден со 2-го шага
  await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible();
  await visibleButton(page, 'Далее: допуслуги').click();
  await expect(page).toHaveURL(/\/addons$/);

  // Шаг 3 — допуслуги (пропускаем), шаг 4 — скидки
  await visibleButton(page, 'Далее: скидки').click();
  await expect(page).toHaveURL(/\/discounts$/);
  await visibleButton(page, 'Далее: итог').click();
  await expect(page).toHaveURL(/\/review$/);

  // Шаг 5 — итог: сумма приходит из API, на фронте не пересчитывается
  await expect(page.getByRole('heading', { name: 'Проверьте заказ' })).toBeVisible();
  await page.getByRole('checkbox', { name: /принимаю условия/ }).check();
  const toPay = visibleButton(page, /Перейти к оплате/);
  const total = (await toPay.textContent())!.match(/\$[\d\s\u00a0]+/)![0].trim();
  await toPay.click();

  // 2.6 Оплата — тестовая карта, полная оплата
  await expect(page.getByRole('heading', { name: 'Оплата', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Полностью' }).click();
  await page.getByLabel('Номер карты').fill('4242 4242 4242 4242');
  await page.getByLabel('Срок действия').fill('0829');
  await page.getByLabel('CVC').fill('123');
  await page.getByLabel('Имя на карте').fill('AZIZ AZIZOV');
  // Сумма к оплате та же, что зафиксирована в заказе на шаге итога (фронт её не пересчитывает)
  await expect(visibleButton(page, /^Оплатить/)).toContainText(total);
  await visibleButton(page, /^Оплатить/).click();

  // 2.7a → 2.8: асинхронная оплата (polling) до успеха
  await expect(page.getByRole('heading', { level: 1, name: /Оплата прошла/ })).toBeVisible({ timeout: 20_000 });
  // Кресло с детским сиденьем — у ребёнка
  await expect(page.getByText('AZIZOV TIMUR · 4A')).toBeVisible();
  const number = (await page.getByText(/ST-\d{4}-\d{5}/).first().textContent())!.match(/ST-\d{4}-\d{5}/)![0];

  // Кабинет: «Мои заказы» → вход → «Подробнее» → «Отменить заказ»
  const main = page.locator('main');
  await main.getByRole('link', { name: 'Мои заказы' }).or(main.getByRole('button', { name: 'Мои заказы' })).first().click();
  // Гость → кабинет требует входа (редирект на /login с возвратом)
  await expect(page.getByRole('heading', { level: 1, name: /С возвращением|Мои заказы/ })).toBeVisible();
  if (await page.getByRole('heading', { name: 'С возвращением!' }).isVisible()) {
    await page.getByLabel('Email').fill('aziz@example.com');
    await page.getByLabel('Пароль', { exact: true }).fill('Samanid2027');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Мои заказы' })).toBeVisible();
  const details = (scope: import('@playwright/test').Locator) => scope.getByRole('link', { name: 'Подробнее' }).or(scope.getByRole('button', { name: 'Подробнее' }));
  // Карточка заказа = самый вложенный блок, где есть и номер брони, и «Подробнее»
  const card = page.getByText(`Бронь № ${number}`).locator('xpath=ancestor::*[.//a[normalize-space()="Подробнее"] or .//button[normalize-space()="Подробнее"]][1]');
  await expect(card).toContainText('Подтверждён');
  await details(card).click();
  await expect(page.getByText(number).first()).toBeVisible();
  await page.getByRole('button', { name: 'Отменить заказ' }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // 4.0a: до дедлайна — полный возврат; Danger-кнопка с суммой из API
  const confirm = dialog.getByRole('button', { name: /^Отменить и вернуть/ });
  await expect(confirm).toBeVisible();
  await expect(dialog.getByText(/Деньги поступят в течение \d+ дней/)).toBeVisible();
  await confirm.click();
  // 4.0b: заказ отменён, возврат оформлен
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Заказ отменён' })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Понятно' }).click();
  await expect(page.getByText(/Отменён|Возвращён/).first()).toBeVisible();
});

/** 2.7b: карта отклонена банком → экран ошибки, повторный платёж не создаётся сам. Тестовая карта из моков. */
test('оплата отклонена → экран ошибки с повтором', async ({ page }) => {
  await resetStorage(page, '/ru');
  await page.goto('/ru/tours/samarkand-bukhara-5d');
  await dismissCookies(page);
  await page.getByRole('button', { name: 'Забронировать' }).first().click();
  await fillTravellers(page);
  await visibleButton(page, 'Далее: выбор мест').click();
  await expect(page).toHaveURL(/\/seats$/);
  for (const seat of ['4A, место с детским креслом', '3A, свободно', '3B, свободно']) await page.getByRole('button', { name: seat }).click();
  await visibleButton(page, 'Далее: допуслуги').click();
  await expect(page).toHaveURL(/\/addons$/);
  await visibleButton(page, 'Далее: скидки').click();
  await expect(page).toHaveURL(/\/discounts$/);
  await visibleButton(page, 'Далее: итог').click();
  await expect(page).toHaveURL(/\/review$/);
  await page.getByRole('checkbox', { name: /принимаю условия/ }).check();
  await visibleButton(page, /Перейти к оплате/).click();
  await page.getByRole('radio', { name: 'Полностью' }).click();
  await page.getByLabel('Номер карты').fill('4000 0000 0000 0002');
  await page.getByLabel('Срок действия').fill('0829');
  await page.getByLabel('CVC').fill('123');
  await page.getByLabel('Имя на карте').fill('AZIZ AZIZOV');
  await visibleButton(page, /^Оплатить/).click();
  await expect(page).toHaveURL(/\/failed(\?|$)/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
