import type { FastifyInstance } from 'fastify';

import type { AuthGuard } from '../../common/auth/auth-guard';
import { AppError } from '../../common/errors/app-error';
import type { OrderService } from './order-service';
import {
  createOrderBodySchema,
  orderIdParamSchema,
  orderListQuerySchema,
  orderStageParamSchema,
  orderStatusBodySchema,
  paymentBodySchema,
  stageUpdateBodySchema,
  updateOrderBodySchema,
} from './order.schemas';

export const registerOrderRoutes = (
  app: FastifyInstance,
  service: OrderService,
  guard: AuthGuard,
): void => {
  app.post(
    '/api/v1/orders',
    { preHandler: guard.requirePermission('order.create') },
    async (request, reply) => {
      const parsed = createOrderBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const order = await service.create({
        customerId: body.customerId,
        graveSiteId: body.graveSiteId ?? null,
        managerId: body.managerId ?? null,
        comment: body.comment ?? null,
        totalAmount: body.totalAmount,
      });

      return reply.status(201).send(order);
    },
  );

  app.get(
    '/api/v1/orders',
    { preHandler: guard.requirePermission('order.list') },
    async (request) => {
      const parsed = orderListQuerySchema.safeParse(request.query);

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
        status: query.status,
        customerId: query.customerId,
        managerId: query.managerId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });
    },
  );

  app.get(
    '/api/v1/orders/:id',
    { preHandler: guard.requirePermission('order.read') },
    async (request) => {
      const parsed = orderIdParamSchema.safeParse(request.params);

      if (!parsed.success) {
        throw AppError.badRequest('Invalid id');
      }

      return service.getById(parsed.data.id);
    },
  );

  app.patch(
    '/api/v1/orders/:id',
    { preHandler: guard.requirePermission('order.update') },
    async (request) => {
      const params = orderIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = updateOrderBodySchema.safeParse(request.body);

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
    '/api/v1/orders/:id',
    { preHandler: guard.requirePermission('order.delete') },
    async (request, reply) => {
      const params = orderIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      await service.remove(params.data.id);

      return reply.status(204).send();
    },
  );

  app.post(
    '/api/v1/orders/:id/status',
    { preHandler: guard.requirePermission('order.change-status') },
    async (request) => {
      const params = orderIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = orderStatusBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      return service.changeStatus(params.data.id, parsed.data.status);
    },
  );

  app.patch(
    '/api/v1/orders/:id/stages/:type',
    { preHandler: guard.requirePermission('order.change-status') },
    async (request) => {
      const params = orderStageParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id or stage type');
      }

      const parsed = stageUpdateBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      return service.updateStage(params.data.id, params.data.type, {
        status: body.status,
        assignedEmployeeId: body.assignedEmployeeId ?? null,
        plannedStart: body.plannedStart
          ? new Date(body.plannedStart)
          : undefined,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : undefined,
        comment: body.comment,
      });
    },
  );

  app.post(
    '/api/v1/orders/:id/payments',
    { preHandler: guard.requirePermission('payment.create') },
    async (request, reply) => {
      const params = orderIdParamSchema.safeParse(request.params);

      if (!params.success) {
        throw AppError.badRequest('Invalid id');
      }

      const parsed = paymentBodySchema.safeParse(request.body);

      if (!parsed.success) {
        throw AppError.badRequest(
          'Invalid request body',
          parsed.error.flatten().fieldErrors,
        );
      }

      const body = parsed.data;

      const order = await service.addPayment(params.data.id, {
        amount: body.amount,
        method: body.method,
        comment: body.comment ?? null,
      });

      return reply.status(201).send(order);
    },
  );
};