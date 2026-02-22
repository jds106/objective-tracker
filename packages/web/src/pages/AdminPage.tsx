import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User, Objective, Cycle, CycleStatus, UpdateObjectiveBody, TargetDateType } from '@objective-tracker/shared';
import { formatDate, getCurrentQuarterEndDate } from '@objective-tracker/shared';
import { useAuth } from '../contexts/auth.context.js';
import { useCycle } from '../contexts/cycle.context.js';
import { Modal } from '../components/Modal.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ProgressRing } from '../components/ProgressRing.js';
import { PageTransition } from '../components/PageTransition.js';
import { TargetDatePicker } from '../components/objectives/TargetDatePicker.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { getErrorMessage } from '../utils/error.js';
import * as adminApi from '../services/admin.api.js';
import * as objectivesApi from '../services/objectives.api.js';

type Tab = 'users' | 'objectives' | 'cycles' | 'org';

const TAB_LABELS: Record<Tab, string> = {
    users: 'Users',
    objectives: 'Objectives',
    cycles: 'Cycles',
    org: 'Org Tree',
};

export function AdminPage() {
    const { user: currentUser } = useAuth();
    const [tab, setTab] = useState<Tab>('users');

    return (
        <PageTransition>
            <h2 className="text-2xl font-bold text-slate-100">Administration</h2>
            <p className="mt-1 text-slate-400">Manage users, roles, cycles, and company objectives</p>

            {/* Tab bar */}
            <div className="mt-6 flex gap-1 border-b border-slate-700 overflow-x-auto">
                {(['users', 'objectives', 'cycles', 'org'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${tab === t
                                ? 'bg-surface-raised text-indigo-400 border border-slate-700 border-b-transparent -mb-px'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {TAB_LABELS[t]}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {tab === 'users' && <UsersTab currentUserId={currentUser?.id ?? ''} />}
                {tab === 'objectives' && <ObjectivesTab />}
                {tab === 'cycles' && <CyclesTab />}
                {tab === 'org' && <OrgTreeTab />}
            </div>
        </PageTransition>
    );
}

// ── Users Tab ──────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 250);
    const [tempPassword, setTempPassword] = useState<{ userId: string; password: string } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [setPasswordUser, setSetPasswordUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCsvImport, setShowCsvImport] = useState(false);
    const PAGE_SIZE = 25;

    const fetchUsers = useCallback(async () => {
        try {
            const { data } = await adminApi.getUsers();
            setUsers(data);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load users'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleRoleToggle = async (user: User) => {
        setActionLoading(`role-${user.id}`);
        try {
            const newRole = user.role === 'admin' ? 'standard' as const : 'admin' as const;
            await adminApi.updateUser(user.id, { role: newRole });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to update role'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetPassword = async (userId: string) => {
        setActionLoading(`reset-${userId}`);
        try {
            const { data } = await adminApi.adminResetPassword(userId);
            setTempPassword({ userId, password: data.temporaryPassword });
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to reset password'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        setActionLoading(`delete-${userId}`);
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
            setDeleteConfirm(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to delete user'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleUserCreated = (user: User) => {
        setUsers(prev => [...prev, user]);
        setShowCreateUser(false);
    };

    const handleUserUpdated = (updated: User) => {
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        setEditUser(null);
    };

    const filtered = users.filter(u => {
        const term = debouncedSearch.toLowerCase();
        return u.displayName.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term) ||
            (u.department ?? '').toLowerCase().includes(term);
    });

    // Reset to page 1 when search changes
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedUsers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    // Build a manager lookup for display
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        for (const u of users) map.set(u.id, u);
        return map;
    }, [users]);

    if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

    return (
        <div>
            {error && (
                <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                    {error}
                    <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
                </div>
            )}

            {/* Search + Add User */}
            <div className="flex items-center gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search users by name, email, or department..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 max-w-md rounded-lg bg-surface-raised border border-slate-700 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                    onClick={() => setShowCsvImport(true)}
                    className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors shrink-0"
                >
                    Import CSV
                </button>
                <button
                    onClick={() => setShowCreateUser(true)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors shrink-0"
                >
                    + Add User
                </button>
            </div>

            <div className="rounded-xl bg-surface-raised border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 hidden md:table-cell">Manager</th>
                            <th className="px-4 py-3 hidden lg:table-cell">Level</th>
                            <th className="px-4 py-3 hidden md:table-cell">Department</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => {
                            const manager = user.managerId ? userMap.get(user.managerId) : null;
                            return (
                                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <div>
                                            <p className="font-medium text-slate-200">{user.displayName}</p>
                                            <p className="text-xs text-slate-500 sm:hidden">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleRoleToggle(user)}
                                            disabled={actionLoading === `role-${user.id}` || user.id === currentUserId}
                                            title={user.id === currentUserId ? 'Cannot change your own role' : `Click to change role to ${user.role === 'admin' ? 'standard' : 'admin'}`}
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${user.id === currentUserId
                                                    ? 'cursor-not-allowed'
                                                    : 'cursor-pointer'
                                                } ${user.role === 'admin'
                                                    ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                                                    : 'bg-slate-500/15 text-slate-400 hover:bg-slate-500/25'
                                                }`}
                                        >
                                            {actionLoading === `role-${user.id}` ? '…' : user.role}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                                        {manager ? manager.displayName : <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                                        L{user.level}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{user.department ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setEditUser(user)}
                                                disabled={!!actionLoading}
                                                className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                                                title="Edit user details"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setSetPasswordUser(user)}
                                                disabled={!!actionLoading}
                                                className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                                                title="Set a new password for this user"
                                            >
                                                Set Password
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(user.id)}
                                                disabled={actionLoading === `reset-${user.id}`}
                                                className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors disabled:opacity-50 hidden sm:inline-flex"
                                                title="Generate a random temporary password"
                                            >
                                                {actionLoading === `reset-${user.id}` ? 'Resetting...' : 'Reset'}
                                            </button>
                                            {user.id !== currentUserId && (
                                                <button
                                                    onClick={() => setDeleteConfirm(user.id)}
                                                    disabled={!!actionLoading}
                                                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                    title="Delete user"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                    {search ? 'No users match your search' : 'No users found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    {filtered.length === users.length
                        ? `${users.length} user${users.length !== 1 ? 's' : ''} total`
                        : `${filtered.length} of ${users.length} users`}
                </p>
                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="rounded-md px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${page === safePage
                                        ? 'bg-indigo-600/30 text-indigo-300'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="rounded-md px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* Temp password modal */}
            <Modal
                isOpen={!!tempPassword}
                onClose={() => setTempPassword(null)}
                title="Password Reset"
            >
                <p className="text-sm text-slate-300 mb-3">
                    The password for this user has been reset. Give them this temporary password:
                </p>
                <code className="block rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-sm text-emerald-400 font-mono select-all">
                    {tempPassword?.password}
                </code>
                <p className="text-xs text-slate-500 mt-2">This password will not be shown again.</p>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete User"
            >
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
                        onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                    >
                        Delete User
                    </button>
                </div>
            </Modal>

            {/* Create user modal */}
            <CreateUserModal
                isOpen={showCreateUser}
                users={users}
                onClose={() => setShowCreateUser(false)}
                onCreated={handleUserCreated}
            />

            {/* Edit user modal */}
            <EditUserModal
                isOpen={!!editUser}
                user={editUser}
                users={users}
                currentUserId={currentUserId}
                onClose={() => setEditUser(null)}
                onUpdated={handleUserUpdated}
            />

            {/* Set password modal */}
            <SetPasswordModal
                isOpen={!!setPasswordUser}
                user={setPasswordUser}
                onClose={() => setSetPasswordUser(null)}
            />

            {/* CSV import modal */}
            <CsvImportModal
                isOpen={showCsvImport}
                onClose={() => setShowCsvImport(false)}
                onImported={fetchUsers}
            />
        </div>
    );
}

// ── Create User Modal ─────────────────────────────────────

function CreateUserModal({ isOpen, users, onClose, onCreated }: {
    isOpen: boolean;
    users: User[];
    onClose: () => void;
    onCreated: (user: User) => void;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [managerId, setManagerId] = useState('');
    const [level, setLevel] = useState(5);
    const [role, setRole] = useState<'admin' | 'standard'>('standard');
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setEmail('');
            setPassword('');
            setDisplayName('');
            setJobTitle('');
            setDepartment('');
            setManagerId('');
            setLevel(5);
            setRole('standard');
            setError('');
        }
    }, [isOpen]);

    // Auto-set level from manager
    useEffect(() => {
        if (managerId) {
            const manager = users.find(u => u.id === managerId);
            if (manager) {
                setLevel(Math.min(manager.level + 1, 5));
            }
        }
    }, [managerId, users]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCreating(true);
        try {
            const { data } = await adminApi.createUser({
                email,
                password,
                displayName,
                jobTitle,
                department: department || undefined,
                managerId: managerId || undefined,
                level,
                role,
            });
            onCreated(data);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create user'));
        } finally {
            setCreating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add User">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="user@company.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="Jane Smith"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        placeholder="Software Engineer"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Manager</label>
                        <select
                            value={managerId}
                            onChange={e => setManagerId(e.target.value)}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">None (top-level)</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.displayName} (L{u.level})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Level</label>
                        <select
                            value={level}
                            onChange={e => setLevel(Number(e.target.value))}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            {[1, 2, 3, 4, 5].map(l => (
                                <option key={l} value={l}>L{l} — {levelLabel(l)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                        <input
                            type="text"
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            maxLength={100}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            placeholder="Engineering"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as 'admin' | 'standard')}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="standard">Standard</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                        placeholder="Initial password"
                    />
                    <p className="text-xs text-slate-500 mt-1">Minimum 8 characters. The user can change this later.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={creating}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {creating ? 'Creating…' : 'Create User'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Edit User Modal ─────────────────────────────────────

function EditUserModal({ isOpen, user, users, currentUserId, onClose, onUpdated }: {
    isOpen: boolean;
    user: User | null;
    users: User[];
    currentUserId: string;
    onClose: () => void;
    onUpdated: (user: User) => void;
}) {
    const isEditingSelf = user?.id === currentUserId;
    const [displayName, setDisplayName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [managerId, setManagerId] = useState('');
    const [level, setLevel] = useState(5);
    const [role, setRole] = useState<'admin' | 'standard'>('standard');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Populate form when user changes
    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName);
            setJobTitle(user.jobTitle);
            setDepartment(user.department ?? '');
            setManagerId(user.managerId ?? '');
            setLevel(user.level);
            setRole(user.role);
            setError('');
        }
    }, [user]);

    // Auto-set level from manager when manager changes
    const handleManagerChange = (newManagerId: string) => {
        setManagerId(newManagerId);
        if (newManagerId) {
            const manager = users.find(u => u.id === newManagerId);
            if (manager) {
                setLevel(Math.min(manager.level + 1, 5));
            }
        }
    };

    // Filter out the current user and their reports from manager options to prevent cycles
    const managerOptions = useMemo(() => {
        if (!user) return users;
        const downward = getDownwardIds(user.id, users);
        return users.filter(u => !downward.has(u.id));
    }, [user, users]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setSaving(true);
        try {
            const { data } = await adminApi.updateUser(user.id, {
                displayName,
                jobTitle,
                department: department || undefined,
                managerId: managerId || null,
                level,
                role,
            });
            onUpdated(data);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to update user'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit User — ${user?.displayName ?? ''}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Manager</label>
                        <select
                            value={managerId}
                            onChange={e => handleManagerChange(e.target.value)}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">None (top-level)</option>
                            {managerOptions.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.displayName} (L{u.level})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Level</label>
                        <select
                            value={level}
                            onChange={e => setLevel(Number(e.target.value))}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            {[1, 2, 3, 4, 5].map(l => (
                                <option key={l} value={l}>L{l} — {levelLabel(l)}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                        <input
                            type="text"
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            maxLength={100}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            placeholder="Engineering"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value as 'admin' | 'standard')}
                            disabled={isEditingSelf}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="standard">Standard</option>
                            <option value="admin">Admin</option>
                        </select>
                        {isEditingSelf && (
                            <p className="text-xs text-slate-500 mt-1">(cannot change own role)</p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Set Password Modal ────────────────────────────────────

function SetPasswordModal({ isOpen, user, onClose }: {
    isOpen: boolean;
    user: User | null;
    onClose: () => void;
}) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [saving, setSaving] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setPassword('');
            setError('');
            setSuccess(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setSaving(true);
        try {
            await adminApi.adminSetPassword(user.id, password);
            setSuccess(true);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to set password'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Set Password — ${user?.displayName ?? ''}`}>
            {success ? (
                <div>
                    <p className="text-sm text-emerald-400 mb-4">Password has been set successfully.</p>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            aria-describedby="set-password-hint"
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none font-mono"
                            placeholder="Enter new password"
                        />
                        <p id="set-password-hint" className="text-xs text-slate-500 mt-1">At least 8 characters</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !password}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Setting...' : 'Set Password'}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

// ── Objectives Tab ─────────────────────────────────────────

function ObjectivesTab() {
    const { activeCycle } = useCycle();
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [creating, setCreating] = useState(false);
    const [companyTargetDateType, setCompanyTargetDateType] = useState<TargetDateType>('quarterly');
    const [companyTargetDate, setCompanyTargetDate] = useState(() =>
        activeCycle ? getCurrentQuarterEndDate(activeCycle) : new Date().toISOString().split('T')[0]!,
    );
    const [showCreateForUser, setShowCreateForUser] = useState(false);
    const [forUserOwnerId, setForUserOwnerId] = useState('');
    const [forUserTitle, setForUserTitle] = useState('');
    const [forUserDescription, setForUserDescription] = useState('');
    const [forUserTargetDateType, setForUserTargetDateType] = useState<TargetDateType>('quarterly');
    const [forUserTargetDate, setForUserTargetDate] = useState(() =>
        activeCycle ? getCurrentQuarterEndDate(activeCycle) : new Date().toISOString().split('T')[0]!,
    );
    const [creatingForUser, setCreatingForUser] = useState(false);
    const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
    const [deleteObjectiveConfirm, setDeleteObjectiveConfirm] = useState<Objective | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [objRes, userRes] = await Promise.all([
                adminApi.getAllObjectives(activeCycle?.id),
                adminApi.getUsers(),
            ]);
            setObjectives(objRes.data);
            setUsers(userRes.data);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load objectives'));
        } finally {
            setIsLoading(false);
        }
    }, [activeCycle?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Build user lookup map for owner name resolution
    const userMap = useMemo(() => {
        const map = new Map<string, User>();
        for (const u of users) map.set(u.id, u);
        return map;
    }, [users]);

    const handleCreateCompanyObjective = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCycle) return;
        setCreating(true);
        try {
            const { data } = await adminApi.createCompanyObjective({
                cycleId: activeCycle.id,
                title,
                description,
                targetDateType: companyTargetDateType,
                targetDate: companyTargetDate,
            });
            setObjectives(prev => [data, ...prev]);
            setTitle('');
            setDescription('');
            setShowCreate(false);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create objective'));
        } finally {
            setCreating(false);
        }
    };

    const handleCreateForUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCycle || !forUserOwnerId) return;
        setCreatingForUser(true);
        try {
            const { data } = await adminApi.createObjectiveForUser({
                ownerId: forUserOwnerId,
                cycleId: activeCycle.id,
                title: forUserTitle,
                description: forUserDescription,
                targetDateType: forUserTargetDateType,
                targetDate: forUserTargetDate,
            });
            setObjectives(prev => [...prev, data]);
            setForUserOwnerId('');
            setForUserTitle('');
            setForUserDescription('');
            setShowCreateForUser(false);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create objective for user'));
        } finally {
            setCreatingForUser(false);
        }
    };

    const handleObjectiveUpdated = (updated: Objective) => {
        setObjectives(prev => prev.map(o => o.id === updated.id ? updated : o));
        setEditingObjective(null);
    };

    const handleDeleteObjective = async (objective: Objective, force = false) => {
        try {
            await objectivesApi.deleteObjective(objective.id, force);
            setObjectives(prev => prev.filter(o => o.id !== objective.id));
            setDeleteObjectiveConfirm(null);
        } catch (err) {
            const msg = getErrorMessage(err, 'Failed to delete objective');
            if (msg.includes('linked child') && !force) {
                // Retry with force for admin
                if (confirm(`${msg}\n\nDo you want to delete it anyway and unlink the children?`)) {
                    return handleDeleteObjective(objective, true);
                }
                setDeleteObjectiveConfirm(null);
            } else {
                setError(msg);
            }
        }
    };

    const [objSearch, setObjSearch] = useState('');
    const [objPage, setObjPage] = useState(1);
    const OBJ_PAGE_SIZE = 25;

    const companyObjectives = objectives.filter(o => o.ownerId === 'company');
    const allUserObjectives = objectives.filter(o => o.ownerId !== 'company');

    // Client-side search and pagination for user objectives
    const filteredUserObjectives = useMemo(() => {
        if (!objSearch.trim()) return allUserObjectives;
        const q = objSearch.toLowerCase();
        return allUserObjectives.filter(obj => {
            const owner = userMap.get(obj.ownerId);
            return obj.title.toLowerCase().includes(q)
                || (owner?.displayName?.toLowerCase().includes(q) ?? false)
                || obj.status.toLowerCase().includes(q);
        });
    }, [allUserObjectives, objSearch, userMap]);

    const objTotalPages = Math.max(1, Math.ceil(filteredUserObjectives.length / OBJ_PAGE_SIZE));
    const safeObjPage = Math.min(objPage, objTotalPages);
    const paginatedObjectives = filteredUserObjectives.slice(
        (safeObjPage - 1) * OBJ_PAGE_SIZE,
        safeObjPage * OBJ_PAGE_SIZE,
    );

    // Reset to page 1 when search changes
    useEffect(() => { setObjPage(1); }, [objSearch]);

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
                            <ObjectiveRow
                                key={obj.id}
                                objective={obj}
                                isCompany
                                userMap={userMap}
                                onEdit={() => setEditingObjective(obj)}
                                onDelete={() => setDeleteObjectiveConfirm(obj)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* All User Objectives Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                        All User Objectives
                        <span className="text-sm font-normal text-slate-500 ml-2">({filteredUserObjectives.length})</span>
                    </h3>
                    <div className="flex items-center gap-3">
                        {activeCycle && (
                            <button
                                onClick={() => setShowCreateForUser(true)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
                            >
                                + Create for User
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Search objectives…"
                            value={objSearch}
                            onChange={e => setObjSearch(e.target.value)}
                            className="rounded-lg bg-surface border border-slate-700 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none w-64"
                        />
                    </div>
                </div>

                {paginatedObjectives.length === 0 ? (
                    <div className="rounded-xl bg-surface-raised border border-slate-700 p-8 text-center text-slate-500">
                        {objSearch ? 'No objectives match your search.' : 'No user objectives found for the current cycle.'}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {paginatedObjectives.map(obj => (
                            <ObjectiveRow
                                key={obj.id}
                                objective={obj}
                                userMap={userMap}
                                onEdit={() => setEditingObjective(obj)}
                                onDelete={() => setDeleteObjectiveConfirm(obj)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination controls */}
                {objTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
                        <span>
                            Showing {(safeObjPage - 1) * OBJ_PAGE_SIZE + 1}–{Math.min(safeObjPage * OBJ_PAGE_SIZE, filteredUserObjectives.length)} of {filteredUserObjectives.length}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setObjPage(p => Math.max(1, p - 1))}
                                disabled={safeObjPage <= 1}
                                className="rounded-lg px-3 py-1 bg-surface-raised border border-slate-700 hover:border-slate-600 disabled:opacity-40 transition-colors"
                            >
                                ← Prev
                            </button>
                            <span className="flex items-center px-2">
                                Page {safeObjPage} of {objTotalPages}
                            </span>
                            <button
                                onClick={() => setObjPage(p => Math.min(objTotalPages, p + 1))}
                                disabled={safeObjPage >= objTotalPages}
                                className="rounded-lg px-3 py-1 bg-surface-raised border border-slate-700 hover:border-slate-600 disabled:opacity-40 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create company objective modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Company Objective">
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
                            placeholder="Brief description of this company-level goal..."
                        />
                    </div>
                    {activeCycle && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Target Date</label>
                            <TargetDatePicker
                                targetDateType={companyTargetDateType}
                                targetDate={companyTargetDate}
                                onTypeChange={setCompanyTargetDateType}
                                onDateChange={setCompanyTargetDate}
                                cycle={activeCycle}
                            />
                        </div>
                    )}
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

            {/* Create objective for user modal */}
            <Modal isOpen={showCreateForUser} onClose={() => setShowCreateForUser(false)} title="Create Objective for User">
                <form onSubmit={handleCreateForUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">User</label>
                        <select
                            value={forUserOwnerId}
                            onChange={e => setForUserOwnerId(e.target.value)}
                            required
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">Select a user…</option>
                            {users
                                .filter(u => u.role !== 'admin')
                                .sort((a, b) => a.displayName.localeCompare(b.displayName))
                                .map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.displayName} ({u.email})
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={forUserTitle}
                            onChange={e => setForUserTitle(e.target.value)}
                            required
                            maxLength={200}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g. Improve deployment pipeline reliability"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                        <textarea
                            value={forUserDescription}
                            onChange={e => setForUserDescription(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                            placeholder="Brief description of what this objective aims to achieve..."
                        />
                    </div>
                    {activeCycle && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Target Date</label>
                            <TargetDatePicker
                                targetDateType={forUserTargetDateType}
                                targetDate={forUserTargetDate}
                                onTypeChange={setForUserTargetDateType}
                                onDateChange={setForUserTargetDate}
                                cycle={activeCycle}
                            />
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateForUser(false)}
                            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creatingForUser || !forUserTitle.trim() || !forUserOwnerId}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                        >
                            {creatingForUser ? 'Creating…' : 'Create Objective'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit objective modal */}
            <EditObjectiveModal
                isOpen={!!editingObjective}
                objective={editingObjective}
                onClose={() => setEditingObjective(null)}
                onUpdated={handleObjectiveUpdated}
            />

            {/* Delete objective confirmation modal */}
            <Modal
                isOpen={!!deleteObjectiveConfirm}
                onClose={() => setDeleteObjectiveConfirm(null)}
                title="Delete Objective"
            >
                <p className="text-sm text-slate-300 mb-2">
                    Are you sure you want to delete this objective?
                </p>
                {deleteObjectiveConfirm && (
                    <p className="text-sm font-medium text-slate-200 mb-4 break-words">
                        &ldquo;{deleteObjectiveConfirm.title}&rdquo;
                    </p>
                )}
                <p className="text-xs text-slate-500 mb-4">This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setDeleteObjectiveConfirm(null)}
                        className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => deleteObjectiveConfirm && handleDeleteObjective(deleteObjectiveConfirm)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                    >
                        Delete Objective
                    </button>
                </div>
            </Modal>
        </div>
    );
}

// ── Edit Objective Modal ──────────────────────────────────

function EditObjectiveModal({ isOpen, objective, onClose, onUpdated }: {
    isOpen: boolean;
    objective: Objective | null;
    onClose: () => void;
    onUpdated: (objective: Objective) => void;
}) {
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (objective) {
            setEditTitle(objective.title);
            setEditDescription(objective.description);
            setError('');
        }
    }, [objective]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective) return;
        setError('');
        setSaving(true);
        try {
            const updates: UpdateObjectiveBody = {
                title: editTitle,
                description: editDescription,
            };
            const { data } = await objectivesApi.updateObjective(objective.id, updates);
            onUpdated(data);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to update objective'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Objective">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                )}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        required
                        maxLength={200}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !editTitle.trim()}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Shared Components ──────────────────────────────────────

function ObjectiveRow({ objective, isCompany, userMap, onEdit, onDelete }: {
    objective: Objective;
    isCompany?: boolean;
    userMap?: Map<string, User>;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const progress = objective.keyResults.length > 0
        ? Math.round(objective.keyResults.reduce((sum, kr) => sum + kr.progress, 0) / objective.keyResults.length)
        : 0;

    const ownerName = !isCompany && objective.ownerId && userMap
        ? userMap.get(objective.ownerId)?.displayName ?? 'Unknown user'
        : null;

    return (
        <div className="rounded-xl bg-surface-raised border border-slate-700 p-4 flex items-center gap-4">
            {/* Progress ring */}
            <div className="shrink-0">
                <ProgressRing progress={progress} size={40} strokeWidth={3} />
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
                    {ownerName && (
                        <span className="ml-1">· Owner: {ownerName}</span>
                    )}
                </p>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex items-center gap-2">
                <button
                    onClick={onEdit}
                    className="rounded px-2 py-1 text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    title="Edit objective"
                >
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete objective"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

// ── Cycles Tab ──────────────────────────────────────────────

const CYCLE_STATUS_STYLES: Record<CycleStatus, string> = {
    planning: 'bg-slate-500/15 text-slate-400',
    active: 'bg-emerald-500/15 text-emerald-400',
    review: 'bg-amber-500/15 text-amber-400',
    closed: 'bg-slate-500/15 text-slate-500',
};

function CyclesTab() {
    const { allCycles } = useCycle();
    const [cycles, setCycles] = useState<Cycle[]>(allCycles);
    const [showCreate, setShowCreate] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [transitioning, setTransitioning] = useState<string | null>(null);

    // Sync with context when it updates
    useEffect(() => { setCycles(allCycles); }, [allCycles]);

    const handleStatusTransition = async (cycleId: string, newStatus: CycleStatus) => {
        setTransitioning(cycleId);
        setError('');
        try {
            const { data } = await adminApi.updateCycle(cycleId, { status: newStatus });
            setCycles(prev => prev.map(c => c.id === cycleId ? data : c));
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to update cycle status'));
        } finally {
            setTransitioning(null);
        }
    };

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [status, setStatus] = useState<CycleStatus>('planning');
    const [quarters, setQuarters] = useState<Array<{
        name: string;
        startDate: string;
        endDate: string;
        reviewDeadline: string;
    }>>([]);

    const resetForm = () => {
        setName('');
        setStartDate('');
        setEndDate('');
        setStatus('planning');
        setQuarters([]);
        setError('');
    };

    const addQuarter = () => {
        const qNum = quarters.length + 1;
        setQuarters(prev => [...prev, {
            name: `Q${qNum}`,
            startDate: '',
            endDate: '',
            reviewDeadline: '',
        }]);
    };

    const updateQuarter = (index: number, field: string, value: string) => {
        setQuarters(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    };

    const removeQuarter = (index: number) => {
        setQuarters(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (quarters.length === 0) {
            setError('At least one quarter is required');
            return;
        }
        setError('');
        setCreating(true);
        try {
            const { data } = await adminApi.createCycle({
                name,
                startDate,
                endDate,
                status,
                quarters,
            });
            setCycles(prev => [...prev, data]);
            resetForm();
            setShowCreate(false);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to create cycle'));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Objective Cycles</h3>
                <button
                    onClick={() => { resetForm(); setShowCreate(true); }}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    + New Cycle
                </button>
            </div>

            {cycles.length === 0 ? (
                <div className="rounded-xl bg-surface-raised border border-slate-700 p-8 text-center">
                    <p className="text-slate-500">No cycles configured yet.</p>
                    <p className="text-sm text-slate-600 mt-1">Create a cycle to enable objective tracking for your organisation.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {cycles.map(cycle => (
                        <div key={cycle.id} className="rounded-xl bg-surface-raised border border-slate-700 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-base font-semibold text-slate-200">{cycle.name}</h4>
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${CYCLE_STATUS_STYLES[cycle.status]}`}>
                                        {cycle.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {formatDate(cycle.startDate)} — {formatDate(cycle.endDate)}
                                </p>
                            </div>

                            {cycle.quarters.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                    {cycle.quarters.map(q => {
                                        const isCurrentQuarter = isQuarterActive(q.startDate, q.endDate);
                                        return (
                                            <div
                                                key={q.id ?? q.name}
                                                className={`rounded-lg border p-3 text-xs ${isCurrentQuarter
                                                        ? 'border-indigo-500/30 bg-indigo-500/10'
                                                        : 'border-slate-700/50 bg-surface'
                                                    }`}
                                            >
                                                <p className={`font-medium ${isCurrentQuarter ? 'text-indigo-300' : 'text-slate-300'}`}>
                                                    {q.name}
                                                    {isCurrentQuarter && <span className="ml-1 text-indigo-400">(current)</span>}
                                                </p>
                                                <p className="text-slate-500 mt-0.5">
                                                    {formatDate(q.startDate)} — {formatDate(q.endDate)}
                                                </p>
                                                <p className="text-slate-600 mt-0.5">
                                                    Review by {formatDate(q.reviewDeadline)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Status transition buttons */}
                            {cycle.status !== 'closed' && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
                                    <span className="text-xs text-slate-500 mr-1">Transition:</span>
                                    {cycle.status === 'planning' && (
                                        <button
                                            onClick={() => handleStatusTransition(cycle.id, 'active')}
                                            disabled={!!transitioning}
                                            className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors disabled:opacity-50"
                                        >
                                            {transitioning === cycle.id ? 'Activating...' : 'Activate Cycle'}
                                        </button>
                                    )}
                                    {cycle.status === 'active' && (
                                        <button
                                            onClick={() => handleStatusTransition(cycle.id, 'review')}
                                            disabled={!!transitioning}
                                            className="rounded-lg bg-amber-600/20 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-400 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
                                        >
                                            {transitioning === cycle.id ? 'Moving...' : 'Move to Review'}
                                        </button>
                                    )}
                                    {cycle.status === 'review' && (
                                        <button
                                            onClick={() => handleStatusTransition(cycle.id, 'closed')}
                                            disabled={!!transitioning}
                                            className="rounded-lg bg-slate-600/20 border border-slate-500/30 px-3 py-1 text-xs font-medium text-slate-400 hover:bg-slate-600/30 transition-colors disabled:opacity-50"
                                        >
                                            {transitioning === cycle.id ? 'Closing...' : 'Close Cycle'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create cycle modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Cycle" maxWidth="max-w-2xl">
                <form onSubmit={handleCreate} className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Cycle Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            maxLength={50}
                            className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            placeholder="e.g. FY2025"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                                className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                                className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as CycleStatus)}
                                className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="planning">Planning</option>
                                <option value="active">Active</option>
                                <option value="review">Review</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                    </div>

                    {/* Quarters */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-300">Quarters</label>
                            <button
                                type="button"
                                onClick={addQuarter}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                                + Add Quarter
                            </button>
                        </div>

                        {quarters.length === 0 ? (
                            <p className="text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg p-4 text-center">
                                No quarters added yet. Click &quot;+ Add Quarter&quot; to get started.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {quarters.map((q, i) => (
                                    <div key={i} className="rounded-lg border border-slate-700 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <input
                                                type="text"
                                                value={q.name}
                                                onChange={e => updateQuarter(i, 'name', e.target.value)}
                                                required
                                                className="rounded bg-surface border border-slate-700 px-2 py-1 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none w-24"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeQuarter(i)}
                                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-0.5">Start</label>
                                                <input
                                                    type="date"
                                                    value={q.startDate}
                                                    onChange={e => updateQuarter(i, 'startDate', e.target.value)}
                                                    required
                                                    className="w-full rounded bg-surface border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-0.5">End</label>
                                                <input
                                                    type="date"
                                                    value={q.endDate}
                                                    onChange={e => updateQuarter(i, 'endDate', e.target.value)}
                                                    required
                                                    className="w-full rounded bg-surface border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-0.5">Review deadline</label>
                                                <input
                                                    type="date"
                                                    value={q.reviewDeadline}
                                                    onChange={e => updateQuarter(i, 'reviewDeadline', e.target.value)}
                                                    required
                                                    className="w-full rounded bg-surface border border-slate-700 px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
                            disabled={creating || !name.trim() || quarters.length === 0}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {creating ? 'Creating...' : 'Create Cycle'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}

// ── CSV Import Modal ────────────────────────────────────────

function parseCsvText(text: string): Array<Record<string, string>> {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        // Simple CSV parser — handles quoted fields
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }
        values.push(current.trim());

        const row: Record<string, string> = {};
        for (let i = 0; i < headers.length; i++) {
            row[headers[i]] = values[i] ?? '';
        }
        return row;
    });
}

function CsvImportModal({ isOpen, onClose, onImported }: {
    isOpen: boolean;
    onClose: () => void;
    onImported: () => void;
}) {
    const [csvText, setCsvText] = useState('');
    const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState<{
        results: Array<{ email: string; status: string; message?: string }>;
        summary: { total: number; created: number; skipped: number; errors: number };
    } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setCsvText('');
            setPreview([]);
            setError('');
            setImportResult(null);
        }
    }, [isOpen]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvText(text);
            setPreview(parseCsvText(text));
            setError('');
        };
        reader.readAsText(file);
    };

    const handleTextChange = (text: string) => {
        setCsvText(text);
        setPreview(parseCsvText(text));
    };

    const handleImport = async () => {
        if (preview.length === 0) {
            setError('No valid rows to import');
            return;
        }

        // Validate required columns
        const requiredCols = ['email', 'displayName', 'jobTitle'];
        const missingCols = requiredCols.filter(col => !(col in preview[0]));
        if (missingCols.length > 0) {
            setError(`Missing required columns: ${missingCols.join(', ')}`);
            return;
        }

        setImporting(true);
        setError('');
        try {
            const rows = preview.map(row => ({
                email: row.email ?? '',
                displayName: row.displayName ?? '',
                jobTitle: row.jobTitle ?? '',
                department: row.department ?? '',
                managerEmail: row.managerEmail ?? '',
                level: row.level ? Number(row.level) : undefined,
            }));

            const { data } = await adminApi.importUsersFromCsv(rows);
            setImportResult(data);
            onImported();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to import users'));
        } finally {
            setImporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Users from CSV" maxWidth="max-w-2xl">
            {importResult ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3">
                            <p className="text-2xl font-bold text-emerald-400">{importResult.summary.created}</p>
                            <p className="text-xs text-emerald-300">Created</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                            <p className="text-2xl font-bold text-amber-400">{importResult.summary.skipped}</p>
                            <p className="text-xs text-amber-300">Skipped</p>
                        </div>
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
                            <p className="text-2xl font-bold text-red-400">{importResult.summary.errors}</p>
                            <p className="text-xs text-red-300">Errors</p>
                        </div>
                    </div>

                    {importResult.results.some(r => r.status === 'error') && (
                        <div className="max-h-40 overflow-y-auto rounded-lg bg-surface border border-slate-700 p-3">
                            {importResult.results
                                .filter(r => r.status === 'error')
                                .map((r, i) => (
                                    <p key={i} className="text-xs text-red-400">
                                        {r.email}: {r.message}
                                    </p>
                                ))}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-slate-400">
                        Upload a CSV file with the following columns:
                        <code className="ml-1 text-slate-300">email</code>,{' '}
                        <code className="text-slate-300">displayName</code>,{' '}
                        <code className="text-slate-300">jobTitle</code>,{' '}
                        <code className="text-slate-300">department</code> (optional),{' '}
                        <code className="text-slate-300">managerEmail</code> (optional),{' '}
                        <code className="text-slate-300">level</code> (optional, 1–5).
                    </p>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm text-red-400">{error}</div>
                    )}

                    <div className="flex items-center gap-3">
                        <label className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors cursor-pointer">
                            Choose File
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                        <span className="text-xs text-slate-500">or paste CSV data below</span>
                    </div>

                    <textarea
                        value={csvText}
                        onChange={e => handleTextChange(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg bg-surface border border-slate-700 px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none resize-none"
                        placeholder={'email,displayName,jobTitle,department,managerEmail,level\njane@company.com,Jane Smith,Software Engineer,Engineering,bob@company.com,5'}
                    />

                    {preview.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-slate-400 mb-2">{preview.length} row{preview.length !== 1 ? 's' : ''} detected</p>
                            <div className="max-h-32 overflow-y-auto rounded-lg bg-surface border border-slate-700">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-slate-400">
                                            {Object.keys(preview[0]).map(col => (
                                                <th key={col} className="px-2 py-1 text-left">{col}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.slice(0, 5).map((row, i) => (
                                            <tr key={i} className="border-b border-slate-700/50">
                                                {Object.values(row).map((val, j) => (
                                                    <td key={j} className="px-2 py-1 text-slate-300 truncate max-w-[150px]">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.length > 5 && (
                                    <p className="text-center text-xs text-slate-500 py-1">
                                        and {preview.length - 5} more…
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing || preview.length === 0}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                            {importing ? 'Importing…' : `Import ${preview.length} User${preview.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

// ── Org Tree Tab ────────────────────────────────────────────

interface OrgTreeNode {
    user: User;
    children: OrgTreeNode[];
}

function buildOrgTree(users: User[]): OrgTreeNode[] {
    const childrenMap = new Map<string | null, User[]>();
    for (const u of users) {
        const parentKey = u.managerId ?? null;
        const list = childrenMap.get(parentKey) ?? [];
        list.push(u);
        childrenMap.set(parentKey, list);
    }

    function build(parentId: string | null): OrgTreeNode[] {
        const children = childrenMap.get(parentId) ?? [];
        return children
            .sort((a, b) => a.level - b.level || a.displayName.localeCompare(b.displayName))
            .map(user => ({
                user,
                children: build(user.id),
            }));
    }

    return build(null);
}

function OrgTreeTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        adminApi.getUsers()
            .then(({ data }) => {
                setUsers(data);
                // Auto-expand the first 3 levels
                const autoExpand = new Set<string>();
                for (const u of data) {
                    if (u.level <= 3) autoExpand.add(u.id);
                }
                setExpandedIds(autoExpand);
            })
            .catch(err => setError(getErrorMessage(err, 'Failed to load users')))
            .finally(() => setIsLoading(false));
    }, []);

    const tree = useMemo(() => buildOrgTree(users), [users]);

    const toggleExpand = (userId: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedIds(new Set(users.map(u => u.id)));
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    // Count stats
    const levelCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        for (const u of users) {
            counts[u.level] = (counts[u.level] ?? 0) + 1;
        }
        return counts;
    }, [users]);

    const orphans = useMemo(() => {
        const userIds = new Set(users.map(u => u.id));
        return users.filter(u => u.managerId && !userIds.has(u.managerId));
    }, [users]);

    if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
    if (error) return (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
        </div>
    );

    return (
        <div>
            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm text-slate-400">
                    {users.length} member{users.length !== 1 ? 's' : ''} across {Object.keys(levelCounts).length} levels
                </span>
                <div className="flex gap-2">
                    {Object.entries(levelCounts)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([lvl, count]) => (
                            <span key={lvl} className="rounded-full bg-slate-700/50 px-2 py-0.5 text-xs text-slate-400">
                                L{lvl}: {count}
                            </span>
                        ))}
                </div>
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={expandAll}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Expand all
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        Collapse all
                    </button>
                </div>
            </div>

            {orphans.length > 0 && (
                <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-sm text-amber-400">
                    ⚠ {orphans.length} user{orphans.length !== 1 ? 's' : ''} have managers that don&apos;t exist in the system: {orphans.map(u => u.displayName).join(', ')}
                </div>
            )}

            {tree.length === 0 ? (
                <div className="rounded-xl bg-surface-raised border border-slate-700 p-8 text-center text-slate-500">
                    No users found. Add users in the Users tab to build the org tree.
                </div>
            ) : (
                <div className="rounded-xl bg-surface-raised border border-slate-700 p-4">
                    {tree.map(node => (
                        <OrgTreeNodeRow
                            key={node.user.id}
                            node={node}
                            depth={0}
                            expandedIds={expandedIds}
                            onToggle={toggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

const LEVEL_COLOURS: Record<number, string> = {
    1: 'border-l-purple-500',
    2: 'border-l-blue-500',
    3: 'border-l-cyan-500',
    4: 'border-l-emerald-500',
    5: 'border-l-slate-500',
};

function OrgTreeNodeRow({
    node,
    depth,
    expandedIds,
    onToggle,
}: {
    node: OrgTreeNode;
    depth: number;
    expandedIds: Set<string>;
    onToggle: (id: string) => void;
}) {
    const { user, children } = node;
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(user.id);
    const borderColour = LEVEL_COLOURS[user.level] ?? 'border-l-slate-600';

    return (
        <div>
            <div
                className={`flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-800/40 transition-colors border-l-2 ${borderColour}`}
                style={{ marginLeft: `${depth * 1.5}rem` }}
            >
                {/* Expand/collapse toggle */}
                <button
                    onClick={() => hasChildren && onToggle(user.id)}
                    className={`w-5 h-5 flex items-center justify-center rounded text-xs transition-colors ${hasChildren
                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 cursor-pointer'
                            : 'text-slate-700 cursor-default'
                        }`}
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    disabled={!hasChildren}
                >
                    {hasChildren ? (isExpanded ? '▾' : '▸') : '·'}
                </button>

                {/* Avatar placeholder */}
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300 shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Name + details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200 text-sm truncate">{user.displayName}</span>
                        <span className="shrink-0 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                            L{user.level}
                        </span>
                        {user.role === 'admin' && (
                            <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                admin
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                        {user.jobTitle}
                        {user.department && <span className="ml-1">· {user.department}</span>}
                    </p>
                </div>

                {/* Report count */}
                {hasChildren && (
                    <span className="text-xs text-slate-500 shrink-0">
                        {children.length} report{children.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {children.map(child => (
                        <OrgTreeNodeRow
                            key={child.user.id}
                            node={child}
                            depth={depth + 1}
                            expandedIds={expandedIds}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────

function isQuarterActive(startDate: string, endDate: string): boolean {
    const now = new Date();
    return now >= new Date(startDate) && now <= new Date(endDate);
}

const LEVEL_LABELS: Record<number, string> = {
    1: 'CTO / VP',
    2: 'Group Head',
    3: 'Tech Lead',
    4: 'Team Lead',
    5: 'IC',
};

function levelLabel(level: number): string {
    return LEVEL_LABELS[level] ?? `Level ${level}`;
}

/** Get all IDs in a user's downward tree (including the user themselves) */
function getDownwardIds(userId: string, users: User[]): Set<string> {
    const result = new Set<string>([userId]);
    const queue = [userId];
    while (queue.length > 0) {
        const current = queue.shift()!;
        for (const u of users) {
            if (u.managerId === current && !result.has(u.id)) {
                result.add(u.id);
                queue.push(u.id);
            }
        }
    }
    return result;
}
