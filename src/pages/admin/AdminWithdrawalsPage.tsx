import { useState } from 'react';
import { ArrowUpFromLine, Check, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import { formatTrx, formatDate } from '@/lib/storage';

export default function AdminWithdrawalsPage() {
  const { store, adminApproveWithdrawal, adminRejectWithdrawal } = useApp();
  const { notify } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const withdrawals = store.withdrawals
    .filter((w) => filter === 'all' || w.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = store.withdrawals.filter((w) => w.status === 'pending').length;
  const getUserName = (userId: string) =>
    store.users.find((u) => u.id === userId)?.username || 'Deleted User';

  const handleReject = () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      notify('Please provide a reason for rejection', 'error');
      return;
    }
    adminRejectWithdrawal(rejectModal, rejectReason.trim());
    notify('Withdrawal rejected and funds returned to user', 'error');
    setRejectModal(null);
    setRejectReason('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <ArrowUpFromLine size={22} className="text-accent-salmon" />
          Withdrawal Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {pendingCount} pending withdrawal{pendingCount !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      <div className="mb-4 flex gap-1">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
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
        {withdrawals.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No withdrawals to show.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500">
                  <th className="px-5 py-3 text-left font-medium">Date</th>
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Destination</th>
                  <th className="px-5 py-3 text-center font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((wd) => (
                  <tr
                    key={wd.id}
                    className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                  >
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDate(wd.createdAt)}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">
                      {getUserName(wd.userId)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatTrx(wd.amount)} TRX
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[180px] truncate">
                      {wd.destinationAddress}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {wd.status === 'pending' && (
                        <StatusPill variant="pending">
                          <Clock size={12} /> Pending
                        </StatusPill>
                      )}
                      {wd.status === 'approved' && (
                        <StatusPill variant="success">
                          <CheckCircle size={12} /> Approved
                        </StatusPill>
                      )}
                      {wd.status === 'rejected' && (
                        <StatusPill variant="error">
                          <XCircle size={12} /> Rejected
                        </StatusPill>
                      )}
                      {wd.status === 'cancelled' && (
                        <StatusPill variant="neutral">Cancelled</StatusPill>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {wd.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                adminApproveWithdrawal(wd.id);
                                notify(`Withdrawal of ${formatTrx(wd.amount)} TRX approved`, 'success');
                              }}
                              className="flex items-center gap-1 rounded-btn bg-status-success-dim px-3 py-1.5 text-xs font-semibold text-status-success hover:bg-status-success/20"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(wd.id)}
                              className="flex items-center gap-1 rounded-btn bg-status-error-dim px-3 py-1.5 text-xs font-semibold text-status-error hover:bg-status-error/20"
                            >
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">
                            {wd.reason || '—'}
                          </span>
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

      <Modal
        open={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject Withdrawal"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            The withdrawal amount will be returned to the user's balance. Please provide a reason
            for the rejection.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Rejection Reason
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Invalid destination address"
              rows={3}
              className="input-base resize-none"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRejectModal(null)} className="btn-outline flex-1">
              Cancel
            </button>
            <button onClick={handleReject} className="btn-primary flex-1">
              Reject & Refund
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
