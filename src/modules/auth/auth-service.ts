import { randomUUID, timingSafeEqual } from 'node:crypto';

import type { AuthContext } from '../../common/auth/auth-context.types';
import { AppError } from '../../common/errors/app-error';
import { ROLE_PERMISSIONS } from '../../common/rbac/role-permissions';
import type { Role } from '../../common/rbac/rbac.types';
import { env } from '../../config/env';
import type { EmployeeAuthRecord } from './employee-auth-repository';
import { EmployeeAuthRepository } from './employee-auth-repository';
import { JwtService } from './jwt-service';
import { SessionRepository } from './session-repository';
import { verifyTelegramInitData } from './telegram-verifier';

export interface AuthEmployeeDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: Role;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly employee: AuthEmployeeDto;
}

const parseDurationToSeconds = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value);

  if (!match) {
    return 900;
  }

  const amount = Number.parseInt(match[1] ?? '15', 10);
  const unit = match[2] ?? 's';

  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return amount * (multipliers[unit] ?? 1);
};

export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionRepository: SessionRepository,
    private readonly employeeAuthRepository: EmployeeAuthRepository,
  ) {}

  async loginByTelegram(initData: string): Promise<AuthTokens> {
    const botToken = env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      throw new AppError({
        code: 'INTERNAL_ERROR',
        message: 'Telegram bot token is not configured',
        statusCode: 500,
      });
    }

    const verified = verifyTelegramInitData(initData, botToken);

    const employee =
      await this.employeeAuthRepository.findActiveByTelegramId(
        BigInt(verified.user.id),
      );

    if (!employee) {
      throw AppError.forbidden('Employee not found');
    }

    return this.issueTokens(employee);
  }

  async loginByPassword(login: string, password: string): Promise<AuthTokens> {
    if (!env.SUPERADMIN_LOGIN || !env.SUPERADMIN_PASSWORD) {
      throw new AppError({
        code: 'INTERNAL_ERROR',
        message: 'Superadmin login is not configured',
        statusCode: 500,
      });
    }

    if (
      !safeEqual(login, env.SUPERADMIN_LOGIN) ||
      !safeEqual(password, env.SUPERADMIN_PASSWORD)
    ) {
      throw AppError.unauthorized('Invalid login or password');
    }

    const employee = await this.employeeAuthRepository.upsertSuperAdmin(
      env.SUPERADMIN_EMPLOYEE_ID,
    );

    return this.issueTokens(employee);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    const session = await this.sessionRepository.findActiveById(
      payload.sessionId,
    );

    if (!session) {
      throw AppError.unauthorized('Session is not active');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthorized('Refresh token expired');
    }

    if (
      session.refreshTokenHash !== SessionRepository.hashToken(refreshToken)
    ) {
      throw AppError.unauthorized('Invalid refresh token');
    }

    const employee = await this.employeeAuthRepository.findActiveById(
      session.employeeId,
    );

    if (!employee) {
      throw AppError.unauthorized('Employee is not active');
    }

    await this.sessionRepository.revoke(session.id);

    return this.issueTokens(employee);
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.jwtService.verifyRefreshToken(refreshToken);

    await this.sessionRepository.revoke(payload.sessionId);
  }

  buildAuthContext(employee: EmployeeAuthRecord): AuthContext {
    return {
      employeeId: employee.id,
      telegramId: employee.telegramId?.toString() ?? '',
      role: employee.role,
      permissions: ROLE_PERMISSIONS[employee.role],
      branchId: employee.branchId,
      departmentId: employee.departmentId,
    };
  }

  private async issueTokens(
    employee: EmployeeAuthRecord,
  ): Promise<AuthTokens> {
    const sessionId = randomUUID();

    const accessToken = this.jwtService.signAccessToken({
      employeeId: employee.id,
      telegramId: employee.telegramId?.toString() ?? '',
      role: employee.role,
      sessionId,
    });

    const refreshToken = this.jwtService.signRefreshToken({
      employeeId: employee.id,
      sessionId,
    });

    await this.sessionRepository.create({
      id: sessionId,
      employeeId: employee.id,
      refreshToken,
      expiresAt: new Date(
        Date.now() +
          parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN) * 1000,
      ),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN),
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
      },
    };
  }
}

const safeEqual = (actual: string, expected: string): boolean => {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
};
