const examService = require('../services/examService');
const { successResponse } = require('../utils/response');

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

const getExaminations = async (req, res, next) => {
  try {
    const { classId, academicYear } = req.query;
    const exams = await examService.getAllExaminations({ classId, academicYear });
    return successResponse(res, { examinations: exams });
  } catch (err) {
    next(err);
  }
};

const getExaminationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await examService.getExaminationById(id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }
    return successResponse(res, { examination: exam });
  } catch (err) {
    next(err);
  }
};

const createExamination = async (req, res, next) => {
  try {
    const exam = await examService.createExamination(req.body, req.user, getClientIp(req));
    return successResponse(res, { examination: exam }, 'Examination created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const addSubjectToExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const examSubject = await examService.addSubjectToExam(id, req.body, req.user, getClientIp(req));
    return successResponse(res, { examSubject }, 'Subject added to examination', 201);
  } catch (err) {
    next(err);
  }
};

const getGradingRules = async (req, res, next) => {
  try {
    const rules = await examService.getGradingRules();
    return successResponse(res, { gradingRules: rules });
  } catch (err) {
    next(err);
  }
};

const saveGradingRule = async (req, res, next) => {
  try {
    const rule = await examService.createOrUpdateGradingRule(req.body, req.user, getClientIp(req));
    return successResponse(res, { gradingRule: rule }, 'Grading rule saved successfully');
  } catch (err) {
    next(err);
  }
};

const getStudentsForMarksEntry = async (req, res, next) => {
  try {
    const { id, examSubjectId } = req.params;
    const { sectionId } = req.query;
    const data = await examService.getStudentsForMarksEntry(id, examSubjectId, sectionId, req.user);
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
};

const enterMarks = async (req, res, next) => {
  try {
    const { id, examSubjectId } = req.params;
    const { marksList } = req.body;
    const result = await examService.enterMarks(
      { examinationId: id, examSubjectId, marksList },
      req.user,
      getClientIp(req)
    );
    return successResponse(res, result, 'Marks saved successfully');
  } catch (err) {
    next(err);
  }
};

const getReportCard = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const reportCard = await examService.calculateReportCard(id, studentId);
    return successResponse(res, { reportCard });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExaminations,
  getExaminationById,
  createExamination,
  addSubjectToExam,
  getGradingRules,
  saveGradingRule,
  getStudentsForMarksEntry,
  enterMarks,
  getReportCard,
};
