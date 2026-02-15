import { useState, useEffect, useCallback } from 'react';
import type { User, Objective } from '@objective-tracker/shared';
import { useCycle } from '../contexts/cycle.context.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ApiError } from '../services/api-client.js';
import * as adminApi from '../services/admin.api.js';

type Tab = 'users' | 'objectives';

export function AdminPage() {
    const [tab, setTab] = useState<Tab>('users');

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-100">Administration</h2>
            <p className="mt-1 text-slate-400">Manage users, roles, and company objectives</p>

            {/* Tab bar */}
            <div className="mt-6 flex gap-1 border-b border-slate-700">
                {(['users', 'objectives'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium capitalize rounded-t-lg transition-colors ${tab === t
                                ? 'bg-surface-raised text-indigo-400 border border-slate-700 border-b-transparent -mb-px'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === 'users' ? <UsersTab /> : <ObjectivesTab />}
            </div>
        </div>
    );
}

// ── Users Tab ──────────────────────────────────────────────

function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [tempPassword, setTempPassword] = useState<{ userId: string; password: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await adminApi.getUsers();
            setUsers(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleToggle = async (user: User) => {
        try {
            const newRole = user.role === 'admin' ? 'standard' as const : 'admin' as const;
            await adminApi.updateUser(user.id, { role: newRole });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to update role');
        }
    };

    const handleResetPassword = async (userId: string) => {
        try {
            const { data } = await adminApi.adminResetPassword(userId);
            setTempPassword({ userId, password: data.temporaryPassword });
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to reset password');
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setDeleteConfirm(null);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to delete user');
        }
    };

    const filtered = users.filter(u =>
        u.displayName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

    return (
        <div>
            {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
                </div>
            )}

            {/* Search */}
            <input
                type="text"
                placeholder="Search users by name, email, or department…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-md rounded-lg bg-surface-raised border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none mb-4"
            />

            <div className="rounded-xl bg-surface-raised border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => (
                            <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-200">{user.displayName}</td>
                                <td className="px-4 py-3 text-slate-400">{user.email}</td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => handleRoleToggle(user)}
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${user.role === 'admin'
                                                ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                                                : 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/25'
                                            }`}
                                    >
                                        {user.role}
                                    </button>
                                </td>
                                <td className="px-4 py-3 text-slate-400">{user.department ?? '—'}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleResetPassword(user.id)}
                                            className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                            title="Reset password"
                                        >
                                            Reset PW
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(user.id)}
                                            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                            title="Delete user"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                    {search ? 'No users match your search' : 'No users found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="mt-3 text-xs text-slate-500">{users.length} user{users.length !== 1 ? 's' : ''} total</p>

            {/* Temp password modal */}
            {tempPassword && (
                <Modal onClose={() => setTempPassword(null)} title="Password Reset">
                    <p className="text-sm text-slate-300 mb-3">
                        The password for this user has been reset. Give them this temporary password:
                    </p>
                    <code className="block rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-emerald-400 font-mono select-all">
                        {tempPassword.password}
                    </code>
                    <p className="text-xs text-slate-500 mt-2">This password will not be shown again.</p>
                </Modal>
            )}

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <Modal onClose={() => setDeleteConfirm(null)} title="Delete User">
                    <p className="text-sm text-slate-300 mb-4">
                        Are you sure you want to delete this user? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDelete(deleteConfirm)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                        >
                            Delete User
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ── Objectives Tab ─────────────────────────────────────────

function ObjectivesTab() {
    const { activeCycle } = useCycle();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);

    const fetchObjectives = useCallback(async () => {
        try {
            const { data } = await adminApi.getAllObjectives(activeCycle?.id);
            setObjectives(data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to load objectives');
        } finally {
            setIsLoading(false);
        }
    }, [activeCycle?.id]);

    useEffect(() => { fetchObjectives(); }, [fetchObjectives]);

    const handleCreateCompanyObjective = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCycle) return;
        setCreating(true);
        try {
            const { data } = await adminApi.createCompanyObjective({
                cycleId: activeCycle.id,
                title,
                description,
            });
            setObjectives(prev => [data, ...prev]);
            setTitle('');
            setDescription('');
            setShowCreate(false);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Failed to create objective');
        } finally {
            setCreating(false);
        }
    };

    const companyObjectives = objectives.filter(o => o.ownerId === 'company');
    const userObjectives = objectives.filter(o => o.ownerId !== 'company');

    if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

    return (
        <div>
            {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
                </div>
            )}

            {/* Company Objectives Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">Company Objectives</h3>
                    {activeCycle && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                        >
                            + New Company Objective
                        </button>
                    )}
                </div>

                {companyObjectives.length === 0 ? (
                    <div className="rounded-xl bg-surface-raised border border-slate-700 p-8 text-center text-slate-500">
                        No company objectives yet. Create one to serve as a root for cascading goals.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {companyObjectives.map(obj => (
                            <ObjectiveRow key={obj.id} objective={obj} isCompany />
                        ))}
                    </div>
                )}
            </div>

            {/* All User Objectives Section */}
            <div>
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                    All User Objectives
                    <span className="text-sm font-normal text-slate-500 ml-2">({userObjectives.length})</span>
                </h3>

                {userObjectives.length === 0 ? (
                    <div className="rounded-xl bg-surface-raised border border-slate-700 p-8 text-center text-slate-500">
                        No user objectives found for the current cycle.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {userObjectives.map(obj => (
                            <ObjectiveRow key={obj.id} objective={obj} />
                        ))}
                    </div>
                )}
            </div>

            {/* Create company objective modal */}
            {showCreate && (
                <Modal onClose={() => setShowCreate(false)} title="Create Company Objective">
                    <form onSubmit={handleCreateCompanyObjective} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                                maxLength={200}
                                className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                                placeholder="e.g. Increase company revenue by 20%"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                maxLength={2000}
                                className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                                placeholder="Brief description of this company-level goal…"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !title.trim()}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                            >
                                {creating ? 'Creating…' : 'Create Objective'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ── Shared Components ──────────────────────────────────────

function ObjectiveRow({ objective, isCompany }: { objective: Objective; isCompany?: boolean }) {
    const progress = objective.keyResults.length > 0
        ? Math.round(objective.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / objective.keyResults.length)
        : 0;

    return (
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-4 flex items-center gap-4">
            {/* Progress ring */}
            <div className="shrink-0">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-700" />
                    <circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeDasharray={`${progress} ${100 - progress}`}
                        className="text-indigo-500"
                    />
                </svg>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-200 truncate">{objective.title}</p>
                    {isCompany && (
                        <span className="shrink-0 rounded-full bg-amber-500/15 text-amber-400 px-2 py-0.5 text-xs font-medium">
                            Company
                        </span>
                    )}
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${objective.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' :
                            objective.status === 'completed' ? 'bg-indigo-500/15 text-indigo-400' :
                                'bg-slate-500/15 text-slate-400'
                        }`}>
                        {objective.status}
                    </span>
                </div>
                {objective.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{objective.description}</p>
                )}
                <p className="text-xs text-slate-500 mt-0.5">
                    {objective.keyResults.length} key result{objective.keyResults.length !== 1 ? 's' : ''} · {progress}% complete
                    {!isCompany && objective.ownerId && (
                        <span className="ml-1">· Owner: {objective.ownerId.slice(0, 8)}…</span>
                    )}
                </p>
            </div>
        </div>
    );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-surface-raised border border-slate-700 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
