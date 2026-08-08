export const ROLES = [
  'ADMINISTRATOR',
  'DIRECTOR',
  'MANAGER',
  'SURVEYOR',
  'DESIGNER',
  'PRODUCTION',
  'INSTALLER',
  'WAREHOUSE',
  'ACCOUNTANT',
] as const;

export type Role = (typeof ROLES)[number];

export const RESOURCES = [
  'auth',
  'employee',
  'department',
  'branch',
  'session',
  'customer',
  'grave-site',
  'burial',
  'order',
  'design',
  'production',
  'installation',
  'payment',
  'file',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'list',
  'search',
  'approve',
  'reject',
  'assign',
  'change-status',
  'upload',
  'download',
  'revoke',
] as const;

export type Action = (typeof ACTIONS)[number];

export type Permission = `${Resource}.${Action}`;