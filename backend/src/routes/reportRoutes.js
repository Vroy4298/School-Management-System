const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard-overview', reportController.getDashboardOverview);
router.get('/class-attendance', reportController.getClassWiseAttendance);
router.get('/exam-performance/:examinationId', reportController.getExamPerformance);

module.exports = router;
