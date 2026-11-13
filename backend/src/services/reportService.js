const prisma = require('../config/prisma');

const getDashboardOverview = async () => {
  // 1. Basic counts
  const [totalStudents, totalTeachers, totalClasses, totalSubjects] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.subject.count(),
  ]);

  // 2. Attendance stats (Today / latest date recorded)
  const today = new Date();
  const todayNormalized = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  let todayRecords = await prisma.attendance.findMany({
    where: { date: todayNormalized },
  });

  // If no attendance marked for today yet, fetch the most recent date's attendance
  let attendanceDateUsed = todayNormalized;
  if (todayRecords.length === 0) {
    const latestRecord = await prisma.attendance.findFirst({
      orderBy: { date: 'desc' },
    });
    if (latestRecord) {
      attendanceDateUsed = latestRecord.date;
      todayRecords = await prisma.attendance.findMany({
        where: { date: latestRecord.date },
      });
    }
  }

  const attendanceTotal = todayRecords.length;
  const attendancePresent = todayRecords.filter((r) => r.status === 'PRESENT').length;
  const attendanceAbsent = todayRecords.filter((r) => r.status === 'ABSENT').length;
  const attendanceLate = todayRecords.filter((r) => r.status === 'LATE').length;
  const attendancePercentage = attendanceTotal > 0
    ? Number(((attendancePresent / attendanceTotal) * 100).toFixed(2))
    : 100.0;

  // 3. Fee metrics
  const [allInvoices, allPayments] = await Promise.all([
    prisma.feeInvoice.findMany({ select: { amount: true } }),
    prisma.feePayment.findMany({ select: { amount: true } }),
  ]);

  const totalInvoiced = Number(allInvoices.reduce((sum, inv) => sum + inv.amount, 0).toFixed(2));
  const totalFeesCollected = Number(allPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  const totalFeesOutstanding = Number(Math.max(0, totalInvoiced - totalFeesCollected).toFixed(2));

  // 4. Recent audit activity
  const recentActivities = await prisma.auditLog.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, role: true },
      },
    },
  });

  return {
    metrics: {
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSubjects,
      attendance: {
        date: attendanceDateUsed,
        totalMarked: attendanceTotal,
        present: attendancePresent,
        absent: attendanceAbsent,
        late: attendanceLate,
        attendancePercentage,
      },
      fees: {
        totalInvoiced,
        totalFeesCollected,
        totalFeesOutstanding,
        collectionRate: totalInvoiced > 0
          ? Number(((totalFeesCollected / totalInvoiced) * 100).toFixed(2))
          : 0,
      },
    },
    recentActivities,
  };
};

const getClassWiseAttendanceReport = async (date) => {
  let targetDate;
  if (date) {
    const d = new Date(date);
    targetDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  } else {
    const latestRecord = await prisma.attendance.findFirst({ orderBy: { date: 'desc' } });
    targetDate = latestRecord ? latestRecord.date : new Date();
  }

  const classes = await prisma.class.findMany({
    include: {
      sections: {
        include: {
          students: true,
          attendanceRecords: {
            where: { date: targetDate },
          },
        },
      },
    },
    orderBy: { numericGrade: 'asc' },
  });

  const report = [];

  for (const cls of classes) {
    for (const sec of cls.sections) {
      const totalEnrolled = sec.students.length;
      const records = sec.attendanceRecords;
      const marked = records.length;
      const present = records.filter((r) => r.status === 'PRESENT').length;
      const absent = records.filter((r) => r.status === 'ABSENT').length;
      const late = records.filter((r) => r.status === 'LATE').length;
      const rate = marked > 0 ? Number(((present / marked) * 100).toFixed(2)) : 0;

      report.push({
        classId: cls.id,
        className: cls.name,
        sectionId: sec.id,
        sectionName: sec.name,
        totalEnrolled,
        totalMarked: marked,
        present,
        absent,
        late,
        attendanceRate: rate,
      });
    }
  }

  return {
    date: targetDate,
    classReports: report,
  };
};

const getExamPerformanceReport = async (examinationId) => {
  const exam = await prisma.examination.findUnique({
    where: { id: examinationId },
    include: {
      class: true,
      examSubjects: {
        include: {
          subject: true,
          examResults: true,
        },
      },
    },
  });

  if (!exam) {
    const error = new Error('Examination not found');
    error.statusCode = 404;
    throw error;
  }

  const subjectPerformance = exam.examSubjects.map((es) => {
    const results = es.examResults;
    const appeared = results.length;
    const passed = results.filter((r) => !r.isAbsent && r.marksObtained >= es.passingMarks).length;
    const failed = appeared - passed;
    const marks = results.filter((r) => !r.isAbsent).map((r) => r.marksObtained);
    const avgMarks = marks.length > 0 ? Number((marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2)) : 0;
    const highestMark = marks.length > 0 ? Math.max(...marks) : 0;
    const lowestMark = marks.length > 0 ? Math.min(...marks) : 0;

    return {
      subjectId: es.subject.id,
      subjectName: es.subject.name,
      subjectCode: es.subject.code,
      maxMarks: es.maxMarks,
      passingMarks: es.passingMarks,
      studentsAppeared: appeared,
      studentsPassed: passed,
      studentsFailed: failed,
      passPercentage: appeared > 0 ? Number(((passed / appeared) * 100).toFixed(2)) : 0,
      averageMarks: avgMarks,
      highestMark,
      lowestMark,
    };
  });

  return {
    examination: {
      id: exam.id,
      name: exam.name,
      academicYear: exam.academicYear,
      className: exam.class.name,
    },
    subjectPerformance,
  };
};

module.exports = {
  getDashboardOverview,
  getClassWiseAttendanceReport,
  getExamPerformanceReport,
};
