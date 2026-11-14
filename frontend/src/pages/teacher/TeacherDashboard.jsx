import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { GraduationCap, CalendarCheck, Award, ArrowRight, School, BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/teachers/my-assignments');
      if (res.data.success) {
        setAssignments(res.data.data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-xs text-blue-200 mt-1">
            Faculty Portal: Employee ID <span className="font-mono font-bold">{user?.teacherProfile?.employeeId || 'TCH'}</span>
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/teacher/attendance"
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Mark Daily Attendance
          </Link>
          <Link
            to="/teacher/marks"
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            Enter Exam Marks
          </Link>
        </div>
      </div>

      {/* Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link
          to="/teacher/attendance"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Class Attendance Roll Call
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Take daily student roll call for your assigned classes
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          to="/teacher/marks"
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Examination Marks Entry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Input subject marks for midterm and final assessments
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>
      </div>

      {/* Assigned Classes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <School className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Your Assigned Classes & Subjects</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">{assignments.length} assignments</span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">No active teaching assignments found. Contact the Administrator.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((asgn) => (
              <div key={asgn.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{asgn.class?.name}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-semibold text-[10px] rounded">
                    Sec {asgn.section?.name || 'All'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-600 space-x-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span>{asgn.subject?.name || 'Class Teacher'}</span>
                </div>
                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/teacher/attendance?classId=${asgn.classId}&sectionId=${asgn.sectionId || ''}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Take Roll Call →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;

