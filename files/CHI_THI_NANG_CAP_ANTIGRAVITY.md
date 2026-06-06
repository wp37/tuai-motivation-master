# CHỈ THỊ NÂNG CẤP: MOTIVATION MASTER → BATCH v2 + NGƯỜI QUE OPTIMIZATION

> **Project:** motivation (React + Vite + TypeScript)
> **Mục tiêu:** Nâng cấp hệ thống sinh kịch bản để hỗ trợ video dài không kiệt quota API,
> giữ nhất quán giọng kể qua các batch, và tối ưu cho niche người que / whiteboard sketch.
> **Phạm vi:** 2 file REPLACE + 2 file PATCH. Không thay đổi App.tsx, SpyModule, StudioModule, SeoModule, components.

---

## TỔNG QUAN THAY ĐỔI

### Vấn đề hiện tại:
1. Video dài (>3 phút) → AI phải sinh 15-25 scenes trong 1 lần gọi → response quá lớn → timeout/truncate JSON → crash
2. Gặp lỗi 429 quota → retry 6 lần liên tục → burn thêm quota → UX đứng hình
3. Key rotation reset khi reload trang → key đầu tiên luôn bị dùng nhiều nhất
4. generateImage fail → không thử key khác
5. Khi chia batch, giọng kể nhảy tone giữa các phần

### Giải pháp:
1. **Batch splitting** — chia video dài thành nhiều call nhỏ (6 scenes/call)
2. **Voice fingerprinting** — trích mẫu giọng kể từ batch trước → truyền cho batch sau
3. **Narrative arc tracking** — mỗi batch biết mình đang ở OPENING/RISING/CLIMAX/CLOSING
4. **Smart retry** — giảm retry, exponential backoff, persist key index
5. **Progress UI** — hiển thị "Batch 2/4 — 50%" realtime, stream scenes lên UI từng phần

---

## BƯỚC 1: REPLACE `src/services/aiService.ts`

Xóa toàn bộ nội dung file `src/services/aiService.ts` và thay bằng code dưới đây.

**Lý do thay hoàn toàn:** Cấu trúc retry, key rotation, và batch logic thay đổi xuyên suốt file.
Không thể patch từng đoạn mà giữ consistency.

### Những thay đổi chính trong file này:

```
STORAGE_KEYS → SK (rút gọn tên biến)
  + Thêm: SK.keyIndex = 'moti_key_index' (persist key rotation qua reload)

BATCH_CONFIG (MỚI):
  maxScenesPerBatch: 6    — số scene tối đa mỗi lần gọi AI
  batchDelay: 1200        — ms delay giữa các batch (chống burst 429)
  maxRetriesPerCall: 3    — giảm từ 6 xuống 3 (đủ để rotate key, không burn quota)
  quotaBackoffBase: 3000  — ms chờ khi gặp 429, nhân với attempt number

getNextKey():
  + Thêm: localStorage.setItem(SK.keyIndex, ...) — persist rotation

safeJSONParse():
  + Nâng cấp: auto-repair JSON truncated
    - Đếm { [ chưa đóng → tự thêm } ]
    - Fix chuỗi string chưa đóng (đếm dấu " lẻ)

callGoogleWithRetry() → callGoogle():
  - Retry: 6 → 3
  - Backoff: linear → exponential (3000 * attempt)
  - Logging: chi tiết hơn

callAIBatched() (HÀM MỚI):
  - Input: buildPrompt function, systemPrompt, totalScenes, onProgress callback
  - Logic: chia totalScenes thành ceil(total/6) batch
  - Mỗi batch gọi callAI() độc lập
  - onProgress callback stream kết quả từng phần lên UI
  - Delay giữa các batch = batchDelay ms

generateImage():
  + Nâng cấp: thử tối đa 3 keys khác nhau khi fail (thay vì chỉ 1 key)
```

### Code hoàn chỉnh:

THAY THẾ TOÀN BỘ NỘI DUNG FILE `src/services/aiService.ts` BẰNG NỘI DUNG CỦA FILE
`aiService.ts` ĐÃ ĐƯỢC CUNG CẤP (348 dòng).

---

## BƯỚC 2: REPLACE `src/pages/ScriptModule.tsx`

Xóa toàn bộ nội dung file `src/pages/ScriptModule.tsx` và thay bằng code mới.

### Những thay đổi chính trong file này:

```
Import thêm: callAIBatched, BATCH_CONFIG

Hàm mới — buildBatchPrompt():
  Tạo prompt cho từng batch, bao gồm:
  - Vị trí narrative arc (OPENING 0-20% / RISING 20-40% / CLIMAX 40-70% / 
    RESOLUTION 70-90% / CLOSING 90-100%)
  - Voice fingerprint: 3 câu voice_text mẫu từ batch trước (đầu/giữa/cuối)
  - lastVoiceEnding: 60 ký tự cuối cùng → batch mới nối tiếp tự nhiên
  - Chỉ thị BẮT BUỘC giữ nguyên cách xưng hô, nhịp câu, tone cảm xúc

Interface BatchContext:
  voiceFingerprint: string   — 2-3 câu voice mẫu
  lastSceneNumber: number
  lastSection: string
  lastVoiceEnding: string    — 60 ký tự cuối

Hàm mới — extractBatchContext():
  Lấy "dấu vân tay giọng kể" từ scenes đã tạo
  Trích voice_text ở 3 vị trí: scene đầu, giữa, cuối
  → AI đọc mẫu này để copy giọng

State mới:
  batchProgress: { done: number; total: number } | null

Logic handleGenerate() thay đổi:
  - Nếu totalBatches <= 1 → single call như cũ (không thay đổi)
  - Nếu totalBatches > 1 → gọi callAIBatched() với:
    + buildBatchPrompt (truyền context)
    + onProgress callback (cập nhật UI realtime)
    + Stream segments vào UI sau mỗi batch

Component mới — BatchProgressBar:
  Thanh tiến trình gradient cam → vàng
  Hiện "Đang tạo batch 2/4" + phần trăm
  Ghi chú "Scenes đang stream dần — cuộn xuống để xem kết quả từng phần"

Hàm mới — applyStyleEnforce():
  Tách logic enforce visual style ra utility function (clean code)

UI thay đổi:
  + Badge "X batch calls" cạnh số cảnh khi video dài
  + Progress bar khi đang batch
```

### Code hoàn chỉnh:

THAY THẾ TOÀN BỘ NỘI DUNG FILE `src/pages/ScriptModule.tsx` BẰNG NỘI DUNG CỦA FILE
`ScriptModule.tsx` ĐÃ ĐƯỢC CUNG CẤP (491 dòng).

---

## BƯỚC 3: PATCH `src/data/prompts.ts`

KHÔNG xóa file. Chỉ THÊM đoạn sau vào CUỐI biến `SYSTEM_PROMPT_SCRIPT_WRITER`,
ngay TRƯỚC dấu backtick đóng (`` ` ``).

### Tìm vị trí:

```typescript
// Tìm đoạn cuối cùng của SYSTEM_PROMPT_SCRIPT_WRITER, có dạng:
      "strategy_note": "Ghi chú chiến lược cảm xúc..."
    }
  ]
}`;    // ← backtick đóng ở đây
```

### Thêm TRƯỚC backtick đóng:

```

# QUY TẮC BATCH — GIỮ NHẤT QUÁN GIỌNG KỂ (BẮT BUỘC KHI CÓ CONTINUATION_CONTEXT):
Khi prompt user có mục "GIỮ NHẤT QUÁN GIỌNG KỂ":
1. ĐỌC KỸ "voice_fingerprint" — đó là MẪU giọng kể bạn PHẢI bắt chước.
2. COPY CHÍNH XÁC: cách xưng hô (bạn/ta/mình), nhịp câu (ngắn gọn hay dài),
   mức độ cảm xúc (trầm hay sôi nổi), cách dùng ẩn dụ, cách đặt câu hỏi tu từ.
3. KHÔNG BAO GIỜ reset giọng — đây là 1 câu chuyện liền mạch, 1 video duy nhất.
4. Câu voice_text ĐẦU TIÊN phải nối tự nhiên với câu cuối batch trước.
5. KHÔNG lặp lại nội dung đã nói — chỉ tiếp tục narrative arc.
6. Nhân vật [CHAR_001] giữ nguyên ngoại hình và continuity xuyên suốt.

# QUY TẮC NGƯỜI QUE / WHITEBOARD SKETCH ĐẶC BIỆT:
Khi VISUAL_STYLE chứa "whiteboard" hoặc "Whiteboard Sketch":
- Mỗi scene phải có HÀNH ĐỘNG/TƯ THẾ KHÁC NHAU cho [CHAR_001]
- KHÔNG lặp lại pose giống nhau 2 scene liên tiếp
- Ưu tiên: biểu cảm qua ngôn ngữ cơ thể (cúi đầu = buồn, giơ tay = chiến thắng,
  ngồi bó gối = cô đơn, bước đi = quyết tâm, chạy = khẩn cấp)
- Background phải thay đổi hoặc evolve theo arc: đơn giản → phức tạp → rõ ràng
- Dùng visual metaphor: bức tường = rào cản, cầu thang = tiến bộ,
  ngọn núi = mục tiêu, mặt trời = hy vọng, mưa = khó khăn
```

### Kết quả sau khi patch:

```typescript
export const SYSTEM_PROMPT_SCRIPT_WRITER = `# SYSTEM ROLE: ...
...
      "strategy_note": "Ghi chú chiến lược cảm xúc..."
    }
  ]
}

# QUY TẮC BATCH — GIỮ NHẤT QUÁN GIỌNG KỂ (BẮT BUỘC KHI CÓ CONTINUATION_CONTEXT):
...
# QUY TẮC NGƯỜI QUE / WHITEBOARD SKETCH ĐẶC BIỆT:
...
`;
```

---

## BƯỚC 4: PATCH `src/data/constants.ts`

KHÔNG xóa file. Chỉ SỬA mảng `MODE_OPTIONS` để thêm 2 mode mới phù hợp niche người que.

### Tìm và THAY THẾ:

```typescript
// TÌM đoạn này:
export const MODE_OPTIONS = [
  { id: 'quick', name: '🟢 DAILY SPARK', desc: '<3m — Short, punchy motivation', scenes: 3, icon: '⚡' },
  { id: 'story', name: '🔵 GROWTH GUIDE', desc: '3-10m — In-depth stories', scenes: 5, icon: '📖' },
  { id: 'deep',  name: '🟣 TRANSFORMATION SAGA', desc: '>10m — Deep transformations',  scenes: 8, icon: '🎬' },
];
```

```typescript
// THAY BẰNG:
export const MODE_OPTIONS = [
  { id: 'quick', name: '🟢 DAILY SPARK',   desc: '<3m — Ngắn gọn, punch mạnh (kiểu Improvement Pill)', scenes: 3, icon: '⚡' },
  { id: 'pill',  name: '💊 DAILY PILL',     desc: '5-8m — 1 concept, 1 bài học (format viral nhất)', scenes: 10, icon: '💊' },
  { id: 'story', name: '🔵 GROWTH GUIDE',   desc: '8-12m — Câu chuyện sâu, nhiều lớp cảm xúc', scenes: 5, icon: '📖' },
  { id: 'skool', name: '📝 AFTER SKOOL',    desc: '12-18m — Triết lý sâu, vẽ phát triển dần', scenes: 16, icon: '📝' },
  { id: 'deep',  name: '🟣 TRANSFORMATION', desc: '>18m — Hành trình thay đổi hoàn chỉnh', scenes: 8, icon: '🎬' },
];
```

### Lưu ý: ScriptModule tự detect mode dựa trên duration, KHÔNG dùng trường `scenes` trong MODE_OPTIONS
(trường scenes chỉ dùng cho hiển thị gợi ý). Logic scene count thực tế nằm trong hàm `calculateScenes()`.

---

## BƯỚC 5: KIỂM TRA

Chạy lần lượt:

```bash
npm run build
```

Kỳ vọng: **0 errors, 0 warnings liên quan đến type**

Nếu có lỗi TypeScript:
- Kiểm tra import `callAIBatched` và `BATCH_CONFIG` từ `../services/aiService`
- Kiểm tra interface `BatchContext` có trong ScriptModule.tsx
- Kiểm tra `EMPTY_CONTEXT` có trong ScriptModule.tsx

Sau đó:

```bash
npm run dev
```

Test thủ công:
1. Tab Script → nhập chủ đề → chọn 1 phút → nhấn tạo → phải chạy single call (không có progress bar)
2. Tab Script → chọn 8 phút → phải thấy badge "X batch calls" → nhấn tạo → phải có progress bar
3. Khi batch đang chạy → scenes phải xuất hiện dần trên UI (không chờ hết mới hiện)
4. Đọc voice_text giữa các scene — giọng kể phải nhất quán, không nhảy tone

---

## TÓM TẮT FILE

| File | Hành động | Dòng |
|------|----------|------|
| `src/services/aiService.ts` | REPLACE hoàn toàn | 348 dòng |
| `src/pages/ScriptModule.tsx` | REPLACE hoàn toàn | 491 dòng |
| `src/data/prompts.ts` | PATCH — thêm 2 block vào cuối SYSTEM_PROMPT_SCRIPT_WRITER | +18 dòng |
| `src/data/constants.ts` | PATCH — sửa MODE_OPTIONS | sửa 5 dòng |

Tất cả file khác (App.tsx, SpyModule, StudioModule, SeoModule, Header, Sidebar, Toast,
ApiKeyModal, index.tsx, index.css, vite.config.ts) → **KHÔNG THAY ĐỔI**.

---

## LƯU Ý QUAN TRỌNG

1. **KHÔNG sửa App.tsx** — API interface giữa App và ScriptModule không thay đổi
   (`onScriptGenerated` vẫn nhận cùng params)

2. **KHÔNG xóa SECONDS_PER_SCENE** trong constants.ts — dù không còn dùng trực tiếp,
   StudioModule có thể reference

3. **Encoding UTF-8** — tất cả file phải save với encoding UTF-8 (không BOM).
   Các chuỗi tiếng Việt trong code phải giữ nguyên dấu.

4. **Nội dung 2 file REPLACE** được cung cấp riêng:
   - `aiService.ts` (348 dòng)
   - `ScriptModule.tsx` (491 dòng)
   Hãy lấy CHÍNH XÁC nội dung từ 2 file đó, KHÔNG tự viết lại.
