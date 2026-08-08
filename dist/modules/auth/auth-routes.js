"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthRoutes = void 0;
const zod_1 = require("zod");
const app_error_1 = require("../../common/errors/app-error");
const loginBodySchema = zod_1.z.object({
    initData: zod_1.z.string().min(1),
});
const passwordLoginBodySchema = zod_1.z.object({
    login: zod_1.z.string().min(1),
    password: zod_1.z.string().min(1),
});
const refreshBodySchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
const registerAuthRoutes = (app, authService, authGuard) => {
    app.post('/api/v1/auth/telegram', async (request, reply) => {
        const parsed = loginBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const tokens = await authService.loginByTelegram(parsed.data.initData);
        return reply.status(200).send(tokens);
    });
    app.post('/api/v1/auth/password', async (request, reply) => {
        const parsed = passwordLoginBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const tokens = await authService.loginByPassword(parsed.data.login, parsed.data.password);
        return reply.status(200).send(tokens);
    });
    app.post('/api/v1/auth/refresh', async (request, reply) => {
        const parsed = refreshBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        const tokens = await authService.refresh(parsed.data.refreshToken);
        return reply.status(200).send(tokens);
    });
    app.post('/api/v1/auth/logout', async (request, reply) => {
        const parsed = refreshBodySchema.safeParse(request.body);
        if (!parsed.success) {
            throw app_error_1.AppError.badRequest('Invalid request body', parsed.error.flatten().fieldErrors);
        }
        await authService.logout(parsed.data.refreshToken);
        return reply.status(200).send({ message: 'Logged out' });
    });
    app.get('/api/v1/auth/me', { preHandler: authGuard.requireAuth() }, async (request) => {
        const context = request.authContext;
        if (!context) {
            throw app_error_1.AppError.unauthorized('Not authenticated');
        }
        return { user: context };
    });
};
exports.registerAuthRoutes = registerAuthRoutes;
//# sourceMappingURL=auth-routes.js.map