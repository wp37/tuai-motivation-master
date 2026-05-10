// ==================================================================================
// CONFIGURATION & CONSTANTS — Motivation Master
// ==================================================================================

export const MODELS = {
  text: "gemini-2.5-flash",
  image: "imagen-3.0-generate-002",
  openrouter_default: "google/gemini-2.0-flash-exp:free",
};

export const GOOGLE_LABS_URLS = {
  video: "https://aitestkitchen.withgoogle.com/tools/video-fx",
  image: "https://aitestkitchen.withgoogle.com/tools/image-fx",
};

export interface TargetMarket {
  id: string;
  name: string;
  flag: string;
  voice_lang: string;
  currency: string;
  culture?: string;
}

export const TARGET_MARKETS: Record<string, TargetMarket> = {
  vn_motivation: { id: 'vn_motivation', name: 'Vietnam (Truyền Cảm Hứng)', flag: '🇻🇳', voice_lang: 'Vietnamese', currency: 'VND', culture: 'Văn hóa Việt, câu chuyện vượt khó, tinh thần kiên cường, giá trị gia đình và nỗ lực bản thân' },
  us_selfhelp: { id: 'us_selfhelp', name: 'USA (Self-Help & Growth)', flag: '🇺🇸', voice_lang: 'English', currency: 'USD' },
  jp_ikigai: { id: 'jp_ikigai', name: 'Japan (Ikigai & Kaizen)', flag: '🇯🇵', voice_lang: 'Japanese', currency: 'JPY' },
  kr_success: { id: 'kr_success', name: 'Korea (Success Stories)', flag: '🇰🇷', voice_lang: 'Korean', currency: 'KRW' },
  uk_mindset: { id: 'uk_mindset', name: 'UK (Mindset & Leadership)', flag: '🇬🇧', voice_lang: 'English', currency: 'GBP' },
  global_ted: { id: 'global_ted', name: 'Global (TED-Style Talks)', flag: '🌍', voice_lang: 'English', currency: 'USD' },
};

export interface VisualStyle {
  id: string;
  name: string;
  desc: string;
  prompt_enforce: string;
}

export const VISUAL_STYLES: VisualStyle[] = [
  { id: 'auto', name: '✨ AI Director Auto', desc: 'AI tự chọn phong cách phù hợp nhất với nội dung truyền cảm hứng.', prompt_enforce: '' },
  { id: 'sunrise_epic', name: '🌅 Sunrise Epic', desc: 'Bình minh hùng vĩ, ánh sáng vàng cam, khung cảnh thiên nhiên rộng lớn.', prompt_enforce: ', Visual Style: Epic sunrise over mountains or ocean, golden hour warm light, silhouette of person standing triumphant, inspirational and powerful, cinematic wide angle, volumetric god rays.' },
  { id: 'urban_hustle', name: '🏙️ Urban Hustle', desc: 'Thành phố hiện đại, ánh đèn neon, năng lượng đô thị, khởi nghiệp.', prompt_enforce: ', Visual Style: Modern urban cityscape at night, neon lights reflecting on wet streets, ambitious entrepreneur walking forward, dynamic energy, cinematic moody lighting, success and hustle aesthetic.' },
  { id: 'minimal_wisdom', name: '📖 Minimal Wisdom', desc: 'Tối giản, typography mạnh, nền tối, trích dẫn nổi bật.', prompt_enforce: ', Visual Style: Minimalist dark background with elegant typography, single spotlight, clean composition, wisdom and contemplation, premium editorial look, subtle warm tones.' },
  { id: 'nature_journey', name: '🌿 Nature Journey', desc: 'Hành trình thiên nhiên, con đường phía trước, rừng xanh, ánh sáng.', prompt_enforce: ', Visual Style: Person walking on a path through beautiful nature, forest or mountain trail, sunlight filtering through trees, journey and growth metaphor, peaceful yet determined, warm color grading.' },
  { id: 'stage_speaker', name: '🎤 Stage Speaker', desc: 'Sân khấu TED talk, spotlight, khán giả, năng lượng truyền cảm hứng.', prompt_enforce: ', Visual Style: TED-style stage with dramatic spotlight, confident speaker on stage, audience silhouettes, motivational atmosphere, warm amber lighting, professional and powerful presentation.' },
];

export const SEO_CHECKLIST_DATA: Record<string, { id: string; label: string }[]> = {
  "Phần 1: Content Quality (BẮT BUỘC)": [
    { id: "eth_1", label: "Authentic Story (Câu chuyện chân thực)" },
    { id: "eth_2", label: "Actionable Advice (Lời khuyên hành động được)" },
    { id: "eth_3", label: "No Toxic Positivity (Không tích cực độc hại)" },
    { id: "eth_4", label: "Evidence-Based (Dựa trên bằng chứng)" },
  ],
  "Phần 2: Motivation SEO": [
    { id: "seo_1", label: "Keyword: 'Truyền cảm hứng', 'Phát triển', 'Thành công'" },
    { id: "seo_2", label: "Thumbnail: Khuôn mặt tự tin / Ánh bình minh" },
    { id: "seo_3", label: "Hook: Bí quyết thay đổi cuộc đời (The How)" },
    { id: "seo_4", label: "Mô tả: Hành trình vượt khó & thành công" },
  ],
  "Phần 3: Growth Community": [
    { id: "com_1", label: "Hỏi: 'Điều gì truyền cảm hứng cho bạn?'" },
    { id: "com_2", label: "Discussion: Chia sẻ câu chuyện thành công" },
  ],
};

export const SECONDS_PER_SCENE = 8;

export type TabId = 'spy' | 'script' | 'studio' | 'seo' | 'market';

export const TAB_COLORS: Record<TabId, { bg: string; border: string; text: string; shadow: string }> = {
  spy: { bg: 'bg-[#261a0a]', border: 'border-orange-900/50', text: 'text-orange-400', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.1)]' },
  script: { bg: 'bg-[#1e1a2e]', border: 'border-purple-500/50', text: 'text-purple-300', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  studio: { bg: 'bg-[#0f2129]', border: 'border-cyan-500/50', text: 'text-cyan-300', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]' },
  seo: { bg: 'bg-[#0f2015]', border: 'border-green-500/50', text: 'text-green-300', shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.15)]' },
  market: { bg: 'bg-[#291e0f]', border: 'border-yellow-500/50', text: 'text-yellow-300', shadow: 'shadow-[0_0_15px_rgba(234,179,8,0.15)]' },
};
