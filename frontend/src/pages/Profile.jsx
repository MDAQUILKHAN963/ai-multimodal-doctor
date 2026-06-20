import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, login, token } = useAuth();

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    reset: resetProfile,
    formState: { isSubmitting: savingProfile },
  } = useForm();

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    reset: resetPwd,
    watch,
    formState: { isSubmitting: savingPwd, errors: pwdErrors },
  } = useForm();

  useEffect(() => {
    axios.get('/api/user/profile')
      .then(({ data }) => resetProfile({ name: data.name, email: data.email }))
      .catch(() => toast.error('Failed to load profile'));
  }, [resetProfile]);

  const saveProfile = useCallback(async (data) => {
    try {
      const { data: updated } = await axios.put('/api/user/profile', { name: data.name });
      login(token, { ...user, name: updated.name });
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  }, [login, token, user]);

  const changePassword = useCallback(async (data) => {
    try {
      await axios.put('/api/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      resetPwd();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Password change failed');
    }
  }, [resetPwd]);

  const newPwd = watch('newPassword');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Profile</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account details and password.</p>
      </div>

      {/* Avatar + name */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 shadow-glow-violet">
          <span className="text-white text-2xl font-black">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className={`mt-1 badge ${
            user?.role === 'admin'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {user?.role === 'admin' ? '⭐ Admin' : '👤 User'}
          </span>
        </div>
      </div>

      {/* Profile form */}
      <div className="card p-6">
        <h2 className="section-title">Account Details</h2>
        <form onSubmit={handleProfile(saveProfile)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Full name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Your name"
              {...regProfile('name', { required: 'Name is required' })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Email address
            </label>
            <input
              type="email"
              className="input opacity-60 cursor-not-allowed"
              readOnly
              {...regProfile('email')}
            />
            <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="section-title">Change Password</h2>
        <form onSubmit={handlePwd(changePassword)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Current password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...regPwd('currentPassword', { required: 'Required' })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              New password
            </label>
            <input
              type="password"
              className="input"
              placeholder="Min 6 characters"
              {...regPwd('newPassword', {
                required: 'Required',
                minLength: { value: 6, message: 'Min 6 characters' },
              })}
            />
            {pwdErrors.newPassword && (
              <p className="text-xs text-rose-400 mt-1">{pwdErrors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              {...regPwd('confirmPassword', {
                validate: (v) => v === newPwd || 'Passwords do not match',
              })}
            />
            {pwdErrors.confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">{pwdErrors.confirmPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={savingPwd} className="btn-primary">
            {savingPwd ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
