import React, { useState } from 'react';
import { callAI } from '../services/aiService';
import { SYSTEM_PROMPT_SCRIPT_WRITER } from '../data/prompts';
import { TARGET_MARKETS, VISUAL_STYLES, SECONDS_PER_SCENE } from '../data/constants';
import { showToast } from '../components/Toast';

interface Props { onScriptGenerated: (segments: any[], style: string) => void; initialTopic?: string; }

const ScriptModule: React.FC<Props> = ({ onScriptGenerated, initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [duration, setDuration] = useState(1);
  const [market, setMarket] = useState('vn_motivation');
  const [style, setStyle] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);

  React.useEffect(() => { if (initialTopic) setTopic(initialTopic); }, [initialTopic]);

  const scenes = Math.ceil((Math.max(0.1, duration) * 60) / SECONDS_PER_SCENE);
  const mode = duration < 3 ? { name: '🟢 DAILY SPARK (<3m)', wpm: 130 } : duration <= 10 ? { name: '🔵 GROWTH GUIDE (3-10m)', wpm: 140 } : { name: '🟣 TRANSFORMATION SAGA (>10m)', wpm: 120 };
  const words = Math.floor(duration * mode.wpm);
  const modeColor = duration < 3 ? 'text-green-400 border-green-500/50 bg-green-900/10' : duration <= 10 ? 'text-blue-400 border-blue-500/50 bg-blue-900/10' : 'text-purple-400 border-purple-500/50 bg-purple-900/10';

  const handleGenerate = async () => {
    if (!topic) return showToast('Nhập chủ đề!');
    setLoading(true);
    try {
      const styleObj = VISUAL_STYLES.find(s => s.id === style);
      const mk = TARGET_MARKETS[market] || TARGET_MARKETS['vn_motivation'];
      const prompt = `TOPIC: "${topic}"\nDURATION: ${duration}m\nSCENE_COUNT: ${scenes}\nTARGET_LANGUAGE: ${mk.voice_lang}\nTARGET_MARKET: ${mk.name}\nVISUAL_STYLE: ${styleObj?.name || 'Auto'}\nGENERATE JSON OBJECT.`;
      const json = await callAI(prompt, SYSTEM_PROMPT_SCRIPT_WRITER);
      let segs = json.script || (Array.isArray(json) ? json : []);
      let enforce = '';
      if (styleObj && styleObj.id !== 'auto') enforce = styleObj.prompt_enforce;
      else if (json.suggested_style) enforce = `, Visual Style: ${json.suggested_style}`;
      if (enforce) {
        segs = segs.map((s: any) => ({
          ...s,
          video_prompt: s.video_prompt?.includes('Visual Style:') ? s.video_prompt : `${s.video_prompt} ${enforce}`,
          image_prompt: s.image_prompt?.includes('Visual Style:') ? s.image_prompt : `${s.image_prompt} ${enforce}`,
        }));
      }
      setSegments(segs);
      onScriptGenerated(segs, json.suggested_style || '');
    } catch (e: any) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const copyAll = () => {
    const text = segments.map(s => s.chapter_voice_block || s.voice_text).join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('✅ Đã copy voice toàn bộ!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[slideIn_0.4s_ease-out]">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><i className="fa-solid fa-feather-alt text-orange-500" /> Soạn Kịch Bản Truyền Cảm Hứng</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Chủ Đề</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500/50 placeholder-white/20" placeholder="VD: Hành trình từ thất bại đến thành công của Elon Musk..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#151515] border border-white/5 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 block flex items-center gap-2"><i className="fa-solid fa-clock text-orange-400" /> THỜI LƯỢNG (PHÚT)</label>
              <div className="flex items-center gap-5">
                <input type="number" value={duration} step={0.5} onChange={e => setDuration(parseFloat(e.target.value) || 1)} className="w-20 bg-black border border-white/10 rounded-lg p-3 text-2xl font-black text-white text-center outline-none" />
                <div className="flex flex-col gap-1.5 text-xs">
                  <div><span className="text-slate-500">Số cảnh:</span> <span className="font-bold text-green-400 text-base">~{scenes} Cảnh</span></div>
                  <div><span className="text-slate-500">Voice:</span> <span className="font-bold text-purple-400 text-base">~{words} từ</span></div>
                </div>
              </div>
            </div>
            <div className="bg-[#151515] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2"><i className="fa-solid fa-globe text-orange-400" /> THỊ TRƯỜNG</label>
              <select value={market} onChange={e => setMarket(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none cursor-pointer">
                {Object.values(TARGET_MARKETS).map(m => <option key={m.id} value={m.id}>{m.flag} {m.name}</option>)}
              </select>
            </div>
          </div>
          <div className={`border rounded-xl p-4 transition-all ${modeColor}`}>
            <div className="font-bold">{mode.name}</div>
          </div>
          <div className="bg-[#151515] border border-white/5 rounded-xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block flex items-center gap-2"><i className="fa-solid fa-palette text-pink-400" /> PHONG CÁCH VISUAL</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {VISUAL_STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className={`text-[10px] p-2 rounded border text-left transition-all ${style === s.id ? 'bg-orange-900/30 border-orange-500/50 text-white shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-[#1a1a1a] border-white/5 text-slate-400 hover:bg-[#252525]'}`}>
                  <div className="font-bold mb-0.5">{s.name}</div>
                  <div className="text-[9px] opacity-70 truncate">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="w-full py-4 bg-orange-900/50 hover:bg-orange-800/50 border border-orange-500/30 text-orange-100 font-bold rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50">
            {loading ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG VIẾT...</> : <><i className="fa-solid fa-pen-nib" /> KIẾN TẠO KỊCH BẢN</>}
          </button>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="space-y-4 pb-10">
          <div className="flex justify-between items-center px-2">
            <div className="text-xs text-slate-500 font-bold">Đã tạo: {segments.length} phân đoạn</div>
            <button onClick={copyAll} className="text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 bg-white text-black hover:bg-slate-200"><i className="fa-solid fa-copy" /> Copy Voice Toàn Bộ</button>
          </div>
          {segments.map((seg, idx) => (
            <div key={idx} className="bg-[#0f0f11] border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row gap-4 hover:border-orange-500/30 transition-colors relative">
              <div className="w-full sm:w-24 shrink-0 text-center pt-1 border-r border-white/5 pr-2">
                <div className="text-[10px] bg-[#1a1a1a] px-2 py-1 rounded font-bold text-white mb-1">SCENE {seg.scene_number || idx + 1}</div>
                <div className="text-[9px] text-slate-500 font-mono mb-1">{seg.time}</div>
                <div className="text-[9px] text-orange-400 font-bold uppercase break-words">{seg.section}</div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#151515]/50 p-3 rounded border border-white/5">
                  <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mb-1"><i className="fa-solid fa-eye" /> VISUAL</div>
                  <p className="text-xs text-slate-300 mb-2">{seg.visual_desc_vi || seg.visual_desc}</p>
                  {seg.strategy_note && <div className="mt-2 p-2 rounded bg-yellow-900/10 border border-yellow-500/20 text-[10px] text-yellow-200/80 italic">💡 {seg.strategy_note}</div>}
                </div>
                <div className="bg-[#151515]/50 p-3 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] text-orange-400 font-bold flex items-center gap-1"><i className="fa-solid fa-microphone-alt" /> VOICE</div>
                    <button onClick={() => { navigator.clipboard.writeText(seg.voice_text || ''); showToast('✅ Copied!', 'success'); }} className="text-slate-500 hover:text-white"><i className="fa-regular fa-copy" /></button>
                  </div>
                  <p className="text-sm text-orange-100 font-medium italic leading-relaxed text-justify">"{seg.chapter_voice_block || seg.voice_text || '(Đọc tiếp...)'}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScriptModule;