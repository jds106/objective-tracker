import { useState, useRef, type FormEvent } from 'react';
import { useAuth } from '../contexts/auth.context.js';
import { UserAvatar } from '../components/UserAvatar.js';
import { PageTransition } from '../components/PageTransition.js';
import { getErrorMessage } from '../utils/error.js';
import * as usersApi from '../services/users.api.js';

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const { data } = await usersApi.updateProfile({ displayName, jobTitle, department: department || undefined });
      updateUser(data);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: getErrorMessage(err, 'Failed to update profile') });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password changed successfully.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: getErrorMessage(err, 'Failed to change password') });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    try {
      const { data } = await usersApi.uploadAvatar(file);
      updateUser(data);
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setProfileMsg({ type: 'error', text: getErrorMessage(err, 'Failed to upload avatar') });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarUploading(true);
    try {
      const { data } = await usersApi.deleteAvatar();
      updateUser(data);
      setAvatarPreview(null);
    } catch (err) {
      setProfileMsg({ type: 'error', text: getErrorMessage(err, 'Failed to remove avatar') });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!user) return null;

  return (
    <PageTransition className="max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-100">Profile</h2>
      <p className="mt-1 text-slate-400">Manage your account settings.</p>

      {/* Avatar section */}
      <div className="mt-8 rounded-xl bg-surface-raised border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Avatar</h3>
        <div className="flex items-center gap-6">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover shrink-0" />
          ) : (
            <UserAvatar user={user} size="lg" />
          )}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            {avatarPreview ? (
              <div className="flex gap-2">
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarUploading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {avatarUploading ? 'Uploading...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  {user.avatarUrl ? 'Change' : 'Upload'}
                </button>
                {user.avatarUrl && (
                  <button
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-slate-500">PNG, JPEG, or WebP. Max 2 MB.</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleProfileSubmit} className="mt-6 rounded-xl bg-surface-raised border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Profile Details</h3>

        {profileMsg && (
          <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {profileMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
            <input
              id="jobTitle"
              type="text"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-slate-300 mb-1">Department</label>
            <input
              id="department"
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password change */}
      <form onSubmit={handlePasswordSubmit} className="mt-6 rounded-xl bg-surface-raised border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Change Password</h3>

        {passwordMsg && (
          <div className={`mb-4 rounded-lg px-4 py-2 text-sm ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {passwordMsg.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={passwordSaving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </PageTransition>
  );
}
