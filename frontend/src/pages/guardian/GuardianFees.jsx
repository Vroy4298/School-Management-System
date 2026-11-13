import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, CheckCircle, AlertCircle, X, CreditCard, Receipt } from 'lucide-react';

const GuardianFees = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [feeData, setFeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment Modal
  const [payModal, setPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_SIMULATED');
  const [processing, setProcessing] = useState(false);

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
      loadFees(selectedStudentId);
    }
  }, [selectedStudentId]);

  const loadFees = async (studentId) => {
    try {
      setLoading(true);
      const res = await api.get(`/guardian/students/${studentId}/fees`);
      if (res.data.success) {
        setFeeData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.outstandingBalance);
    setPayModal(true);
    setError('');
    setSuccess('');
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setProcessing(true);

    try {
      const res = await api.post(`/guardian/invoices/${selectedInvoice.id}/pay`, {
        amount: Number(payAmount),
        paymentMethod,
        notes: 'Simulated payment processed via Guardian Portal',
      });

      if (res.data.success) {
        setSuccess(`Payment of $${Number(payAmount).toFixed(2)} recorded successfully! Transaction Ref: ${res.data.data.paymentReceipt.transactionRef}`);
        setPayModal(false);
        loadFees(selectedStudentId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed.');
    } finally {
      setProcessing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fee Invoices & Payments</h1>
          <p className="text-xs text-slate-500">View tuition dues, payment receipts, and submit simulated fee settlements</p>
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

      {/* Summary Cards */}
      {feeData?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
            <p className="text-xl font-bold text-slate-900 mt-1">${feeData.summary.totalInvoiced.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-600">Total Settled</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">${feeData.summary.totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-600">Outstanding Balance</span>
            <p className="text-xl font-bold text-amber-600 mt-1">${feeData.summary.totalOutstanding.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Fee Invoices & Ledger</h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
          </div>
        ) : !feeData || feeData.invoices?.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
            No fee invoices issued for this student.
          </div>
        ) : (
          feeData.invoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-indigo-700">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(inv.status)}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 mt-1 text-sm">{inv.title}</h3>
                  <p className="text-slate-400 text-[11px]">Due Date: {new Date(inv.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                    <span className="font-bold text-slate-900">${inv.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Paid</span>
                    <span className="font-bold text-emerald-600">${inv.totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Balance</span>
                    <span className="font-bold text-amber-600">${inv.outstandingBalance.toFixed(2)}</span>
                  </div>

                  {inv.outstandingBalance > 0 && (
                    <button
                      onClick={() => openPayModal(inv)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>

              {/* Payment History */}
              {inv.payments && inv.payments.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Payment Transactions ({inv.payments.length})
                  </p>
                  <div className="space-y-1.5">
                    {inv.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-mono font-semibold text-slate-800">{p.transactionRef}</span>
                          <span className="text-slate-500">• {p.paymentMethod}</span>
                          <span className="text-slate-400">• {new Date(p.paymentDate).toLocaleDateString()}</span>
                        </div>
                        <span className="font-bold text-emerald-600">+${p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pay Modal */}
      {payModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Simulate Fee Settlement</h3>
              <button onClick={() => setPayModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-6 space-y-4 text-xs">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-emerald-800">
                <p className="font-bold">{selectedInvoice.title}</p>
                <p className="mt-1">
                  Remaining Outstanding Balance: <span className="font-bold text-amber-700">${selectedInvoice.outstandingBalance.toFixed(2)}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.outstandingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">
                  You can pay the full amount or enter a partial payment.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
                >
                  <option value="ONLINE_SIMULATED">Online Simulated Gateway</option>
                  <option value="CARD">Credit/Debit Card (Simulated)</option>
                  <option value="BANK_TRANSFER">Direct Net Banking</option>
                </select>
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
                  disabled={processing}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : `Confirm Payment of $${Number(payAmount || 0).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuardianFees;
