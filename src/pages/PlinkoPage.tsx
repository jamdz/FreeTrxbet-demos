import { useState, useMemo, useRef, useEffect } from 'react';
import { CircleDot, History, Volume2, VolumeX } from 'lucide-react';
import { useApp, applyHouseEdge } from '@/context/AppContext';
import { useToast } from '@/components/Toast';
import BalanceDisplay from '@/components/BalanceDisplay';
import { formatTrx, formatDate } from '@/lib/storage';
import { play, setMuted, isMuted } from '@/lib/sounds';
import type { Bet, PlinkoRisk } from '@/types';

// Multiplier tables for each risk/row combination
// These are the fair multipliers for the center bins, spread to edges
const MULTIPLIER_TABLES: Record<PlinkoRisk, Record<number, number[]>> = {
  low: {
    12: [5.6, 2.1, 1.1, 1.0, 0.5, 0.3, 0.5, 1.0, 1.1, 2.1, 5.6, 13],
    14: [7.1, 3.0, 1.5, 1.0, 0.7, 0.5, 0.3, 0.5, 0.7, 1.0, 1.5, 3.0, 7.1, 14],
    16: [9.0, 3.8, 2.0, 1.4, 1.1, 0.6, 0.4, 0.3, 0.4, 0.6, 1.1, 1.4, 2.0, 3.8, 9.0, 16],
  },
  medium: {
    12: [13, 4, 2, 1.1, 0.6, 0.3, 0.2, 0.3, 0.6, 1.1, 2, 4, 13],
    14: [18, 6, 3, 1.5, 0.7, 0.4, 0.2, 0.4, 0.7, 1.5, 3, 6, 18],
    16: [22, 8, 4, 2, 1.2, 0.6, 0.3, 0.2, 0.3, 0.6, 1.2, 2, 4, 8, 22],
  },
  high: {
    12: [29, 7, 3, 1.0, 0.4, 0.2, 0.1, 0.2, 0.4, 1.0, 3, 7, 29],
    14: [42, 10, 4, 1.5, 0.5, 0.2, 0.1, 0.2, 0.5, 1.5, 4, 10, 42],
    16: [58, 15, 7, 2, 0.6, 0.3, 0.1, 0.05, 0.1, 0.3, 0.6, 2, 7, 15, 58],
  },
};

interface BallPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

export default function PlinkoPage() {
  const { currentUser, store, placeGameBet } = useApp();
  const { notify } = useToast();
  const [amount, setAmount] = useState('10');
  const [risk, setRisk] = useState<PlinkoRisk>('medium');
  const [rows, setRows] = useState(12);
  const [dropping, setDropping] = useState(false);
  const [autoDrop, setAutoDrop] = useState(false);
  const [lastBin, setLastBin] = useState<number | null>(null);
  const [ballPos, setBallPos] = useState<BallPosition | null>(null);
  const [soundOn, setSoundOn] = useState(!isMuted());
  const [history, setHistory] = useState<{ bin: number; mult: number; payout: number; won: boolean }[]>([]);
  const autoDropRef = useRef(autoDrop);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cfg = store.siteConfig;

  const multipliers = useMemo(() => {
    return MULTIPLIER_TABLES[risk][rows];
  }, [risk, rows]);

  if (!currentUser) return null;

  const userBets = store.bets.filter((b) => b.userId === currentUser.id && b.game === 'plinko').slice(0, 15);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMuted(!next);
  };

  const dropBall = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      notify('Enter a valid bet amount', 'error');
      return;
    }

    play('bet');
    setDropping(true);
    setLastBin(null);

    // Simulate ball drop using binomial distribution
    // Each row, ball goes left or right
    let bin = 0;
    for (let i = 0; i < rows; i++) {
      if (Math.random() < 0.5) bin++; // right
    }

    const mult = multipliers[bin];
    const won = mult >= 1;
    const payout = +(amt * mult).toFixed(2);
    const outcome = won ? 'win' as const : 'loss' as const;

    // Animate ball position
    let currentRow = 0;
    let currentCol = 0;
    const animInterval = setInterval(() => {
      if (currentRow >= rows) {
        clearInterval(animInterval);
        setBallPos(null);
        setLastBin(bin);

        const result = placeGameBet({
          game: 'plinko',
          amount: amt,
          minBet: cfg.plinkoMinBet,
          maxBet: cfg.plinkoMaxBet,
          multiplier: mult,
          outcome,
          payout,
          detail: `${risk} ${rows} rows → bin ${bin} (${mult}x)`,
        });

        if (!result.ok) {
          notify(result.error || 'Bet failed', 'error');
          setDropping(false);
          return;
        }

        setHistory((h) => [{ bin, mult, payout, won }, ...h].slice(0, 20));
        setDropping(false);

        if (won) {
          play('win');
          if (mult >= 5) notify(`Big win! ${formatTrx(payout)} TRX at ${mult}x!`, 'success');
        } else {
          play('loss');
        }

        // Auto-drop next ball
        if (autoDropRef.current) {
          setTimeout(() => dropBall(), 300);
        }
      } else {
        // Randomly go left or right
        if (Math.random() < 0.5) currentCol++;
        setBallPos({ x: currentCol, y: currentRow, row: currentRow, col: currentCol });
        play('cardReveal');
        currentRow++;
      }
    }, 60);
  };

  useEffect(() => {
    autoDropRef.current = autoDrop;
  }, [autoDrop]);

  // Draw the Plinko board on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padding = 20;
    const boardW = w - padding * 2;
    const boardH = h - 60;
    const rowSpacing = boardH / (rows + 1);
    const colSpacing = boardW / rows;

    // Draw pins
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let r = 0; r < rows; r++) {
      const pinCount = r + 2;
      const startX = padding + boardW / 2 - ((pinCount - 1) * colSpacing) / 2;
      for (let c = 0; c < pinCount; c++) {
        const x = startX + c * colSpacing;
        const y = padding + 20 + (r + 1) * rowSpacing;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw multiplier slots at bottom
    const slotCount = rows + 1;
    const slotWidth = boardW / slotCount;
    for (let i = 0; i < slotCount; i++) {
      const mult = multipliers[i];
      const x = padding + i * slotWidth;
      const y = h - 40;
      const isWin = mult >= 1;
      // Amber-to-orange gradient based on multiplier value
      const intensity = Math.min(1, mult / 10);
      const r = 255;
      const g = Math.floor(180 - intensity * 80);
      const b = Math.floor(50 - intensity * 50);
      ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
      ctx.fillRect(x + 1, y, slotWidth - 2, 32);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y, slotWidth - 2, 32);
      ctx.fillStyle = `rgb(${r},${g + 40},${b})`;
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${mult}x`, x + slotWidth / 2, y + 20);
    }

    // Draw ball if animating
    if (ballPos) {
      const pinCount = ballPos.row + 2;
      const startX = padding + boardW / 2 - ((pinCount - 1) * colSpacing) / 2;
      const x = startX + ballPos.col * colSpacing;
      const y = padding + 20 + (ballPos.row + 1) * rowSpacing;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffb3ad';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Highlight last bin
    if (lastBin !== null) {
      const slotWidth = boardW / (rows + 1);
      const x = padding + lastBin * slotWidth;
      const y = h - 40;
      ctx.strokeStyle = '#ffb3ad';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y, slotWidth - 2, 32);
    }
  }, [rows, multipliers, ballPos, lastBin]);

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
                    <CircleDot size={20} className="text-accent-salmon" />
                    Plinko
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Drop the ball through pins into multiplier slots
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
              {/* Risk & Row Selectors */}
              <div className="mb-5 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Risk Level</label>
                  <div className="flex gap-1">
                    {(['low', 'medium', 'high'] as PlinkoRisk[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRisk(r)}
                        disabled={dropping}
                        className={`flex-1 rounded-btn border px-2 py-2 text-xs font-semibold capitalize transition-all ${
                          risk === r
                            ? 'border-accent-salmon/40 bg-accent-salmon-dim text-accent-salmon'
                            : 'border-border text-gray-400 hover:bg-base-hover'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">Rows</label>
                  <div className="flex gap-1">
                    {[12, 14, 16].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRows(r)}
                        disabled={dropping}
                        className={`flex-1 rounded-btn border px-2 py-2 text-xs font-semibold transition-all ${
                          rows === r
                            ? 'border-accent-salmon/40 bg-accent-salmon-dim text-accent-salmon'
                            : 'border-border text-gray-400 hover:bg-base-hover'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plinko Board Canvas */}
              <div className="mb-5 flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={380}
                  className="rounded-card border border-border bg-base-nested"
                />
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
                    min={cfg.plinkoMinBet}
                    max={cfg.plinkoMaxBet}
                    className="input-base font-mono"
                    disabled={dropping}
                  />
                  <button
                    onClick={() => setAmount((a) => String(Math.max(cfg.plinkoMinBet, Math.floor(parseFloat(a || '0') / 2))))}
                    disabled={dropping}
                    className="btn-outline px-3"
                  >
                    /2
                  </button>
                  <button
                    onClick={() => setAmount((a) => String(Math.min(cfg.plinkoMaxBet, Math.floor(parseFloat(a || '0') * 2))))}
                    disabled={dropping}
                    className="btn-outline px-3"
                  >
                    x2
                  </button>
                  {[1, 10, 100].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setAmount(String(chip))}
                      disabled={dropping}
                      className="btn-outline px-3"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  Min: {cfg.plinkoMinBet} TRX · Max: {cfg.plinkoMaxBet} TRX · House edge: {cfg.houseEdgePercent}%
                </p>
              </div>

              {/* Auto Drop Toggle */}
              <div className="mb-4 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoDrop}
                    onChange={(e) => setAutoDrop(e.target.checked)}
                    disabled={dropping}
                    className="h-4 w-4 accent-accent-red"
                  />
                  <span className="text-sm text-gray-400">Auto Drop</span>
                </label>
                {autoDrop && (
                  <span className="text-xs text-gray-600">
                    Balls will drop automatically until you uncheck
                  </span>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={dropBall}
                disabled={dropping}
                className="btn-primary w-full py-3.5 text-base"
              >
                {dropping ? 'Dropping...' : 'Drop Ball'}
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
                No bets yet. Drop your first ball above!
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

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-white">How to Play</h3>
            <ol className="space-y-2 text-xs text-gray-400">
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">1.</span>Choose risk level and row count</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">2.</span>Higher risk = wider multiplier spread</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">3.</span>More rows = more bins, bigger extremes</li>
              <li className="flex gap-2"><span className="font-mono text-accent-salmon">4.</span>Drop the ball and watch where it lands!</li>
            </ol>
          </div>

          {/* Recent Results Strip */}
          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="mb-3 text-sm font-semibold text-white">Recent Results</h3>
              <div className="flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <span
                    key={i}
                    className={`rounded-md border px-2 py-1 font-mono text-xs font-semibold ${
                      h.won
                        ? 'border-status-success/20 bg-status-success-dim text-status-success'
                        : 'border-status-error/20 bg-status-error-dim text-status-error'
                    }`}
                  >
                    {h.mult}x
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
