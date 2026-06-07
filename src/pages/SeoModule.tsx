import React, { useState } from 'react';
import { callAI } from '../services/aiService';
import { SYSTEM_PROMPT_SEO_MASTER } from '../data/prompts';
import { TARGET_MARKETS } from '../data/constants';
import { showToast } from '../components/Toast';

interface Props { market?: string; initialTopic?: string; }

// ── Export SEO to .txt ────────────────────────────────────────────────────────
function buildSeoTxt(result: any, topic: string, channelName: string): string {
  const lines: string[] = [];
  const sep = '═'.repeat(60);
  const now = new Date().toLocaleString('vi-VN');

  lines.push(sep);
  lines.push(`  📊 BỘ SEO CHUẨN — XUẤT TỪ TUAI MASTER`);
  if (channelName) lines.push(`  Kênh: ${channelName}`);
  lines.push(`  Chủ đề: ${topic}`);
  lines.push(`  Ngày tạo: ${now}`);
  lines.push(sep);
  lines.push('');

  // A/B Test Titles
  if (Array.isArray(result.viral_titles) && result.viral_titles.length) {
    lines.push('⚡ VIRAL TITLES (A/B TEST)');
    lines.push('─'.repeat(40));
    result.viral_titles.forEach((t: string, i: number) => {
      const label = `[${String.fromCharCode(65 + i)}]`;
      lines.push(`  ${label} ${t}`);
    });
    lines.push('');
  }

  // Tags (comma separated)
  if (result.keywords) {
    lines.push('🔑 TAGS (copy trực tiếp vào YouTube)');
    lines.push('─'.repeat(40));
    const allTags: string[] = [];
    ['primary', 'secondary', 'long_tail'].forEach(type => {
      if (Array.isArray(result.keywords[type])) allTags.push(...result.keywords[type]);
    });
    lines.push(allTags.join(', '));
    lines.push('');
  }

  // Hashtags
  if (Array.isArray(result.hashtags) && result.hashtags.length) {
    lines.push('#️⃣ HASHTAGS');
    lines.push('─'.repeat(40));
    lines.push(result.hashtags.join(' '));
    lines.push('');
  }

  // Description
  if (result.video_description) {
    lines.push('📝 MÔ TẢ VIDEO (DESCRIPTION)');
    lines.push('─'.repeat(40));
    if (result.video_description.hook) {
      lines.push(`[HOOK] ${result.video_description.hook}`);
      lines.push('');
    }
    if (result.video_description.full_description) {
      lines.push(result.video_description.full_description);
      lines.push('');
    }
    if (Array.isArray(result.video_description.timestamps) && result.video_description.timestamps.length) {
      lines.push('⏱️ TIMESTAMPS:');
      result.video_description.timestamps.forEach((ts: any) => {
        lines.push(`  ${ts.time} — ${ts.label}`);
      });
      lines.push('');
    }
  }

  // Thumbnail
  if (result.thumbnail_strategy) {
    lines.push('🖼️ THUMBNAIL STRATEGY');
    lines.push('─'.repeat(40));
    const ts = result.thumbnail_strategy;
    if (ts.visual_concept) lines.push(`  Visual: ${ts.visual_concept}`);
    if (ts.text_on_image) lines.push(`  Text trên ảnh: ${ts.text_on_image}`);
    if (ts.color_psychology) lines.push(`  Tâm lý màu: ${ts.color_psychology}`);
    if (ts.ai_image_prompt) lines.push(`  AI Prompt: ${ts.ai_image_prompt}`);
    lines.push('');
  }

  // Engagement
  if (result.engagement_comments) {
    lines.push('💬 ENGAGEMENT COMMENTS');
    lines.push('─'.repeat(40));
    const ec = result.engagement_comments;
    if (ec.pinned_comment) lines.push(`  📌 Pinned: ${ec.pinned_comment}`);
    if (Array.isArray(ec.discussion_starters)) {
      ec.discussion_starters.forEach((c: string, i: number) => {
        lines.push(`  💭 Câu ${i + 1}: ${c}`);
      });
    }
    if (ec.call_to_action) lines.push(`  🎯 CTA: ${ec.call_to_action}`);
    lines.push('');
  }

  lines.push(sep);
  lines.push('  Được tạo bởi TUAI MASTER — AI Content Suite');
  lines.push(sep);
  return lines.join('\n');
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────
const SeoModule: React.FC<Props> = ({ market = 'vn_motivation', initialTopic = '' }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [channelName, setChannelName] = useState(() => localStorage.getItem('seo_channel_name') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => { if (initialTopic) setTopic(initialTopic); }, [initialTopic]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); showToast('✅ Copied!', 'success'); };

  const handleGenerate = async () => {
    if (!topic) return showToast('Nhập chủ đề SEO!');
    setLoading(true);
    // Save channel name for next session
    localStorage.setItem('seo_channel_name', channelName);
    try {
      const mk = TARGET_MARKETS[market] || TARGET_MARKETS['vn_motivation'];
      const channelCtx = channelName ? `\nCHANNEL_NAME: "${channelName}" (tối ưu SEO cho kênh này)` : '';
      const prompt = `TOPIC: "${topic}"\nTARGET_LANGUAGE: ${mk.voice_lang}\nTARGET_MARKET: ${mk.name}${channelCtx}\nGENERATE JSON.`;
      const json = await callAI(prompt, SYSTEM_PROMPT_SEO_MASTER);
      setResult(json);
    } catch (e: any) { showToast(e.message); }
    finally { setLoading(false); }
  };

  const handleExportTxt = () => {
    if (!result) return showToast('Chưa có dữ liệu SEO để xuất!');
    const content = buildSeoTxt(result, topic, channelName);
    const safeName = topic.replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g, '').trim().replace(/\s+/g, '_').slice(0, 40);
    downloadTxt(content, `SEO_${safeName || 'export'}_${Date.now()}.txt`);
    showToast('✅ Đã xuất file SEO .txt!', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-[slideIn_0.4s_ease-out]">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-magnifying-glass-chart text-green-500" /> SEO Tự Động
        </h2>

        {/* ── Input area ── */}
        <div className="space-y-3 mb-6">
          {/* Channel name */}
          <div className="flex gap-3 items-center">
            <div className="bg-[#151515] border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3 flex-1">
              <i className="fa-solid fa-tv text-green-400 text-sm" />
              <input
                value={channelName}
                onChange={e => setChannelName(e.target.value)}
                className="bg-transparent text-sm text-white outline-none flex-1 placeholder-white/20"
                placeholder="Tên kênh YouTube (VD: TUAI Channel)..."
              />
            </div>
            {channelName && (
              <span className="text-[10px] text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded-full border border-green-500/20 whitespace-nowrap">
                <i className="fa-solid fa-check mr-1" />Kênh đã lưu
              </span>
            )}
          </div>

          {/* Topic + Generate */}
          <div className="flex gap-2 md:gap-4 flex-col sm:flex-row">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="flex-1 bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-green-500/50 placeholder-white/20"
              placeholder="Nhập chủ đề video..."
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-green-900/40 hover:bg-green-800/40 border border-green-500/30 text-green-100 font-bold rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {loading ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG TỐI ƯU...</> : <><i className="fa-solid fa-magic" /> Tối Ưu SEO</>}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        {!result ? (
          <div className="flex flex-col items-center justify-center text-slate-500 p-12 bg-white/5 border border-white/10 border-dashed rounded-xl">
            <i className="fa-solid fa-rocket text-2xl mb-3 opacity-30" />
            <p className="text-sm">Nhập chủ đề → SEO tự động tạo bộ chuẩn đầy đủ</p>
            <p className="text-[10px] text-slate-600 mt-1">Tags, Titles A/B, Description, Thumbnail, Hashtags, Comments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Export button */}
            <button
              onClick={handleExportTxt}
              className="w-full py-3 bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-500/30 text-emerald-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            >
              <i className="fa-solid fa-file-arrow-down" /> XUẤT FILE .TXT — BỘ SEO CHUẨN
            </button>

            {/* Grid layout for results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* A/B Titles */}
              {Array.isArray(result.viral_titles) && (
                <div className="bg-[#151515] border border-white/5 rounded-xl p-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-yellow-400 mb-3 uppercase">⚡ VIRAL TITLES — A/B TEST</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.viral_titles.map((t: string, i: number) => (
                      <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${i === 0 ? 'bg-yellow-900/10 border-yellow-500/20' : i === 1 ? 'bg-cyan-900/10 border-cyan-500/20' : 'bg-black border-white/10'}`}>
                        <span className="text-sm text-white font-medium flex-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${i === 0 ? 'bg-yellow-500/20 text-yellow-300' : i === 1 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-500/20 text-slate-300'}`}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          {t}
                        </span>
                        <button onClick={() => copy(t)} className="text-slate-500 hover:text-white ml-2"><i className="fa-solid fa-copy" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords/Tags */}
              {result.keywords && (
                <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-400 mb-3 uppercase">🔑 TAGS</h4>
                  {['primary', 'secondary', 'long_tail'].map(type => Array.isArray(result.keywords[type]) && (
                    <div key={type} className="mb-2">
                      <div className="text-[10px] text-slate-400 mb-1 font-bold">{type}</div>
                      <div className="flex flex-wrap gap-1">
                        {result.keywords[type].map((k: string, i: number) => (
                          <span key={i} className="bg-blue-900/20 text-blue-200 px-2 py-0.5 rounded-full text-[10px] border border-blue-500/20">{k}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const allTags: string[] = [];
                      ['primary', 'secondary', 'long_tail'].forEach(t => { if (Array.isArray(result.keywords[t])) allTags.push(...result.keywords[t]); });
                      copy(allTags.join(', '));
                    }}
                    className="mt-2 text-xs text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <i className="fa-solid fa-tags" /> Copy Tags (phẩy phân cách)
                  </button>
                </div>
              )}

              {/* Hashtags */}
              {Array.isArray(result.hashtags) && (
                <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-purple-400 mb-3 uppercase">#️⃣ HASHTAGS</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((h: string, i: number) => (
                      <button key={i} onClick={() => copy(h)} className="bg-purple-900/20 text-purple-300 px-3 py-1 rounded-lg text-sm border border-purple-500/20 hover:bg-purple-900/30">{h}</button>
                    ))}
                  </div>
                  <button onClick={() => copy(result.hashtags.join(' '))} className="mt-2 text-xs text-purple-400 hover:underline flex items-center gap-1"><i className="fa-solid fa-copy" /> Copy All</button>
                </div>
              )}

              {/* Description — full width */}
              {result.video_description?.full_description && (
                <div className="bg-green-900/10 border border-green-500/20 rounded-xl p-4 md:col-span-2">
                  <h4 className="text-xs font-bold text-green-400 mb-3 uppercase">📝 DESCRIPTION</h4>
                  {result.video_description.hook && (
                    <p className="text-sm text-white font-medium bg-green-900/20 p-3 rounded border border-green-500/20 mb-3">{result.video_description.hook}</p>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{result.video_description.full_description}</p>
                  {Array.isArray(result.video_description.timestamps) && result.video_description.timestamps.length > 0 && (
                    <div className="mt-3 bg-black/30 p-2 rounded border border-green-500/10">
                      <div className="text-[10px] text-green-400 font-bold mb-1">⏱️ TIMESTAMPS</div>
                      {result.video_description.timestamps.map((ts: any, i: number) => (
                        <div key={i} className="text-[11px] text-slate-400">{ts.time} — {ts.label}</div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => copy(result.video_description.full_description)} className="mt-2 text-xs text-green-400 hover:underline flex items-center gap-1"><i className="fa-solid fa-copy" /> Copy</button>
                </div>
              )}

              {/* Thumbnail */}
              {result.thumbnail_strategy && (
                <div className="bg-pink-900/10 border border-pink-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-pink-400 mb-3 uppercase">🖼️ THUMBNAIL</h4>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {result.thumbnail_strategy.visual_concept && <p><span className="text-pink-400 font-bold">Visual:</span> {result.thumbnail_strategy.visual_concept}</p>}
                    {result.thumbnail_strategy.text_on_image && <p><span className="text-pink-400 font-bold">Text:</span> <span className="text-white font-bold">{result.thumbnail_strategy.text_on_image}</span></p>}
                    {result.thumbnail_strategy.color_psychology && <p><span className="text-pink-400 font-bold">Màu:</span> {result.thumbnail_strategy.color_psychology}</p>}
                    {result.thumbnail_strategy.ai_image_prompt && (
                      <div className="mt-2 bg-black/50 p-2 rounded border border-pink-500/10">
                        <div className="text-[10px] text-pink-400 font-bold mb-1">AI Prompt:</div>
                        <p className="text-[11px] text-slate-400 italic">{result.thumbnail_strategy.ai_image_prompt}</p>
                        <button onClick={() => copy(result.thumbnail_strategy.ai_image_prompt)} className="mt-1 text-[10px] text-pink-400 hover:underline flex items-center gap-1"><i className="fa-solid fa-copy" /> Copy</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement */}
              {result.engagement_comments && (
                <div className="bg-orange-900/10 border border-orange-500/20 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-orange-400 mb-3 uppercase">💬 ENGAGEMENT</h4>
                  <div className="space-y-2 text-xs">
                    {result.engagement_comments.pinned_comment && (
                      <div className="bg-orange-900/20 p-2 rounded border border-orange-500/10 flex justify-between items-start">
                        <span className="text-slate-300"><span className="text-orange-400 font-bold">📌</span> {result.engagement_comments.pinned_comment}</span>
                        <button onClick={() => copy(result.engagement_comments.pinned_comment)} className="text-slate-500 hover:text-white ml-2 shrink-0"><i className="fa-solid fa-copy" /></button>
                      </div>
                    )}
                    {Array.isArray(result.engagement_comments.discussion_starters) && result.engagement_comments.discussion_starters.map((c: string, i: number) => (
                      <div key={i} className="bg-black/30 p-2 rounded border border-white/5 flex justify-between items-start">
                        <span className="text-slate-400">💭 {c}</span>
                        <button onClick={() => copy(c)} className="text-slate-500 hover:text-white ml-2 shrink-0"><i className="fa-solid fa-copy" /></button>
                      </div>
                    ))}
                    {result.engagement_comments.call_to_action && (
                      <div className="bg-orange-900/20 p-2 rounded border border-orange-500/10 flex justify-between items-start">
                        <span className="text-slate-300"><span className="text-orange-400 font-bold">🎯</span> {result.engagement_comments.call_to_action}</span>
                        <button onClick={() => copy(result.engagement_comments.call_to_action)} className="text-slate-500 hover:text-white ml-2 shrink-0"><i className="fa-solid fa-copy" /></button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoModule;
