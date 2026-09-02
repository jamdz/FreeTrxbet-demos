import {
  Dice5,
  Dices,
  Rocket,
  Bomb,
  CircleDot,
  ArrowDownToLine,
  ShieldCheck,
  ArrowRight,
  Coins,
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage({
  onLogin,
  onRegister,
}: {
  onLogin: () => void;
  onRegister: () => void;
}) {
  const features = [
    {
      icon: Dice5,
      title: 'Hi-Lo',
      desc: 'Bet TRX on whether the next card is higher or lower. Transparent odds with adjustable house edge.',
    },
    {
      icon: Dices,
      title: 'Dice',
      desc: 'Choose your target, roll under or over, and see your win chance and multiplier live.',
    },
    {
      icon: Rocket,
      title: 'Limbo',
      desc: 'Set a target multiplier and beat the result for a fast, high-tension round.',
    },
    {
      icon: Bomb,
      title: 'Mines',
      desc: 'Reveal safe tiles, climb the multiplier, and cash out before you hit a mine.',
    },
    {
      icon: CircleDot,
      title: 'Plinko',
      desc: 'Drop balls through the pins with adjustable risk and row settings.',
    },
    {
      icon: ArrowDownToLine,
      title: 'TRX Wallet Tools',
      desc: 'Make manual deposits, request withdrawals, and track every transaction in one place.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Play',
      desc: 'Review your cross-game bet history, results, payouts, and performance stats anytime.',
    },
  ];

  return (
    <div className="min-h-screen bg-base-bg">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-base-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="btn-ghost">
              Log In
            </button>
            <button onClick={onRegister} className="btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-red/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-base-surface px-4 py-1.5 text-xs font-medium text-gray-400">
            <Coins size={14} className="text-accent-salmon" />
            Five games · One TRX balance
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Your TRX arcade,
            <br />
            <span className="text-accent-salmon">five ways to play</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base text-gray-500">
            Play Hi-Lo, Dice, Limbo, Mines, and Plinko with one shared balance, clear odds, and a complete deposit and withdrawal flow.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button onClick={onRegister} className="btn-primary">
              Explore the Games
              <ArrowRight size={16} />
            </button>
            <button onClick={onLogin} className="btn-outline">
              Log In
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Demo accounts available · admin@freetrxbet.com / admin123
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="card p-6 transition-colors hover:border-border-strong"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent-salmon-dim">
                <f.icon size={22} className="text-accent-salmon" />
              </div>
              <h3 className="mb-1.5 text-base font-semibold text-white">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="card overflow-hidden p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white">Ready to play?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Create an account to try every game with the same balance and track your results from one dashboard.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={onRegister} className="btn-primary">
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-gray-600">
          FreeTrxBet · Five games · No real cryptocurrency
        </p>
      </footer>
    </div>
  );
}
