import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import type { AuthService } from './auth-service';

const loginBodySchema = z.object({
  initData: z.string().min(1),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const registerAuthRoutes = (
  app: FastifyInstance,
  authService: AuthService,
  authGuard: AuthGuard,
): void => {
  app.post('/api/v1/auth/telegram', async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw AppError.badRequest(
        'Invalid request body',
        parsed.error.flatten().fieldErrors,
      );
    }

    const tokens = await authService.loginByTelegram(parsed.data.initData);

    return reply.status(200).send(tokens);
  });

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    const parsed = refreshBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw AppError.badRequest(
        'Invalid request body',
        parsed.error.flatten().fieldErrors,
      );
    }

    const tokens = await authService.refresh(parsed.data.refreshToken);

    return reply.status(200).send(tokens);
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const parsed = refreshBodySchema.safeParse(request.body);

    if (!parsed.success) {
      throw AppError.badRequest(
        'Invalid request body',
        parsed.error.flatten().fieldErrors,
      );
    }

    await authService.logout(parsed.data.refreshToken);

    return reply.status(200).send({ message: 'Logged out' });
  });

  app.get(
    '/api/v1/auth/me',
    { preHandler: authGuard.requireAuth() },
    async (request) => {
      const context = request.authContext;

      if (!context) {
        throw AppError.unauthorized('Not authenticated');
      }

      return { user: context };
    },
  );
};