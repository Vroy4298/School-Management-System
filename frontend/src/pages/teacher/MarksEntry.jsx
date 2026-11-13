import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Save, CheckCircle, AlertCircle, X } from 'lucide-react';

const MarksEntry = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedExamSubjectId, setSelectedExamSubjectId] = useState('');

  const [examData, setExamData] = useState(null);
  const [marksList, setMarksList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        const examList = res.data.data.examinations;
        setExams(examList);
        if (examList.length > 0) {
          setSelectedExamId(examList[0].id);
          if (examList[0].examSubjects?.length > 0) {
            setSelectedExamSubjectId(examList[0].examSubjects[0].id);
          }
        }
      }
    } catch (err) {
      setError('Failed to load examinations.');
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  useEffect(() => {
    if (selectedExam && selectedExam.examSubjects?.length > 0) {
      if (!selectedExam.examSubjects.some((s) => s.id === selectedExamSubjectId)) {
        setSelectedExamSubjectId(selectedExam.examSubjects[0].id);
      }
    }
  }, [selectedExamId]);

  useEffect(() => {
    if (selectedExamId && selectedExamSubjectId) {
      loadMarksSheet();
    }
  }, [selectedExamId, selectedExamSubjectId]);

  const loadMarksSheet = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const res = await api.get(`/exams/${selectedExamId}/subjects/${selectedExamSubjectId}/students`);
      if (res.data.success) {
        setExamData(res.data.data);
        setMarksList(
          res.data.data.students.map((st) => ({
            studentId: st.studentId,
            admissionNumber: st.admissionNumber,
            studentName: st.studentName,
            section: st.section,
            marksObtained: st.marksObtained !== null ? st.marksObtained : '',
            isAbsent: st.isAbsent || false,
            remarks: st.remarks || '',
          }))
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load marks entry sheet.');
      setMarksList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
    setMarksList((prev) =>
      prev.map((m) => (m.studentId === studentId ? { ...m, marksObtained: value } : m))
    );
  };

  const handleAbsentToggle = (studentId, isAbsent) => {
    setMarksList((prev) =>
      prev.map((m) =>
        m.studentId === studentId
          ? { ...m, isAbsent, marksObtained: isAbsent ? 0 : m.marksObtained }
          : m
      )
    );
  };

  const handleRemarksChange = (studentId, remarks) => {
    setMarksList((prev) =>
      prev.map((m) => (m.studentId === studentId ? { ...m, remarks } : m))
    );
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    const maxMarks = examData?.examSubject?.maxMarks || 100;
    for (const item of marksList) {
      if (!item.isAbsent && item.marksObtained !== '') {
        const val = Number(item.marksObtained);
        if (isNaN(val) || val < 0 || val > maxMarks) {
          setError(`Invalid marks for ${item.studentName}: must be between 0 and maximum marks (${maxMarks}).`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        marksList: marksList
          .filter((m) => m.marksObtained !== '' || m.isAbsent)
          .map((m) => ({
            studentId: m.studentId,
            marksObtained: m.isAbsent ? 0 : Number(m.marksObtained),
            isAbsent: m.isAbsent,
            remarks: m.remarks,
          })),
      };

      const res = await api.post(
        `/exams/${selectedExamId}/subjects/${selectedExamSubjectId}/marks`,
        payload
      );
      if (res.data.success) {
        setSuccess('Exam marks recorded and calculated successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Examination Marks Entry</h1>
          <p className="text-xs text-slate-500">Input student assessment scores for your assigned subjects</p>
        </div>
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

      {/* Selector Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Examination *</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.class?.name} - {exam.term})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">Select Subject *</label>
          <select
            value={selectedExamSubjectId}
            onChange={(e) => setSelectedExamSubjectId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            {selectedExam?.examSubjects?.map((es) => (
              <option key={es.id} value={es.id}>
                {es.subject.name} (Max: {es.maxMarks}, Passing: {es.passingMarks})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : marksList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No students enrolled for this examination.
          </div>
        ) : (
          <form onSubmit={handleSaveMarks}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Adm No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Section</th>
                    <th className="py-3 px-4">Absent?</th>
                    <th className="py-3 px-4">
                      Marks Obtained (Max: {examData?.examSubject?.maxMarks})
                    </th>
                    <th className="py-3 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marksList.map((st) => (
                    <tr key={st.studentId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{st.admissionNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{st.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">Sec {st.section}</td>
                      <td className="py-3 px-4">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={st.isAbsent}
                            onChange={(e) => handleAbsentToggle(st.studentId, e.target.checked)}
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4"
                          />
                          <span className="text-[11px] text-slate-600 font-medium">Absent</span>
                        </label>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.5"
                          disabled={st.isAbsent}
                          placeholder={`0 - ${examData?.examSubject?.maxMarks}`}
                          max={examData?.examSubject?.maxMarks}
                          value={st.marksObtained}
                          onChange={(e) => handleMarkChange(st.studentId, e.target.value)}
                          className="w-24 text-xs border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="Optional feedback"
                          value={st.remarks}
                          onChange={(e) => handleRemarksChange(st.studentId, e.target.value)}
                          className="w-full max-w-xs text-xs border border-slate-300 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Passing Marks Threshold:{' '}
                <span className="font-bold text-indigo-700">{examData?.examSubject?.passingMarks} marks</span>
              </span>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? 'Saving Marks...' : 'Save All Marks'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;
