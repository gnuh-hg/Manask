import * as idb from './idb.js';
import { t } from './i18n.js';

const URL_API = "https://backend-u1p2.onrender.com";
const QUEUE_STORE = "offlinequeue";
const TEST = false;
let _loadingCount = 0;
let _loadingTimer = null;

idb.registerStore(QUEUE_STORE);

// FIX 3: Thêm random component để tránh collision khi nhiều tab chạy song song
// Trước đây: Date.now() * 1e5 + _seq → 2 tab có cùng _seq trong cùng millisecond = collision
let _seq = 0;
let _lastTimestamp = 0;

export const generateId = () => {
  const now = Date.now();

  // Nếu clock bị lùi (NTP, DST...), tăng lastTimestamp thay vì dùng now
  // → đảm bảo timestamp component luôn tăng đơn điệu
  if (now > _lastTimestamp) {
    _lastTimestamp = now;
    _seq = 0;
  } else _seq = (_seq + 1) % 1e4;
  return `tmp-${_lastTimestamp * 1e8 + _seq}`;
};

// --- USER-SCOPED LOCALSTORAGE ---
export function userKey(key) {
    const uid = localStorage.getItem('user_id');
    return uid ? `u${uid}_${key}` : null;
}

export function getUserItem(key) {
    const k = userKey(key);
    return k ? localStorage.getItem(k) : null;
}

export function setUserItem(key, value) {
    const k = userKey(key);
    if (k) localStorage.setItem(k, value);
}

export function removeUserItem(key) {
    const k = userKey(key);
    if (k) localStorage.removeItem(k);
}

const USER_SCOPED_KEYS = [
    'selectedProjectId', 'selectedProjectName',
    'username', 'email', 'sidebarLength',
    'pomodoro_focus_duration', 'pomodoro_short_break',
    'pomodoro_long_break', 'pomodoro_long_break_after',
    'pomodoro_disable_break', 'pomodoro_auto_focus',
    'pomodoro_auto_break', 'pomodoro_sound_enabled',
];

export function cleanupOrphanKeys() {
    for (const k of USER_SCOPED_KEYS) {
        localStorage.removeItem(k);
    }
}

export async function ensureUserId() {
    if (localStorage.getItem('user_id')) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
        const res = await fetchWithRetry(
            `${URL_API}/user-id`,
            { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.ok) {
            const data = await res.json();
            if (data.user_id !== undefined) {
                localStorage.setItem('user_id', String(data.user_id));
                cleanupOrphanKeys();
            }
        }
    } catch (e) {
        console.error('[ensureUserId]', e);
    }
}

// --- LOADING ---
export function showLoading() {
    _loadingCount++;
    if (_loadingTimer) return;

    _loadingTimer = setTimeout(() => {
        _loadingTimer = null;
        if (_loadingCount === 0) return;
        if (document.querySelector('.config-loading')) return;

        const overlay = document.createElement('div');
        overlay.className = 'config-loading';
        overlay.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999;
        `;
        overlay.innerHTML = `
            <div style="
                background: #1a1a20; border: 1px solid #27272a;
                border-radius: 12px; padding: 20px 28px;
                display: flex; align-items: center; gap: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            ">
                <div style="
                    width: 18px; height: 18px; border-radius: 50%;
                    border: 2.5px solid #27272a; border-top-color: #6366f1;
                    animation: config-spin 0.8s linear infinite; flex-shrink: 0;
                "></div>
                <span style="font-size: 13px; font-weight: 500; color: #9494a0;">
                    ${t('utils.connecting')}
                </span>
            </div>
        `;

        if (!document.querySelector('#config-loading-style')) {
            const style = document.createElement('style');
            style.id = 'config-loading-style';
            style.textContent = `@keyframes config-spin { to { transform: rotate(360deg); } }`;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
    }, 500);
}

export function hideLoading() {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount > 0) return;

    if (_loadingTimer) {
        clearTimeout(_loadingTimer);
        _loadingTimer = null;
    }

    document.querySelector('.config-loading')?.remove();
}

// --- TOAST NOTIFICATION SYSTEM ---
const _TOAST_ICONS = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};
const _TOAST_STYLES = {
    success: { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.30)',  icon: '#22c55e', bar: '#22c55e' },
    error:   { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.30)',  icon: '#ef4444', bar: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)', icon: '#f59e0b', bar: '#f59e0b' },
    info:    { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.30)', icon: '#6366f1', bar: '#6366f1' },
};
let _toastContainer = null;

function _getToastContainer() {
    if (!_toastContainer || !document.body.contains(_toastContainer)) {
        _toastContainer = document.createElement('div');
        _toastContainer.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            display: flex; flex-direction: column; gap: 8px;
            pointer-events: none; max-width: 360px;
        `;
        document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
}

function _showToast(type, ...args) {
    const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    const container = _getToastContainer();
    const s = _TOAST_STYLES[type];
    const duration = 4000;

    // Giới hạn 5 toast cùng lúc
    while (container.children.length >= 5) container.firstChild.remove();

    const toast = document.createElement('div');
    toast.style.cssText = `
        display: flex; align-items: flex-start; gap: 10px;
        background: ${s.bg}; backdrop-filter: blur(16px);
        border: 1px solid ${s.border}; border-radius: 10px;
        padding: 12px 14px; width: 100%;
        box-shadow: 0 8px 24px rgba(0,0,0,0.35);
        pointer-events: all; overflow: hidden; position: relative;
        transform: translateX(110%); opacity: 0;
        transition: transform 0.32s cubic-bezier(0.34,1.5,0.64,1), opacity 0.25s ease;
    `;

    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `color:${s.icon}; flex-shrink:0; margin-top:1px; line-height:1;`;
    iconWrap.innerHTML = _TOAST_ICONS[type];

    const msgEl = document.createElement('span');
    msgEl.style.cssText = `
        font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
        color:#f1f1f3; line-height:1.5; flex:1; word-break:break-word;
    `;
    msgEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
        background:none; border:none; cursor:pointer; padding:0; margin-top:1px;
        color:#5a5a68; flex-shrink:0; line-height:1; pointer-events:all;
        transition:color 0.15s;
    `;
    closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.onmouseenter = () => closeBtn.style.color = '#f1f1f3';
    closeBtn.onmouseleave = () => closeBtn.style.color = '#5a5a68';

    const bar = document.createElement('div');
    bar.style.cssText = `
        position:absolute; bottom:0; left:0; height:2px;
        background:${s.bar}; width:100%; transform-origin:left;
        border-radius:0 0 10px 10px;
        transition:transform ${duration}ms linear;
    `;

    toast.append(iconWrap, msgEl, closeBtn, bar);
    container.appendChild(toast);

    // Slide in
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
        bar.style.transform = 'scaleX(0)';
    }));

    const dismiss = () => {
        toast.style.transform = 'translateX(110%)';
        toast.style.opacity = '0';
        toast.style.transition = 'transform 0.22s ease, opacity 0.22s ease';
        setTimeout(() => toast.remove(), 220);
    };

    const timer = setTimeout(dismiss, duration);
    closeBtn.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
    toast.addEventListener('click',    () => { clearTimeout(timer); dismiss(); });
}

export function showSuccess(...args) { _showToast('success', ...args); }
export function showError(...args)   { _showToast('error',   ...args); }
export function showWarning(...args) { _showToast('warning', ...args); }
export function showInfo(...args)    { _showToast('info',    ...args); }

// --- FETCH WITH RETRY ---
export async function fetchWithRetry(url, options = {}, retries = 4) {
    for (let i = 0; i < retries; i++) {
        const controller = new AbortController();
        const timeoutMs = i === 0 ? 35000 : 60000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timer);
            return response;
        } catch (error) {
            clearTimeout(timer);
            if (i === retries - 1) throw error;
            const delay = 2000 * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${retries} sau ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// ===== FETCH WITH AUTH (có Optimistic / Offline Queue) =====

/**
 * @param {string} url
 * @param {RequestInit} options
 * @param {object} queueOptions
 * @param {boolean}  queueOptions.enableQueue    - Bật offline queue (default: false)
 *                                                 Chỉ bật với các request ghi (POST/PUT/PATCH/DELETE)
 * @param {*}        queueOptions.optimisticData - Dữ liệu trả về ngay khi enqueue (Optimistic UI)
 * @param {Function} queueOptions.onLoadStart    - Callback khi bắt đầu load (mặc định: showLoading toàn màn hình)
 * @param {Function} queueOptions.onLoadEnd      - Callback khi kết thúc load (mặc định: hideLoading toàn màn hình)
 * @param {string} key
 * @param {number} retries
 */
export async function fetchWithAuth(url, options = {}, queueOptions = {}, key = generateId(), retries = 1) {
    console.info(`[FetchWithAuth] ${options.method || 'GET'} ${url} ${JSON.stringify(options)} (retries=${retries}, queue=${queueOptions.enableQueue})`);
    console.trace();
    const { enableQueue = false, optimisticData = null, onLoadStart, onLoadEnd } = queueOptions;

    const startLoading = onLoadStart ?? showLoading;
    const endLoading   = onLoadEnd   ?? hideLoading;

    if (!options.method || options.method === 'GET') startLoading();
    let didHideLoading = false;

    const safeHideLoading = () => {
        if (!didHideLoading) {
            didHideLoading = true;
            endLoading();
        }
    };

    for (let i = 0; i < retries; i++) {
        const token = localStorage.getItem("access_token");
        const defaultHeaders = {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };

        const controller = new AbortController();
        const timeoutMs = i === 0 ? 10000 : 30000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers },
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (response.ok) {
                if (!options.method || options.method === 'GET') safeHideLoading();
                return response;
            }

            if (response.status === 401) {
                if (!options.method || options.method === 'GET') safeHideLoading();
                localStorage.removeItem("access_token");
                window.location.href = "/pages/auth.html";
                throw new Error("Unauthorized");
            }

            // Lỗi client 4xx (trừ 429) → không retry, không queue
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                if (!options.method || options.method === 'GET') safeHideLoading();
                return response;
            }

            // Lỗi server 5xx / 429 → tiếp tục retry bên dưới
            if (i === retries - 1) throw new Error(`Server Error: ${response.status}`);

        } catch (error) {
            clearTimeout(timer);

            if (error.message === "Unauthorized") throw error;

            if (i === retries - 1) {
                if (!options.method || options.method === 'GET') safeHideLoading();

                // ── OFFLINE QUEUE ──────────────────────────────────────────
                // Chỉ queue khi: bật cờ, và thực sự mất mạng (hoặc không thể kết nối)
                const isNetworkError =
                    !navigator.onLine || error.name === "AbortError" || error.name === "TypeError";

        if (enableQueue && isNetworkError) {
            try {
                await enqueueRequest(url, key, options);
            } catch (e) {
                if (e.message.includes('user_id')) showError(t('utils.queue_error_no_user'));
                throw e;
            }
        
            if (optimisticData !== null) {
                return new Response(JSON.stringify(optimisticData), {
                    status: 202,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Queued": "true",
                        "X-Queue-Key": String(key),
                    },
                });
            }
        
            showWarning(t('utils.offline_queue'));
            throw error;
        }
                // ───────────────────────────────────────────────────────────

                showWarning(t('utils.connection_unstable'));
                throw error;
            }
        }

        const delay = 1000 * Math.pow(2, i);
        console.warn(`Thử lại lần ${i + 1}/${retries} sau ${delay / 1000}s do lỗi tạm thời...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
}

async function enqueueRequest(url, key, options = {}) {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) throw new Error("Cannot queue request without user_id");

    await idb.addData(QUEUE_STORE, {
        url, key,
        options: {
            ...options,
            // Không serialize signal vì không clone được
            signal: undefined,
        },
        user_id: parseInt(user_id, 10),
        enqueuedAt: Date.now(),
    }, key); // truyền key làm IDB key → FIFO theo generateId (timestamp-based)
    console.info(`[Queue] Đã lưu request vào hàng chờ, key=${key}`);
    return key;
}

async function flushQueue() {
    let items;
    try { items = await idb.getAllDataWithKeys(QUEUE_STORE); } catch { return; }
    if (!items.length) return;

    // Cache session ở đầu — không re-read giữa loop
    const currentUserId = parseInt(localStorage.getItem("user_id"), 10);
    const cachedToken   = localStorage.getItem("access_token");
    if (!currentUserId || !cachedToken) return;

    console.info(`[Queue] Đang xử lý ${items.length} request trong hàng chờ...`);

    for (const item of items) {
        const { _key, url, options, user_id } = item;

        // Race condition: user logout giữa lúc loop
        if (!localStorage.getItem("access_token")) {
            console.warn("[Queue] Session mất giữa flush, dừng lại");
            return;
        }

        // User mismatch → skip, giữ lại để user đó quay lại flush
        if (user_id !== currentUserId) {
            console.warn(`[Queue] User mismatch (${user_id} ≠ ${currentUserId}), skip`);
            continue;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    "Authorization": `Bearer ${cachedToken}`,
                    "Content-Type": "application/json",
                    ...options?.headers,
                },
            });

            if      (response.ok)                          { await idb.deleteData(QUEUE_STORE, _key); }
            else if (response.status === 401)              { await handleQueueError401(); return; }
            else if (response.status === 404)              { await handleQueueError404(); return; }
            else if (response.status === 500)              { console.warn("[Queue] 500, retry sau"); return; }
            else if (response.status >= 400)               { await idb.deleteData(QUEUE_STORE, _key); }
            else                                           { return; }
        } catch {
            console.warn("[Queue] Mất mạng, dừng flush");
            return;
        }
    }
}

async function handleQueueError401() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    showError(t("utils.queue_error_401") || "Phiên hết hạn. Vui lòng đăng nhập lại.");
    setTimeout(() => window.location.href = "/pages/auth.html", 1000);
}

async function handleQueueError404() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    showError(t("utils.queue_error_404") || "Phiên không còn hợp lệ. Vui lòng đăng nhập lại.");
    setTimeout(() => window.location.href = "/pages/auth.html", 1000);
}

//Boolean kiểm tra xem queue có phần tử nào không
export async function isQueueEmpty() {
    try {
        const currentUserId = parseInt(localStorage.getItem("user_id"), 10);
        const items = await idb.getAllDataWithKeys(QUEUE_STORE);
        return items.filter(item => item.user_id === currentUserId).length === 0;
    } catch {
        return true;
    }
}


window.addEventListener("online", () => {
    console.info(`[Queue] ${t('utils.network_recovered')}`);
    flushQueue();
});

if (navigator.onLine) flushQueue();

export { URL_API, TEST, QUEUE_STORE };