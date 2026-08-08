"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIONS = exports.RESOURCES = exports.ROLES = void 0;
exports.ROLES = [
    'ADMINISTRATOR',
    'DIRECTOR',
    'MANAGER',
    'SURVEYOR',
    'DESIGNER',
    'PRODUCTION',
    'INSTALLER',
    'WAREHOUSE',
    'ACCOUNTANT',
];
exports.RESOURCES = [
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
];
exports.ACTIONS = [
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
];
//# sourceMappingURL=rbac.types.js.map