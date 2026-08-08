"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentListQuerySchema = exports.updateDepartmentBodySchema = exports.createDepartmentBodySchema = exports.departmentIdParamSchema = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.departmentIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.createDepartmentBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    branchId: zod_1.z.string().uuid().optional(),
});
exports.updateDepartmentBodySchema = exports.createDepartmentBodySchema.partial();
exports.departmentListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    branchId: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=department.schemas.js.map