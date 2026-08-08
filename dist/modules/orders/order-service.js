"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../../common/errors/app-error");
const toDto = (record) => {
    const paidAmount = record.payments.reduce((sum, payment) => sum + Number(payment.amount.toString()), 0);
    return {
        id: record.id,
        number: record.number,
        status: record.status,
        comment: record.comment,
        totalAmount: Number(record.totalAmount.toString()),
        paidAmount,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        customer: record.customer,
        graveSite: record.graveSite,
        manager: record.manager,
        stages: record.stages.map((stage) => ({
            id: stage.id,
            type: stage.type,
            status: stage.status,
            assignedEmployee: stage.assignedEmployee,
            plannedStart: stage.plannedStart?.toISOString() ?? null,
            plannedEnd: stage.plannedEnd?.toISOString() ?? null,
            completedAt: stage.completedAt?.toISOString() ?? null,
            comment: stage.comment,
        })),
        payments: record.payments.map((payment) => ({
            id: payment.id,
            amount: Number(payment.amount.toString()),
            method: payment.method,
            paidAt: payment.paidAt.toISOString(),
            comment: payment.comment,
        })),
    };
};
const ALLOWED_STATUS_TRANSITIONS = {
    NEW: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};
class OrderService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async create(input) {
        try {
            const record = await this.repository.create(input);
            return toDto(record);
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003') {
                throw app_error_1.AppError.notFound('Related entity not found');
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                throw new app_error_1.AppError({
                    code: 'ORDER_NUMBER_EXISTS',
                    message: 'Заказ с таким номером уже существует',
                    statusCode: 409,
                });
            }
            throw error;
        }
    }
    async getById(id) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Order not found');
        }
        return toDto(record);
    }
    async update(id, input) {
        const record = await this.repository.update(id, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Order not found');
        }
        return toDto(record);
    }
    async remove(id) {
        const deleted = await this.repository.softDelete(id);
        if (!deleted) {
            throw app_error_1.AppError.notFound('Order not found');
        }
    }
    async list(args) {
        const result = await this.repository.list(args);
        return { ...result, items: result.items.map(toDto) };
    }
    async getStats() {
        return this.repository.getStats();
    }
    async changeStatus(id, status) {
        const record = await this.repository.findById(id);
        if (!record) {
            throw app_error_1.AppError.notFound('Order not found');
        }
        if (record.status === status) {
            return toDto(record);
        }
        const allowed = ALLOWED_STATUS_TRANSITIONS[record.status];
        if (!allowed.includes(status)) {
            throw new app_error_1.AppError({
                code: 'STATUS_TRANSITION_INVALID',
                message: `Cannot change status from ${record.status} to ${status}`,
                statusCode: 409,
            });
        }
        const updated = await this.repository.setStatus(id, status);
        if (!updated) {
            throw app_error_1.AppError.notFound('Order not found');
        }
        return toDto(updated);
    }
    async updateStage(orderId, type, input) {
        const record = await this.repository.updateStage(orderId, type, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Order or stage not found');
        }
        return toDto(record);
    }
    async addPayment(orderId, input) {
        const record = await this.repository.addPayment(orderId, input);
        if (!record) {
            throw app_error_1.AppError.notFound('Order not found');
        }
        return toDto(record);
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=order-service.js.map