const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // Clear existing records in correct referential order
  await prisma.auditLog.deleteMany();
  await prisma.feePayment.deleteMany();
  await prisma.feeInvoice.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.examResult.deleteMany();
  await prisma.examSubject.deleteMany();
  await prisma.examination.deleteMany();
  await prisma.gradingRule.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.guardian.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // 1. Password Hashes
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@123', 10);
  const guardianPasswordHash = await bcrypt.hash('Guardian@123', 10);

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'Dr. Arthur Pendelton (Admin)',
      phone: '+1-555-0100',
    },
  });

  const teacherUser1 = await prisma.user.create({
    data: {
      email: 'teacher@school.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      name: 'Sarah Jenkins (Teacher)',
      phone: '+1-555-0101',
    },
  });

  const teacherUser2 = await prisma.user.create({
    data: {
      email: 'teacher2@school.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
      name: 'Robert Vance (Teacher)',
      phone: '+1-555-0102',
    },
  });

  const guardianUser1 = await prisma.user.create({
    data: {
      email: 'guardian@school.com',
      passwordHash: guardianPasswordHash,
      role: 'GUARDIAN',
      name: 'Michael Davis (Guardian)',
      phone: '+1-555-0199',
    },
  });

  const guardianUser2 = await prisma.user.create({
    data: {
      email: 'guardian2@school.com',
      passwordHash: guardianPasswordHash,
      role: 'GUARDIAN',
      name: 'Elena Rostova (Guardian)',
      phone: '+1-555-0245',
    },
  });

  console.log('Created Users.');

  // 3. Create Teacher Profiles
  const teacher1 = await prisma.teacher.create({
    data: {
      userId: teacherUser1.id,
      employeeId: 'TCH-1001',
      name: 'Sarah Jenkins',
      email: teacherUser1.email,
      phone: teacherUser1.phone,
      qualification: 'M.Sc. Mathematics, B.Ed.',
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacherUser2.id,
      employeeId: 'TCH-1002',
      name: 'Robert Vance',
      email: teacherUser2.email,
      phone: teacherUser2.phone,
      qualification: 'M.A. English Literature',
    },
  });

  // 4. Create Guardian Profiles
  const guardian1 = await prisma.guardian.create({
    data: {
      userId: guardianUser1.id,
      name: 'Michael Davis',
      email: guardianUser1.email,
      phone: guardianUser1.phone,
      address: '742 Evergreen Terrace, Springfield',
      relationship: 'Father',
    },
  });

  const guardian2 = await prisma.guardian.create({
    data: {
      userId: guardianUser2.id,
      name: 'Elena Rostova',
      email: guardianUser2.email,
      phone: guardianUser2.phone,
      address: '108 Ocean Drive, Bay City',
      relationship: 'Mother',
    },
  });

  console.log('Created Teachers & Guardians.');

  // 5. Classes & Sections
  const classGrade9 = await prisma.class.create({
    data: {
      name: 'Grade 9',
      numericGrade: 9,
      sections: {
        create: [{ name: 'A' }, { name: 'B' }],
      },
    },
    include: { sections: true },
  });

  const classGrade10 = await prisma.class.create({
    data: {
      name: 'Grade 10',
      numericGrade: 10,
      sections: {
        create: [{ name: 'A' }, { name: 'B' }],
      },
    },
    include: { sections: true },
  });

  const section10A = classGrade10.sections.find((s) => s.name === 'A');
  const section10B = classGrade10.sections.find((s) => s.name === 'B');
  const section9A = classGrade9.sections.find((s) => s.name === 'A');

  console.log('Created Classes and Sections.');

  // 6. Subjects
  const subjectMath = await prisma.subject.create({
    data: { name: 'Mathematics', code: 'MATH101', description: 'Algebra, Geometry and Trigonometry' },
  });
  const subjectScience = await prisma.subject.create({
    data: { name: 'General Science', code: 'SCI101', description: 'Physics, Chemistry and Biology fundamentals' },
  });
  const subjectEnglish = await prisma.subject.create({
    data: { name: 'English Language', code: 'ENG101', description: 'Grammar, Composition and Literature' },
  });
  const subjectSocial = await prisma.subject.create({
    data: { name: 'Social Studies', code: 'SOC101', description: 'History and Geography' },
  });

  console.log('Created Subjects.');

  // 7. Teacher Assignments
  // Sarah Jenkins assigned to Grade 10-A Math and Grade 10-B Math
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher1.id,
      classId: classGrade10.id,
      sectionId: section10A.id,
      subjectId: subjectMath.id,
      academicYear: '2026-2027',
    },
  });

  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher1.id,
      classId: classGrade10.id,
      sectionId: section10B.id,
      subjectId: subjectMath.id,
      academicYear: '2026-2027',
    },
  });

  // Robert Vance assigned to Grade 10-A English
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher2.id,
      classId: classGrade10.id,
      sectionId: section10A.id,
      subjectId: subjectEnglish.id,
      academicYear: '2026-2027',
    },
  });

  console.log('Created Teacher Assignments.');

  // 8. Students
  // Lucas Davis (linked to guardian Michael Davis) in Grade 10-A
  const studentLucas = await prisma.student.create({
    data: {
      admissionNumber: 'ADM-2026-001',
      firstName: 'Lucas',
      lastName: 'Davis',
      dob: new Date('2011-04-12'),
      gender: 'MALE',
      address: '742 Evergreen Terrace, Springfield',
      classId: classGrade10.id,
      sectionId: section10A.id,
      guardianId: guardian1.id,
    },
  });

  // Emma Davis (sibling of Lucas, linked to guardian Michael Davis) in Grade 9-A
  const studentEmma = await prisma.student.create({
    data: {
      admissionNumber: 'ADM-2026-002',
      firstName: 'Emma',
      lastName: 'Davis',
      dob: new Date('2012-08-23'),
      gender: 'FEMALE',
      address: '742 Evergreen Terrace, Springfield',
      classId: classGrade9.id,
      sectionId: section9A.id,
      guardianId: guardian1.id,
    },
  });

  // Alexander Rostova (linked to guardian Elena Rostova) in Grade 10-A
  const studentAlexander = await prisma.student.create({
    data: {
      admissionNumber: 'ADM-2026-003',
      firstName: 'Alexander',
      lastName: 'Rostova',
      dob: new Date('2011-01-15'),
      gender: 'MALE',
      address: '108 Ocean Drive, Bay City',
      classId: classGrade10.id,
      sectionId: section10A.id,
      guardianId: guardian2.id,
    },
  });

  // Sophia Chen in Grade 10-A
  const studentSophia = await prisma.student.create({
    data: {
      admissionNumber: 'ADM-2026-004',
      firstName: 'Sophia',
      lastName: 'Chen',
      dob: new Date('2011-06-30'),
      gender: 'FEMALE',
      address: '45 Lotus Lane, Metroville',
      classId: classGrade10.id,
      sectionId: section10A.id,
    },
  });

  // Noah Patel in Grade 10-B
  const studentNoah = await prisma.student.create({
    data: {
      admissionNumber: 'ADM-2026-005',
      firstName: 'Noah',
      lastName: 'Patel',
      dob: new Date('2011-11-05'),
      gender: 'MALE',
      address: '12 Rosewood Crescent, Metroville',
      classId: classGrade10.id,
      sectionId: section10B.id,
    },
  });

  console.log('Created Students.');

  // 9. Attendance
  const dates = [
    new Date('2026-11-10'),
    new Date('2026-11-11'),
    new Date('2026-11-12'),
    new Date('2026-11-13'),
  ];

  for (const date of dates) {
    // Lucas Davis
    await prisma.attendance.create({
      data: {
        studentId: studentLucas.id,
        classId: classGrade10.id,
        sectionId: section10A.id,
        date: date,
        session: 'FULL_DAY',
        status: 'PRESENT',
        markedById: teacher1.id,
      },
    });

    // Alexander Rostova
    await prisma.attendance.create({
      data: {
        studentId: studentAlexander.id,
        classId: classGrade10.id,
        sectionId: section10A.id,
        date: date,
        session: 'FULL_DAY',
        status: date.getDate() === 12 ? 'ABSENT' : 'PRESENT',
        markedById: teacher1.id,
      },
    });

    // Sophia Chen
    await prisma.attendance.create({
      data: {
        studentId: studentSophia.id,
        classId: classGrade10.id,
        sectionId: section10A.id,
        date: date,
        session: 'FULL_DAY',
        status: date.getDate() === 11 ? 'LATE' : 'PRESENT',
        markedById: teacher1.id,
      },
    });
  }

  console.log('Created Attendance Records.');

  // 10. Grading Rules
  const gradingRules = [
    { grade: 'A+', minPercentage: 90.0, maxPercentage: 100.0, gradePoint: 4.0, description: 'Outstanding', isPassing: true },
    { grade: 'A', minPercentage: 80.0, maxPercentage: 89.99, gradePoint: 3.7, description: 'Excellent', isPassing: true },
    { grade: 'B', minPercentage: 70.0, maxPercentage: 79.99, gradePoint: 3.0, description: 'Good', isPassing: true },
    { grade: 'C', minPercentage: 60.0, maxPercentage: 69.99, gradePoint: 2.0, description: 'Average', isPassing: true },
    { grade: 'D', minPercentage: 40.0, maxPercentage: 59.99, gradePoint: 1.0, description: 'Pass', isPassing: true },
    { grade: 'F', minPercentage: 0.0, maxPercentage: 39.99, gradePoint: 0.0, description: 'Fail', isPassing: false },
  ];

  for (const rule of gradingRules) {
    await prisma.gradingRule.create({ data: rule });
  }

  console.log('Created Grading Rules.');

  // 11. Examinations & Exam Subjects
  const midtermExam = await prisma.examination.create({
    data: {
      name: 'Midterm Examination 2026',
      academicYear: '2026-2027',
      term: 'Term 1',
      classId: classGrade10.id,
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-10-10'),
    },
  });

  const examSubMath = await prisma.examSubject.create({
    data: {
      examinationId: midtermExam.id,
      subjectId: subjectMath.id,
      maxMarks: 100,
      passingMarks: 40,
      examDate: new Date('2026-10-02'),
    },
  });

  const examSubScience = await prisma.examSubject.create({
    data: {
      examinationId: midtermExam.id,
      subjectId: subjectScience.id,
      maxMarks: 100,
      passingMarks: 40,
      examDate: new Date('2026-10-04'),
    },
  });

  const examSubEnglish = await prisma.examSubject.create({
    data: {
      examinationId: midtermExam.id,
      subjectId: subjectEnglish.id,
      maxMarks: 100,
      passingMarks: 40,
      examDate: new Date('2026-10-06'),
    },
  });

  // Exam Results for Lucas Davis (Total 265 / 300 => 88.33% => Grade A)
  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubMath.id,
      studentId: studentLucas.id,
      marksObtained: 88,
    },
  });

  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubScience.id,
      studentId: studentLucas.id,
      marksObtained: 85,
    },
  });

  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubEnglish.id,
      studentId: studentLucas.id,
      marksObtained: 92,
    },
  });

  // Exam Results for Alexander Rostova (Total 224 / 300 => 74.67% => Grade B)
  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubMath.id,
      studentId: studentAlexander.id,
      marksObtained: 74,
    },
  });

  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubScience.id,
      studentId: studentAlexander.id,
      marksObtained: 70,
    },
  });

  await prisma.examResult.create({
    data: {
      examinationId: midtermExam.id,
      examSubjectId: examSubEnglish.id,
      studentId: studentAlexander.id,
      marksObtained: 80,
    },
  });

  console.log('Created Examinations, Exam Subjects & Results.');

  // 12. Fee Structures, Invoices & Payments
  const feeStructureTerm1 = await prisma.feeStructure.create({
    data: {
      title: 'Term 1 Tuition Fee',
      classId: classGrade10.id,
      academicYear: '2026-2027',
      amount: 1200.0,
      dueDate: new Date('2026-11-30'),
      description: 'Comprehensive academic tuition fee for Term 1',
    },
  });

  const feeStructureLab = await prisma.feeStructure.create({
    data: {
      title: 'Science & Computer Lab Fee',
      classId: classGrade10.id,
      academicYear: '2026-2027',
      amount: 300.0,
      dueDate: new Date('2026-11-30'),
      description: 'Laboratory supplies, equipment and high-speed internet',
    },
  });

  // Lucas Davis: Invoice 1 ($1200, partially paid $500, outstanding $700)
  const invoiceLucas1 = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      studentId: studentLucas.id,
      feeStructureId: feeStructureTerm1.id,
      title: 'Term 1 Tuition Fee - Lucas Davis',
      amount: 1200.0,
      dueDate: new Date('2026-11-30'),
      status: 'PARTIALLY_PAID',
    },
  });

  await prisma.feePayment.create({
    data: {
      invoiceId: invoiceLucas1.id,
      studentId: studentLucas.id,
      amount: 500.0,
      paymentDate: new Date('2026-11-05'),
      paymentMethod: 'ONLINE_SIMULATED',
      transactionRef: 'TXN-2026-8801',
      notes: 'Initial partial installment paid via guardian portal (simulated)',
    },
  });

  // Lucas Davis: Invoice 2 ($300, fully paid $300, outstanding $0)
  const invoiceLucas2 = await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-002',
      studentId: studentLucas.id,
      feeStructureId: feeStructureLab.id,
      title: 'Science & Computer Lab Fee - Lucas Davis',
      amount: 300.0,
      dueDate: new Date('2026-11-30'),
      status: 'PAID',
    },
  });

  await prisma.feePayment.create({
    data: {
      invoiceId: invoiceLucas2.id,
      studentId: studentLucas.id,
      amount: 300.0,
      paymentDate: new Date('2026-11-02'),
      paymentMethod: 'BANK_TRANSFER',
      transactionRef: 'TXN-2026-8802',
      notes: 'Full payment for laboratory fee',
    },
  });

  // Alexander Rostova: Invoice ($1200, unpaid)
  await prisma.feeInvoice.create({
    data: {
      invoiceNumber: 'INV-2026-003',
      studentId: studentAlexander.id,
      feeStructureId: feeStructureTerm1.id,
      title: 'Term 1 Tuition Fee - Alexander Rostova',
      amount: 1200.0,
      dueDate: new Date('2026-11-30'),
      status: 'PENDING',
    },
  });

  console.log('Created Fee Structures, Invoices and Payments.');

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userRole: 'ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      entityId: 'ROOT',
      details: {
        message: 'Database seeded successfully with initial school administration records.',
        timestamp: new Date().toISOString(),
      },
      ipAddress: '127.0.0.1',
    },
  });

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

