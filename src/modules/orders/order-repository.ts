import type { OrderStatus, Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

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
} as const;

export type OrderRecord = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export interface OrderWriteInput {
  readonly customerId: string;
  readonly graveSiteId?: string | null;
  readonly managerId?: string | null;
  readonly comment?: string | null;
  readonly totalAmount?: number;
}

export interface OrderUpdateInput {
  readonly graveSiteId?: string | null;
  readonly managerId?: string | null;
  readonly comment?: string | null;
  readonly totalAmount?: number;
}

export interface OrderListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly status?: OrderStatus;
  readonly customerId?: string;
  readonly managerId?: string;
  readonly assignedTo?: string;
  readonly sortBy?: 'createdAt' | 'number' | 'totalAmount';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface StageUpdateInput {
  readonly status?: 'PENDING' | 'IN_PROGRESS' | 'DONE';
  readonly assignedEmployeeId?: string | null;
  readonly plannedStart?: Date | null;
  readonly plannedEnd?: Date | null;
  readonly comment?: string | null;
}

export interface PaymentInput {
  readonly amount: number;
  readonly method: string;
  readonly comment?: string | null;
}

export interface OrderStats {
  readonly totalOrders: number;
  readonly activeOrders: number;
  readonly completedOrders: number;
  readonly cancelledOrders: number;
  readonly totalRevenue: number;
  readonly paidTotal: number;
  readonly unpaidTotal: number;
}

export class OrderRepository {
  async create(input: OrderWriteInput): Promise<OrderRecord> {
    return prisma.$transaction(async (tx) => {
      const max = await tx.order.aggregate({ _max: { number: true } });
      const nextNumber = (max._max.number ?? 0) + 1;

      return tx.order.create({
        data: {
          number: nextNumber,
          customerId: input.customerId,
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

  async findById(id: string): Promise<OrderRecord | null> {
    return prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: orderInclude,
    });
  }

  async update(id: string, input: OrderUpdateInput): Promise<OrderRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.order.update({
      where: { id },
      data: { ...input },
      include: orderInclude,
    });
  }

  async setStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async updateStage(
    orderId: string,
    type: 'SURVEY' | 'DESIGN' | 'PRODUCTION' | 'INSTALLATION',
    input: StageUpdateInput,
  ): Promise<OrderRecord | null> {
    const stage = await prisma.orderStage.findUnique({
      where: { orderId_type: { orderId, type } },
    });

    if (!stage) {
      return null;
    }

    await prisma.orderStage.update({
      where: { id: stage.id },
      data: {
        status: input.status,
        assignedEmployeeId: input.assignedEmployeeId,
        plannedStart: input.plannedStart,
        plannedEnd: input.plannedEnd,
        comment: input.comment,
        completedAt:
          input.status === 'DONE'
            ? new Date()
            : input.status
              ? null
              : undefined,
      },
    });

    return this.findById(orderId);
  }

  async addPayment(orderId: string, input: PaymentInput): Promise<OrderRecord | null> {
    const exists = await this.findById(orderId);

    if (!exists) {
      return null;
    }

    await prisma.payment.create({
      data: { orderId, ...input },
    });

    return this.findById(orderId);
  }

  async list(args: OrderListArgs): Promise<Paginated<OrderRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const searchFilters: Prisma.OrderWhereInput[] = [];

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

    const where: Prisma.OrderWhereInput = {
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

    const orderBy: Prisma.OrderOrderByWithRelationInput =
      sortBy === 'number'
        ? { number: sortOrder }
        : sortBy === 'totalAmount'
          ? { totalAmount: sortOrder }
          : { createdAt: sortOrder };

    const [total, items] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: orderInclude,
      }),
    ]);

    return buildPaginated(items, total, page);
  }

  async getStats(): Promise<OrderStats> {
    const [totalOrders, byStatus, paidAggregate] = await Promise.all([
      prisma.order.count({ where: { deletedAt: null } }),
      prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.payment.aggregate({
        where: { deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const statusCounts = new Map<string, number>();
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