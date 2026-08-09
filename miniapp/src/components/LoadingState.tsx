interface LoadingStateProps {
  readonly text?: string;
}

/**
 * Standard loading placeholder card — a direct replacement for the inline
 * "Загрузка..." block that was previously duplicated on every list screen.
 */
export const LoadingState = ({ text = 'Загрузка...' }: LoadingStateProps) => (
  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
    <p className="text-slate-400 text-sm">{text}</p>
  </div>
);
