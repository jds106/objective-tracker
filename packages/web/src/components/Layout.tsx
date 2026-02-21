import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  ShareIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useReports } from '../hooks/useReports.js';
import { UserAvatar } from './UserAvatar.js';

/* ── Nav icon map ──────────────────────────────────────────── */

const navIcons: Record<string, (props: { className?: string }) => ReactNode> = {
  '/dashboard': Squares2X2Icon,
  '/check-in': CheckCircleIcon,
  '/cascade': ShareIcon,
  '/team': UserGroupIcon,
  '/admin': Cog6ToothIcon,
};

/* ── Nav items ─────────────────────────────────────────────── */

const baseNavItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/check-in', label: 'Check-in' },
  { path: '/cascade', label: 'Cascade' },
];

/* ── Sidebar content (shared by desktop and mobile) ─────── */

interface SidebarContentProps {
  navItems: { path: string; label: string }[];
  pathname: string;
  user: ReturnType<typeof useAuth>['user'];
  isAdmin: boolean;
  logout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ navItems, pathname, user, isAdmin, logout, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="North Star" className="h-10 w-auto rounded-lg ring-1 ring-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-indigo-400">North Star</h1>
            {isAdmin && (
              <p className="text-xs font-medium text-amber-400/80">Admin Mode</p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1" aria-label="Main navigation">
        {navItems.map(item => {
          const Icon = navIcons[item.path];
          const isActive = pathname === item.path
            || (item.path === '/dashboard' && pathname.startsWith('/objectives/'))
            || (item.path !== '/dashboard' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
            >
              {Icon && <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <Link
            to="/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            {user && <UserAvatar user={user} size="sm" />}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {user?.displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {user?.jobTitle}
              </p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0 ml-2"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Layout ────────────────────────────────────────────────── */

export function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const { error: cycleError } = useCycle();
  const { reports } = useReports();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    ...baseNavItems,
    ...(reports.length > 0 ? [{ path: '/team', label: 'Team' }] : []),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scrolling when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen">
      {/* ── Mobile top bar ──────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b border-slate-700 bg-surface-raised px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <img src="/logo.png" alt="" className="h-7 w-auto rounded-md ring-1 ring-slate-700" aria-hidden="true" />
        <span className="text-lg font-bold text-indigo-400">North Star</span>
      </div>

      {/* ── Mobile sidebar overlay + drawer ─────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeSidebar}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed inset-y-0 left-0 w-64 flex flex-col bg-surface-raised border-r border-slate-700 shadow-2xl animate-slide-in-left"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="absolute top-4 right-4">
              <button
                onClick={closeSidebar}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close navigation menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              navItems={navItems}
              pathname={location.pathname}
              user={user}
              isAdmin={isAdmin}
              logout={logout}
              onNavigate={closeSidebar}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (always visible ≥ md) ──────────── */}
      <aside className="hidden md:flex w-64 border-r flex-col bg-surface-raised border-slate-700">
        <SidebarContent
          navItems={navItems}
          pathname={location.pathname}
          user={user}
          isAdmin={isAdmin}
          logout={logout}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 pt-14 md:pt-0 p-4 md:p-8 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-6xl">
          {cycleError && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">
                Failed to load cycle data. Some features may be unavailable.
              </p>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
