import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFound() {
  const nav = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => nav('/'), 10000);
    return () => clearTimeout(id);
  }, [nav]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-24 h-24 rounded-3xl bg-dark-600 border border-slate-700 flex items-center justify-center mb-6">
        <span className="text-5xl font-black text-slate-600">?</span>
      </div>
      <h1 className="text-6xl font-black text-slate-700 mb-2">404</h1>
      <h2 className="text-xl font-bold text-white mb-2">Page not found</h2>
      <p className="text-slate-500 text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Redirecting to dashboard in 10 seconds.
      </p>
      <div className="flex gap-3">
        <Link to="/" className="btn-primary px-6">Go to Dashboard</Link>
        <button onClick={() => nav(-1)} className="btn-ghost px-6">Go back</button>
      </div>
    </div>
  );
}
