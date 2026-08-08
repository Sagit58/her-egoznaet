import 'dotenv/config';

import { createHmac } from 'node:crypto';

const API = 'http://localhost:3000/api/v1';

const buildInitData = (botToken: string, telegramId: string): string => {
  const user = JSON.stringify({
    id: Number(telegramId),
    first_name: 'Admin',
    last_name: 'Test',
    username: 'admin_test',
  });

  const params = new URLSearchParams();
  params.set('user', user);
  params.set('auth_date', Math.floor(Date.now() / 1000).toString());
  params.set('query_id', 'AAF-test');

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  params.set('hash', hash);

  return params.toString();
};

interface LoginResponse {
  readonly accessToken?: string;
}

interface CustomerBody {
  readonly id?: string;
  readonly firstName?: string;
  readonly comment?: string | null;
  readonly contacts?: ReadonlyArray<{ id?: string; name?: string }>;
  readonly notes?: ReadonlyArray<{ text?: string }>;
}

const main = async (): Promise<void> => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramId = process.env.ADMIN_TELEGRAM_ID;

  if (!botToken || !telegramId) {
    throw new Error('TELEGRAM_BOT_TOKEN and ADMIN_TELEGRAM_ID must be set');
  }

  const loginResponse = await fetch(`${API}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: buildInitData(botToken, telegramId) }),
  });

  const loginBody = (await loginResponse.json()) as LoginResponse;

  if (!loginBody.accessToken) {
    throw new Error('Login failed');
  }

  const auth = {
    Authorization: `Bearer ${loginBody.accessToken}`,
    'Content-Type': 'application/json',
  };

  const createResponse = await fetch(`${API}/customers`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      firstName: 'Алексей',
      lastName: 'Смирнов',
      phone: '+7 900 111-22-33',
      contacts: [
        { name: 'Мария', phone: '+7 901 111-11-11', relation: 'жена' },
      ],
    }),
  });

  console.log('CREATE:', createResponse.status);

  const created = (await createResponse.json()) as CustomerBody;

  console.log('id:', created.id, 'contacts:', created.contacts?.length);

  if (!created.id) {
    return;
  }

  const noteResponse = await fetch(`${API}/customers/${created.id}/notes`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ text: 'Первая заметка о клиенте' }),
  });

  const noteBody = (await noteResponse.json()) as CustomerBody;

  console.log('NOTE:', noteResponse.status, 'notes:', noteBody.notes?.length);

  const contactResponse = await fetch(
    `${API}/customers/${created.id}/contacts`,
    {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ name: 'Сергей', phone: '+7 902 222-22-22' }),
    },
  );

  const contactBody = (await contactResponse.json()) as CustomerBody;

  console.log(
    'CONTACT:',
    contactResponse.status,
    'contacts:',
    contactBody.contacts?.length,
  );

  const listResponse = await fetch(`${API}/customers?search=Смирнов`, {
    headers: auth,
  });

  const listBody = (await listResponse.json()) as { total?: number };

  console.log('LIST:', listResponse.status, 'total:', listBody.total);

  const updateResponse = await fetch(`${API}/customers/${created.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ comment: 'VIP клиент' }),
  });

  const updated = (await updateResponse.json()) as CustomerBody;

  console.log('UPDATE:', updateResponse.status, 'comment:', updated.comment);

  const deleteResponse = await fetch(`${API}/customers/${created.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth.Authorization },
  });

  console.log('DELETE:', deleteResponse.status);

  const getAfterDelete = await fetch(`${API}/customers/${created.id}`, {
    headers: auth,
  });

  console.log('GET AFTER DELETE (должно быть 404):', getAfterDelete.status);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});