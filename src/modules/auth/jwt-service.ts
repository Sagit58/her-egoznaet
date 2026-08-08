import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { AppError } from '../../common/errors/app-error';
import { ROLES, type Role } from '../../common/rbac/rbac.types';
import { env } from '../../config/env';

const accessTokenPayloadSchema = z.object({
  sub: z.string(),
  telegramId: z.string(),
  role: z.enum(ROLES),
  sessionId: z.string(),
  type: z.literal('access'),
});

const refreshTokenPayloadSchema = z.object({
  sub: z.string(),
  sessionId: z.string(),
  type: z.literal('refresh'),
});

export interface AccessTokenPayload {
  readonly employeeId: string;
  readonly telegramId: string;
  readonly role: Role;
  readonly sessionId: string;
}

export interface RefreshTokenPayload {
  readonly employeeId: string;
  readonly sessionId: string;
}

export class JwtService {
  signAccessToken(args: {
    employeeId: string;
    telegramId: string;
    role: Role;
    sessionId: string;
  }): string {
    return jwt.sign(
      {
        sub: args.employeeId,
        telegramId: args.telegramId,
        role: args.role,
        sessionId: args.sessionId,
        type: 'access',
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
    );
  }

  signRefreshToken(args: {
    employeeId: string;
    sessionId: string;
  }): string {
    return jwt.sign(
      {
        sub: args.employeeId,
        sessionId: args.sessionId,
        type: 'refresh',
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
    );
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      const parsed = accessTokenPayloadSchema.safeParse(decoded as unknown);

      if (!parsed.success) {
        throw AppError.unauthorized('Invalid access token');
      }

      return {
        employeeId: parsed.data.sub,
        telegramId: parsed.data.telegramId,
        role: parsed.data.role,
        sessionId: parsed.data.sessionId,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw AppError.unauthorized('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
      const parsed = refreshTokenPayloadSchema.safeParse(decoded as unknown);

      if (!parsed.success) {
        throw AppError.unauthorized('Invalid refresh token');
      }

      return {
        employeeId: parsed.data.sub,
        sessionId: parsed.data.sessionId,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw AppError.unauthorized('Invalid refresh token');
    }
  }
}