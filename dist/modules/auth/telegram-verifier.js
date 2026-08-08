"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTelegramInitData = void 0;
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const app_error_1 = require("../../common/errors/app-error");
const telegramUserSchema = zod_1.z.object({
    id: zod_1.z.number(),
    first_name: zod_1.z.string().optional(),
    last_name: zod_1.z.string().optional(),
    username: zod_1.z.string().optional(),
});
const MAX_INIT_DATA_AGE_MS = 24 * 60 * 60 * 1000;
const verifyTelegramInitData = (initData, botToken) => {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
        throw app_error_1.AppError.unauthorized('Invalid initData: hash is missing');
    }
    params.delete('hash');
    const dataCheckString = [...params.entries()]
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('\n');
    const secretKey = (0, node_crypto_1.createHmac)('sha256', 'WebAppData')
        .update(botToken)
        .digest();
    const calculatedHash = (0, node_crypto_1.createHmac)('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');
    const received = Buffer.from(hash, 'hex');
    const expected = Buffer.from(calculatedHash, 'hex');
    if (received.length !== expected.length ||
        !(0, node_crypto_1.timingSafeEqual)(received, expected)) {
        throw app_error_1.AppError.unauthorized('Invalid initData signature');
    }
    const authDateRaw = params.get('auth_date');
    const authDate = authDateRaw ? Number.parseInt(authDateRaw, 10) : 0;
    if (authDate > 0 && Date.now() - authDate * 1000 > MAX_INIT_DATA_AGE_MS) {
        throw app_error_1.AppError.unauthorized('initData is too old');
    }
    const userRaw = params.get('user');
    if (!userRaw) {
        throw app_error_1.AppError.unauthorized('Invalid initData: user is missing');
    }
    const parsedUser = telegramUserSchema.safeParse(JSON.parse(userRaw));
    if (!parsedUser.success) {
        throw app_error_1.AppError.unauthorized('Invalid initData: user is invalid');
    }
    return { user: parsedUser.data, authDate };
};
exports.verifyTelegramInitData = verifyTelegramInitData;
//# sourceMappingURL=telegram-verifier.js.map