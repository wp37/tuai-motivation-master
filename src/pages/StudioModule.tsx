import React, { useState } from 'react';
import { generateImage } from '../services/aiService';
import { showToast } from '../components/Toast';

interface Props { segments: any[]; }

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

const StudioModule: React.FC<Props> = ({ segments }) => {
  const [mode, setMode] = useState<'video' | 'image'>('video');
  const [media, setMedia] = useState<Record<string, string>>({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);
  const [showExport, setShowExport] = useState(false);

  const copy = (t: string) => { navigator.clipboard.writeText(t); showToast('✅ Copied!', 'success'); };

  const genMedia = async (idx: number) => {
    if (loadingIdx !== null) return;
    setLoadingIdx(idx);
    try {
      const seg = segments[idx];
      let prompt = mode === 'video' ? seg.video_prompt : seg.image_prompt;
      prompt += mode === 'video' ? ', 8k, cinematic lighting --no text' : ', masterpiece, 8k';
      const result = await generateImage(prompt, mode === 'video' ? '16:9' : '1:1');
      if (result) { setMedia(prev => ({ ...prev, [`${idx}_${mode}`]: result })); }
      else showToast('Lỗi Safety/API. Thử prompt khác.');
    } catch (e: any) { showToast(e.message); }
    finally { setLoadingIdx(null); }
  };

  const exportCSV = () => {
    if (!segments.length) return;
    let csv = '\uFEFFScene,Time,Section,Character,Voice,Video Prompt,Image Prompt\n';
    segments.forEach((s, i) => {
      const timeStr = s.time || '';
      const secStr = s.section || '';
      const charStr = s.character || '';
      const voiceStr = s.chapter_voice_block || s.voice_text || '';
      const videoStr = s.video_prompt || '';
      const imageStr = s.image_prompt || '';
      csv += `${i + 1},"${timeStr.replace(/"/g, '""')}","${secStr.replace(/"/g, '""')}","${charStr.replace(/"/g, '""')}","${voiceStr.replace(/"/g, '""')}","${videoStr.replace(/"/g, '""')}","${imageStr.replace(/"/g, '""')}"\n`;
    });
    downloadFile(csv, `kich_ban_full_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    setShowExport(false);
  };

  const exportPrompts = (type: 'video' | 'image', format: 'csv' | 'txt') => {
    if (!segments.length) return;
    if (format === 'csv') {
      let csv = `\uFEFFScene,${type === 'video' ? 'Video' : 'Image'} Prompt\n`;
      segments.forEach((s, i) => { csv += `${i + 1},"${((type === 'video' ? s.video_prompt : s.image_prompt) || '').replace(/"/g, '""')}"\n`; });
      downloadFile(csv, `prompts_${type}_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
    } else {
      const content = segments.map(s => (type === 'video' ? s.video_prompt : s.image_prompt) || '').filter(Boolean).join('\n\n');
      downloadFile(content, `prompts_${type}_${Date.now()}.txt`, 'text/plain;charset=utf-8;');
    }
    setShowExport(false);
  };

  if (!segments.length) return (
    <div className="h-full flex flex-col items-center justify-center animate-[slideIn_0.4s_ease-out]">
      <div className="text-center text-slate-500 py-10 italic">Chưa có dữ liệu kịch bản. Hãy tạo kịch bản trước.</div>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-[slideIn_0.4s_ease-out]">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><i className="fa-solid fa-clapperboard text-cyan-500" /> Studio Sáng Tạo</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#1a1a1a] rounded p-1 border border-white/5">
            <button onClick={() => setMode('video')} className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors ${mode === 'video' ? 'bg-cyan-900/50 text-cyan-100 shadow' : 'text-slate-400 hover:text-white'}`}><i className="fa-solid fa-video" /> VIDEO</button>
            <button onClick={() => setMode('image')} className={`px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors ${mode === 'image' ? 'bg-purple-900/50 text-purple-100 shadow' : 'text-slate-400 hover:text-white'}`}><i className="fa-solid fa-image" /> ẢNH</button>
          </div>
          <div className="relative">
            <button onClick={() => setShowExport(!showExport)} className="px-4 py-1.5 rounded text-xs font-bold flex items-center gap-2 bg-green-900/40 text-green-300 hover:bg-green-800/50 border border-green-500/20"><i className="fa-solid fa-download" /> Tải <i className="fa-solid fa-chevron-down text-[10px]" /></button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                <button onClick={exportCSV} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><i className="fa-solid fa-file-excel text-green-500" /> Excel Kịch Bản</button>
                <button onClick={() => exportPrompts('video', 'csv')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><i className="fa-solid fa-file-video text-cyan-500" /> Excel Prompt Video</button>
                <button onClick={() => exportPrompts('image', 'csv')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><i className="fa-solid fa-file-image text-purple-500" /> Excel Prompt Ảnh</button>
                <button onClick={() => exportPrompts('video', 'txt')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 border-b border-white/5 flex items-center gap-2"><i className="fa-regular fa-file-lines text-cyan-500" /> TXT Prompt Video</button>
                <button onClick={() => exportPrompts('image', 'txt')} className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2"><i className="fa-regular fa-file-lines text-purple-500" /> TXT Prompt Ảnh</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-10">
        {segments.map((seg, idx) => {
          const prompt = mode === 'video' ? seg.video_prompt : seg.image_prompt;
          const result = media[`${idx}_${mode}`];
          return (
            <div key={idx} className="bg-[#0f0f11] border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row gap-4 items-start hover:border-white/20 transition-colors">
              <div className={`px-3 py-1.5 rounded text-xs font-bold text-white h-fit shadow-lg ${mode === 'video' ? 'bg-cyan-900/50' : 'bg-purple-900/50'}`}>SCENE {idx + 1}</div>
              <div className="flex-1 w-full">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{mode === 'video' ? '🎬 VIDEO PROMPT' : '🖼️ IMAGE PROMPT'}</div>
                <div className="relative group">
                  <p className="text-xs text-slate-300 font-mono mb-3 bg-black/50 p-3 rounded border border-white/5 leading-relaxed pr-10">{prompt || 'No prompt'}</p>
                  <button onClick={() => copy(prompt || '')} className="absolute top-2 right-2 p-1.5 bg-[#1a1a1a] text-slate-300 rounded hover:bg-blue-900/50 hover:text-white border border-white/5"><i className="fa-solid fa-copy" /></button>
                </div>
                <button onClick={() => genMedia(idx)} disabled={loadingIdx !== null}
                  className={`px-3 py-1.5 rounded border text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 ${mode === 'video' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/20' : 'bg-purple-900/20 text-purple-400 border-purple-500/20'}`}>
                  {loadingIdx === idx ? <><i className="fa-solid fa-sync animate-spin" /> Đang tạo...</> : <><i className="fa-solid fa-magic" /> Tạo {mode === 'video' ? 'Video' : 'Ảnh'}</>}
                </button>
              </div>
              <div className={`w-full sm:w-64 bg-black rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center ${mode === 'video' ? 'aspect-video' : 'aspect-square'}`}>
                {result ? (
                  <div className="relative group w-full h-full">
                    <img src={result} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={result} download={`scene_${idx}.png`} className="px-3 py-1.5 bg-white text-black rounded text-xs font-bold flex items-center gap-1"><i className="fa-solid fa-cloud-download-alt" /> Tải</a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4"><i className={`fa-solid ${mode === 'video' ? 'fa-film' : 'fa-image'} text-2xl mb-2 opacity-50`} /><div className="text-[10px] text-slate-500">Chưa có dữ liệu</div></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudioModule;