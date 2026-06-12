import ReactMarkdown from 'react-markdown';

const CONDITION_STYLE = {
  'COVID':        { bg: 'bg-rose-500/15',   border: 'border-rose-500/30',   text: 'text-rose-400',   dot: 'bg-rose-500'    },
  'Pneumonia':    { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  dot: 'bg-amber-500'   },
  'Lung Opacity': { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500'  },
  'Normal':       { bg: 'bg-emerald-500/15',border: 'border-emerald-500/30',text: 'text-emerald-400',dot: 'bg-emerald-500' },
};
const DEFAULT_STYLE = { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' };

export default function ResultCard({ result }) {
  if (!result) return null;
  const pct = Math.round((result.confidence || 0) * 100);
  const style = CONDITION_STYLE[result.label] || DEFAULT_STYLE;

  return (
    <div className="card p-6 space-y-5 animate-slide-up">

      {/* Label */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">AI Prediction</p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${style.bg} ${style.border}`}>
            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
            <span className={`text-lg font-black ${style.text}`}>{result.label}</span>
          </div>
        </div>
        <span className="text-xs text-slate-600 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
          {result.model}
        </span>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500 font-medium">Confidence</span>
          <span className={`font-black text-lg ${style.text}`}>{pct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div className="h-3 rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-600 to-cyan-400"
            style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-600 mt-1.5">
          {pct >= 75 ? '✓ High confidence' : pct >= 50 ? '⚠ Moderate confidence' : '✗ Low confidence — result unreliable'}
        </p>
      </div>

      {/* Class probabilities */}
      {result.probs && result.classes && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">All Classes</p>
          <div className="space-y-2">
            {result.classes.map((cls, i) => {
              const p = Math.round((result.probs[i] || 0) * 100);
              const s = CONDITION_STYLE[cls] || DEFAULT_STYLE;
              return (
                <div key={cls} className="flex items-center gap-3 text-xs">
                  <span className={`w-20 ${s.text} shrink-0 font-medium`}>{cls}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full ${s.dot}`} style={{ width: `${p}%` }} />
                  </div>
                  <span className="w-8 text-right text-slate-500">{p}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grad-CAM */}
      {result.heatmap_base64 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">AI Focus Areas</p>
          <p className="text-xs text-slate-600 mb-3">Highlighted regions show where the AI focused during analysis.</p>
          <img src={`data:image/png;base64,${result.heatmap_base64}`} alt="Grad-CAM"
            className="rounded-xl border border-slate-700 w-full max-w-sm object-contain bg-slate-950" />
        </div>
      )}

      {/* Gemini */}
      {result.gemini_explanation && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white text-xs font-black">✦</span>
            </div>
            <p className="text-sm font-bold text-blue-300">AI Explanation</p>
          </div>
          <div className="text-sm text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{result.gemini_explanation}</ReactMarkdown>
          </div>
        </div>
      )}

      {result.gemini_explanation === null && (
        <p className="text-xs text-slate-600 italic">AI explanation unavailable.</p>
      )}
    </div>
  );
}
