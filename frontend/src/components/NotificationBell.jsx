import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';

export default function NotificationBell() {
  const { notifications, unread, markAllSeen } = useSocket();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = () => {
    setOpen((o) => {
      if (!o) markAllSeen(); // clear badge when opening
      return !o;
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg
                   text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] px-1
                           bg-blue-500 text-white text-[10px] font-bold rounded-full
                           flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-700 border border-slate-200
                        rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700 transition"
              >
                Close
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-800">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center">
                <p className="text-sm text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">Scan results will appear here</p>
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 transition-colors ${
                    !n.seen ? 'bg-blue-500/5' : 'hover:bg-dark-600/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5 shrink-0">
                      {n.emergency ? '🚨' : n.kind === 'xray' ? '🫁' : '💬'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${n.emergency ? 'text-rose-600' : 'text-slate-800'}`}>
                        {n.message}
                      </p>
                      {n.kind === 'xray' && n.confidence != null && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Confidence: {n.confidence}%
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-0.5">
                        {new Date(n.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.seen && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
