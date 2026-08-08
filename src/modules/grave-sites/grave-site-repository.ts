import type { Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

const graveSiteInclude = {
  customer: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
  burials: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
  },
} as const;

export type GraveSiteRecord = Prisma.GraveSiteGetPayload<{
  include: typeof graveSiteInclude;
}>;

export interface GraveSiteWriteInput {
  readonly customerId: string;
  readonly name: string;
  readonly address?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly size?: string | null;
  readonly features?: string | null;
}

export type GraveSiteUpdateInput = Partial<
  Omit<GraveSiteWriteInput, 'customerId'>
>;

export interface GraveSiteListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly search?: string;
  readonly customerId?: string;
  readonly sortBy?: 'createdAt' | 'name';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface BurialWriteInput {
  readonly fullName: string;
  readonly birthDate?: Date | null;
  readonly deathDate?: Date | null;
  readonly comment?: string | null;
}

export type BurialUpdateInput = Partial<BurialWriteInput>;

export class GraveSiteRepository {
  async create(input: GraveSiteWriteInput): Promise<GraveSiteRecord> {
    return prisma.graveSite.create({
      data: { ...input },
      include: graveSiteInclude,
    });
  }

  async findById(id: string): Promise<GraveSiteRecord | null> {
    return prisma.graveSite.findFirst({
      where: { id, deletedAt: null },
      include: graveSiteInclude,
    });
  }

  async update(
    id: string,
    input: GraveSiteUpdateInput,
  ): Promise<GraveSiteRecord | null> {
    const exists = await this.findById(id);

    if (!exists) {
      return null;
    }

    return prisma.graveSite.update({
      where: { id },
      data: { ...input },
      include: graveSiteInclude,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.graveSite.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async list(
    args: GraveSiteListArgs,
  ): Promise<Paginated<GraveSiteRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.GraveSiteWhereInput = {
      deletedAt: null,
      customerId: args.customerId,
      ...(args.search
        ? {
            OR: [
              { name: { contains: args.search, mode: 'insensitive' } },
              { address: { contains: args.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortBy = args.sortBy ?? 'createdAt';
    const sortOrder = args.sortOrder ?? 'desc';

    const orderBy: Prisma.GraveSiteOrderByWithRelationInput =
      sortBy === 'name' ? { name: sortOrder } : { createdAt: sortOrder };

    const [total, items] = await prisma.$transaction([
      prisma.graveSite.count({ where }),
      prisma.graveSite.findMany({
        where,
        orderBy,
        skip: page.skip,
        take: page.take,
        include: graveSiteInclude,
      }),
    ]);

    return buildPaginated(items, total, page);
  }

  async addBurial(
    graveSiteId: string,
    input: BurialWriteInput,
  ): Promise<GraveSiteRecord> {
    await prisma.burial.create({
      data: { graveSiteId, ...input },
    });

    const record = await this.findById(graveSiteId);

    if (!record) {
      throw new Error('Grave site not found after burial create');
    }

    return record;
  }

  async updateBurial(
    burialId: string,
    input: BurialUpdateInput,
  ): Promise<boolean> {
    const burial = await prisma.burial.findFirst({
      where: { id: burialId, deletedAt: null },
    });

    if (!burial) {
      return false;
    }

    await prisma.burial.update({
      where: { id: burialId },
      data: { ...input },
    });

    return true;
  }

  async softDeleteBurial(burialId: string): Promise<boolean> {
    const burial = await prisma.burial.findFirst({
      where: { id: burialId, deletedAt: null },
    });

    if (!burial) {
      return false;
    }

    await prisma.burial.update({
      where: { id: burialId },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}