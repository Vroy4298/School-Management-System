# School Management System

A production-ready, full-stack School Management System built for the internship assessment at **ALGIONS AI LABS PRIVATE LIMITED**.

The system features robust role-based access control, strict server-side authorization, database-level concurrency safeguards, automated attendance upserts, academic grading calculations, and financial fee ledger reconciliation.

---

## 1. Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React.
- **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Prisma ORM.
- **Database**: PostgreSQL (Neon Serverless PostgreSQL).
- **Testing**: Vitest, Supertest.
- **Language**: JavaScript (ESM on frontend, CommonJS on backend).

---

## 2. System Architecture

The application is engineered as a **modular monolith** with clean 3-tier layering:

```
[ Frontend: React + Tailwind CSS SPA ]
                  │
        HTTPS / RESTful JSON
                  ▼
[ API Layer: Express Routes, Controllers & Middleware ]
                  │
[ Business Domain: Services, Calculations & Ownership Checks ]
                  │
[ Data Access Layer: Prisma ORM Singleton with Transactions ]
                  │
        PostgreSQL Database
```

### Architecture Highlights:
- **Authentication**: JWT tokens stored securely on the client and validated on every request.
- **Role-Based Access Control (RBAC)**: Strict server-side middleware (`authorize('ADMIN', ...)`) guards all private endpoints.
- **Guardian Privacy Safeguards**: Ownership check algorithm verifies that a guardian can never access or settle invoices for an unlinked student.
- **Safe Upserts**: Attendance submissions use a composite database unique constraint `@@unique([studentId, date, session])` to prevent duplicate roll-call records.
- **Ledger Reconciliation**: Invoices and payments calculate outstanding balances in real time and reject payments exceeding remaining dues.

---

## 3. Repository Folder Structure

```text
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 17 Relational database models and constraints
│   │   └── seed.js             # Repeatable seed script with demo data
│   ├── src/
│   │   ├── config/             # Prisma client singleton
│   │   ├── controllers/        # Request parsing and HTTP responses
│   │   ├── middleware/         # JWT auth, RBAC guards, centralized error handling
│   │   ├── routes/             # RESTful API route definitions
│   │   ├── services/           # Domain business logic and calculation services
│   │   ├── utils/              # Standardized API response formatters & JWT helpers
│   │   ├── app.js              # Express app setup and static SPA fallback
│   │   └── server.js           # HTTP server bootstrap
│   ├── tests/                  # Automated integration tests
│   │   ├── auth.test.js
│   │   ├── academic_attendance.test.js
│   │   ├── exam_fee.test.js
│   │   └── guardian_reports.test.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Sidebar, Navbar, ProtectedRoute, Layout
│   │   ├── context/            # AuthContext (persistent login & logout)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin Dashboard, Students, Teachers, Classes, Exams, Fees, Audit
│   │   │   ├── teacher/        # Teacher Dashboard, Roll Call Sheet, Marks Entry
│   │   │   ├── guardian/       # Student Profile, Attendance, Report Cards, Fees & Payments
│   │   │   └── Login.jsx       # Login page with 1-click demo buttons
│   │   ├── services/           # Axios client with interceptors
│   │   ├── App.jsx             # React Router configuration
│   │   └── main.jsx
│   ├── .env.example
│   ├── tailwind.config.js
│   └── package.json
├── docs/
│   ├── ERD.md                  # Entity Relationship Diagram & constraint documentation
│   ├── API.md                  # Full REST API specification
│   ├── TECHNICAL_REPORT.md     # Architecture and engineering design report
│   └── TEST_RESULTS.md         # Automated test execution evidence
├── .gitignore
└── README.md
```

---

## 4. Demo Login Credentials

The database comes pre-seeded with accounts for all three user roles. The login screen also includes **One-Click Demo buttons** for rapid evaluation:

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@school.com` | `Admin@123` | Full school administration, faculty assignment, exam setup, fee invoices, audit trail. |
| **Teacher** | `teacher@school.com` | `Teacher@123` | Assigned to Grade 10-A (Mathematics). Marks roll call and enters exam scores. |
| **Teacher 2**| `teacher2@school.com`| `Teacher@123` | Assigned to Grade 10-A (English Language). |
| **Guardian** | `guardian@school.com`| `Guardian@123`| Guardian of Lucas Davis (Grade 10-A) and Emma Davis (Grade 9-A). |
| **Guardian 2**| `guardian2@school.com`| `Guardian@123`| Guardian of Alexander Rostova (Grade 10-A). |

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher
- **PostgreSQL**: A running instance (or free cloud PostgreSQL connection string from [Neon.tech](https://neon.tech))

---

## 6. Local Installation & Setup Instructions

### Step 1: Clone the Repository
```bash
git clone https://github.com/Vroy4298/School-Management-System.git
cd School-Management-System
```

### Step 2: Configure Environment Variables
Inside `backend/`, copy the example file and configure your PostgreSQL database connection:
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"
JWT_SECRET="algions_school_mgmt_secret_jwt_key_2026_dev"
JWT_EXPIRES_IN="1d"
```

Inside `frontend/`, configure `.env`:
```bash
cd ../frontend
cp .env.example .env
```
Default content:
```env
VITE_API_URL=/api
```

### Step 3: Install Dependencies
```bash
# Install backend dependencies
cd ../backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 4: Run Database Migrations & Seed Data
```bash
cd ../backend

# Push schema models and constraints to PostgreSQL
npm run prisma:push

# Populate database with repeatable demo data
npm run prisma:seed
```

---

## 7. Running the Application

### Option A: Development Mode (Hot Reloading)

1. **Start Backend API** (Port 5000):
   ```bash
   cd backend
   npm run dev
   ```
2. **Start Frontend Dev Server** (Port 5173):
   ```bash
   cd frontend
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

### Option B: Unified Production Mode (Single Port 5000)

The backend Express server is configured to serve the built frontend SPA from `frontend/dist`:
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
npm start
```
Open your browser at `http://localhost:5000`.

---

## 8. Running Automated Tests

Run the comprehensive integration test suite verifying authentication, RBAC, attendance upserts, exam grading, guardian privacy, and fee reconciliations:

```bash
cd backend
npm test
```

### Verified Acceptance Scenarios (43/43 Tests Passing):
- **Scenario 1 (Teacher Attendance)**: Teacher can only access and submit roll call for assigned classrooms; unassigned classes return `403 Forbidden`.
- **Scenario 2 (Duplicate Attendance)**: Re-submitting roll call for the same student on the same date safely updates the record; no duplicate rows created.
- **Scenario 3 (Exam Results)**: Calculates aggregate marks, percentages, letter grades ($A+$ to $F$), and Pass/Fail status.
- **Scenario 4 (Guardian Privacy)**: Guardians can only view their linked children; cross-student data and payment attempts are strictly rejected with `403 Forbidden`.
- **Scenario 5 (Fee Management)**: Partial payments, remaining balance payments, rejection of payments exceeding balance, and ledger reconciliation.

Detailed test execution logs are available in [docs/TEST_RESULTS.md](file:///e:/ALIGONS%20ASSIGNMENT/docs/TEST_RESULTS.md).

---

## 9. Documentation References

- **Database ER Diagram & Schema Details**: [docs/ERD.md](file:///e:/ALIGONS%20ASSIGNMENT/docs/ERD.md)
- **Complete REST API Specification**: [docs/API.md](file:///e:/ALIGONS%20ASSIGNMENT/docs/API.md)
- **Technical Architecture Report**: [docs/TECHNICAL_REPORT.md](file:///e:/ALIGONS%20ASSIGNMENT/docs/TECHNICAL_REPORT.md)
- **Test Results & Evidence**: [docs/TEST_RESULTS.md](file:///e:/ALIGONS%20ASSIGNMENT/docs/TEST_RESULTS.md)

---

## 10. Known Limitations & Production Roadmap

1. **Payment Gateway**: Financial settlements use a simulated transaction engine for assessment purposes. Integrating real gateways (Stripe, Razorpay) would replace the simulated controller with webhook listeners.
2. **Email Notifications**: Currently, password credentials and notifications are recorded via the audit trail rather than dispatched via SMTP (SendGrid, AWS SES).
3. **Document Attachments**: Student medical documents or physical fee receipts are stored as text remarks rather than binary uploads in S3/Cloudinary.
