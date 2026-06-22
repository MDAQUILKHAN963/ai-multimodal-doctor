import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

const PIE_COLORS = ['#f43f5e', '#3b82f6', '#22c55e', '#f59e0b'];

const STAT_PILLS = [
  { key: 'totalXray',     label: 'X-ray Scans',    icon: '🫁', from: 'from-violet-600', to: 'to-violet-400' },
  { key: 'totalSymptoms', label: 'Symptom Checks',  icon: '💬', from: 'from-cyan-600',   to: 'to-cyan-400'   },
  { key: 'total',         label: 'Total Analyses',  icon: '📊', from: 'from-rose-600',   to: 'to-rose-400'   },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('/api/history/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const total = stats ? stats.totalXray + stats.totalSymptoms : 0;
  const statValues = { totalXray: stats?.totalXray ?? 0, totalSymptoms: stats?.totalSymptoms ?? 0, total };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-8 animate-slide-up">

      {/* Hero header — Image 1 inspired */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1b3e] via-[#0f2254] to-[#0a1628] border border-blue-500/20 p-8 shadow-glow">
        {/* Background glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <p className="text-blue-400 text-sm font-semibold mb-1">{greeting},</p>
          <h1 className="text-3xl font-black text-white text-glow">{user?.name || 'Doctor'}</h1>
          <p className="text-slate-400 mt-2 text-sm max-w-lg">
            AI-powered chest X-ray analysis, symptom assessment, and medical report generation.
          </p>

          {/* Stat pills — Image 1 style */}
          <div className="flex flex-wrap gap-3 mt-6">
            {STAT_PILLS.map(({ key, label, icon, from, to }) => (
              <div key={key}
                className={`bg-gradient-to-b ${from} ${to} rounded-2xl px-5 py-3 min-w-[100px] text-center shadow-lg`}>
                <span className="text-xl">{icon}</span>
                <p className="text-2xl font-black text-white mt-1">{statValues[key]}</p>
                <p className="text-xs text-white/70 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/xray" className="group card p-6 hover:border-blue-500/40 hover:shadow-glow transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🫁
            </div>
            <div>
              <p className="font-bold text-white">X-ray Analysis</p>
              <p className="text-xs text-slate-500 mt-0.5">AI-powered chest X-ray classification</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="badge bg-blue-500/20 text-blue-400 border border-blue-500/30">Deep Learning</span>
            <span className="badge bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Visual Heatmap</span>
          </div>
        </Link>

        <Link to="/symptoms" className="group card p-6 hover:border-violet-500/40 hover:shadow-glow-violet transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <p className="font-bold text-white">Symptom Checker</p>
              <p className="text-xs text-slate-500 mt-0.5">AI symptom analysis with medical knowledge</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="badge bg-violet-500/20 text-violet-400 border border-violet-500/30">Symptom Detection</span>
            <span className="badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Medical Knowledge</span>
          </div>
        </Link>
      </div>

      {/* Charts */}
      {stats && total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="card p-6">
            <h2 className="section-title">Conditions Detected</h2>
            {stats.conditionStats.length === 0 ? (
              <p className="text-slate-600 text-sm">Upload X-rays to see data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={stats.conditionStats} dataKey="count" nameKey="label"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                    paddingAngle={3}>
                    {stats.conditionStats.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '12px', color: '#f1f5f9' }}
                    formatter={(v) => [`${v} scan(s)`, '']} />
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card p-6">
            <h2 className="section-title">Recent Activity</h2>
            {stats.recent.length === 0 ? (
              <p className="text-slate-600 text-sm">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {stats.recent.map((s) => (
                  <li key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-600 border border-slate-700/40">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      s.kind === 'xray' ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
                      {s.kind === 'xray' ? '🫁' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {s.kind === 'xray' ? (s.label || 'X-ray') : 'Symptom check'}
                      </p>
                      {s.kind === 'xray' && s.confidence != null && (
                        <p className="text-xs text-slate-500">{Math.round(s.confidence * 100)}% confidence</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 shrink-0">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/history" className="block mt-4 text-sm text-blue-400 hover:text-blue-300 font-medium transition">
              View all history &rarr;
            </Link>
          </div>

        </div>
      )}

      {/* Capabilities */}
      <div className="card p-5">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-3">Capabilities</p>
        <div className="flex flex-wrap gap-2">
          {['X-ray Classification','Visual Heatmap','Symptom Detection','Medical Knowledge Base','AI Assistant','Real-time Alerts','PDF Reports','Scan History'].map((t) => (
            <span key={t} className="badge bg-slate-800 text-slate-400 border border-slate-700 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
