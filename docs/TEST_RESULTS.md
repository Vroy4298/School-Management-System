# Automated Test Execution Evidence

**Test Framework:** Vitest v2.1.9 + Supertest v7.0.0  
**Database Target:** Live PostgreSQL (Neon Serverless)  
**Total Test Suites:** 4 passed (4)  
**Total Tests:** 43 passed (43)  
**Execution Status:** ALL PASS (0 Failures)  

---

## Complete Test Run Log

```text
> school-management-backend@1.0.0 test
> vitest run

 RUN  v2.1.9 E:/ALIGONS ASSIGNMENT/backend

 ✓ tests/auth.test.js (12 tests) 5588ms
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should successfully log in as an Admin and return a JWT
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should successfully log in as a Teacher
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should successfully log in as a Guardian
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should reject login with incorrect password (negative test)
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should reject login with non-existent email (negative test)
   ✓ Phase 2: Authentication & Authorization API Tests > POST /api/auth/login > should reject login with missing fields (validation test)
   ✓ Phase 2: Authentication & Authorization API Tests > GET /api/auth/me (Protected Route) > should return the current user profile with valid token
   ✓ Phase 2: Authentication & Authorization API Tests > GET /api/auth/me (Protected Route) > should reject access when no authorization header is provided
   ✓ Phase 2: Authentication & Authorization API Tests > GET /api/auth/me (Protected Route) > should reject access with an invalid/tampered token
   ✓ Phase 2: Authentication & Authorization API Tests > Role-Based Access Control (RBAC) on /api/audit > should permit Admin to access audit logs
   ✓ Phase 2: Authentication & Authorization API Tests > Role-Based Access Control (RBAC) on /api/audit > should forbid Teacher from accessing admin-only audit logs (403 Forbidden)
   ✓ Phase 2: Authentication & Authorization API Tests > Role-Based Access Control (RBAC) on /api/audit > should forbid Guardian from accessing admin-only audit logs (403 Forbidden)

 ✓ tests/academic_attendance.test.js (11 tests) 12234ms
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Academic Administration CRUD > Admin can list all classes and sections
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Academic Administration CRUD > Admin can create a new student with auto/manual admission number
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Academic Administration CRUD > Admin can search students by query
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Academic Administration CRUD > Guardian is forbidden from creating students (403 Forbidden)
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 1: Teacher Attendance & Class Assignment Authorization > Teacher can access students of their ASSIGNED class (Grade 10-A)
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 1: Teacher Attendance & Class Assignment Authorization > Teacher is DENIED access to an UNASSIGNED class (Grade 9-A) (403 Forbidden)
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 1: Teacher Attendance & Class Assignment Authorization > Teacher is DENIED from submitting attendance for an UNASSIGNED class (403 Forbidden)
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 2: Duplicate Attendance Rejection or Safe Update > Step A: Submit initial attendance for student as PRESENT
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 2: Duplicate Attendance Rejection or Safe Update > Step B: Re-submit attendance on exact same student, date, and session with status LATE (Safe Upsert)
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Scenario 2: Duplicate Attendance Rejection or Safe Update > Step C: Verify in Database that NO duplicate record was created and status was updated
   ✓ Phase 3: Academic Administration & Attendance Integration Tests > Attendance Calculation & Summary > calculates correct student attendance summary and percentage

 ✓ tests/exam_fee.test.js (9 tests) 16031ms
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 3: Examination Results, Calculations & Report Card > Step A: Admin creates an examination and configures subjects
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 3: Examination Results, Calculations & Report Card > Step B: Enter marks for student (Math: 95, Science: 85)
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 3: Examination Results, Calculations & Report Card > Step C: Verify Report Card calculations (Total: 180/200, 90%, Grade: A+, Pass)
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 3: Examination Results, Calculations & Report Card > Rejects invalid marks exceeding maximum marks (Negative test)
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation > Step A: Create a fee invoice with amount $1000
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation > Step B: Record a partial payment of $400 and verify outstanding balance is $600
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation > Step C: Reject payment exceeding the outstanding balance (Negative test)
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation > Step D: Record remaining payment of $600 and verify status changes to PAID ($0 balance)
   ✓ Phase 4: Examination & Fee Management Integration Tests > Scenario 5: Fee Management, Balance Calculations & Ledger Reconciliation > Step E: Verify system-wide fee totals reconcile with payment ledger

 ✓ tests/guardian_reports.test.js (11 tests) 19692ms
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > Guardian 1 can access linked students list (Lucas and Emma Davis)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > Guardian 1 can view linked student (Lucas Davis) attendance, exams and fees
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova profile (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova attendance (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova exams (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > CRITICAL SECURITY: Guardian 1 is DENIED from accessing Alexander Rostova fees (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Scenario 4: Guardian Privacy & Ownership Enforcement > CRITICAL SECURITY: Guardian 1 is DENIED from paying an invoice for another student (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Admin Dashboard Metrics & Reporting > Admin can fetch dashboard overview with aggregated metrics and audit activity
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Admin Dashboard Metrics & Reporting > Admin can fetch class-wise attendance report
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Admin Dashboard Metrics & Reporting > Teacher is FORBIDDEN from accessing admin reports (403 Forbidden)
   ✓ Phase 5: Guardian Privacy & Admin Reports Integration Tests > Admin Dashboard Metrics & Reporting > Guardian is FORBIDDEN from accessing admin reports (403 Forbidden)

Test Files  4 passed (4)
     Tests  43 passed (43)
  Duration  20.77s
```

---

## Acceptance Test Scenarios Verification Matrix

| Scenario | Objective | Status | Evidence File |
| :--- | :--- | :---: | :--- |
| **Scenario 1** | Teacher can access only assigned classes and record roll call; unassigned access blocked | **PASSED** | `tests/academic_attendance.test.js` |
| **Scenario 2** | Duplicate attendance for the same student/session/date safely updated with no duplicate rows | **PASSED** | `tests/academic_attendance.test.js` |
| **Scenario 3** | Exam results calculated on backend from configured grading scale; report card generated | **PASSED** | `tests/exam_fee.test.js` |
| **Scenario 4** | Guardian can only access linked student; cross-student records blocked with 403 Forbidden | **PASSED** | `tests/guardian_reports.test.js` |
| **Scenario 5** | Fee partial payment, remaining payment, overpayment rejection, and ledger reconciliation | **PASSED** | `tests/exam_fee.test.js` |
