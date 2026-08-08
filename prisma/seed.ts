import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const telegramIdRaw = process.env.ADMIN_TELEGRAM_ID;

  if (!telegramIdRaw) {
    throw new Error('ADMIN_TELEGRAM_ID is not set in .env');
  }

  const telegramId = BigInt(telegramIdRaw);

  await prisma.employee.upsert({
    where: { telegramId },
    update: {
      role: 'ADMINISTRATOR',
      isActive: true,
      deletedAt: null,
    },
    create: {
      firstName: 'Администратор',
      lastName: 'Системы',
      telegramId,
      role: 'ADMINISTRATOR',
      isActive: true,
    },
  });

  console.log('Admin employee ready, telegramId:', telegramIdRaw);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });