const prisma = require('../config/prisma');
const { logAudit } = require('./auditService');

// ==========================================
// EXAMINATIONS & SUBJECT CONFIGURATION
// ==========================================

const getAllExaminations = async ({ classId, academicYear }) => {
  const where = {};
  if (classId) where.classId = classId;
  if (academicYear) where.academicYear = academicYear;

  return await prisma.examination.findMany({
    where,
    orderBy: { startDate: 'desc' },
    include: {
      class: true,
      examSubjects: {
        include: {
          subject: true,
        },
      },
      _count: {
        select: {
          examResults: true,
        },
      },
    },
  });
};

const getExaminationById = async (id) => {
  return await prisma.examination.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          sections: true,
        },
      },
      examSubjects: {
        include: {
          subject: true,
        },
      },
    },
  });
};

const createExamination = async ({ name, academicYear = '2026-2027', term, classId, startDate, endDate, subjects = [] }, reqUser, ipAddress) => {
  const exam = await prisma.$transaction(async (tx) => {
    const newExam = await tx.examination.create({
      data: {
        name,
        academicYear,
        term,
        classId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });

    if (subjects.length > 0) {
      await tx.examSubject.createMany({
        data: subjects.map((s) => ({
          examinationId: newExam.id,
          subjectId: s.subjectId,
          maxMarks: Number(s.maxMarks) || 100,
          passingMarks: Number(s.passingMarks) || 40,
          examDate: s.examDate ? new Date(s.examDate) : null,
        })),
      });
    }

    return newExam;
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_EXAMINATION',
    entity: 'Examination',
    entityId: exam.id,
    details: { name: exam.name, classId, term, academicYear },
    ipAddress,
  });

  return await getExaminationById(exam.id);
};

const addSubjectToExam = async (examinationId, { subjectId, maxMarks = 100, passingMarks = 40, examDate }, reqUser, ipAddress) => {
  const examSubject = await prisma.examSubject.create({
    data: {
      examinationId,
      subjectId,
      maxMarks: Number(maxMarks),
      passingMarks: Number(passingMarks),
      examDate: examDate ? new Date(examDate) : null,
    },
    include: { subject: true },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'ADD_EXAM_SUBJECT',
    entity: 'ExamSubject',
    entityId: examSubject.id,
    details: { examinationId, subjectId, maxMarks, passingMarks },
    ipAddress,
  });

  return examSubject;
};

// ==========================================
// GRADING RULES
// ==========================================

const getGradingRules = async () => {
  return await prisma.gradingRule.findMany({
    orderBy: { minPercentage: 'desc' },
  });
};

const createOrUpdateGradingRule = async ({ grade, minPercentage, maxPercentage, gradePoint, description, isPassing = true }, reqUser, ipAddress) => {
  const rule = await prisma.gradingRule.upsert({
    where: { grade },
    update: {
      minPercentage: Number(minPercentage),
      maxPercentage: Number(maxPercentage),
      gradePoint: Number(gradePoint),
      description,
      isPassing,
    },
    create: {
      grade,
      minPercentage: Number(minPercentage),
      maxPercentage: Number(maxPercentage),
      gradePoint: Number(gradePoint),
      description,
      isPassing,
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'SAVE_GRADING_RULE',
    entity: 'GradingRule',
    entityId: rule.id,
    details: { grade, minPercentage, maxPercentage, gradePoint },
    ipAddress,
  });

  return rule;
};

// ==========================================
// MARKS ENTRY & VERIFICATION
// ==========================================

const getStudentsForMarksEntry = async (examinationId, examSubjectId, sectionId, reqUser) => {
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: {
      examination: true,
      subject: true,
    },
  });

  if (!examSubject) {
    const error = new Error('Exam subject not found');
    error.statusCode = 404;
    throw error;
  }

  // Teacher authorization check: teacher must teach this subject in this class
  if (reqUser?.role === 'TEACHER') {
    const teacherId = reqUser.teacherProfile?.id;
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId: examSubject.examination.classId,
        OR: [
          { subjectId: null },
          { subjectId: examSubject.subjectId },
        ],
      },
    });

    if (!assignment) {
      const error = new Error('Access denied: You are not assigned to enter marks for this exam subject.');
      error.statusCode = 403;
      throw error;
    }
  }

  const whereStudents = {
    classId: examSubject.examination.classId,
  };
  if (sectionId) {
    whereStudents.sectionId = sectionId;
  }

  const students = await prisma.student.findMany({
    where: whereStudents,
    orderBy: { lastName: 'asc' },
    include: {
      section: true,
      examResults: {
        where: {
          examinationId,
          examSubjectId,
        },
      },
    },
  });

  const studentEntries = students.map((s) => {
    const existing = s.examResults[0];
    return {
      studentId: s.id,
      admissionNumber: s.admissionNumber,
      studentName: `${s.firstName} ${s.lastName}`,
      section: s.section.name,
      marksObtained: existing ? existing.marksObtained : null,
      isAbsent: existing ? existing.isAbsent : false,
      remarks: existing ? existing.remarks : '',
      resultId: existing ? existing.id : null,
    };
  });

  return {
    examination: {
      id: examSubject.examination.id,
      name: examSubject.examination.name,
      classId: examSubject.examination.classId,
    },
    examSubject: {
      id: examSubject.id,
      subjectName: examSubject.subject.name,
      subjectCode: examSubject.subject.code,
      maxMarks: examSubject.maxMarks,
      passingMarks: examSubject.passingMarks,
    },
    students: studentEntries,
  };
};

const enterMarks = async ({ examinationId, examSubjectId, marksList = [] }, reqUser, ipAddress) => {
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId },
    include: { examination: true },
  });

  if (!examSubject) {
    const error = new Error('Exam subject not found');
    error.statusCode = 404;
    throw error;
  }

  // Teacher authorization check
  if (reqUser?.role === 'TEACHER') {
    const teacherId = reqUser.teacherProfile?.id;
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId,
        classId: examSubject.examination.classId,
        OR: [
          { subjectId: null },
          { subjectId: examSubject.subjectId },
        ],
      },
    });

    if (!assignment) {
      const error = new Error('Access denied: You are not assigned to enter marks for this exam subject.');
      error.statusCode = 403;
      throw error;
    }
  }

  // Validation: validate marks against maxMarks
  for (const item of marksList) {
    if (!item.isAbsent) {
      const marks = Number(item.marksObtained);
      if (isNaN(marks) || marks < 0 || marks > examSubject.maxMarks) {
        const error = new Error(
          `Invalid marks: ${item.marksObtained}. Marks must be between 0 and maximum marks (${examSubject.maxMarks}).`
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // Atomic upsert of marks
  const results = await prisma.$transaction(
    marksList.map((item) => {
      const marks = item.isAbsent ? 0 : Number(item.marksObtained);
      return prisma.examResult.upsert({
        where: {
          examinationId_studentId_examSubjectId: {
            examinationId,
            studentId: item.studentId,
            examSubjectId,
          },
        },
        update: {
          marksObtained: marks,
          isAbsent: Boolean(item.isAbsent),
          remarks: item.remarks || null,
        },
        create: {
          examinationId,
          studentId: item.studentId,
          examSubjectId,
          marksObtained: marks,
          isAbsent: Boolean(item.isAbsent),
          remarks: item.remarks || null,
        },
      });
    })
  );

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'ENTER_EXAM_MARKS',
    entity: 'ExamResult',
    entityId: `${examinationId}_${examSubjectId}`,
    details: { examinationId, examSubjectId, totalEntries: marksList.length },
    ipAddress,
  });

  return {
    count: results.length,
    message: 'Exam marks recorded successfully.',
  };
};

// ==========================================
// RESULT CALCULATION & REPORT CARD GENERATION
// ==========================================

const calculateReportCard = async (examinationId, studentId) => {
  const [student, examination, gradingRules] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
        guardian: true,
      },
    }),
    prisma.examination.findUnique({
      where: { id: examinationId },
      include: {
        class: true,
        examSubjects: {
          include: { subject: true },
        },
      },
    }),
    getGradingRules(),
  ]);

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  if (!examination) {
    const error = new Error('Examination not found');
    error.statusCode = 404;
    throw error;
  }

  // Get marks for all exam subjects
  const examResults = await prisma.examResult.findMany({
    where: {
      examinationId,
      studentId,
    },
    include: {
      examSubject: {
        include: { subject: true },
      },
    },
  });

  const resultMap = new Map();
  examResults.forEach((r) => {
    resultMap.set(r.examSubjectId, r);
  });

  let totalMaxMarks = 0;
  let totalObtainedMarks = 0;
  let hasFailedSubject = false;
  let allSubjectsGraded = true;

  const subjectBreakdown = examination.examSubjects.map((es) => {
    const result = resultMap.get(es.id);
    totalMaxMarks += es.maxMarks;

    if (!result) {
      allSubjectsGraded = false;
      return {
        subjectName: es.subject.name,
        subjectCode: es.subject.code,
        maxMarks: es.maxMarks,
        passingMarks: es.passingMarks,
        marksObtained: null,
        isAbsent: false,
        status: 'PENDING',
        percentage: null,
      };
    }

    const marks = result.marksObtained;
    totalObtainedMarks += marks;
    const isPassing = !result.isAbsent && marks >= es.passingMarks;
    if (!isPassing) {
      hasFailedSubject = true;
    }

    const subjectPct = es.maxMarks > 0 ? (marks / es.maxMarks) * 100 : 0;

    return {
      subjectName: es.subject.name,
      subjectCode: es.subject.code,
      maxMarks: es.maxMarks,
      passingMarks: es.passingMarks,
      marksObtained: marks,
      isAbsent: result.isAbsent,
      status: result.isAbsent ? 'ABSENT' : isPassing ? 'PASS' : 'FAIL',
      percentage: Number(subjectPct.toFixed(2)),
      remarks: result.remarks,
    };
  });

  const overallPercentage = totalMaxMarks > 0
    ? Number(((totalObtainedMarks / totalMaxMarks) * 100).toFixed(2))
    : 0;

  // Find matching grading rule
  let assignedGrade = 'F';
  let gradePoint = 0.0;
  let gradeDescription = 'Fail';

  for (const rule of gradingRules) {
    if (overallPercentage >= rule.minPercentage && overallPercentage <= rule.maxPercentage) {
      assignedGrade = rule.grade;
      gradePoint = rule.gradePoint;
      gradeDescription = rule.description || '';
      break;
    }
  }

  // Determine overall Pass/Fail status
  // Student passes if they passed all subjects and overall percentage is passing
  const isOverallPass = allSubjectsGraded && !hasFailedSubject && overallPercentage >= 40.0;
  const passFailStatus = !allSubjectsGraded ? 'INCOMPLETE' : isOverallPass ? 'PASS' : 'FAIL';

  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      gender: student.gender,
      dob: student.dob,
      class: student.class?.name,
      section: student.section?.name,
      guardianName: student.guardian?.name,
    },
    examination: {
      id: examination.id,
      name: examination.name,
      academicYear: examination.academicYear,
      term: examination.term,
      startDate: examination.startDate,
      endDate: examination.endDate,
    },
    subjectBreakdown,
    summary: {
      totalMaxMarks,
      totalObtainedMarks,
      overallPercentage,
      grade: assignedGrade,
      gradePoint,
      gradeDescription,
      passFailStatus,
      allSubjectsGraded,
    },
  };
};

module.exports = {
  getAllExaminations,
  getExaminationById,
  createExamination,
  addSubjectToExam,
  getGradingRules,
  createOrUpdateGradingRule,
  getStudentsForMarksEntry,
  enterMarks,
  calculateReportCard,
};

