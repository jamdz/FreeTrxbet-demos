import { Crown, ArrowRight } from 'lucide-react';

const PRO_LINK = 'https://t.me/NodeForgeTech_bot';

export default function ProBanner() {
  return (
    <div className="relative z-50 w-full bg-gradient-to-r from-accent-salmon/20 via-accent-red/15 to-accent-salmon/20 border-b border-accent-salmon/20">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-salmon to-accent-red">
            <Crown size={14} className="text-white" />
          </div>
          <p className="truncate text-sm text-gray-200">
            <span className="font-semibold text-white">Unlock Pro</span>
            <span className="hidden sm:inline text-gray-400"> — higher limits, exclusive games & priority withdrawals</span>
          </p>
        </div>
        <a
          href={PRO_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-shrink-0 items-center gap-1.5 rounded-btn bg-gradient-to-r from-accent-red to-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-accent-red/20 transition-all hover:shadow-accent-red/40 hover:brightness-110 active:scale-[0.97]"
        >
          Get Pro
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </div>
  );
}
