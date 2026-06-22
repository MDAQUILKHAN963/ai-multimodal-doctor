import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const nav = useNavigate();
  const handleLogout = () => { logout(); nav('/login'); };

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-all px-3 py-1.5 rounded-lg ${
      isActive
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
    }`;

  return (
    <nav className="bg-dark-800 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-glow">
            <span className="text-white text-sm font-black">AI</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white text-base">AI Doctor</span>
            <span className="text-xs text-slate-500 hidden sm:block">Medical AI Assistant</span>
          </div>
        </Link>

        {token ? (
          <div className="flex items-center gap-1">
            <NavLink to="/xray"     className={linkClass}>🫁 X-ray</NavLink>
            <NavLink to="/symptoms" className={linkClass}>💬 Symptoms</NavLink>
            <NavLink to="/history"  className={linkClass}>📋 History</NavLink>
            <NavLink to="/profile"  className={linkClass}>👤 Profile</NavLink>
            <NavLink to="/settings" className={linkClass}>⚙️ Settings</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={linkClass}>⭐ Admin</NavLink>
            )}

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <NotificationBell />

            <div className="w-px h-5 bg-slate-700 mx-1" />

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-slate-300">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10
                           px-3 py-1.5 rounded-lg transition-all border border-transparent
                           hover:border-rose-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login"    className="btn-ghost text-sm px-4 py-2">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2">Get started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
