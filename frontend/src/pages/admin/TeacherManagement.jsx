import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  GraduationCap,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form states
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: 'Teacher@123',
    phone: '',
    employeeId: '',
    qualification: '',
  });

  const [assignForm, setAssignForm] = useState({
    teacherId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    academicYear: '2026-2027',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [tRes, cRes, sRes] = await Promise.all([
        api.get('/academic/teachers'),
        api.get('/academic/classes'),
        api.get('/academic/subjects'),
      ]);
      if (tRes.data.success) setTeachers(tRes.data.data.teachers);
      if (cRes.data.success) setClasses(cRes.data.data.classes);
      if (sRes.data.success) setSubjects(sRes.data.data.subjects);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load faculty information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/academic/teachers', teacherForm);
      setSuccess('Faculty member created successfully.');
      setAddModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher.');
    }
  };

  const openAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignForm({
      teacherId: teacher.id,
      classId: classes[0]?.id || '',
      sectionId: classes[0]?.sections[0]?.id || '',
      subjectId: subjects[0]?.id || '',
      academicYear: '2026-2027',
    });
    setAssignModalOpen(true);
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/academic/teachers/assign', assignForm);
      setSuccess(`Assignment created for ${selectedTeacher.name}.`);
      setAssignModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign teacher.');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this teaching assignment?')) return;
    try {
      await api.delete(`/academic/teachers/assign/${assignmentId}`);
      setSuccess('Teaching assignment removed successfully.');
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove assignment.');
    }
  };

  const selectedClassObj = classes.find((c) => c.id === assignForm.classId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Faculty & Teacher Assignments</h1>
          <p className="text-xs text-slate-500">Manage instructors and their assigned class, section, and subjects</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Faculty Member
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Teachers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teachers.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.name}</h3>
                  <p className="text-xs text-slate-500 font-mono font-medium">{t.employeeId} • {t.email}</p>
                </div>
              </div>
              <button
                onClick={() => openAssignModal(t)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                + Assign
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Qualification: </span>
              {t.qualification || 'Not specified'} • Phone: {t.phone || 'N/A'}
            </div>

            {/* Assignments */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active Assignments ({t.assignments?.length || 0})
              </p>
              {t.assignments && t.assignments.length > 0 ? (
                <div className="space-y-1.5">
                  {t.assignments.map((asgn) => (
                    <div
                      key={asgn.id}
                      className="flex items-center justify-between text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-indigo-700">{asgn.class?.name}</span>
                        {asgn.section && (
                          <span className="text-slate-600 font-medium">Sec {asgn.section.name}</span>
                        )}
                        {asgn.subject && (
                          <span className="text-slate-500">• {asgn.subject.name}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(asgn.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Remove assignment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No class assignments yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Teacher Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Faculty Member</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="teacher@school.com"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={teacherForm.employeeId}
                    onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })}
                    placeholder="TCH-1003"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="+1-555-0103"
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  value={teacherForm.qualification}
                  onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                  placeholder="M.Sc. Physics, B.Ed."
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Create Faculty Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Teacher Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                Assign Class & Subject to {selectedTeacher?.name}
              </h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAssignTeacher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Class *</label>
                <select
                  required
                  value={assignForm.classId}
                  onChange={(e) => {
                    const cls = classes.find((c) => c.id === e.target.value);
                    setAssignForm({
                      ...assignForm,
                      classId: e.target.value,
                      sectionId: cls?.sections[0]?.id || '',
                    });
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
                <select
                  value={assignForm.sectionId}
                  onChange={(e) => setAssignForm({ ...assignForm, sectionId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">All Sections</option>
                  {selectedClassObj?.sections.map((s) => (
                    <option key={s.id} value={s.id}>Section {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject (Optional)</label>
                <select
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">All Subjects / Class Teacher</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;

