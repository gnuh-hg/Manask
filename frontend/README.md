# Manask — Frontend

Ứng dụng quản lý công việc với giao diện dark-theme, hỗ trợ offline và đa ngôn ngữ (Tiếng Anh / Tiếng Việt).

---

## Tính năng

- **Task Manager** — Tạo, sửa, xóa, lọc và sắp xếp task theo folder/project
- **Pomodoro Timer** — Đếm giờ tập trung với 3 chế độ (Focus / Short Break / Long Break), gắn task đang làm
- **AI Chatbot** — Chat với AI để tạo folder tree và roadmap tự động
- **Roadmap Editor** — Sơ đồ node-based để lập kế hoạch
- **Statistics** — Biểu đồ line chart, donut, heatmap và tóm tắt hoạt động
- **Offline-first** — Mọi request khi mất mạng được xếp hàng và tự đồng bộ khi có kết nối trở lại

---

## Công nghệ

- Vanilla JavaScript (ES6 modules) — không có framework, không có bundler
- Thuần CSS với CSS variables
- IndexedDB (offline-first) + localStorage
- Font: DM Sans / DM Mono (Google Fonts)
- Thư viện ngoài duy nhất: [Sortable.js v1.15.0](https://sortablejs.github.io/Sortable/)

---

## Cài đặt & Chạy

Project không cần cài đặt. Chỉ cần một HTTP server vì dùng ES6 modules (`type="module"`).

**Dùng Python:**
```bash
python -m http.server 8080
```

**Dùng Node.js:**
```bash
npx http-server . -p 8080
```

**Dùng VS Code:** Click chuột phải vào `index.html` → *Open with Live Server*

Truy cập: `http://localhost:8080`

> Không mở file trực tiếp (`file://`) — ES modules bị chặn bởi CORS.

---

## Test mode

Thêm `?test` vào URL để dùng mock data, bỏ qua API thật:

```
http://localhost:8080/index.html?test
http://localhost:8080/pages/pomodoro.html?test
```

---

## Backend

API hosted tại `https://backend-u1p2.onrender.com`

Xác thực bằng JWT — token lưu ở `localStorage` với key `access_token`.

---

## Cấu trúc chính

```
frontend/
├── index.html              # Dashboard chính
├── pages/                  # Các trang riêng lẻ
├── js/                     # Logic ứng dụng
│   ├── sidebar_global.js   # Sidebar toàn cục (inject vào mọi trang)
│   ├── home/               # Components dashboard
│   └── statistics/         # Components biểu đồ
├── css/                    # Styles
├── locales/                # Bản dịch (en.json, vi.json)
├── utils.js                # API wrapper, toast, offline queue
├── i18n.js                 # Hệ thống đa ngôn ngữ
└── idb.js                  # Wrapper IndexedDB
```

---

## UI Gallery

Thư mục `ui-gallery/` chứa 13 HTML snippet self-contained mô phỏng từng tính năng —
thay thế screenshot tĩnh bằng animation nhúng được qua `<iframe>`.

### Cách xem

Chạy HTTP server rồi mở `http://localhost:8080/ui-gallery/` — grid preview, filter theo category,
nút **Copy embed** để lấy thẻ `<iframe>` sẵn dùng.

### Nhúng snippet

```html
<iframe src="ui-gallery/snippets/tasks/tasks-list.html"
        width="360" height="300" frameborder="0">
</iframe>
```

### Cách thêm snippet mới

1. Copy `ui-gallery/_template/snippet.html` → `ui-gallery/snippets/<category>/<category>-<component>.html`
2. Đặt `--snippet-w` / `--snippet-h` trong `:root`. Không dùng 100vw/100vh.
3. Viết markup, CSS, animation. **Không import** từ `/js/` hay `/css/` của app.
4. JS (nếu có) bọc trong IIFE `(function(){ ... })()`.
5. Thêm entry vào `ui-gallery/snippets/manifest.json`.
6. Kiểm tra tại `http://localhost:8080/ui-gallery/`.

### 13 Snippet hiện có

| # | Tên | File | W×H |
|---|-----|------|-----|
| S-01 | Sidebar collapse | `sidebar/sidebar-collapse.html` | 320×360 |
| S-02 | Pomodoro timer | `pomodoro/pomodoro-timer.html` | 280×320 |
| S-03 | Task list (card grid) | `tasks/tasks-list.html` | 360×300 |
| S-04 | Line chart | `statistics/statistics-charts.html` | 420×260 |
| S-05 | Toast stack | `toast/toast-stack.html` | 340×220 |
| S-06 | Folder tree | `tasks/tasks-folder-tree.html` | 240×340 |
| S-07 | Heatmap activity | `statistics/statistics-heatmap.html` | 400×160 |
| S-08 | Donut chart | `statistics/statistics-donut.html` | 280×260 |
| S-09 | Task detail card | `tasks/tasks-task-detail.html` | 320×340 |
| S-10 | Chat bubble | `chatbot/chatbot-bubble.html` | 300×360 |
| S-11 | Roadmap node graph | `roadmap/roadmap-timeline.html` | 420×200 |
| S-12 | Login form | `auth/auth-login.html` | 320×360 |
| S-13 | Modal tạo folder | `tasks/tasks-modal-create.html` | 340×320 |
