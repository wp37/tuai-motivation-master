# 📋 HƯỚNG DẪN NÂNG CẤP TOOL → MULTI-TAB v2.0 (UNIVERSAL TEMPLATE)

> **Áp dụng cho:** Mọi dự án TUAI (PSY, Criminal, Dharma, Horror, Recycle Styles, Beauty, MixUp Food, v.v.)
> **Phiên bản:** Universal Template v1.0
> **Ngày tạo:** 2026-05-17
> **Đã test thành công:** Beauty Viral Master ✅

---

## 🎯 MỤC TIÊU

Nâng cấp tool từ **single-page** (1 trang cuộn dài) hoặc **multi-tab switch/case** (mất data) → **multi-tab display:none** (giữ state) + thêm AI nâng cao.

---

## 📊 TRƯỚC vs SAU

| Tiêu chí | ❌ TRƯỚC | ✅ SAU |
|-----------|---------|-------|
| Layout | 1 page hoặc switch/case | Multi-tab + Sidebar + display:none |
| Modules | 1-2 file lớn | 4 modules chuyên biệt |
| AI Brain | 1-2 prompts cơ bản | 4-5 prompts chuyên biệt |
| AI Style | User tự chọn | AI tự đề xuất style + lý do |
| Chế độ video | 1 chế độ cố định | 3 chế độ (Quick/Story/Deep) |
| Studio | API có nhưng không UI | Module tạo ảnh reference |
| SEO | Inline hoặc không có | Module SEO riêng |
| Data sharing | Không có | localStorage giữa các tab |

---

## 🗂️ CẤU TRÚC SAU NÂNG CẤP

```
📁 src/
├── App.tsx                  ← [SỬA] Layout: Header + Sidebar + display:none tabs
├── index.css                ← [SỬA] Thêm animations (fadeIn, slideIn, slideUp, sidebar)
├── index.tsx                ← Giữ nguyên
├── 📁 components/
│   ├── Header.tsx           ← Giữ nguyên (hoặc sửa nhẹ subtitle)
│   ├── Sidebar.tsx          ← [MỚI] 4 tab navigation
│   ├── Toast.tsx            ← Giữ nguyên
│   └── ApiKeyModal.tsx      ← Giữ nguyên
├── 📁 data/
│   ├── constants.ts         ← [SỬA] Thêm TAB_COLORS, TAB_NAMES, MODE_OPTIONS
│   └── prompts.ts           ← [SỬA] Thêm 3 prompts mới (SPY, SEO, STYLE_RECOMMEND)
├── 📁 services/
│   └── aiService.ts         ← Giữ nguyên
└── 📁 pages/
    ├── SpyModule.tsx        ← [MỚI] Tab 1: Phân tích đối thủ
    ├── ScriptModule.tsx     ← [MỚI] Tab 2: Viết kịch bản (tách từ file cũ)
    ├── StudioModule.tsx     ← [MỚI] Tab 3: Tạo ảnh/video reference
    └── SeoModule.tsx        ← [MỚI] Tab 4: SEO & Viral
```

---

## ⚡ QUY TRÌNH 6 BƯỚC

### BƯỚC 1: Thêm config vào `constants.ts`

Copy-paste đoạn này vào cuối file (trước phần interfaces):

```typescript
// ==================================================================================
// TAB COLORS (for Sidebar navigation)
// ==================================================================================
export const TAB_COLORS: Record<string, { border: string; text: string; bg: string; icon: string }> = {
  spy:    { border: 'border-{{COLOR1}}-500', text: 'text-{{COLOR1}}-400', bg: 'bg-{{COLOR1}}-500/10', icon: 'fa-magnifying-glass-chart' },
  script: { border: 'border-{{COLOR2}}-500', text: 'text-{{COLOR2}}-400', bg: 'bg-{{COLOR2}}-500/10', icon: 'fa-wand-magic-sparkles' },
  studio: { border: 'border-{{COLOR3}}-500', text: 'text-{{COLOR3}}-400', bg: 'bg-{{COLOR3}}-500/10', icon: 'fa-palette' },
  seo:    { border: 'border-{{COLOR4}}-500', text: 'text-{{COLOR4}}-400', bg: 'bg-{{COLOR4}}-500/10', icon: 'fa-chart-line' },
};

// Thay {{COLOR1-4}} theo theme dự án:
// Beauty: fuchsia, pink, violet, rose
// Recycle: emerald, teal, green, lime
// Horror: red, rose, orange, amber
// Philosophy: indigo, blue, violet, purple
// Criminal: red, orange, amber, yellow

export const TAB_NAMES: Record<string, { name: string; desc: string }> = {
  spy:    { name: '{{TAB1_NAME}}',    desc: '{{TAB1_DESC}}' },
  script: { name: '{{TAB2_NAME}}',    desc: '{{TAB2_DESC}}' },
  studio: { name: '{{TAB3_NAME}}',    desc: '{{TAB3_DESC}}' },
  seo:    { name: '{{TAB4_NAME}}',    desc: '{{TAB4_DESC}}' },
};

// VÍ DỤ NAMES THEO NGÁCH:
// Beauty:  BEAUTY SPY / SCRIPT FORGE / VISUAL STUDIO / VIRAL SEO
// Recycle: TREND SCOUT / STORY WEAVER / CRAFT STUDIO / ECO SEO
// Horror:  DARK SCOUT / FEAR WRITER / SHADOW STUDIO / HORROR SEO
// Food:    FOOD SPY / RECIPE FORGE / FOOD STUDIO / FOOD SEO

export const MODE_OPTIONS = [
  { id: 'quick', name: '🟢 {{MODE1}}', desc: '<60s — {{DESC1}}', scenes: 3, icon: '⚡' },
  { id: 'story', name: '🔵 {{MODE2}}', desc: '1-3m — {{DESC2}}', scenes: 5, icon: '📖' },
  { id: 'deep',  name: '🟣 {{MODE3}}', desc: '>3m — {{DESC3}}',  scenes: 8, icon: '🎬' },
];

// VÍ DỤ MODES:
// Beauty:  QUICK GLAM / BEAUTY STORY / DEEP REVIEW
// Recycle: QUICK CRAFT / STORY WEAVER / EPIC FOLKLORE
// Horror:  QUICK SCARE / HORROR TALE / DEEP NIGHTMARE
// Food:    QUICK BITE / RECIPE STORY / FULL COURSE
```

---

### BƯỚC 2: Thêm 3 prompts vào `prompts.ts`

Thêm vào cuối file. **PHẢI thay nội dung theo ngách:**

```typescript
// PROMPT SPY — Phân tích kênh đối thủ
export const SYSTEM_PROMPT_{{NGACH}}_SPY = `# ROLE: {{NGACH}} CHANNEL ANALYST (IQ160)
Bạn là chuyên gia phân tích kênh {{mô_tả_ngách}} trên YouTube + TikTok.
...
RESPOND ALL TEXT FIELDS IN VIETNAMESE.`;

// PROMPT SEO — Tối ưu SEO & Viral
export const SYSTEM_PROMPT_{{NGACH}}_SEO = `# ROLE: {{NGACH}} CONTENT SEO STRATEGIST
...
RESPOND ALL TEXT FIELDS IN VIETNAMESE.`;

// AI STYLE RECOMMENDATION — Đề xuất phong cách
export const STYLE_RECOMMENDATION_PROMPT = `Bạn là {{ngách}} Content Director.
Phân tích chủ đề sau và đề xuất phong cách video PHÙ HỢP NHẤT.

DANH SÁCH STYLES:
- style_id_1: Mô tả. Phù hợp: ...
- style_id_2: Mô tả. Phù hợp: ...
(copy tất cả styles từ constants.ts vào đây)

Trả về JSON:
{
  "primary_style": "style_id",
  "primary_reason": "Lý do (tiếng Việt)",
  "alternative_style": "style_id",
  "alternative_reason": "Lý do (tiếng Việt)"
}`;
```

> ⚠️ **QUAN TRỌNG:** Thêm `RESPOND ALL TEXT FIELDS IN VIETNAMESE` vào cuối prompt SPY và SEO!

---

### BƯỚC 3: Tạo `Sidebar.tsx`

Copy nguyên file từ Beauty project. **Không cần sửa gì** — nó tự đọc TAB_COLORS và TAB_NAMES từ constants.ts.

```
Copy: beautydupe/src/components/Sidebar.tsx → [dự_án_mới]/src/components/Sidebar.tsx
```

---

### BƯỚC 4: Tạo 4 Page Modules

#### 4A. `ScriptModule.tsx` — Tách từ file page cũ

```powershell
copy "src\pages\[TênCũ]Page.tsx" "src\pages\ScriptModule.tsx"
```

Sau đó sửa trong ScriptModule.tsx:
1. Đổi tên component: `const ScriptModule: React.FC = () => {`
2. Đổi export: `export default ScriptModule;`
3. Xóa dead code (state không dùng)
4. Thêm import: `MODE_OPTIONS` từ constants, `STYLE_RECOMMENDATION_PROMPT` từ prompts
5. Thêm state: `selectedMode`, `styleRec`, `isRecommending`
6. Thêm hàm `handleStyleRecommend`
7. Thêm UI: nút "🪄 AI Đề Xuất Style" + Mode Selection grid
8. Thêm `localStorage.setItem()` sau khi generate xong (để share với Studio/SEO)

#### 4B. `SpyModule.tsx` — Copy từ Beauty, sửa prompt

```
Copy: beautydupe/src/pages/SpyModule.tsx → [dự_án_mới]/src/pages/SpyModule.tsx
```

Sửa:
- Import đúng prompt SPY của ngách mới
- Đổi màu gradient theo theme ngách
- Đổi placeholder text

#### 4C. `StudioModule.tsx` — Copy nguyên, sửa nhẹ

```
Copy: beautydupe/src/pages/StudioModule.tsx → [dự_án_mới]/src/pages/StudioModule.tsx
```

Sửa:
- localStorage key nếu khác (`beauty_last_script` → `{{ngach}}_last_script`)
- Đổi màu gradient theo theme

#### 4D. `SeoModule.tsx` — Copy từ Beauty, sửa prompt

```
Copy: beautydupe/src/pages/SeoModule.tsx → [dự_án_mới]/src/pages/SeoModule.tsx
```

Sửa:
- Import đúng prompt SEO của ngách mới
- localStorage key
- Đổi màu gradient

---

### BƯỚC 5: Sửa `App.tsx`

```tsx
import Sidebar from './components/Sidebar';
import SpyModule from './pages/SpyModule';
import ScriptModule from './pages/ScriptModule';
import StudioModule from './pages/StudioModule';
import SeoModule from './pages/SeoModule';

// Thêm state:
const [activeTab, setActiveTab] = useState('script');

// Layout:
<div className="flex flex-1">
  <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
  <main className="flex-1 p-4 md:p-6 pb-20">
    <div style={{ display: activeTab === 'spy' ? 'block' : 'none' }}><SpyModule /></div>
    <div style={{ display: activeTab === 'script' ? 'block' : 'none' }}><ScriptModule /></div>
    <div style={{ display: activeTab === 'studio' ? 'block' : 'none' }}><StudioModule /></div>
    <div style={{ display: activeTab === 'seo' ? 'block' : 'none' }}><SeoModule /></div>
  </main>
</div>
```

> 🚨 **BẪY #1:** TUYỆT ĐỐI dùng `display:none`, KHÔNG dùng `&&` hay `switch/case`!

---

### BƯỚC 6: Sửa `index.css`

Thêm vào cuối:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fadeIn .3s ease-out; }

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in { animation: slideIn .4s ease-out; }

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-slide-up { animation: slideUp .35s ease-out; }

.sidebar-item { transition: all 0.2s ease; position: relative; }
.sidebar-item::before {
  content: ''; position: absolute; left: 0; top: 50%;
  transform: translateY(-50%); width: 3px; height: 0;
  border-radius: 999px; transition: height 0.2s ease;
}
.sidebar-item.active::before { height: 60%; }
```

---

## 🚨 6 BẪY & CÁCH TRÁNH

| # | Bẫy | Cách tránh |
|---|-----|------------|
| 1 | `switch/case` render tabs → mất data | Dùng `display:none` |
| 2 | Quên `RESPOND ALL TEXT FIELDS IN VIETNAMESE` | Thêm cuối prompt SPY + SEO |
| 3 | Backtick `` ` `` trong template literal | Tránh hoặc dùng nháy đơn |
| 4 | Module không share data | Dùng localStorage |
| 5 | Quên kết nối `generateImage()` vào Studio | Import từ aiService.ts |
| 6 | Dead code (state khai báo không UI) | Xóa hoặc hoàn thiện |

---

## ✅ CHECKLIST NHANH (Copy cho mỗi dự án)

```
[ ] npm install (nếu clone mới)
[ ] Sửa constants.ts: TAB_COLORS + TAB_NAMES + MODE_OPTIONS
[ ] Sửa prompts.ts: thêm 3 prompts (SPY + SEO + STYLE_RECOMMEND)
[ ] Copy Sidebar.tsx từ Beauty
[ ] Tạo ScriptModule.tsx (tách từ page cũ + thêm AI Style + Mode)
[ ] Copy + sửa SpyModule.tsx
[ ] Copy + sửa StudioModule.tsx
[ ] Copy + sửa SeoModule.tsx
[ ] Sửa App.tsx (Sidebar + display:none)
[ ] Sửa index.css (thêm animations)
[ ] npm run build → 0 errors ✅
[ ] npm run dev → test 4 tabs ✅
[ ] Deploy vercel
```

---

## 📝 BẢNG TRA CỨU NHANH: CÁC BIẾN CẦN THAY

| Biến | Ý nghĩa | VD Beauty | VD Recycle | VD Horror |
|------|---------|-----------|------------|-----------|
| `{{COLOR1-4}}` | 4 màu tab | fuchsia,pink,violet,rose | emerald,teal,green,lime | red,rose,orange,amber |
| `{{TAB1-4_NAME}}` | Tên 4 tab | BEAUTY SPY... | TREND SCOUT... | DARK SCOUT... |
| `{{MODE1-3}}` | 3 chế độ | QUICK GLAM... | QUICK CRAFT... | QUICK SCARE... |
| `{{NGACH}}` | Tên ngách (prefix) | BEAUTY | RECYCLE | HORROR |
| `storage_prefix` | localStorage key | beauty_ | recycle_ | horror_ |

---

**© TUAI — 08.14.666.040**
