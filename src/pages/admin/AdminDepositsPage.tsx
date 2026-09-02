import { useState } from 'react';
import { ArrowDownToLine, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import StatusPill from '@/components/StatusPill';
import { formatTrx, formatDate } from '@/lib/storage';

export default function AdminDepositsPage() {
  const { store, adminApproveDeposit, adminRejectDeposit } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'credited' | 'failed'>('pending');

  const deposits = store.deposits
    .filter((d) => filter === 'all' || d.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = store.deposits.filter((d) => d.status === 'pending').length;

  const getUserName = (userId: string) =>
    store.users.find((u) => u.id === userId)?.username || 'Deleted User';

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <ArrowDownToLine size={22} className="text-accent-salmon" />
          Deposit Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {pendingCount} pending deposit{pendingCount !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      <div className="mb-4 flex gap-1">
        {(['pending', 'credited', 'failed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-btn px-4 py-2 text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-accent-salmon-dim text-accent-salmon'
                : 'text-gray-400 hover:bg-base-hover hover:text-white'
            }`}
          >
            {f}
            {f === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-status-pending-dim px-1.5 py-0.5 text-status-pending">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {deposits.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No deposits to show.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Tx Hash</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                  >
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDate(dep.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">
                      {getUserName(dep.userId)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatTrx(dep.amount)} TRX
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[200px] truncate">
                      {dep.txHash}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {dep.status === 'pending' && (
                        <StatusPill variant="pending">
                          <Clock size={12} /> Pending
                        </StatusPill>
                      )}
                      {dep.status === 'credited' && (
                        <StatusPill variant="success">
                          <CheckCircle size={12} /> Credited
                        </StatusPill>
                      )}
                      {dep.status === 'failed' && (
                        <StatusPill variant="error">
                          <XCircle size={12} /> Failed
                        </StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {dep.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                adminApproveDeposit(dep.id);
                                notify(`Deposit of ${formatTrx(dep.amount)} TRX approved`, 'success');
                              }}
                              className="flex items-center gap-1 rounded-btn bg-status-success-dim px-3 py-1.5 text-xs font-semibold text-status-success hover:bg-status-success/20"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                adminRejectDeposit(dep.id);
                                notify('Deposit rejected', 'error');
                              }}
                              className="flex items-center gap-1 rounded-btn bg-status-error-dim px-3 py-1.5 text-xs font-semibold text-status-error hover:bg-status-error/20"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
