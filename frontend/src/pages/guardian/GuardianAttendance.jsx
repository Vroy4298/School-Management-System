import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarCheck } from 'lucide-react';

const GuardianAttendance = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/guardian/my-students');
      if (res.data.success) {
        const list = res.data.data.students;
        setStudents(list);
        if (list.length > 0) setSelectedStudentId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadAttendance(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadAttendance = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/guardian/students/${studentId}/attendance`);
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ABSENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance Records</h1>
          <p className="text-xs text-slate-500">Official daily school attendance log for your child</p>
        </div>

        {students.length > 1 && (
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
            ))}
          </select>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Recorded</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{summary.totalSessions} Sessions</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Present</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{summary.presentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-red-600">Absent</span>
            <p className="text-xl font-bold text-red-600 mt-1">{summary.absentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600">Attendance %</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{summary.attendancePercentage}%</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : !summary || summary.recentRecords?.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No attendance records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.session}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 italic">{r.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianAttendance;
