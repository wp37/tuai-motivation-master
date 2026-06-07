import React, { useState, useEffect } from 'react';
import { callAI, callAIBatched, BATCH_CONFIG } from '../services/aiService';
import type { BatchError } from '../services/aiService';
import { SYSTEM_PROMPT_SCRIPT_WRITER, STYLE_RECOMMENDATION_PROMPT } from '../data/prompts';
import { TARGET_MARKETS, VISUAL_STYLES, MODE_OPTIONS } from '../data/constants';
import { showToast } from '../components/Toast';

interface Props {
  onScriptGenerated: (segments: any[], style: string, topic?: string, market?: string) => void;
  initialTopic?: string;
}

// ── Scene count logic (same as before) ────────────────────────────────────────
function calculateScenes(dur: number): number {
  const d = Math.max(0.1, dur);
  if (d <= 1)  return Math.ceil((d * 60) / 10);
  if (d <= 3)  return Math.ceil((d * 60) / 15);
  if (d <= 5)  return Math.ceil((d * 60) / 20);
  if (d <= 10) return Math.ceil((d * 60) / 30);
  return Math.min(25, Math.ceil((d * 60) / 40));
}

// ── Batch prompt builder ───────────────────────────────────────────────────────
// Mỗi batch call nhận ĐẦY ĐỦ context để AI giữ giọng kể xuyên suốt.
//
// Chiến lược giữ nhất quán giọng:
// 1. Truyền "voice_fingerprint" — trích 2-3 câu voice_text từ batch trước
//    để AI bắt chước cách dùng từ, nhịp câu, cảm xúc.
// 2. Chỉ rõ narrative arc position — batch này nằm ở phần nào của câu chuyện.
// 3. Lock character continuity — nhắc lại nhân vật & bối cảnh.
//
function buildBatchPrompt(
  batchIdx:    number,
  startScene:  number,
  endScene:    number,
  totalScenes: number,
  topic:       string,
  duration:    number,
  market:      string,
  styleName:   string,
  prevContext: BatchContext,
): string {
  const isContinuation = batchIdx > 0;

  // Xác định vị trí trong narrative arc
  const progressPct = Math.round((startScene / totalScenes) * 100);
  const arcPosition =
    progressPct < 20  ? 'OPENING — Gây tò mò, đặt vấn đề, kéo người xem vào câu chuyện' :
    progressPct < 40  ? 'RISING — Đẩy cảm xúc lên, kể khó khăn, thử thách' :
    progressPct < 70  ? 'CLIMAX — Cao trào cảm xúc, bước ngoặt, khoảnh khắc thay đổi' :
    progressPct < 90  ? 'RESOLUTION — Bài học, hành động, hy vọng' :
                        'CLOSING — Khép lại đầy cảm hứng, call-to-action';

  // Phần continuity chỉ xuất hiện từ batch thứ 2
  const continuityBlock = isContinuation ? `
═══════════════════════════════════════════════════════
GIỮ NHẤT QUÁN GIỌNG KỂ (BẮT BUỘC):

GIỌNG MẪU TỪ BATCH TRƯỚC (voice_fingerprint):
"""
${prevContext.voiceFingerprint}
"""

→ Tiếp tục CHÍNH XÁC giọng kể này: cùng cách xưng hô, cùng nhịp câu,
  cùng mức độ cảm xúc, cùng cách dùng từ (ví dụ: nếu trước đó dùng "bạn"
  thì tiếp tục "bạn", nếu dùng giọng trầm thì giữ trầm).

PHÂN ĐOẠN CUỐI TRƯỚC ĐÓ:
  Scene ${prevContext.lastSceneNumber}: [${prevContext.lastSection}]
  Kết thúc bằng: "${prevContext.lastVoiceEnding}"

→ Câu voice_text đầu tiên của batch này PHẢI nối tự nhiên với câu trên.
  KHÔNG được nhảy giọng, KHÔNG mở đầu lại từ đầu, KHÔNG thay đổi tone.
═══════════════════════════════════════════════════════` : '';

  return [
    `TOPIC: "${topic}"`,
    `TOTAL_DURATION: ${duration}m | TOTAL_SCENES: ${totalScenes}`,
    `THIS_BATCH: Scenes ${startScene}→${endScene} (${endScene - startScene + 1} scenes)`,
    `NARRATIVE_ARC_POSITION: ${arcPosition} (${progressPct}% tiến trình)`,
    `TARGET_LANGUAGE: ${market}`,
    `VISUAL_STYLE: ${styleName}`,
    continuityBlock,
    ``,
    `OUTPUT RULES:`,
    `- Return JSON: { "script": [ ...scenes... ] }`,
    `- scene_number: ${startScene} → ${endScene} (KHÔNG scene ngoài range này)`,
    `- Mỗi scene BẮT BUỘC có: scene_number, time, section, voice_text, visual_desc_vi, video_prompt, image_prompt`,
    `- voice_text viết bằng ${market === 'English' ? 'English' : 'tiếng Việt'}`,
    `- video_prompt & image_prompt LUÔN viết bằng English`,
    `- GIỮ NGUYÊN giọng kể xuyên suốt — đây là 1 câu chuyện liền mạch, KHÔNG phải nhiều video riêng lẻ`,
  ].join('\n');
}

// ── Types cho batch context ──────────────────────────────────────────────────
interface BatchContext {
  voiceFingerprint: string;   // 2-3 câu voice_text mẫu → AI copy giọng
  lastSceneNumber:  number;
  lastSection:      string;
  lastVoiceEnding:  string;   // 30 ký tự cuối voice_text → nối câu tự nhiên
}

const EMPTY_CONTEXT: BatchContext = {
  voiceFingerprint: '', lastSceneNumber: 0, lastSection: '', lastVoiceEnding: '',
};

// ── Trích xuất context từ scenes đã tạo ──────────────────────────────────────
// Lấy "dấu vân tay giọng kể" — 2-3 câu voice_text ở các vị trí khác nhau
// để AI hiểu pattern: cách mở đầu, cách chuyển đoạn, cách kết thúc.
function extractBatchContext(scenes: any[]): BatchContext {
  if (!scenes.length) return EMPTY_CONTEXT;

  // Lấy voice_text từ 3 vị trí: đầu, giữa, cuối batch trước
  const samples: string[] = [];
  const positions = [0, Math.floor(scenes.length / 2), scenes.length - 1];
  for (const pos of positions) {
    const voice = scenes[pos]?.voice_text || scenes[pos]?.chapter_voice_block;
    if (voice && !samples.includes(voice)) samples.push(voice);
  }

  const last = scenes[scenes.length - 1];
  const lastVoice = String(last.voice_text || last.chapter_voice_block || '');

  return {
    voiceFingerprint: samples.join('\n'),
    lastSceneNumber:  last.scene_number || scenes.length,
    lastSection:      last.section || '',
    lastVoiceEnding:  lastVoice.slice(-60),
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
const ScriptModule: React.FC<Props> = ({ onScriptGenerated, initialTopic = '' }) => {
  const [topic,          setTopic]          = useState(initialTopic);
  const [duration,       setDuration]       = useState(1);
  const [market,         setMarket]         = useState('vn_motivation');
  const [style,          setStyle]          = useState('auto');
  const [loading,        setLoading]        = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [segments,       setSegments]       = useState<any[]>([]);

  // 🆕 Batch progress + resume state
  const [batchProgress,  setBatchProgress]  = useState<{ done: number; total: number } | null>(null);
  const [lastBatchError, setLastBatchError] = useState<BatchError | null>(null);
  const [resumeFromScene, setResumeFromScene] = useState<number>(0);

  // Derived values
  const scenes        = calculateScenes(duration);
  const totalBatches  = Math.ceil(scenes / BATCH_CONFIG.maxScenesPerBatch);
  const isBatched     = totalBatches > 1;
  const modeWpm       = duration < 3 ? 130 : duration <= 10 ? 140 : 120;
  const words         = Math.floor(duration * modeWpm);
  const currentModeId = duration < 3 ? 'quick' : duration <= 10 ? 'story' : 'deep';
  const currentMode   = MODE_OPTIONS.find(m => m.id === currentModeId) || MODE_OPTIONS[0];

  useEffect(() => {
    if (initialTopic) { setTopic(initialTopic); }
    else {
      const t = localStorage.getItem('motivation_last_script_topic');
      if (t) setTopic(t);
    }
    try {
      const s = localStorage.getItem('motivation_last_script_segments');
      if (s) setSegments(JSON.parse(s));
    } catch { /* ignore */ }
    const savedStyle  = localStorage.getItem('motivation_last_script_style');
    if (savedStyle)  setStyle(savedStyle);
    const savedMarket = localStorage.getItem('motivation_last_script_market');
    if (savedMarket) setMarket(savedMarket);
  }, [initialTopic]);

  const handleStyleRecommend = async () => {
    if (!topic) return showToast('Nhập chủ đề trước để AI phân tích!');
    setIsRecommending(true);
    try {
      const result = await callAI(`Chủ đề: "${topic}"`, STYLE_RECOMMENDATION_PROMPT);
      if (result?.primary_style) {
        setStyle(result.primary_style);
        showToast(`AI Đề Xuất: ${result.primary_reason}`, 'success');
      }
    } catch (e: any) { showToast(e.message); }
    finally { setIsRecommending(false); }
  };

  const handleGenerate = async (isResume = false) => {
    if (!topic) return showToast('Nhập chủ đề!');
    setLoading(true);
    setBatchProgress(null);
    setLastBatchError(null);

    const existingSegs = isResume ? [...segments] : [];
    if (!isResume) setSegments([]);

    try {
      const styleObj  = VISUAL_STYLES.find(s => s.id === style);
      const mk        = TARGET_MARKETS[market] || TARGET_MARKETS['vn_motivation'];
      const styleName = styleObj?.name || 'Auto';
      let   finalSegs: any[] = [];

      if (!isBatched) {
        const prompt = [
          `TOPIC: "${topic}"`,
          `DURATION: ${duration}m | SCENE_COUNT: ${scenes}`,
          `TARGET_LANGUAGE: ${mk.voice_lang}`,
          `TARGET_MARKET: ${mk.name}`,
          `VISUAL_STYLE: ${styleName}`,
          `GENERATE JSON OBJECT with "script" array.`,
        ].join('\n');

        const json = await callAI(prompt, SYSTEM_PROMPT_SCRIPT_WRITER);
        finalSegs  = json.script || (Array.isArray(json) ? json : []);

      } else {
        const resumeOffset = isResume ? resumeFromScene : 0;
        const remainingScenes = scenes - resumeOffset;
        const resumeBatchTotal = Math.ceil(remainingScenes / BATCH_CONFIG.maxScenesPerBatch);

        setBatchProgress({ done: 0, total: resumeBatchTotal });
        let prevContext: BatchContext = isResume
          ? extractBatchContext(existingSegs)
          : EMPTY_CONTEXT;

        const newSegs = await callAIBatched(
          (batchIdx, startScene, endScene, total) =>
            buildBatchPrompt(
              batchIdx, startScene + resumeOffset, endScene + resumeOffset, scenes,
              topic, duration, mk.voice_lang, styleName, prevContext,
            ),
          SYSTEM_PROMPT_SCRIPT_WRITER,
          remainingScenes,
          (batchDone, totalB, accumulated, batchError) => {
            const merged = [...existingSegs, ...accumulated];
            prevContext = extractBatchContext(merged);
            setBatchProgress({ done: batchDone, total: totalB });
            // Stream scenes vào UI ngay sau mỗi batch
            setSegments(applyStyleEnforce(merged, styleObj));

            // 🆕 Partial save after each successful batch
            const partialStyled = applyStyleEnforce(merged, styleObj);
            localStorage.setItem('motivation_last_script_segments', JSON.stringify(partialStyled));
            localStorage.setItem('motivation_last_script_topic', topic);

            // 🆕 Handle batch failure — keep partial, enable resume
            if (batchError) {
              setLastBatchError(batchError);
              setResumeFromScene(merged.length);
            }
          },
        );

        finalSegs = [...existingSegs, ...newSegs];
      }

      // Apply style enforcement
      const styled = applyStyleEnforce(finalSegs, styleObj);
      setSegments(styled);

      // Persist
      const finalStyle = styleObj?.id || 'auto';
      localStorage.setItem('motivation_last_script_topic',    topic);
      localStorage.setItem('motivation_last_script_segments', JSON.stringify(styled));
      localStorage.setItem('motivation_last_script_style',    finalStyle);
      localStorage.setItem('motivation_last_script_market',   market);

      // Check if we got all scenes or partial
      if (lastBatchError || styled.length < scenes) {
        showToast(`⚠️ Đã tạo ${styled.length}/${scenes} cảnh. Nhấn "Tiếp Tục" để hoàn thành.`, 'success');
      } else {
        setResumeFromScene(0);
        setLastBatchError(null);
        showToast(`✅ Tạo xong ${styled.length} cảnh!`, 'success');
      }

      onScriptGenerated(styled, finalStyle, topic, market);

    } catch (e: any) {
      // Even on hard crash, keep whatever segments we have
      if (segments.length > 0) {
        showToast(`❌ Lỗi: ${e.message}. Đã giữ ${segments.length} cảnh đã tạo.`);
      } else {
        showToast(e.message || 'Lỗi không xác định');
      }
    } finally {
      setLoading(false);
      setBatchProgress(null);
    }
  };

  const copyAll = () => {
    const text = segments.map(s => s.chapter_voice_block || s.voice_text).join('\n\n');
    navigator.clipboard.writeText(text);
    showToast('✅ Đã copy voice toàn bộ!', 'success');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-[#0f0f11] border border-white/10 p-6 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <i className="fa-solid fa-feather-alt text-orange-500" /> Soạn Kịch Bản Truyền Cảm Hứng
        </h2>

        <div className="space-y-4">
          {/* Topic input */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase mb-1.5 block">Chủ Đề</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500/50 placeholder-white/20"
              placeholder="VD: Hành trình từ thất bại đến thành công của Elon Musk..."
            />
          </div>

          {/* Duration + Market */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#151515] border border-white/5 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
              <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <i className="fa-solid fa-clock text-orange-400" /> THỜI LƯỢNG (PHÚT)
              </label>
              <div className="flex items-center gap-5">
                <input
                  type="number" value={duration} step={0.5} min={0.5} max={30}
                  onChange={e => setDuration(parseFloat(e.target.value) || 1)}
                  className="w-20 bg-black border border-white/10 rounded-lg p-3 text-2xl font-black text-white text-center outline-none"
                />
                <div className="flex flex-col gap-1.5 text-xs">
                  <div><span className="text-slate-500">Số cảnh:</span> <span className="font-bold text-green-400 text-base">~{scenes} Cảnh</span></div>
                  <div><span className="text-slate-500">Voice:</span> <span className="font-bold text-purple-400 text-base">~{words} từ</span></div>
                  {/* 🆕 Batch indicator */}
                  {isBatched && (
                    <div className="flex items-center gap-1 mt-1">
                      <i className="fa-solid fa-layer-group text-amber-400 text-[10px]" />
                      <span className="text-amber-400 font-bold text-[10px]">{totalBatches} batch calls</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#151515] border border-white/5 rounded-xl p-4 flex flex-col justify-center">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-2">
                <i className="fa-solid fa-globe text-orange-400" /> THỊ TRƯỜNG
              </label>
              <select
                value={market}
                onChange={e => setMarket(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white outline-none cursor-pointer"
              >
                {Object.values(TARGET_MARKETS).map(m => (
                  <option key={m.id} value={m.id}>{m.flag} {m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mode badge */}
          <div className={`border rounded-xl p-4 transition-all ${
            currentModeId === 'quick'  ? 'text-green-400  border-green-500/50  bg-green-900/10'  :
            currentModeId === 'story'  ? 'text-blue-400   border-blue-500/50   bg-blue-900/10'   :
                                         'text-purple-400 border-purple-500/50 bg-purple-900/10'
          }`}>
            <div className="font-bold">{currentMode.name}</div>
            <div className="text-xs mt-1 opacity-80">{currentMode.desc}</div>
          </div>

          {/* Visual style picker */}
          <div className="bg-[#151515] border border-white/5 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                <i className="fa-solid fa-palette text-pink-400" /> PHONG CÁCH VISUAL
              </label>
              <button
                onClick={handleStyleRecommend}
                disabled={isRecommending || !topic}
                className="text-xs bg-orange-900/50 text-orange-200 px-3 py-1 rounded hover:bg-orange-800 disabled:opacity-50"
              >
                {isRecommending
                  ? <i className="fa-solid fa-sync animate-spin" />
                  : <i className="fa-solid fa-wand-magic-sparkles" />
                } AI Đề Xuất
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {VISUAL_STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`text-[10px] p-2 rounded border text-left transition-all ${
                    style === s.id
                      ? 'bg-orange-900/30 border-orange-500/50 text-white shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                      : 'bg-[#1a1a1a] border-white/5 text-slate-400 hover:bg-[#252525]'
                  }`}
                >
                  <div className="font-bold mb-0.5">{s.name}</div>
                  <div className="text-[9px] opacity-70 truncate">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={() => handleGenerate(false)}
            disabled={loading}
            className="w-full py-4 bg-orange-900/50 hover:bg-orange-800/50 border border-orange-500/30 text-orange-100 font-bold rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading
              ? <><i className="fa-solid fa-sync animate-spin" /> ĐANG VIẾT...</>
              : <><i className="fa-solid fa-pen-nib" /> KIẾN TẠO KỊCH BẢN</>
            }
          </button>

          {/* 🆕 Resume button — appears after partial failure */}
          {!loading && lastBatchError && resumeFromScene > 0 && (
            <button
              onClick={() => handleGenerate(true)}
              className="w-full py-3 bg-amber-900/50 hover:bg-amber-800/50 border border-amber-500/40 text-amber-100 font-bold rounded-xl flex items-center justify-center gap-2 transition-all animate-pulse"
            >
              <i className="fa-solid fa-rotate-right" />
              TIẾP TỤC TỪ CẢNH {resumeFromScene + 1} ({segments.length}/{scenes} đã tạo)
            </button>
          )}

          {/* 🆕 Batch progress bar */}
          {loading && batchProgress && (
            <BatchProgressBar done={batchProgress.done} total={batchProgress.total} error={lastBatchError} />
          )}
        </div>
      </div>

      {/* Segments output */}
      {segments.length > 0 && (
        <div className="space-y-4 pb-10">
          <div className="flex justify-between items-center px-2">
            <div className="text-xs text-slate-500 font-bold">Đã tạo: {segments.length} phân đoạn</div>
            <button
              onClick={copyAll}
              className="text-xs font-bold px-3 py-1.5 rounded flex items-center gap-2 bg-white text-black hover:bg-slate-200"
            >
              <i className="fa-solid fa-copy" /> Copy Voice Toàn Bộ
            </button>
          </div>

          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="bg-[#0f0f11] border border-white/10 p-4 rounded-xl flex flex-col sm:flex-row gap-4 hover:border-orange-500/30 transition-colors"
            >
              <div className="w-full sm:w-24 shrink-0 text-center pt-1 border-r border-white/5 pr-2">
                <div className="text-[10px] bg-[#1a1a1a] px-2 py-1 rounded font-bold text-white mb-1">
                  SCENE {seg.scene_number || idx + 1}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mb-1">{seg.time}</div>
                <div className="text-[9px] text-orange-400 font-bold uppercase break-words">{seg.section}</div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#151515]/50 p-3 rounded border border-white/5">
                  <div className="text-[10px] text-blue-400 font-bold flex items-center gap-1 mb-1">
                    <i className="fa-solid fa-eye" /> VISUAL
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{seg.visual_desc_vi || seg.visual_desc}</p>
                  {seg.strategy_note && (
                    <div className="mt-2 p-2 rounded bg-yellow-900/10 border border-yellow-500/20 text-[10px] text-yellow-200/80 italic">
                      💡 {seg.strategy_note}
                    </div>
                  )}
                </div>

                <div className="bg-[#151515]/50 p-3 rounded border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
                      <i className="fa-solid fa-microphone-alt" /> VOICE
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(seg.voice_text || ''); showToast('✅ Copied!', 'success'); }}
                      className="text-slate-500 hover:text-white"
                    >
                      <i className="fa-regular fa-copy" />
                    </button>
                  </div>
                  <p className="text-sm text-orange-100 font-medium italic leading-relaxed text-justify">
                    "{seg.chapter_voice_block || seg.voice_text || '(Đọc tiếp...)'}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── 🆕 Batch progress bar component (with error reporting) ───────────────────
function BatchProgressBar({ done, total, error }: { done: number; total: number; error?: BatchError | null }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className={`border rounded-xl p-4 space-y-2 ${error ? 'bg-red-950/30 border-red-500/30' : 'bg-[#151515] border-white/5'}`}>
      <div className="flex justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          {error
            ? <><i className="fa-solid fa-triangle-exclamation text-red-400" /> Batch {error.failedBatch}/{error.totalBatches} thất bại</>
            : <><i className="fa-solid fa-layer-group text-amber-400" /> Đang tạo batch {done}/{total}</>
          }
        </span>
        <span className={`font-bold ${error ? 'text-red-400' : 'text-amber-400'}`}>{pct}%</span>
      </div>
      <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${error ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-orange-600 to-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-[10px] text-center">
        {error
          ? <span className="text-red-300">⚠️ Đã lưu {error.completedScenes} cảnh. Nhấn "Tiếp Tục" để thử lại batch còn lại.</span>
          : <span className="text-slate-500">Scenes đang stream dần — cuộn xuống để xem kết quả từng phần</span>
        }
      </div>
    </div>
  );
}

// ── Utility: apply visual style enforcement to scene prompts ──────────────────
function applyStyleEnforce(segs: any[], styleObj: { id: string; prompt_enforce: string } | undefined): any[] {
  if (!styleObj || styleObj.id === 'auto' || !styleObj.prompt_enforce) return segs;
  const enforce = styleObj.prompt_enforce;
  return segs.map((s: any) => ({
    ...s,
    video_prompt: s.video_prompt && !s.video_prompt.includes('Visual Style:')
      ? `${s.video_prompt}${enforce}` : s.video_prompt,
    image_prompt: s.image_prompt && !s.image_prompt.includes('Visual Style:')
      ? `${s.image_prompt}${enforce}` : s.image_prompt,
  }));
}

export default ScriptModule;
