import { Prisma, type OrderStatus } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type {
  OrderListArgs,
  OrderRecord,
  OrderUpdateInput,
  OrderWriteInput,
  PaymentInput,
  StageUpdateInput,
} from './order-repository';
import { OrderRepository } from './order-repository';

export interface OrderStageDto {
  readonly id: string;
  readonly type: string;
  readonly status: string;
  readonly assignedEmployee: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
  readonly plannedStart: string | null;
  readonly plannedEnd: string | null;
  readonly completedAt: string | null;
  readonly comment: string | null;
}

export interface PaymentDto {
  readonly id: string;
  readonly amount: number;
  readonly method: string;
  readonly paidAt: string;
  readonly comment: string | null;
}

export interface OrderDto {
  readonly id: string;
  readonly number: number;
  readonly status: string;
  readonly comment: string | null;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly customer: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly phone: string;
  };
  readonly graveSite: {
    readonly id: string;
    readonly name: string;
    readonly address: string | null;
    readonly latitude: number | null;
    readonly longitude: number | null;
  } | null;
  readonly manager: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
  } | null;
  readonly stages: ReadonlyArray<OrderStageDto>;
  readonly payments: ReadonlyArray<PaymentDto>;
}

const toDto = (record: OrderRecord): OrderDto => {
  const paidAmount = record.payments.reduce(
    (sum, payment) => sum + Number(payment.amount.toString()),
    0,
  );

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

const ALLOWED_STATUS_TRANSITIONS: Record<
  OrderStatus,
  ReadonlyArray<OrderStatus>
> = {
  NEW: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  async create(input: OrderWriteInput): Promise<OrderDto> {
    try {
      const record = await this.repository.create(input);

      return toDto(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
                throw AppError.notFound('Related entity not found');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError({
          code: 'ORDER_NUMBER_EXISTS',
          message: 'Заказ с таким номером уже существует',
          statusCode: 409,
        });
      }

      throw error;
    }
  }

  async getById(id: string): Promise<OrderDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Order not found');
    }

    return toDto(record);
  }

  async update(id: string, input: OrderUpdateInput): Promise<OrderDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Order not found');
    }

    return toDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Order not found');
    }
  }

  async list(args: OrderListArgs): Promise<Paginated<OrderDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }

  async changeStatus(id: string, status: OrderStatus): Promise<OrderDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Order not found');
    }

    if (record.status === status) {
      return toDto(record);
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[record.status];

    if (!allowed.includes(status)) {
      throw new AppError({
        code: 'STATUS_TRANSITION_INVALID',
        message: `Cannot change status from ${record.status} to ${status}`,
        statusCode: 409,
      });
    }

    const updated = await this.repository.setStatus(id, status);

    if (!updated) {
      throw AppError.notFound('Order not found');
    }

    return toDto(updated);
  }

  async updateStage(
    orderId: string,
    type: 'SURVEY' | 'DESIGN' | 'PRODUCTION' | 'INSTALLATION',
    input: StageUpdateInput,
  ): Promise<OrderDto> {
    const record = await this.repository.updateStage(orderId, type, input);

    if (!record) {
      throw AppError.notFound('Order or stage not found');
    }

    return toDto(record);
  }

  async addPayment(orderId: string, input: PaymentInput): Promise<OrderDto> {
    const record = await this.repository.addPayment(orderId, input);

    if (!record) {
      throw AppError.notFound('Order not found');
    }

    return toDto(record);
  }
}