import { useState } from 'react';
import { Copy, Check, ArrowDownToLine, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import StatusPill from '@/components/StatusPill';
import { QRCodeSVG } from 'qrcode.react';
import { formatTrx, formatDate } from '@/lib/storage';

export default function DepositPage() {
  const { currentUser, store, createDeposit } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  if (!currentUser) return null;
  const cfg = store.siteConfig;
  const userDeposits = store.deposits.filter((d) => d.userId === currentUser.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    const result = createDeposit(amt, txHash);
    if (!result.ok) {
      notify(result.error || 'Failed to submit deposit', 'error');
      return;
    }
    notify('Deposit submitted! Waiting for confirmation.', 'success');
    setAmount('');
    setTxHash('');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(cfg.depositAddress);
    setCopied(true);
    notify('Address copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <ArrowDownToLine size={22} className="text-accent-salmon" />
            Deposit TRX
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Fund your account with TRX</p>
        </div>
        <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Deposit Instructions */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Send TRX to this address</h2>

          <div className="flex flex-col items-center rounded-btn bg-base-nested border border-border p-5">
            <div className="rounded-lg bg-white p-3">
              <QRCodeSVG
                value={cfg.depositAddress}
                size={160}
                level="M"
                bgColor="#ffffff"
                fgColor="#0B0E11"
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">Scan QR or copy address below</p>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-gray-400">
              Deposit Address
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={cfg.depositAddress}
                className="input-base font-mono text-xs"
              />
              <button
                onClick={copyAddress}
                className="btn-outline px-3"
                title="Copy address"
              >
                {copied ? <Check size={16} className="text-status-success" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-btn bg-status-pending-dim border border-status-pending/20 px-4 py-3">
            <p className="text-xs text-status-pending">
              Minimum deposit: <span className="font-semibold">{cfg.minDeposit} TRX</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Send only TRX to this address. After sending, submit the transaction hash below.
              Your deposit will be credited after admin confirmation.
            </p>
          </div>
        </div>

        {/* Submit Deposit Form */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Submit Your Deposit</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Amount (TRX)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ${cfg.minDeposit}`}
                min={cfg.minDeposit}
                className="input-base font-mono"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Transaction Hash
              </label>
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Paste your TRX transaction hash"
                className="input-base font-mono text-xs"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Submit Deposit Request
            </button>
          </form>
        </div>
      </div>

      {/* Deposit History */}
      <div className="mt-6 card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Deposit History</h3>
        </div>
        {userDeposits.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No deposits yet. Send TRX to the address above to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-gray-500">
                  <th className="px-5 py-2.5 text-left font-medium">Date</th>
                  <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-5 py-2.5 text-left font-medium">Tx Hash</th>
                  <th className="px-5 py-2.5 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {userDeposits.map((dep) => (
                  <tr
                    key={dep.id}
                    className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                  >
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {formatDate(dep.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-white">
                      {formatTrx(dep.amount)}
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
