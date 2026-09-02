import { Wallet } from 'lucide-react';
import { formatTrx } from '@/lib/storage';

export default function BalanceDisplay({
  balance,
  size = 'md',
}: {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const padding =
    size === 'sm' ? 'px-3 py-1.5' : size === 'lg' ? 'px-5 py-3' : 'px-4 py-2';
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;
  const textSize =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-btn border border-border bg-base-nested ${padding}`}
    >
      <Wallet size={iconSize} className="text-accent-salmon" />
      <span className={`font-mono font-semibold ${textSize} text-white`}>
        {formatTrx(balance)}
      </span>
      <span className="text-xs font-medium text-gray-500">TRX</span>
    </div>
  );
}
