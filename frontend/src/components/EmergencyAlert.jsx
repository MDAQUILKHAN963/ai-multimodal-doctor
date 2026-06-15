export default function EmergencyAlert({ emergency }) {
  if (!emergency?.is_emergency) return null;
  return (
    <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-5 flex items-start gap-4 animate-fade-in shadow-lg">
      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-xl shrink-0">
        🚨
      </div>
      <div className="flex-1">
        <p className="font-bold text-rose-400 text-base">Emergency Symptom Detected</p>
        <p className="text-sm text-rose-400/80 mt-0.5">{emergency.message}</p>
        {emergency.triggers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {emergency.triggers.map((t, i) => (
              <span key={i} className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-1 rounded-lg font-semibold">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-rose-500/70 mt-3 font-medium">
          ⚡ Call emergency services or go to the nearest hospital immediately.
        </p>
      </div>
    </div>
  );
}
