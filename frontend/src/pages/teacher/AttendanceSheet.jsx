import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { CalendarCheck, CheckCircle, AlertCircle, X, Users, Save } from 'lucide-react';

const AttendanceSheet = () => {
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [session, setSession] = useState('FULL_DAY');

  const [studentRecords, setStudentRecords] = useState([]);
  const [previouslyRecorded, setPreviouslyRecorded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/academic/teachers/my-assignments');
      if (res.data.success) {
        const asgns = res.data.data.assignments;
        setAssignments(asgns);

        const paramClass = searchParams.get('classId');
        const paramSection = searchParams.get('sectionId');

        if (paramClass) {
          setSelectedClassId(paramClass);
          setSelectedSectionId(paramSection || '');
        } else if (asgns.length > 0) {
          setSelectedClassId(asgns[0].classId);
          setSelectedSectionId(asgns[0].sectionId || asgns[0].class?.sections?.[0]?.id || '');
        }
      }
    } catch (err) {
      setError('Failed to fetch assigned classes.');
    }
  };

  useEffect(() => {
    if (selectedClassId && selectedSectionId) {
      loadStudents();
    }
  }, [selectedClassId, selectedSectionId, date, session]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.get(
        `/attendance/class-students?classId=${selectedClassId}&sectionId=${selectedSectionId}&date=${date}&session=${session}`
      );
      if (res.data.success) {
        setStudentRecords(res.data.data.students);
        setPreviouslyRecorded(res.data.data.previouslyRecorded);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class students.');
      setStudentRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (studentId, newStatus) => {
    setStudentRecords((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const updateRemarks = (studentId, remarks) => {
    setStudentRecords((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
  };

  const markAllPresent = () => {
    setStudentRecords((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' })));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (studentRecords.length === 0) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date,
        session,
        records: studentRecords.map((s) => ({
          studentId: s.studentId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      const res = await api.post('/attendance/submit', payload);
      if (res.data.success) {
        setSuccess('Attendance submitted successfully! Existing records were safely updated without duplicates.');
        setPreviouslyRecorded(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  // Distinct classes and sections from teacher assignments
  const assignedClassOptions = Array.from(
    new Map(assignments.map((a) => [a.classId, a.class])).values()
  ).filter(Boolean);

  const selectedClassAssignments = assignments.filter((a) => a.classId === selectedClassId);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mark Attendance Sheet</h1>
          <p className="text-xs text-slate-500">Record daily roll call for your verified assigned classrooms</p>
        </div>
        {studentRecords.length > 0 && (
          <button
            type="button"
            onClick={markAllPresent}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            Mark All as Present
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2"><AlertCircle className="h-4 w-4" /><span>{error}</span></div>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4" /><span>{success}</span></div>
          <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Class *</label>
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const matching = assignments.find((a) => a.classId === e.target.value);
              setSelectedSectionId(matching?.sectionId || '');
            }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {assignedClassOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Assigned Section *</label>
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {selectedClassAssignments.map((a) => (
              <option key={a.id} value={a.sectionId || ''}>
                {a.section ? `Section ${a.section.name}` : 'All Sections'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Attendance Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="FULL_DAY">Full Day</option>
            <option value="MORNING">Morning Session</option>
            <option value="AFTERNOON">Afternoon Session</option>
          </select>
        </div>
      </div>

      {previouslyRecorded && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center space-x-2">
          <CalendarCheck className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span>Attendance has already been recorded for this date. Modifying and submitting will safely update the existing records.</span>
        </div>
      )}

      {/* Roll Call Student List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : studentRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students found in this class/section.
          </div>
        ) : (
          <form onSubmit={handleSubmitAttendance}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Adm No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentRecords.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{st.admissionNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.studentName}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => updateStatus(st.studentId, 'PRESENT')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              st.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(st.studentId, 'ABSENT')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              st.status === 'ABSENT'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(st.studentId, 'LATE')}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              st.status === 'LATE'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional remarks"
                          value={st.remarks || ''}
                          onChange={(e) => updateRemarks(st.studentId, e.target.value)}
                          className="w-full max-w-xs text-xs border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total: <span className="font-semibold text-slate-900">{studentRecords.length} students</span> •{' '}
                Present: <span className="font-semibold text-emerald-600">{studentRecords.filter((s) => s.status === 'PRESENT').length}</span> •{' '}
                Absent: <span className="font-semibold text-red-600">{studentRecords.filter((s) => s.status === 'ABSENT').length}</span> •{' '}
                Late: <span className="font-semibold text-amber-600">{studentRecords.filter((s) => s.status === 'LATE').length}</span>
              </span>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {submitting ? 'Saving...' : previouslyRecorded ? 'Update Roll Call' : 'Submit Roll Call'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AttendanceSheet;

