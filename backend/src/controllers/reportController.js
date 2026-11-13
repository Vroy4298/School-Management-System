const reportService = require('../services/reportService');
const { successResponse } = require('../utils/response');

const getDashboardOverview = async (req, res, next) => {
  try {
    const data = await reportService.getDashboardOverview();
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const getClassWiseAttendance = async (req, res, next) => {
  try {
    const { date } = req.query;
    const data = await reportService.getClassWiseAttendanceReport(date);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const getExamPerformance = async (req, res, next) => {
  try {
    const { examinationId } = req.params;
    const data = await reportService.getExamPerformanceReport(examinationId);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardOverview,
  getClassWiseAttendance,
  getExamPerformance,
};
