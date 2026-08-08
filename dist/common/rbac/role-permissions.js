"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
const rbac_types_1 = require("./rbac.types");
const perms = (resources, actions) => resources.flatMap((resource) => actions.map((action) => `${resource}.${action}`));
const READ_LIST = ['read', 'list', 'search'];
exports.ROLE_PERMISSIONS = {
    ADMINISTRATOR: perms(rbac_types_1.RESOURCES, rbac_types_1.ACTIONS),
    DIRECTOR: [
        ...perms(rbac_types_1.RESOURCES, READ_LIST),
        ...perms(['order'], ['create', 'update', 'change-status', 'approve']),
        ...perms(['design'], ['approve', 'reject']),
    ],
    MANAGER: [
        ...perms(['customer', 'grave-site', 'burial'], [
            'create', 'read', 'update', 'delete', 'list', 'search',
        ]),
        ...perms(['order'], ['create', 'read', 'update', 'list', 'search', 'change-status']),
        ...perms(['payment'], ['create', 'read', 'list']),
        ...perms(['file'], ['upload', 'download', 'read', 'list']),
        ...perms(['design', 'production', 'installation', 'employee'], ['read', 'list']),
    ],
    SURVEYOR: [
        ...perms(['grave-site'], ['read', 'update', 'list', 'search']),
        ...perms(['burial'], ['create', 'read', 'update', 'list']),
        ...perms(['order'], ['read', 'list', 'change-status']),
        ...perms(['file'], ['upload', 'read', 'list']),
    ],
    DESIGNER: [
        ...perms(['design'], ['create', 'read', 'update', 'list']),
        ...perms(['file'], ['upload', 'download', 'read', 'list']),
        ...perms(['order'], ['read', 'list', 'change-status']),
    ],
    PRODUCTION: [
        ...perms(['production'], ['create', 'read', 'update', 'list']),
        ...perms(['order'], ['read', 'list', 'change-status']),
        ...perms(['file'], ['upload', 'read', 'list']),
    ],
    INSTALLER: [
        ...perms(['installation'], ['create', 'read', 'update', 'list']),
        ...perms(['order'], ['read', 'list', 'change-status']),
        ...perms(['file'], ['upload', 'download', 'read', 'list']),
    ],
    WAREHOUSE: [
        ...perms(['production'], ['read', 'list']),
        ...perms(['order'], ['read', 'list']),
        ...perms(['file'], ['read', 'list']),
    ],
    ACCOUNTANT: [
        ...perms(['payment'], ['create', 'read', 'list']),
        ...perms(['order', 'customer'], ['read', 'list']),
        ...perms(['file'], ['read', 'list', 'download']),
    ],
};
//# sourceMappingURL=role-permissions.js.map