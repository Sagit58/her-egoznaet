import { createHash } from 'node:crypto';

import { prisma } from '../../database/prisma-client';

export interface ActiveSession {
  readonly id: string;
  readonly employeeId: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
}

export class SessionRepository {
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async create(args: {
    id: string;
    employeeId: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await prisma.employeeSession.create({
      data: {
        id: args.id,
        employeeId: args.employeeId,
        refreshTokenHash: SessionRepository.hashToken(args.refreshToken),
        expiresAt: args.expiresAt,
      },
    });
  }

  async findActiveById(id: string): Promise<ActiveSession | null> {
    return prisma.employeeSession.findFirst({
      where: { id, revokedAt: null },
      select: {
        id: true,
        employeeId: true,
        refreshTokenHash: true,
        expiresAt: true,
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await prisma.employeeSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}