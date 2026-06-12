import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload.jsx';
import ResultCard from '../components/ResultCard.jsx';

export default function XrayAnalysis() {
  const [result, setResult] = useState(null);
  const [scanId, setScanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = async (file) => {
    setError(''); setResult(null); setScanId(null);
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const { data } = await axios.post('/api/predict/xray', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data); setScanId(data.scanId || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed.');
    } finally { setLoading(false); }
  };

  const downloadReport = async () => {
    if (!scanId) return;
    setDownloading(true);
    try {
      const r = await axios.get(`/api/report/${scanId}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      Object.assign(document.createElement('a'), { href: url, download: `ai-doctor-report-${scanId}.pdf` }).click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not generate report.'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">X-ray Analysis</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload a chest X-ray for instant AI classification with a visual focus heatmap.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="section-title">Upload Image</h2>
            <ImageUpload onFile={handleFile} disabled={loading} />
            {preview && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-widest">Preview</p>
                <img src={preview} alt="X-ray preview"
                  className="rounded-xl border border-slate-700 w-full max-h-60 object-contain bg-slate-950" />
              </div>
            )}
          </div>

          {/* Model info */}
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Model Info</p>
            <div className="space-y-2">
              {[
                ['AI Model',          'Deep Learning Classifier'],
                ['Detects',           'COVID / Lung Opacity / Normal / Pneumonia'],
                ['Visual Explanation','Focus Area Heatmap'],
                ['Image Input',       '224 × 224 px'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-sm">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-300 text-right font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {loading && (
            <div className="card p-10 flex flex-col items-center gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"/>
                <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"/>
                <div className="absolute inset-3 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="text-xl">🫁</span>
                </div>
              </div>
              <p className="text-white font-semibold">Analyzing X-ray...</p>
              <p className="text-xs text-slate-500">Running AI analysis, please wait...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {result && !loading && (
            <>
              <ResultCard result={result} />
              {scanId && (
                <button onClick={downloadReport} disabled={downloading} className="btn-primary w-full">
                  {downloading
                    ? <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                        </svg> Generating PDF...
                      </span>
                    : '↓  Download Full Report (PDF)'}
                </button>
              )}
            </>
          )}

          {!result && !loading && !error && (
            <div className="card p-12 flex flex-col items-center text-center min-h-64">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-4xl mb-4">
                🫁
              </div>
              <p className="font-semibold text-slate-400">No analysis yet</p>
              <p className="text-sm text-slate-600 mt-1">Upload an X-ray to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
