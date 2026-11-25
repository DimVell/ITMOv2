export type Subscriber = { name: string };

async function request(path: string, options?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new Error('Нет связи с сервером. Проверьте подключение и попробуйте ещё раз.');
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('Сервер вернул непонятный ответ. Попробуйте ещё раз.');
  }
  if (!response.ok) {
    throw new Error(payload.error?.message || 'Не удалось выполнить запрос. Попробуйте ещё раз.');
  }
  return payload;
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const payload = await request('/api/subscribers');
  if (!Array.isArray(payload.subscribers) || !payload.subscribers.every(
    (item: unknown) => typeof item === 'object' && item !== null &&
      'name' in item && typeof item.name === 'string',
  )) {
    throw new Error('Не удалось прочитать список подписчиков. Попробуйте ещё раз.');
  }
  return payload.subscribers;
}

export async function addSubscriber(name: string): Promise<{ subscriber: Subscriber; created: boolean }> {
  const payload = await request('/api/subscribers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (typeof payload.subscriber?.name !== 'string' || typeof payload.created !== 'boolean') {
    throw new Error('Не удалось подтвердить сохранение. Обновите список перед повторной попыткой.');
  }
  return payload;
}

export function validateName(value: string): string | null {
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (!normalized) return 'Введите имя подписчика.';
  if ([...normalized].length > 40) return 'Имя должно быть не длиннее 40 символов.';
  return null;
}
