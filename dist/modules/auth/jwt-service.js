"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const app_error_1 = require("../../common/errors/app-error");
const rbac_types_1 = require("../../common/rbac/rbac.types");
const env_1 = require("../../config/env");
const accessTokenPayloadSchema = zod_1.z.object({
    sub: zod_1.z.string(),
    telegramId: zod_1.z.string(),
    role: zod_1.z.enum(rbac_types_1.ROLES),
    sessionId: zod_1.z.string(),
    type: zod_1.z.literal('access'),
});
const refreshTokenPayloadSchema = zod_1.z.object({
    sub: zod_1.z.string(),
    sessionId: zod_1.z.string(),
    type: zod_1.z.literal('refresh'),
});
class JwtService {
    signAccessToken(args) {
        return jsonwebtoken_1.default.sign({
            sub: args.employeeId,
            telegramId: args.telegramId,
            role: args.role,
            sessionId: args.sessionId,
            type: 'access',
        }, env_1.env.JWT_ACCESS_SECRET, { expiresIn: env_1.env.JWT_ACCESS_EXPIRES_IN });
    }
    signRefreshToken(args) {
        return jsonwebtoken_1.default.sign({
            sub: args.employeeId,
            sessionId: args.sessionId,
            type: 'refresh',
        }, env_1.env.JWT_REFRESH_SECRET, { expiresIn: env_1.env.JWT_REFRESH_EXPIRES_IN });
    }
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            const parsed = accessTokenPayloadSchema.safeParse(decoded);
            if (!parsed.success) {
                throw app_error_1.AppError.unauthorized('Invalid access token');
            }
            return {
                employeeId: parsed.data.sub,
                telegramId: parsed.data.telegramId,
                role: parsed.data.role,
                sessionId: parsed.data.sessionId,
            };
        }
        catch (error) {
            if (error instanceof app_error_1.AppError) {
                throw error;
            }
            throw app_error_1.AppError.unauthorized('Invalid access token');
        }
    }
    verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET);
            const parsed = refreshTokenPayloadSchema.safeParse(decoded);
            if (!parsed.success) {
                throw app_error_1.AppError.unauthorized('Invalid refresh token');
            }
            return {
                employeeId: parsed.data.sub,
                sessionId: parsed.data.sessionId,
            };
        }
        catch (error) {
            if (error instanceof app_error_1.AppError) {
                throw error;
            }
            throw app_error_1.AppError.unauthorized('Invalid refresh token');
        }
    }
}
exports.JwtService = JwtService;
//# sourceMappingURL=jwt-service.js.map