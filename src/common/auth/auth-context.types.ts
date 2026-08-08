import type { Permission, Role } from '../rbac/rbac.types';

export interface AuthContext {
  readonly employeeId: string;
  readonly telegramId: string;
  readonly role: Role;
  readonly permissions: ReadonlyArray<Permission>;
  readonly branchId: string | null;
  readonly departmentId: string | null;
}