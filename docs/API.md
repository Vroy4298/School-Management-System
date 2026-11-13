# School Management System - REST API Documentation

This document provides a comprehensive reference for all REST API endpoints implemented in the School Management System backend.

## Base URL
- Local Development: `http://localhost:5000/api`
- Production: `https://<your-backend-host>/api`

## Authentication
Protected endpoints require an `Authorization` header formatted as:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication Endpoints

### 1.1 User Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@school.com",
    "password": "Admin@123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid",
        "email": "admin@school.com",
        "name": "Dr. Arthur Pendelton (Admin)",
        "role": "ADMIN",
        "teacherProfile": null,
        "guardianProfile": null
      }
    }
  }
  ```

### 1.2 Get Current User Profile
- **Endpoint**: `GET /api/auth/me`
- **Access**: Authenticated (`ADMIN`, `TEACHER`, `GUARDIAN`)
- **Success Response (200 OK)**: Returns the current user profile with role-specific records.

### 1.3 User Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Authenticated
- **Success Response (200 OK)**: Discards session and records audit event.

---

## 2. Academic Administration Endpoints

### 2.1 Classes & Sections
- `GET /api/academic/classes` - List all classes with section details and student counts.
- `POST /api/academic/classes` - Create a new class (Admin only).
  - Body: `{ "name": "Grade 11", "numericGrade": 11, "sections": ["A", "B"] }`
- `POST /api/academic/classes/:classId/sections` - Add a section under a class (Admin only).
  - Body: `{ "name": "C" }`
- `DELETE /api/academic/classes/:classId` - Delete class (Admin only).

### 2.2 Subjects
- `GET /api/academic/subjects` - List all subjects.
- `POST /api/academic/subjects` - Create a subject (Admin only).
  - Body: `{ "name": "Computer Science", "code": "CS101", "description": "Programming & algorithms" }`
- `PUT /api/academic/subjects/:id` - Edit subject (Admin only).
- `DELETE /api/academic/subjects/:id` - Delete subject (Admin only).

### 2.3 Teachers & Assignments
- `GET /api/academic/teachers` - List faculty members (Admin only).
- `POST /api/academic/teachers` - Create faculty member (Admin only).
  - Body: `{ "name": "Robert Vance", "email": "robert@school.com", "phone": "+1-555-0102", "qualification": "M.A. English" }`
- `POST /api/academic/teachers/assign` - Assign teacher to class/section/subject (Admin only).
  - Body: `{ "teacherId": "uuid", "classId": "uuid", "sectionId": "uuid", "subjectId": "uuid" }`
- `DELETE /api/academic/teachers/assign/:assignmentId` - Remove assignment (Admin only).
- `GET /api/academic/teachers/my-assignments` - Get currently logged-in teacher's verified assignments (Teacher only).

### 2.4 Students & Guardians
- `GET /api/academic/students` - Query students with search, class filter, section filter, and pagination (Admin, Teacher).
- `GET /api/academic/students/:id` - Get student details.
- `POST /api/academic/students` - Enroll new student (Admin only).
  - Body: `{ "firstName": "Lucas", "lastName": "Davis", "admissionNumber": "ADM-2026-001", "dob": "2011-04-12", "gender": "MALE", "classId": "uuid", "sectionId": "uuid", "guardianId": "uuid" }`
- `PUT /api/academic/students/:id` - Update student profile (Admin only).
- `DELETE /api/academic/students/:id` - Delete student (Admin only).
- `GET /api/academic/guardians` - List guardians and linked students (Admin only).
- `POST /api/academic/guardians` - Create guardian account (Admin only).

---

## 3. Attendance Management Endpoints

### 3.1 Class Attendance Roll Call
- **Endpoint**: `GET /api/attendance/class-students`
- **Access**: `ADMIN`, `TEACHER` (verified against teacher assignments)
- **Query Parameters**:
  - `classId`: Target class ID.
  - `sectionId`: Target section ID.
  - `date`: Attendance date (YYYY-MM-DD).
  - `session`: `FULL_DAY`, `MORNING`, `AFTERNOON`.
- **Response**: List of students in the class with their current status (`PRESENT`, `ABSENT`, `LATE`).

### 3.2 Submit / Update Attendance (Safe Upsert)
- **Endpoint**: `POST /api/attendance/submit`
- **Access**: `ADMIN`, `TEACHER`
- **Business Rule**: Enforces database composite key `(studentId, date, session)` to eliminate duplicates and safely update existing records.
- **Request Body**:
  ```json
  {
    "classId": "uuid",
    "sectionId": "uuid",
    "date": "2026-11-20",
    "session": "FULL_DAY",
    "records": [
      {
        "studentId": "uuid",
        "status": "PRESENT",
        "remarks": "On time"
      }
    ]
  }
  ```

### 3.3 Attendance History & Student Summaries
- `GET /api/attendance/records` - Filter attendance records across classes and dates.
- `GET /api/attendance/student/:studentId/summary` - Computes total sessions, days present, absent, late, and attendance percentage.

---

## 4. Examination & Results Management

### 4.1 Examination Setup
- `GET /api/exams` - List all examinations.
- `POST /api/exams` - Create an examination with subject schedules (Admin only).
  - Body:
    ```json
    {
      "name": "Midterm Examination 2026",
      "academicYear": "2026-2027",
      "term": "Term 1",
      "classId": "uuid",
      "startDate": "2026-10-01",
      "endDate": "2026-10-10",
      "subjects": [
        { "subjectId": "uuid", "maxMarks": 100, "passingMarks": 40 }
      ]
    }
    ```
- `GET /api/exams/grading/rules` - View grading rules ($A+, A, B, C, D, F$).

### 4.2 Marks Entry
- `GET /api/exams/:id/subjects/:examSubjectId/students` - Get student roll for marks entry (verifies teacher assignment).
- `POST /api/exams/:id/subjects/:examSubjectId/marks` - Save student scores (validates $0 \le marks \le maxMarks$).

### 4.3 Report Card Calculation
- `GET /api/exams/:id/students/:studentId/report-card` - Generates calculated report card containing subject breakdown, total max marks, total obtained, percentage, letter grade, and pass/fail status.

---

## 5. Fee Management & Ledger Endpoints

### 5.1 Fee Structures & Invoicing
- `GET /api/fees/structures` - List class fee structures.
- `POST /api/fees/structures` - Define class fee structure (Admin only).
- `POST /api/fees/invoices/generate` - Generate fee invoices for students or bulk class (Admin only).
- `GET /api/fees/invoices` - Query fee invoices with status filters (`PENDING`, `PARTIALLY_PAID`, `PAID`).
- `GET /api/fees/invoices/:id` - Get invoice details with payment breakdown.

### 5.2 Simulated Payment Recording
- **Endpoint**: `POST /api/fees/invoices/:id/pay`
- **Access**: `ADMIN`, `GUARDIAN`
- **Business Rule**: Validates that payment amount does not exceed the remaining outstanding balance.
- **Request Body**:
  ```json
  {
    "amount": 500.00,
    "paymentMethod": "ONLINE_SIMULATED",
    "notes": "Online installment"
  }
  ```
- **Response**: Returns generated payment receipt with unique transaction ref (`TXN-2026-XXXX`) and updated invoice balance.

### 5.3 Ledger Reconciliation
- `GET /api/fees/ledger/reconciliation` - Validates `Total Invoiced === Total Collected + Total Outstanding`.

---

## 6. Guardian Privacy Endpoints

### 6.1 Linked Students
- `GET /api/guardian/my-students` - Lists only students linked to the authenticated guardian.

### 6.2 Student Records (Strict Ownership Protected)
- `GET /api/guardian/students/:studentId` - Profile details.
- `GET /api/guardian/students/:studentId/attendance` - Attendance history and percentage.
- `GET /api/guardian/students/:studentId/exams` - Published report cards.
- `GET /api/guardian/students/:studentId/fees` - Fee invoices, ledger, and balance.
- `POST /api/guardian/invoices/:invoiceId/pay` - Submit simulated fee payment for linked student.
- **Security Check**: Attempting to query an unlinked student ID returns `403 Forbidden`.

---

## 7. Reports & System Audit Trail

- `GET /api/reports/dashboard-overview` - Real-time operational metrics and recent activities (Admin only).
- `GET /api/reports/class-attendance` - Class-wise attendance breakdown (Admin only).
- `GET /api/reports/exam-performance/:examinationId` - Subject pass rates and grade statistics (Admin only).
- `GET /api/audit` - Paginated audit logs with action, entity, user, details, and IP address (Admin only).
