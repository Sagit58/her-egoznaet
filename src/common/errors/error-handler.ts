import type { FastifyInstance } from 'fastify';

import { logger } from '../logger/logger';
import { AppError } from './app-error';

export const registerErrorHandler = (app: FastifyInstance): void => {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
          requestId: request.id,
        },
      });
      return;
    }

    if (error.validation) {
      reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
          requestId: request.id,
        },
      });
      return;
    }

    logger.error({ err: error, requestId: request.id }, 'Unhandled error');

    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        requestId: request.id,
      },
    });
  });
};