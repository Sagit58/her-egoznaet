"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.branchListQuerySchema = exports.updateBranchBodySchema = exports.createBranchBodySchema = exports.branchIdParamSchema = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.branchIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.createBranchBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    address: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().optional(),
});
exports.updateBranchBodySchema = exports.createBranchBodySchema.partial();
exports.branchListQuerySchema = pagination_schemas_1.listQuerySchema.extend({});
//# sourceMappingURL=branch.schemas.js.map