const prisma = require('../config/prisma');
const feeService = require('./feeService');
const attendanceService = require('./attendanceService');
const examService = require('./examService');

/**
 * Verify guardian owns the requested student record
 */
const verifyOwnership = async (userId, studentId) => {
  const guardian = await prisma.guardian.findUnique({
    where: { userId },
  });

  if (!guardian) {
    const error = new Error('Guardian profile not found for authenticated user');
    error.statusCode = 403;
    throw error;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      section: true,
      guardian: true,
    },
  });

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  // CRITICAL SECURITY CHECK: Check guardianId
  if (student.guardianId !== guardian.id) {
    const error = new Error('Access denied: You are not authorized to view or manage records for this student.');
    error.statusCode = 403;
    throw error;
  }

  return { guardian, student };
};

/**
 * Get all students linked to the authenticated guardian
 */
const getMyStudents = async (userId) => {
  const guardian = await prisma.guardian.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          class: true,
          section: true,
        },
      },
    },
  });

  if (!guardian) {
    const error = new Error('Guardian profile not found');
    error.statusCode = 404;
    throw error;
  }

  return guardian.students;
};

/**
 * Get single student profile with ownership check
 */
const getStudentProfile = async (userId, studentId) => {
  const { student } = await verifyOwnership(userId, studentId);
  return student;
};

/**
 * Get student attendance records with ownership check
 */
const getStudentAttendance = async (userId, studentId) => {
  await verifyOwnership(userId, studentId);
  return await attendanceService.getStudentAttendanceSummary(studentId);
};

/**
 * Get student exam results and report cards with ownership check
 */
const getStudentExams = async (userId, studentId) => {
  const { student } = await verifyOwnership(userId, studentId);

  // Find all exams conducted for the student's class
  const examinations = await prisma.examination.findMany({
    where: { classId: student.classId },
    orderBy: { startDate: 'desc' },
  });

  // Calculate report card for each exam
  const reportCards = await Promise.all(
    examinations.map(async (exam) => {
      try {
        return await examService.calculateReportCard(exam.id, studentId);
      } catch (err) {
        return null;
      }
    })
  );

  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class?.name,
      section: student.section?.name,
    },
    examinations: reportCards.filter(Boolean),
  };
};

/**
 * Get student fee invoices with ownership check
 */
const getStudentFees = async (userId, studentId) => {
  await verifyOwnership(userId, studentId);

  const invoices = await prisma.feeInvoice.findMany({
    where: { studentId },
    orderBy: { dueDate: 'asc' },
    include: {
      feeStructure: true,
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
    },
  });

  let totalInvoiced = 0;
  let totalPaid = 0;

  const enrichedInvoices = invoices.map((inv) => {
    const paidForInvoice = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, inv.amount - paidForInvoice);
    totalInvoiced += inv.amount;
    totalPaid += paidForInvoice;

    return {
      ...inv,
      totalPaid: Number(paidForInvoice.toFixed(2)),
      outstandingBalance: Number(balance.toFixed(2)),
    };
  });

  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  return {
    summary: {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
    },
    invoices: enrichedInvoices,
  };
};

/**
 * Guardian pays an invoice with ownership check
 */
const payStudentInvoice = async (userId, invoiceId, paymentData, reqUser, ipAddress) => {
  const guardian = await prisma.guardian.findUnique({
    where: { userId },
  });

  if (!guardian) {
    const error = new Error('Guardian profile not found');
    error.statusCode = 403;
    throw error;
  }

  const invoice = await prisma.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: { student: true },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify invoice's student belongs to guardian
  if (invoice.student.guardianId !== guardian.id) {
    const error = new Error('Access denied: You are not authorized to pay an invoice for another student.');
    error.statusCode = 403;
    throw error;
  }

  return await feeService.recordPayment(invoiceId, paymentData, reqUser, ipAddress);
};

module.exports = {
  verifyOwnership,
  getMyStudents,
  getStudentProfile,
  getStudentAttendance,
  getStudentExams,
  getStudentFees,
  payStudentInvoice,
};

