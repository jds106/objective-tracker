import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/auth.api.js';
import { ApiError } from '../services/api-client.js';

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token') ?? '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!token) {
            setError('Missing reset token. Please use the link from your email.');
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(token, password);
            setSuccess(true);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md space-y-6 bg-surface-raised rounded-xl p-8 border border-slate-700">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-100">Password reset</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Your password has been reset successfully.
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                    >
                        Sign in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-indigo-400">Objective Tracker</h1>
                    <p className="mt-2 text-sm text-slate-400">Set a new password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-surface-raised rounded-xl p-8 border border-slate-700">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    {!token && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
                            No reset token found. Please use the link from your password reset email.
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                            New password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            minLength={8}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                            Confirm new password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            minLength={8}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !token}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Resetting...' : 'Reset password'}
                    </button>

                    <p className="text-center text-sm text-slate-400">
                        Remember your password?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
