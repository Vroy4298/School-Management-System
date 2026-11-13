const academicService = require('../services/academicService');
const { successResponse } = require('../utils/response');

const getClientIp = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// Classes & Sections
const getClasses = async (req, res, next) => {
  try {
    const classes = await academicService.getAllClasses();
    return successResponse(res, { classes });
  } catch (err) {
    next(err);
  }
};

const createClass = async (req, res, next) => {
  try {
    const newClass = await academicService.createClass(req.body, req.user, getClientIp(req));
    return successResponse(res, { class: newClass }, 'Class created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const createSection = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { name } = req.body;
    const section = await academicService.createSection(classId, name, req.user, getClientIp(req));
    return successResponse(res, { section }, 'Section created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const deleteClass = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const deleted = await academicService.deleteClass(classId, req.user, getClientIp(req));
    return successResponse(res, { class: deleted }, 'Class deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Subjects
const getSubjects = async (req, res, next) => {
  try {
    const subjects = await academicService.getAllSubjects();
    return successResponse(res, { subjects });
  } catch (err) {
    next(err);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const subject = await academicService.createSubject(req.body, req.user, getClientIp(req));
    return successResponse(res, { subject }, 'Subject created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await academicService.updateSubject(id, req.body, req.user, getClientIp(req));
    return successResponse(res, { subject }, 'Subject updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await academicService.deleteSubject(id, req.user, getClientIp(req));
    return successResponse(res, { subject: deleted }, 'Subject deleted successfully');
  } catch (err) {
    next(err);
  }
};

// Teachers
const getTeachers = async (req, res, next) => {
  try {
    const teachers = await academicService.getAllTeachers();
    return successResponse(res, { teachers });
  } catch (err) {
    next(err);
  }
};

const createTeacher = async (req, res, next) => {
  try {
    const teacher = await academicService.createTeacher(req.body, req.user, getClientIp(req));
    return successResponse(res, { teacher }, 'Teacher created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const teacher = await academicService.updateTeacher(id, req.body, req.user, getClientIp(req));
    return successResponse(res, { teacher }, 'Teacher updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await academicService.deleteTeacher(id, req.user, getClientIp(req));
    return successResponse(res, { teacher: deleted }, 'Teacher deleted successfully');
  } catch (err) {
    next(err);
  }
};

const assignTeacher = async (req, res, next) => {
  try {
    const assignment = await academicService.assignTeacher(req.body, req.user, getClientIp(req));
    return successResponse(res, { assignment }, 'Teacher assigned successfully', 201);
  } catch (err) {
    next(err);
  }
};

const removeTeacherAssignment = async (req, res, next) => {
  try {
    const { assignmentId } = req.params;
    const removed = await academicService.removeTeacherAssignment(assignmentId, req.user, getClientIp(req));
    return successResponse(res, { assignment: removed }, 'Teacher assignment removed successfully');
  } catch (err) {
    next(err);
  }
};

const getMyTeacherAssignments = async (req, res, next) => {
  try {
    const teacherId = req.user.teacherProfile?.id;
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found for user' });
    }
    const assignments = await academicService.getTeacherAssignments(teacherId);
    return successResponse(res, { assignments });
  } catch (err) {
    next(err);
  }
};

// Guardians
const getGuardians = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await academicService.getAllGuardians({ search, page, limit });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const createGuardian = async (req, res, next) => {
  try {
    const guardian = await academicService.createGuardian(req.body, req.user, getClientIp(req));
    return successResponse(res, { guardian }, 'Guardian created successfully', 201);
  } catch (err) {
    next(err);
  }
};

// Students
const getStudents = async (req, res, next) => {
  try {
    const { search, classId, sectionId, page, limit } = req.query;
    const result = await academicService.getAllStudents({ search, classId, sectionId, page, limit });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await academicService.getStudentById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    return successResponse(res, { student });
  } catch (err) {
    next(err);
  }
};

const createStudent = async (req, res, next) => {
  try {
    const student = await academicService.createStudent(req.body, req.user, getClientIp(req));
    return successResponse(res, { student }, 'Student created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await academicService.updateStudent(id, req.body, req.user, getClientIp(req));
    return successResponse(res, { student }, 'Student updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await academicService.deleteStudent(id, req.user, getClientIp(req));
    return successResponse(res, { student: deleted }, 'Student deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getClasses,
  createClass,
  createSection,
  deleteClass,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignTeacher,
  removeTeacherAssignment,
  getMyTeacherAssignments,
  getGuardians,
  createGuardian,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};

