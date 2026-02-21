import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';
import { getErrorMessage } from '../utils/error.js';

export function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    jobTitle: '',
    managerEmail: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  const passwordsMatch = form.password === form.confirmPassword;
  const showMismatch = form.confirmPassword.length > 0 && !passwordsMatch;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!passwordsMatch) return;
    setError('');
    setIsSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        jobTitle: form.jobTitle,
        ...(form.managerEmail ? { managerEmail: form.managerEmail } : {}),
        ...(form.department ? { department: form.department } : {}),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'An unexpected error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <img src="/logo.png" alt="North Star" className="mx-auto h-24 w-auto rounded-2xl" />
          <h1 className="mt-4 text-3xl font-bold text-indigo-400">North Star</h1>
          <p className="mt-2 text-sm text-slate-400">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-surface-raised rounded-xl p-8 border border-slate-700">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300">
              Full name
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={form.displayName}
              onChange={e => updateField('displayName', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={e => updateField('email', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-300">
              Job title
            </label>
            <input
              id="jobTitle"
              type="text"
              required
              value={form.jobTitle}
              onChange={e => updateField('jobTitle', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
              placeholder="Software Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="managerEmail" className="block text-sm font-medium text-slate-300">
                Manager&apos;s email
                <span className="text-slate-500 font-normal"> (optional)</span>
              </label>
              <input
                id="managerEmail"
                type="email"
                value={form.managerEmail}
                onChange={e => updateField('managerEmail', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
                placeholder="manager@company.com"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-300">
                Department
                <span className="text-slate-500 font-normal"> (optional)</span>
              </label>
              <input
                id="department"
                type="text"
                value={form.department}
                onChange={e => updateField('department', e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
                placeholder="Engineering"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 -mt-3">
            Your org level is set automatically from your manager. You can update these later in your profile.
          </p>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              aria-describedby="password-hint"
              value={form.password}
              onChange={e => updateField('password', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-600 bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:shadow-sm focus:shadow-indigo-500/20"
              placeholder="••••••••"
            />
            <p id="password-hint" className="mt-1 text-xs text-slate-500">At least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={e => updateField('confirmPassword', e.target.value)}
              className={`mt-1 block w-full rounded-lg border bg-surface px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 ${
                showMismatch
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-600 focus:border-indigo-500 focus:ring-indigo-500'
              }`}
              placeholder="••••••••"
            />
            {showMismatch && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || showMismatch}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
