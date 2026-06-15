import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import EmergencyAlert from '../components/EmergencyAlert.jsx';

const SUGGESTIONS = [
  'I have fever and dry cough for 3 days',
  'Headache and body aches since yesterday',
  'Chest pain and shortness of breath',
  'Loss of taste and smell with fatigue',
];

export default function SymptomChat() {
  const [messages, setMessages] = useState([{
    role: 'ai',
    text: "Hello! I'm your AI medical assistant. Describe your symptoms in plain language and I'll provide guidance based on a comprehensive medical knowledge base.",
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [emergency, setEmergency] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setInput(''); setLoading(true); setEmergency(null);
    try {
      const { data } = await axios.post('/api/predict/symptoms', { text: msg });
      setEmergency(data.emergency);
      const reply = data.gemini_response || buildFallback(data);
      setMessages((m) => [...m, { role: 'ai', text: reply, isMarkdown: true, data }]);
    } catch (err) {
      setMessages((m) => [...m, {
        role: 'ai', text: `Error: ${err.response?.data?.error || err.message}`
      }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Symptom Checker</h1>
        <p className="text-slate-500 text-sm mt-1">
          Describe your symptoms and get instant AI-powered assessment and guidance.
        </p>
      </div>

      <EmergencyAlert emergency={emergency} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chat */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden" style={{ height: '540px' }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {m.role === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2 mt-0.5 shrink-0 shadow-glow">
                    <span className="text-white text-xs font-black">AI</span>
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-dark-600 border border-slate-700/50 text-slate-200 rounded-bl-sm'
                }`}>
                  {m.isMarkdown && m.role === 'ai'
                    ? <div className="prose prose-sm prose-invert max-w-none prose-p:my-1">
                        <ReactMarkdown>{m.text}</ReactMarkdown>
                      </div>
                    : <p className="whitespace-pre-wrap">{m.text}</p>
                  }
                  {m.data?.entities?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.data.entities.map((e, j) => (
                        <span key={j} className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs px-2 py-0.5 rounded-full font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mr-2 shrink-0">
                  <span className="text-white text-xs font-black">AI</span>
                </div>
                <div className="bg-dark-600 border border-slate-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-4 bg-dark-800">
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms..." disabled={loading}
                className="input flex-1" />
              <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-5">
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Try these</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)} disabled={loading}
                  className="w-full text-left text-xs text-slate-400 bg-dark-600 hover:bg-dark-500
                             hover:text-slate-200 px-3 py-2.5 rounded-xl border border-slate-700/50
                             hover:border-blue-500/30 transition-all disabled:opacity-40">
                  &ldquo;{s}&rdquo;
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Pipeline</p>
            <ol className="space-y-3">
              {[
                { icon: '🔍', text: 'AI detects symptoms & medical terms', color: 'text-blue-400' },
                { icon: '📚', text: 'Medical knowledge base is searched',   color: 'text-cyan-400' },
                { icon: '✦',  text: 'AI generates doctor-style response',   color: 'text-violet-400' },
                { icon: '🚨', text: 'Emergency symptoms trigger an alert',  color: 'text-rose-400' },
              ].map(({ icon, text, color }, i) => (
                <li key={i} className="flex items-start gap-3 text-xs text-slate-500">
                  <span className={`${color} text-base shrink-0 mt-0.5`}>{icon}</span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFallback(data) {
  const c = data.possible_conditions?.join(', ') || 'none detected';
  const e = data.entities?.join(', ') || 'none';
  return `**Detected symptoms:** ${e}\n\n**Possible conditions:** ${c}\n\nPlease consult a qualified doctor for proper diagnosis and treatment.`;
}
