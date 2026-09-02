import { Dice5, Dices, Rocket, Bomb, CircleDot, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatTrx } from '@/lib/storage';
import type { GameType } from '@/types';

interface GameCard {
  id: GameType;
  name: string;
  description: string;
  icon: typeof Dice5;
  minBet: number;
  maxBet: number;
  route: string;
}

export default function GamesHubPage({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) {
  const { currentUser, store } = useApp();
  if (!currentUser) return null;
  const cfg = store.siteConfig;

  const games: GameCard[] = [
    {
      id: 'hilo',
      name: 'Hi-Lo',
      description: 'Will the next card be higher or lower?',
      icon: Dice5,
      minBet: cfg.hiLoMinBet,
      maxBet: cfg.hiLoMaxBet,
      route: 'hilo',
    },
    {
      id: 'dice',
      name: 'Dice',
      description: 'Roll under or over your target number.',
      icon: Dices,
      minBet: cfg.diceMinBet,
      maxBet: cfg.diceMaxBet,
      route: 'dice',
    },
    {
      id: 'limbo',
      name: 'Limbo',
      description: 'Set a target multiplier and beat the odds.',
      icon: Rocket,
      minBet: cfg.limboMinBet,
      maxBet: cfg.limboMaxBet,
      route: 'limbo',
    },
    {
      id: 'mines',
      name: 'Mines',
      description: 'Reveal tiles, avoid mines, cash out anytime.',
      icon: Bomb,
      minBet: cfg.minesMinBet,
      maxBet: cfg.minesMaxBet,
      route: 'mines',
    },
    {
      id: 'plinko',
      name: 'Plinko',
      description: 'Drop the ball through pins into multiplier slots.',
      icon: CircleDot,
      minBet: cfg.plinkoMinBet,
      maxBet: cfg.plinkoMaxBet,
      route: 'plinko',
    },
  ];

  const userBets = store.bets.filter((b) => b.userId === currentUser.id);
  const totalWagered = userBets.reduce((s, b) => s + b.amount, 0);
  const wins = userBets.filter((b) => b.outcome === 'win').length;
  const losses = userBets.filter((b) => b.outcome === 'loss').length;
  const winRate = userBets.length > 0 ? (wins / userBets.length) * 100 : 0;
  const netPL = userBets.reduce(
    (s, b) => s + (b.outcome === 'win' ? b.payout - b.amount : -b.amount),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Games</h1>
        <p className="mt-0.5 text-sm text-gray-500">Choose a game to play</p>
      </div>

      {/* Game Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => onNavigate(game.route)}
            className="card group p-5 text-left transition-all hover:border-border-strong hover:bg-base-hover/30 active:scale-[0.99]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent-salmon-dim transition-transform group-hover:scale-110">
              <game.icon size={24} className="text-accent-salmon" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-white">{game.name}</h3>
            <p className="mb-3 text-xs text-gray-500">{game.description}</p>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-mono">Min–Max: {game.minBet}–{game.maxBet} TRX</span>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Panel */}
      <div className="mt-6 card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Trophy size={16} className="text-accent-salmon" />
          Your Stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Bets" value={String(userBets.length)} />
          <StatCard
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            subValue={`${wins}W / ${losses}L`}
          />
          <StatCard label="Total Wagered" value={`${formatTrx(totalWagered)} TRX`} />
          <StatCard
            label="Net P/L"
            value={`${netPL >= 0 ? '+' : ''}${formatTrx(netPL)} TRX`}
            valueClass={netPL >= 0 ? 'text-status-success' : 'text-status-error'}
            icon={netPL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  valueClass = 'text-white',
  icon,
}: {
  label: string;
  value: string;
  subValue?: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-btn border border-border bg-base-nested p-4">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className={`flex items-center gap-1 font-mono text-lg font-bold ${valueClass}`}>
        {icon}
        {value}
      </p>
      {subValue && <p className="mt-0.5 text-xs text-gray-600">{subValue}</p>}
    </div>
  );
}
