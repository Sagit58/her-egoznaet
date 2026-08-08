"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.APP_ERROR_CODES = void 0;
exports.APP_ERROR_CODES = [
    'VALIDATION_ERROR',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'CONFLICT',
    'INTERNAL_ERROR',
    'TELEGRAM_INIT_DATA_INVALID',
    'EMPLOYEE_NOT_FOUND',
    'REFRESH_TOKEN_INVALID',
    'REFRESH_TOKEN_EXPIRED',
    'STATUS_TRANSITION_INVALID',
    'FILE_TOO_LARGE',
    'FILE_CATEGORY_INVALID',
    'ORDER_NUMBER_EXISTS',
];
class AppError extends Error {
    code;
    statusCode;
    details;
    isOperational;
    constructor(options) {
        super(options.message, options.cause ? { cause: options.cause } : undefined);
        this.name = 'AppError';
        this.code = options.code;
        this.statusCode = options.statusCode;
        this.details = options.details;
        this.isOperational = options.isOperational ?? true;
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, AppError);
        }
    }
    static badRequest(message, details) {
        return new AppError({
            code: 'VALIDATION_ERROR',
            message,
            statusCode: 400,
            details,
        });
    }
    static unauthorized(message) {
        return new AppError({ code: 'UNAUTHORIZED', message, statusCode: 401 });
    }
    static forbidden(message) {
        return new AppError({ code: 'FORBIDDEN', message, statusCode: 403 });
    }
    static notFound(message) {
        return new AppError({ code: 'NOT_FOUND', message, statusCode: 404 });
    }
    static conflict(message) {
        return new AppError({ code: 'CONFLICT', message, statusCode: 409 });
    }
}
exports.AppError = AppError;
//# sourceMappingURL=app-error.js.map