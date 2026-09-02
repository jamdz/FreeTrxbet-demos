import { useState } from 'react';
import { User as UserIcon, Mail, Lock, Save, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import { formatDate } from '@/lib/storage';

export default function ProfilePage() {
  const { currentUser, store, updateProfile, deleteAccount } = useApp();
  const { notify } = useToast();
  const [username, setUsername] = useState(currentUser?.username || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  if (!currentUser) return null;

  const userBets = store.bets.filter((b) => b.userId === currentUser.id);
  const wins = userBets.filter((b) => b.outcome === 'win').length;
  const totalWagered = userBets.reduce((s, b) => s + b.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password !== confirm) {
      notify('Passwords do not match', 'error');
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      username,
      email,
      password: password || undefined,
    });
    setSaving(false);
    if (!result.ok) {
      notify(result.error || 'Failed to update profile', 'error');
      return;
    }
    notify('Profile updated successfully', 'success');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">My Profile</h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage your account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Profile Form */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Account Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Username</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-base pl-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-base pl-10"
                    required
                  />
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-xs font-semibold text-gray-400">Change Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="input-base pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Re-enter new password"
                        className="input-base pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-card border border-status-error/30 bg-status-error/5 p-5">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-status-error">
              <AlertTriangle size={16} />
              Danger Zone
            </h2>
            <p className="mb-4 text-xs text-gray-500">
              Permanently delete your account. This action cannot be undone and your remaining TRX balance will be forfeited.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-btn border border-status-error/40 px-4 py-2 text-sm font-semibold text-status-error transition-colors hover:bg-status-error/10"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>

        {/* Account Summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Account Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status</span>
                <StatusPill variant={currentUser.status === 'active' ? 'success' : 'error'}>
                  {currentUser.status}
                </StatusPill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Role</span>
                <span className="text-sm font-semibold text-white">
                  {currentUser.isAdmin ? 'Administrator' : 'Player'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} /> Joined
                </span>
                <span className="text-xs text-gray-300">
                  {formatDate(currentUser.joinedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Balance & Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Balance</span>
                <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Bets</span>
                <span className="font-mono text-sm text-white">{userBets.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Wins</span>
                <span className="font-mono text-sm text-status-success">{wins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Total Wagered</span>
                <span className="font-mono text-sm text-white">
                  {totalWagered.toFixed(2)} TRX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-btn bg-status-error-dim border border-status-error/20 px-4 py-3">
            <AlertTriangle size={20} className="flex-shrink-0 text-status-error" />
            <p className="text-sm text-status-error">
              This action is irreversible. Your account, balance, and bet history will be permanently removed.
            </p>
          </div>
          <p className="text-sm text-gray-400">
            You currently have <span className="font-mono font-semibold text-white">{currentUser.trxBalance.toFixed(2)} TRX</span> in your account. This balance will be forfeited and cannot be recovered.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setDeleteModalOpen(false)} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                deleteAccount();
                setDeleteModalOpen(false);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-status-error px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]"
            >
              <Trash2 size={16} />
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
