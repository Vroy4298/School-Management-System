const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Phase 3: Academic Administration & Attendance Integration Tests', () => {
  let adminToken = '';
  let teacherToken = ''; // Sarah Jenkins (assigned to Grade 10-A)
  let guardianToken = '';

  let classGrade10 = null;
  let section10A = null;
  let classGrade9 = null;
  let section9A = null;
  let studentLucas = null;

  beforeAll(async () => {
    // 1. Get tokens
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@school.com',
      password: 'Admin@123',
    });
    adminToken = adminRes.body.data.token;

    const teacherRes = await request(app).post('/api/auth/login').send({
      email: 'teacher@school.com',
      password: 'Teacher@123',
    });
    teacherToken = teacherRes.body.data.token;

    const guardianRes = await request(app).post('/api/auth/login').send({
      email: 'guardian@school.com',
      password: 'Guardian@123',
    });
    guardianToken = guardianRes.body.data.token;

    // 2. Fetch classes and sections for testing
    const classes = await prisma.class.findMany({ include: { sections: true } });
    classGrade10 = classes.find((c) => c.name === 'Grade 10');
    section10A = classGrade10.sections.find((s) => s.name === 'A');

    classGrade9 = classes.find((c) => c.name === 'Grade 9');
    section9A = classGrade9.sections.find((s) => s.name === 'A');

    studentLucas = await prisma.student.findFirst({
      where: { admissionNumber: 'ADM-2026-001' },
    });
  });

  describe('Academic Administration CRUD', () => {
    it('Admin can list all classes and sections', async () => {
      const res = await request(app)
        .get('/api/academic/classes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.classes)).toBe(true);
      expect(res.body.data.classes.length).toBeGreaterThanOrEqual(2);
    });

    it('Admin can create a new student with auto/manual admission number', async () => {
      const uniqueAdm = `ADM-TEST-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/academic/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Oliver',
          lastName: 'Twist',
          admissionNumber: uniqueAdm,
          dob: '2011-05-15',
          gender: 'MALE',
          classId: classGrade10.id,
          sectionId: section10A.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.admissionNumber).toBe(uniqueAdm);

      // Clean up test student
      await prisma.student.delete({ where: { id: res.body.data.student.id } });
    });

    it('Admin can search students by query', async () => {
      const res = await request(app)
        .get('/api/academic/students?search=Lucas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.students[0].firstName).toBe('Lucas');
    });

    it('Guardian is forbidden from creating students (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/students')
        .set('Authorization', `Bearer ${guardianToken}`)
        .send({
          firstName: 'Hacker',
          lastName: 'Student',
          admissionNumber: 'HACK-001',
          dob: '2012-01-01',
          classId: classGrade10.id,
          sectionId: section10A.id,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Scenario 1: Teacher Attendance & Class Assignment Authorization', () => {
    it('Teacher can access students of their ASSIGNED class (Grade 10-A)', async () => {
      const res = await request(app)
        .get(`/api/attendance/class-students?classId=${classGrade10.id}&sectionId=${section10A.id}&date=2026-11-14`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students.length).toBeGreaterThan(0);
      expect(res.body.data.classId).toBe(classGrade10.id);
    });

    it('Teacher is DENIED access to an UNASSIGNED class (Grade 9-A) (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/attendance/class-students?classId=${classGrade9.id}&sectionId=${section9A.id}&date=2026-11-14`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not assigned to mark attendance/i);
    });

    it('Teacher is DENIED from submitting attendance for an UNASSIGNED class (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classGrade9.id,
          sectionId: section9A.id,
          date: '2026-11-14',
          session: 'FULL_DAY',
          records: [
            {
              studentId: studentLucas.id,
              status: 'PRESENT',
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not assigned to submit attendance/i);
    });
  });

  describe('Scenario 2: Duplicate Attendance Rejection or Safe Update', () => {
    const testDate = '2026-11-20';
    const testSession = 'FULL_DAY';

    it('Step A: Submit initial attendance for student as PRESENT', async () => {
      const res = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classGrade10.id,
          sectionId: section10A.id,
          date: testDate,
          session: testSession,
          records: [
            {
              studentId: studentLucas.id,
              status: 'PRESENT',
              remarks: 'First submission on time',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
    });

    it('Step B: Re-submit attendance on exact same student, date, and session with status LATE (Safe Upsert)', async () => {
      const res = await request(app)
        .post('/api/attendance/submit')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classGrade10.id,
          sectionId: section10A.id,
          date: testDate,
          session: testSession,
          records: [
            {
              studentId: studentLucas.id,
              status: 'LATE',
              remarks: 'Updated: Arrived 20 mins late due to transit',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('Step C: Verify in Database that NO duplicate record was created and status was updated', async () => {
      const normalized = new Date('2026-11-20T00:00:00.000Z');

      const matches = await prisma.attendance.findMany({
        where: {
          studentId: studentLucas.id,
          date: normalized,
          session: testSession,
        },
      });

      // Crucial assertion: EXACTLY 1 record must exist
      expect(matches.length).toBe(1);
      // Status and remarks were safely updated
      expect(matches[0].status).toBe('LATE');
      expect(matches[0].remarks).toBe('Updated: Arrived 20 mins late due to transit');
    });
  });

  describe('Attendance Calculation & Summary', () => {
    it('calculates correct student attendance summary and percentage', async () => {
      const res = await request(app)
        .get(`/api/attendance/student/${studentLucas.id}/summary`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('attendancePercentage');
      expect(typeof res.body.data.attendancePercentage).toBe('number');
      expect(res.body.data.totalSessions).toBeGreaterThan(0);
    });
  });
});
