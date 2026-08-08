import type { Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

const departmentInclude = {
  branch: {
    select: { id: true, name: true },
  },
} as const;

export type DepartmentRecord = Prisma.DepartmentGetPayload<{
  include: typeof departmentInclude;
}>;

export interface DepartmentWriteInput {
  readonly name: string;
  readonly branchId?: string | null;
}

export type DepartmentUpdateInput = Partial<DepartmentWriteInput>;

export interface DepartmentListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly branchId?: string;
}

export class DepartmentRepository {
  async create(input: DepartmentWriteInput): Promise<DepartmentRecord> {
    if (!input.branchId) {
      throw new Error('branchId is required to create a department');
    }

    return prisma.department.create({
      data: {
        name: input.name,
        branch: { connect: { id: input.branchId } },
      },
      include: departmentInclude,
    });
  }

  async findById(id: string): Promise<DepartmentRecord | null> {
    return prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: departmentInclude,
    });
  }

  async update(
    id: string,
    input: DepartmentUpdateInput,
  ): Promise<DepartmentRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    const data: Prisma.DepartmentUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.branchId) {
      data.branch = { connect: { id: input.branchId } };
    }

    return prisma.department.update({
      where: { id },
      data,
      include: departmentInclude,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async list(
    args: DepartmentListArgs,
  ): Promise<Paginated<DepartmentRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
      branchId: args.branchId,
      ...(args.search
        ? { name: { contains: args.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        include: departmentInclude,
      }),
    ]);

    return buildPaginated(items, total, page);
  }
}