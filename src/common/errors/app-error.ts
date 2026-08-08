export const APP_ERROR_CODES = [
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
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export interface AppErrorOptions {
  readonly code: AppErrorCode;
  readonly message: string;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly cause?: Error;
  readonly isOperational?: boolean;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(options: AppErrorOptions) {
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

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError({
      code: 'VALIDATION_ERROR',
      message,
      statusCode: 400,
      details,
    });
  }

  static unauthorized(message: string): AppError {
    return new AppError({ code: 'UNAUTHORIZED', message, statusCode: 401 });
  }

  static forbidden(message: string): AppError {
    return new AppError({ code: 'FORBIDDEN', message, statusCode: 403 });
  }

  static notFound(message: string): AppError {
    return new AppError({ code: 'NOT_FOUND', message, statusCode: 404 });
  }

  static conflict(message: string): AppError {
    return new AppError({ code: 'CONFLICT', message, statusCode: 409 });
  }
}