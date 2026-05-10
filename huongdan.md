# 📋 HƯỚNG DẪN CLONE DỰ ÁN MỚI TỪ TEMPLATE

> **Brand: TUAI / 08.14.666.040**
> **API: Google Gemini (duy nhất)**
> **Template gốc:** `c:\Users\Vo Tung\Downloads\PSY\`
> **Phiên bản guide:** v2.1 (cập nhật 2026-05-10)
> **Đã deploy thành công:** Philosophy, Criminal, Dharma, Horror

---

## 🗂️ CẤU TRÚC DỰ ÁN

```
📁 PROJECT/
├── index.html              ← Title, meta, font
├── package.json            ← Dependencies
├── vite.config.ts          ← Build config
├── vercel.json             ← Deploy config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .gitignore
├── 📁 src/
│   ├── index.tsx           ← React entry
│   ├── index.css           ← CSS scrollbar + body + theme
│   ├── App.tsx             ← Layout + 4 tabs + footer
│   ├── 📁 data/
│   │   ├── constants.ts    ← ⭐ Markets, Styles, Checklist, TAB_COLORS
│   │   └── prompts.ts      ← ⭐ 4 AI System Prompts
│   ├── 📁 services/
│   │   └── aiService.ts    ← Gemini Engine + Storage Keys
│   ├── 📁 components/
│   │   ├── Header.tsx      ← Logo + Brand + SĐT
│   │   ├── Sidebar.tsx     ← 4 Tab (tên + icon)
│   │   ├── Toast.tsx       ← Thông báo
│   │   └── ApiKeyModal.tsx ← Nhập Gemini key
│   └── 📁 pages/
│       ├── SpyModule.tsx   ← Tab 1: Phân tích YouTube
│       ├── ScriptModule.tsx← Tab 2: Viết kịch bản
│       ├── StudioModule.tsx← Tab 3: Studio ảnh/video
│       └── SeoModule.tsx   ← Tab 4: SEO
```

---

## ⚡ BƯỚC 1: CLONE (PowerShell)

```powershell
# === THAY TÊN NGÁCH ===
$NGACH = "TEN_NGACH"
$DEST = "c:\Users\Vo Tung\Downloads\$NGACH"
$SRC = "c:\Users\Vo Tung\Downloads\PSY"

New-Item -ItemType Directory -Path $DEST -Force

# Copy file gốc
@("index.html","package.json","vite.config.ts","vercel.json","tsconfig.json","tsconfig.app.json","tsconfig.node.json","eslint.config.js",".gitignore") | ForEach-Object {
    Copy-Item "$SRC\$_" "$DEST\" -Force
}

# Copy src/
Copy-Item "$SRC\src" "$DEST\src" -Recurse -Force

Write-Host "✅ Clone xong -> $DEST"
```

> ⚠️ **KHÔNG copy file `.php` gốc** vào repo — chỉ để tham khảo, không commit.
> Nếu lỡ copy, xóa trước khi `git add`: `Remove-Item "$DEST\*.php" -Force`

---

## ⚡ BƯỚC 2: CÀI

```powershell
cd $DEST
npm install
```

---

## ✏️ BƯỚC 3: SỬA 12 FILE NGÁCH

> ⚠️ **QUAN TRỌNG:** Phải sửa TẤT CẢ 12 file bên dưới để đồng bộ ngách hoàn chỉnh.
> Chỉ sửa 4 file gốc (như hướng dẫn cũ) sẽ bị lệch theme, màu sắc, storage keys.

### 3.1 `index.html` — Title + Meta

```html
<title>TUAI [TÊN NGÁCH] MASTER - AI [Mô tả] Suite</title>
<meta name="description" content="TUAI [TÊN NGÁCH] MASTER - [Mô tả chi tiết]." />
```

---

### 3.2 `src/data/constants.ts` — ⭐ QUAN TRỌNG NHẤT

```typescript
// MODEL API — Gemini duy nhất
export const MODELS = {
  text: "gemini-2.5-flash",              // Model text
  image: "imagen-3.0-generate-002",      // Model ảnh
  openrouter_default: "google/gemini-2.0-flash-exp:free",
};

// Sửa toàn bộ:
// 1. TARGET_MARKETS — Thị trường ngách (6 markets)
// 2. VISUAL_STYLES — Phong cách visual (6 styles)
// 3. SEO_CHECKLIST_DATA — Checklist SEO theo ngách
// 4. TAB_COLORS — Màu sắc 4 tab (spy, script, studio, seo)
```

**Mẫu TARGET_MARKETS:**
```typescript
export const TARGET_MARKETS: Record<string, TargetMarket> = {
  vn_[ngach]: { id: 'vn_[ngach]', name: 'Vietnam ([Tên ngách])', flag: '🇻🇳', voice_lang: 'Vietnamese', currency: 'VND', culture: '[Mô tả văn hóa]' },
  // ... thêm 5 thị trường khác
};
```

**Mẫu VISUAL_STYLES:**
```typescript
export const VISUAL_STYLES: VisualStyle[] = [
  { id: 'auto', name: '✨ AI Director Auto', desc: 'AI tự chọn phong cách.', prompt_enforce: '' },
  { id: '[style_id]', name: '[Icon] [Tên]', desc: '[Mô tả]', prompt_enforce: ', Visual Style: [Chi tiết prompt]' },
  // ... thêm 4-5 styles khác
];
```

---

### 3.3 `src/data/prompts.ts` — 3 Prompts chính

| Prompt | Tab | Cần sửa |
|---|---|---|
| `SYSTEM_PROMPT_IQ160_SPY` | Tab 1 | Chuyên gia phân tích YouTube ngách mới |
| `SYSTEM_PROMPT_SCRIPT_WRITER` | Tab 2 | Chuyên gia viết kịch bản ngách mới |
| `SYSTEM_PROMPT_SEO_MASTER` | Tab 4 | SEO chuyên gia ngách mới |
| `SYSTEM_PROMPT_MARKET_ANALYST` | (backup) | Phân tích thị trường ngách mới |

---

### 3.4 `src/components/Header.tsx` — Tên app + Màu sắc

```tsx
// Dòng 21: Tên
TUAI <span>[TÊN NGÁCH] MASTER</span>
// Dòng 22: Subtitle
V50.0 • [MÔ TẢ NGÁCH]

// ĐỔI MÀU: Thay red → màu ngách (indigo, amber, emerald, etc.)
// VD: from-red-900 → from-indigo-900
//     text-red-400 → text-indigo-400
//     border-red-500/20 → border-indigo-500/20
```

> SĐT 08.14.666.040 + Zalo đã cài sẵn.

---

### 3.5 `src/components/Sidebar.tsx` — Tên 4 Tab + Icon

```tsx
const TABS = [
  { id: 'spy', icon: 'fa-solid fa-[icon]', title: '1. [TÊN TAB 1]', subtitle: '[Mô tả]' },
  { id: 'script', icon: 'fa-solid fa-[icon]', title: '2. [TÊN TAB 2]', subtitle: '[Mô tả]' },
  { id: 'studio', icon: 'fa-solid fa-[icon]', title: '3. [TÊN TAB 3]', subtitle: '[Mô tả]' },
  { id: 'seo', icon: 'fa-solid fa-[icon]', title: '4. [TÊN TAB 4]', subtitle: '[Mô tả]' },
];

// ĐỔI MÀU hover: text-red-500/50 → text-[màu ngách]-500/50
```

---

### 3.6 `src/index.css` — Theme Toàn Cục

```css
/* ĐỔI MÀU NỀN: */
body { background-color: #050510; }  /* Crime=#050505, Philosophy=#050510 */

/* ĐỔI MÀU GRADIENT: */
background-image: radial-gradient(ellipse at top, rgba(67, 56, 202, 0.12), ...);

/* ĐỔI MÀU SELECTION: */
::selection { background: rgba(99, 102, 241, 0.3); }

/* ĐỔI MÀU PULSE GLOW: */
@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 3px rgba(99,102,241,0.4)); }
  50% { filter: drop-shadow(0 0 8px rgba(99,102,241,0.8)); }
}
```

---

### 3.7 `src/components/ApiKeyModal.tsx` — Màu Modal

```
ĐỔI: border-red-900/30 → border-[màu ngách]-900/30
ĐỔI: text-red-400 → text-[màu ngách]-400
ĐỔI: bg-red-900/... → bg-[màu ngách]-900/...
```

---

### 3.8 `src/services/aiService.ts` — Storage Keys + Title

```typescript
// ĐỔI prefix storage keys (tránh trùng giữa các ngách):
const STORAGE_KEYS = {
  keyPool: '[ngach]_key_pool',        // VD: philo_key_pool
  openRouterKey: '[ngach]_openrouter_key',
  // ... tất cả keys
};

// ĐỔI X-Title:
'X-Title': 'TUAI [TÊN NGÁCH] Master',
```

---

### 3.9 `src/pages/SpyModule.tsx` — Labels + Màu + AI Prompt

```
ĐỔI: "Phân Tích Kênh Tâm Lý" → "Phân Tích Kênh [Ngách]"
ĐỔI: placeholder "Dán link Video/Kênh tâm lý..." → "[Ngách]..."
ĐỔI: focus:border-blue-500 → focus:border-[màu ngách]-500
ĐỔI: bg-blue-900 → bg-[màu ngách]-900
ĐỔI: Strengths border-blue-500 → border-[màu ngách]-500

⭐ DỄ BỎ SÓT:
ĐỔI: prompt += `ANALYZE PSYCHOLOGY CONTENT` → `ANALYZE [NGÁCH] CONTENT`
```

---

### 3.10 `src/pages/ScriptModule.tsx` — Default Market + Labels + Mode Names

```typescript
// ĐỔI default market:
const [market, setMarket] = useState('vn_[ngach]');

// ĐỔI fallback:
const mk = TARGET_MARKETS[market] || TARGET_MARKETS['vn_[ngach]'];

// ĐỔI labels:
"Soạn Kịch Bản Chữa Lành" → "Soạn Kịch Bản [Ngách]"
placeholder: "VD: Tâm lý kẻ giết người..." → "VD: [Ví dụ ngách]..."

// ⭐ DỄ BỎ SÓT — ĐỔI MODE NAMES (3 mức duration):
'DAILY WISDOM (<3m)'     → '[Tên ngắn ngách] (<3m)'
'CONCEPT EXPLAINER (3-10m)' → '[Tên vừa ngách] (3-10m)'
'DEEP DIVE (>10m)'       → '[Tên dài ngách] (>10m)'
// VD Horror: QUICK SCARE / DARK TALE / NIGHTMARE SAGA
// VD Philosophy: DAILY WISDOM / CONCEPT EXPLAINER / DEEP DIVE
```

---

### 3.11 `src/pages/SeoModule.tsx` — Default Market

```typescript
// ĐỔI default + fallback market:
({ market = 'vn_[ngach]', ... })
const mk = TARGET_MARKETS[market] || TARGET_MARKETS['vn_[ngach]'];
```

---

### 3.12 `package.json` — Tên Package

```json
{ "name": "[ngach]-master" }
```

---

## 🎨 BẢNG MÀU CHI TIẾT THEO NGÁCH (PLUG-AND-PLAY)

> 💡 Mỗi ngách bên dưới có đầy đủ giá trị CSS cần thay. Copy-paste trực tiếp vào file tương ứng.

### Tổng quan nhanh

| Ngách | Màu | Tailwind | Body BG | Header Icon | Mode Names |
|---|---|---|---|---|---|
| Crime/Psychology | 🔴 Red | `red` | `#050505` | `fa-brain` | MIND SCAN / DARK PROFILE / DEEP ANALYSIS |
| Philosophy | 🟣 Indigo | `indigo` | `#050510` | `fa-yin-yang` | DAILY WISDOM / CONCEPT EXPLAINER / DEEP DIVE |
| Horror/Supernatural | 💜 Purple | `purple` | `#08050f` | `fa-ghost` | QUICK SCARE / DARK TALE / NIGHTMARE SAGA |
| History | 🟡 Amber | `amber` | `#0a0805` | `fa-landmark` | QUICK FACT / ERA EXPLORER / EPIC CHRONICLE |
| Dharma/Buddhism | 🟠 Gold | `amber`/`yellow` | `#0a0805` | `fa-dharmachakra` | DAILY DHARMA / SUTRA STUDY / EPIC JOURNEY |
| Health/Wellness | 🟢 Emerald | `emerald` | `#050a08` | `fa-heart-pulse` | QUICK TIP / WELLNESS GUIDE / DEEP HEALING |
| Finance | 🔵 Blue | `blue` | `#050815` | `fa-chart-line` | QUICK PROFIT / MARKET PLAY / WEALTH DEEP DIVE |
| Science | 🟦 Cyan | `cyan` | `#050a10` | `fa-atom` | QUICK LAB / EXPERIMENT / DISCOVERY DEEP DIVE |
| Romance | 💗 Pink | `pink` | `#100508` | `fa-heart` | SWEET MOMENT / LOVE STORY / EPIC ROMANCE |
| Education | 🟩 Teal | `teal` | `#050a0a` | `fa-graduation-cap` | QUICK LESSON / COURSE / MASTERCLASS |

---

### 🔴 Crime/Psychology (Đã deploy ✅)

```
Body BG:       #050505
Gradient:      rgba(127, 29, 29, 0.12)    /* red-900 */
Scrollbar:     track=#0a0808  thumb=#4e1b1b  hover=#7a2d2d
Selection:     rgba(239, 68, 68, 0.3)     /* red-500 */
PulseGlow:     rgba(239, 68, 68, 0.4/0.8)
Header BG:     #0f0505  border: border-red-900/20
Logo gradient: from-red-900 to-slate-900
Text accent:   text-red-400, text-red-500
Hover inactive: text-red-500/50
```

---

### 🟣 Philosophy (Đã deploy ✅)

```
Body BG:       #050510
Gradient:      rgba(67, 56, 202, 0.12)    /* indigo-700 */
Scrollbar:     track=#080812  thumb=#1e1b4e  hover=#2d2a7a
Selection:     rgba(99, 102, 241, 0.3)    /* indigo-500 */
PulseGlow:     rgba(99, 102, 241, 0.4/0.8)
Header BG:     #05050f  border: border-indigo-900/20
Logo gradient: from-indigo-900 to-slate-900
Text accent:   text-indigo-400, text-indigo-500
Hover inactive: text-indigo-500/50
```

---

### 💜 Horror/Supernatural (Đã deploy ✅)

```
Body BG:       #08050f
Gradient:      rgba(88, 28, 135, 0.18)    /* purple-900 */
Scrollbar:     track=#08050f  thumb=#2d1b4e  hover=#4a2d7a
Selection:     rgba(147, 51, 234, 0.3)    /* purple-600 */
PulseGlow:     rgba(147, 51, 234, 0.4/0.8)
Header BG:     #0f0515  border: border-purple-900/20
Logo gradient: from-purple-900 to-slate-900
Text accent:   text-purple-400, text-purple-500
Hover inactive: text-purple-500/50
```

---

### 🟡 History (Đã deploy ✅)

```
Body BG:       #0a0805
Gradient:      rgba(180, 83, 9, 0.12)     /* amber-700 */
Scrollbar:     track=#0a0805  thumb=#4e3b1b  hover=#7a5d2d
Selection:     rgba(245, 158, 11, 0.3)    /* amber-500 */
PulseGlow:     rgba(245, 158, 11, 0.4/0.8)
Header BG:     #0f0c05  border: border-amber-900/20
Logo gradient: from-amber-900 to-slate-900
Text accent:   text-amber-400, text-amber-500
Hover inactive: text-amber-500/50
```

---

### 🟠 Dharma/Buddhism (Đã deploy ✅)

```
Body BG:       #0a0805
Gradient:      rgba(202, 138, 4, 0.12)    /* yellow-600 */
Scrollbar:     track=#0a0805  thumb=#4e421b  hover=#7a662d
Selection:     rgba(234, 179, 8, 0.3)     /* yellow-500 */
PulseGlow:     rgba(234, 179, 8, 0.4/0.8)
Header BG:     #0f0c05  border: border-yellow-900/20
Logo gradient: from-yellow-900 to-slate-900
Text accent:   text-yellow-400, text-amber-500
Hover inactive: text-yellow-500/50
```

---

### 🟢 Health/Wellness (Gợi ý)

```
Body BG:       #050a08
Gradient:      rgba(5, 150, 105, 0.12)    /* emerald-600 */
Scrollbar:     track=#050a08  thumb=#1b4e3b  hover=#2d7a5d
Selection:     rgba(16, 185, 129, 0.3)    /* emerald-500 */
PulseGlow:     rgba(16, 185, 129, 0.4/0.8)
Header BG:     #050f0c  border: border-emerald-900/20
Logo gradient: from-emerald-900 to-slate-900
Text accent:   text-emerald-400, text-emerald-500
Hover inactive: text-emerald-500/50
```

---

### 🔵 Finance (Gợi ý)

```
Body BG:       #050815
Gradient:      rgba(29, 78, 216, 0.12)    /* blue-700 */
Scrollbar:     track=#050815  thumb=#1b2d4e  hover=#2d4a7a
Selection:     rgba(59, 130, 246, 0.3)    /* blue-500 */
PulseGlow:     rgba(59, 130, 246, 0.4/0.8)
Header BG:     #050a15  border: border-blue-900/20
Logo gradient: from-blue-900 to-slate-900
Text accent:   text-blue-400, text-blue-500
Hover inactive: text-blue-500/50
```

---

### 🟦 Science (Gợi ý)

```
Body BG:       #050a10
Gradient:      rgba(8, 145, 178, 0.12)    /* cyan-600 */
Scrollbar:     track=#050a10  thumb=#1b3e4e  hover=#2d627a
Selection:     rgba(6, 182, 212, 0.3)     /* cyan-500 */
PulseGlow:     rgba(6, 182, 212, 0.4/0.8)
Header BG:     #050f12  border: border-cyan-900/20
Logo gradient: from-cyan-900 to-slate-900
Text accent:   text-cyan-400, text-cyan-500
Hover inactive: text-cyan-500/50
```

---

### 💗 Romance (Gợi ý)

```
Body BG:       #100508
Gradient:      rgba(190, 24, 93, 0.12)    /* pink-700 */
Scrollbar:     track=#100508  thumb=#4e1b35  hover=#7a2d55
Selection:     rgba(236, 72, 153, 0.3)    /* pink-500 */
PulseGlow:     rgba(236, 72, 153, 0.4/0.8)
Header BG:     #15050a  border: border-pink-900/20
Logo gradient: from-pink-900 to-slate-900
Text accent:   text-pink-400, text-pink-500
Hover inactive: text-pink-500/50
```

---

## 🔧 MODEL API (Gemini)

Chỉ dùng **Google Gemini**. Config tại `src/data/constants.ts`:

```typescript
export const MODELS = {
  text: "gemini-2.5-flash",              // Nhanh, rẻ
  image: "imagen-3.0-generate-002",      // Tạo ảnh
};
```

Nếu model bị deprecated → sửa tên model tại đây.
Xem model mới: https://ai.google.dev/models

---

## 🚀 BƯỚC 4: TEST

```powershell
npm run dev -- --port 5174
# → http://localhost:5174/
```

> ⚠️ Dùng port khác (5174, 5175...) nếu port 5173 đã bị ngách khác chiếm.

---

## 🚀 BƯỚC 5: GITHUB

```powershell
git init
git add .
git commit -m "TUAI [TÊN NGÁCH] Master"
# (Tùy chọn) Push lên GitHub:
# git remote add origin https://github.com/USER/tuai-ten-ngach.git
# git branch -M main
# git push -u origin main
```

> ⚠️ PowerShell cũ không hỗ trợ `&&`. Chạy từng lệnh riêng hoặc dùng `;` thay thế.

---

## 🚀 BƯỚC 6: VERCEL

```powershell
npm run build
npx -y vercel --prod --yes
```

> ⚠️ `--name` đã **DEPRECATED** từ Vercel CLI v50+. Bỏ flag này.
> Vercel sẽ tự lấy tên từ thư mục hoặc hỏi lần đầu.
> Đổi tên project sau tại: Vercel Dashboard → Project Settings → General → Project Name

→ URL: `https://tuai-[ten-ngach].vercel.app`

---

## ✅ CHECKLIST ĐẦY ĐỦ (12 file + deploy)

```
[ ] Copy template (Bước 1) — KHÔNG copy file .php
[ ] npm install (Bước 2)
[ ] Sửa index.html (title + meta)
[ ] Sửa constants.ts (markets, styles, checklist, tab_colors)
[ ] Sửa prompts.ts (4 prompts)
[ ] Sửa Header.tsx (tên app + icon + màu)
[ ] Sửa Sidebar.tsx (tên tab + icon + màu hover)
[ ] Sửa index.css (body bg + gradient + selection + pulseGlow)
[ ] Sửa ApiKeyModal.tsx (border + text + bg màu ngách)
[ ] Sửa aiService.ts (storage keys prefix + X-Title)
[ ] Sửa SpyModule.tsx (labels + màu + ⭐ AI prompt text)
[ ] Sửa ScriptModule.tsx (market + labels + ⭐ mode names)
[ ] Sửa SeoModule.tsx (default + fallback market)
[ ] Sửa package.json (tên package)
[ ] npm run dev → test visual + kiểm tra KHÔNG còn text ngách cũ
[ ] npm run build → 0 errors
[ ] Xóa file .php gốc nếu có
[ ] git init → git add → git commit
[ ] npx vercel --prod --yes → deploy
```

---

## 🚨 BẪY THƯỜNG GẶP (RÚT KINH NGHIỆM)

| # | Bẫy | Hậu quả | Cách tránh |
|---|---|---|---|
| 1 | Quên sửa `ANALYZE PSYCHOLOGY CONTENT` trong SpyModule | AI phân tích sai ngách | Search toàn bộ `PSYCHOLOGY\|CRIME\|tâm lý` |
| 2 | Quên sửa mode names `DAILY WISDOM` trong ScriptModule | UI hiện tên ngách cũ | Search `DAILY WISDOM\|CONCEPT EXPLAINER\|DEEP DIVE` |
| 3 | Copy file `.php` 200KB+ vào repo | Repo phình to vô nghĩa | Xóa `.php` trước khi commit |
| 4 | Dùng `&&` trong PowerShell cũ | Lệnh lỗi syntax | Chạy từng lệnh riêng hoặc dùng `;` |
| 5 | Dùng `--name` flag với Vercel CLI mới | Warning deprecated | Bỏ `--name`, đổi tên trên Dashboard |

---

**© TUAI — 08.14.666.040**
