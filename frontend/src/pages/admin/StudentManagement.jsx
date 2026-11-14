import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    dob: '',
    gender: 'MALE',
    address: '',
    classId: '',
    sectionId: '',
    guardianId: '',
  });

  useEffect(() => {
    fetchClasses();
    fetchGuardians();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [classFilter, sectionFilter]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      if (res.data.success) {
        setClasses(res.data.data.classes);
      }
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchGuardians = async () => {
    try {
      const res = await api.get('/academic/guardians?limit=100');
      if (res.data.success) {
        setGuardians(res.data.data.guardians);
      }
    } catch (err) {
      console.error('Failed to load guardians', err);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      let query = `/academic/students?search=${encodeURIComponent(search)}`;
      if (classFilter) query += `&classId=${classFilter}`;
      if (sectionFilter) query += `&sectionId=${sectionFilter}`;

      const res = await api.get(query);
      if (res.data.success) {
        setStudents(res.data.data.students);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      firstName: '',
      lastName: '',
      admissionNumber: '',
      dob: '2011-01-01',
      gender: 'MALE',
      address: '',
      classId: classes[0]?.id || '',
      sectionId: classes[0]?.sections[0]?.id || '',
      guardianId: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      admissionNumber: student.admissionNumber,
      dob: student.dob ? new Date(student.dob).toISOString().slice(0, 10) : '',
      gender: student.gender || 'MALE',
      address: student.address || '',
      classId: student.classId,
      sectionId: student.sectionId,
      guardianId: student.guardianId || '',
    });
    setModalOpen(true);
  };

  const handleClassChange = (selectedClassId) => {
    const cls = classes.find((c) => c.id === selectedClassId);
    setFormData({
      ...formData,
      classId: selectedClassId,
      sectionId: cls?.sections[0]?.id || '',
    });
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingStudent) {
        await api.put(`/academic/students/${editingStudent.id}`, formData);
        setSuccess('Student details updated successfully.');
      } else {
        await api.post('/academic/students', formData);
        setSuccess('Student enrolled successfully.');
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student record.');
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/academic/students/${id}`);
      setSuccess(`Student "${name}" deleted successfully.`);
      fetchStudents();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  // Sections of selected class in filter
  const selectedFilterClass = classes.find((c) => c.id === classFilter);

  // Sections of selected class in modal
  const selectedModalClass = classes.find((c) => c.id === formData.classId);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-xs text-slate-500">Manage student admissions, profiles and guardian linkages</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Enroll New Student
        </button>
      </div>

      {/* Notifications */}
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

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex items-center w-full md:w-80 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search by name or admission no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setSectionFilter('');
            }}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            disabled={!classFilter}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100"
          >
            <option value="">All Sections</option>
            {selectedFilterClass?.sections.map((s) => (
              <option key={s.id} value={s.id}>Section {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or filter parameters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Adm No.</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class & Section</th>
                  <th className="py-3 px-4">Gender & DOB</th>
                  <th className="py-3 px-4">Linked Guardian</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{st.admissionNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{st.firstName} {st.lastName}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {st.class?.name} - {st.section?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.gender} • {st.dob ? new Date(st.dob).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.guardian ? (
                        <div>
                          <p className="font-medium text-slate-800">{st.guardian.name}</p>
                          <p className="text-[11px] text-slate-400">{st.guardian.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None linked</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(st)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-indigo-50"
                        title="Edit student"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(st.id, `${st.firstName} ${st.lastName}`)}
                        className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50"
                        title="Delete student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Enroll New Student'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Number</label>
                  <input
                    type="text"
                    placeholder="Leave empty to auto-generate"
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
                  <select
                    required
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="">Select Section</option>
                    {selectedModalClass?.sections.map((s) => (
                      <option key={s.id} value={s.id}>Section {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link Guardian (Optional)</label>
                <select
                  value={formData.guardianId}
                  onChange={(e) => setFormData({ ...formData, guardianId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="">None / Unassigned</option>
                  {guardians.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street, City, Postal Code"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;

