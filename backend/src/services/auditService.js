const prisma = require('../config/prisma');

/**
 * Service to record system audit logs
 */
const logAudit = async ({
  userId = null,
  userRole = null,
  action,
  entity,
  entityId = null,
  details = null,
  ipAddress = null,
}) => {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        userRole,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        details: details || {},
        ipAddress,
      },
    });
  } catch (err) {
    // Audit logging should never crash the main transaction, but should log error
    console.error('Failed to write audit log:', err.message);
    return null;
  }
};

const getAuditLogs = async ({ page = 1, limit = 20, entity, action, userId }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (entity) where.entity = entity;
  if (action) where.action = action;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

module.exports = {
  logAudit,
  getAuditLogs,
};
