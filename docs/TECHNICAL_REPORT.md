# Technical Architecture & Engineering Design Report
## School Management System - Full-Stack Assessment
**Author:** Vivek Kumar  
**Company:** ALGIONS AI LABS PRIVATE LIMITED  

---

## 1. Executive Summary
This document provides an in-depth explanation of the technical architecture, design patterns, security controls, and data integrity safeguards implemented in the School Management System. The system is engineered as a robust, database-backed modular monolith using Node.js, Express.js, PostgreSQL (Neon Serverless), Prisma ORM, and React.js with Tailwind CSS.

---

## 2. High-Level Architectural Pattern
The application follows a clean 3-tier layered architecture separating presentation, domain business logic, and data persistence:

```
[ Frontend: React + Tailwind CSS SPA ]
                  |
         HTTPS / JSON REST
                  v
[ Presentation Layer: Express Routes & Controllers ]
                  |
[ Domain Logic: Services & Business Rules ]
                  |
[ Data Access Layer: Prisma ORM Singleton ]
                  |
        PostgreSQL (Neon DB)
```

### Architectural Principles:
1. **Separation of Concerns**: Controllers only handle HTTP translation, request parsing, and response formatting. Business rules (grading calculations, ownership validation, ledger updates) reside exclusively in the `services/` directory.
2. **Server-Side Security Authority**: The client UI is treated as untrusted. Every authorization check, parameter validation, and calculation occurs on the backend.
3. **Database-Level Enforcements**: Critical business constraints (uniqueness, referential integrity, cascade deletions) are pushed to the PostgreSQL database engine to guard against race conditions.

---

## 3. Data Modeling & Critical Constraints

### 3.1 Attendance Concurrency & Idempotency
- **Business Problem**: In real school scenarios, network delays or repeated submissions can cause duplicate roll-call records for the same student on a given date.
- **Architectural Solution**: 
  - Defined a compound unique constraint in Prisma: `@@unique([studentId, date, session])`.
  - Implemented an atomic `upsert` mechanism in `attendanceService.js`. If an entry already exists for `(studentId, date, session)`, PostgreSQL safely updates the status and remarks instead of throwing an unhandled duplicate error or inserting duplicate rows.

### 3.2 Exam Result Attribution
- **Business Problem**: Ensure that exactly one mark record exists per student per subject in an examination.
- **Solution**: Defined `@@unique([examinationId, studentId, examSubjectId])`. Marks entry operations are executed inside Prisma `$transaction` blocks ensuring atomicity.

### 3.3 Fee Ledger & Reconciliation
- **Business Problem**: Prevent overpayments and ensure financial accounts balance.
- **Solution**:
  - Payment transactions are recorded in an append-only `FeePayment` table with unique transaction reference numbers (`TXN-YYYY-XXXX`).
  - An interactive Prisma transaction (`prisma.$transaction(async (tx) => { ... })`) calculates the outstanding balance (`invoice.amount - sum(payments)`).
  - If `paymentAmount > outstandingBalance`, the transaction immediately aborts and returns a `400 Bad Request`.
  - The status transition (`PENDING` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID`) is evaluated dynamically based on cumulative payments.

---

## 4. Security Architecture & Privacy Enforcement

### 4.1 Authentication
- Passwords are encrypted using `bcryptjs` with 10 salt rounds before persistence.
- Stateless authentication is powered by signed JSON Web Tokens (JWT) containing user ID, email, and role claims.
- The `authenticate` middleware inspects the `Authorization: Bearer <token>` header, verifies the signature, and retrieves the active user record.

### 4.2 Role-Based Access Control (RBAC)
- Declarative middleware `authorize('ADMIN', 'TEACHER', ...)` guards routes against unauthorized access.
- Non-admin attempts to access administrative endpoints return `403 Forbidden`.

### 4.3 Guardian Privacy & Ownership Check Algorithm
- **Requirement**: A guardian must never access another student's attendance, examination results, or financial invoices by manipulating IDs in URLs or requests.
- **Implementation**:
  ```javascript
  const verifyOwnership = async (userId, studentId) => {
    const guardian = await prisma.guardian.findUnique({ where: { userId } });
    if (!guardian) throw new UnauthorizedError();

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundError();

    if (student.guardianId !== guardian.id) {
      const error = new Error('Access denied: You are not authorized to view or manage records for this student.');
      error.statusCode = 403;
      throw error;
    }
    return { guardian, student };
  };
  ```
- Every guardian route invokes this verification before querying or mutating student data.

---

## 5. Audit Logging Architecture
To comply with regulatory audit requirements, an audit logging service (`auditService.js`) records every significant operational action:
- `USER_LOGIN` / `USER_LOGOUT`
- `CREATE_STUDENT`, `UPDATE_STUDENT`, `DELETE_STUDENT`
- `CREATE_TEACHER`, `ASSIGN_TEACHER`
- `SUBMIT_ATTENDANCE`
- `CREATE_EXAMINATION`, `ENTER_EXAM_MARKS`
- `GENERATE_FEE_INVOICES`, `RECORD_FEE_PAYMENT`

Each entry captures the initiating `userId`, `userRole`, `action`, `entity`, `entityId`, JSON `details`, client `ipAddress`, and timestamp.

---

## 6. Automated Testing Strategy
Automated testing is configured using **Vitest** and **Supertest**, executing end-to-end integration tests directly against the live PostgreSQL database:
- **Test Suite 1 (`auth.test.js`)**: 12 tests covering login, token verification, negative password checks, input validation, and RBAC route protection.
- **Test Suite 2 (`academic_attendance.test.js`)**: 11 tests verifying Scenario 1 (Teacher assigned vs unassigned classes) and Scenario 2 (Duplicate attendance prevention and safe upserts).
- **Test Suite 3 (`exam_fee.test.js`)**: 9 tests verifying Scenario 3 (Grade and report card calculation) and Scenario 5 (Fee invoices, partial payment, balance verification, overpayment rejection, and ledger reconciliation).
- **Test Suite 4 (`guardian_reports.test.js`)**: 11 tests verifying Scenario 4 (Guardian ownership and cross-student data denial) and admin reporting metrics.
- **Total Coverage**: 43 automated integration tests with 100% pass rate.

