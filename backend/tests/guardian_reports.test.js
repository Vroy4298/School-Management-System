const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Phase 5: Guardian Privacy & Admin Reports Integration Tests', () => {
  let adminToken = '';
  let teacherToken = '';
  let guardian1Token = ''; // Michael Davis (guardian of Lucas & Emma)
  let guardian2Token = ''; // Elena Rostova (guardian of Alexander)

  let studentLucas = null;
  let studentAlexander = null;
  let invoiceAlexander = null;

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

    const g1Res = await request(app).post('/api/auth/login').send({
      email: 'guardian@school.com',
      password: 'Guardian@123',
    });
    guardian1Token = g1Res.body.data.token;

    const g2Res = await request(app).post('/api/auth/login').send({
      email: 'guardian2@school.com',
      password: 'Guardian@123',
    });
    guardian2Token = g2Res.body.data.token;

    // 2. Fetch seed objects
    studentLucas = await prisma.student.findFirst({ where: { admissionNumber: 'ADM-2026-001' } });
    studentAlexander = await prisma.student.findFirst({ where: { admissionNumber: 'ADM-2026-003' } });
    invoiceAlexander = await prisma.feeInvoice.findFirst({ where: { studentId: studentAlexander.id } });
  });

  describe('Scenario 4: Guardian Privacy & Ownership Enforcement', () => {
    it('Guardian 1 can access linked students list (Lucas and Emma Davis)', async () => {
      const res = await request(app)
        .get('/api/guardian/my-students')
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.students)).toBe(true);
      expect(res.body.data.students.length).toBeGreaterThanOrEqual(2);

      const names = res.body.data.students.map((s) => s.firstName);
      expect(names).toContain('Lucas');
      expect(names).toContain('Emma');
    });

    it('Guardian 1 can view linked student (Lucas Davis) attendance, exams and fees', async () => {
      // Profile
      const resProfile = await request(app)
        .get(`/api/guardian/students/${studentLucas.id}`)
        .set('Authorization', `Bearer ${guardian1Token}`);
      expect(resProfile.status).toBe(200);
      expect(resProfile.body.data.student.firstName).toBe('Lucas');

      // Attendance
      const resAtt = await request(app)
        .get(`/api/guardian/students/${studentLucas.id}/attendance`)
        .set('Authorization', `Bearer ${guardian1Token}`);
      expect(resAtt.status).toBe(200);
      expect(resAtt.body.data).toHaveProperty('attendancePercentage');

      // Exams
      const resExams = await request(app)
        .get(`/api/guardian/students/${studentLucas.id}/exams`)
        .set('Authorization', `Bearer ${guardian1Token}`);
      expect(resExams.status).toBe(200);
      expect(resExams.body.data).toHaveProperty('examinations');

      // Fees
      const resFees = await request(app)
        .get(`/api/guardian/students/${studentLucas.id}/fees`)
        .set('Authorization', `Bearer ${guardian1Token}`);
      expect(resFees.status).toBe(200);
      expect(resFees.body.data.summary).toHaveProperty('totalInvoiced');
    });

    it('CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova profile (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/guardian/students/${studentAlexander.id}`)
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to view or manage records for this student/i);
    });

    it('CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova attendance (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/guardian/students/${studentAlexander.id}/attendance`)
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to view or manage records for this student/i);
    });

    it('CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova exams (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/guardian/students/${studentAlexander.id}/exams`)
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to view or manage records for this student/i);
    });

    it('CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova fees (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/guardian/students/${studentAlexander.id}/fees`)
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to view or manage records for this student/i);
    });

    it('CRITICAL SECURITY: Guardian 1 is DENIED from paying an invoice for another student (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/guardian/invoices/${invoiceAlexander.id}/pay`)
        .set('Authorization', `Bearer ${guardian1Token}`)
        .send({
          amount: 100.0,
          paymentMethod: 'ONLINE_SIMULATED',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized to pay an invoice for another student/i);
    });
  });

  describe('Admin Dashboard Metrics & Reporting', () => {
    it('Admin can fetch dashboard overview with aggregated metrics and audit activity', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { metrics, recentActivities } = res.body.data;
      expect(metrics.totalStudents).toBeGreaterThan(0);
      expect(metrics.totalTeachers).toBeGreaterThan(0);
      expect(metrics.totalClasses).toBeGreaterThan(0);
      expect(metrics.fees).toHaveProperty('totalFeesCollected');
      expect(metrics.fees).toHaveProperty('totalFeesOutstanding');
      expect(Array.isArray(recentActivities)).toBe(true);
    });

    it('Admin can fetch class-wise attendance report', async () => {
      const res = await request(app)
        .get('/api/reports/class-attendance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('classReports');
      expect(Array.isArray(res.body.data.classReports)).toBe(true);
    });

    it('Teacher is FORBIDDEN from accessing admin reports (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-overview')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('Guardian is FORBIDDEN from accessing admin reports (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard-overview')
        .set('Authorization', `Bearer ${guardian1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});

