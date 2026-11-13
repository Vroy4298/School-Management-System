# Entity Relationship (ER) Diagram
## School Management System - Relational Database Architecture

```mermaid
erDiagram
    User ||--o| Teacher : "has profile"
    User ||--o| Guardian : "has profile"
    User ||--o{ AuditLog : "initiates"

    Class ||--|{ Section : "contains"
    Class ||--o{ Student : "enrolled in"
    Class ||--o{ FeeStructure : "defines fees for"
    Class ||--o{ TeacherAssignment : "assigned to"
    Class ||--o{ Examination : "scheduled for"

    Section ||--o{ Student : "belongs to"
    Section ||--o{ TeacherAssignment : "assigned to"
    Section ||--o{ Attendance : "recorded for"

    Subject ||--o{ TeacherAssignment : "taught in"
    Subject ||--o{ ExamSubject : "evaluated in"

    Teacher ||--o{ TeacherAssignment : "manages"
    Teacher ||--o{ Attendance : "marks"

    Guardian ||--o{ Student : "cares for (1-to-many)"

    Student ||--o{ Attendance : "has daily records"
    Student ||--o{ ExamResult : "scores"
    Student ||--o{ FeeInvoice : "billed via"
    Student ||--o{ FeePayment : "pays"

    Examination ||--|{ ExamSubject : "configures"
    Examination ||--o{ ExamResult : "produces"
    ExamSubject ||--o{ ExamResult : "grades"

    FeeStructure ||--o{ FeeInvoice : "generates"
    FeeInvoice ||--o{ FeePayment : "settled through"

    User {
        uuid id PK
        string email UK
        string passwordHash
        enum role "ADMIN, TEACHER, GUARDIAN"
        string name
        string phone
        boolean isActive
        datetime createdAt
    }

    Teacher {
        uuid id PK
        uuid userId FK, UK
        string employeeId UK
        string name
        string email
        string phone
        string qualification
    }

    Guardian {
        uuid id PK
        uuid userId FK, UK
        string name
        string email
        string phone
        string address
        string relationship
    }

    Class {
        uuid id PK
        string name UK
        int numericGrade
    }

    Section {
        uuid id PK
        string name
        uuid classId FK
    }

    Subject {
        uuid id PK
        string name
        string code UK
        string description
    }

    TeacherAssignment {
        uuid id PK
        uuid teacherId FK
        uuid classId FK
        uuid sectionId FK
        uuid subjectId FK
        string academicYear
    }

    Student {
        uuid id PK
        string admissionNumber UK
        string firstName
        string lastName
        datetime dob
        string gender
        string address
        uuid classId FK
        uuid sectionId FK
        uuid guardianId FK
    }

    Attendance {
        uuid id PK
        uuid studentId FK
        uuid classId FK
        uuid sectionId FK
        date date
        enum session "MORNING, AFTERNOON, FULL_DAY"
        enum status "PRESENT, ABSENT, LATE"
        uuid markedById FK
        string remarks
    }

    Examination {
        uuid id PK
        string name
        string academicYear
        string term
        uuid classId FK
        datetime startDate
        datetime endDate
    }

    ExamSubject {
        uuid id PK
        uuid examinationId FK
        uuid subjectId FK
        float maxMarks
        float passingMarks
        datetime examDate
    }

    GradingRule {
        uuid id PK
        string grade UK
        float minPercentage
        float maxPercentage
        float gradePoint
        string description
        boolean isPassing
    }

    ExamResult {
        uuid id PK
        uuid examinationId FK
        uuid examSubjectId FK
        uuid studentId FK
        float marksObtained
        boolean isAbsent
        string remarks
    }

    FeeStructure {
        uuid id PK
        string title
        uuid classId FK
        string academicYear
        float amount
        datetime dueDate
    }

    FeeInvoice {
        uuid id PK
        string invoiceNumber UK
        uuid studentId FK
        uuid feeStructureId FK
        string title
        float amount
        datetime dueDate
        enum status "PENDING, PARTIALLY_PAID, PAID"
    }

    FeePayment {
        uuid id PK
        uuid invoiceId FK
        uuid studentId FK
        float amount
        datetime paymentDate
        string paymentMethod
        string transactionRef UK
        string recordedById
        string notes
    }

    AuditLog {
        uuid id PK
        uuid userId FK
        string userRole
        string action
        string entity
        string entityId
        json details
        string ipAddress
        datetime createdAt
    }
```

### Critical Constraints and Integrity Rules
1. **Attendance Uniqueness**: `@@unique([studentId, date, session])` ensures no student has multiple records for the same session on a given date.
2. **Class-Section Uniqueness**: `@@unique([classId, name])` guarantees section uniqueness per class.
3. **Exam Subject Uniqueness**: `@@unique([examinationId, subjectId])` prevents duplicate subject schedules within an exam.
4. **Exam Result Uniqueness**: `@@unique([examinationId, studentId, examSubjectId])` guarantees exact mark attribution per student per subject exam.
5. **Fee Ledger Reconciliation**: `FeePayment.amount` totals per `invoiceId` must strictly equal `FeeInvoice.amount` before transitioning status to `PAID`, with updates prevented from exceeding outstanding balance.

