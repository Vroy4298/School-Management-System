import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldCheck, Filter } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, entityFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = `/audit?page=${page}&limit=25`;
      if (entityFilter) query += `&entity=${entityFilter}`;

      const res = await api.get(query);
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.totalPages || 1);
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
          <h1 className="text-xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-xs text-slate-500">Immutable ledger of administrative actions, attendance, marks, and financial transactions</p>
        </div>

        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
        >
          <option value="">All Entities</option>
          <option value="Student">Student</option>
          <option value="Teacher">Teacher</option>
          <option value="Attendance">Attendance</option>
          <option value="Examination">Examination</option>
          <option value="ExamResult">ExamResult</option>
          <option value="FeeInvoice">FeeInvoice</option>
          <option value="FeePayment">FeePayment</option>
          <option value="User">User</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Initiated By</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{log.action}</td>
                    <td className="py-3 px-4 text-slate-800">{log.entity}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.user?.name || log.userRole || 'System'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500 font-mono text-[11px]" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-500">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1 border border-slate-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;

