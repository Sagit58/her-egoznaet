interface StatusBadgeProps {
  readonly label: string;
  readonly className?: string;
}

/**
 * Small pill used for order/role/stage statuses. Pass the resolved color
 * class via `className`; falls back to a neutral slate style.
 */
export const StatusBadge = ({ label, className }: StatusBadgeProps) => (
  <span
    className={`text-xs px-2 py-1 rounded border ${
      className ?? 'bg-slate-700 text-slate-300 border-slate-600'
    }`}
  >
    {label}
  </span>
);
