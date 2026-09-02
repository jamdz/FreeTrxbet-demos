import { Coins } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="flex items-center justify-center rounded-lg bg-gradient-to-br from-accent-red to-red-700 shadow-lg shadow-red-900/30"
        style={{ width: iconSize + 12, height: iconSize + 12 }}
      >
        <Coins size={iconSize} className="text-white" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`font-bold tracking-tight ${textSize} text-white`}>
          Free<span className="text-accent-salmon">Trx</span>Bet
        </span>
      )}
    </div>
  );
}
