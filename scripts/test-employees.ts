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

interface CreatedEmployee {
  readonly id?: string;
  readonly firstName?: string;
  readonly role?: string;
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

  const createResponse = await fetch(`${API}/employees`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      firstName: 'Иван',
      lastName: 'Петров',
      role: 'MANAGER',
      phone: '+7 900 000-00-00',
    }),
  });

  console.log('CREATE:', createResponse.status);

  const created = (await createResponse.json()) as CreatedEmployee;

  console.log(JSON.stringify(created, null, 2));

  if (!created.id) {
    return;
  }

  const listResponse = await fetch(`${API}/employees?pageSize=10`, {
    headers: auth,
  });

  const listBody = (await listResponse.json()) as { total?: number };

  console.log('LIST:', listResponse.status, 'total:', listBody.total);

  const getResponse = await fetch(`${API}/employees/${created.id}`, {
    headers: auth,
  });

  console.log('GET:', getResponse.status);

  const updateResponse = await fetch(`${API}/employees/${created.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ role: 'DESIGNER' }),
  });

  const updated = (await updateResponse.json()) as CreatedEmployee;

  console.log('UPDATE:', updateResponse.status, 'new role:', updated.role);

  const deleteResponse = await fetch(`${API}/employees/${created.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth.Authorization },
  });

  console.log('DELETE:', deleteResponse.status);

  const getAfterDelete = await fetch(`${API}/employees/${created.id}`, {
    headers: auth,
  });

  console.log('GET AFTER DELETE (должно быть 404):', getAfterDelete.status);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});