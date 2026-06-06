// ==================================================================================
// AI SERVICE v2 — Batch-aware, Quota-smart, Multi-provider
// ==================================================================================
import { MODELS } from '../data/constants';

// ── Storage keys ──────────────────────────────────────────────────────────────
const SK = {
  keyPool:          'moti_key_pool',
  keyIndex:         'moti_key_index',          // 🆕 persist rotation across reloads
  openRouterKey:    'moti_openrouter_key',
  openRouterModel:  'moti_openrouter_model',
  openAiKey:        'moti_openai_key',
  openAiModel:      'moti_openai_model',
  youtubeKey:       'moti_youtube_key',
  apiEnabled:       'moti_api_enabled',
};

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ApiEnabledFlags {
  google: boolean; openrouter: boolean; openai: boolean; youtube: boolean;
}
export interface ApiConfig {
  keyPool: string[];
  currentKeyIndex: number;
  openRouterKey: string;
  openRouterModel: string;
  openAiKey: string;
  openAiModel: string;
  youtubeApiKey: string;
  apiEnabled: ApiEnabledFlags;
}

// 🆕 Batch config — tune here
export const BATCH_CONFIG = {
  // Max scenes per single AI call. Larger = fewer calls but higher token load.
  maxScenesPerBatch: 6,
  // Delay (ms) between batch calls to avoid burst quota hits
  batchDelay: 1200,
  // Max retries per individual call before moving to next provider
  maxRetriesPerCall: 3,
  // Base wait (ms) on 429 — multiplied by attempt number (exponential backoff)
  quotaBackoffBase: 3000,
};

// ── Config state ───────────────────────────────────────────────────────────────
const defaultConfig: ApiConfig = {
  keyPool: [], currentKeyIndex: 0,
  openRouterKey: '', openRouterModel: MODELS.openrouter_default,
  openAiKey: '', openAiModel: 'gpt-4-turbo-preview',
  youtubeApiKey: '',
  apiEnabled: { google: true, openrouter: false, openai: false, youtube: false },
};
let config: ApiConfig = { ...defaultConfig };

export function loadApiConfig(): ApiConfig {
  try { config.keyPool = JSON.parse(localStorage.getItem(SK.keyPool) || '[]'); }
  catch { config.keyPool = []; }

  // 🆕 Restore persisted key index so rotation survives page reloads
  config.currentKeyIndex = parseInt(localStorage.getItem(SK.keyIndex) || '0', 10) || 0;

  config.openRouterKey   = localStorage.getItem(SK.openRouterKey)   || '';
  config.openRouterModel = localStorage.getItem(SK.openRouterModel)  || MODELS.openrouter_default;
  config.openAiKey       = localStorage.getItem(SK.openAiKey)        || '';
  config.openAiModel     = localStorage.getItem(SK.openAiModel)      || 'gpt-4-turbo-preview';
  config.youtubeApiKey   = localStorage.getItem(SK.youtubeKey)       || '';

  try {
    const flags = localStorage.getItem(SK.apiEnabled);
    if (flags) config.apiEnabled = JSON.parse(flags);
  } catch { /* keep defaults */ }

  return config;
}

export function saveApiConfig(newConfig: Partial<ApiConfig>) {
  config = { ...config, ...newConfig };
  localStorage.setItem(SK.keyPool,         JSON.stringify(config.keyPool));
  localStorage.setItem(SK.keyIndex,        String(config.currentKeyIndex));
  localStorage.setItem(SK.openRouterKey,   config.openRouterKey);
  localStorage.setItem(SK.openRouterModel, config.openRouterModel);
  localStorage.setItem(SK.openAiKey,       config.openAiKey);
  localStorage.setItem(SK.openAiModel,     config.openAiModel);
  localStorage.setItem(SK.youtubeKey,      config.youtubeApiKey);
  localStorage.setItem(SK.apiEnabled,      JSON.stringify(config.apiEnabled));
}

export const getApiConfig    = () => config;
export const getValidKeyCount = () => config.keyPool.filter(k => k?.trim()).length;
export const hasAnyApiKey    = () => getValidKeyCount() > 0 || !!config.openRouterKey || !!config.openAiKey;

// 🆕 Round-robin with persistence
function getNextKey(): string {
  const valid = config.keyPool.filter(k => k?.trim());
  if (!valid.length) return '';
  config.currentKeyIndex = (config.currentKeyIndex + 1) % valid.length;
  localStorage.setItem(SK.keyIndex, String(config.currentKeyIndex)); // persist
  return valid[config.currentKeyIndex];
}

// ── JSON parser ────────────────────────────────────────────────────────────────
function safeJSONParse(str: string): any {
  if (!str) throw new Error('Empty response');
  let clean = str.replace(/```json/gi, '').replace(/```/g, '').trim();

  const fb = clean.indexOf('{'), fk = clean.indexOf('[');
  let start = -1, end = -1;
  if (fb !== -1 && (fk === -1 || fb < fk)) { start = fb; end = clean.lastIndexOf('}'); }
  else if (fk !== -1)                        { start = fk; end = clean.lastIndexOf(']'); }

  if (start === -1 || end === -1) throw new Error('No JSON found in response');
  clean = clean.substring(start, end + 1);

  // 🆕 Try to auto-repair truncated JSON (common in long batch responses)
  try { return JSON.parse(clean); }
  catch {
    // Count open braces/brackets and close them
    const openBraces    = (clean.match(/\{/g) || []).length;
    const closeBraces   = (clean.match(/\}/g) || []).length;
    const openBrackets  = (clean.match(/\[/g) || []).length;
    const closeBrackets = (clean.match(/\]/g) || []).length;

    let repaired = clean;
    // Close any unterminated string
    if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
    repaired += ']'.repeat(Math.max(0, openBrackets - closeBrackets));
    repaired += '}'.repeat(Math.max(0, openBraces   - closeBraces));

    try { return JSON.parse(repaired); }
    catch { throw new Error('JSON parse failed even after repair'); }
  }
}

// ── Provider: Google Gemini ────────────────────────────────────────────────────
async function callGoogle(prompt: string, systemPrompt: string): Promise<any> {
  const { maxRetriesPerCall, quotaBackoffBase } = BATCH_CONFIG;
  let lastError: any;

  for (let i = 0; i < maxRetriesPerCall; i++) {
    const apiKey = getNextKey();
    if (!apiKey) throw new Error('No Google API keys configured');
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.text}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: 'application/json' },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const wait = quotaBackoffBase * (i + 1);
        console.warn(`[Gemini] 429 quota — key rotated, waiting ${wait}ms`);
        await delay(wait);
        throw new Error('429');
      }
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
      }

      const data = await res.json();
      if (!data.candidates?.[0]?.content) throw new Error('Invalid Gemini response shape');
      return safeJSONParse(data.candidates[0].content.parts[0].text);

    } catch (e: any) {
      lastError = e;
      console.warn(`[Gemini] attempt ${i + 1}/${maxRetriesPerCall}:`, e.message);
      if (i < maxRetriesPerCall - 1) await delay(1000 * (i + 1));
    }
  }
  throw lastError;
}

// ── Provider: OpenRouter ───────────────────────────────────────────────────────
async function callOpenRouter(prompt: string, systemPrompt: string): Promise<any> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization:    `Bearer ${config.openRouterKey}`,
      'Content-Type':   'application/json',
      'HTTP-Referer':   window.location.href,
      'X-Title':        'TUAI Motivation Master',
    },
    body: JSON.stringify({
      model:           config.openRouterModel || MODELS.openrouter_default,
      messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeJSONParse(data.choices[0].message.content);
}

// ── Provider: OpenAI ──────────────────────────────────────────────────────────
async function callOpenAI(prompt: string, systemPrompt: string): Promise<any> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openAiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:           config.openAiModel || 'gpt-4-turbo-preview',
      messages:        [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature:     0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return safeJSONParse(data.choices[0].message.content);
}

// ── Main callAI — fallback chain (unchanged API, internal improvements) ────────
export async function callAI(prompt: string, systemPrompt: string): Promise<any> {
  const { apiEnabled, keyPool, openRouterKey, openAiKey } = config;
  if (!apiEnabled.google && !apiEnabled.openrouter && !apiEnabled.openai)
    throw new Error('❌ Vui lòng bật ít nhất 1 API trong Config!');

  const hasGoogle = apiEnabled.google && keyPool.some(k => k?.trim());

  if (hasGoogle) {
    try { return await callGoogle(prompt, systemPrompt); }
    catch (e: any) {
      console.warn('[callAI] Google failed, trying fallback:', e.message);
      if (!apiEnabled.openrouter && !apiEnabled.openai) throw e;
    }
  }
  if (apiEnabled.openrouter && openRouterKey) {
    try { return await callOpenRouter(prompt, systemPrompt); }
    catch (e: any) {
      console.warn('[callAI] OpenRouter failed:', e.message);
      if (!apiEnabled.openai) throw e;
    }
  }
  if (apiEnabled.openai && openAiKey) return await callOpenAI(prompt, systemPrompt);

  throw new Error('❌ All enabled APIs failed or no valid API keys!');
}

// ── 🆕 BATCH SCRIPT GENERATOR ─────────────────────────────────────────────────
//
// Splits a large scene request into multiple smaller AI calls.
// Each batch = maxScenesPerBatch scenes → streamed back via onProgress callback.
//
// Usage:
//   const scenes = await callAIBatched(
//     buildBatchPrompt,   // (batchIndex, startScene, endScene, totalScenes) => string
//     systemPrompt,
//     totalScenes,
//     (done, total, partial) => setProgress({ done, total, scenes: partial })
//   );
//
export async function callAIBatched(
  buildPrompt:  (batchIndex: number, startScene: number, endScene: number, total: number) => string,
  systemPrompt: string,
  totalScenes:  number,
  onProgress?:  (batchDone: number, totalBatches: number, accumulatedScenes: any[]) => void,
): Promise<any[]> {
  const { maxScenesPerBatch, batchDelay } = BATCH_CONFIG;
  const totalBatches = Math.ceil(totalScenes / maxScenesPerBatch);
  const accumulated: any[] = [];

  for (let b = 0; b < totalBatches; b++) {
    const startScene = b * maxScenesPerBatch + 1;
    const endScene   = Math.min((b + 1) * maxScenesPerBatch, totalScenes);

    const prompt = buildPrompt(b, startScene, endScene, totalScenes);
    const json   = await callAI(prompt, systemPrompt);

    // Accept both {script:[...]} and [...] shapes
    const batch: any[] = json.script || (Array.isArray(json) ? json : []);
    accumulated.push(...batch);

    onProgress?.(b + 1, totalBatches, [...accumulated]);

    // Throttle between batches (skip delay on last batch)
    if (b < totalBatches - 1) await delay(batchDelay);
  }

  return accumulated;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── YouTube meta ──────────────────────────────────────────────────────────────
export async function fetchYoutubeMeta(url: string): Promise<any> {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = m?.[1];
  if (!videoId) return { title: 'Invalid URL', author: 'Unknown', thumb: '' };

  if (config.youtubeApiKey) {
    try {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${config.youtubeApiKey}`);
      if (r.ok) {
        const d = await r.json();
        if (d.items?.length) {
          const it = d.items[0];
          return {
            title: it.snippet.title, author: it.snippet.channelTitle,
            thumb: it.snippet.thumbnails.maxres?.url || it.snippet.thumbnails.high.url,
            description: it.snippet.description,
            tags: it.snippet.tags?.join(', ') || '',
            viewCount: it.statistics.viewCount, likeCount: it.statistics.likeCount,
            publishDate: it.snippet.publishedAt, fullData: true,
          };
        }
      }
    } catch (e) { console.warn('YouTube API failed:', e); }
  }

  try {
    const r = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
    if (r.ok) {
      const d = await r.json();
      return { title: d.title, author: d.author_name, thumb: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, fullData: false };
    }
  } catch { /* ignore */ }

  return { title: 'YouTube Video', author: 'YouTube Channel', thumb: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, fullData: false };
}

// ── Image generation (with key rotation + retry) ──────────────────────────────
export async function generateImage(prompt: string, aspectRatio = '16:9'): Promise<string | null> {
  const valid = config.keyPool.filter(k => k?.trim());
  if (!valid.length) throw new Error('Nhập API Key!');

  // 🆕 Try each key once on failure instead of always key[0]
  for (let i = 0; i < Math.min(valid.length, 3); i++) {
    const apiKey = getNextKey();
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.image}:predict?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio } }),
      });
      const data = await res.json();
      if (data.predictions?.[0]?.bytesBase64Encoded)
        return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    } catch (e) { console.warn(`generateImage key attempt ${i + 1} failed:`, e); }
  }
  return null;
}
