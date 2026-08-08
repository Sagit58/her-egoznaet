import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import {
  branchIdParamSchema,
  branchListQuerySchema,
  createBranchBodySchema,
  updateBranchBodySchema,
} from './branch.schemas';
import type { BranchService } from './branch-service';

export const registerBranchRoutes = (
  app: FastifyInstance,
  service: BranchService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/branches',
    { preHandler: guard.requirePermission('branch.create') },
    async (request, reply) => {
      const parsed = createBranchBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const branch = await service.create({
        name: body.name,
        address: body.address ?? null,
        phone: body.phone ?? null,
      });

      return reply.status(201).send(branch);
    },
  );

  app.get(
    '/api/v1/branches',
    { preHandler: guard.requirePermission('branch.list') },
    async (request) => {
      const parsed = branchListQuerySchema.safeParse(request.query);

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
      });
    },
  );

  app.get(
    '/api/v1/branches/:id',
    { preHandler: guard.requirePermission('branch.read') },
    async (request) => {
      const parsed = branchIdParamSchema.safeParse(request.params);

      if (!parsed.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getById(parsed.data.id);
    },
  );

  app.patch(
    '/api/v1/branches/:id',
    { preHandler: guard.requirePermission('branch.update') },
    async (request) => {
      const params = branchIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = updateBranchBodySchema.safeParse(request.body);

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
    '/api/v1/branches/:id',
    { preHandler: guard.requirePermission('branch.delete') },
    async (request, reply) => {
      const params = branchIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );
};