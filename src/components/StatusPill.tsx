import type { ReactNode } from 'react';

type Variant = 'success' | 'pending' | 'error' | 'neutral';

const styles: Record<Variant, string> = {
  success: 'bg-status-success-dim text-status-success border-status-success/20',
  pending: 'bg-status-pending-dim text-status-pending border-status-pending/20',
  error: 'bg-status-error-dim text-status-error border-status-error/20',
  neutral: 'bg-status-neutral-dim text-status-neutral border-status-neutral/20',
};

export default function StatusPill({
  variant,
  children,
}: {
  variant: Variant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[variant]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full bg-current`} />
      {children}
    </span>
  );
}
