import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Plus, CheckCircle, AlertCircle, X, Receipt, Calculator } from 'lucide-react';

const FeeManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [reconciliation, setReconciliation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [structureModal, setStructureModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    classId: '',
    studentId: '',
    title: '',
    amount: '',
    dueDate: '',
  });

  const [structureForm, setStructureForm] = useState({
    title: '',
    classId: '',
    amount: '',
    dueDate: '',
    academicYear: '2026-2027',
    description: '',
  });

  const [payForm, setPayForm] = useState({
    amount: '',
    paymentMethod: 'ONLINE_SIMULATED',
    notes: '',
  });

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInitial = async () => {
    try {
      setLoading(true);
      const [iRes, sRes, cRes, stRes, rRes] = await Promise.all([
        api.get('/fees/invoices?limit=100'),
        api.get('/fees/structures'),
        api.get('/academic/classes'),
        api.get('/academic/students?limit=100'),
        api.get('/fees/ledger/reconciliation'),
      ]);
      if (iRes.data.success) setInvoices(iRes.data.data.invoices);
      if (sRes.data.success) setStructures(sRes.data.data.feeStructures);
      if (cRes.data.success) {
        setClasses(cRes.data.data.classes);
        setInvoiceForm((prev) => ({ ...prev, classId: cRes.data.data.classes[0]?.id || '' }));
        setStructureForm((prev) => ({ ...prev, classId: cRes.data.data.classes[0]?.id || '' }));
      }
      if (stRes.data.success) setStudents(stRes.data.data.students);
      if (rRes.data.success) setReconciliation(rRes.data.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      let query = '/fees/invoices?limit=100';
      if (statusFilter) query += `&status=${statusFilter}`;
      const res = await api.get(query);
      if (res.data.success) setInvoices(res.data.data.invoices);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/fees/invoices/generate', {
        ...invoiceForm,
        amount: Number(invoiceForm.amount),
      });
      setSuccess('Invoice(s) generated successfully.');
      setInvoiceModal(false);
      fetchInitial();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate invoice.');
    }
  };

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/fees/structures', {
        ...structureForm,
        amount: Number(structureForm.amount),
      });
      setSuccess('Fee structure created.');
      setStructureModal(false);
      fetchInitial();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create fee structure.');
    }
  };

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayForm({
      amount: inv.outstandingBalance,
      paymentMethod: 'ONLINE_SIMULATED',
      notes: 'Payment recorded via Admin portal',
    });
    setPayModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post(`/fees/invoices/${selectedInvoice.id}/pay`, {
        ...payForm,
        amount: Number(payForm.amount),
      });
      setSuccess(`Payment of $${payForm.amount} recorded successfully.`);
      setPayModal(false);
      fetchInitial();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PARTIALLY_PAID':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'PENDING':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fee Management & Ledger</h1>
          <p className="text-xs text-slate-500">Generate tuition invoices, record simulated payments, and reconcile accounts</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setStructureModal(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            + Fee Structure
          </button>
          <button
            onClick={() => setInvoiceModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Generate Invoices
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Reconciliation Summary Card */}
      {reconciliation && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ledger Reconciliation</h3>
              <p className="text-xs text-slate-500">
                Total Invoiced: <span className="font-bold text-slate-900">${reconciliation.totalInvoiced.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Collected</span>
              <span className="text-sm font-bold text-emerald-600">${reconciliation.totalCollected.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Outstanding</span>
              <span className="text-sm font-bold text-amber-600">${reconciliation.totalOutstanding.toLocaleString()}</span>
            </div>
            <div className="pl-4 border-l">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                reconciliation.isReconciled ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800'
              }`}>
                {reconciliation.isReconciled ? 'Ledger Balanced' : 'Discrepancy'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-700">Filter Invoices by Status:</span>
        <div className="flex space-x-2">
          {['', 'PENDING', 'PARTIALLY_PAID', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st ? st.replace('_', ' ') : 'All Invoices'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No fee invoices found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.student?.firstName} {inv.student?.lastName}
                      <span className="block text-[11px] font-mono text-slate-400">{inv.student?.admissionNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inv.title}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${inv.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">${inv.totalPaid.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-amber-600">${inv.outstandingBalance.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(inv.status)}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => openPayModal(inv)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {payModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Record Fee Payment</h3>
              <button onClick={() => setPayModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-800">{selectedInvoice.title}</p>
                <p className="text-slate-500">Student: {selectedInvoice.student?.firstName} {selectedInvoice.student?.lastName}</p>
                <p className="text-slate-500">Outstanding Balance: <span className="font-bold text-amber-600">${selectedInvoice.outstandingBalance.toFixed(2)}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.outstandingBalance}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Must not exceed remaining balance of ${selectedInvoice.outstandingBalance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Channel *</label>
                <select
                  value={payForm.paymentMethod}
                  onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                >
                  <option value="ONLINE_SIMULATED">Online / Simulated Card</option>
                  <option value="CASH">Cash Over-The-Counter</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Notes</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Receipt or remarks"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPayModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoices Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Generate Student Fee Invoices</h3>
              <button onClick={() => setInvoiceModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
                <select
                  required
                  value={invoiceForm.classId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, classId: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tuition Fee Term 2"
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1200.00"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Generate Invoices
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Structure Modal */}
      {structureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Define Class Fee Structure</h3>
              <button onClick={() => setStructureModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateStructure} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Structure Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Activity & Lab Fee"
                  value={structureForm.title}
                  onChange={(e) => setStructureForm({ ...structureForm, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    required
                    value={structureForm.classId}
                    onChange={(e) => setStructureForm({ ...structureForm, classId: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="350.00"
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={structureForm.dueDate}
                  onChange={(e) => setStructureForm({ ...structureForm, dueDate: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setStructureModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                >
                  Save Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;

