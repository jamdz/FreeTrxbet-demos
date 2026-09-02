import { useState, useMemo } from 'react';
import { Rocket, Plus, Minus, History, Volume2, VolumeX } from 'lucide-react';
import { useApp, applyHouseEdge } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import { formatTrx, formatDate } from '@/lib/storage';
import { play, setMuted, isMuted } from '@/lib/sounds';
import type { Bet } from '@/types';

export default function LimboPage() {
  const { currentUser, store, placeGameBet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('10');
  const [targetMult, setTargetMult] = useState(2.0);
  const [betting, setBetting] = useState(false);
  const [resultMult, setResultMult] = useState<number | null>(null);
  const [lastWon, setLastWon] = useState<boolean | null>(null);
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(!isMuted());

  const cfg = store.siteConfig;

  const winChance = useMemo(() => {
    if (targetMult <= 1) return 0;
    return (1 / targetMult) * 100;
  }, [targetMult]);

  const multiplier = useMemo(() => {
    if (winChance <= 0) return 0;
    return applyHouseEdge(targetMult, cfg.houseEdgePercent);
  }, [targetMult, winChance, cfg.houseEdgePercent]);

  if (!currentUser) return null;

  const userBets = store.bets.filter((b) => b.userId === currentUser.id && b.game === 'limbo').slice(0, 15);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  };

  const adjustTarget = (delta: number) => {
    setTargetMult((prev) => {
      const next = +(prev + delta).toFixed(2);
      return Math.max(1.01, Math.min(cfg.limboMaxMultiplier, next));
    });
  };

  const doBet = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid bet amount', 'error');
      return;
    }
    play('bet');
    setBetting(true);
    setResultMult(null);

    setTimeout(() => {
      // Generate result: random float with heavy bias toward low values
      // Using 1 / (1 - random) distribution, capped at limboMaxMultiplier
      const rand = Math.random();
      const result = Math.min(cfg.limboMaxMultiplier, +(1 / (1 - rand * 0.99)).toFixed(2));
      const won = result >= targetMult;
      const outcome = won ? 'win' : 'loss';
      const payout = won ? +(amt * multiplier).toFixed(2) : 0;
      const delta = won ? payout - amt : -amt;

      const res = placeGameBet({
        game: 'limbo',
        amount: amt,
        minBet: cfg.limboMinBet,
        maxBet: cfg.limboMaxBet,
        multiplier,
        outcome,
        payout,
        detail: `target ${targetMult.toFixed(2)}x → ${result.toFixed(2)}x`,
      });

      if (!res.ok) {
        notify(res.error || 'Bet failed', 'error');
        setBetting(false);
        return;
      }

      setResultMult(result);
      setLastWon(won);
      setLastDelta(delta);
      setBetting(false);

      if (won) {
        play('win');
        notify(`You won ${formatTrx(payout)} TRX!`, 'success');
      } else {
        play('loss');
        notify('You lost this round', 'error');
      }
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Game Card */}
          <div className="card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Rocket size={20} className="text-accent-salmon" />
                    Limbo
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Beat the target multiplier to win
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className="rounded-btn p-1.5 text-gray-400 transition-colors hover:bg-base-hover hover:text-white"
                  >
                    {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
                </div>
              </div>
            </div>

            <div className="px-6 py-8">
              {/* Result Display */}
              <div className="mb-8 flex flex-col items-center">
                <div
                  className={`flex h-32 w-48 flex-col items-center justify-center rounded-xl border-2 transition-all ${
                    lastWon === true
                      ? 'border-status-success bg-status-success-dim'
                      : lastWon === false
                        ? 'border-status-error bg-status-error-dim'
                        : 'border-border-strong bg-base-nested'
                  }`}
                >
                  <span className="text-xs font-medium text-gray-500">RESULT</span>
                  <span className="my-1 font-mono text-4xl font-bold text-white">
                    {betting ? '?' : resultMult !== null ? `${resultMult.toFixed(2)}x` : '—'}
                  </span>
                  {lastWon !== null && !betting && (
                    <span className={`text-xs font-semibold ${lastWon ? 'text-status-success' : 'text-status-error'}`}>
                      {lastWon ? `Cleared ${targetMult.toFixed(2)}x` : 'Fell short'}
                    </span>
                  )}
                </div>

                {lastDelta !== null && !betting && (
                  <div className="mt-3 animate-fade-in">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                        lastWon
                          ? 'border-status-success/20 bg-status-success-dim text-status-success'
                          : 'border-status-error/20 bg-status-error-dim text-status-error'
                      }`}
                    >
                      {lastWon ? '+' : ''}{formatTrx(lastDelta)} TRX
                    </span>
                  </div>
                )}
              </div>

              {/* Target Multiplier Stepper */}
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Target Multiplier
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustTarget(-0.1)}
                    disabled={betting}
                    className="btn-outline h-10 w-10 justify-center p-0"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={targetMult}
                    onChange={(e) => setTargetMult(Math.max(1.01, Math.min(cfg.limboMaxMultiplier, parseFloat(e.target.value) || 1.01)))}
                    min={1.01}
                    max={cfg.limboMaxMultiplier}
                    step={0.01}
                    className="input-base text-center font-mono text-lg"
                    disabled={betting}
                  />
                  <button
                    onClick={() => adjustTarget(0.1)}
                    disabled={betting}
                    className="btn-outline h-10 w-10 justify-center p-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  {[1.5, 2, 5, 10].map((m) => (
                    <button
                      key={m}
                      onClick={() => setTargetMult(Math.min(cfg.limboMaxMultiplier, m))}
                      disabled={betting}
                      className="btn-outline flex-1 px-2 py-1.5 text-xs"
                    >
                      {m}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                <StatBox label="Win Chance" value={`${winChance.toFixed(2)}%`} />
                <StatBox label="Payout Multiplier" value={`${multiplier.toFixed(2)}x`} />
              </div>

              {/* Bet Input */}
              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Bet Amount (TRX)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={cfg.limboMinBet}
                    max={cfg.limboMaxBet}
                    className="input-base font-mono"
                    disabled={betting}
                  />
                  {[1, 10, 100].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setAmount(String(chip))}
                      disabled={betting}
                      className="btn-outline px-3"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(String(Math.min(cfg.limboMaxBet, Math.floor(currentUser.trxBalance))))}
                    disabled={betting}
                    className="btn-outline px-3"
                  >
                    Max
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  Min: {cfg.limboMinBet} TRX · Max: {cfg.limboMaxBet} TRX · House edge: {cfg.houseEdgePercent}%
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={doBet}
                disabled={betting}
                className="btn-primary w-full py-3.5 text-base"
              >
                {betting ? 'Betting...' : 'Bet'}
              </button>
            </div>
          </div>

          {/* Recent Bets */}
          <div className="card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <History size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Recent Bets</h3>
            </div>
            {userBets.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No bets yet. Place your first bet above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-gray-500">
                      <th className="px-5 py-2.5 text-left font-medium">Time</th>
                      <th className="px-5 py-2.5 text-center font-medium">Detail</th>
                      <th className="px-5 py-2.5 text-right font-medium">Bet</th>
                      <th className="px-5 py-2.5 text-right font-medium">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBets.map((bet: Bet) => (
                      <tr
                        key={bet.id}
                        className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                      >
                        <td className="px-5 py-3 text-xs text-gray-400">{formatDate(bet.createdAt)}</td>
                        <td className="px-5 py-3 text-center font-mono text-xs text-gray-300">{bet.detail}</td>
                        <td className="px-5 py-3 text-right font-mono text-gray-300">{formatTrx(bet.amount)}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-mono font-semibold ${bet.outcome === 'win' ? 'text-status-success' : 'text-status-error'}`}>
                            {bet.outcome === 'win' ? `+${formatTrx(bet.payout)}` : `-${formatTrx(bet.amount)}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">How to Play</h3>
            <ol className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">1.</span>Set your target multiplier</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">2.</span>Higher target = bigger payout but lower win chance</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">3.</span>Place your bet and see the result</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">4.</span>If the result meets or beats your target, you win!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-btn border border-border bg-base-nested px-3 py-2.5 text-center">
      <p className="mb-0.5 text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm font-bold text-white">{value}</p>
    </div>
  );
}
