"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("@fastify/cors"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const swagger_1 = __importDefault(require("@fastify/swagger"));
const swagger_ui_1 = __importDefault(require("@fastify/swagger-ui"));
const fastify_1 = __importDefault(require("fastify"));
const node_process_1 = __importDefault(require("node:process"));
const error_handler_1 = require("./common/errors/error-handler");
const logger_1 = require("./common/logger/logger");
const env_1 = require("./config/env");
const container_1 = require("./container");
const prisma_client_1 = require("./database/prisma-client");
const server = (0, fastify_1.default)({ logger: false });
const start = async () => {
    try {
        await server.register(cors_1.default, {
            origin: true,
            credentials: true,
        });
        await server.register(multipart_1.default, {
            limits: { fileSize: 20 * 1024 * 1024 },
        });
        await server.register(swagger_1.default, {
            openapi: {
                info: {
                    title: 'Monument ERP API',
                    description: 'API для управления заказами памятников',
                    version: '1.0.0',
                },
                servers: [
                    {
                        url: `http://localhost:${env_1.env.PORT}`,
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
        await server.register(swagger_ui_1.default, {
            routePrefix: '/docs',
            uiConfig: {
                docExpansion: 'list',
                deepLinking: false,
            },
        });
        (0, error_handler_1.registerErrorHandler)(server);
        const container = (0, container_1.createContainer)();
        try {
            await container.storageService.ensureBucket();
        }
        catch (error) {
            logger_1.logger.warn({ error }, 'File storage is unavailable; file uploads and downloads may fail');
        }
        (0, container_1.registerRoutes)(server, container);
        server.get('/health', async () => {
            return { status: 'ok' };
        });
        server.get('/health/db', async () => {
            await prisma_client_1.prisma.$queryRaw `SELECT 1`;
            return { status: 'ok', database: 'connected' };
        });
        await server.listen({
            port: env_1.env.PORT,
            host: '0.0.0.0',
        });
        logger_1.logger.info(`Server listening on port ${env_1.env.PORT}`);
        logger_1.logger.info(`API docs available at http://localhost:${env_1.env.PORT}/docs`);
    }
    catch (error) {
        logger_1.logger.error(error);
        node_process_1.default.exit(1);
    }
};
void start();
//# sourceMappingURL=server.js.map