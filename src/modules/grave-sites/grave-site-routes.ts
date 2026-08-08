import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import type { GraveSiteService } from './grave-site-service';
import {
  burialBodySchema,
  burialIdParamSchema,
  createGraveSiteBodySchema,
  graveSiteIdParamSchema,
  graveSiteListQuerySchema,
  updateGraveSiteBodySchema,
} from './grave-site.schemas';

export const registerGraveSiteRoutes = (
  app: FastifyInstance,
  service: GraveSiteService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/grave-sites',
    { preHandler: guard.requirePermission('grave-site.create') },
    async (request, reply) => {
      const parsed = createGraveSiteBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const graveSite = await service.create({
        customerId: body.customerId,
        name: body.name,
        address: body.address ?? null,
        size: body.size ?? null,
        features: body.features ?? null,
      });

      return reply.status(201).send(graveSite);
    },
  );

  app.get(
    '/api/v1/grave-sites',
    { preHandler: guard.requirePermission('grave-site.list') },
    async (request) => {
      const parsed = graveSiteListQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid query parameters',
          parsed.error.flatten().fieldErrors,
        );
      }

      const query = parsed.data;

      return service.list({
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        customerId: query.customerId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
    },
  );

  app.get(
    '/api/v1/grave-sites/:id',
    { preHandler: guard.requirePermission('grave-site.read') },
    async (request) => {
      const parsed = graveSiteIdParamSchema.safeParse(request.params);

      if (!parsed.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getById(parsed.data.id);
    },
  );

  app.patch(
    '/api/v1/grave-sites/:id',
    { preHandler: guard.requirePermission('grave-site.update') },
    async (request) => {
      const params = graveSiteIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = updateGraveSiteBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      return service.update(params.data.id, parsed.data);
    },
  );

  app.delete(
    '/api/v1/grave-sites/:id',
    { preHandler: guard.requirePermission('grave-site.delete') },
    async (request, reply) => {
      const params = graveSiteIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );

  app.post(
    '/api/v1/grave-sites/:id/burials',
    { preHandler: guard.requirePermission('burial.create') },
    async (request, reply) => {
      const params = graveSiteIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = burialBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const graveSite = await service.addBurial(params.data.id, {
        fullName: body.fullName,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        deathDate: body.deathDate ? new Date(body.deathDate) : null,
        comment: body.comment ?? null,
      });

      return reply.status(201).send(graveSite);
    },
  );

  app.patch(
    '/api/v1/grave-sites/:id/burials/:burialId',
    { preHandler: guard.requirePermission('burial.update') },
    async (request, reply) => {
      const params = burialIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = burialBodySchema.partial().safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      await service.updateBurial(params.data.burialId, {
        fullName: body.fullName,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        deathDate: body.deathDate ? new Date(body.deathDate) : undefined,
        comment: body.comment,
      });

      return reply.status(204).send();
    },
  );

  app.delete(
    '/api/v1/grave-sites/:id/burials/:burialId',
    { preHandler: guard.requirePermission('burial.delete') },
    async (request, reply) => {
      const params = burialIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.removeBurial(params.data.burialId);

      return reply.status(204).send();
    },
  );
};