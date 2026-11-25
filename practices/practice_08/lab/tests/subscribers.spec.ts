import { expect, test, type Page, type Route } from '@playwright/test';

const endpoint = '**/api/subscribers';
const field = (page: Page) => page.getByRole('textbox', { name: 'Имя подписчика' });
const addButton = (page: Page) => page.getByRole('button', { name: 'Добавить подписчика' });
const listing = (names: string[]) => ({ subscribers: names.map(name => ({ name })), count: names.length });
const response = (route: Route, json: unknown, status = 200) => route.fulfill({ status, json });

async function mockList(page: Page, names: string[] = []) {
  await page.route(endpoint, route => response(route, listing(names)));
}

test('пустое состояние и доступные элементы формы', async ({ page }) => {
  await mockList(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ближе к вашим людям.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Здесь начинается ваша аудитория' })).toBeVisible();
  await expect(field(page)).toBeVisible();
  await expect(addButton(page)).toBeEnabled();
  await expect(page.getByTestId('subscriber-count')).toHaveText('0');
});

test('отображаются реальные имена из ответа API', async ({ page }) => {
  await mockList(page, ['Анна Иванова', 'Михаил Петров']);
  await page.goto('/');
  const list = page.getByRole('list', { name: 'Список подписчиков' });
  await expect(list.getByText('Анна Иванова')).toBeVisible();
  await expect(list.getByText('Михаил Петров')).toBeVisible();
  await expect(list.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByTestId('subscriber-count')).toHaveText('2');
});

test('пустое имя и пробелы отклоняются до запроса', async ({ page }) => {
  let posts = 0;
  await page.route(endpoint, route => {
    if (route.request().method() === 'POST') posts++;
    return response(route, listing([]));
  });
  await page.goto('/');
  await addButton(page).click();
  await expect(page.getByText('Введите имя подписчика.')).toBeVisible();
  await field(page).fill('   ');
  await addButton(page).click();
  await expect(page.getByText('Введите имя подписчика.')).toBeVisible();
  expect(posts).toBe(0);
});

test('слишком длинное имя показывает ошибку и не отправляется', async ({ page }) => {
  let posts = 0;
  await page.route(endpoint, route => {
    if (route.request().method() === 'POST') posts++;
    return response(route, listing([]));
  });
  await page.goto('/');
  await field(page).fill('Я'.repeat(41));
  await addButton(page).click();
  await expect(page.getByText('Имя должно быть не длиннее 40 символов.')).toBeVisible();
  expect(posts).toBe(0);
});

test('полный клиентский сценарий: ввод → POST → запись в списке', async ({ page }) => {
  let postedName = '';
  await page.route(endpoint, async route => {
    if (route.request().method() === 'POST') {
      postedName = route.request().postDataJSON().name;
      return response(route, { subscriber: { name: 'Анна Иванова' }, created: true }, 201);
    }
    return response(route, listing([]));
  });
  await page.goto('/');
  await field(page).fill('Анна Иванова');
  await addButton(page).click();
  await expect(page.getByRole('list', { name: 'Список подписчиков' }).getByText('Анна Иванова')).toBeVisible();
  await expect(page.getByRole('status')).toContainText('подписчик добавлен');
  await expect(field(page)).toHaveValue('');
  await expect(page.getByTestId('subscriber-count')).toHaveText('1');
  expect(postedName).toBe('Анна Иванова');
});

test('дубликат не создаёт вторую запись', async ({ page }) => {
  await page.route(endpoint, route => response(route, route.request().method() === 'POST'
    ? { subscriber: { name: 'Анна' }, created: false }
    : listing(['Анна'])));
  await page.goto('/');
  await field(page).fill('анна');
  await addButton(page).click();
  await expect(page.getByRole('status')).toContainText('Повторная запись не создана');
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByTestId('subscriber-count')).toHaveText('1');
});

test('задержанный GET показывает загрузку до ответа сервера', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => { await gate; await response(route, listing([])); });
  await page.goto('/');
  await expect(page.getByRole('status', { name: 'Загружаем подписчиков' })).toBeVisible();
  await expect(addButton(page)).toBeDisabled();
  release();
  await expect(addButton(page)).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Здесь начинается ваша аудитория' })).toBeVisible();
});

test('двойной клик и Enter во время POST создают только один запрос', async ({ page }) => {
  let posts = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(endpoint, async route => {
    if (route.request().method() === 'POST') {
      posts++;
      await gate;
      return response(route, { subscriber: { name: 'Анна' }, created: true }, 201);
    }
    return response(route, listing([]));
  });
  await page.goto('/');
  await field(page).fill('Анна');
  await addButton(page).dblclick();
  await expect(page.getByRole('button', { name: 'Добавляем…' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Сохраняем подписчика');
  await page.keyboard.press('Enter');
  // Also exercise the submit handler when a submission isn't caused by the button.
  await page.locator('form').evaluate((form: HTMLFormElement) => form.requestSubmit());
  expect(posts).toBe(1);
  release();
  await expect(page.getByRole('status')).toContainText('подписчик добавлен');
  expect(posts).toBe(1);
});

test('ошибка POST сохраняет ввод и позволяет повторить попытку', async ({ page }) => {
  let posts = 0;
  await page.route(endpoint, route => {
    if (route.request().method() !== 'POST') return response(route, listing([]));
    posts++;
    return posts === 1
      ? response(route, { error: { code: 'server_error', message: 'Не удалось сохранить подписчика.' } }, 500)
      : response(route, { subscriber: { name: 'Анна' }, created: true }, 201);
  });
  await page.goto('/');
  await field(page).fill('Анна');
  await addButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось сохранить подписчика.');
  await expect(field(page)).toHaveValue('Анна');
  await expect(addButton(page)).toBeEnabled();
  await addButton(page).click();
  await expect(page.getByRole('listitem')).toContainText('Анна');
  expect(posts).toBe(2);
});

test('ошибка GET и повторная загрузка списка', async ({ page }) => {
  let fail = true;
  await page.route(endpoint, route => fail
    ? response(route, { error: { code: 'unavailable', message: 'Сервис временно недоступен.' } }, 503)
    : response(route, listing(['Анна'])));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Сервис временно недоступен.');
  await expect(addButton(page)).toBeDisabled();
  fail = false;
  await page.getByRole('button', { name: 'Повторить загрузку' }).click();
  await expect(page.getByRole('listitem')).toContainText('Анна');
  await expect(addButton(page)).toBeEnabled();
});

test('обрыв сети объясняется пользователю', async ({ page }) => {
  await page.route(endpoint, route => route.request().method() === 'POST'
    ? route.abort('failed') : response(route, listing([])));
  await page.goto('/');
  await field(page).fill('Анна');
  await addButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Нет связи с сервером');
  await expect(field(page)).toHaveValue('Анна');
});

test('невалидный ответ сервера показывает понятную ошибку', async ({ page }) => {
  await page.route(endpoint, route => route.request().method() === 'POST'
    ? route.fulfill({ status: 200, contentType: 'text/plain', body: 'broken response' })
    : response(route, listing([])));
  await page.goto('/');
  await field(page).fill('Анна');
  await addButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Сервер вернул непонятный ответ');
});

test('на мобильном экране сценарий доступен с клавиатуры и фокус виден', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.route(endpoint, route => response(route, route.request().method() === 'POST'
    ? { subscriber: { name: 'Анна' }, created: true } : listing([])));
  await page.goto('/');
  await expect(addButton(page)).toBeEnabled();
  await page.keyboard.press('Tab'); // Skip link.
  await page.keyboard.press('Tab'); // Brand link.
  await page.keyboard.press('Tab');
  await expect(field(page)).toBeFocused();
  await page.keyboard.type('Анна');
  await page.keyboard.press('Tab');
  await expect(addButton(page)).toBeFocused();
  expect(await addButton(page).evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('listitem')).toContainText('Анна');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('максимальная длина имени читается на экране 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await mockList(page, ['А'.repeat(40)]);
  await page.goto('/');
  await expect(page.getByRole('listitem')).toContainText('А'.repeat(40));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('настоящий API: добавление сохраняется после перезагрузки', async ({ page }) => {
  const name = `Тест ${Date.now()}`;
  await page.goto('/');
  await field(page).fill(name);
  await addButton(page).click();
  await expect(page.getByRole('list', { name: 'Список подписчиков' }).getByText(name)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('list', { name: 'Список подписчиков' }).getByText(name)).toBeVisible();
});

test('прототип переключает состояния загрузки, результата и ошибки', async ({ page }) => {
  await page.goto('/design/prototype.html');
  await page.getByRole('button', { name: 'Загрузка', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Добавляем…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Результат', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Анна Иванова');
  await page.getByRole('button', { name: 'Ошибка', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Не удалось сохранить');
});
