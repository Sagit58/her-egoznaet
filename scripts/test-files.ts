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

interface FileBody {
  readonly id?: string;
  readonly originalName?: string;
  readonly sizeBytes?: number;
}

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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

  const token = loginBody.accessToken;

  const form = new FormData();
  form.append(
    'file',
    new Blob([Buffer.from(PNG_BASE64, 'base64')], { type: 'image/png' }),
    'test.png',
  );
  form.append('category', 'DOCUMENT');

  const uploadResponse = await fetch(`${API}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  console.log('UPLOAD:', uploadResponse.status);

  const file = (await uploadResponse.json()) as FileBody;

  console.log(
    'id:',
    file.id,
    'name:',
    file.originalName,
    'size:',
    file.sizeBytes,
  );

  if (!file.id) {
    return;
  }

  const listResponse = await fetch(`${API}/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const listBody = (await listResponse.json()) as { total?: number };

  console.log('LIST:', listResponse.status, 'total:', listBody.total);

  const downloadResponse = await fetch(
    `${API}/files/${file.id}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const downloadBody = (await downloadResponse.json()) as { url?: string };

  console.log('DOWNLOAD URL:', downloadResponse.status);

  if (downloadBody.url) {
    const contentResponse = await fetch(downloadBody.url);

    console.log('FETCH FILE CONTENT:', contentResponse.status);
  }

  const deleteResponse = await fetch(`${API}/files/${file.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('DELETE:', deleteResponse.status);

  const downloadAfterDelete = await fetch(
    `${API}/files/${file.id}/download`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  console.log(
    'DOWNLOAD AFTER DELETE (должно быть 404):',
    downloadAfterDelete.status,
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});