import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import process from 'node:process';

import { registerErrorHandler } from './common/errors/error-handler';
import { logger } from './common/logger/logger';
import { env } from './config/env';
import { createContainer, registerRoutes } from './container';
import { prisma } from './database/prisma-client';

const server = Fastify({ logger: false });

const start = async (): Promise<void> => {
  try {
    await server.register(cors, {
      origin: true,
      credentials: true,
    });

    await server.register(multipart, {
      limits: { fileSize: 20 * 1024 * 1024 },
    });

    await server.register(swagger, {
      openapi: {
        info: {
          title: 'Monument ERP API',
          description: 'API для управления заказами памятников',
          version: '1.0.0',
        },
        servers: [
          {
            url: `http://localhost:${env.PORT}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await server.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    registerErrorHandler(server);

    const container = createContainer();

    await container.storageService.ensureBucket();

    registerRoutes(server, container);

    server.get('/health', async () => {
      return { status: 'ok' };
    });

    server.get('/health/db', async () => {
      await prisma.$queryRaw`SELECT 1`;

      return { status: 'ok', database: 'connected' };
    });

    await server.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on port ${env.PORT}`);
    logger.info(`API docs available at http://localhost:${env.PORT}/docs`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

void start();