const feeService = require('../services/feeService');
const { successResponse } = require('../utils/response');

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const getFeeStructures = async (req, res, next) => {
  try {
    const { classId, academicYear } = req.query;
    const structures = await feeService.getAllFeeStructures({ classId, academicYear });
    return successResponse(res, { feeStructures: structures });
  } catch (err) {
    next(err);
  }
};

const createFeeStructure = async (req, res, next) => {
  try {
    const structure = await feeService.createFeeStructure(req.body, req.user, getClientIp(req));
    return successResponse(res, { feeStructure: structure }, 'Fee structure created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const generateInvoices = async (req, res, next) => {
  try {
    const result = await feeService.generateInvoices(req.body, req.user, getClientIp(req));
    return successResponse(res, result, 'Invoices generated successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const { classId, studentId, status, page, limit } = req.query;
    const result = await feeService.getAllInvoices({ classId, studentId, status, page, limit });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const invoice = await feeService.getInvoiceById(id);
    return successResponse(res, { invoice });
  } catch (err) {
    next(err);
  }
};

const recordPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await feeService.recordPayment(id, req.body, req.user, getClientIp(req));
    return successResponse(res, result, 'Payment recorded successfully');
  } catch (err) {
    next(err);
  }
};

const getLedgerReconciliation = async (req, res, next) => {
  try {
    const result = await feeService.getLedgerReconciliation();
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  generateInvoices,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getLedgerReconciliation,
};
