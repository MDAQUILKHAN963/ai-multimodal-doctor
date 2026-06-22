import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers]     = useState([]);
  const [scans, setScans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('users');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/users'),
      axios.get('/api/admin/scans'),
    ])
      .then(([uRes, sRes]) => {
        setUsers(uRes.data);
        setScans(sRes.data);
      })
      .catch(() => toast.error('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalScans: scans.length,
    xrayCount:  scans.filter((s) => s.kind === 'xray').length,
    symCount:   scans.filter((s) => s.kind === 'symptoms').length,
    adminCount: users.filter((u) => u.role === 'admin').length,
  }), [users, scans]);

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all their scans? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/admin/users/${id}`);
      setUsers((u) => u.filter((x) => x._id !== id));
      setScans((s) => s.filter((x) => x.userId?._id !== id));
      toast.success(`User "${name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const TABS = [
    { key: 'users', label: `Users (${stats.totalUsers})` },
    { key: 'scans', label: `Scans (${stats.totalScans})` },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Signed in as <span className="text-amber-400">{user?.email}</span> — admin access.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total users',  value: stats.totalUsers, color: 'text-blue-400' },
          { label: 'Total scans',  value: stats.totalScans, color: 'text-cyan-400' },
          { label: 'X-ray scans', value: stats.xrayCount,  color: 'text-violet-400' },
          { label: 'Symptom checks', value: stats.symCount, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-5">
            <p className="text-xs text-slate-500 uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <SkeletonTable rows={6} />}

      {/* Users table */}
      {!loading && tab === 'users' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-dark-600 border-b border-slate-800">
            {['Name', 'Email', 'Role', 'Joined', ''].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-semibold text-slate-500 uppercase tracking-widest ${
                  i === 0 ? 'col-span-3' : i === 1 ? 'col-span-4' : i === 2 ? 'col-span-2'
                  : i === 3 ? 'col-span-2' : 'col-span-1 text-right'
                }`}
              >
                {h}
              </div>
            ))}
          </div>
          <ul className="divide-y divide-slate-800">
            {users.map((u) => (
              <li key={u._id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-dark-600/50 transition-colors">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-200 truncate">{u.name}</span>
                </div>
                <div className="col-span-4 text-sm text-slate-400 truncate">{u.email}</div>
                <div className="col-span-2">
                  <span className={`badge ${
                    u.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-700 text-slate-400'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end">
                  {u._id !== user?.id && (
                    <button
                      onClick={() => deleteUser(u._id, u.name)}
                      disabled={deleting === u._id}
                      className="btn-danger py-1 px-2 text-xs"
                    >
                      {deleting === u._id ? '…' : 'Delete'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scans table */}
      {!loading && tab === 'scans' && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-dark-600 border-b border-slate-800">
            {['User', 'Type', 'Result', 'Confidence', 'Date'].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-semibold text-slate-500 uppercase tracking-widest ${
                  i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-3'
                  : i === 3 ? 'col-span-2' : 'col-span-2'
                }`}
              >
                {h}
              </div>
            ))}
          </div>
          <ul className="divide-y divide-slate-800">
            {scans.map((s) => (
              <li key={s._id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-dark-600/50 transition-colors">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-slate-200 truncate">{s.userId?.name || '—'}</p>
                  <p className="text-xs text-slate-600 truncate">{s.userId?.email || '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className={`badge ${s.kind === 'xray' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'}`}>
                    {s.kind === 'xray' ? '🫁 X-ray' : '💬 Symptoms'}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-slate-300 truncate">
                  {s.label || s.possibleConditions?.slice(0, 1).join(', ') || '—'}
                </div>
                <div className="col-span-2 text-sm text-slate-400">
                  {s.confidence != null ? `${Math.round(s.confidence * 100)}%` : '—'}
                </div>
                <div className="col-span-2 text-xs text-slate-500">
                  {new Date(s.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
