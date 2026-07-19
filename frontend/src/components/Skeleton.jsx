export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="card p-5 space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonLine
          key={i}
          className={`h-4 ${i === 0 ? 'w-1/3' : i % 2 === 0 ? 'w-full' : 'w-4/5'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 bg-dark-600 border-b border-slate-200">
        <SkeletonLine className="h-3 w-48" />
      </div>
      <ul className="divide-y divide-slate-800">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="px-5 py-4 flex gap-4 items-center">
            <SkeletonLine className="h-8 w-8 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-3 w-32" />
              <SkeletonLine className="h-3 w-48" />
            </div>
            <SkeletonLine className="h-3 w-16" />
            <SkeletonLine className="h-3 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-5 space-y-3">
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-8 w-16" />
      <SkeletonLine className="h-3 w-32" />
    </div>
  );
}
