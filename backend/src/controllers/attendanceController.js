const attendanceService = require('../services/attendanceService');
const { successResponse } = require('../utils/response');

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const getClassStudents = async (req, res, next) => {
  try {
    const { classId, sectionId, date, session } = req.query;
    if (!classId || !sectionId) {
      return res.status(400).json({ success: false, message: 'classId and sectionId query parameters are required' });
    }

    const result = await attendanceService.getClassStudentsForAttendance({
      classId,
      sectionId,
      date: date || new Date().toISOString(),
      session: session || 'FULL_DAY',
      reqUser: req.user,
    });

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const submitAttendance = async (req, res, next) => {
  try {
    const { classId, sectionId, date, session, records } = req.body;
    if (!classId || !sectionId || !records) {
      return res.status(400).json({
        success: false,
        message: 'classId, sectionId, date and records array are required',
      });
    }

    const result = await attendanceService.submitAttendance({
      classId,
      sectionId,
      date: date || new Date().toISOString(),
      session: session || 'FULL_DAY',
      records,
      reqUser: req.user,
      ipAddress: getClientIp(req),
    });

    return successResponse(res, result, 'Attendance recorded successfully', 200);
  } catch (err) {
    next(err);
  }
};

const getRecords = async (req, res, next) => {
  try {
    const { classId, sectionId, studentId, date, startDate, endDate, session, page, limit } = req.query;
    const result = await attendanceService.getAttendanceRecords({
      classId,
      sectionId,
      studentId,
      date,
      startDate,
      endDate,
      session,
      page,
      limit,
    });

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getStudentSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const result = await attendanceService.getStudentAttendanceSummary(studentId);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClassStudents,
  submitAttendance,
  getRecords,
  getStudentSummary,
};

