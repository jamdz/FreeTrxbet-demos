import { useState, useMemo } from 'react';
import { Bomb, Gem, History, Volume2, VolumeX, Flag } from 'lucide-react';
import { useApp, applyHouseEdge } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import { formatTrx, formatDate } from '@/lib/storage';
import { play, setMuted, isMuted } from '@/lib/sounds';
import type { Bet } from '@/types';

const GRID_SIZE = 25;

// Combinatorics: probability of revealing k safe tiles out of (25 - mineCount) safe tiles
function minesMultiplier(revealed: number, mineCount: number): number {
  const totalTiles = GRID_SIZE;
  const safeTiles = totalTiles - mineCount;
  if (revealed === 0) return 1;
  // Fair multiplier = C(total, revealed) / C(safe, revealed)
  // = product of (total - i) / (safe - i) for i in 0..revealed-1
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    mult *= (totalTiles - i) / (safeTiles - i);
  }
  return mult;
}

interface TileState {
  revealed: boolean;
  isMine: boolean;
}

export default function MinesPage() {
  const { currentUser, store, placeGameBet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('10');
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<TileState[]>(() =>
    Array.from({ length: GRID_SIZE }, () => ({ revealed: false, isMine: false })),
  );
  const [roundActive, setRoundActive] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const [soundOn, setSoundOn] = useState(!isMuted());

  const cfg = store.siteConfig;

  const currentMultiplier = useMemo(() => {
    if (revealedCount === 0) return 1;
    return applyHouseEdge(minesMultiplier(revealedCount, mineCount), cfg.houseEdgePercent);
  }, [revealedCount, mineCount, cfg.houseEdgePercent]);

  const nextTileMultiplier = useMemo(() => {
    return applyHouseEdge(minesMultiplier(revealedCount + 1, mineCount), cfg.houseEdgePercent);
  }, [revealedCount, mineCount, cfg.houseEdgePercent]);

  if (!currentUser) return null;

  const userBets = store.bets.filter((b) => b.userId === currentUser.id && b.game === 'mines').slice(0, 15);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  };

  const startRound = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid bet amount', 'error');
      return;
    }

    // Place a "pending" bet — we deduct the bet amount now, settle on cashout/bust
    const result = placeGameBet({
      game: 'mines',
      amount: amt,
      minBet: cfg.minesMinBet,
      maxBet: cfg.minesMaxBet,
      multiplier: 1,
      outcome: 'loss',
      payout: 0,
      detail: `${mineCount} mines · started`,
    });

    if (!result.ok) {
      notify(result.error || 'Failed to start round', 'error');
      return;
    }

    play('bet');

    // Place mines randomly
    const minePositions = new Set<number>();
    while (minePositions.size < mineCount) {
      minePositions.add(Math.floor(Math.random() * GRID_SIZE));
    }

    const newGrid: TileState[] = Array.from({ length: GRID_SIZE }, (_, i) => ({
      revealed: false,
      isMine: minePositions.has(i),
    }));

    setGrid(newGrid);
    setRevealedCount(0);
    setRoundActive(true);
    notify('Round started — reveal tiles to climb the multiplier!', 'info');
  };

  const revealTile = (index: number) => {
    if (!roundActive || grid[index].revealed) return;

    const newGrid = [...grid];
    newGrid[index] = { ...newGrid[index], revealed: true };
    setGrid(newGrid);

    if (newGrid[index].isMine) {
      // Bust!
      play('loss');
      // Reveal all mines
      const allRevealed = newGrid.map((t) => ({ ...t, revealed: true }));
      setGrid(allRevealed);
      setRoundActive(false);
      setRevealedCount(0);
      const amt = parseFloat(amount);
      notify(`Boom! You lost ${formatTrx(amt)} TRX`, 'error');
    } else {
      play('cardReveal');
      const newCount = revealedCount + 1;
      setRevealedCount(newCount);

      // Check if all safe tiles revealed
      if (newCount === GRID_SIZE - mineCount) {
        // Auto-cashout
        cashOut(newCount);
      }
    }
  };

  const cashOut = (overrideCount?: number) => {
    if (!roundActive) return;
    const count = overrideCount ?? revealedCount;
    if (count === 0) {
      notify('Reveal at least one tile before cashing out', 'error');
      return;
    }

    const amt = parseFloat(amount);
    const mult = applyHouseEdge(minesMultiplier(count, mineCount), cfg.houseEdgePercent);
    const payout = +(amt * mult).toFixed(2);

    play('win');

    // Record the winning bet (the initial bet was already recorded as a loss,
    // so we add a new bet record for the win)
    const result = placeGameBet({
      game: 'mines',
      amount: 0, // already deducted
      minBet: 0,
      maxBet: Infinity,
      multiplier: mult,
      outcome: 'win',
      payout,
      detail: `${mineCount} mines · ${count} tiles · cashed out ${mult.toFixed(2)}x`,
    });

    if (result.ok) {
      notify(`Cashed out ${formatTrx(payout)} TRX at ${mult.toFixed(2)}x!`, 'success');
    }

    setRoundActive(false);
    setRevealedCount(0);
    // Reveal remaining tiles
    const allRevealed = grid.map((t) => ({ ...t, revealed: true }));
    setGrid(allRevealed);
  };

  const currentPayout = +(parseFloat(amount || '0') * currentMultiplier).toFixed(2);
  const nextPayout = +(parseFloat(amount || '0') * nextTileMultiplier).toFixed(2);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Game Card */}
          <div className="card overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                    <Bomb size={20} className="text-accent-salmon" />
                    Mines
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {roundActive ? `${revealedCount} tiles revealed` : 'Reveal tiles, avoid mines, cash out anytime'}
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
              {/* Mines Grid */}
              <div className="mx-auto mb-6 grid max-w-md grid-cols-5 gap-2">
                {grid.map((tile, i) => (
                  <button
                    key={i}
                    onClick={() => revealTile(i)}
                    disabled={!roundActive || tile.revealed}
                    className={`aspect-square rounded-lg border-2 transition-all duration-200 ${
                      tile.revealed
                        ? tile.isMine
                          ? 'border-status-error bg-status-error-dim'
                          : 'border-status-success/40 bg-status-success-dim'
                        : roundActive
                          ? 'border-border-strong bg-base-nested hover:border-accent-salmon/40 hover:bg-base-hover active:scale-95 cursor-pointer'
                          : 'border-border bg-base-nested opacity-50'
                    } flex items-center justify-center`}
                  >
                    {tile.revealed ? (
                      tile.isMine ? (
                        <Bomb size={24} className="text-status-error" />
                      ) : (
                        <Gem size={24} className="text-status-success" />
                      )
                    ) : (
                      <span className="text-xs text-gray-700">·</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Pre-round config or round status */}
              {!roundActive && (
                <div className="space-y-4">
                  {/* Mine Count Selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Mine Count
                    </label>
                    <div className="flex gap-2">
                      {cfg.minesAllowedCounts.map((count) => (
                        <button
                          key={count}
                          onClick={() => setMineCount(count)}
                          className={`flex-1 rounded-btn border px-4 py-2.5 text-sm font-semibold transition-all ${
                            mineCount === count
                              ? 'border-accent-salmon/40 bg-accent-salmon-dim text-accent-salmon'
                              : 'border-border text-gray-400 hover:bg-base-hover'
                          }`}
                        >
                          {count} mines
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-400">
                      Bet Amount (TRX)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={cfg.minesMinBet}
                        max={cfg.minesMaxBet}
                        className="input-base font-mono"
                      />
                      {[1, 10, 100].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => setAmount(String(chip))}
                          className="btn-outline px-3"
                        >
                          {chip}
                        </button>
                      ))}
                      <button
                        onClick={() => setAmount(String(Math.min(cfg.minesMaxBet, Math.floor(currentUser.trxBalance))))}
                        className="btn-outline px-3"
                      >
                        Max
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-600">
                      Min: {cfg.minesMinBet} TRX · Max: {cfg.minesMaxBet} TRX · House edge: {cfg.houseEdgePercent}%
                    </p>
                  </div>

                  <button onClick={startRound} className="btn-primary w-full py-3.5 text-base">
                    Start Round
                  </button>
                </div>
              )}
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
                No bets yet. Start your first round above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-gray-500">
                      <th className="px-5 py-2.5 text-left font-medium">Time</th>
                      <th className="px-5 py-2.5 text-center font-medium">Detail</th>
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

        {/* Right Rail */}
        <div className="space-y-4">
          {roundActive ? (
            <>
              <div className="card p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Current Round</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Multiplier</span>
                    <span className="font-mono text-2xl font-bold text-accent-salmon">
                      {currentMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Cash Out Value</span>
                    <span className="font-mono text-lg font-bold text-status-success">
                      {formatTrx(currentPayout)} TRX
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-gray-500">Mines</span>
                    <span className="font-mono text-sm text-white">{mineCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Bet</span>
                    <span className="font-mono text-sm text-white">{formatTrx(parseFloat(amount))} TRX</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Next tile if safe</span>
                    <span className="font-mono text-sm text-gray-300">
                      {nextTileMultiplier.toFixed(2)}x · {formatTrx(nextPayout)} TRX
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => cashOut()}
                  disabled={revealedCount === 0}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-status-success px-5 py-3 text-sm font-bold text-white transition-all hover:bg-green-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Flag size={16} />
                  Cash Out — {formatTrx(currentPayout)} TRX
                </button>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <h3 className="mb-2 text-sm font-semibold text-white">How to Play</h3>
              <ol className="space-y-2 text-xs text-gray-400">
                <li className="flex gap-2"><span className="font-mono text-accent-salmon">1.</span>Choose mine count and bet amount</li>
                <li className="flex gap-2"><span className="font-mono text-accent-salmon">2.</span>Start the round and reveal tiles</li>
                <li className="flex gap-2"><span className="font-mono text-accent-salmon">3.</span>Each safe tile increases your multiplier</li>
                <li className="flex gap-2"><span className="font-mono text-accent-salmon">4.</span>Cash out anytime — but hit a mine and you lose!</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
