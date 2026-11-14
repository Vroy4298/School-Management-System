import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Plus, Eye, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportCardData, setReportCardData] = useState(null);
  const [selectedExamForReport, setSelectedExamForReport] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [examForm, setExamForm] = useState({
    name: '',
    academicYear: '2026-2027',
    term: 'Term 1',
    classId: '',
    startDate: '',
    endDate: '',
  });

  const [subjectConfigs, setSubjectConfigs] = useState([
    { subjectId: '', maxMarks: 100, passingMarks: 40 },
  ]);

  useEffect(() => {
    fetchInitial();
  }, []);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [eRes, cRes, sRes, stRes] = await Promise.all([
        api.get('/exams'),
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
        api.get('/academic/students?limit=100'),
      ]);
      if (eRes.data.success) setExams(eRes.data.data.examinations);
      if (cRes.data.success) {
        setClasses(cRes.data.data.classes);
        setExamForm((prev) => ({ ...prev, classId: cRes.data.data.classes[0]?.id || '' }));
      }
      if (sRes.data.success) {
        setSubjects(sRes.data.data.subjects);
        setSubjectConfigs([{ subjectId: sRes.data.data.subjects[0]?.id || '', maxMarks: 100, passingMarks: 40 }]);
      }
      if (stRes.data.success) setStudents(stRes.data.data.students);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load examinations');
    } finally {
      setLoading(false);
    }
  };

  const addSubjectRow = () => {
    setSubjectConfigs([
      ...subjectConfigs,
      { subjectId: subjects[0]?.id || '', maxMarks: 100, passingMarks: 40 },
    ]);
  };

  const removeSubjectRow = (index) => {
    setSubjectConfigs(subjectConfigs.filter((_, i) => i !== index));
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/exams', {
        ...examForm,
        subjects: subjectConfigs,
      });
      setSuccess('Examination created with subject schedules.');
      setCreateModal(false);
      fetchInitial();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create examination.');
    }
  };

  const handleOpenReportModal = (exam) => {
    setSelectedExamForReport(exam);
    // Find students belonging to this exam's class
    const classStudents = students.filter((s) => s.classId === exam.classId);
    setSelectedStudentId(classStudents[0]?.id || '');
    setReportCardData(null);
    setReportModal(true);
  };

  const fetchReportCard = async (examId, studentId) => {
    if (!examId || !studentId) return;
    try {
      const res = await api.get(`/exams/${examId}/students/${studentId}/report-card`);
      if (res.data.success) {
        setReportCardData(res.data.data.reportCard);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load report card.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Examinations & Result Reports</h1>
          <p className="text-xs text-slate-500">Configure examination terms, maximum marks, and generate report cards</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Schedule Examination
        </button>
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

      {/* Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {exams.map((exam) => (
          <div key={exam.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{exam.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {exam.class?.name} • {exam.term} ({exam.academicYear})
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenReportModal(exam)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Report Cards
              </button>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between">
              <span>Duration: {new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</span>
              <span className="font-semibold text-slate-700">{exam._count?.examResults || 0} Results Recorded</span>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Configured Subjects ({exam.examSubjects?.length || 0})
              </p>
              <div className="space-y-1.5">
                {exam.examSubjects?.map((es) => (
                  <div key={es.id} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800">{es.subject.name} ({es.subject.code})</span>
                    <span className="text-slate-500 font-mono">
                      Pass: {es.passingMarks} / Max: {es.maxMarks}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Exam Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Schedule New Examination</h3>
              <button onClick={() => setCreateModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateExam} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Examination Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Examination 2026"
                  value={examForm.name}
                  onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={examForm.classId}
                    onChange={(e) => setExamForm({ ...examForm, classId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Term *</label>
                  <input
                    type="text"
                    required
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.startDate}
                    onChange={(e) => setExamForm({ ...examForm, startDate: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={examForm.endDate}
                    onChange={(e) => setExamForm({ ...examForm, endDate: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject Configurations */}
              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">Exam Subjects & Marks</span>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    + Add Subject
                  </button>
                </div>

                <div className="space-y-2">
                  {subjectConfigs.map((cfg, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={cfg.subjectId}
                        onChange={(e) => {
                          const updated = [...subjectConfigs];
                          updated[idx].subjectId = e.target.value;
                          setSubjectConfigs(updated);
                        }}
                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Max"
                        value={cfg.maxMarks}
                        onChange={(e) => {
                          const updated = [...subjectConfigs];
                          updated[idx].maxMarks = e.target.value;
                          setSubjectConfigs(updated);
                        }}
                        className="w-16 text-xs border border-slate-300 rounded px-2 py-1 text-center"
                        title="Maximum Marks"
                      />
                      <input
                        type="number"
                        placeholder="Pass"
                        value={cfg.passingMarks}
                        onChange={(e) => {
                          const updated = [...subjectConfigs];
                          updated[idx].passingMarks = e.target.value;
                          setSubjectConfigs(updated);
                        }}
                        className="w-16 text-xs border border-slate-300 rounded px-2 py-1 text-center"
                        title="Passing Marks"
                      />
                      {subjectConfigs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSubjectRow(idx)}
                          className="text-red-500 hover:text-red-700 px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Save Examination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Card Viewer Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Official Student Report Card: {selectedExamForReport?.name}
              </h3>
              <button onClick={() => setReportModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-semibold text-slate-700">Select Student:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    fetchReportCard(selectedExamForReport.id, e.target.value);
                  }}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none flex-1"
                >
                  {students
                    .filter((s) => s.classId === selectedExamForReport?.classId)
                    .map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.admissionNumber} - {st.firstName} {st.lastName} (Sec {st.section?.name})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => fetchReportCard(selectedExamForReport.id, selectedStudentId)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  Generate Card
                </button>
              </div>

              {reportCardData ? (
                <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
                  {/* Student Header */}
                  <div className="flex justify-between border-b pb-3 text-xs">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{reportCardData.student.name}</h4>
                      <p className="text-slate-500">Adm No: <span className="font-mono font-semibold text-indigo-700">{reportCardData.student.admissionNumber}</span></p>
                      <p className="text-slate-500">Class: {reportCardData.student.class} - {reportCardData.student.section}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase border bg-slate-100 text-slate-800">
                        {reportCardData.summary.passFailStatus}
                      </span>
                      <p className="mt-1 font-bold text-lg text-indigo-600">{reportCardData.summary.overallPercentage}%</p>
                      <p className="text-slate-400 text-[11px]">Grade {reportCardData.summary.grade}</p>
                    </div>
                  </div>

                  {/* Subject Marks Table */}
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-50 text-[11px] font-bold text-slate-600">
                        <th className="py-2 px-3">Subject</th>
                        <th className="py-2 px-3 text-center">Max Marks</th>
                        <th className="py-2 px-3 text-center">Passing</th>
                        <th className="py-2 px-3 text-center">Marks Scored</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportCardData.subjectBreakdown.map((sb, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-semibold text-slate-800">{sb.subjectName}</td>
                          <td className="py-2 px-3 text-center">{sb.maxMarks}</td>
                          <td className="py-2 px-3 text-center text-slate-500">{sb.passingMarks}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">
                            {sb.marksObtained !== null ? sb.marksObtained : 'Pending'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sb.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {sb.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t font-bold bg-slate-50 text-slate-900">
                        <td className="py-2 px-3">Total Aggregate</td>
                        <td className="py-2 px-3 text-center">{reportCardData.summary.totalMaxMarks}</td>
                        <td className="py-2 px-3 text-center">-</td>
                        <td className="py-2 px-3 text-center text-indigo-700">{reportCardData.summary.totalObtainedMarks}</td>
                        <td className="py-2 px-3 text-center text-indigo-700">{reportCardData.summary.grade} ({reportCardData.summary.overallPercentage}%)</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Select a student above and click "Generate Card" to view their full report card.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;

