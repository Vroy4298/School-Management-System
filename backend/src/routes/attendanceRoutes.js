const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Attendance taking and marking (Admin and Teacher)
router.get('/class-students', authorize('ADMIN', 'TEACHER'), attendanceController.getClassStudents);
router.post('/submit', authorize('ADMIN', 'TEACHER'), attendanceController.submitAttendance);

// Attendance history and summaries
router.get('/records', authorize('ADMIN', 'TEACHER'), attendanceController.getRecords);
router.get('/student/:studentId/summary', authorize('ADMIN', 'TEACHER'), attendanceController.getStudentSummary);

module.exports = router;
