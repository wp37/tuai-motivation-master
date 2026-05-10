import React, { useState } from 'react';
import { callAI, fetchYoutubeMeta } from '../services/aiService';
import { SYSTEM_PROMPT_IQ160_SPY } from '../data/prompts';
import { showToast } from '../components/Toast';

interface SpyModuleProps {
  onUseStrategy?: (title: string) => void;
}

const SpyModule: React.FC<SpyModuleProps> = ({ onUseStrategy }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);

  const copy = (text: string) => { navigator.clipboard.writeText(text); showToast('✅ Đã copy!', 'success'); };

  const handleAnalyze = async () => {
    if (!url) return showToast('Nhập link YouTube!');
    setLoading(true);
    try {
      const m = await fetchYoutubeMeta(url);
      setMeta(m);
      let prompt = `URL: ${url}\nMETADATA: Title="${m.title}", Channel="${m.author}"`;
      if (m.fullData) prompt += `\nDESCRIPTION: ${m.description}\nTAGS: ${m.tags}\nSTATS: ${m.viewCount} views, ${m.likeCount} likes.`;
      prompt += `\nANALYZE MOTIVATIONAL CONTENT based on this metadata.`;
      const data = await callAI(prompt, SYSTEM_PROMPT_IQ160_SPY);
      setResult(data);
    } catch (e: any) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const tierColor = (t: string) => {
    const s = (t || '').toLowerCase();
    if (s.includes('premium')) return 'bg-green-900/20 border-green-500/30 text-green-300';
    if (s.includes('high')) return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300';
    return 'bg-red-900/20 border-red-500/30 text-red-300';
  };
  const impactColor = (i: string) => {
    const s = (i || '').toLowerCase();
    if (s.includes('high')) return 'text-red-400 font-bold';
    if (s.includes('medium')) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[slideIn_0.4s_ease-out]">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-brands fa-youtube text-red-500" /> Phân Tích Kênh Truyền Cảm Hứng
        </h2>
        <div className="flex gap-2 mb-4">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Dán link Video/Kênh motivation..."
            className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500/50 placeholder-white/20" />
          <button onClick={() => { setUrl(''); setResult(null); setMeta(null); }} className="p-3 bg-[#1a1a1a] rounded-xl hover:bg-[#252525] border border-white/5">
            <i className="fa-solid fa-trash text-slate-400" />
          </button>
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          className="w-full py-4 bg-orange-900/40 hover:bg-orange-800/40 border border-orange-500/30 text-orange-100 font-bold rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {loading ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG QUÉT...</> : <><i className="fa-solid fa-eye" /> PHÂN TÍCH INSIGHT</>}
        </button>
      </div>

      {meta && result && (
        <div className="space-y-6 pb-10">
          <div className="bg-[#0f0f11] border border-white/10 p-4 rounded-xl flex gap-4 items-start flex-col sm:flex-row shadow-lg">
            {meta.thumb && <img src={meta.thumb} className="w-full sm:w-48 rounded-lg shadow-lg border border-white/10 object-cover aspect-video" />}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white leading-tight mb-2">{meta.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1 text-orange-200"><i className="fa-solid fa-user" /> {meta.author}</span>
                {meta.fullData && <span className="flex items-center gap-1 text-green-200"><i className="fa-solid fa-eye" /> {meta.viewCount} views</span>}
              </div>
            </div>
          </div>

          {result.revenue_analysis && (
            <div className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-xl p-5">
              <h4 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2 uppercase"><i className="fa-solid fa-dollar-sign" /> 💰 REVENUE ANALYSIS</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                {['estimated_cpm', 'estimated_rpm', 'total_estimated_earnings'].map(k => (
                  <div key={k} className="bg-black/30 p-3 rounded border border-green-500/10">
                    <div className="text-[10px] text-green-300 mb-1">{k.replace(/_/g, ' ').replace(/estimated /i, '')}</div>
                    <div className={`text-lg font-bold ${k.includes('earnings') ? 'text-green-400' : 'text-white'}`}>{result.revenue_analysis[k] || 'N/A'}</div>
                  </div>
                ))}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${tierColor(result.revenue_analysis.monetization_tier)}`}>{result.revenue_analysis.monetization_tier}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(result.strengths) && result.strengths.length > 0 && (
              <div className="bg-[#0f0f11] p-5 rounded-xl border border-orange-500/20">
                <h4 className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2"><i className="fa-solid fa-check-circle" /> ⚡ STRENGTHS</h4>
                <div className="space-y-3">
                  {result.strengths.map((s: any, i: number) => (
                    <div key={i} className="bg-orange-900/10 p-3 rounded border border-orange-500/20">
                      <div className="text-xs text-white font-medium mb-1">{s.point}</div>
                      <div className="text-[10px]"><span className="text-slate-500">Impact:</span> <span className={impactColor(s.impact)}>{s.impact}</span></div>
                      {s.evidence && <div className="text-[10px] text-slate-400 mt-1 italic">💡 {s.evidence}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(result.weaknesses) && result.weaknesses.length > 0 && (
              <div className="bg-[#0f0f11] p-5 rounded-xl border border-red-500/20">
                <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2"><i className="fa-solid fa-exclamation-triangle" /> ⚠️ WEAKNESSES</h4>
                <div className="space-y-3">
                  {result.weaknesses.map((w: any, i: number) => (
                    <div key={i} className="bg-red-900/10 p-3 rounded border border-red-500/20">
                      <div className="text-xs text-white font-medium mb-1">{w.point}</div>
                      <div className="text-[10px]"><span className="text-slate-500">Impact:</span> <span className={impactColor(w.impact)}>{w.impact}</span></div>
                      {w.fix && <div className="text-[10px] text-green-300 bg-green-900/10 p-2 rounded border border-green-500/20 mt-2">✅ Fix: {w.fix}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {result.audio_strategy && (
            <div className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-xl p-5">
              <h4 className="text-sm font-bold text-purple-400 mb-4 uppercase"><i className="fa-solid fa-music" /> 🎵 AUDIO STRATEGY</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['voice_analysis', 'music_style', 'hook_sounds'].map(k => (
                  <div key={k} className="bg-black/30 p-3 rounded border border-purple-500/10">
                    <div className="text-[10px] text-purple-300 mb-1 font-bold">{k.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-300">{result.audio_strategy[k] || 'N/A'}</div>
                  </div>
                ))}
                <div className="bg-black/30 p-3 rounded border border-purple-500/10">
                  <div className="text-[10px] text-purple-300 mb-1 font-bold">Sound Effects</div>
                  <div className="flex flex-wrap gap-1">{Array.isArray(result.audio_strategy.sound_effects) ? result.audio_strategy.sound_effects.map((s: string, i: number) => <span key={i} className="bg-purple-900/20 text-purple-300 px-2 py-0.5 rounded text-[10px] border border-purple-500/20">{s}</span>) : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {result.engagement_signals && (
            <div className="bg-gradient-to-br from-cyan-900/10 to-blue-900/10 border border-cyan-500/20 rounded-xl p-5">
              <h4 className="text-sm font-bold text-cyan-400 mb-4 uppercase"><i className="fa-solid fa-chart-line" /> 📊 ENGAGEMENT</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(result.engagement_signals).map(([k, v]) => (
                  <div key={k} className="bg-black/30 p-3 rounded border border-cyan-500/10 text-center">
                    <div className="text-[10px] text-cyan-300 mb-1">{k.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold text-white">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.hook_timeline) && result.hook_timeline.length > 0 && (
            <div className="bg-gradient-to-br from-orange-900/10 to-red-900/10 border border-orange-500/20 rounded-xl p-5">
              <h4 className="text-sm font-bold text-orange-400 mb-4 uppercase"><i className="fa-solid fa-clock" /> 🎯 HOOK TIMELINE</h4>
              <div className="space-y-3">
                {result.hook_timeline.map((h: any, i: number) => (
                  <div key={i} className="bg-black/30 p-3 rounded border border-orange-500/10 flex items-start gap-3">
                    <div className="bg-orange-900/30 text-orange-300 px-2 py-1 rounded text-[10px] font-bold border border-orange-500/20 shrink-0">{h.timestamp}</div>
                    <div><div className="text-xs font-bold text-white mb-1">{h.hook_type}</div><div className="text-[10px] text-slate-400">{h.description}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(result.viral_suggestions) && result.viral_suggestions.length > 0 && (
            <div className="bg-gradient-to-r from-green-900/5 to-emerald-900/5 p-5 rounded-xl border border-green-500/20">
              <h3 className="text-sm font-bold text-green-400 mb-4 uppercase"><i className="fa-solid fa-lightbulb" /> VIRAL TITLES</h3>
              <div className="space-y-3">
                {result.viral_suggestions.map((idea: any, idx: number) => (
                  <div key={idx} className="bg-[#0f0f11]/80 p-4 rounded-lg border border-white/5 hover:border-green-500/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-green-900/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded border border-green-500/20 font-bold">OPTION {idx + 1}</span>
                        <h4 className="text-sm font-bold text-white">{idea.hook_title}</h4>
                      </div>
                      <div className="text-xs text-slate-400 pl-1 border-l-2 border-slate-700">💡 {idea.outline_idea}</div>
                    </div>
                    <button onClick={() => onUseStrategy?.(idea.hook_title)} className="shrink-0 bg-green-900/30 hover:bg-green-800/40 text-green-300 border border-green-500/30 px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all hover:scale-105">
                      <i className="fa-solid fa-bolt" /> KÍCH HOẠT
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpyModule;