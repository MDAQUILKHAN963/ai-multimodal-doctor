import { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDebounce } from '../hooks/useDebounce.js';
import { usePagination } from '../hooks/usePagination.js';
import { SkeletonTable } from '../components/Skeleton.jsx';

const KIND_OPTIONS = [
  { value: '',         label: 'All types' },
  { value: 'xray',     label: '🫁 X-ray' },
  { value: 'symptoms', label: '💬 Symptoms' },
];

export default function History() {
  const [scans, setScans]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [kind, setKind]         = useState('');
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting]       = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  const pagination = usePagination(1);

  const fetchScans = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10, search: debouncedSearch, kind };
      const { data } = await axios.get('/api/history', { params });
      setScans(data.scans);
      setTotal(data.total);
      setPages(data.pages || 1);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, kind]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Reset to page 1 whenever search or kind changes
  useEffect(() => {
    pagination.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, kind]);

  const downloadReport = useCallback(async (id) => {
    setDownloading(id);
    try {
      const r = await axios.get(`/api/report/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: `ai-doctor-report-${id}.pdf` }).click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not generate report.');
    } finally {
      setDownloading(null);
    }
  }, []);

  const deleteScan = useCallback(async (id) => {
    setDeleting(id);
    try {
      await axios.delete(`/api/history/${id}`);
      setScans((s) => s.filter((x) => x._id !== id));
      setTotal((t) => t - 1);
      toast.success('Scan deleted.');
    } catch {
      toast.error('Could not delete.');
    } finally {
      setDeleting(null);
    }
  }, []);

  const pageNumbers = useMemo(
    () => Array.from({ length: pages }, (_, i) => i + 1),
    [pages]
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-navy-900">Scan History</h1>
        <p className="text-slate-500 text-sm mt-1">
          All past analyses — download PDF reports or delete entries.
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by label, condition, or symptom text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1"
        />
        <div className="flex gap-2">
          {KIND_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setKind(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                kind === value
                  ? 'bg-blue-500/20 text-blue-600 border-blue-500/30'
                  : 'bg-dark-600 text-slate-500 border-slate-200 hover:border-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-slate-500">
          {total} {total === 1 ? 'scan' : 'scans'} found
          {search && <span> for &ldquo;{search}&rdquo;</span>}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && <SkeletonTable rows={5} />}

      {/* Empty state */}
      {!loading && scans.length === 0 && (
        <div className="card p-16 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-4xl mb-4">
            📋
          </div>
          <p className="font-semibold text-slate-500">
            {search || kind ? 'No matching scans' : 'No scans yet'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            {search || kind
              ? 'Try a different search or filter.'
              : 'Upload an X-ray or check symptoms to see history here.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && scans.length > 0 && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-dark-600 border-b border-slate-200">
            {['Type', 'Result / Input', 'Details', 'Confidence', 'Date', ''].map((h, i) => (
              <div
                key={i}
                className={`text-xs font-semibold text-slate-500 uppercase tracking-widest ${
                  i === 0 ? 'col-span-1' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-3'
                  : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-2' : 'col-span-1 text-right'
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          <ul className="divide-y divide-slate-800">
            {scans.map((s) => (
              <li
                key={s._id}
                className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-dark-600/50 transition-colors"
              >
                <div className="col-span-1">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
                    s.kind === 'xray' ? 'bg-blue-500/20' : 'bg-violet-500/20'
                  }`}>
                    {s.kind === 'xray' ? '🫁' : '💬'}
                  </span>
                </div>

                <div className="col-span-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {s.kind === 'xray' ? (s.label || 'X-ray') : 'Symptom check'}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {s.kind === 'xray' ? 'X-ray analysis' : `${s.input?.text?.slice(0, 30) || ''}...`}
                  </p>
                </div>

                <div className="col-span-3">
                  {s.possibleConditions?.length > 0 && (
                    <p className="text-xs text-slate-500 truncate">
                      {s.possibleConditions.slice(0, 2).join(', ')}
                    </p>
                  )}
                  {s.kind === 'xray' && s.classes?.length > 0 && (
                    <p className="text-xs text-slate-600">{s.classes.length} classes</p>
                  )}
                </div>

                <div className="col-span-2">
                  {s.kind === 'xray' && s.confidence != null ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{Math.round(s.confidence * 100)}%</p>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                          style={{ width: `${Math.round(s.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-700">—</span>
                  )}
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="col-span-1 flex justify-end gap-1.5">
                  <button
                    onClick={() => downloadReport(s._id)}
                    disabled={downloading === s._id}
                    title="Download PDF"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-xs border border-blue-500/20 transition disabled:opacity-40"
                  >
                    {downloading === s._id ? '…' : '↓'}
                  </button>
                  <button
                    onClick={() => deleteScan(s._id)}
                    disabled={deleting === s._id}
                    title="Delete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs border border-rose-500/20 transition disabled:opacity-40"
                  >
                    {deleting === s._id ? '…' : '✕'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={pagination.prev}
            disabled={pagination.page === 1}
            className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-30"
          >
            ← Prev
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => pagination.goTo(n)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                n === pagination.page
                  ? 'bg-blue-600 text-white shadow-glow'
                  : 'bg-dark-600 text-slate-500 hover:bg-dark-500 hover:text-slate-800 border border-slate-200'
              }`}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => pagination.next(pages)}
            disabled={pagination.page === pages}
            className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
