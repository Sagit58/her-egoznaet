import type { Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import type { Role } from '../../common/rbac/rbac.types';
import { prisma } from '../../database/prisma-client';

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  middleName: true,
  telegramId: true,
  phone: true,
  role: true,
  branchId: true,
  departmentId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type EmployeeRecord = Prisma.EmployeeGetPayload<{
  select: typeof employeeSelect;
}>;

export interface EmployeeFilters {
  readonly role?: Role;
  readonly branchId?: string;
  readonly departmentId?: string;
  readonly isActive?: boolean;
}

export type EmployeeSortField =
  | 'createdAt'
  | 'firstName'
  | 'lastName'
  | 'role';

export interface EmployeeListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly sortBy?: EmployeeSortField;
  readonly sortOrder?: 'asc' | 'desc';
  readonly filters?: EmployeeFilters;
}

export interface EmployeeWriteInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName?: string | null;
  readonly telegramId?: bigint | null;
  readonly phone?: string | null;
  readonly role: Role;
  readonly branchId?: string | null;
  readonly departmentId?: string | null;
  readonly isActive?: boolean;
}

export type EmployeeUpdateInput = Partial<EmployeeWriteInput>;

export class EmployeeRepository {
  async create(input: EmployeeWriteInput): Promise<EmployeeRecord> {
    return prisma.employee.create({
      data: { ...input },
      select: employeeSelect,
    });
  }

  async update(
    id: string,
    input: EmployeeUpdateInput,
  ): Promise<EmployeeRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.employee.update({
      where: { id },
      data: { ...input },
      select: employeeSelect,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async findById(id: string): Promise<EmployeeRecord | null> {
    return prisma.employee.findFirst({
      where: { id, deletedAt: null },
      select: employeeSelect,
    });
  }

  async list(args: EmployeeListArgs): Promise<Paginated<EmployeeRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      role: args.filters?.role,
      branchId: args.filters?.branchId,
      departmentId: args.filters?.departmentId,
      isActive: args.filters?.isActive,
      ...(args.search
        ? {
            OR: [
              { firstName: { contains: args.search, mode: 'insensitive' } },
              { lastName: { contains: args.search, mode: 'insensitive' } },
              { phone: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy = args.sortBy ?? 'createdAt';
    const sortOrder = args.sortOrder ?? 'desc';

    const orderBy: Prisma.EmployeeOrderByWithRelationInput =
      sortBy === 'firstName'
        ? { firstName: sortOrder }
        : sortBy === 'lastName'
          ? { lastName: sortOrder }
          : sortBy === 'role'
            ? { role: sortOrder }
            : { createdAt: sortOrder };

    const [total, items] = await prisma.$transaction([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        select: employeeSelect,
      }),
    ]);

    return buildPaginated(items, total, page);
  }
}