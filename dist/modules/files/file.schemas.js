"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileListQuerySchema = exports.fileFieldsSchema = exports.fileIdParamSchema = exports.MAX_FILE_SIZE_BYTES = exports.ALLOWED_MIME_TYPES = exports.FILE_CATEGORIES = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.FILE_CATEGORIES = [
    'SURVEY_PHOTO',
    'DESIGN',
    'PRODUCTION_PHOTO',
    'INSTALLATION_PHOTO',
    'DOCUMENT',
];
exports.ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];
exports.MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
exports.fileIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.fileFieldsSchema = zod_1.z.object({
    category: zod_1.z.enum(exports.FILE_CATEGORIES),
    orderId: zod_1.z.string().uuid().optional(),
    customerId: zod_1.z.string().uuid().optional(),
});
exports.fileListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    orderId: zod_1.z.string().uuid().optional(),
    customerId: zod_1.z.string().uuid().optional(),
    category: zod_1.z.enum(exports.FILE_CATEGORIES).optional(),
});
//# sourceMappingURL=file.schemas.js.map