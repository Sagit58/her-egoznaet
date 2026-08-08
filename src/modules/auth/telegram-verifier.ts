import { createHmac, timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

import { AppError } from '../../common/errors/app-error';

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export interface VerifiedInitData {
  readonly user: TelegramUser;
  readonly authDate: number;
}

const MAX_INIT_DATA_AGE_MS = 24 * 60 * 60 * 1000;

export const verifyTelegramInitData = (
  initData: string,
  botToken: string,
): VerifiedInitData => {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    throw AppError.unauthorized('Invalid initData: hash is missing');
  }

  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const calculatedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const received = Buffer.from(hash, 'hex');
  const expected = Buffer.from(calculatedHash, 'hex');

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw AppError.unauthorized('Invalid initData signature');
  }

  const authDateRaw = params.get('auth_date');
  const authDate = authDateRaw ? Number.parseInt(authDateRaw, 10) : 0;

  if (authDate > 0 && Date.now() - authDate * 1000 > MAX_INIT_DATA_AGE_MS) {
    throw AppError.unauthorized('initData is too old');
  }

  const userRaw = params.get('user');

  if (!userRaw) {
    throw AppError.unauthorized('Invalid initData: user is missing');
  }

  const parsedUser = telegramUserSchema.safeParse(
    JSON.parse(userRaw) as unknown,
  );

  if (!parsedUser.success) {
    throw AppError.unauthorized('Invalid initData: user is invalid');
  }

  return { user: parsedUser.data, authDate };
};