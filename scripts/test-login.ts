import 'dotenv/config';

import { createHmac } from 'node:crypto';

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
  readonly refreshToken?: string;
  readonly expiresIn?: number;
  readonly employee?: {
    readonly id?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly role?: string;
  };
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
  };
}

const main = async (): Promise<void> => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramId = process.env.ADMIN_TELEGRAM_ID;

  if (!botToken || !telegramId) {
    throw new Error(
      'TELEGRAM_BOT_TOKEN and ADMIN_TELEGRAM_ID must be set in .env',
    );
  }

  const initData = buildInitData(botToken, telegramId);

  const loginResponse = await fetch(
    'http://localhost:3000/api/v1/auth/telegram',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    },
  );

  const loginBody = (await loginResponse.json()) as LoginResponse;

  console.log('LOGIN STATUS:', loginResponse.status);
  console.log(JSON.stringify(loginBody, null, 2));

  if (!loginResponse.ok || !loginBody.accessToken) {
    return;
  }

  const meResponse = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${loginBody.accessToken}` },
  });

  const meBody = (await meResponse.json()) as unknown;

  console.log('ME STATUS:', meResponse.status);
  console.log(JSON.stringify(meBody, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});