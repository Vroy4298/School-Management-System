import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Public Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import GuardianManagement from './pages/admin/GuardianManagement';
import ClassManagement from './pages/admin/ClassManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import AttendanceOverview from './pages/admin/AttendanceOverview';
import ExamManagement from './pages/admin/ExamManagement';
import FeeManagement from './pages/admin/FeeManagement';
import AuditLogs from './pages/admin/AuditLogs';

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AttendanceSheet from './pages/teacher/AttendanceSheet';
import MarksEntry from './pages/teacher/MarksEntry';

// Guardian Pages
import GuardianDashboard from './pages/guardian/GuardianDashboard';
import GuardianAttendance from './pages/guardian/GuardianAttendance';
import GuardianReportCard from './pages/guardian/GuardianReportCard';
import GuardianFees from './pages/guardian/GuardianFees';

const HomeRedirect = () => {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
  if (user.role === 'GUARDIAN') return <Navigate to="/guardian" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<Layout title="Administrator Workspace" />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentManagement />} />
              <Route path="/admin/teachers" element={<TeacherManagement />} />
              <Route path="/admin/guardians" element={<GuardianManagement />} />
              <Route path="/admin/classes" element={<ClassManagement />} />
              <Route path="/admin/subjects" element={<SubjectManagement />} />
              <Route path="/admin/attendance" element={<AttendanceOverview />} />
              <Route path="/admin/exams" element={<ExamManagement />} />
              <Route path="/admin/fees" element={<FeeManagement />} />
              <Route path="/admin/audit" element={<AuditLogs />} />
            </Route>
          </Route>

          {/* Teacher Routes */}
          <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
            <Route element={<Layout title="Faculty & Teacher Portal" />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/attendance" element={<AttendanceSheet />} />
              <Route path="/teacher/marks" element={<MarksEntry />} />
            </Route>
          </Route>

          {/* Guardian / Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['GUARDIAN']} />}>
            <Route element={<Layout title="Guardian & Student Portal" />}>
              <Route path="/guardian" element={<GuardianDashboard />} />
              <Route path="/guardian/attendance" element={<GuardianAttendance />} />
              <Route path="/guardian/reports" element={<GuardianReportCard />} />
              <Route path="/guardian/fees" element={<GuardianFees />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
