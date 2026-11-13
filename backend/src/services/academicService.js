const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { logAudit } = require('./auditService');

// ==========================================
// CLASSES & SECTIONS
// ==========================================

const getAllClasses = async () => {
  return await prisma.class.findMany({
    orderBy: { numericGrade: 'asc' },
    include: {
      sections: true,
      _count: {
        select: {
          students: true,
          teacherAssignments: true,
        },
      },
    },
  });
};

const createClass = async ({ name, numericGrade, sections = [] }, reqUser, ipAddress) => {
  const newClass = await prisma.class.create({
    data: {
      name,
      numericGrade: Number(numericGrade),
      sections: {
        create: sections.map((s) => ({ name: typeof s === 'string' ? s : s.name })),
      },
    },
    include: { sections: true },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_CLASS',
    entity: 'Class',
    entityId: newClass.id,
    details: { name: newClass.name, numericGrade: newClass.numericGrade },
    ipAddress,
  });

  return newClass;
};

const createSection = async (classId, name, reqUser, ipAddress) => {
  const section = await prisma.section.create({
    data: {
      name,
      classId,
    },
    include: { class: true },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_SECTION',
    entity: 'Section',
    entityId: section.id,
    details: { name: section.name, classId },
    ipAddress,
  });

  return section;
};

const deleteClass = async (classId, reqUser, ipAddress) => {
  const deleted = await prisma.class.delete({
    where: { id: classId },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'DELETE_CLASS',
    entity: 'Class',
    entityId: classId,
    details: { name: deleted.name },
    ipAddress,
  });

  return deleted;
};

// ==========================================
// SUBJECTS
// ==========================================

const getAllSubjects = async () => {
  return await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });
};

const createSubject = async ({ name, code, description }, reqUser, ipAddress) => {
  const subject = await prisma.subject.create({
    data: {
      name,
      code: code.trim().toUpperCase(),
      description,
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_SUBJECT',
    entity: 'Subject',
    entityId: subject.id,
    details: { name: subject.name, code: subject.code },
    ipAddress,
  });

  return subject;
};

const updateSubject = async (id, { name, code, description }, reqUser, ipAddress) => {
  const subject = await prisma.subject.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(code && { code: code.trim().toUpperCase() }),
      ...(description !== undefined && { description }),
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'UPDATE_SUBJECT',
    entity: 'Subject',
    entityId: subject.id,
    details: { name: subject.name, code: subject.code },
    ipAddress,
  });

  return subject;
};

const deleteSubject = async (id, reqUser, ipAddress) => {
  const deleted = await prisma.subject.delete({ where: { id } });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'DELETE_SUBJECT',
    entity: 'Subject',
    entityId: id,
    details: { name: deleted.name },
    ipAddress,
  });

  return deleted;
};

// ==========================================
// TEACHERS & ASSIGNMENTS
// ==========================================

const getAllTeachers = async () => {
  return await prisma.teacher.findMany({
    orderBy: { name: 'asc' },
    include: {
      user: {
        select: { id: true, email: true, isActive: true },
      },
      assignments: {
        include: {
          class: true,
          section: true,
          subject: true,
        },
      },
    },
  });
};

const createTeacher = async ({ name, email, password, phone, employeeId, qualification }, reqUser, ipAddress) => {
  const defaultPassword = password || 'Teacher@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Use transaction to create User and Teacher profile atomically
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'TEACHER',
        phone,
      },
    });

    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        employeeId: employeeId || `TCH-${Date.now().toString().slice(-4)}`,
        name,
        email: user.email,
        phone,
        qualification,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return teacher;
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_TEACHER',
    entity: 'Teacher',
    entityId: result.id,
    details: { name: result.name, employeeId: result.employeeId, email: result.email },
    ipAddress,
  });

  return result;
};

const updateTeacher = async (id, { name, phone, qualification }, reqUser, ipAddress) => {
  const teacher = await prisma.teacher.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(phone !== undefined && { phone }),
      ...(qualification !== undefined && { qualification }),
    },
  });

  // Also update user name if provided
  if (name) {
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { name },
    });
  }

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'UPDATE_TEACHER',
    entity: 'Teacher',
    entityId: teacher.id,
    details: { name: teacher.name },
    ipAddress,
  });

  return teacher;
};

const deleteTeacher = async (id, reqUser, ipAddress) => {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw new Error('Teacher not found');

  // Deleting user cascades to teacher profile and assignments
  await prisma.user.delete({ where: { id: teacher.userId } });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'DELETE_TEACHER',
    entity: 'Teacher',
    entityId: id,
    details: { name: teacher.name, employeeId: teacher.employeeId },
    ipAddress,
  });

  return teacher;
};

const assignTeacher = async ({ teacherId, classId, sectionId, subjectId, academicYear = '2026-2027' }, reqUser, ipAddress) => {
  const assignment = await prisma.teacherAssignment.create({
    data: {
      teacherId,
      classId,
      sectionId: sectionId || null,
      subjectId: subjectId || null,
      academicYear,
    },
    include: {
      teacher: true,
      class: true,
      section: true,
      subject: true,
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'ASSIGN_TEACHER',
    entity: 'TeacherAssignment',
    entityId: assignment.id,
    details: { teacherId, classId, sectionId, subjectId, academicYear },
    ipAddress,
  });

  return assignment;
};

const removeTeacherAssignment = async (id, reqUser, ipAddress) => {
  const deleted = await prisma.teacherAssignment.delete({ where: { id } });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'REMOVE_TEACHER_ASSIGNMENT',
    entity: 'TeacherAssignment',
    entityId: id,
    details: { assignmentId: id },
    ipAddress,
  });

  return deleted;
};

const getTeacherAssignments = async (teacherId) => {
  return await prisma.teacherAssignment.findMany({
    where: { teacherId },
    include: {
      class: true,
      section: true,
      subject: true,
    },
  });
};

// ==========================================
// GUARDIANS
// ==========================================

const getAllGuardians = async ({ search = '', page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (search.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { email: { contains: search.trim(), mode: 'insensitive' } },
      { phone: { contains: search.trim() } },
    ];
  }

  const [guardians, total] = await Promise.all([
    prisma.guardian.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { name: 'asc' },
      include: {
        students: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    }),
    prisma.guardian.count({ where }),
  ]);

  return {
    guardians,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

const createGuardian = async ({ name, email, password, phone, address, relationship }, reqUser, ipAddress) => {
  const defaultPassword = password || 'Guardian@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'GUARDIAN',
        phone,
      },
    });

    const guardian = await tx.guardian.create({
      data: {
        userId: user.id,
        name,
        email: user.email,
        phone,
        address,
        relationship: relationship || 'Guardian',
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return guardian;
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_GUARDIAN',
    entity: 'Guardian',
    entityId: result.id,
    details: { name: result.name, email: result.email },
    ipAddress,
  });

  return result;
};

// ==========================================
// STUDENTS
// ==========================================

const getAllStudents = async ({ search = '', classId, sectionId, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);
  const where = {};

  if (classId) where.classId = classId;
  if (sectionId) where.sectionId = sectionId;

  if (search.trim()) {
    where.OR = [
      { firstName: { contains: search.trim(), mode: 'insensitive' } },
      { lastName: { contains: search.trim(), mode: 'insensitive' } },
      { admissionNumber: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: [{ class: { numericGrade: 'asc' } }, { section: { name: 'asc' } }, { lastName: 'asc' }],
      include: {
        class: true,
        section: true,
        guardian: true,
      },
    }),
    prisma.student.count({ where }),
  ]);

  return {
    students,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

const getStudentById = async (id) => {
  return await prisma.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
      guardian: true,
    },
  });
};

const createStudent = async (
  { firstName, lastName, admissionNumber, dob, gender, address, classId, sectionId, guardianId },
  reqUser,
  ipAddress
) => {
  const finalAdmNumber = admissionNumber || `ADM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      admissionNumber: finalAdmNumber,
      dob: new Date(dob),
      gender: gender || 'OTHER',
      address,
      classId,
      sectionId,
      guardianId: guardianId || null,
    },
    include: {
      class: true,
      section: true,
      guardian: true,
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'CREATE_STUDENT',
    entity: 'Student',
    entityId: student.id,
    details: {
      name: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      class: student.class?.name,
      section: student.section?.name,
    },
    ipAddress,
  });

  return student;
};

const updateStudent = async (id, updateData, reqUser, ipAddress) => {
  const { firstName, lastName, dob, gender, address, classId, sectionId, guardianId } = updateData;

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(dob && { dob: new Date(dob) }),
      ...(gender && { gender }),
      ...(address !== undefined && { address }),
      ...(classId && { classId }),
      ...(sectionId && { sectionId }),
      ...(guardianId !== undefined && { guardianId: guardianId || null }),
    },
    include: {
      class: true,
      section: true,
      guardian: true,
    },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'UPDATE_STUDENT',
    entity: 'Student',
    entityId: student.id,
    details: { name: `${student.firstName} ${student.lastName}`, updateData },
    ipAddress,
  });

  return student;
};

const deleteStudent = async (id, reqUser, ipAddress) => {
  const deleted = await prisma.student.delete({
    where: { id },
  });

  await logAudit({
    userId: reqUser?.id,
    userRole: reqUser?.role,
    action: 'DELETE_STUDENT',
    entity: 'Student',
    entityId: id,
    details: { name: `${deleted.firstName} ${deleted.lastName}`, admissionNumber: deleted.admissionNumber },
    ipAddress,
  });

  return deleted;
};

module.exports = {
  getAllClasses,
  createClass,
  createSection,
  deleteClass,
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  assignTeacher,
  removeTeacherAssignment,
  getTeacherAssignments,
  getAllGuardians,
  createGuardian,
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};

