"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(8080),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    TELEGRAM_BOT_TOKEN: zod_1.z.string().optional(),
    SUPERADMIN_LOGIN: zod_1.z.string().min(1).optional(),
    SUPERADMIN_PASSWORD: zod_1.z.string().min(8).optional(),
    SUPERADMIN_EMPLOYEE_ID: zod_1.z
        .string()
        .uuid()
        .default('00000000-0000-4000-8000-000000000001'),
    MINIO_ENDPOINT: zod_1.z.string().default('localhost'),
    MINIO_PORT: zod_1.z.coerce.number().int().positive().default(9000),
    MINIO_USE_SSL: zod_1.z
        .string()
        .default('false')
        .transform((value) => value === 'true'),
    MINIO_ACCESS_KEY: zod_1.z.string().default('minioadmin'),
    MINIO_SECRET_KEY: zod_1.z.string().default('minioadmin'),
    MINIO_BUCKET: zod_1.z.string().default('monument-erp'),
});
const parseResult = envSchema.safeParse(process.env);
if (!parseResult.success) {
    console.error('Invalid environment variables:', parseResult.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parseResult.data;
//# sourceMappingURL=env.js.map