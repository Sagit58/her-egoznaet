interface ErrorStateProps {
  readonly error: string;
  readonly prefix?: string;
}

/**
 * Standard error card — a direct replacement for the inline red error block
 * that was previously duplicated on every list screen.
 */
export const ErrorState = ({ error, prefix = 'Ошибка' }: ErrorStateProps) => (
  <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
    <p className="text-red-400 text-sm">
      {prefix}: {error}
    </p>
  </div>
);
