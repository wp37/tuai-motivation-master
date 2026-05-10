// ==================================================================================
// AI SERVICE — Multi-Provider with Round Robin & Fallback
// ==================================================================================
import { MODELS } from '../data/constants';

const STORAGE_KEYS = {
  keyPool: 'moti_key_pool',
  openRouterKey: 'moti_openrouter_key',
  openRouterModel: 'moti_openrouter_model',
  openAiKey: 'moti_openai_key',
  openAiModel: 'moti_openai_model',
  youtubeKey: 'moti_youtube_key',
  apiEnabled: 'moti_api_enabled',
  uiLanguage: 'moti_ui_language',
};

export interface ApiEnabledFlags {
  google: boolean;
  openrouter: boolean;
  openai: boolean;
  youtube: boolean;
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

const defaultConfig: ApiConfig = {
  keyPool: [],
  currentKeyIndex: 0,
  openRouterKey: '',
  openRouterModel: MODELS.openrouter_default,
  openAiKey: '',
  openAiModel: 'gpt-4-turbo-preview',
  youtubeApiKey: '',
  apiEnabled: { google: true, openrouter: false, openai: false, youtube: false },
};

let config: ApiConfig = { ...defaultConfig };

export function loadApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.keyPool);
    config.keyPool = stored ? JSON.parse(stored) : [];
  } catch { config.keyPool = []; }

  config.openRouterKey = localStorage.getItem(STORAGE_KEYS.openRouterKey) || '';
  config.openRouterModel = localStorage.getItem(STORAGE_KEYS.openRouterModel) || MODELS.openrouter_default;
  config.openAiKey = localStorage.getItem(STORAGE_KEYS.openAiKey) || '';
  config.openAiModel = localStorage.getItem(STORAGE_KEYS.openAiModel) || 'gpt-4-turbo-preview';
  config.youtubeApiKey = localStorage.getItem(STORAGE_KEYS.youtubeKey) || '';

  try {
    const flags = localStorage.getItem(STORAGE_KEYS.apiEnabled);
    if (flags) config.apiEnabled = JSON.parse(flags);
  } catch { /* keep defaults */ }

  return config;
}

export function saveApiConfig(newConfig: Partial<ApiConfig>) {
  config = { ...config, ...newConfig };
  localStorage.setItem(STORAGE_KEYS.keyPool, JSON.stringify(config.keyPool));
  localStorage.setItem(STORAGE_KEYS.openRouterKey, config.openRouterKey);
  localStorage.setItem(STORAGE_KEYS.openRouterModel, config.openRouterModel);
  localStorage.setItem(STORAGE_KEYS.openAiKey, config.openAiKey);
  localStorage.setItem(STORAGE_KEYS.openAiModel, config.openAiModel);
  localStorage.setItem(STORAGE_KEYS.youtubeKey, config.youtubeApiKey);
  localStorage.setItem(STORAGE_KEYS.apiEnabled, JSON.stringify(config.apiEnabled));
}

export function getApiConfig(): ApiConfig {
  return config;
}

export function getValidKeyCount(): number {
  return config.keyPool.filter(k => k && k.trim() !== '').length;
}

export function hasAnyApiKey(): boolean {
  return getValidKeyCount() > 0 || !!config.openRouterKey || !!config.openAiKey;
}

function getNextKey(): string {
  const validKeys = config.keyPool.filter(k => k && k.trim() !== '');
  if (validKeys.length === 0) return '';
  config.currentKeyIndex = (config.currentKeyIndex + 1) % validKeys.length;
  return validKeys[config.currentKeyIndex];
}

// === JSON Parser ===
function safeJSONParse(str: string): any {
  if (!str) return null;
  let clean = str.replace(/```json/gi, '').replace(/```/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  let start = -1, end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace; end = clean.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    start = firstBracket; end = clean.lastIndexOf(']');
  }
  if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1);
  else throw new Error("Invalid JSON structure");

  try { return JSON.parse(clean); }
  catch {
    if (clean.startsWith('{')) return JSON.parse(clean + '}');
    if (clean.startsWith('[')) return JSON.parse(clean + ']');
    throw new Error("JSON Parse Error");
  }
}

// === Google Gemini with Round-Robin ===
async function callGoogleWithRetry(prompt: string, systemPrompt: string, retries = 6): Promise<any> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    const apiKey = getNextKey();
    if (!apiKey) continue;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.text}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" },
      };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 429) throw new Error("429 Quota Exceeded");
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google Error ${res.status}: ${errText}`);
      }
      const data = await res.json();
      if (!data.candidates?.[0]?.content) throw new Error("Invalid Gemini Response");
      return safeJSONParse(data.candidates[0].content.parts[0].text);
    } catch (e: any) {
      lastError = e;
      const isQuota = e.message?.includes('429');
      console.warn(`Attempt ${i + 1}/${retries} failed:`, e.message);
      if (i < retries - 1) {
        const waitTime = isQuota ? 2000 * (i + 1) : 1000;
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }
  throw lastError || new Error("All Google attempts failed.");
}

// === OpenRouter ===
async function callOpenRouter(prompt: string, systemPrompt: string): Promise<any> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.href,
      'X-Title': 'TUAI Motivation Master',
    },
    body: JSON.stringify({
      model: config.openRouterModel || MODELS.openrouter_default,
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter Error: ${await res.text()}`);
  const data = await res.json();
  return safeJSONParse(data.choices[0].message.content);
}

// === OpenAI ===
async function callOpenAI(prompt: string, systemPrompt: string): Promise<any> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openAiModel || 'gpt-4-turbo-preview',
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI Error: ${await res.text()}`);
  const data = await res.json();
  return safeJSONParse(data.choices[0].message.content);
}

// === Main AI Caller with Fallback Chain ===
export async function callAI(prompt: string, systemPrompt: string): Promise<any> {
  const { apiEnabled, keyPool, openRouterKey, openAiKey } = config;
  const anyEnabled = apiEnabled.google || apiEnabled.openrouter || apiEnabled.openai;
  if (!anyEnabled) throw new Error("❌ Vui lòng bật ít nhất 1 API trong Config!");

  const hasGoogleKeys = keyPool.some(k => k && k.trim() !== '');

  // Priority 1: Google Gemini
  if (apiEnabled.google && hasGoogleKeys) {
    try { return await callGoogleWithRetry(prompt, systemPrompt); }
    catch (e: any) {
      console.warn("Google Gemini Failed:", e);
      if (!apiEnabled.openrouter && !apiEnabled.openai) throw e;
    }
  }

  // Priority 2: OpenRouter
  if (apiEnabled.openrouter && openRouterKey) {
    try { return await callOpenRouter(prompt, systemPrompt); }
    catch (e: any) {
      console.warn("OpenRouter Failed:", e);
      if (!apiEnabled.openai) throw e;
    }
  }

  // Priority 3: OpenAI
  if (apiEnabled.openai && openAiKey) {
    return await callOpenAI(prompt, systemPrompt);
  }

  throw new Error("❌ All enabled APIs failed or no valid API keys!");
}

// === YouTube Meta Fetcher ===
export async function fetchYoutubeMeta(url: string): Promise<any> {
  const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) return { title: "Invalid URL", author: "Unknown", thumb: "" };

  // Try YouTube Data API first
  if (config.youtubeApiKey) {
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${config.youtubeApiKey}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.items?.length > 0) {
          const item = data.items[0];
          return {
            title: item.snippet.title,
            author: item.snippet.channelTitle,
            thumb: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high.url,
            description: item.snippet.description,
            tags: item.snippet.tags?.join(', ') || '',
            viewCount: item.statistics.viewCount,
            likeCount: item.statistics.likeCount,
            publishDate: item.snippet.publishedAt,
            fullData: true,
          };
        }
      }
    } catch (e) { console.warn("YouTube Data API failed:", e); }
  }

  // Fallback: oEmbed
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
    if (res.ok) {
      const data = await res.json();
      return { title: data.title, author: data.author_name, thumb: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, fullData: false };
    }
  } catch { /* ignore */ }
  return { title: "YouTube Video", author: "YouTube Channel", thumb: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, fullData: false };
}

// === Image Generation ===
export async function generateImage(prompt: string, aspectRatio: string = "16:9"): Promise<string | null> {
  const apiKey = getNextKey();
  if (!apiKey) throw new Error("Nhập API Key!");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.image}:predict?key=${apiKey}`;
  const body = { instances: [{ prompt }], parameters: { sampleCount: 1, aspectRatio } };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();

  if (data.predictions?.[0]?.bytesBase64Encoded) {
    return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
  }
  return null;
}
