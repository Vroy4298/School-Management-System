import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  School,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard-overview');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  const { metrics, recentActivities } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Academic Administration Overview</h1>
          <p className="text-xs text-indigo-200 mt-1">
            Real-time operations, attendance monitoring, and financial health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/students"
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Manage Students
          </Link>
          <Link
            to="/admin/attendance"
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            Attendance Logs
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.totalStudents || 0}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Enrolled active learners</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teaching Faculty</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.totalTeachers || 0}</p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">Class/subject instructors</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        {/* Total Classes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Classes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.totalClasses || 0}</p>
            <p className="text-[11px] text-purple-600 font-medium mt-1">{metrics?.totalSubjects || 0} active subjects</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <School className="h-6 w-6" />
          </div>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{metrics?.attendance?.attendancePercentage || 0}%</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {metrics?.attendance?.present || 0} Present / {metrics?.attendance?.absent || 0} Absent
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CalendarCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Fees Collected */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fees Collected</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ${Number(metrics?.fees?.totalFeesCollected || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {metrics?.fees?.collectionRate || 0}% collection efficiency
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Fees Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ${Number(metrics?.fees?.totalFeesOutstanding || 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Pending student invoices</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">System Audit Trail</h3>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View full log <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivities && recentActivities.length > 0 ? (
            recentActivities.map((act) => (
              <div key={act.id} className="px-6 py-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <div>
                    <span className="font-semibold text-slate-800">{act.action}</span>
                    <span className="text-slate-500 ml-2">on {act.entity}</span>
                    {act.details?.name && (
                      <span className="text-slate-600 font-medium ml-1">({act.details.name})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-slate-400">
                  <span>{act.user?.name || act.userRole || 'System'}</span>
                  <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No recent audit events logged.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
