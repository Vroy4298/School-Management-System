import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, FileText } from 'lucide-react';

const GuardianReportCard = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [examData, setExamData] = useState(null);
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
      loadReportCards(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadReportCards = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/guardian/students/${studentId}/exams`);
      if (res.data.success) {
        setExamData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Report Cards</h1>
          <p className="text-xs text-slate-500">Official term assessment evaluations and grades</p>
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

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
      ) : !examData || examData.examinations?.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
          <Award className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No examination report cards available</p>
          <p className="mt-1">Examinations and marks have not yet been published for this student.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {examData.examinations.map((exam, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                    {exam.examination.term} ({exam.examination.academicYear})
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{exam.examination.name}</h3>
                  <p className="text-slate-500">Student: {exam.student.name} ({exam.student.admissionNumber})</p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Result</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                      exam.summary.passFailStatus === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {exam.summary.passFailStatus}
                    </span>
                  </div>

                  <div className="text-right pl-4 border-l">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Percentage</span>
                    <span className="text-base font-bold text-indigo-700">{exam.summary.overallPercentage}%</span>
                    <span className="text-slate-500 block text-[11px]">Grade {exam.summary.grade}</span>
                  </div>
                </div>
              </div>

              {/* Subject Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b">
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3 text-center">Max Marks</th>
                      <th className="py-2.5 px-3 text-center">Passing Marks</th>
                      <th className="py-2.5 px-3 text-center">Marks Scored</th>
                      <th className="py-2.5 px-3 text-center">Subject Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exam.subjectBreakdown.map((sb, sIdx) => (
                      <tr key={sIdx}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {sb.subjectName} <span className="font-mono text-slate-400 font-normal">({sb.subjectCode})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{sb.maxMarks}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{sb.passingMarks}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                          {sb.marksObtained !== null ? sb.marksObtained : 'Pending'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
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
                      <td className="py-2.5 px-3">Aggregate Total</td>
                      <td className="py-2.5 px-3 text-center">{exam.summary.totalMaxMarks}</td>
                      <td className="py-2.5 px-3 text-center">-</td>
                      <td className="py-2.5 px-3 text-center text-indigo-700">{exam.summary.totalObtainedMarks}</td>
                      <td className="py-2.5 px-3 text-center text-indigo-700">
                        {exam.summary.grade} ({exam.summary.overallPercentage}%)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardianReportCard;
