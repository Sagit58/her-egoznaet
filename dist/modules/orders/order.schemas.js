"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderListQuerySchema = exports.paymentBodySchema = exports.stageUpdateBodySchema = exports.orderStatusBodySchema = exports.updateOrderBodySchema = exports.createOrderBodySchema = exports.orderStageParamSchema = exports.orderIdParamSchema = exports.STAGE_TYPES = exports.ORDER_STATUSES = void 0;
const zod_1 = require("zod");
const pagination_schemas_1 = require("../../common/pagination/pagination.schemas");
exports.ORDER_STATUSES = [
    'NEW',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
];
exports.STAGE_TYPES = [
    'SURVEY',
    'DESIGN',
    'PRODUCTION',
    'INSTALLATION',
];
exports.orderIdParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
exports.orderStageParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(exports.STAGE_TYPES),
});
/**
 * Встроенный клиент — альтернатива `customerId` при создании заказа.
 * Позволяет создать клиента и заказ атомарно в одной транзакции.
 */
const newCustomerSchema = zod_1.z.object({
    firstName: zod_1.z.string().trim().min(1),
    lastName: zod_1.z.string().trim().min(1),
    middleName: zod_1.z.string().trim().optional(),
    phone: zod_1.z.string().trim().min(1),
    email: zod_1.z.string().trim().optional(),
    comment: zod_1.z.string().trim().optional(),
});
exports.createOrderBodySchema = zod_1.z
    .object({
    customerId: zod_1.z.string().uuid().optional(),
    newCustomer: newCustomerSchema.optional(),
    number: zod_1.z.number().int().positive().optional(),
    graveSiteId: zod_1.z.string().uuid().optional(),
    managerId: zod_1.z.string().uuid().optional(),
    comment: zod_1.z.string().trim().optional(),
    totalAmount: zod_1.z.number().nonnegative().optional(),
})
    .refine((data) => data.customerId ?? data.newCustomer, {
    message: 'Необходимо указать customerId или newCustomer',
    path: ['customerId'],
});
exports.updateOrderBodySchema = zod_1.z.object({
    graveSiteId: zod_1.z.string().uuid().nullable().optional(),
    managerId: zod_1.z.string().uuid().nullable().optional(),
    comment: zod_1.z.string().trim().optional(),
    totalAmount: zod_1.z.number().nonnegative().optional(),
});
exports.orderStatusBodySchema = zod_1.z.object({
    status: zod_1.z.enum(exports.ORDER_STATUSES),
});
exports.stageUpdateBodySchema = zod_1.z.object({
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'DONE']).optional(),
    assignedEmployeeId: zod_1.z.string().uuid().optional(),
    plannedStart: zod_1.z.string().datetime().optional(),
    plannedEnd: zod_1.z.string().datetime().optional(),
    comment: zod_1.z.string().trim().optional(),
});
exports.paymentBodySchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    method: zod_1.z.string().trim().min(1),
    comment: zod_1.z.string().trim().optional(),
});
exports.orderListQuerySchema = pagination_schemas_1.listQuerySchema.extend({
    sortBy: zod_1.z
        .enum(['createdAt', 'number', 'totalAmount'])
        .default('createdAt'),
    status: zod_1.z.enum(exports.ORDER_STATUSES).optional(),
    customerId: zod_1.z.string().uuid().optional(),
    managerId: zod_1.z.string().uuid().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
});
//# sourceMappingURL=order.schemas.js.map