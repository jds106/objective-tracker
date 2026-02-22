import { useState, useCallback, useEffect, Suspense, type ReactNode } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  ShareIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import type { Cycle } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { useTheme } from '../contexts/theme.context.js';
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

/* ── Cycle Switcher ────────────────────────────────────────── */

interface CycleSwitcherProps {
  allCycles: Cycle[];
  selectedCycle: Cycle | null;
  activeCycle: Cycle | null;
  isHistorical: boolean;
  onSelect: (cycleId: string) => void;
  onReset: () => void;
}

function CycleSwitcher({ allCycles, selectedCycle, activeCycle, isHistorical, onSelect, onReset }: CycleSwitcherProps) {
  if (allCycles.length <= 1) return null;

  // Sort: active first, then by start date descending
  const sortedCycles = [...allCycles].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  return (
    <div className="px-4 pb-3">
      <div className="flex items-center gap-2 mb-1.5">
        <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Cycle</span>
      </div>
      <select
        value={selectedCycle?.id ?? ''}
        onChange={e => onSelect(e.target.value)}
        className="w-full rounded-lg bg-surface border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
        aria-label="Select objective cycle"
      >
        {sortedCycles.map(c => (
          <option key={c.id} value={c.id}>
            {c.name} {c.id === activeCycle?.id ? '(current)' : `(${c.status})`}
          </option>
        ))}
      </select>
      {isHistorical && (
        <button
          onClick={onReset}
          className="mt-1.5 w-full text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Back to current cycle
        </button>
      )}
    </div>
  );
}

/* ── Sidebar content (shared by desktop and mobile) ─────── */

interface SidebarContentProps {
  navItems: { path: string; label: string }[];
  pathname: string;
  user: ReturnType<typeof useAuth>['user'];
  isAdmin: boolean;
  logout: () => void;
  onNavigate?: () => void;
  cycleProps: CycleSwitcherProps;
  themeToggle: () => void;
  themeResolved: 'dark' | 'light';
}

function SidebarContent({ navItems, pathname, user, isAdmin, logout, onNavigate, cycleProps, themeToggle, themeResolved }: SidebarContentProps) {
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

      <CycleSwitcher {...cycleProps} />

      <nav
        className="flex-1 px-4 space-y-1"
        aria-label="Main navigation"
        onKeyDown={(e) => {
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
          const links = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('a');
          if (links.length === 0) return;
          const current = Array.from(links).indexOf(document.activeElement as HTMLElement);
          if (current === -1) return;
          e.preventDefault();
          const next = e.key === 'ArrowDown'
            ? (current + 1) % links.length
            : (current - 1 + links.length) % links.length;
          links[next].focus();
        }}
      >
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
              aria-current={isActive ? 'page' : undefined}
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
        <div className="flex items-center justify-between mb-2">
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
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={themeToggle}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={`Switch to ${themeResolved === 'dark' ? 'light' : 'dark'} mode`}
          >
            {themeResolved === 'dark' ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
            {themeResolved === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={logout}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors shrink-0"
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
  const { activeCycle, selectedCycle, isHistorical, allCycles, selectCycle, resetToActive, error: cycleError } = useCycle();
  const { toggle: themeToggle, resolved: themeResolved } = useTheme();
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

  const cycleProps: CycleSwitcherProps = {
    allCycles,
    selectedCycle,
    activeCycle,
    isHistorical,
    onSelect: selectCycle,
    onReset: resetToActive,
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Skip to content (keyboard accessibility) ────────── */}
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

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
        {isHistorical && selectedCycle && (
          <span className="ml-auto text-[10px] text-amber-400 font-medium truncate">
            {selectedCycle.name}
          </span>
        )}
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
              cycleProps={cycleProps}
              themeToggle={themeToggle}
              themeResolved={themeResolved}
            />
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar (always visible ≥ md) ──────────── */}
      <aside className="hidden md:flex w-64 border-r flex-col bg-surface-raised border-slate-700" role="navigation" aria-label="Main navigation">
        <SidebarContent
          navItems={navItems}
          pathname={location.pathname}
          user={user}
          isAdmin={isAdmin}
          logout={logout}
          cycleProps={cycleProps}
          themeToggle={themeToggle}
          themeResolved={themeResolved}
        />
      </aside>

      {/* Main content */}
      <main id="main-content" className="flex-1 pt-14 md:pt-0 p-4 md:p-8 overflow-y-auto scrollbar-thin" tabIndex={-1}>
        <div className="mx-auto max-w-6xl">
          {cycleError && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">
                Failed to load cycle data. Some features may be unavailable.
              </p>
            </div>
          )}
          {isHistorical && (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 flex items-center justify-between">
              <p className="text-xs text-amber-300">
                Viewing <strong>{selectedCycle?.name}</strong> — this is a historical cycle (read-only).
              </p>
              <button
                onClick={resetToActive}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors shrink-0 ml-3"
              >
                Switch to current
              </button>
            </div>
          )}
          <Suspense fallback={
            <div className="flex min-h-[400px] items-center justify-center" role="status">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <span className="text-sm text-slate-400">Loading…</span>
              </div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
