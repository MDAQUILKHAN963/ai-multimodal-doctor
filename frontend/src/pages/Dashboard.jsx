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

      {/* Hero header — AdhereTech-style blue panel with geometric accents */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-800 via-blue-700 to-blue-600 p-8 shadow-glow">
        {/* Geometric square accents */}
        <div className="geo-square top-6 right-10 w-10 h-10 bg-mint-400/80 rotate-6" />
        <div className="geo-square top-16 right-28 w-5 h-5 bg-white/25 -rotate-12" />
        <div className="geo-square bottom-8 right-52 w-7 h-7 bg-mint-300/40 rotate-45" />
        <div className="geo-square -bottom-3 -left-3 w-16 h-16 bg-white/10 rotate-12" />

        <div className="relative z-10">
          <p className="text-mint-300 text-sm font-semibold mb-1">{greeting},</p>
          <h1 className="text-3xl font-black !text-white">{user?.name || 'Doctor'}</h1>
          <p className="text-blue-100/90 mt-2 text-sm max-w-lg">
            AI-powered chest X-ray analysis, symptom assessment, and medical report generation.
          </p>

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mt-6">
            {STAT_PILLS.map(({ key, label, icon }) => (
              <div key={key}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3 min-w-[100px] text-center">
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
              <p className="font-bold text-navy-900">X-ray Analysis</p>
              <p className="text-xs text-slate-500 mt-0.5">AI-powered chest X-ray classification</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="badge bg-blue-500/20 text-blue-600 border border-blue-500/30">Deep Learning</span>
            <span className="badge bg-cyan-500/20 text-cyan-600 border border-cyan-500/30">Visual Heatmap</span>
          </div>
        </Link>

        <Link to="/symptoms" className="group card p-6 hover:border-violet-500/40 hover:shadow-glow-violet transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              💬
            </div>
            <div>
              <p className="font-bold text-navy-900">Symptom Checker</p>
              <p className="text-xs text-slate-500 mt-0.5">AI symptom analysis with medical knowledge</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="badge bg-violet-500/20 text-violet-600 border border-violet-500/30">Symptom Detection</span>
            <span className="badge bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">Medical Knowledge</span>
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
                  <li key={s._id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-600 border border-slate-200">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      s.kind === 'xray' ? 'bg-blue-500/20' : 'bg-violet-500/20'}`}>
                      {s.kind === 'xray' ? '🫁' : '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
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
            <Link to="/history" className="block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium transition">
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
            <span key={t} className="badge bg-slate-100 text-slate-500 border border-slate-200 text-xs">
              {t}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}
