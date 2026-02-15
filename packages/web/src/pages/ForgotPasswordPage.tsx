import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth.api.js';
import { ApiError } from '../services/api-client.js';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [resetToken, setResetToken] = useState<string | null>(null);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            const { data } = await forgotPassword(email);
            setSubmitted(true);
            if (data.resetToken) {
                setResetToken(data.resetToken);
            }
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

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md space-y-6 bg-surface-raised rounded-xl p-8 border border-slate-700">
                    <div className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                            <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-100">Check your email</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            If an account with that email exists, we&apos;ve sent a password reset link.
                        </p>
                    </div>

                    {resetToken && (
                        <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                            <p className="text-xs font-medium text-amber-400 mb-1">Development mode — reset link:</p>
                            <Link
                                to={`/reset-password?token=${resetToken}`}
                                className="text-sm text-indigo-400 hover:text-indigo-300 break-all"
                            >
                                /reset-password?token={resetToken}
                            </Link>
                        </div>
                    )}

                    <Link
                        to="/login"
                        className="block text-center text-sm text-indigo-400 hover:text-indigo-300"
                    >
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-indigo-400">Objective Tracker</h1>
                    <p className="mt-2 text-sm text-slate-400">Reset your password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-surface-raised rounded-xl p-8 border border-slate-700">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <p className="text-sm text-slate-400">
                        Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                    </p>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="you@company.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Sending...' : 'Send reset link'}
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
