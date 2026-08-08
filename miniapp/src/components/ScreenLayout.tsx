import type { ReactNode } from 'react';

interface ScreenHeaderAction {
  readonly icon: ReactNode;
  readonly label?: string;
  readonly onClick: () => void;
  readonly variant?: 'primary' | 'ghost';
  readonly disabled?: boolean;
}

interface ScreenLayoutProps {
  readonly title?: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly actions?: ReadonlyArray<ScreenHeaderAction>;
  readonly children: ReactNode;
}

const variantClasses: Record<NonNullable<ScreenHeaderAction['variant']>, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500',
  ghost: 'bg-slate-800 hover:bg-slate-700 border border-slate-700',
};

/**
 * Standard screen chrome: a back chevron, an optional title/subtitle row,
 * and a cluster of action buttons (add/refresh/etc). Screen bodies render
 * underneath inside the same padded dark container used across the app.
 */
export const ScreenLayout = ({
  title,
  subtitle,
  onBack,
  actions,
  children,
}: ScreenLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors text-sm"
          >
            <span className="text-base">←</span> Назад
          </button>
        ) : (
          <span />
        )}
        {actions && actions.length > 0 ? (
          <div className="flex items-center gap-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled}
                aria-label={action.label}
                className={`p-2 rounded-lg ${
                  variantClasses[action.variant ?? 'ghost']
                } disabled:opacity-50`}
              >
                {action.icon}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {title && (
        <h1 className="text-lg font-semibold text-slate-100 mb-4">{title}</h1>
      )}
      {subtitle && <p className="text-xs text-slate-500 -mt-3 mb-4">{subtitle}</p>}

      {children}
    </div>
  );
};
