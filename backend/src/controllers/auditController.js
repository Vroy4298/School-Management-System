const { getAuditLogs } = require('../services/auditService');
const { successResponse } = require('../utils/response');

const getLogs = async (req, res, next) => {
  try {
    const { page, limit, entity, action, userId } = req.query;
    const result = await getAuditLogs({ page, limit, entity, action, userId });
    return successResponse(res, result, 'Audit logs retrieved successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLogs,
};
