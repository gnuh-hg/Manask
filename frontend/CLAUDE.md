# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Khi bắt đầu bất kỳ task nào:** đọc `AGENTS.md` trước — file đó chứa API endpoints, idb.js, i18n, design system, và hướng dẫn ui-gallery. `CLAUDE.md` tự động load còn `AGENTS.md` thì không.

---

<!--
╔══════════════════════════════════════════════════════════════════╗
║  TEMPLATE & QUY TẮC — ĐỌC TRƯỚC KHI CHỈNH SỬA FILE NÀY        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  [KEEP]  Không bao giờ xóa hoặc ghi đè.                        ║
║          Chỉ được bổ sung thêm vào cuối section.                ║
║          Dùng cho: gotcha đã học từ lỗi thực tế,               ║
║          ràng buộc kỹ thuật cứng không được vi phạm.            ║
║                                                                  ║
║  [EDIT]  Có thể sửa nội dung, nhưng giữ nguyên section.        ║
║          Dùng cho: API, hướng dẫn sử dụng, danh sách cần        ║
║          cập nhật khi project thay đổi.                         ║
║                                                                  ║
║  [TEMP]  Có thể ghi đè toàn bộ hoặc xóa khi hết giá trị.      ║
║          Dùng cho: ghi chú tạm thời, context phiên làm việc.    ║
║                                                                  ║
║  QUY TẮC KHI CẬP NHẬT:                                         ║
║    - Section mới mặc định là [EDIT]                             ║
║    - [KEEP] chỉ dùng khi thực sự bất biến — đừng lạm dụng      ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
-->

---

## [EDIT] Chạy project

Không có build step. Chạy trực tiếp bằng HTTP server (bắt buộc vì dùng ES6 modules):

```bash
python -m http.server 8080
# hoặc
npx http-server . -p 8080
```

Truy cập `http://localhost:8080`. **Không mở file:// trực tiếp** — ES modules bị chặn bởi CORS.

Kích hoạt test mode (dùng mock data, bỏ qua API thật): thêm `?test` vào URL.

---

## [EDIT] Kiến trúc tổng quan

Vanilla JS thuần — không có framework, không có bundler, không có TypeScript. Mỗi trang là một file HTML tĩnh load module JS riêng.

### Luồng khởi động mỗi trang

```
HTML load → sidebar_global.js inject sidebar vào <body>
          → trang-cu-the.js: DOMContentLoaded → initI18n() → kiểm tra token → fetch data
```

### Giao tiếp giữa các component

Các component không import nhau trực tiếp — dùng Custom Events:

| Event | Phát từ | Nhận tại |
|-------|---------|---------|
| `projectSelected` | `sidebar_nav.js` | `container_task.js` |
| `projectUpdated` | `sidebar_nav.js` | `container_task.js` |
| `projectDeleted` | `sidebar_nav.js` | `container_task.js` |
| `langChanged` | `i18n.js` | Toàn bộ trang |

### State management (không dùng thư viện)

- **Module-level variables** — trạng thái cục bộ trong từng JS file
- **localStorage** — token, user_id, ngôn ngữ, project đang chọn
- **IndexedDB** (`idb.js`) — dữ liệu offline, hàng đợi request
- **Custom Events** — đồng bộ giữa các module

**localStorage keys quan trọng:**

Device-level (không prefix, dùng chung):

| Key | Mô tả |
|-----|-------|
| `access_token` | JWT token xác thực |
| `user_id` | ID số nguyên của user (lấy từ `GET /user-id` sau login, xóa khi logout) |
| `lang` | Ngôn ngữ (`en` / `vi`) |

User-scoped (prefix `u{user_id}_`, dùng helpers trong utils.js):

| Key | Mô tả |
|-----|-------|
| `selectedProjectId` | Project đang xem |
| `selectedProjectName` | Tên project đang xem |
| `username` | Tên hiển thị |
| `email` | Email user |
| `sidebarLength` | Số folder sidebar |
| `pomodoro_*` | 8 settings Pomodoro |

**Không dùng `localStorage` trực tiếp** cho user-scoped keys — dùng `utils.getUserItem/setUserItem/removeUserItem`. Gọi `await utils.ensureUserId()` sớm trong `DOMContentLoaded` của mọi trang protected.

---

## [EDIT] utils.js

**Exports quan trọng:**

```javascript
import * as utils from './utils.js';

utils.URL_API          // "https://backend-u1p2.onrender.com"
utils.TEST             // true nếu URL có ?test, dùng để branch mock data
utils.generateId()     // timestamp-based ID (tránh collision giữa các tab)
utils.showSuccess(msg) // toast xanh (tự dismiss 4s, tối đa 5 cùng lúc)
utils.showError(msg)
utils.showWarning(msg)
utils.showInfo(msg)
utils.showLoading()    // loading overlay (debounce 500ms)
utils.hideLoading()    // phải match đúng số lần gọi showLoading
```

**fetchWithAuth** — luôn dùng thay vì `fetch()` trực tiếp:

```javascript
const response = await utils.fetchWithAuth(url, fetchOptions, {
    enableQueue: true,       // Xếp hàng khi offline (default: false)
    optimisticData: obj,     // Trả về ngay trước khi server phản hồi
    onLoadStart: fn,
    onLoadEnd: fn
});
```

**Hành vi quan trọng:**

- `401` → tự redirect `/pages/auth.html`
- `4xx` (trừ 429) → không retry, không queue
- `5xx` / `429` → retry với exponential backoff (timeout: 10s lần đầu, 30s khi retry)
- Mất mạng + `enableQueue: true` → lưu vào IndexedDB `offlinequeue`, trả về response status 202 với header `X-Queued: true`
- Khi có mạng trở lại → `flushQueue()` tự chạy, dùng token mới nhất từ localStorage

---

## [EDIT] idb.js — IndexedDB

**Bắt buộc:** Gọi `registerStore(name)` **trước** `initDB()` — store phải được khai báo trước khi DB mở.

```javascript
import * as idb from './idb.js';

idb.registerStore('my-store');
await idb.initDB();

await idb.putData('my-store', { id: '123', name: 'item' });
await idb.getData('my-store', '123');
await idb.getAllData('my-store');
await idb.patchData('my-store', '123', { name: 'updated' });
await idb.deleteData('my-store', '123');
```

Queue store `offlinequeue` đã được pre-register sẵn trong `idb.js`.

---

## [EDIT] i18n.js

```javascript
import { t, initI18n, setLang } from './i18n.js';

await initI18n(); // Gọi đầu tiên trong DOMContentLoaded

t('home.task_name_placeholder')         // Chuỗi đơn
t('home.task_count', { count: 5 })      // Với biến {{count}}
```

HTML attributes: `data-i18n`, `data-i18n-placeholder`, `data-i18n-title`, `data-i18n-html`.

**Khi thêm chuỗi mới:** cập nhật cả `locales/en.json` và `locales/vi.json`.

Namespace keys: `home.*`, `sidebar.*`, `pomodoro.*`, `chatbot.*`, `statistics.*`, `roadmap.*`, `auth.*`, `utils.*`, `about.*`.

---

## [EDIT] sidebar_global.js

Inject sidebar tự động vào `<body>` của mọi trang. Để thêm trang mới:

```html
<link rel="stylesheet" href="../css/sidebar_global.css">
<script type="module" src="../js/sidebar_global.js" defer></script>
```

Bọc nội dung trang trong `<div class="app-content">` để tránh bị sidebar che.

- `PUBLIC_PAGES = ['about', 'auth']` — không cần token
- `AUTO_COLLAPSE_PAGES = ['roadmap', 'chatbot']` — tự thu gọn khi load
- Sidebar gọi `GET /account`, `PATCH /account`, `PATCH /account/password`

---

## [EDIT] Loading overlay

`utils.showLoading()` / `utils.hideLoading()` dùng counter — các lời gọi lồng nhau phải match nhau. Overlay xuất hiện sau debounce 500ms (tránh flash khi request nhanh).

---

## [KEEP] Các điểm dễ sai

- **Path routing:** `sidebar_global.js` và `sidebar_nav.js` tự detect xem đang chạy từ root hay `/pages/` qua `window.location.pathname` để build link đúng.
- **Project selection:** `container_task.js` restore project cuối bằng cách re-dispatch `projectSelected` event từ localStorage — không đọc trực tiếp.
- **ID generation:** Dùng `utils.generateId()` (timestamp-based) khi tạo ID client-side để tránh collision giữa các tab.
- **Toast limit:** Tối đa 5 toast đồng thời — toast cũ nhất bị xóa khi vượt quá.

---

## [EDIT] UI Gallery

`ui-gallery/` chứa các HTML snippet self-contained mô phỏng từng tính năng của app —
thay thế screenshot tĩnh bằng animation nhúng được qua `<iframe>`.

### Khi nào cần tạo/sửa snippet

- **Tạo mới**: khi app có tính năng mới chưa có snippet nào mô phỏng.
- **Sửa data**: khi nội dung hiển thị trong snippet không còn phù hợp (dùng data đời thường, ai cũng hiểu — không dùng tên project/task chuyên môn của user).
- **Không tạo snippet** chỉ để test style hay logic của app chính.

### Cách xem

Chạy HTTP server rồi mở `http://localhost:8080/ui-gallery/`.
Trang `index.html` hiện grid preview, filter theo category, nút **Copy embed** để lấy `<iframe>`.

### Cách thêm snippet mới

1. Copy `ui-gallery/_template/snippet.html` → `ui-gallery/snippets/<category>/<category>-<component>.html`
2. Đặt `width` / `height` cố định trực tiếp trên `body` (px), thêm `background: transparent` và `position: relative`.
3. Viết markup, CSS, animation. **Không import** từ `/js/` hay `/css/` của app.
4. JS bọc trong IIFE `(function(){ ... })()`.
5. Thêm entry vào `ui-gallery/snippets/manifest.json` theo schema sau:

```json
{
  "id": "category-component",
  "title": "Tên tiếng Việt",
  "category": "tasks",
  "file": "tasks/tasks-component.html",
  "width": 360,
  "height": 300,
  "description": "Mô tả ngắn 1 câu.",
  "tags": ["animation", "tasks"]
}
```

1. Mở `http://localhost:8080/ui-gallery/` để kiểm tra preview.

### Quy ước

- File: `<category>-<component>.html` (kebab-case), đặt trong `snippets/<category>/`.
- Import style: `../../shared/reset.css` rồi `../../shared/tokens.css` — không dùng CSS inline cho tokens.
- Kích thước body: đặt `width` / `height` cố định trực tiếp bằng px — **không dùng 100vw/100vh**.
- Animation tự chạy, loop vô hạn.
- Text trong snippet: tiếng Việt cố định (không i18n).
- JS viết trong IIFE `(function(){ ... })()`.
- Theme dark-only.
- **`scrolling="no"`** khi nhúng qua `<iframe>` (gallery index.html đã tự thêm; cần thêm thủ công khi embed nơi khác).

### Nguyên tắc scene (áp dụng toàn bộ 13 snippet hiện có)

Mọi snippet theo pattern **scene approach** — body transparent, các thành phần UI là box nổi riêng tạo cảnh 3D:

| Thành phần | Quy tắc |
|---|---|
| `body` | `background: transparent` · `position: relative` · tilt nhẹ qua `transform: perspective() rotateX() rotateY()` |
| Box chính | `background: var(--bg-surface)` · `border-radius: var(--radius-lg)` · `box-shadow` nặng + glow color |
| Box phụ | `background: var(--bg-elevated)` · `border-radius: var(--radius-md)` · shadow nhẹ, không glow |
| Vị trí box phụ | Lệch trái (`align-self: flex-start; margin-left: 4px`) hoặc phải (`flex-end; margin-right: 4px`), width ~75–82% — không căn giữa |
| Overlap | `margin-bottom: -14px` trên box phía trên để tạo depth rõ ràng |
| Float animation | `@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }` · 3s ease-in-out infinite · áp lên **tất cả** box |
| Float phase | Box phụ trên: `0s` · Box chính: `~1s` · Box phụ dưới: `1.5s` — lệch pha tạo cảm giác organic |
| Glow pool | `radial-gradient + filter: blur(26px)` · `position: absolute; z-index: 0` · phía sau box chính |

**Ngoại lệ:**

- `S-12` Login: `box-form` FIXED (không float) — form cần stable; body không tilt
- `S-13` Modal: `.modal` FIXED — modal cần stable; body không tilt
- `S-01` Sidebar: sidebar + content **sync** cùng phase (vì là 1 layout unit)
- `S-07` Heatmap: chip-header + box-heatmap **sync** cùng phase

**Categories hiện có:** `sidebar` · `pomodoro` · `toast` · `chatbot` · `tasks` · `statistics` · `auth` · `roadmap`

### 13 Snippet hiện có

| # | Tên | File | W×H | Ghi chú scene |
|---|-----|------|-----|--------------|
| S-01 | Sidebar collapse | `sidebar/sidebar-collapse.html` | 320×360 | Sync float, không tilt |
| S-02 | Pomodoro timer | `pomodoro/pomodoro-timer.html` | 280×320 | Glow amber/green đổi theo phase |
| S-03 | Task list | `tasks/tasks-list.html` | 360×300 | 4 card box nổi độc lập, stagger |
| S-04 | Line chart | `statistics/statistics-charts.html` | 420×260 | Dual glow indigo+green |
| S-05 | Toast stack | `toast/toast-stack.html` | 340×220 | Skeleton backdrop, glow màu theo loại toast |
| S-06 | Folder tree | `tasks/tasks-folder-tree.html` | 240×340 | Stagger float theo folder |
| S-07 | Heatmap activity | `statistics/statistics-heatmap.html` | 400×160 | Sync float, dual glow amber+indigo |
| S-08 | Donut chart | `statistics/statistics-donut.html` | 280×260 | Dual glow indigo+green |
| S-09 | Task detail card | `tasks/tasks-task-detail.html` | 320×340 | 3 box lệch trái/phải/trái |
| S-10 | Chat bubble | `chatbot/chatbot-bubble.html` | 300×360 | Glow cyan, badge ✦ AI float |
| S-11 | Roadmap node graph | `roadmap/roadmap-timeline.html` | 420×200 | Scene float (SVG+nodes cùng pha), progress pill |
| S-12 | Login form | `auth/auth-login.html` | 320×360 | Không tilt, box-form FIXED |
| S-13 | Modal tạo folder | `tasks/tasks-modal-create.html` | 340×320 | Không tilt, modal FIXED, folder icon float |

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **frontend** (1647 symbols, 3097 relationships, 143 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/frontend/context` | Codebase overview, check index freshness |
| `gitnexus://repo/frontend/clusters` | All functional areas |
| `gitnexus://repo/frontend/processes` | All execution flows |
| `gitnexus://repo/frontend/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
