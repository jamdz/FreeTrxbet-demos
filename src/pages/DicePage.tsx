import { useState, useMemo } from 'react';
import { Dices, ArrowUp, ArrowDown, History, Volume2, VolumeX } from 'lucide-react';
import { useApp, applyHouseEdge } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import { formatTrx, formatDate } from '@/lib/storage';
import { play, setMuted, isMuted } from '@/lib/sounds';
import type { Bet, DiceMode } from '@/types';

interface RollResult {
  roll: number;
  won: boolean;
}

export default function DicePage() {
  const { currentUser, store, placeGameBet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('10');
  const [target, setTarget] = useState(50);
  const [mode, setMode] = useState<DiceMode>('under');
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);
  const [animRoll, setAnimRoll] = useState<number | null>(null);
  const [soundOn, setSoundOn] = useState(!isMuted());

  const cfg = store.siteConfig;

  const winChance = useMemo(() => {
    return mode === 'under' ? target : 100 - target;
  }, [target, mode]);

  const multiplier = useMemo(() => {
    if (winChance <= 0) return 0;
    return applyHouseEdge(100 / winChance, cfg.houseEdgePercent);
  }, [winChance, cfg.houseEdgePercent]);

  const maxWin = useMemo(() => {
    return +(parseFloat(amount || '0') * multiplier).toFixed(2);
  }, [amount, multiplier]);

  if (!currentUser) return null;

  const userBets = store.bets.filter((b) => b.userId === currentUser.id && b.game === 'dice').slice(0, 15);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  };

  const doRoll = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid bet amount', 'error');
      return;
    }
    play('bet');
    setRolling(true);
    setAnimRoll(Math.floor(Math.random() * 100));

    const animInterval = setInterval(() => {
      setAnimRoll(Math.floor(Math.random() * 100));
    }, 80);

    setTimeout(() => {
      clearInterval(animInterval);
      const roll = Math.floor(Math.random() * 100) + 1; // 1-100
      const won = mode === 'under' ? roll < target : roll > target;
      const outcome = won ? 'win' : 'loss';
      const payout = won ? +(amt * multiplier).toFixed(2) : 0;

      const result = placeGameBet({
        game: 'dice',
        amount: amt,
        minBet: cfg.diceMinBet,
        maxBet: cfg.diceMaxBet,
        multiplier,
        outcome,
        payout,
        detail: `${mode} ${target} → rolled ${roll}`,
      });

      if (!result.ok) {
        notify(result.error || 'Bet failed', 'error');
        setRolling(false);
        setAnimRoll(null);
        return;
      }

      setLastResult({ roll, won });
      setAnimRoll(roll);
      setRolling(false);

      if (won) {
        play('win');
        notify(`You won ${formatTrx(payout)} TRX!`, 'success');
      } else {
        play('loss');
        notify('You lost this round', 'error');
      }
    }, 600);
  };

  const displayRoll = animRoll ?? lastResult?.roll ?? 50;

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
                    <Dices size={20} className="text-accent-salmon" />
                    Dice
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Roll {mode} {target} to win
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

            <div className="px-6 py-6">
              {/* Mode Toggle */}
              <div className="mb-5 flex gap-2">
                <button
                  onClick={() => setMode('under')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-semibold transition-all ${
                    mode === 'under'
                      ? 'border-accent-salmon/40 bg-accent-salmon-dim text-accent-salmon'
                      : 'border-border text-gray-400 hover:bg-base-hover'
                  }`}
                >
                  <ArrowDown size={16} /> Roll Under
                </button>
                <button
                  onClick={() => setMode('over')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-btn border px-4 py-2.5 text-sm font-semibold transition-all ${
                    mode === 'over'
                      ? 'border-accent-salmon/40 bg-accent-salmon-dim text-accent-salmon'
                      : 'border-border text-gray-400 hover:bg-base-hover'
                  }`}
                >
                  <ArrowUp size={16} /> Roll Over
                </button>
              </div>

              {/* Target Readout */}
              <div className="mb-4 text-center">
                <span className="font-mono text-5xl font-bold text-white">
                  {rolling ? '?' : target}
                </span>
                <span className="ml-1 text-lg text-gray-500">/ 100</span>
              </div>

              {/* Slider */}
              <div className="mb-6">
                <input
                  type="range"
                  min={2}
                  max={98}
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value))}
                  disabled={rolling}
                  className="w-full accent-accent-salmon"
                />
                <div className="mt-1 flex justify-between text-xs text-gray-600">
                  <span>2</span>
                  <span>98</span>
                </div>
              </div>

              {/* Number Line */}
              <div className="relative mb-6 h-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="h-2 w-full rounded-full bg-base-nested overflow-hidden">
                    {mode === 'under' ? (
                      <div
                        className="h-full bg-status-success/30"
                        style={{ width: `${target}%` }}
                      />
                    ) : (
                      <div
                        className="ml-auto h-full bg-status-success/30"
                        style={{ width: `${100 - target}%` }}
                      />
                    )}
                  </div>
                </div>
                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-accent-salmon"
                  style={{ left: `${target}%` }}
                />
                {/* Roll marker */}
                <div
                  className={`absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
                    lastResult?.won
                      ? 'border-status-success bg-status-success/20'
                      : lastResult
                        ? 'border-status-error bg-status-error/20'
                        : 'border-border-strong bg-base-surface'
                  } flex items-center justify-center transition-all duration-300`}
                  style={{ left: `${displayRoll}%` }}
                >
                  <span className="text-[10px] font-mono font-bold text-white">{displayRoll}</span>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <StatBox label="Win Chance" value={`${winChance.toFixed(1)}%`} />
                <StatBox label="Multiplier" value={`${multiplier.toFixed(2)}x`} />
                <StatBox label="Max Win" value={`${formatTrx(maxWin)}`} />
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
                    min={cfg.diceMinBet}
                    max={cfg.diceMaxBet}
                    className="input-base font-mono"
                    disabled={rolling}
                  />
                  {[1, 10, 100].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setAmount(String(chip))}
                      disabled={rolling}
                      className="btn-outline px-3"
                    >
                      {chip}
                    </button>
                  ))}
                  <button
                    onClick={() => setAmount(String(Math.min(cfg.diceMaxBet, Math.floor(currentUser.trxBalance))))}
                    disabled={rolling}
                    className="btn-outline px-3"
                  >
                    Max
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  Min: {cfg.diceMinBet} TRX · Max: {cfg.diceMaxBet} TRX · House edge: {cfg.houseEdgePercent}%
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={doRoll}
                disabled={rolling}
                className="btn-primary w-full py-3.5 text-base"
              >
                {rolling ? 'Rolling...' : 'Roll Dice'}
              </button>
            </div>
          </div>

          {/* Recent Rolls */}
          <div className="card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <History size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Recent Rolls</h3>
            </div>
            {userBets.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-gray-500">
                No rolls yet. Place your first bet above!
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
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">1.</span>Choose Roll Under or Roll Over</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">2.</span>Set your target number with the slider</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">3.</span>Lower win chance = higher multiplier</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">4.</span>Roll the dice and see if you win!</li>
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
