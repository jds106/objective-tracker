import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';

export function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-600">404</h1>
        <p className="mt-4 text-lg text-slate-400">Page not found</p>
        <Link
          to={user ? '/dashboard' : '/login'}
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          {user ? 'Go to Dashboard' : 'Go to Login'}
        </Link>
      </div>
    </div>
  );
}
