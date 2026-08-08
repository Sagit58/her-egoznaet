const toHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

export const generateInitData = async (
  botToken: string,
  telegramId: string,
): Promise<string> => {
  const user = JSON.stringify({
    id: Number(telegramId),
    first_name: 'Admin',
    last_name: 'Dev',
    username: 'dev_admin',
  });

  const params = new URLSearchParams();
  params.set('user', user);
  params.set('auth_date', Math.floor(Date.now() / 1000).toString());
  params.set('query_id', 'AAF-dev');

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const encoder = new TextEncoder();

  const webDataKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const secretKeyBytes = await crypto.subtle.sign(
    'HMAC',
    webDataKey,
    encoder.encode(botToken),
  );

  const secretKey = await crypto.subtle.importKey(
    'raw',
    secretKeyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const hashBytes = await crypto.subtle.sign(
    'HMAC',
    secretKey,
    encoder.encode(dataCheckString),
  );

  params.set('hash', toHex(hashBytes));

  return params.toString();
};