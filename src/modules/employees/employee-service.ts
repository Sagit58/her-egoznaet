import { Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { Paginated } from '../../common/pagination/pagination.types';
import type { Role } from '../../common/rbac/rbac.types';
import type {
  EmployeeListArgs,
  EmployeeRecord,
  EmployeeUpdateInput,
  EmployeeWriteInput,
} from './employee-repository';
import { EmployeeRepository } from './employee-repository';

export interface EmployeeDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly middleName: string | null;
  readonly telegramId: string | null;
  readonly phone: string | null;
  readonly role: Role;
  readonly branchId: string | null;
  readonly departmentId: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const toEmployeeDto = (record: EmployeeRecord): EmployeeDto => ({
  id: record.id,
  firstName: record.firstName,
  lastName: record.lastName,
  middleName: record.middleName,
  telegramId: record.telegramId?.toString() ?? null,
  phone: record.phone,
  role: record.role,
  branchId: record.branchId,
  departmentId: record.departmentId,
  isActive: record.isActive,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class EmployeeService {
  constructor(private readonly repository: EmployeeRepository) {}

  async create(input: EmployeeWriteInput): Promise<EmployeeDto> {
    try {
      const record = await this.repository.create(input);

      return toEmployeeDto(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw AppError.conflict(
          'Employee with this Telegram ID already exists',
        );
      }

      throw error;
    }
  }

  async update(
    id: string,
    input: EmployeeUpdateInput,
  ): Promise<EmployeeDto> {
    const record = await this.repository.update(id, input);

    if (!record) {
      throw AppError.notFound('Employee not found');
    }

    return toEmployeeDto(record);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.softDelete(id);

    if (!deleted) {
      throw AppError.notFound('Employee not found');
    }
  }

  async getById(id: string): Promise<EmployeeDto> {
    const record = await this.repository.findById(id);

    if (!record) {
      throw AppError.notFound('Employee not found');
    }

    return toEmployeeDto(record);
  }

  async list(args: EmployeeListArgs): Promise<Paginated<EmployeeDto>> {
    const result = await this.repository.list(args);

    return {
      ...result,
      items: result.items.map(toEmployeeDto),
    };
  }
}