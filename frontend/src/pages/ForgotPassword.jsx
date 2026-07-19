import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [devToken, setDevToken] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
      if (data.resetToken) setDevToken(data.resetToken); // dev mode only
      toast.success('Check your email for a reset link');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mx-auto mb-5 shadow-glow">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Forgot password?</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="card p-8">
          {!sent ? (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 text-green-600 px-4 py-3 rounded-xl text-sm">
                Reset instructions sent. Check your inbox (and spam folder).
              </div>

              {devToken && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">
                    Reset link
                  </p>
                  <p className="text-xs text-slate-500 font-mono break-all">{devToken}</p>
                  <Link
                    to={`/reset-password/${devToken}`}
                    className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    Click here to reset →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="glow-divider my-6" />

          <p className="text-center text-sm text-slate-500">
            Remembered it?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
