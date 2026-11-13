import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { User, CalendarCheck, Award, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';

const GuardianDashboard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/guardian/my-students');
      if (res.data.success) {
        const studentList = res.data.data.students;
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your linked students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadStudentData(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadStudentData = async (studentId) => {
    try {
      const [attRes, feeRes] = await Promise.all([
        api.get(`/guardian/students/${studentId}/attendance`),
        api.get(`/guardian/students/${studentId}/fees`),
      ]);
      if (attRes.data.success) setAttendanceSummary(attRes.data.data);
      if (feeRes.data.success) setFeeSummary(feeRes.data.data.summary);
    } catch (err) {
      console.error(err);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Student Selector Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Guardian Portal • Strict Privacy Protected</span>
          </div>
          <h1 className="text-xl font-bold">
            {currentStudent ? `${currentStudent.firstName} ${currentStudent.lastName}` : 'Guardian Dashboard'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {currentStudent ? `Admission No: ${currentStudent.admissionNumber} • ${currentStudent.class?.name} - Section ${currentStudent.section?.name}` : ''}
          </p>
        </div>

        {students.length > 1 && (
          <div className="flex items-center space-x-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
            <span className="text-xs text-emerald-200 font-semibold pl-2">Switch Student:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="text-xs bg-slate-900 text-white border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.class?.name})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Profile Details Card */}
      {currentStudent && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">{currentStudent.firstName} {currentStudent.lastName}</h2>
              <p className="text-xs text-slate-500">Gender: {currentStudent.gender} • DOB: {new Date(currentStudent.dob).toLocaleDateString()}</p>
              <p className="text-xs text-slate-400 mt-0.5">{currentStudent.address || 'Address on file'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Enrolled Class</span>
              <span className="font-bold text-slate-800">{currentStudent.class?.name}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">Class Section</span>
              <span className="font-bold text-slate-800">Section {currentStudent.section?.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3 Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Attendance Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {attendanceSummary ? `${attendanceSummary.attendancePercentage}%` : '--'}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${attendanceSummary?.attendancePercentage || 0}%` }}
            ></div>
          </div>
          <div className="pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              {attendanceSummary ? `${attendanceSummary.presentCount} Days Present` : ''}
            </span>
            <Link
              to="/guardian/attendance"
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center"
            >
              Logs <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Academic Results */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Examinations</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">Report Cards</p>
          <p className="text-xs text-slate-500">View official term exam grades, percentage, and report card.</p>
          <div className="pt-2 flex justify-end text-xs">
            <Link
              to="/guardian/reports"
              className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View Report Cards <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        </div>

        {/* Fee Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Fees</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {feeSummary ? `$${feeSummary.totalOutstanding.toFixed(2)}` : '--'}
          </p>
          <p className="text-xs text-slate-500">
            Total Paid: <span className="font-semibold text-emerald-600">${feeSummary?.totalPaid.toFixed(2) || '0.00'}</span>
          </p>
          <div className="pt-2 flex justify-end text-xs">
            <Link
              to="/guardian/fees"
              className="font-semibold text-emerald-600 hover:text-emerald-800 flex items-center"
            >
              Pay & View Invoices <ArrowRight className="h-3 w-3 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianDashboard;
