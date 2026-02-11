import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-raised border-r border-slate-700 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-400">Objective Tracker</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.jobTitle}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
