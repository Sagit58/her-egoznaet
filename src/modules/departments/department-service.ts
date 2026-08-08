import { Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type {
  DepartmentListArgs,
  DepartmentRecord,
  DepartmentUpdateInput,
  DepartmentWriteInput,
} from './department-repository';
import { DepartmentRepository } from './department-repository';

export interface DepartmentDto {
  readonly id: string;
  readonly name: string;
  readonly branch: {
    readonly id: string;
    readonly name: string;
  } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const toDto = (record: DepartmentRecord): DepartmentDto => ({
  id: record.id,
  name: record.name,
  branch: record.branch,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class DepartmentService {
  constructor(private readonly repository: DepartmentRepository) {}

  async create(input: DepartmentWriteInput): Promise<DepartmentDto> {
    try {
      const record = await this.repository.create(input);

      return toDto(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw AppError.notFound('Branch not found');
      }

      throw error;
    }
  }

  async getById(id: string): Promise<DepartmentDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Department not found');
    }

    return toDto(record);
  }

  async update(
    id: string,
    input: DepartmentUpdateInput,
  ): Promise<DepartmentDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Department not found');
    }

    return toDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Department not found');
    }
  }

  async list(args: DepartmentListArgs): Promise<Paginated<DepartmentDto>> {
    const result = await this.repository.list(args);

    return { ...result, items: result.items.map(toDto) };
  }
}