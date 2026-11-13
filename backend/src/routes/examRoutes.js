const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Grading rules
router.get('/grading/rules', examController.getGradingRules);
router.post('/grading/rules', authorize('ADMIN'), examController.saveGradingRule);

// Examinations
router.get('/', examController.getExaminations);
router.get('/:id', examController.getExaminationById);
router.post('/', authorize('ADMIN'), examController.createExamination);
router.post('/:id/subjects', authorize('ADMIN'), examController.addSubjectToExam);

// Marks entry
router.get('/:id/subjects/:examSubjectId/students', authorize('ADMIN', 'TEACHER'), examController.getStudentsForMarksEntry);
router.post('/:id/subjects/:examSubjectId/marks', authorize('ADMIN', 'TEACHER'), examController.enterMarks);

// Report Cards
router.get('/:id/students/:studentId/report-card', authorize('ADMIN', 'TEACHER'), examController.getReportCard);

module.exports = router;

