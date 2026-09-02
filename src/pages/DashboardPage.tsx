import { useState } from 'react';
import { TrendingUp, TrendingDown, Dice5, History, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useApp, applyHouseEdge } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import StatusPill from '@/components/StatusPill';
import { formatTrx, formatDate } from '@/lib/storage';
import { play, setMuted, isMuted } from '@/lib/sounds';
import type { Bet, BetOutcome } from '@/types';

export default function DashboardPage() {
  const { currentUser, store, placeGameBet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('10');
  const [lastBet, setLastBet] = useState<Bet | null>(null);
  const [betting, setBetting] = useState(false);
  const [cardAnim, setCardAnim] = useState(false);
  const [soundOn, setSoundOn] = useState(!isMuted());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  };

  if (!currentUser) return null;
  const cfg = store.siteConfig;
  const userBets = store.bets.filter((b) => b.userId === currentUser.id && b.game === 'hilo').slice(0, 20);

  const doBet = (direction: 'higher' | 'lower') => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid bet amount', 'error');
      return;
    }
    play('bet');
    setBetting(true);
    setCardAnim(true);
    setTimeout(() => {
      const cardValue = Math.floor(Math.random() * 100) + 1;
      const winChance = direction === 'higher' ? 100 - cardValue : cardValue - 1;
      const fairMultiplier = winChance > 0 ? 100 / winChance : 0;
      const multiplier = applyHouseEdge(fairMultiplier, cfg.houseEdgePercent);
      const isWin = Math.random() * 100 < winChance;
      const outcome: BetOutcome = isWin ? 'win' : 'loss';
      const payout = isWin ? +(amt * multiplier).toFixed(2) : 0;

      const result = placeGameBet({
        game: 'hilo',
        amount: amt,
        minBet: cfg.hiLoMinBet,
        maxBet: cfg.hiLoMaxBet,
        multiplier,
        outcome,
        payout,
        detail: `${direction} ${cardValue}`,
      });

      if (!result.ok) {
        notify(result.error || 'Bet failed', 'error');
        setBetting(false);
        setCardAnim(false);
        return;
      }
      play('cardReveal');
      setLastBet(result.bet || null);
      setBetting(false);
      setCardAnim(false);
      if (result.bet?.outcome === 'win') {
        play('win');
        notify(`You won ${formatTrx(result.bet.payout)} TRX!`, 'success');
      } else {
        play('loss');
        notify('You lost this round', 'error');
      }
    }, 600);
  };

  const cardValue = lastBet ? parseInt(lastBet.detail.split(' ')[1]) : 50;
  const winChanceHigher = 100 - cardValue;
  const winChanceLower = cardValue - 1;
  const multiplierHigher = winChanceHigher > 0 ? applyHouseEdge(100 / winChanceHigher, cfg.houseEdgePercent) : 0;
  const multiplierLower = winChanceLower > 0 ? applyHouseEdge(100 / winChanceLower, cfg.houseEdgePercent) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Game Card */}
          <div className="card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Dice5 size={20} className="text-accent-salmon" />
                    Hi-Lo Card Game
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Will the next card be higher or lower than {cardValue}?
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className="rounded-btn p-1.5 text-gray-400 transition-colors hover:bg-base-hover hover:text-white"
                    title={soundOn ? 'Mute sounds' : 'Unmute sounds'}
                  >
                    {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                  <BalanceDisplay balance={currentUser.trxBalance} size="sm" />
                </div>
              </div>
            </div>

            <div className="px-6 py-8">
              {/* Card Display */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-48 w-36 flex-col items-center justify-center rounded-xl border-2 ${
                    lastBet?.outcome === 'win'
                      ? 'border-status-success bg-status-success-dim'
                      : lastBet?.outcome === 'loss'
                        ? 'border-status-error bg-status-error-dim'
                        : 'border-border-strong bg-base-nested'
                  } ${cardAnim ? 'animate-scale-in' : ''} transition-all`}
                >
                  <span className="text-xs font-medium text-gray-500">CARD</span>
                  <span className="my-1 font-mono text-6xl font-bold text-white">
                    {cardAnim ? '?' : cardValue}
                  </span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>

                {lastBet && !cardAnim && (
                  <div className="mt-4 animate-fade-in">
                    <StatusPill variant={lastBet.outcome === 'win' ? 'success' : 'error'}>
                      {lastBet.outcome === 'win'
                        ? `Won ${formatTrx(lastBet.payout)} TRX`
                        : `Lost ${formatTrx(lastBet.amount)} TRX`}
                    </StatusPill>
                  </div>
                )}
              </div>

              {/* Bet Amount */}
              <div className="mt-6">
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Bet Amount (TRX)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={cfg.hiLoMinBet}
                    max={cfg.hiLoMaxBet}
                    className="input-base font-mono"
                    disabled={betting}
                  />
                  <button
                    onClick={() => setAmount(String(cfg.hiLoMinBet))}
                    className="btn-outline px-3"
                    disabled={betting}
                  >
                    Min
                  </button>
                  <button
                    onClick={() => setAmount(String(Math.min(cfg.hiLoMaxBet, Math.floor(currentUser.trxBalance))))}
                    className="btn-outline px-3"
                    disabled={betting}
                  >
                    Max
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  Min: {cfg.hiLoMinBet} TRX · Max: {cfg.hiLoMaxBet} TRX · House edge: {cfg.houseEdgePercent}%
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => doBet('higher')}
                  disabled={betting}
                  className="group relative overflow-hidden rounded-btn bg-gradient-to-br from-status-success/20 to-status-success/5 border border-status-success/30 px-6 py-4 transition-all hover:border-status-success/60 active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp size={22} className="text-status-success" />
                    <div className="text-left">
                      <div className="text-base font-bold text-white">HIGHER</div>
                      <div className="text-xs text-gray-400">
                        {winChanceHigher.toFixed(0)}% · {multiplierHigher.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => doBet('lower')}
                  disabled={betting}
                  className="group relative overflow-hidden rounded-btn bg-gradient-to-br from-status-error/20 to-status-error/5 border border-status-error/30 px-6 py-4 transition-all hover:border-status-error/60 active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <TrendingDown size={22} className="text-status-error" />
                    <div className="text-left">
                      <div className="text-base font-bold text-white">LOWER</div>
                      <div className="text-xs text-gray-400">
                        {winChanceLower.toFixed(0)}% · {multiplierLower.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Bet History */}
          <div className="card">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4">
              <History size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-white">Recent Bets</h3>
            </div>
            {userBets.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Sparkles size={32} className="mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-500">No bets yet. Place your first bet above!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-gray-500">
                      <th className="px-5 py-2.5 text-left font-medium">Time</th>
                      <th className="px-5 py-2.5 text-right font-medium">Bet</th>
                      <th className="px-5 py-2.5 text-center font-medium">Direction</th>
                      <th className="px-5 py-2.5 text-center font-medium">Card</th>
                      <th className="px-5 py-2.5 text-right font-medium">Multiplier</th>
                      <th className="px-5 py-2.5 text-right font-medium">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userBets.map((bet: Bet) => {
                      const [dir, card] = bet.detail.split(' ');
                      return (
                        <tr
                          key={bet.id}
                          className="border-b border-border/50 last:border-0 hover:bg-base-hover/50"
                        >
                          <td className="px-5 py-3 text-gray-400 text-xs">
                            {formatDate(bet.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-gray-300">
                            {formatTrx(bet.amount)}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                dir === 'higher' ? 'text-status-success' : 'text-status-error'
                              }`}
                            >
                              {dir === 'higher' ? (
                                <TrendingUp size={12} />
                              ) : (
                                <TrendingDown size={12} />
                              )}
                              {dir}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center font-mono text-white">
                            {card}
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-gray-400">
                            {bet.multiplier.toFixed(2)}x
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span
                              className={`font-mono font-semibold ${
                                bet.outcome === 'win' ? 'text-status-success' : 'text-status-error'
                              }`}
                            >
                              {bet.outcome === 'win'
                                ? `+${formatTrx(bet.payout)}`
                                : `-${formatTrx(bet.amount)}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Your Stats</h3>
            <div className="space-y-3">
              <StatRow label="Total Bets" value={String(userBets.length)} />
              <StatRow
                label="Wins"
                value={String(userBets.filter((b) => b.outcome === 'win').length)}
                valueClass="text-status-success"
              />
              <StatRow
                label="Losses"
                value={String(userBets.filter((b) => b.outcome === 'loss').length)}
                valueClass="text-status-error"
              />
              <StatRow
                label="Wagered"
                value={`${formatTrx(userBets.reduce((s, b) => s + b.amount, 0))} TRX`}
              />
              <StatRow
                label="Net P/L"
                value={`${formatTrx(
                  userBets.reduce((s, b) => s + (b.outcome === 'win' ? b.payout - b.amount : -b.amount), 0),
                )} TRX`}
                valueClass={
                  userBets.reduce((s, b) => s + (b.outcome === 'win' ? b.payout - b.amount : -b.amount), 0) >= 0
                    ? 'text-status-success'
                    : 'text-status-error'
                }
              />
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">How to Play</h3>
            <ol className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2">
                <span className="font-mono text-accent-salmon">1.</span>
                Enter your bet amount in TRX
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-accent-salmon">2.</span>
                Choose HIGHER or LOWER than the current card value
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-accent-salmon">3.</span>
                Win pays your bet × multiplier based on probability
              </li>
              <li className="flex gap-2">
                <span className="font-mono text-accent-salmon">4.</span>
                Lower probability = higher payout
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`font-mono text-sm font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}
