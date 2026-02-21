import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useReports } from '../hooks/useReports.js';
import { UserAvatar } from './UserAvatar.js';

/* ── Icon components (Heroicons outline, 24px) ────────────── */

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function CascadeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function AdminIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

/** Hamburger menu icon (3 bars) */
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

/** Close (X) icon */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

/* ── Nav icon map ──────────────────────────────────────────── */

const navIcons: Record<string, (props: { className?: string }) => ReactNode> = {
  '/dashboard': DashboardIcon,
  '/check-in': CheckInIcon,
  '/cascade': CascadeIcon,
  '/team': TeamIcon,
  '/admin': AdminIcon,
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
          <MenuIcon className="h-6 w-6" />
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
                <CloseIcon className="h-5 w-5" />
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
