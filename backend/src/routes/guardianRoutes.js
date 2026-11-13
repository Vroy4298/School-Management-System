const express = require('express');
const router = express.Router();
const guardianController = require('../controllers/guardianController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('GUARDIAN'));

// Students linked to logged in guardian
router.get('/my-students', guardianController.getMyStudents);

// Specific student details (with strict ownership check)
router.get('/students/:studentId', guardianController.getStudentProfile);
router.get('/students/:studentId/attendance', guardianController.getStudentAttendance);
router.get('/students/:studentId/exams', guardianController.getStudentExams);
router.get('/students/:studentId/fees', guardianController.getStudentFees);

// Pay invoice for linked student (with ownership check)
router.post('/invoices/:invoiceId/pay', guardianController.payInvoice);

module.exports = router;
