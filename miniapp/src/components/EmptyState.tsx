import type { ComponentType } from 'react';

interface EmptyStateProps {
  readonly icon: ComponentType<{ className?: string }>;
  readonly title: string;
  readonly hint?: string;
}

/**
 * Generic "nothing here yet" card shown when a list screen has no items.
 */
export const EmptyState = ({ icon: Icon, title, hint }: EmptyStateProps) => (
  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 text-center">
    <Icon className="w-8 h-8 text-slate-500 mx-auto mb-2" />
    <p className="text-slate-400 text-sm">{title}</p>
    {hint && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
  </div>
);
