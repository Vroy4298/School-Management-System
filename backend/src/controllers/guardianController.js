const guardianService = require('../services/guardianService');
const { successResponse } = require('../utils/response');

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const getMyStudents = async (req, res, next) => {
  try {
    const students = await guardianService.getMyStudents(req.user.id);
    return successResponse(res, { students });
  } catch (err) {
    next(err);
  }
};

const getStudentProfile = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await guardianService.getStudentProfile(req.user.id, studentId);
    return successResponse(res, { student });
  } catch (err) {
    next(err);
  }
};

const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const attendance = await guardianService.getStudentAttendance(req.user.id, studentId);
    return successResponse(res, attendance);
  } catch (err) {
    next(err);
  }
};

const getStudentExams = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const exams = await guardianService.getStudentExams(req.user.id, studentId);
    return successResponse(res, exams);
  } catch (err) {
    next(err);
  }
};

const getStudentFees = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const fees = await guardianService.getStudentFees(req.user.id, studentId);
    return successResponse(res, fees);
  } catch (err) {
    next(err);
  }
};

const payInvoice = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const result = await guardianService.payStudentInvoice(
      req.user.id,
      invoiceId,
      req.body,
      req.user,
      getClientIp(req)
    );
    return successResponse(res, result, 'Fee payment processed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyStudents,
  getStudentProfile,
  getStudentAttendance,
  getStudentExams,
  getStudentFees,
  payInvoice,
};

