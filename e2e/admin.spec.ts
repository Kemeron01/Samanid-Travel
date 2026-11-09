import { expect, test, type Page } from '@playwright/test';

/** Тестовые учётки и коды из моков (packages/api/src/admin/seed.ts). */
async function signIn(page: Page, email: string, code?: string, expectOk = true) {
  await page.goto('/login');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('st_admin_lang', 'ru'); });
  await page.goto('/login');
  await page.getByLabel('Рабочий email').fill(email);
  await page.getByLabel('Пароль').fill('Samanid2027');
  await expect(page.getByLabel('Рабочий email')).toHaveValue(email);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  if (code) {
    await expect(page.getByRole('heading', { name: 'Подтвердите вход' })).toBeVisible();
    await page.keyboard.type(code); // фокус уже в первой ячейке
    await page.getByRole('button', { name: 'Подтвердить' }).click();
  }
  if (expectOk) await expect(page).not.toHaveURL(/\/login/);
}

test('админ: 2FA → дашборд → заказ: статус по статусной машине и ручной возврат', async ({ page }) => {
  await signIn(page, 'd.rakhimov@samanid.travel', '482913');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Дашборд' })).toBeVisible();

  await page.getByRole('link', { name: /Заказы/ }).click();
  await page.getByRole('button', { name: 'ST-2027-04990', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText('Допустимые переходы: paid, cancelled.', { exact: false })).toBeVisible();
  await expect(drawer.getByText('Риск блокировки выезда 27 мая')).toBeVisible();

  // Ручной возврат: сумма больше оплаченной — ошибка; допустимая — через подтверждение
  await drawer.getByLabel('Сумма, USD').fill('999');
  await expect(drawer.getByText(/Не больше \$420/)).toBeVisible();
  await drawer.getByLabel('Сумма, USD').fill('100');
  await drawer.getByRole('button', { name: /Вернуть \$100/ }).click();
  const confirm = page.getByRole('dialog', { name: /Вернуть \$100[.,]00 по заказу ST-2027-04990/ });
  await confirm.getByRole('button', { name: /Вернуть \$100[.,]00/ }).click();
  await expect(page.getByText('Возврат создан')).toBeVisible();
  await expect(drawer.getByText(/\$100\.00 · Отмена клиентом · проводка L-/)).toBeVisible();

  // Смена статуса: только допустимые варианты в списке
  await drawer.getByRole('combobox', { name: 'Перевести в статус' }).click();
  await expect(page.getByRole('option')).toHaveCount(2);
  await page.getByRole('option', { name: /^paid/ }).click();
  await drawer.getByRole('button', { name: 'Применить' }).click();
  await page.getByRole('dialog', { name: /Перевести заказ ST-2027-04990/ }).getByRole('button', { name: 'Подтвердить' }).click();
  await expect(page.getByText('Статус изменён')).toBeVisible();
  await expect(drawer.getByText('Допустимые переходы: confirmed, cancelled.', { exact: false })).toBeVisible();
});

test('админ: неверный код 2FA не пускает', async ({ page }) => {
  await signIn(page, 'd.rakhimov@samanid.travel', '000000', false);
  await expect(page.getByText('Неверный код. Проверьте время на телефоне.')).toBeVisible();
  await expect(page).toHaveURL(/\/login\/2fa$/);
});

test('RBAC: контент-менеджер видит только каталог', async ({ page }) => {
  await signIn(page, 's.nazarova@samanid.travel'); // роли контент-менеджера 2FA не требуется
  await expect(page).toHaveURL(/\/catalog$/);
  await expect(page.getByRole('navigation', { name: 'Меню админки' }).getByRole('link')).toHaveText(['Каталог туров']);
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'Раздел не найден или недоступен' })).toBeVisible();
});

test('ресурсы: конфликт гида подсвечен и не сохраняется', async ({ page }) => {
  await signIn(page, 'd.rakhimov@samanid.travel', '482913');
  await page.goto('/resources');
  await expect(page.getByText('1 конфликт назначения')).toBeVisible();
  await page.getByRole('button', { name: 'Назначить', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('combobox', { name: 'Гид' }).click();
  await page.getByRole('option', { name: 'Фарход М.' }).click();
  await modal.getByLabel('Выезд / задача').fill('Тест');
  await modal.getByLabel('С', { exact: true }).fill('2027-03-26');
  await modal.getByLabel('По', { exact: true }).fill('2027-03-27');
  await modal.getByRole('button', { name: 'Сохранить' }).click();
  await expect(modal.getByText(/Занят: Бухара: ремёсла/)).toBeVisible();
});

test('публичная ссылка гида: только просмотр, без контактов (390)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/guide/gm_7Kq2');
  await expect(page.getByRole('heading', { name: /Самарканд и Бухара/ })).toBeVisible();
  await expect(page.getByText(/Только просмотр/)).toBeVisible();
  await expect(page.getByText('+998 90 123 45 67')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Отметить посадку: AZIZOV AZIZ' }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
