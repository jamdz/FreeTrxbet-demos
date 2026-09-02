import { useState } from 'react';
import {
  Users as UsersIcon,
  Search,
  Ban,
  CheckCircle2,
  Wallet,
  Plus,
  Minus,
  ArrowRightLeft,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import StatusPill from '@/components/StatusPill';
import Modal from '@/components/Modal';
import { formatTrx, formatDate } from '@/lib/storage';

export default function AdminUsersPage() {
  const { store, adminToggleBan, adminModifyBalance, adminDeleteUser } = useApp();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [modalUser, setModalUser] = useState<string | null>(null);
  const [modalAmount, setModalAmount] = useState('');
  const [modalMode, setModalMode] = useState<'add' | 'subtract'>('add');
  const [deleteModalUser, setDeleteModalUser] = useState<string | null>(null);

  const users = store.users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const modalUserObj = store.users.find((u) => u.id === modalUser);
  const deleteUserObj = store.users.find((u) => u.id === deleteModalUser);

  const handleModify = () => {
    if (!modalUser) return;
    const amt = parseFloat(modalAmount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid amount', 'error');
      return;
    }
    const signed = modalMode === 'add' ? amt : -amt;
    adminModifyBalance(modalUser, signed);
    notify(`Balance ${modalMode === 'add' ? 'increased' : 'decreased'} by ${formatTrx(amt)} TRX`, 'success');
    setModalUser(null);
    setModalAmount('');
  };

  const handleDelete = () => {
    if (!deleteModalUser) return;
    const username = deleteUserObj?.username || 'User';
    adminDeleteUser(deleteModalUser);
    notify(`User "${username}" deleted`, 'success');
    setDeleteModalUser(null);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <UsersIcon size={22} className="text-accent-salmon" />
          User Management
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {store.users.length} total users
        </p>
      </div>

      <div className="mb-4 relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="input-base pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">User</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                <th className="px-5 py-3 text-right font-medium">Balance</th>
                <th className="px-5 py-3 text-center font-medium">Role</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{u.username}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3 text-right font-mono text-white">
                    {formatTrx(u.trxBalance)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {u.isAdmin ? (
                      <span className="text-xs font-semibold text-accent-salmon">Admin</span>
                    ) : (
                      <span className="text-xs text-gray-500">Player</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatusPill variant={u.status === 'active' ? 'success' : 'error'}>
                      {u.status}
                    </StatusPill>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setModalUser(u.id);
                          setModalMode('add');
                          setModalAmount('');
                        }}
                        className="rounded-btn p-1.5 text-gray-400 hover:bg-base-hover hover:text-status-success"
                        title="Modify balance"
                      >
                        <Wallet size={15} />
                      </button>
                      {!u.isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              adminToggleBan(u.id);
                              notify(
                                u.status === 'active'
                                  ? `User ${u.username} banned`
                                  : `User ${u.username} unbanned`,
                                u.status === 'active' ? 'error' : 'success',
                              );
                            }}
                            className={`rounded-btn p-1.5 ${
                              u.status === 'banned'
                                ? 'text-status-success hover:bg-status-success-dim'
                                : 'text-gray-400 hover:bg-status-error-dim hover:text-status-error'
                            }`}
                            title={u.status === 'banned' ? 'Unban user' : 'Ban user'}
                          >
                            {u.status === 'banned' ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                          </button>
                          <button
                            onClick={() => setDeleteModalUser(u.id)}
                            className="rounded-btn p-1.5 text-gray-400 hover:bg-status-error-dim hover:text-status-error"
                            title="Delete user permanently"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No users found.
          </div>
        )}
      </div>

      {/* Modify Balance Modal */}
      <Modal
        open={!!modalUser}
        onClose={() => setModalUser(null)}
        title="Modify User Balance"
      >
        {modalUserObj && (
          <div className="space-y-4">
            <div className="rounded-btn bg-base-nested border border-border px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{modalUserObj.username}</span>
                <span className="font-mono text-sm font-semibold text-white">
                  {formatTrx(modalUserObj.trxBalance)} TRX
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setModalMode('add')}
                className={`flex items-center justify-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-medium transition-all ${
                  modalMode === 'add'
                    ? 'border-status-success/40 bg-status-success-dim text-status-success'
                    : 'border-border text-gray-400 hover:bg-base-hover'
                }`}
              >
                <Plus size={16} /> Add
              </button>
              <button
                onClick={() => setModalMode('subtract')}
                className={`flex items-center justify-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-medium transition-all ${
                  modalMode === 'subtract'
                    ? 'border-status-error/40 bg-status-error-dim text-status-error'
                    : 'border-border text-gray-400 hover:bg-base-hover'
                }`}
              >
                <Minus size={16} /> Subtract
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Amount (TRX)
              </label>
              <input
                type="number"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                placeholder="Enter amount"
                className="input-base font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 rounded-btn bg-base-nested border border-border px-4 py-3 text-xs text-gray-400">
              <ArrowRightLeft size={14} className="text-accent-salmon" />
              New balance will be:{' '}
              <span className="font-mono font-semibold text-white">
                {formatTrx(
                  modalUserObj.trxBalance +
                    (modalMode === 'add'
                      ? parseFloat(modalAmount) || 0
                      : -(parseFloat(modalAmount) || 0)),
                )}{' '}
                TRX
              </span>
            </div>

            <button onClick={handleModify} className="btn-primary w-full">
              Confirm
            </button>
          </div>
        )}
      </Modal>

      {/* Delete User Modal */}
      <Modal
        open={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        title="Delete User"
      >
        {deleteUserObj && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-btn bg-status-error-dim border border-status-error/20 px-4 py-3">
              <Trash2 size={20} className="flex-shrink-0 text-status-error" />
              <p className="text-sm text-status-error">
                This will permanently remove <span className="font-semibold">{deleteUserObj.username}</span> ({deleteUserObj.email}) from the platform.
              </p>
            </div>
            <p className="text-sm text-gray-400">
              Their historical deposits, withdrawals, and bet records will remain for audit purposes but will display as "Deleted User". This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModalUser(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-status-error px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]"
              >
                <Trash2 size={16} />
                Delete User
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
