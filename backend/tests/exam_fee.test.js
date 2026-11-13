const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Phase 4: Examination & Fee Management Integration Tests', () => {
  let adminToken = '';
  let teacherToken = '';
  let guardianToken = '';

  let classGrade10 = null;
  let studentLucas = null;
  let subjectMath = null;
  let subjectScience = null;

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

    // 2. Fetch seed objects
    classGrade10 = await prisma.class.findFirst({ where: { name: 'Grade 10' } });
    studentLucas = await prisma.student.findFirst({ where: { admissionNumber: 'ADM-2026-001' } });
    subjectMath = await prisma.subject.findFirst({ where: { code: 'MATH101' } });
    subjectScience = await prisma.subject.findFirst({ where: { code: 'SCI101' } });
  });

  describe('Scenario 3: Examination Results, Calculations & Report Card', () => {
    let testExamId = '';
    let examSubjectMathId = '';
    let examSubjectScienceId = '';

    it('Step A: Admin creates an examination and configures subjects', async () => {
      const res = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Annual Assessment Test 2026',
          academicYear: '2026-2027',
          term: 'Term 2',
          classId: classGrade10.id,
          startDate: '2026-12-01',
          endDate: '2026-12-10',
          subjects: [
            { subjectId: subjectMath.id, maxMarks: 100, passingMarks: 40 },
            { subjectId: subjectScience.id, maxMarks: 100, passingMarks: 40 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      testExamId = res.body.data.examination.id;
      expect(res.body.data.examination.examSubjects.length).toBe(2);

      const mathSub = res.body.data.examination.examSubjects.find((s) => s.subjectId === subjectMath.id);
      const sciSub = res.body.data.examination.examSubjects.find((s) => s.subjectId === subjectScience.id);
      examSubjectMathId = mathSub.id;
      examSubjectScienceId = sciSub.id;
    });

    it('Step B: Enter marks for student (Math: 95, Science: 85)', async () => {
      // Enter Math marks
      const resMath = await request(app)
        .post(`/api/exams/${testExamId}/subjects/${examSubjectMathId}/marks`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          marksList: [
            {
              studentId: studentLucas.id,
              marksObtained: 95,
              remarks: 'Excellent problem solving',
            },
          ],
        });

      expect(resMath.status).toBe(200);
      expect(resMath.body.success).toBe(true);

      // Enter Science marks
      const resSci = await request(app)
        .post(`/api/exams/${testExamId}/subjects/${examSubjectScienceId}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marksList: [
            {
              studentId: studentLucas.id,
              marksObtained: 85,
              remarks: 'Great lab experiment performance',
            },
          ],
        });

      expect(resSci.status).toBe(200);
      expect(resSci.body.success).toBe(true);
    });

    it('Step C: Verify Report Card calculations (Total: 180/200, 90%, Grade: A+, Pass)', async () => {
      const res = await request(app)
        .get(`/api/exams/${testExamId}/students/${studentLucas.id}/report-card`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary, subjectBreakdown, student, examination } = res.body.data.reportCard;

      expect(student.name).toBe('Lucas Davis');
      expect(examination.name).toBe('Annual Assessment Test 2026');

      // Assert calculations
      expect(summary.totalMaxMarks).toBe(200);
      expect(summary.totalObtainedMarks).toBe(180);
      expect(summary.overallPercentage).toBe(90.0);
      expect(summary.grade).toBe('A+');
      expect(summary.passFailStatus).toBe('PASS');
      expect(summary.allSubjectsGraded).toBe(true);

      // Assert subject breakdowns
      expect(subjectBreakdown.length).toBe(2);
      const mathRecord = subjectBreakdown.find((s) => s.subjectCode === 'MATH101');
      expect(mathRecord.marksObtained).toBe(95);
      expect(mathRecord.status).toBe('PASS');
    });

    it('Rejects invalid marks exceeding maximum marks (Negative test)', async () => {
      const res = await request(app)
        .post(`/api/exams/${testExamId}/subjects/${examSubjectMathId}/marks`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marksList: [
            {
              studentId: studentLucas.id,
              marksObtained: 150, // max is 100!
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/between 0 and maximum marks/i);
    });
  });

  describe('Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation', () => {
    let testInvoiceId = '';

    it('Step A: Create a fee invoice with amount $1000', async () => {
      const res = await request(app)
        .post('/api/fees/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentLucas.id,
          title: 'Annual Sports & Activity Fee',
          amount: 1000.0,
          dueDate: '2026-12-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invoices.length).toBe(1);
      testInvoiceId = res.body.data.invoices[0].id;
      expect(res.body.data.invoices[0].status).toBe('PENDING');
      expect(res.body.data.invoices[0].amount).toBe(1000.0);
    });

    it('Step B: Record a partial payment of $400 and verify outstanding balance is $600', async () => {
      const res = await request(app)
        .post(`/api/fees/invoices/${testInvoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 400.0,
          paymentMethod: 'ONLINE_SIMULATED',
          notes: 'First installment paid online',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { invoice, paymentReceipt } = res.body.data;
      expect(paymentReceipt.amountPaid).toBe(400.0);
      expect(paymentReceipt.transactionRef).toMatch(/^TXN-/);

      // Verify invoice state
      expect(invoice.totalInvoiceAmount).toBe(1000.0);
      expect(invoice.totalAmountPaid).toBe(400.0);
      expect(invoice.outstandingBalance).toBe(600.0);
      expect(invoice.status).toBe('PARTIALLY_PAID');
    });

    it('Step C: Reject payment exceeding the outstanding balance (Negative test)', async () => {
      // Outstanding balance is currently $600, attempting to pay $700 must be rejected
      const res = await request(app)
        .post(`/api/fees/invoices/${testInvoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 700.0,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds the remaining outstanding balance of \$600.00/i);
    });

    it('Step D: Record remaining payment of $600 and verify status changes to PAID ($0 balance)', async () => {
      const res = await request(app)
        .post(`/api/fees/invoices/${testInvoiceId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 600.0,
          paymentMethod: 'BANK_TRANSFER',
          notes: 'Final settlement',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { invoice } = res.body.data;
      expect(invoice.totalAmountPaid).toBe(1000.0);
      expect(invoice.outstandingBalance).toBe(0.0);
      expect(invoice.status).toBe('PAID');
    });

    it('Step E: Verify system-wide fee totals reconcile with payment ledger', async () => {
      const res = await request(app)
        .get('/api/fees/ledger/reconciliation')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const { summary } = res.body.data;
      expect(summary.isReconciled).toBe(true);
      expect(summary.totalInvoiced).toBe(summary.totalCollected + summary.totalOutstanding);
      expect(summary.invoiceCounts.paid).toBeGreaterThanOrEqual(1);
    });
  });
});
