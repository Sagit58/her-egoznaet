"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerErrorHandler = void 0;
const logger_1 = require("../logger/logger");
const app_error_1 = require("./app-error");
const registerErrorHandler = (app) => {
    app.setErrorHandler((error, request, reply) => {
        if (error instanceof app_error_1.AppError) {
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
        if (error instanceof Error && 'validation' in error) {
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
        logger_1.logger.error({ err: error, requestId: request.id }, 'Unhandled error');
        reply.status(500).send({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error',
                requestId: request.id,
            },
        });
    });
};
exports.registerErrorHandler = registerErrorHandler;
//# sourceMappingURL=error-handler.js.map