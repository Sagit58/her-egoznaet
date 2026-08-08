import type { Role } from '../../common/rbac/rbac.types';
import { prisma } from '../../database/prisma-client';

export interface EmployeeAuthRecord {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly telegramId: bigint | null;
  readonly role: Role;
  readonly branchId: string | null;
  readonly departmentId: string | null;
}

const employeeSelect = {
  id: true,
  firstName: true,
  lastName: true,
  telegramId: true,
  role: true,
  branchId: true,
  departmentId: true,
} as const;

export class EmployeeAuthRepository {
  async findActiveByTelegramId(
    telegramId: bigint,
  ): Promise<EmployeeAuthRecord | null> {
    return prisma.employee.findFirst({
      where: { telegramId, isActive: true, deletedAt: null },
      select: employeeSelect,
    });
  }

  async findActiveById(id: string): Promise<EmployeeAuthRecord | null> {
    return prisma.employee.findFirst({
      where: { id, isActive: true, deletedAt: null },
      select: employeeSelect,
    });
  }

  async upsertSuperAdmin(id: string): Promise<EmployeeAuthRecord> {
    return prisma.employee.upsert({
      where: { id },
      update: {
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMINISTRATOR',
        isActive: true,
        deletedAt: null,
      },
      create: {
        id,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMINISTRATOR',
        isActive: true,
      },
      select: employeeSelect,
    });
  }
}
