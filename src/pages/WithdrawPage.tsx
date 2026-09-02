import { useState } from 'react';
import { ArrowUpFromLine, Clock, CheckCircle, XCircle, Info, Ban } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import StatusPill from '@/components/StatusPill';
import { formatTrx, formatDate } from '@/lib/storage';

export default function WithdrawPage() {
  const { currentUser, store, requestWithdrawal, cancelWithdrawal } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');

  if (!currentUser) return null;
  const cfg = store.siteConfig;
  const userWithdrawals = store.withdrawals.filter((w) => w.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    const result = requestWithdrawal(amt, address);
    if (!result.ok) {
      notify(result.error || 'Failed to request withdrawal', 'error');
      return;
    }
    notify('Withdrawal requested! Funds will be sent after approval.', 'success');
    setAmount('');
    setAddress('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <ArrowUpFromLine size={22} className="text-accent-salmon" />
            Withdraw TRX
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Cash out your winnings</p>
        </div>
        <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Request Withdrawal</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Amount (TRX)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${cfg.minWithdrawal}`}
                min={cfg.minWithdrawal}
                className="input-base font-mono"
                required
              />
              <p className="mt-1.5 text-xs text-gray-600">
                Available: {formatTrx(currentUser.trxBalance)} TRX
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Destination Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your TRX wallet address"
                className="input-base font-mono text-xs"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Request Withdrawal
            </button>
          </form>

          <div className="mt-4 flex gap-2 rounded-btn bg-base-nested border border-border px-4 py-3">
            <Info size={16} className="flex-shrink-0 text-accent-salmon mt-0.5" />
            <p className="text-xs text-gray-400">{cfg.withdrawalNote}</p>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Withdrawal Info</h2>
          <div className="space-y-3">
            <InfoRow label="Minimum Withdrawal" value={`${cfg.minWithdrawal} TRX`} />
            <InfoRow label="Processing Time" value="Within 24 hours" />
            <InfoRow label="Fee" value="0 TRX (free)" />
            <InfoRow
              label="Pending Requests"
              value={String(userWithdrawals.filter((w) => w.status === 'pending').length)}
            />
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="mt-6 card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Withdrawal History</h3>
        </div>
        {userWithdrawals.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No withdrawals yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500">
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Address</th>
                  <th className="px-5 py-2.5 text-center font-medium">Status</th>
                  <th className="px-5 py-2.5 text-left font-medium">Note</th>
                  <th className="px-5 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {userWithdrawals.map((wd) => (
                  <tr
                    key={wd.id}
                    className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                  >
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDate(wd.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatTrx(wd.amount)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500 max-w-[160px] truncate">
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
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {wd.reason || '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {wd.status === 'pending' ? (
                        <button
                          onClick={() => {
                            cancelWithdrawal(wd.id);
                            notify('Withdrawal cancelled and funds returned to your balance', 'info');
                          }}
                          className="inline-flex items-center gap-1 rounded-btn px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:bg-status-error-dim hover:text-status-error"
                        >
                          <Ban size={12} />
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-mono text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
