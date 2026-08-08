"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginated = exports.normalizePage = void 0;
const normalizePage = (page, pageSize) => {
    const safePage = page !== undefined && page > 0 ? page : 1;
    const safeSize = pageSize !== undefined && pageSize > 0 ? Math.min(pageSize, 100) : 20;
    return {
        page: safePage,
        pageSize: safeSize,
        skip: (safePage - 1) * safeSize,
        take: safeSize,
    };
};
exports.normalizePage = normalizePage;
const buildPaginated = (items, total, page) => ({
    items,
    page: page.page,
    pageSize: page.pageSize,
    total,
    totalPages: Math.ceil(total / page.pageSize),
});
exports.buildPaginated = buildPaginated;
//# sourceMappingURL=pagination.js.map