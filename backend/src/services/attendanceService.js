const prisma = require('../config/prisma');
const { logAudit } = require('./auditService');

/**
 * Helper to normalize date to YYYY-MM-DD Date object without time shifts
 */
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date format provided');
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

/**
 * Verify whether a teacher is assigned to a class/section
 */
const isTeacherAssignedToClass = async (teacherId, classId, sectionId) => {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      classId,
      OR: [
        { sectionId: null }, // Assigned to all sections of class
        { sectionId: sectionId || undefined },
      ],
    },
  });

  return Boolean(assignment);
};

/**
 * Fetch students for attendance taking, merged with existing attendance for the date
 */
const getClassStudentsForAttendance = async ({ classId, sectionId, date, session = 'FULL_DAY', reqUser }) => {
  // If teacher, verify authorization to access this class
  if (reqUser?.role === 'TEACHER') {
    const teacherId = reqUser.teacherProfile?.id;
    if (!teacherId) {
      const error = new Error('Teacher profile not found for authenticated user');
      error.statusCode = 403;
      throw error;
    }

    const assigned = await isTeacherAssignedToClass(teacherId, classId, sectionId);
    if (!assigned) {
      const error = new Error('Access denied: You are not assigned to mark attendance for this class or section.');
      error.statusCode = 403;
      throw error;
    }
  }

  const normalizedDate = normalizeDate(date);

  // Get students in this class/section
  const students = await prisma.student.findMany({
    where: {
      classId,
      sectionId,
    },
    orderBy: { lastName: 'asc' },
    select: {
      id: true,
      admissionNumber: true,
      firstName: true,
      lastName: true,
      gender: true,
    },
  });

  // Get existing attendance for this class/section on this date & session
  const existingRecords = await prisma.attendance.findMany({
    where: {
      classId,
      sectionId,
      date: normalizedDate,
      session,
    },
  });

  const recordMap = new Map();
  existingRecords.forEach((rec) => {
    recordMap.set(rec.studentId, rec);
  });

  const merged = students.map((st) => {
    const existing = recordMap.get(st.id);
    return {
      studentId: st.id,
      admissionNumber: st.admissionNumber,
      studentName: `${st.firstName} ${st.lastName}`,
      status: existing ? existing.status : 'PRESENT',
      remarks: existing ? existing.remarks || '' : '',
      isExistingRecord: Boolean(existing),
      attendanceId: existing ? existing.id : null,
    };
  });

  return {
    classId,
    sectionId,
    date: normalizedDate,
    session,
    students: merged,
    totalStudents: students.length,
    previouslyRecorded: existingRecords.length > 0,
  };
};

/**
 * Submit / Update attendance records using database upsert to prevent duplicates
 */
const submitAttendance = async ({
  classId,
  sectionId,
  date,
  session = 'FULL_DAY',
  records = [],
  reqUser,
  ipAddress,
}) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    const error = new Error('No attendance records provided for submission');
    error.statusCode = 400;
    throw error;
  }

  let teacherId = null;

  // Teacher ownership / assignment check
  if (reqUser?.role === 'TEACHER') {
    teacherId = reqUser.teacherProfile?.id;
    if (!teacherId) {
      const error = new Error('Teacher profile not found for authenticated user');
      error.statusCode = 403;
      throw error;
    }

    const assigned = await isTeacherAssignedToClass(teacherId, classId, sectionId);
    if (!assigned) {
      const error = new Error('Access denied: You are not assigned to submit attendance for this class or section.');
      error.statusCode = 403;
      throw error;
    }
  }

  const normalizedDate = normalizeDate(date);

  // Validate allowed status values
  const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
  for (const r of records) {
    if (!validStatuses.includes(r.status)) {
      const error = new Error(`Invalid attendance status '${r.status}'. Allowed: PRESENT, ABSENT, LATE`);
      error.statusCode = 400;
      throw error;
    }
  }

  // Safe atomic upsert for all records in a single transaction
  const results = await prisma.$transaction(
    records.map((record) => {
      return prisma.attendance.upsert({
        where: {
          studentId_date_session: {
            studentId: record.studentId,
            date: normalizedDate,
            session,
          },
        },
        update: {
          status: record.status,
          remarks: record.remarks || null,
          markedById: teacherId,
          classId,
          sectionId,
        },
        create: {
          studentId: record.studentId,
          classId,
          sectionId,
          date: normalizedDate,
          session,
          status: record.status,
          remarks: record.remarks || null,
          markedById: teacherId,
        },
      });
    })
  );

  // Write audit log
  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'SUBMIT_ATTENDANCE',
    entity: 'Attendance',
    entityId: `${classId}_${sectionId}_${normalizedDate.toISOString().slice(0, 10)}`,
    details: {
      classId,
      sectionId,
      date: normalizedDate,
      session,
      totalSubmitted: records.length,
      presentCount: records.filter((r) => r.status === 'PRESENT').length,
      absentCount: records.filter((r) => r.status === 'ABSENT').length,
      lateCount: records.filter((r) => r.status === 'LATE').length,
    },
    ipAddress,
  });

  return {
    count: results.length,
    message: 'Attendance submitted successfully with safe upsert.',
    records: results,
  };
};

/**
 * Filter attendance history
 */
const getAttendanceRecords = async ({
  classId,
  sectionId,
  studentId,
  date,
  startDate,
  endDate,
  session,
  page = 1,
  limit = 50,
}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;
  if (studentId) where.studentId = studentId;
  if (session) where.session = session;

  if (date) {
    where.date = normalizeDate(date);
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = normalizeDate(startDate);
    if (endDate) where.date.lte = normalizeDate(endDate);
  }

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ date: 'desc' }, { student: { lastName: 'asc' } }],
      include: {
        student: {
          select: {
            id: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        section: true,
        markedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Calculate attendance summary for an individual student
 */
const getStudentAttendanceSummary = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, section: true },
  });

  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  const records = await prisma.attendance.findMany({
    where: { studentId },
    orderBy: { date: 'desc' },
  });

  const totalSessions = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;

  const attendancePercentage = totalSessions > 0
    ? Number(((presentCount / totalSessions) * 100).toFixed(2))
    : 100.0;

  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class?.name,
      section: student.section?.name,
    },
    totalSessions,
    presentCount,
    absentCount,
    lateCount,
    attendancePercentage,
    recentRecords: records.slice(0, 15),
  };
};

module.exports = {
  isTeacherAssignedToClass,
  getClassStudentsForAttendance,
  submitAttendance,
  getAttendanceRecords,
  getStudentAttendanceSummary,
};
