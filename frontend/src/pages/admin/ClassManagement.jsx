import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { School, Plus, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [classModal, setClassModal] = useState(false);
  const [sectionModal, setSectionModal] = useState(false);
  const [targetClass, setTargetClass] = useState(null);

  const [className, setClassName] = useState('');
  const [numericGrade, setNumericGrade] = useState('');
  const [initialSections, setInitialSections] = useState('A, B');

  const [newSectionName, setNewSectionName] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/classes');
      if (res.data.success) {
        setClasses(res.data.data.classes);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const sectionArray = initialSections.split(',').map((s) => s.trim()).filter(Boolean);
      await api.post('/academic/classes', {
        name: className,
        numericGrade: Number(numericGrade),
        sections: sectionArray,
      });
      setSuccess(`Class ${className} created successfully.`);
      setClassModal(false);
      setClassName('');
      setNumericGrade('');
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class.');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!targetClass || !newSectionName.trim()) return;
    setError('');
    setSuccess('');
    try {
      await api.post(`/academic/classes/${targetClass.id}/sections`, {
        name: newSectionName.trim().toUpperCase(),
      });
      setSuccess(`Section ${newSectionName} added to ${targetClass.name}.`);
      setSectionModal(false);
      setNewSectionName('');
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add section.');
    }
  };

  const handleDeleteClass = async (classId, name) => {
    if (!window.confirm(`Delete ${name} and all associated sections? This requires no active students enrolled.`)) return;
    try {
      await api.delete(`/academic/classes/${classId}`);
      setSuccess(`Class ${name} deleted.`);
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete class.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Academic Classes & Sections</h1>
          <p className="text-xs text-slate-500">Configure grade tiers and classroom sections</p>
        </div>
        <button
          onClick={() => setClassModal(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Class
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cls.name}</h3>
                  <p className="text-xs text-slate-500">Grade Tier: {cls.numericGrade}</p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteClass(cls.id, cls.name)}
                className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                title="Delete class"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Enrolled Students:</span>
              <span className="font-bold text-slate-900">{cls._count?.students || 0}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Sections ({cls.sections?.length || 0})
                </span>
                <button
                  onClick={() => {
                    setTargetClass(cls);
                    setSectionModal(true);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  + Add Section
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {cls.sections?.map((sec) => (
                  <span
                    key={sec.id}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-100"
                  >
                    Section {sec.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Class Modal */}
      {classModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Create Academic Class</h3>
              <button onClick={() => setClassModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 11"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Numeric Grade Tier *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 11"
                  value={numericGrade}
                  onChange={(e) => setNumericGrade(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Sections (comma-separated)</label>
                <input
                  type="text"
                  placeholder="A, B, C"
                  value={initialSections}
                  onChange={(e) => setInitialSections(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setClassModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section Modal */}
      {sectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Section to {targetClass?.name}</h3>
              <button onClick={() => setSectionModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateSection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Section Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C"
                  maxLength={5}
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSectionModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;

