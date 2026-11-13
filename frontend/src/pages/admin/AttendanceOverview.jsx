import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarCheck, Filter, Search, UserCheck } from 'lucide-react';

const AttendanceOverview = () => {
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [classFilter, sectionFilter, dateFilter]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      if (res.data.success) setClasses(res.data.data.classes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = '/attendance/records?limit=100';
      if (classFilter) query += `&classId=${classFilter}`;
      if (sectionFilter) query += `&sectionId=${sectionFilter}`;
      if (dateFilter) query += `&date=${dateFilter}`;

      const res = await api.get(query);
      if (res.data.success) {
        setRecords(res.data.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c.id === classFilter);

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
          <h1 className="text-xl font-bold text-slate-900">Attendance Monitoring</h1>
          <p className="text-xs text-slate-500">View real-time daily attendance logs and class roll calls</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Class</label>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setSectionFilter('');
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Section</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!classFilter}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100"
          >
            <option value="">All Sections</option>
            {selectedClass?.sections.map((s) => (
              <option key={s.id} value={s.id}>Section {s.name}</option>
            ))}
          </select>
        </div>

        {(classFilter || sectionFilter || dateFilter) && (
          <div className="pt-4">
            <button
              onClick={() => {
                setClassFilter('');
                setSectionFilter('');
                setDateFilter('');
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarCheck className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No attendance records found</p>
            <p className="text-xs text-slate-400 mt-1">Select a different date or class filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Adm No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Session</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Marked By</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{r.student.admissionNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.student.firstName} {r.student.lastName}</td>
                    <td className="py-3 px-4 text-slate-600">Sec {r.section?.name}</td>
                    <td className="py-3 px-4 text-slate-500">{r.session}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{r.markedBy?.name || 'Admin'}</td>
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

export default AttendanceOverview;
