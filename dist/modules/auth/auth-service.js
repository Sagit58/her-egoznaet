"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const node_crypto_1 = require("node:crypto");
const app_error_1 = require("../../common/errors/app-error");
const role_permissions_1 = require("../../common/rbac/role-permissions");
const env_1 = require("../../config/env");
const session_repository_1 = require("./session-repository");
const telegram_verifier_1 = require("./telegram-verifier");
const parseDurationToSeconds = (value) => {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) {
        return 900;
    }
    const amount = Number.parseInt(match[1] ?? '15', 10);
    const unit = match[2] ?? 's';
    const multipliers = {
        s: 1,
        m: 60,
        h: 3600,
        d: 86400,
    };
    return amount * (multipliers[unit] ?? 1);
};
class AuthService {
    jwtService;
    sessionRepository;
    employeeAuthRepository;
    constructor(jwtService, sessionRepository, employeeAuthRepository) {
        this.jwtService = jwtService;
        this.sessionRepository = sessionRepository;
        this.employeeAuthRepository = employeeAuthRepository;
    }
    async loginByTelegram(initData) {
        const botToken = env_1.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            throw new app_error_1.AppError({
                code: 'INTERNAL_ERROR',
                message: 'Telegram bot token is not configured',
                statusCode: 500,
            });
        }
        const verified = (0, telegram_verifier_1.verifyTelegramInitData)(initData, botToken);
        const employee = await this.employeeAuthRepository.findActiveByTelegramId(BigInt(verified.user.id));
        if (!employee) {
            throw app_error_1.AppError.forbidden('Employee not found');
        }
        return this.issueTokens(employee);
    }
    async loginByPassword(login, password) {
        if (!env_1.env.SUPERADMIN_LOGIN || !env_1.env.SUPERADMIN_PASSWORD) {
            throw new app_error_1.AppError({
                code: 'INTERNAL_ERROR',
                message: 'Superadmin login is not configured',
                statusCode: 500,
            });
        }
        if (!safeEqual(login, env_1.env.SUPERADMIN_LOGIN) ||
            !safeEqual(password, env_1.env.SUPERADMIN_PASSWORD)) {
            throw app_error_1.AppError.unauthorized('Invalid login or password');
        }
        const employee = await this.employeeAuthRepository.upsertSuperAdmin(env_1.env.SUPERADMIN_EMPLOYEE_ID);
        return this.issueTokens(employee);
    }
    async refresh(refreshToken) {
        const payload = this.jwtService.verifyRefreshToken(refreshToken);
        const session = await this.sessionRepository.findActiveById(payload.sessionId);
        if (!session) {
            throw app_error_1.AppError.unauthorized('Session is not active');
        }
        if (session.expiresAt.getTime() < Date.now()) {
            throw app_error_1.AppError.unauthorized('Refresh token expired');
        }
        if (session.refreshTokenHash !== session_repository_1.SessionRepository.hashToken(refreshToken)) {
            throw app_error_1.AppError.unauthorized('Invalid refresh token');
        }
        const employee = await this.employeeAuthRepository.findActiveById(session.employeeId);
        if (!employee) {
            throw app_error_1.AppError.unauthorized('Employee is not active');
        }
        await this.sessionRepository.revoke(session.id);
        return this.issueTokens(employee);
    }
    async logout(refreshToken) {
        const payload = this.jwtService.verifyRefreshToken(refreshToken);
        await this.sessionRepository.revoke(payload.sessionId);
    }
    buildAuthContext(employee) {
        return {
            employeeId: employee.id,
            telegramId: employee.telegramId?.toString() ?? '',
            role: employee.role,
            permissions: role_permissions_1.ROLE_PERMISSIONS[employee.role],
            branchId: employee.branchId,
            departmentId: employee.departmentId,
        };
    }
    async issueTokens(employee) {
        const sessionId = (0, node_crypto_1.randomUUID)();
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
            expiresAt: new Date(Date.now() +
                parseDurationToSeconds(env_1.env.JWT_REFRESH_EXPIRES_IN) * 1000),
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: parseDurationToSeconds(env_1.env.JWT_ACCESS_EXPIRES_IN),
            employee: {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: employee.role,
            },
        };
    }
}
exports.AuthService = AuthService;
const safeEqual = (actual, expected) => {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(actualBuffer, expectedBuffer);
};
//# sourceMappingURL=auth-service.js.map