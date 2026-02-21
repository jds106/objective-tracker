interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onRetry, className = '' }: ErrorAlertProps) {
  return (
    <div className={`rounded-xl border border-red-500/20 bg-red-500/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-400 mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-400">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
