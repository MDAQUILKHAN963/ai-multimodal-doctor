import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/login', form);
      login(data.token, data.user); nav('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center animate-fade-in">
      {/* AdhereTech-style geometric accents */}
      <div className="geo-square top-10 left-[12%] w-10 h-10 bg-mint-400/50 rotate-12" />
      <div className="geo-square top-28 left-[20%] w-4 h-4 bg-blue-600/30 -rotate-6" />
      <div className="geo-square bottom-16 right-[14%] w-12 h-12 bg-blue-600/15 rotate-45" />
      <div className="geo-square bottom-32 right-[22%] w-5 h-5 bg-mint-400/60 rotate-12" />

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded bg-mint-400" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-800 to-blue-600 flex items-center justify-center shadow-glow">
              <span className="text-white text-3xl font-black">AI</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Welcome back</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to AI Doctor</p>
        </div>

        <div className="card p-8">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Email address
              </label>
              <input type="email" required autoComplete="email"
                placeholder="you@example.com"
                value={form.email} onChange={set('email')}
                className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input type="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={form.password} onChange={set('password')}
                className="input" />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg> Signing in...
                  </span>
                : 'Sign in'}
            </button>
          </form>

          <div className="glow-divider my-6" />

          <div className="space-y-3 text-center">
            <p className="text-sm text-slate-500">
              <Link to="/forgot-password" className="text-slate-500 hover:text-slate-700 transition text-xs">
                Forgot your password?
              </Link>
            </p>
            <p className="text-sm text-slate-500">
              No account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
