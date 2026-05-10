import React, { useState } from 'react';
import { callAI } from '../services/aiService';
import { SYSTEM_PROMPT_SEO_MASTER } from '../data/prompts';
import { TARGET_MARKETS, SEO_CHECKLIST_DATA } from '../data/constants';
import { showToast } from '../components/Toast';

interface Props { market?: string; initialTopic?: string; }

const SeoModule: React.FC<Props> = ({ market = 'vn_motivation', initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  React.useEffect(() => { if (initialTopic) setTopic(initialTopic); }, [initialTopic]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); showToast('✅ Copied!', 'success'); };
  const toggle = (id: string) => setChecks(p => ({ ...p, [id]: !p[id] }));

  const handleGenerate = async () => {
    if (!topic) return showToast('Nhập chủ đề SEO!');
    setLoading(true);
    try {
      const mk = TARGET_MARKETS[market] || TARGET_MARKETS['vn_motivation'];
      const prompt = `TOPIC: "${topic}"\nTARGET_LANGUAGE: ${mk.voice_lang}\nTARGET_MARKET: ${mk.name}\nGENERATE JSON.`;
      const json = await callAI(prompt, SYSTEM_PROMPT_SEO_MASTER);
      setResult(json);
    } catch (e: any) { showToast(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[slideIn_0.4s_ease-out]">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><i className="fa-solid fa-magnifying-glass-chart text-green-500" /> SEO Chuyên Sâu</h2>
        <div className="flex gap-2 md:gap-4 mb-6 flex-col sm:flex-row">
          <input value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-green-500/50 placeholder-white/20" placeholder="Nhập chủ đề video..." />
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-green-900/40 hover:bg-green-800/40 border border-green-500/30 text-green-100 font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shrink-0">
            {loading ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG TỐI ƯU...</> : <><i className="fa-solid fa-magic" /> Tối Ưu SEO</>}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#151515] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2"><i className="fa-solid fa-check-square" /> CHECKLIST</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(SEO_CHECKLIST_DATA).map(([sec, items]) => (
                <div key={sec} className="bg-[#1a1a1a]/50 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{sec}</div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <label key={item.id} className="flex items-start gap-2 cursor-pointer group" onClick={() => toggle(item.id)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${checks[item.id] ? 'bg-green-500 border-green-500' : 'border-white/20 bg-black'}`}>
                          {checks[item.id] && <i className="fa-solid fa-check text-white text-[10px]" />}
                        </div>
                        <span className={`text-xs ${checks[item.id] ? 'text-slate-500 line-through' : 'text-slate-400 group-hover:text-white'}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            {!result ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-10 bg-white/5 border border-white/10 border-dashed rounded-xl">
                <i className="fa-solid fa-magic mb-2 opacity-50" /><p className="text-sm">Nhập chủ đề để phân tích</p>
              </div>
            ) : (
              <>
                {result.keywords && (
                  <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-blue-400 mb-3 uppercase">🔑 KEYWORDS</h4>
                    {['primary', 'secondary', 'long_tail'].map(type => Array.isArray(result.keywords[type]) && (
                      <div key={type} className="mb-2">
                        <div className="text-[10px] text-slate-400 mb-1 font-bold">{type}</div>
                        <div className="flex flex-wrap gap-1">{result.keywords[type].map((k: string, i: number) => <span key={i} className="bg-blue-900/20 text-blue-200 px-2 py-0.5 rounded-full text-[10px] border border-blue-500/20">{k}</span>)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {Array.isArray(result.hashtags) && (
                  <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-purple-400 mb-3 uppercase">#️⃣ HASHTAGS</h4>
                    <div className="flex flex-wrap gap-2">{result.hashtags.map((h: string, i: number) => <button key={i} onClick={() => copy(h)} className="bg-purple-900/20 text-purple-300 px-3 py-1 rounded-lg text-sm border border-purple-500/20 hover:bg-purple-900/30">{h}</button>)}</div>
                    <button onClick={() => copy(result.hashtags.join(' '))} className="mt-2 text-xs text-purple-400 hover:underline flex items-center gap-1"><i className="fa-solid fa-copy" /> Copy All</button>
                  </div>
                )}
                {Array.isArray(result.viral_titles) && (
                  <div className="bg-[#151515] border border-white/5 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-yellow-400 mb-3 uppercase">⚡ VIRAL TITLES</h4>
                    <div className="space-y-2">{result.viral_titles.map((t: string, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-black p-2 rounded border border-white/10">
                        <span className="text-sm text-white font-medium flex-1">{i + 1}. {t}</span>
                        <button onClick={() => copy(t)} className="text-slate-500 hover:text-white ml-2"><i className="fa-solid fa-copy" /></button>
                      </div>
                    ))}</div>
                  </div>
                )}
                {result.video_description?.full_description && (
                  <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-green-400 mb-3 uppercase">📝 DESCRIPTION</h4>
                    {result.video_description.hook && <p className="text-sm text-white font-medium bg-green-900/20 p-3 rounded border border-green-500/20 mb-3">{result.video_description.hook}</p>}
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{result.video_description.full_description}</p>
                    <button onClick={() => copy(result.video_description.full_description)} className="mt-2 text-xs text-green-400 hover:underline flex items-center gap-1"><i className="fa-solid fa-copy" /> Copy</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoModule;
