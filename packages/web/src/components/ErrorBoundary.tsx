import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback to render on error — defaults to a styled error panel */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors in child components and displays a recovery UI
 * instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging — replace with a proper service in production
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-[400px] items-center justify-center p-8"
          role="alert"
        >
          <div className="max-w-md rounded-xl border border-red-800/50 bg-red-950/30 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-red-300">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              An unexpected error occurred. You can try refreshing the page or navigating elsewhere.
            </p>
            {this.state.error && (
              <p className="mb-6 rounded-lg bg-red-950/50 p-3 text-left text-xs font-mono text-red-400/80">
                {this.state.error.message}
              </p>
            )}
            <div className="flex justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-red-800/50 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-800/70 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                className="rounded-lg bg-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/70 transition-colors"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
