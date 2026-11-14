import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { UserCheck, Plus, X, AlertCircle, CheckCircle, Users } from 'lucide-react';

const GuardianManagement = () => {
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: 'Guardian@123',
    phone: '',
    address: '',
    relationship: 'Father',
  });

  useEffect(() => {
    fetchGuardians();
  }, []);

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/guardians?limit=100');
      if (res.data.success) {
        setGuardians(res.data.data.guardians);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load guardians');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/academic/guardians', form);
      setSuccess(`Guardian profile created for ${form.name}.`);
      setModalOpen(false);
      fetchGuardians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create guardian.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Guardian Directory</h1>
          <p className="text-xs text-slate-500">Manage student parents, contacts and linked children</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Guardian
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
        {guardians.map((g) => (
          <div key={g.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{g.name}</h3>
                <p className="text-xs text-slate-500">{g.relationship || 'Guardian'} • {g.email}</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <p>Phone: <span className="font-semibold text-slate-800">{g.phone}</span></p>
              <p className="truncate text-slate-400">Address: {g.address || 'N/A'}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Linked Students ({g.students?.length || 0})
              </p>
              {g.students && g.students.length > 0 ? (
                <div className="space-y-1">
                  {g.students.map((st) => (
                    <div key={st.id} className="text-xs flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                      <span className="font-semibold text-slate-800">{st.firstName} {st.lastName}</span>
                      <span className="text-indigo-600 font-mono text-[11px]">{st.admissionNumber}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No students linked yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Guardian Account</h3>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Davis"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="guardian@school.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1-555-0199"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={form.relationship}
                    onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Home Address</label>
                <textarea
                  rows="2"
                  placeholder="Street, City"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Save Guardian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianManagement;

