"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerListQuerySchema = exports.noteBodySchema = exports.updateCustomerBodySchema = exports.createCustomerBodySchema = exports.contactBodySchema = exports.customerIdParamSchema = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.customerIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.contactBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    phone: zod_1.z.string().trim().min(1),
    relation: zod_1.z.string().trim().optional(),
});
exports.createCustomerBodySchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1),
    lastName: zod_1.z.string().trim().min(1),
    middleName: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().optional(),
    comment: zod_1.z.string().trim().optional(),
    contacts: zod_1.z.array(exports.contactBodySchema).max(20).optional(),
});
exports.updateCustomerBodySchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1).optional(),
    lastName: zod_1.z.string().trim().min(1).optional(),
    middleName: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().min(1).optional(),
    email: zod_1.z.string().trim().optional(),
    comment: zod_1.z.string().trim().optional(),
});
exports.noteBodySchema = zod_1.z.object({
    text: zod_1.z.string().trim().min(1),
});
exports.customerListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    sortBy: zod_1.z
        .enum(['createdAt', 'firstName', 'lastName'])
        .default('createdAt'),
});
//# sourceMappingURL=customer.schemas.js.map