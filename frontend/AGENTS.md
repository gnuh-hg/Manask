# AGENTS.md — Manask Frontend

Hướng dẫn toàn diện cho AI agents làm việc với dự án này.

---

<!--
╔══════════════════════════════════════════════════════════════════╗
║  TEMPLATE & QUY TẮC — ĐỌC TRƯỚC KHI CHỈNH SỬA FILE NÀY        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  [KEEP]  Không bao giờ xóa hoặc ghi đè.                        ║
║          Chỉ được bổ sung thêm vào cuối section.                ║
║          Dùng cho: quy ước code bất biến, ràng buộc kỹ thuật    ║
║          cứng, danh sách "không có" của project.                ║
║                                                                  ║
║  [EDIT]  Có thể sửa nội dung, nhưng giữ nguyên section.        ║
║          Dùng cho: API, cấu trúc thư mục, hướng dẫn sử dụng,   ║
║          danh sách cần cập nhật khi project thay đổi.           ║
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

## [EDIT] Tổng quan

Manask là ứng dụng quản lý công việc (task manager) với giao diện dark-theme, hỗ trợ offline, đa ngôn ngữ (EN/VI). Đây là **vanilla JavaScript** không có build tool, không có bundler, không có framework UI.

**Công nghệ chính:**

- Ngôn ngữ: Vanilla JavaScript (ES6 modules)
- CSS: Thuần CSS với CSS variables (design tokens)
- Lưu trữ: IndexedDB (offline-first) + localStorage
- HTTP: Fetch API với wrapper tùy chỉnh
- i18n: Hệ thống dịch tự viết (EN/VI)
- Thư viện ngoài duy nhất: Sortable.js v1.15.0 (drag-drop)

---

## [EDIT] Cấu trúc thư mục

```
frontend/
├── index.html                  # Dashboard chính (trang chủ)
├── pages/                      # Các trang riêng lẻ
│   ├── auth.html               # Đăng nhập / Đăng ký
│   ├── chatbot.html            # AI Chat assistant
│   ├── pomodoro.html           # Bộ đếm giờ Pomodoro
│   ├── roadmap.html            # Trình soạn thảo roadmap
│   ├── statistics.html         # Thống kê & phân tích
│   └── about.html              # Giới thiệu
│
├── js/                         # Logic ứng dụng
│   ├── home.js                 # Bootstrap cho dashboard
│   ├── auth.js                 # Xác thực người dùng
│   ├── chatbot.js              # Tính năng AI chat
│   ├── pomodoro.js             # Tính năng đếm giờ
│   ├── roadmap.js              # Trình soạn thảo roadmap
│   ├── statistics.js           # Trang thống kê
│   ├── about.js                # Trang giới thiệu
│   ├── sidebar_global.js       # Sidebar toàn cục (inject vào mọi trang)
│   ├── home/                   # Components của dashboard
│   │   ├── sidebar_nav.js      # Điều hướng folder/project
│   │   └── container_task.js   # Giao diện quản lý task
│   └── statistics/             # Components biểu đồ
│       ├── summary.js          # Số liệu tóm tắt
│       ├── line_chart.js       # Biểu đồ đường
│       ├── donut_chart.js      # Biểu đồ tròn
│       └── heatmap.js          # Heatmap
│
├── css/                        # Styles
│   ├── base.css                # Design tokens, typography, resets
│   ├── home.css                # Layout dashboard
│   ├── auth.css                # Trang đăng nhập
│   ├── chatbot.css             # UI chat
│   ├── pomodoro.css            # UI đếm giờ
│   ├── roadmap.css             # UI roadmap
│   ├── sidebar_global.css      # Styles sidebar toàn cục
│   ├── home/                   # Styles components dashboard
│   │   ├── sidebar_nav.css
│   │   └── container_task.css
│   └── statistics/             # Styles biểu đồ
│       ├── summary.css
│       ├── line_chart.css
│       ├── donut_chart.css
│       └── heatmap.css
│
├── locales/                    # Bản dịch
│   ├── en.json                 # Tiếng Anh (591 dòng)
│   └── vi.json                 # Tiếng Việt (591 dòng)
│
├── img/                        # Ảnh / assets
│   ├── logo_web.png
│   └── logo_web_v2.png
│
├── utils.js                    # Tiện ích dùng chung (API, toast, offline queue)
├── i18n.js                     # Hệ thống đa ngôn ngữ
├── idb.js                      # Wrapper IndexedDB
├── ui-gallery/                 # UI snippet illustrations (animations nhúng qua iframe)
│   ├── index.html              # Gallery browse page — grid preview, filter, copy embed
│   ├── shared/
│   │   ├── tokens.css          # CSS variables dark theme (mirror của css/base.css)
│   │   └── reset.css           # CSS reset tối thiểu
│   ├── _template/
│   │   ├── snippet.html        # Boilerplate snippet (IIFE JS, fixed size, token imports)
│   │   └── meta.json           # Template schema cho manifest entry
│   └── snippets/               # 13 snippets tổ chức theo category
│       └── manifest.json       # Danh sách toàn bộ snippet (source of truth cho gallery)
└── README.md
```

---

## [EDIT] API & Backend

**Base URL:** `https://backend-u1p2.onrender.com`

Được cấu hình tại `utils.js`:

```javascript
const URL_API = "https://backend-u1p2.onrender.com";
```

### Các endpoint

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/auth/login` | Đăng nhập (email + password) |
| POST | `/auth/signup` | Đăng ký (name + email + password) |
| POST | `/auth/change-password` | Đổi mật khẩu |
| GET | `/auth/profile` | Lấy thông tin profile |
| PUT | `/auth/profile` | Cập nhật tên hiển thị |
| GET | `/folders` | Danh sách folders |
| POST | `/folders` | Tạo folder |
| PUT | `/folders/:id` | Sửa folder |
| DELETE | `/folders/:id` | Xóa folder |
| GET | `/projects` | Danh sách projects |
| POST | `/projects` | Tạo project |
| PUT | `/projects/:id` | Sửa project |
| DELETE | `/projects/:id` | Xóa project |
| GET | `/project/:id/items` | Danh sách tasks |
| POST | `/project/:id/items` | Tạo task |
| PUT | `/project/:id/items/:taskId` | Sửa task |
| PATCH | `/project/:id/items/:taskId` | Cập nhật một phần task |
| DELETE | `/project/:id/items/:taskId` | Xóa task |
| GET | `/statistic/summary` | Số liệu tóm tắt |
| GET | `/statistic/line-chart` | Dữ liệu biểu đồ đường |
| GET | `/statistic/heatmap` | Dữ liệu heatmap |
| GET | `/statistic/donut-chart` | Dữ liệu biểu đồ tròn |
| GET | `/chatbot/history` | Lịch sử hội thoại AI |
| POST | `/chatbot` | Gửi tin nhắn AI |
| POST | `/chatbot/save/folder-tree` | Lưu folder tree do AI tạo |
| POST | `/chatbot/save/roadmap` | Lưu roadmap do AI tạo |
| POST | `/chatbot/onboarding` | Intent prompt: sinh folder-tree + roadmap từ message của user mới, auto-save. Body: `{ message: string }`. Response: `{ folder_tree: { title, tree[] }, roadmap: { title, nodes[], edges[], panX, panY, zoom }, summary: string }` |
| POST | `/roadmap` | Tạo roadmap |
| GET | `/roadmap/:id` | Lấy roadmap |
| PUT | `/roadmap/:id` | Cập nhật roadmap |
| DELETE | `/roadmap/:id` | Xóa roadmap |
| GET | `/user-id` | Lấy `{ user_id: int }` của user hiện tại (gọi sau login/signup) |
| GET | `/account` | Lấy thông tin tài khoản (sidebar_global) |
| PATCH | `/account` | Cập nhật tên hiển thị (sidebar_global) |
| PATCH | `/account/password` | Đổi mật khẩu (sidebar_global) |

### Các export của utils.js

```javascript
import * as utils from '../utils.js';

utils.URL_API          // "https://backend-u1p2.onrender.com"
utils.TEST             // true khi URL có ?test — dùng để branch mock data
utils.generateId()     // timestamp-based ID (tmp-{ts}{seq}), tránh collision giữa tab
utils.showSuccess(msg) // toast xanh (auto-dismiss 4s, tối đa 5 toast)
utils.showError(msg)
utils.showWarning(msg)
utils.showInfo(msg)
utils.showLoading()    // loading overlay (debounce 500ms, phải pair với hideLoading)
utils.hideLoading()
```

### Cách gọi API

Luôn dùng `utils.fetchWithAuth()` thay vì `fetch()` trực tiếp:

```javascript
import * as utils from '../utils.js';

const response = await utils.fetchWithAuth(
    `${utils.URL_API}/project/${projectId}/items`,
    {
        method: 'POST',
        body: JSON.stringify({ name: 'Task mới', status: 'todo' })
    },
    {
        enableQueue: true,        // Cho phép xếp hàng offline
        optimisticData: taskObj,  // Dữ liệu hiển thị trước khi server phản hồi
        onLoadStart: showSpinner,
        onLoadEnd: hideSpinner
    }
);
```

**Xử lý lỗi:**

- `401` → tự động redirect đến `/pages/auth.html`
- `4xx` → trả về response để xử lý ở phía gọi
- `5xx` → tự động retry với exponential backoff
- Offline → request được đưa vào hàng đợi IndexedDB

---

## [EDIT] Xác thực (Auth)

**Luồng:**

1. Đăng nhập tại `/pages/auth.html`
2. Backend trả về `access_token` (JWT)
3. Token lưu vào `localStorage` với key `access_token`
4. Ngay sau đó gọi `GET /user-id` → lưu `user_id` vào `localStorage`
5. Mọi request đều có header: `Authorization: Bearer <token>`
6. Mỗi trang được bảo vệ kiểm tra token khi load — redirect nếu thiếu
7. Khi logout: xóa cả `access_token` **và** `user_id`

**Fallback:** Nếu có `access_token` nhưng thiếu `user_id` (user login trước khi deploy), `home.js` tự fetch lại `GET /user-id` khi load.

**Trang được bảo vệ:** `index.html`, `chatbot.html`, `pomodoro.html`, `roadmap.html`, `statistics.html`

**Trang công khai:** `pages/auth.html`, `pages/about.html`

---

## [EDIT] Sidebar Toàn cục (Global Sidebar)

**File:** `js/sidebar_global.js` + `css/sidebar_global.css`

Sidebar được inject tự động vào mọi trang (trừ `auth.html`) qua script module. Không cần viết HTML sidebar trong từng trang — chỉ cần import hai file này.

### Cách tích hợp vào một trang mới

```html
<head>
  <link rel="stylesheet" href="../css/base.css">
  <link rel="stylesheet" href="../css/sidebar_global.css">
  <script type="module" src="../js/sidebar_global.js" defer></script>
  <link rel="stylesheet" href="../css/ten-trang.css">
  <script type="module" src="../js/ten-trang.js" defer></script>
</head>
<body>
  <div class="app-content">
    <!-- Nội dung trang -->
  </div>
</body>
```

> **Quan trọng:** Bọc nội dung trang trong `<div class="app-content">` để CSS tự căn lề trái tránh sidebar.

### Tính năng

| Tính năng | Mô tả |
|-----------|-------|
| Điều hướng | 6 link: Home, Pomodoro, Roadmap, Statistics, AI Chat, About |
| Thu gọn | Desktop: 220px mở rộng → 60px thu gọn (chỉ icon) |
| Mobile | Drawer 280px trượt từ trái, với overlay backdrop |
| Profile popup | Chỉnh tên hiển thị, đổi mật khẩu, chuyển ngôn ngữ, đăng xuất |
| Auto-collapse | Roadmap và Chatbot tự thu gọn khi load để có không gian tối đa |
| Auth guard | Trang được bảo vệ tự redirect về `/pages/auth.html` nếu không có token |

### State sidebar

```javascript
// CSS class trên body/sidebar
.global-sidebar.collapsed   // Sidebar thu gọn (desktop)
.global-sidebar.mobile-open // Sidebar mở trên mobile

// app-content tự điều chỉnh margin-left theo trạng thái sidebar
```

### API sử dụng

```javascript
// sidebar_global.js tự gọi — không cần gọi từ trang khác
GET  /account           // Lấy user info để hiển thị tên/email
PATCH /account          // Lưu tên mới
PATCH /account/password // Đổi mật khẩu
```

### Pages công khai (không cần auth)

```javascript
const PUBLIC_PAGES = ['about', 'auth'];
```

---

## [EDIT] Đa ngôn ngữ (i18n)

**Ngôn ngữ hỗ trợ:** Tiếng Anh (`en`), Tiếng Việt (`vi`)

**Sử dụng trong JS:**

```javascript
import { t, initI18n, setLang, getLang } from '../i18n.js';

await initI18n(); // Gọi khi khởi động trang

const text = t('home.task_name_placeholder');          // Lấy chuỗi dịch
const text2 = t('home.task_count', { count: 5 });     // Với biến thay thế
```

**Sử dụng trong HTML:**

```html
<span data-i18n="home.nav_pomodoro">Pomodoro</span>
<input data-i18n-placeholder="home.task_name_placeholder">
<button data-i18n-aria="home.sidebar_toggle_label" aria-label="">
```

**Cấu trúc key dịch trong `locales/*.json`:**

```
chatbot.*     - Giao diện AI chat
home.*        - Dashboard (bao gồm profile popup, password change, sidebar nav)
pomodoro.*    - Đếm giờ
statistics.*  - Thống kê
roadmap.*     - Roadmap editor
about.*       - Trang giới thiệu
auth.*        - Đăng nhập/đăng ký
sidebar.*     - Sidebar toàn cục (nav labels, collapse tooltip)
```

**Lưu ý:** Khi thêm chuỗi mới, cập nhật cả `locales/en.json` và `locales/vi.json`.

---

## [EDIT] IndexedDB & Offline

**Wrapper:** `idb.js`

**Cấu hình:**

```javascript
DB_NAME = "AppDatabase"
DB_VERSION = 2
```

**Bắt buộc:** gọi `registerStore(name)` **trước** `initDB()`.

**API của idb.js:**

```javascript
import * as idb from '../idb.js';

await idb.addData(storeName, data);
await idb.putData(storeName, data);       // upsert theo id
await idb.patchData(storeName, id, patch);
await idb.getData(storeName, id);
await idb.getAllData(storeName);
await idb.deleteData(storeName, id);
```

**Hàng đợi offline:**

- `offlinequeue` — queue cho request thường
- Tự động flush khi online trở lại

**User isolation trong queue:**

Mỗi item trong `offlinequeue` chứa trường `user_id: int`. Khi `flushQueue()` chạy:

- Item có `user_id` khớp current user → execute bình thường
- Item có `user_id` khác → **skip, giữ nguyên** để user đó quay lại flush (không xóa)
- `isQueueEmpty()` cũng filter theo `user_id` hiện tại

**Quan trọng:** `enqueueRequest()` sẽ throw error nếu `user_id` không có trong localStorage — đây là fail-fast intentional. `fetchWithAuth` sẽ hiện toast `utils.queue_error_no_user` khi gặp lỗi này.

---

## [EDIT] localStorage

Keys chia thành 2 nhóm:

**Device-level (không prefix) — dùng chung giữa các user:**

| Key | Mô tả |
|-----|-------|
| `access_token` | JWT token xác thực |
| `user_id` | ID số nguyên của user hiện tại (lấy từ `GET /user-id` sau login) |
| `lang` | Ngôn ngữ hiện tại (`en` hoặc `vi`) |
| `i18n_cache` | Cache bản dịch cho offline |
| `sidebarCollapsed` | Trạng thái thu gọn sidebar |
| `manask_onboarded` | Đã xem onboarding chưa |
| `manask_pomo_hinted` | Đã xem Pomodoro hint chưa |
| `manask_roadmap_hinted` | Đã xem Roadmap hint chưa |
| `manask_stats_hinted` | Đã xem Statistics hint chưa |
| `manask_intent_asked` | Đã hiện intent prompt (hỏi mục tiêu user mới) chưa |

**User-scoped (prefix `u{user_id}_`) — riêng từng user:**

| Key (không prefix) | Mô tả |
|-----|-------|
| `selectedProjectId` | Project đang xem |
| `selectedProjectName` | Tên project đang xem |
| `username` | Tên hiển thị |
| `email` | Email user |
| `sidebarLength` | Số folder trong sidebar (dùng làm position mặc định) |
| `pomodoro_focus_duration` | Thời gian focus (giây) |
| `pomodoro_short_break` | Thời gian nghỉ ngắn (giây) |
| `pomodoro_long_break` | Thời gian nghỉ dài (giây) |
| `pomodoro_long_break_after` | Số pomodoro trước khi nghỉ dài |
| `pomodoro_disable_break` | Tắt nghỉ giải lao |
| `pomodoro_auto_focus` | Tự động bắt đầu focus |
| `pomodoro_auto_break` | Tự động bắt đầu nghỉ |
| `pomodoro_sound_enabled` | Bật/tắt âm thanh |

**Helpers trong utils.js** (dùng thay vì `localStorage` trực tiếp cho user-scoped keys):

```javascript
utils.getUserItem(key)       // đọc key có prefix
utils.setUserItem(key, val)  // ghi key có prefix
utils.removeUserItem(key)    // xóa key có prefix
utils.ensureUserId()         // fetch user_id nếu thiếu (async)
```

`getUserItem` trả `null` khi thiếu `user_id` (fail gracefully, không throw).

---

## [EDIT] Quản lý trạng thái (State Management)

Không dùng thư viện state management. Trạng thái phân tán theo 4 lớp:

1. **localStorage** — phiên đăng nhập, tùy chọn ngôn ngữ
2. **IndexedDB** — dữ liệu offline, hàng đợi request
3. **Module variables** — trạng thái cục bộ trong từng component
4. **Custom Events** — giao tiếp giữa các component

**Custom Events quan trọng:**

```javascript
// Phát sự kiện
document.dispatchEvent(new CustomEvent('projectSelected', { detail: { id, name } }));

// Lắng nghe
document.addEventListener('projectSelected', (e) => { ... });
```

| Event | Nguồn | Nhận |
|-------|-------|------|
| `projectSelected` | `sidebar_nav.js` | `container_task.js` |
| `projectUpdated` | `sidebar_nav.js` | `app_header.js`, `container_task.js` |
| `projectDeleted` | `sidebar_nav.js` | `container_task.js` |
| `langChanged` | `i18n.js` | Toàn bộ trang |

---

## [EDIT] Design System

**Design tokens** định nghĩa trong `css/base.css`:

```css
:root {
  /* Màu nền */
  --bg-base: #0e0d12;
  --bg-surface: #13121a;
  --bg-elevated: #1a1924;

  /* Màu nhấn */
  --accent-primary: #6366f1;       /* Indigo */
  --accent-primary-hover: #818cf8;

  /* Text */
  --text-primary: #f1f1f3;
  --text-secondary: #9494a0;
  --text-muted: #5c5c6e;

  /* Trạng thái */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
}
```

**Typography:**

- Font chính: DM Sans (Google Fonts)
- Font code: DM Mono

**Đặt tên CSS class:**

- BEM-like: `.container-task`, `.task-detail-panel`
- State: `.active`, `.disabled`, `.loading`
- Namespace component: `.tdp-` (task-detail-panel), `.sf-` (sort-filter)

---

## [KEEP] Quy ước code

### Cấu trúc module JS

```javascript
// 1. Import ở đầu file
import * as utils from '../utils.js';
import { t, initI18n } from '../i18n.js';
import * as idb from '../idb.js';

// 2. Biến trạng thái module
let currentProject = null;
let taskList = [];

// 3. Init khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', async function() {
    await initI18n();
    // ... khởi tạo component
});
```

### Đặt tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| File JS/CSS | snake_case | `app_header.js`, `container_task.css` |
| Biến/hàm JS | camelCase | `taskData`, `fetchTasks()` |
| HTML id/class | kebab-case | `task-detail-panel`, `btn-close` |
| CSS namespace | prefix ngắn | `.tdp-title`, `.sf-dropdown` |
| data attribute | kebab-case | `data-task-id`, `data-i18n` |

### Async/Await

```javascript
// ĐÚNG: dùng async/await với try/catch
try {
    const response = await utils.fetchWithAuth(url, options);
    const data = await response.json();
    renderData(data);
} catch (error) {
    utils.showError(error.message);
}
```

### Indentation & format

- 4 dấu cách (không dùng tab)
- Có dấu chấm phẩy
- Dấu nháy đơn cho string
- `//` cho comment một dòng, `/** */` cho block comment

---

## [EDIT] Test mode

Project có chế độ test dùng dữ liệu mock thay API thật:

```javascript
// Trong utils.js
const TEST = false; // hoặc thêm ?test vào URL

// Trong từng file
if (utils.TEST) {
    // Dùng mock data
} else {
    // Gọi API thật
}
```

Kích hoạt bằng cách thêm `?test` vào URL: `http://localhost/index.html?test`

---

## [KEEP] Không có (cần lưu ý)

- Không có `package.json` — không phải npm project
- Không có build step — chạy trực tiếp trên trình duyệt
- Không có bundler (webpack, vite, esbuild...)
- Không có TypeScript — thuần JavaScript
- Không có test framework (Jest, Vitest...)
- Không có linting (ESLint, Prettier...)
- Không có CI/CD

---

## [EDIT] Chạy project

Mở trực tiếp bằng Live Server (VS Code) hoặc bất kỳ HTTP server nào:

```bash
# Dùng Python
python -m http.server 8080

# Dùng Node http-server
npx http-server . -p 8080

# Dùng VS Code Live Server extension
# Click chuột phải vào index.html → Open with Live Server
```

Truy cập: `http://localhost:8080`

> **Lưu ý:** File dùng ES6 modules (`type="module"`) nên **phải** chạy qua HTTP server, không mở file trực tiếp (`file://`).

---

## [EDIT] Các tính năng chính

| Tính năng | File chính | Mô tả |
|-----------|-----------|-------|
| Dashboard / Task | `js/home/container_task.js` | Tạo, sửa, xóa, lọc, sắp xếp task |
| Folder/Project | `js/home/sidebar_nav.js` | Quản lý cây thư mục |
| Pomodoro Timer | `js/pomodoro.js` | Đếm giờ với chọn task, 3 chế độ (focus/short/long break) |
| Statistics | `js/statistics/` | Line chart, donut, heatmap, summary |
| AI Chatbot | `js/chatbot.js` | Chat AI, tạo folder tree & roadmap |
| Roadmap Editor | `js/roadmap.js` | Sơ đồ node-based |
| Global Sidebar | `js/sidebar_global.js` | Sidebar toàn cục, profile popup, auth guard |
| Auth | `js/auth.js` | Đăng nhập, đăng ký |

---

## [EDIT] UI Gallery

`ui-gallery/` chứa các HTML snippet self-contained mô phỏng từng tính năng của app —
thay thế screenshot tĩnh bằng animation nhúng được qua `<iframe>`.

### Quyết định khi nào cần dùng / tạo snippet

| Tình huống | Hành động |
|-----------|-----------|
| Cần minh hoạ tính năng đã có trong gallery | Nhúng snippet hiện có qua `<iframe src="ui-gallery/snippets/...">` |
| Tính năng mới chưa có snippet | Tạo snippet mới (xem quy trình bên dưới) |
| Data trong snippet không phù hợp (quá chuyên môn) | Sửa data, giữ nguyên animation/structure |
| Muốn test style hay logic của app chính | **Không** dùng ui-gallery — sửa file app trực tiếp |

**Nguyên tắc data:** dùng nội dung đời thường mà ai cũng hiểu (ví dụ: "Chuẩn bị báo cáo tháng", "Học tiếng Anh"). Không dùng tên project hay task chuyên môn của user.

### Nhúng snippet đã có

```html
<!-- Trong tài liệu / README / trang khác -->
<iframe src="ui-gallery/snippets/tasks/tasks-list.html"
        width="360" height="300" frameborder="0" scrolling="no"
        style="border-radius:12px; overflow:hidden;">
</iframe>
```

Hoặc dùng nút **Copy embed** trong trang gallery (`http://localhost:8080/ui-gallery/`).

> **Lưu ý:** luôn thêm `scrolling="no"` khi nhúng — snippet có `body { background: transparent }` nên trình duyệt có thể thêm scrollbar nếu thiếu attribute này. Gallery `index.html` đã tự xử lý.

### Quy trình tạo snippet mới

**Bước 1 — Tạo file HTML:**

```
ui-gallery/snippets/<category>/<category>-<component>.html
```

Copy từ `ui-gallery/_template/snippet.html` làm điểm bắt đầu.

**Bước 2 — Cấu hình kích thước:**

```css
body {
  width: 360px;   /* đặt trực tiếp bằng px */
  height: 300px;
  background: transparent;
  position: relative;
}
```

Không dùng `100vw` / `100vh`, không cần CSS variable `--snippet-w/--snippet-h`. Kích thước gợi ý: ~280–420px rộng, ~160–360px cao.

**Bước 3 — Viết snippet (theo scene approach):**

- Import `../../shared/reset.css` + `../../shared/tokens.css` (không inline tokens)
- `body { background: transparent; position: relative; }` — không dùng màu đặc
- Mỗi thành phần UI tách thành box riêng với `background + border-radius + box-shadow` (xem bảng nguyên tắc scene bên dưới)
- Thêm `@keyframes float` và áp lên tất cả box với phase delay lệch nhau
- JS (nếu cần): bọc trong IIFE `(function(){ ... })()`
- Không import từ `/js/` hay `/css/` của app — snippet phải hoàn toàn độc lập

**Bước 4 — Đăng ký vào manifest:**
Thêm entry vào `ui-gallery/snippets/manifest.json` trong mảng `"snippets"`:

```json
{
  "id": "category-component",
  "title": "Tên hiển thị tiếng Việt",
  "category": "tasks",
  "file": "tasks/tasks-component.html",
  "width": 360,
  "height": 300,
  "description": "Mô tả ngắn 1 câu về animation.",
  "tags": ["animation", "tasks"]
}
```

**Bước 5 — Kiểm tra:** mở `http://localhost:8080/ui-gallery/` xác nhận preview hiện đúng.

### Nguyên tắc scene (áp dụng toàn bộ 13 snippet hiện có)

Mọi snippet theo pattern **scene approach** — body transparent, các thành phần UI là box nổi riêng tạo cảnh 3D có chiều sâu:

| Thành phần | Quy tắc |
|---|---|
| `body` | `background: transparent` · `position: relative` · tilt nhẹ `transform: perspective() rotateX() rotateY()` |
| Box chính | `background: var(--bg-surface)` · `border-radius: var(--radius-lg)` · `box-shadow` nặng + glow color |
| Box phụ | `background: var(--bg-elevated)` · `border-radius: var(--radius-md)` · shadow nhẹ, không glow |
| Vị trí box phụ | Lệch trái (`align-self: flex-start; margin-left: 4px`) hoặc phải (`flex-end; margin-right: 4px`), width ~75–82% — **không căn giữa** |
| Overlap | `margin-bottom: -14px` trên box phía trên để tạo depth rõ ràng |
| Float animation | `@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }` · 3s ease-in-out infinite · áp lên **tất cả** box |
| Float phase | Box phụ trên: `0s` · Box chính: `~1s` · Box phụ dưới: `1.5s` — lệch pha tạo cảm giác organic |
| Glow pool | `radial-gradient + filter: blur(26px)` · `position: absolute; z-index: 0` · phía sau box chính |

**Ngoại lệ:**

- `S-12` Login: `box-form` FIXED (không float) — form cần stable; body không tilt
- `S-13` Modal: `.modal` FIXED — modal cần stable; body không tilt
- `S-01` Sidebar: sidebar + content **sync** cùng phase (vì là 1 layout unit)
- `S-07` Heatmap: chip-header + box-heatmap **sync** cùng phase

### CSS tokens quan trọng (từ shared/tokens.css)

```css
/* Màu nền */
var(--bg-base)          /* #0e0d12 — nền trang */
var(--bg-surface)       /* #13121a — nền snippet */
var(--bg-card)          /* #1a1a20 — card/panel */
var(--bg-elevated)      /* #1f1e27 — dropdown, tooltip */
var(--bg-input)         /* #252530 — input field */

/* Accent */
var(--accent-primary)   /* #6366f1 — indigo chính */
var(--accent-hover)     /* #5254cc */
var(--accent-subtle)    /* rgba(99,102,241,0.12) — background nhẹ */

/* Semantic */
var(--color-success)    /* #22c55e */
var(--color-warning)    /* #f59e0b */
var(--color-danger)     /* #ef4444 */
var(--color-info)       /* #06b6d4 */

/* Text */
var(--text-primary)     /* #f1f1f3 */
var(--text-secondary)   /* #9494a0 */
var(--text-tertiary)    /* #5a5a68 */

/* Khác */
var(--border-color)     /* #27272a */
var(--radius-md)        /* 8px */  var(--radius-lg)  /* 12px */
var(--t-base)           /* 0.18s ease */  var(--t-spring) /* cubic-bezier(...) */
var(--font-sans)        /* DM Sans */  var(--font-mono) /* DM Mono */
var(--shadow-md)        /* box-shadow chuẩn */
```

### Categories và snippet hiện có

**Categories:** `sidebar` · `pomodoro` · `toast` · `chatbot` · `tasks` · `statistics` · `auth` · `roadmap`

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
