const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Classes & Sections
router.get('/classes', academicController.getClasses);
router.post('/classes', authorize('ADMIN'), academicController.createClass);
router.post('/classes/:classId/sections', authorize('ADMIN'), academicController.createSection);
router.delete('/classes/:classId', authorize('ADMIN'), academicController.deleteClass);

// Subjects
router.get('/subjects', academicController.getSubjects);
router.post('/subjects', authorize('ADMIN'), academicController.createSubject);
router.put('/subjects/:id', authorize('ADMIN'), academicController.updateSubject);
router.delete('/subjects/:id', authorize('ADMIN'), academicController.deleteSubject);

// Teachers
router.get('/teachers/my-assignments', authorize('TEACHER'), academicController.getMyTeacherAssignments);
router.get('/teachers', authorize('ADMIN'), academicController.getTeachers);
router.post('/teachers', authorize('ADMIN'), academicController.createTeacher);
router.put('/teachers/:id', authorize('ADMIN'), academicController.updateTeacher);
router.delete('/teachers/:id', authorize('ADMIN'), academicController.deleteTeacher);
router.post('/teachers/assign', authorize('ADMIN'), academicController.assignTeacher);
router.delete('/teachers/assign/:assignmentId', authorize('ADMIN'), academicController.removeTeacherAssignment);

// Guardians
router.get('/guardians', authorize('ADMIN'), academicController.getGuardians);
router.post('/guardians', authorize('ADMIN'), academicController.createGuardian);

// Students
router.get('/students', authorize('ADMIN', 'TEACHER'), academicController.getStudents);
router.get('/students/:id', authorize('ADMIN', 'TEACHER'), academicController.getStudentById);
router.post('/students', authorize('ADMIN'), academicController.createStudent);
router.put('/students/:id', authorize('ADMIN'), academicController.updateStudent);
router.delete('/students/:id', authorize('ADMIN'), academicController.deleteStudent);

module.exports = router;

