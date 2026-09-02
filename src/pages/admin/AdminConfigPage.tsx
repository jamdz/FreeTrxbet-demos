import { useState } from 'react';
import { Settings, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function AdminConfigPage() {
  const { store, adminUpdateConfig, adminResetDemoData } = useApp();
  const { notify } = useToast();
  const cfg = store.siteConfig;

  const [form, setForm] = useState({
    siteName: cfg.siteName,
    supportTelegram: cfg.supportTelegram,
    maintenanceMode: cfg.maintenanceMode,
    houseEdgePercent: cfg.houseEdgePercent,
    minDeposit: cfg.minDeposit,
    minWithdrawal: cfg.minWithdrawal,
    withdrawalNote: cfg.withdrawalNote,
    depositAddress: cfg.depositAddress,
    hiLoMinBet: cfg.hiLoMinBet,
    hiLoMaxBet: cfg.hiLoMaxBet,
    diceMinBet: cfg.diceMinBet,
    diceMaxBet: cfg.diceMaxBet,
    limboMinBet: cfg.limboMinBet,
    limboMaxBet: cfg.limboMaxBet,
    limboMaxMultiplier: cfg.limboMaxMultiplier,
    minesMinBet: cfg.minesMinBet,
    minesMaxBet: cfg.minesMaxBet,
    minesAllowedCounts: cfg.minesAllowedCounts,
    plinkoMinBet: cfg.plinkoMinBet,
    plinkoMaxBet: cfg.plinkoMaxBet,
  });
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateConfig(form);
    notify('Site configuration saved', 'success');
  };

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <Settings size={22} className="text-accent-salmon" />
          Site Configuration
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Manage platform-wide settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* General Settings */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">General</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Site Name">
              <input
                type="text"
                value={form.siteName}
                onChange={(e) => update('siteName', e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Support Telegram">
              <input
                type="text"
                value={form.supportTelegram}
                onChange={(e) => update('supportTelegram', e.target.value)}
                className="input-base"
              />
            </Field>
            <Field label="Deposit Address (TRX)">
              <input
                type="text"
                value={form.depositAddress}
                onChange={(e) => update('depositAddress', e.target.value)}
                className="input-base font-mono text-xs"
              />
            </Field>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-3 rounded-btn border border-border bg-base-nested px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={form.maintenanceMode}
                  onChange={(e) => update('maintenanceMode', e.target.checked)}
                  className="h-4 w-4 accent-accent-red"
                />
                <span className="text-sm text-gray-300">Maintenance Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Game Settings */}
        <div className="card p-5">
          <h2 className="mb-1 text-sm font-semibold text-white">Game Settings</h2>
          <p className="mb-4 text-xs text-gray-500">House edge applies to all games uniformly.</p>

          <div className="mb-4">
            <Field label="House Edge (%)">
              <input
                type="number"
                value={form.houseEdgePercent}
                onChange={(e) => update('houseEdgePercent', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={0}
                max={50}
                step={0.5}
              />
            </Field>
          </div>

          {/* Hi-Lo */}
          <GameSection title="Hi-Lo">
            <Field label="Min Bet (TRX)">
              <input
                type="number"
                value={form.hiLoMinBet}
                onChange={(e) => update('hiLoMinBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Bet (TRX)">
              <input
                type="number"
                value={form.hiLoMaxBet}
                onChange={(e) => update('hiLoMaxBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
          </GameSection>

          {/* Dice */}
          <GameSection title="Dice">
            <Field label="Min Bet (TRX)">
              <input
                type="number"
                value={form.diceMinBet}
                onChange={(e) => update('diceMinBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Bet (TRX)">
              <input
                type="number"
                value={form.diceMaxBet}
                onChange={(e) => update('diceMaxBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
          </GameSection>

          {/* Limbo */}
          <GameSection title="Limbo">
            <Field label="Min Bet (TRX)">
              <input
                type="number"
                value={form.limboMinBet}
                onChange={(e) => update('limboMinBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Bet (TRX)">
              <input
                type="number"
                value={form.limboMaxBet}
                onChange={(e) => update('limboMaxBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Multiplier (x)">
              <input
                type="number"
                value={form.limboMaxMultiplier}
                onChange={(e) => update('limboMaxMultiplier', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={2}
              />
            </Field>
          </GameSection>

          {/* Mines */}
          <GameSection title="Mines">
            <Field label="Min Bet (TRX)">
              <input
                type="number"
                value={form.minesMinBet}
                onChange={(e) => update('minesMinBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Bet (TRX)">
              <input
                type="number"
                value={form.minesMaxBet}
                onChange={(e) => update('minesMaxBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Allowed Mine Counts (comma-separated)">
              <input
                type="text"
                value={form.minesAllowedCounts.join(', ')}
                onChange={(e) =>
                  update(
                    'minesAllowedCounts',
                    e.target.value.split(',').map((v) => parseInt(v.trim()) || 0).filter((v) => v > 0),
                  )
                }
                className="input-base font-mono"
              />
            </Field>
          </GameSection>

          {/* Plinko */}
          <GameSection title="Plinko">
            <Field label="Min Bet (TRX)">
              <input
                type="number"
                value={form.plinkoMinBet}
                onChange={(e) => update('plinkoMinBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Max Bet (TRX)">
              <input
                type="number"
                value={form.plinkoMaxBet}
                onChange={(e) => update('plinkoMaxBet', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
          </GameSection>
        </div>

        {/* Transaction Settings */}
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Transaction Limits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Min Deposit (TRX)">
              <input
                type="number"
                value={form.minDeposit}
                onChange={(e) => update('minDeposit', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
            <Field label="Min Withdrawal (TRX)">
              <input
                type="number"
                value={form.minWithdrawal}
                onChange={(e) => update('minWithdrawal', parseFloat(e.target.value) || 0)}
                className="input-base font-mono"
                min={1}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Withdrawal Note (shown to users)">
              <textarea
                value={form.withdrawalNote}
                onChange={(e) => update('withdrawalNote', e.target.value)}
                rows={2}
                className="input-base resize-none"
              />
            </Field>
          </div>
        </div>

        {form.maintenanceMode && (
          <div className="flex items-center gap-2 rounded-card bg-status-pending-dim border border-status-pending/20 px-4 py-3">
            <AlertTriangle size={16} className="text-status-pending" />
            <p className="text-sm text-status-pending">
              Maintenance mode is ON. Users will see a maintenance screen instead of the game.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary">
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </form>

      {/* Demo Data Reset */}
      <div className="mt-8 rounded-card border border-status-error/30 bg-status-error/5 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-status-error">
          <RotateCcw size={16} />
          Reset Demo Data
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          Clears all data from the browser and restores the original demo users and configuration. You will be logged out. Useful for re-testing the full evaluation flow from a clean state.
        </p>
        <button
          onClick={() => setResetModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-btn border border-status-error/40 px-4 py-2 text-sm font-semibold text-status-error transition-colors hover:bg-status-error/10"
        >
          <RotateCcw size={16} />
          Reset All Data
        </button>
      </div>

      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Demo Data"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-btn bg-status-error-dim border border-status-error/20 px-4 py-3">
            <AlertTriangle size={20} className="flex-shrink-0 text-status-error" />
            <p className="text-sm text-status-error">
              This will erase all users, deposits, withdrawals, bets, and configuration changes, then restore the original demo data. You will be logged out.
            </p>
          </div>
          <p className="text-sm text-gray-400">
            This is useful for re-testing the full flow from a clean state. The action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setResetModalOpen(false)} className="btn-outline flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                adminResetDemoData();
                setResetModalOpen(false);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-btn bg-status-error px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Reset Everything
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400">{label}</label>
      {children}
    </div>
  );
}

function GameSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 border-t border-border pt-4 last:mb-0">
      <h3 className="mb-3 text-xs font-semibold text-accent-salmon">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}
