"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.graveSiteListQuerySchema = exports.burialBodySchema = exports.updateGraveSiteBodySchema = exports.createGraveSiteBodySchema = exports.burialIdParamSchema = exports.graveSiteIdParamSchema = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.graveSiteIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.burialIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    burialId: zod_1.z.string().uuid(),
});
exports.createGraveSiteBodySchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid(),
    name: zod_1.z.string().trim().min(1),
    address: zod_1.z.string().trim().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    size: zod_1.z.string().trim().optional(),
    features: zod_1.z.string().trim().optional(),
});
exports.updateGraveSiteBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).optional(),
    address: zod_1.z.string().trim().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    size: zod_1.z.string().trim().optional(),
    features: zod_1.z.string().trim().optional(),
});
exports.burialBodySchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(1),
    birthDate: zod_1.z.string().datetime().optional(),
    deathDate: zod_1.z.string().datetime().optional(),
    comment: zod_1.z.string().trim().optional(),
});
exports.graveSiteListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    sortBy: zod_1.z.enum(['createdAt', 'name']).default('createdAt'),
    customerId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=grave-site.schemas.js.map