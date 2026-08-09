"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderRepository = void 0;
const app_error_1 = require("../../common/errors/app-error");
const pagination_1 = require("../../common/pagination/pagination");
const prisma_client_1 = require("../../database/prisma-client");
const orderInclude = {
    customer: {
        select: { id: true, firstName: true, lastName: true, phone: true },
    },
    graveSite: {
        select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
        },
    },
    manager: {
        select: { id: true, firstName: true, lastName: true },
    },
    stages: {
        orderBy: { createdAt: 'asc' },
        include: {
            assignedEmployee: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    },
    payments: {
        where: { deletedAt: null },
        orderBy: { paidAt: 'desc' },
    },
};
class OrderRepository {
    async create(input) {
        return prisma_client_1.prisma.$transaction(async (tx) => {
            let customerId = input.customerId ?? null;
            if (!customerId && input.newCustomer) {
                const created = await tx.customer.create({
                    data: {
                        firstName: input.newCustomer.firstName,
                        lastName: input.newCustomer.lastName,
                        middleName: input.newCustomer.middleName ?? null,
                        phone: input.newCustomer.phone,
                        email: input.newCustomer.email ?? null,
                        comment: input.newCustomer.comment ?? null,
                    },
                });
                customerId = created.id;
            }
            if (!customerId) {
                throw app_error_1.AppError.badRequest('Необходимо указать customerId или newCustomer');
            }
            const max = await tx.order.aggregate({ _max: { number: true } });
            const nextNumber = (max._max.number ?? 0) + 1;
            return tx.order.create({
                data: {
                    number: nextNumber,
                    customerId,
                    graveSiteId: input.graveSiteId ?? null,
                    managerId: input.managerId ?? null,
                    comment: input.comment ?? null,
                    totalAmount: input.totalAmount ?? 0,
                    stages: {
                        create: [
                            { type: 'SURVEY' },
                            { type: 'DESIGN' },
                            { type: 'PRODUCTION' },
                            { type: 'INSTALLATION' },
                        ],
                    },
                },
                include: orderInclude,
            });
        });
    }
    async findById(id) {
        return prisma_client_1.prisma.order.findFirst({
            where: { id, deletedAt: null },
            include: orderInclude,
        });
    }
    async update(id, input) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.order.update({
            where: { id },
            data: { ...input },
            include: orderInclude,
        });
    }
    async setStatus(id, status) {
        const exists = await this.findById(id);
        if (!exists) {
            return null;
        }
        return prisma_client_1.prisma.order.update({
            where: { id },
            data: { status },
            include: orderInclude,
        });
    }
    async softDelete(id) {
        const exists = await this.findById(id);
        if (!exists) {
            return false;
        }
        await prisma_client_1.prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return true;
    }
    async updateStage(orderId, type, input) {
        const stage = await prisma_client_1.prisma.orderStage.findUnique({
            where: { orderId_type: { orderId, type } },
        });
        if (!stage) {
            return null;
        }
        await prisma_client_1.prisma.orderStage.update({
            where: { id: stage.id },
            data: {
                status: input.status,
                assignedEmployeeId: input.assignedEmployeeId,
                plannedStart: input.plannedStart,
                plannedEnd: input.plannedEnd,
                comment: input.comment,
                completedAt: input.status === 'DONE'
                    ? new Date()
                    : input.status
                        ? null
                        : undefined,
            },
        });
        return this.findById(orderId);
    }
    async addPayment(orderId, input) {
        const exists = await this.findById(orderId);
        if (!exists) {
            return null;
        }
        await prisma_client_1.prisma.payment.create({
            data: { orderId, ...input },
        });
        return this.findById(orderId);
    }
    async list(args) {
        const page = (0, pagination_1.normalizePage)(args.page, args.pageSize);
        const searchFilters = [];
        if (args.search && args.search.trim() !== '') {
            const asNumber = Number(args.search);
            if (Number.isFinite(asNumber)) {
                searchFilters.push({ number: asNumber });
            }
            searchFilters.push({
                customer: {
                    firstName: { contains: args.search, mode: 'insensitive' },
                },
            });
            searchFilters.push({
                customer: {
                    lastName: { contains: args.search, mode: 'insensitive' },
                },
            });
        }
        const where = {
            deletedAt: null,
            status: args.status,
            customerId: args.customerId,
            managerId: args.managerId,
            ...(args.assignedTo
                ? { stages: { some: { assignedEmployeeId: args.assignedTo } } }
                : {}),
            ...(searchFilters.length > 0 ? { OR: searchFilters } : {}),
        };
        const sortBy = args.sortBy ?? 'createdAt';
        const sortOrder = args.sortOrder ?? 'desc';
        const orderBy = sortBy === 'number'
            ? { number: sortOrder }
            : sortBy === 'totalAmount'
                ? { totalAmount: sortOrder }
                : { createdAt: sortOrder };
        const [total, items] = await prisma_client_1.prisma.$transaction([
            prisma_client_1.prisma.order.count({ where }),
            prisma_client_1.prisma.order.findMany({
                where,
                orderBy,
                skip: page.skip,
                take: page.take,
                include: orderInclude,
            }),
        ]);
        return (0, pagination_1.buildPaginated)(items, total, page);
    }
    async getStats() {
        const [totalOrders, byStatus, paidAggregate] = await Promise.all([
            prisma_client_1.prisma.order.count({ where: { deletedAt: null } }),
            prisma_client_1.prisma.order.groupBy({
                by: ['status'],
                where: { deletedAt: null },
                _count: true,
                _sum: { totalAmount: true },
            }),
            prisma_client_1.prisma.payment.aggregate({
                where: { deletedAt: null },
                _sum: { amount: true },
            }),
        ]);
        const statusCounts = new Map();
        let revenueTotal = 0;
        for (const row of byStatus) {
            statusCounts.set(row.status, row._count);
            revenueTotal += Number(row._sum.totalAmount ?? 0);
        }
        const paidTotal = Number(paidAggregate._sum.amount ?? 0);
        return {
            totalOrders,
            activeOrders: statusCounts.get('IN_PROGRESS') ?? 0,
            completedOrders: statusCounts.get('COMPLETED') ?? 0,
            cancelledOrders: statusCounts.get('CANCELLED') ?? 0,
            totalRevenue: revenueTotal,
            paidTotal,
            unpaidTotal: Math.max(revenueTotal - paidTotal, 0),
        };
    }
}
exports.OrderRepository = OrderRepository;
//# sourceMappingURL=order-repository.js.map