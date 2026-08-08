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
  readonly name?: string;
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

  const branchResponse = await fetch(`${API}/branches`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      name: 'Центральный офис',
      address: 'ул. Ленина, 1',
      phone: '+7 900 000-00-01',
    }),
  });

  console.log('CREATE BRANCH:', branchResponse.status);

  const branch = (await branchResponse.json()) as IdBody;

  if (!branch.id) {
    return;
  }

  const departmentResponse = await fetch(`${API}/departments`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      name: 'Производство',
      branchId: branch.id,
    }),
  });

  console.log('CREATE DEPARTMENT:', departmentResponse.status);

  const department = (await departmentResponse.json()) as IdBody;

  const listBranches = await fetch(`${API}/branches`, { headers: auth });

  const branchesBody = (await listBranches.json()) as { total?: number };

  console.log('LIST BRANCHES:', listBranches.status, 'total:', branchesBody.total);

  const listDepartments = await fetch(
    `${API}/departments?branchId=${branch.id}`,
    { headers: auth },
  );

  const departmentsBody = (await listDepartments.json()) as { total?: number };

  console.log(
    'LIST DEPARTMENTS:',
    listDepartments.status,
    'total:',
    departmentsBody.total,
  );

  const updateResponse = await fetch(`${API}/branches/${branch.id}`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ address: 'ул. Ленина, 2' }),
  });

  console.log('UPDATE BRANCH:', updateResponse.status);

  if (department.id) {
    const deleteDepartment = await fetch(
      `${API}/departments/${department.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: auth.Authorization },
      },
    );

    console.log('DELETE DEPARTMENT:', deleteDepartment.status);
  }

  const deleteBranch = await fetch(`${API}/branches/${branch.id}`, {
    method: 'DELETE',
    headers: { Authorization: auth.Authorization },
  });

  console.log('DELETE BRANCH:', deleteBranch.status);

  const getAfterDelete = await fetch(`${API}/branches/${branch.id}`, {
    headers: auth,
  });

  console.log('GET AFTER DELETE (должно быть 404):', getAfterDelete.status);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});