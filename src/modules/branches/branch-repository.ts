import type { Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

const branchSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export type BranchRecord = Prisma.BranchGetPayload<{
  select: typeof branchSelect;
}>;

export interface BranchWriteInput {
  readonly name: string;
  readonly address?: string | null;
  readonly phone?: string | null;
}

export type BranchUpdateInput = Partial<BranchWriteInput>;

export interface BranchListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
}

export class BranchRepository {
  async create(input: BranchWriteInput): Promise<BranchRecord> {
    return prisma.branch.create({
      data: { ...input },
      select: branchSelect,
    });
  }

  async findById(id: string): Promise<BranchRecord | null> {
    return prisma.branch.findFirst({
      where: { id, deletedAt: null },
      select: branchSelect,
    });
  }

  async update(
    id: string,
    input: BranchUpdateInput,
  ): Promise<BranchRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.branch.update({
      where: { id },
      data: { ...input },
      select: branchSelect,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async list(args: BranchListArgs): Promise<Paginated<BranchRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      ...(args.search
        ? { name: { contains: args.search, mode: 'insensitive' } }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.branch.count({ where }),
      prisma.branch.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        select: branchSelect,
      }),
    ]);

    return buildPaginated(items, total, page);
  }
}