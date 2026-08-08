"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
const node_crypto_1 = require("node:crypto");
const prisma_client_1 = require("../../database/prisma-client");
class SessionRepository {
    static hashToken(token) {
        return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async create(args) {
        await prisma_client_1.prisma.employeeSession.create({
            data: {
                id: args.id,
                employeeId: args.employeeId,
                refreshTokenHash: SessionRepository.hashToken(args.refreshToken),
                expiresAt: args.expiresAt,
            },
        });
    }
    async findActiveById(id) {
        return prisma_client_1.prisma.employeeSession.findFirst({
            where: { id, revokedAt: null },
            select: {
                id: true,
                employeeId: true,
                refreshTokenHash: true,
                expiresAt: true,
            },
        });
    }
    async revoke(id) {
        await prisma_client_1.prisma.employeeSession.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }
}
exports.SessionRepository = SessionRepository;
//# sourceMappingURL=session-repository.js.map