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

interface IdBody {
  readonly id?: string;
}

interface GraveSiteBody {
  readonly id?: string;
  readonly name?: string;
  readonly burials?: ReadonlyArray<{ id?: string; fullName?: string }>;
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

  const customerResponse = await fetch(`${API}/customers`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      firstName: 'Николай',
      lastName: 'Волков',
      phone: '+7 900 555-66-77',
    }),
  });

  const customer = (await customerResponse.json()) as IdBody;

  if (!customer.id) {
    throw new Error('Customer create failed');
  }

  const createResponse = await fetch(`${API}/grave-sites`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      customerId: customer.id,
      name: 'Участок 12',
      address: 'Аллея 3',
      size: '2x2',
    }),
  });

  console.log('CREATE GRAVE SITE:', createResponse.status);

  const created = (await createResponse.json()) as GraveSiteBody;

  console.log('id:', created.id);

  if (!created.id) {
    return;
  }

  const burialResponse = await fetch(
    `${API}/grave-sites/${created.id}/burials`,
    {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({
        fullName: 'Петров Иван Сергеевич',
        birthDate: '1950-05-09T00:00:00.000Z',
        deathDate: '2020-01-15T00:00:00.000Z',
      }),
    },
  );

  const burialBody = (await burialResponse.json()) as GraveSiteBody;

  console.log(
    'BURIAL:',
    burialResponse.status,
    'burials:',
    burialBody.burials?.length,
  );

  const burialId = burialBody.burials?.[0]?.id;

  if (burialId) {
    const updateBurialResponse = await fetch(
      `${API}/grave-sites/${created.id}/burials/${burialId}`,
      {
        method: 'PATCH',
        headers: auth,
        body: JSON.stringify({ comment: 'Гранит, ограда' }),
      },
    );

    console.log('UPDATE BURIAL:', updateBurialResponse.status);
  }

  const listResponse = await fetch(`${API}/grave-sites?search=Участок`, {
    headers: auth,
  });

  const listBody = (await listResponse.json()) as { total?: number };

  console.log('LIST:', listResponse.status, 'total:', listBody.total);

  const getResponse = await fetch(`${API}/grave-sites/${created.id}`, {
    headers: auth,
  });

  console.log('GET:', getResponse.status);

  const deleteResponse = await fetch(`${API}/grave-sites/${created.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth.Authorization },
  });

  console.log('DELETE:', deleteResponse.status);

  const getAfterDelete = await fetch(`${API}/grave-sites/${created.id}`, {
    headers: auth,
  });

  console.log('GET AFTER DELETE (должно быть 404):', getAfterDelete.status);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});