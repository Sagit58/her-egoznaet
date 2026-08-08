import type { FileCategory, Prisma } from '@prisma/client';

import {
  buildPaginated,
  normalizePage,
} from '../../common/pagination/pagination';
import type { Paginated } from '../../common/pagination/pagination.types';
import { prisma } from '../../database/prisma-client';

const fileSelect = {
  id: true,
  ownerId: true,
  orderId: true,
  customerId: true,
  category: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  storageKey: true,
  createdAt: true,
  deletedAt: true,
  owner: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

export type FileRecord = Prisma.FileEntityGetPayload<{
  select: typeof fileSelect;
}>;

export interface FileCreateInput {
  readonly ownerId: string;
  readonly category: FileCategory;
  readonly originalName: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly storageKey: string;
  readonly orderId?: string | null;
  readonly customerId?: string | null;
}

export interface FileListArgs {
  readonly page?: number;
  readonly pageSize?: number;
  readonly orderId?: string;
  readonly customerId?: string;
  readonly category?: FileCategory;
}

export class FileRepository {
  async create(input: FileCreateInput): Promise<FileRecord> {
    return prisma.fileEntity.create({
      data: { ...input },
      select: fileSelect,
    });
  }

  async findById(id: string): Promise<FileRecord | null> {
    return prisma.fileEntity.findFirst({
      where: { id, deletedAt: null },
      select: fileSelect,
    });
  }

  async softDelete(id: string): Promise<boolean> {
    const exists = await this.findById(id);

    if (!exists) {
      return false;
    }

    await prisma.fileEntity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return true;
  }

  async list(args: FileListArgs): Promise<Paginated<FileRecord>> {
    const page = normalizePage(args.page, args.pageSize);

    const where: Prisma.FileEntityWhereInput = {
      deletedAt: null,
      orderId: args.orderId,
      customerId: args.customerId,
      category: args.category,
    };

    const [total, items] = await prisma.$transaction([
      prisma.fileEntity.count({ where }),
      prisma.fileEntity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
        select: fileSelect,
      }),
    ]);

    return buildPaginated(items, total, page);
  }
}