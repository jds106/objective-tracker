import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onRetry, className = '' }: ErrorAlertProps) {
  return (
    <div className={`rounded-xl border border-red-500/20 bg-red-500/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
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
