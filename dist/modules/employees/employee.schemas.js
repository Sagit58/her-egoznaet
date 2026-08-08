"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeListQuerySchema = exports.updateEmployeeBodySchema = exports.createEmployeeBodySchema = exports.employeeIdParamSchema = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
const rbac_types_1 = require("../../common/rbac/rbac.types");
exports.employeeIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.createEmployeeBodySchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1),
    lastName: zod_1.z.string().trim().min(1),
    middleName: zod_1.z.string().trim().optional(),
    telegramId: zod_1.z.string().regex(/^\d{5,15}$/).optional(),
    phone: zod_1.z.string().trim().optional(),
    role: zod_1.z.enum(rbac_types_1.ROLES),
    branchId: zod_1.z.string().uuid().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.updateEmployeeBodySchema = exports.createEmployeeBodySchema.partial();
exports.employeeListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    sortBy: zod_1.z
        .enum(['createdAt', 'firstName', 'lastName', 'role'])
        .default('createdAt'),
    role: zod_1.z.enum(rbac_types_1.ROLES).optional(),
    branchId: zod_1.z.string().uuid().optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    isActive: zod_1.z
        .union([zod_1.z.literal('true'), zod_1.z.literal('false')])
        .transform((value) => value === 'true')
        .optional(),
});
//# sourceMappingURL=employee.schemas.js.map