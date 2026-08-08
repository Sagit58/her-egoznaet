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

interface OrderBody {
  readonly id?: string;
  readonly number?: number;
  readonly status?: string;
  readonly paidAmount?: number;
  readonly stages?: ReadonlyArray<{ type?: string; status?: string }>;
  readonly error?: { code?: string; message?: string };
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
      firstName: 'Павел',
      lastName: 'Орлов',
      phone: '+7 900 777-88-99',
    }),
  });

  const customer = (await customerResponse.json()) as IdBody;

  if (!customer.id) {
    throw new Error('Customer create failed');
  }

  const createResponse = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      customerId: customer.id,
      totalAmount: 100000,
      comment: 'Памятник из гранита',
    }),
  });

  console.log('CREATE ORDER:', createResponse.status);

  const order = (await createResponse.json()) as OrderBody;

  console.log(
    'number:',
    order.number,
    'status:',
    order.status,
    'stages:',
    order.stages?.length,
  );

  if (!order.id) {
    return;
  }

  const statusResponse = await fetch(`${API}/orders/${order.id}/status`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ status: 'IN_PROGRESS' }),
  });

  const statusBody = (await statusResponse.json()) as OrderBody;

  console.log('STATUS -> IN_PROGRESS:', statusResponse.status, statusBody.status);

  const invalidResponse = await fetch(`${API}/orders/${order.id}/status`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ status: 'NEW' }),
  });

  const invalidBody = (await invalidResponse.json()) as OrderBody;

  console.log(
    'INVALID TRANSITION (должно быть 409):',
    invalidResponse.status,
    invalidBody.error?.code,
  );

  const stageResponse = await fetch(
    `${API}/orders/${order.id}/stages/SURVEY`,
    {
      method: 'PATCH',
      headers: auth,
      body: JSON.stringify({ status: 'DONE', comment: 'Замер выполнен' }),
    },
  );

  const stageBody = (await stageResponse.json()) as OrderBody;

  const survey = stageBody.stages?.find((s) => s.type === 'SURVEY');

  console.log('STAGE SURVEY -> DONE:', stageResponse.status, survey?.status);

  const paymentResponse = await fetch(`${API}/orders/${order.id}/payments`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ amount: 50000, method: 'CARD' }),
  });

  const paymentBody = (await paymentResponse.json()) as OrderBody;

  console.log('PAYMENT:', paymentResponse.status, 'paid:', paymentBody.paidAmount);

  const listResponse = await fetch(`${API}/orders?search=Орлов`, {
    headers: auth,
  });

  const listBody = (await listResponse.json()) as { total?: number };

  console.log('LIST:', listResponse.status, 'total:', listBody.total);

  const deleteResponse = await fetch(`${API}/orders/${order.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth.Authorization },
  });

  console.log('DELETE:', deleteResponse.status);

  const getAfterDelete = await fetch(`${API}/orders/${order.id}`, {
    headers: auth,
  });

  console.log('GET AFTER DELETE (должно быть 404):', getAfterDelete.status);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});