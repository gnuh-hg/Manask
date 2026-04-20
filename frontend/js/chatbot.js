/**
 * Chatbot — AI Assistant  js/chatbot.js
 * API: /chatbot/history · /chatbot · /chatbot/save/folder-tree · /chatbot/save/roadmap
 * Design system: Manask dark theme
 */

import * as utils from '../utils.js';
import { t, initI18n } from '../i18n.js';

const API = utils.URL_API;

// Đọc test flag từ utils.TEST HOẶC URL param ?test — tránh browser module cache
const IS_TEST = utils.TEST || new URLSearchParams(location.search).has('test');

// ══════════════════════════════════════════════════════════════════════════
// TEST MODE — intercepts all API calls when IS_TEST === true
// ══════════════════════════════════════════════════════════════════════════

// Shared mock items — same IDs reused by both folder-tree and roadmap mocks
const _MOCK_ITEMS = [
    { id: 'f1', type: 'FOLDER',  name: 'Frontend',       color: '#6366f1', parent_id: null },
    { id: 'p1', type: 'PROJECT', name: 'Landing Page',    color: '#818cf8', parent_id: 'f1' },
    { id: 'p2', type: 'PROJECT', name: 'Product Catalog', color: '#a5b4fc', parent_id: 'f1' },
    { id: 'f2', type: 'FOLDER',  name: 'Backend',         color: '#f59e0b', parent_id: null },
    { id: 'p3', type: 'PROJECT', name: 'Auth Service',    color: '#fbbf24', parent_id: 'f2' },
    { id: 'p4', type: 'PROJECT', name: 'Payment API',     color: '#34d399', parent_id: 'f2' },
];

const _MOCK_ROADMAP = {
    role: 'assistant',
    content: 'Đây là roadmap được xây dựng từ các dự án hiện có của bạn. Kéo để di chuyển, Ctrl+Scroll để zoom, sau đó lưu vào workspace.',
    type: 'roadmap',
    data: {
        title: 'E-Commerce Roadmap',
        // nodes dùng item_id tham chiếu đến /items — giống roadmap.js
        nodes: [
            { id: 'n1', item_id: 'f1', x: 60,   y: 200 },
            { id: 'n2', item_id: 'p1', x: 320,  y: 80  },
            { id: 'n3', item_id: 'p2', x: 320,  y: 300 },
            { id: 'n4', item_id: 'f2', x: 580,  y: 200 },
            { id: 'n5', item_id: 'p3', x: 840,  y: 80  },
            { id: 'n6', item_id: 'p4', x: 840,  y: 300 },
        ],
        edges: [
            { from: 'n1', to: 'n2' },
            { from: 'n1', to: 'n3' },
            { from: 'n2', to: 'n4' },
            { from: 'n3', to: 'n4' },
            { from: 'n4', to: 'n5' },
            { from: 'n4', to: 'n6' },
        ],
        panX: 0, panY: 0, zoom: 1,
    },
};

const _MOCK_FOLDER_TREE = {
    role: 'assistant',
    content: 'Here\'s a folder structure for your e-commerce project. Tasks include priorities, dates, and time tracking.',
    type: 'folder_tree',
    data: {
        title: 'E-Commerce Platform',
        tree: [
            { id: 'f1', type: 'FOLDER',  name: 'Frontend',         color: '#6366f1', parent_id: null,  x: 0, y: 0 },
            { id: 'p1', type: 'PROJECT', name: 'Landing Page',      color: '#818cf8', parent_id: 'f1',  x: 0, y: 0 },
            { id: 't1', type: 'TASK',    name: 'Design hero section', project_id: 'p1', priority: 'high',   start_date: '2025-01-10', due_date: '2025-01-20', time_spent: 7200,  process: 75,  notes: 'Pending design review', x: 0, y: 0 },
            { id: 't2', type: 'TASK',    name: 'Setup routing',       project_id: 'p1', priority: 'medium', start_date: '2025-01-12', due_date: '2025-01-18', time_spent: 3600,  process: 100, notes: '', x: 0, y: 0 },
            { id: 'p2', type: 'PROJECT', name: 'Product Catalog',     color: '#a5b4fc', parent_id: 'f1',  x: 0, y: 0 },
            { id: 't3', type: 'TASK',    name: 'Filter & search UI',  project_id: 'p2', priority: 'high',   start_date: '2025-01-14', due_date: '2025-01-28', time_spent: 1800,  process: 30,  notes: '', x: 0, y: 0 },
            { id: 'f2', type: 'FOLDER',  name: 'Backend',          color: '#f59e0b', parent_id: null,  x: 0, y: 0 },
            { id: 'p3', type: 'PROJECT', name: 'Auth Service',      color: '#fbbf24', parent_id: 'f2',  x: 0, y: 0 },
            { id: 't4', type: 'TASK',    name: 'JWT implementation',  project_id: 'p3', priority: 'high',   start_date: '2025-01-05', due_date: '2025-01-15', time_spent: 14400, process: 100, notes: '', x: 0, y: 0 },
            { id: 't5', type: 'TASK',    name: 'OAuth2 integration',  project_id: 'p3', priority: 'low',    start_date: '2025-01-16', due_date: '2025-01-30', time_spent: 0,     process: 20,  notes: 'Waiting for API keys', x: 0, y: 0 },
            { id: 'p4', type: 'PROJECT', name: 'Payment API',       color: '#34d399', parent_id: 'f2',  x: 0, y: 0 },
            { id: 't6', type: 'TASK',    name: 'Stripe webhook',      project_id: 'p4', priority: 'medium', start_date: '2025-01-20', due_date: '2025-02-05', time_spent: 5400,  process: 50,  notes: '', x: 0, y: 0 },
        ],
    },
};

const _MOCK_ANALYSIS = {
    role: 'assistant',
    content: `**Workload Analysis — This Week**

Your team has **3 active projects** with **12 open tasks**. Here's the breakdown:

| Member    | Tasks | Avg completion | Hours logged |
|-----------|-------|----------------|--------------|
| Alice     | 4     | 68 %           | 18.5 h       |
| Bob       | 5     | 42 %           | 12.0 h       |
| Carol     | 3     | 91 %           | 22.0 h       |

**Key findings:**
- Carol is close to overloaded (91 % completion rate but highest hours)
- Bob has 2 overdue tasks — deadline was Jan 18
- The *Auth Service* project is on track for delivery next week

**Recommendation:** Redistribute one of Bob's overdue tasks to free up his schedule before the sprint review.`,
    type: null,
};

// Mock history theo đúng spec format: { history: Message[], total, limit }
// Mỗi Message dùng field 'message' (không phải 'content') — giống API thật
const _MOCK_HISTORY = {
    history: [
        { id: 'mock_001', role: 'user',      message: 'Hi! What can you help me with?', type: null, data: null, created_at: '2025-01-01T00:00:00.000Z' },
        { id: 'mock_002', role: 'assistant', message: 'I can help you create **visual roadmaps**, **project folder structures**, and analyze your team\'s workload — all designed to plug directly into your Manask workspace.\n\nTry asking me to build a roadmap or folder tree for your next project!', type: null, data: null, created_at: '2025-01-01T00:00:01.000Z' },
    ],
    total: 2,
    limit: 50,
};

/** Pick a mock AI response based on the message text */
function _pickMockResponse(userText) {
    const lower = (userText || '').toLowerCase();
    if (/roadmap|timeline|milestone|phase|sprint/.test(lower))    return _MOCK_ROADMAP;
    if (/folder|tree|structure|directory|project.+struct/.test(lower)) return _MOCK_FOLDER_TREE;
    if (/analyz|analy|workload|overdue|statistic|report|progress|hours/.test(lower)) return _MOCK_ANALYSIS;
    // Default: cycle through types based on message length so tester sees variety
    const cycle = [_MOCK_ANALYSIS, _MOCK_ROADMAP, _MOCK_FOLDER_TREE];
    return cycle[(userText || '').length % 3];
}

/** Pending mock response waiting for GET /chatbot poll */
let _mockPending = null;

/** Unified fetch wrapper — uses mocks when IS_TEST is true */
// Uses plain fetch (not fetchWithAuth) so we fully control the timeout.
// fetchWithAuth hardcodes 10s on first attempt and overrides any signal passed in.
async function apiFetch(url, options = {}, queueOptions = {}, timeoutMs = 180000) {
    if (!IS_TEST) {
        const method     = (options.method || 'GET').toUpperCase();
        const path       = url.replace(API, '');
        const t0         = performance.now();
        const token      = localStorage.getItem('access_token');
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);

        console.debug(`[Chatbot] ▶ ${method} ${path}`, options.body ? JSON.parse(options.body) : '');

        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const ms = Math.round(performance.now() - t0);

            if (res.status === 401) {
                console.warn(`[Chatbot] 401 Unauthorized — redirecting to auth`);
                localStorage.removeItem('access_token');
                window.location.href = '/pages/auth.html';
                throw new Error('Unauthorized');
            }

            if (res.ok) {
                console.debug(`[Chatbot] ✔ ${method} ${path} — ${res.status} (${ms}ms)`);
            } else {
                console.warn(`[Chatbot] ✖ ${method} ${path} — ${res.status} ${res.statusText} (${ms}ms)`);
            }
            return res;
        } catch (err) {
            clearTimeout(timeoutId);
            const ms = Math.round(performance.now() - t0);
            if (err.name === 'AbortError') {
                console.error(`[Chatbot] ⏱ ${method} ${path} — timed out after ${ms}ms (limit: ${timeoutMs}ms)`);
                throw new Error(t('chatbot.msg_timeout') || 'Request timed out');
            }
            if (err.message !== 'Unauthorized') {
                console.error(`[Chatbot] ✖ ${method} ${path} — network error (${ms}ms)`, err);
            }
            throw err;
        }
    }

    const method = (options.method || 'GET').toUpperCase();
    const path   = url.replace(API, '');

    // Simulate network latency
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const ok = body => new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });

    // GET /chatbot/history
    if (method === 'GET' && path === '/chatbot/history') {
        await delay(400);
        return ok(_MOCK_HISTORY);
    }

    // POST /chatbot — queue a pending response, return empty 200
    if (method === 'POST' && path === '/chatbot') {
        await delay(300);
        let body = {};
        try { body = JSON.parse(options.body || '{}'); } catch { /* */ }
        _mockPending = _pickMockResponse(body.message);
        return ok({});            // no AI msg in POST body → triggers polling
    }

    // GET /chatbot — poll for AI response
    // Trả về đúng spec format: { message, type, data } (không có field 'role')
    if (method === 'GET' && path === '/chatbot') {
        await delay(900);         // simulate AI "thinking"
        if (_mockPending) {
            const msg = _mockPending;
            _mockPending = null;
            return ok({ message: msg.content, type: msg.type ?? null, data: msg.data ?? null });
        }
        return ok({});
    }

    // DELETE /chatbot
    if (method === 'DELETE' && path === '/chatbot') {
        await delay(300);
        return ok({ ok: true });
    }

    // GET /items — project item list (same endpoint as roadmap.js)
    if (method === 'GET' && path === '/items') {
        await delay(200);
        return ok(_MOCK_ITEMS);
    }

    // POST /chatbot/save/*
    if (method === 'POST' && path.startsWith('/chatbot/save/')) {
        await delay(500);
        return ok({ ok: true });
    }

    // Fallback
    await delay(200);
    return ok({});
}

// ── State ──────────────────────────────────────────────────────────────────
let _messages   = [];     // rendered conversation
let _sending    = false;  // lock while request in-flight
let _previewData = null;  // { type, data } currently shown in panel
let _typingEl   = null;   // typing indicator DOM node
let _items      = [];     // cached /items list — used by roadmap node renderer

// ── DOM refs ───────────────────────────────────────────────────────────────
const thread          = document.getElementById('cb-thread');
const inputEl         = document.getElementById('cb-input');
const sendBtn         = document.getElementById('cb-send-btn');
const deleteBtn       = document.getElementById('cb-delete-btn');

const previewPanel    = document.getElementById('cb-preview-panel');
const previewContent  = document.getElementById('cb-preview-content');
const previewTitle    = document.getElementById('cb-preview-title');
const previewBadge    = document.getElementById('cb-preview-badge');
const previewSaveBtn  = document.getElementById('cb-preview-save-btn');
const previewCloseBtn = document.getElementById('cb-preview-close-btn');

const mobilePreview       = document.getElementById('cb-mobile-preview');
const mobPreviewContent   = document.getElementById('cb-mob-preview-content');
const mobPreviewTitle     = document.getElementById('cb-mob-preview-title');
const mobPreviewBadge     = document.getElementById('cb-mob-preview-badge');
const mobPreviewSaveBtn   = document.getElementById('cb-mob-preview-save-btn');
const mobPreviewCloseBtn  = document.getElementById('cb-mob-preview-close-btn');

const confirmOverlay = document.getElementById('cb-confirm-overlay');
const confirmCancel  = document.getElementById('cb-confirm-cancel');
const confirmOk      = document.getElementById('cb-confirm-ok');

const resizerEl      = document.getElementById('cb-resizer');

// ── Boot ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();
    await utils.ensureUserId();
    if (IS_TEST) _mountTestBanner();
    setupEvents();
    setupResizer();
    // Load items + history in parallel (items needed for roadmap node rendering)
    await Promise.all([loadItems(), loadHistory()]);
});

function _mountTestBanner() {
    const banner = document.createElement('div');
    banner.id = 'cb-test-banner';
    banner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
        </svg>
        <span><b>TEST MODE</b> — mock responses active &nbsp;·&nbsp;
              keywords: <b>roadmap</b> · <b>folder</b> · <b>analyz</b> · other → cycles
              &nbsp;·&nbsp; tip: add <b>?test</b> to URL to activate without cache issues</span>
        <button onclick="this.parentElement.remove()" title="Dismiss">&times;</button>`;
    document.body.insertAdjacentElement('afterbegin', banner);
}

// ══════════════════════════════════════════════════════════════════════════
// API
// ══════════════════════════════════════════════════════════════════════════

async function loadItems() {
    try {
        const res = await apiFetch(`${API}/items`);
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error('[Chatbot] loadItems: server error', { status: res.status, body });
            throw new Error('Failed to load items');
        }
        _items = await res.json();
        console.debug(`[Chatbot] loadItems: loaded ${_items.length} item(s)`);
    } catch (err) {
        console.error('[Chatbot] loadItems:', err);
        _items = [];
    }
}

async function loadHistory() {
    try {
        const res = await apiFetch(`${API}/chatbot/history`);
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            console.error('[Chatbot] loadHistory: server error', { status: res.status, body });
            throw new Error('Failed to load history');
        }
        const data = await res.json();
        console.log('[Chatbot] loadHistory: raw response', data);
        // Spec: GET /chatbot/history trả về { history: Message[], total, limit }
        // Mỗi Message dùng field 'message' (không phải 'content') → chuẩn hoá về internal format
        const raw = Array.isArray(data.history) ? data.history
                  : Array.isArray(data) ? data   // fallback nếu server trả plain array
                  : [];
        _messages = raw.slice(-50).map(m => ({
            role:    m.role,
            content: m.message ?? m.content ?? '',
            type:    m.type  ?? null,
            data:    m.data  ?? null,
        }));
        console.debug(`[Chatbot] loadHistory: loaded ${_messages.length} message(s)`);
    } catch (err) {
        console.error('[Chatbot] loadHistory:', err);
        _messages = [];
    }
    renderThread();
}

async function sendMessage(text) {
    if (_sending || !text.trim()) return;
    _sending = true;
    setSendingState(true);

    console.group(`[Chatbot] sendMessage — "${text.trim().slice(0, 60)}${text.length > 60 ? '…' : ''}"`);

    // Optimistic user message
    const userMsg = { role: 'user', content: text.trim() };
    _messages.push(userMsg);
    appendMessage(userMsg);
    scrollToBottom();
    showTyping();

    try {
        // 1. POST user message
        const postRes = await apiFetch(
            `${API}/chatbot`,
            { method: 'POST', body: JSON.stringify({ message: text.trim() }) },
            { onLoadStart: () => {}, onLoadEnd: () => {} }
        );

        if (!postRes.ok) {
            const errBody = await postRes.json().catch(() => ({}));
            console.error('[Chatbot] sendMessage: POST failed', { status: postRes.status, body: errBody });
            throw new Error(errBody.detail || t('chatbot.msg_send_error'));
        }

        // 2. Check if POST response already contains AI message
        let aiMsg = null;
        try {
            const postData = await postRes.json();
            console.log('[Chatbot] POST /chatbot response', postData);
            aiMsg = extractAIMessage(postData);
            if (aiMsg) console.debug('[Chatbot] sendMessage: AI reply in POST response');
        } catch { /* body not JSON or already consumed */ }

        // 3. Poll GET /chatbot if not yet resolved
        if (!aiMsg) {
            console.debug('[Chatbot] sendMessage: no AI reply in POST, starting poll…');
            aiMsg = await pollAIResponse();
        }

        hideTyping();

        if (aiMsg) {
            console.debug('[Chatbot] sendMessage: AI reply received', { type: aiMsg.type || 'text', contentLength: aiMsg.content?.length });
            _messages.push(aiMsg);
            appendMessage(aiMsg);
            scrollToBottom();
        } else {
            console.warn('[Chatbot] sendMessage: no AI reply after polling exhausted');
            utils.showError(t('chatbot.msg_no_response'));
        }
    } catch (err) {
        console.error('[Chatbot] sendMessage: error', err);
        hideTyping();
        utils.showError(err.message || t('chatbot.msg_send_error'));
        // Rollback optimistic user message
        _messages.pop();
        renderThread();
    }

    console.groupEnd();
    _sending = false;
    setSendingState(false);
}

/** Extract AI message from various response shapes */
function extractAIMessage(data) {
    if (!data) return null;
    if (Array.isArray(data)) {
        // Find last assistant message (history array)
        for (let i = data.length - 1; i >= 0; i--) {
            const m = data[i];
            if (m?.role === 'assistant' && (m?.content || m?.message)) {
                return { role: 'assistant', content: m.content ?? m.message, type: m.type ?? null, data: m.data ?? null };
            }
        }
        return null;
    }
    // Spec format: GET /chatbot trả về { message: string, type, data } — không có field 'role'
    if (typeof data.message === 'string' && data.message) {
        return { role: 'assistant', content: data.message, type: data.type ?? null, data: data.data ?? null };
    }
    if (data.role === 'assistant' && data.content) return data;
    // Some APIs wrap in { message: {...} } or { response: {...} }
    if (data.message?.role === 'assistant') return data.message;
    if (data.response?.role === 'assistant') return data.response;
    return null;
}

async function pollAIResponse(maxAttempts = 15, intervalMs = 2000) {
    const interval = IS_TEST ? 600 : intervalMs;
    console.debug(`[Chatbot] pollAIResponse: max ${maxAttempts} attempts, interval ${interval}ms`);

    for (let i = 0; i < maxAttempts; i++) {
        if (i > 0) await sleep(interval);
        console.debug(`[Chatbot] pollAIResponse: attempt ${i + 1}/${maxAttempts}`);
        try {
            const res = await apiFetch(
                `${API}/chatbot`,
                { method: 'GET' },
                { onLoadStart: () => {}, onLoadEnd: () => {} }
            );
            if (!res.ok) {
                console.warn(`[Chatbot] pollAIResponse: attempt ${i + 1} — non-OK status ${res.status}, retrying…`);
                continue;
            }
            const data = await res.json();
            console.log(`[Chatbot] GET /chatbot poll attempt ${i + 1} — raw response`, data);
            const msg  = extractAIMessage(data);
            if (msg) {
                console.log(`[Chatbot] pollAIResponse: resolved on attempt ${i + 1} — AI message`, msg);
                return msg;
            }
            console.debug(`[Chatbot] pollAIResponse: attempt ${i + 1} — empty response, retrying…`);
        } catch (err) {
            console.warn(`[Chatbot] pollAIResponse: attempt ${i + 1} — fetch error, retrying…`, err);
        }
    }

    console.error(`[Chatbot] pollAIResponse: exhausted all ${maxAttempts} attempts — no AI reply`);
    return null;
}

async function saveData(type, data) {
    const endpoint = type === 'folder_tree'
        ? `${API}/chatbot/save/folder-tree`
        : `${API}/chatbot/save/roadmap`;
    if (type === 'roadmap') reconcileRoadmapParents(data);
    const payloadSize = JSON.stringify(data).length;
    console.debug(`[Chatbot] saveData: type=${type}, payload=${payloadSize}B, endpoint=${endpoint}`);
    try {
        const res = await apiFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error('[Chatbot] saveData: server error', { status: res.status, body: errBody, type, endpoint });
            throw new Error(errBody.detail || t('chatbot.msg_save_error'));
        }

        const result = await res.json().catch(() => null);

        if (type === 'roadmap' && result?.created_items?.length) {
            const aiToReal = {};
            for (const ci of result.created_items) {
                aiToReal[ci.ai_id] = ci;
            }

            if (data.nodes) {
                for (const nid of Object.keys(data.nodes)) {
                    const nodeItem = data.nodes[nid].item;
                    if (!nodeItem) continue;
                    const realItem = aiToReal[nodeItem.id];
                    if (realItem) {
                        nodeItem.id        = realItem.id;         // UUID thật
                        nodeItem.parent_id = realItem.parent_id;  // parent_id thật
                    }
                }
            }
            console.debug('[Chatbot] saveData: roadmap nodes updated with real IDs', data.nodes);
        }
        
        console.debug(`[Chatbot] saveData: saved successfully (type=${type})`);
        utils.showSuccess(t('chatbot.msg_saved'));
    } catch (err) {
        console.error('[Chatbot] saveData:', err);
        utils.showError(err.message || t('chatbot.msg_save_error'));
    }
}

async function deleteHistory() {
    console.debug('[Chatbot] deleteHistory: sending DELETE /chatbot');
    try {
        const res = await apiFetch(`${API}/chatbot`, { method: 'DELETE' });
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            console.error('[Chatbot] deleteHistory: server error', { status: res.status, body: errBody });
            throw new Error('Delete failed');
        }
        console.debug('[Chatbot] deleteHistory: cleared successfully');
        _messages = [];
        renderThread();
        closePreview();
        utils.showSuccess(t('chatbot.msg_cleared'));
    } catch (err) {
        console.error('[Chatbot] deleteHistory:', err);
        utils.showError(t('chatbot.msg_clear_error'));
    }
}

// ══════════════════════════════════════════════════════════════════════════
// RENDERING
// ══════════════════════════════════════════════════════════════════════════

function renderThread() {
    thread.innerHTML = '';
    _typingEl = null;

    if (!_messages.length) {
        thread.classList.add('cb-thread--empty');
        thread.appendChild(buildEmptyState());
        return;
    }

    thread.classList.remove('cb-thread--empty');
    _messages.forEach(msg => appendMessage(msg));
    scrollToBottom();
}

// ── Rich onboarding / empty state ────────────────────────────────────────
function buildEmptyState() {
    const chips = [
        t('chatbot.chip_1'),
        t('chatbot.chip_2'),
        t('chatbot.chip_3'),
        t('chatbot.chip_4'),
    ];

    const wrap = document.createElement('div');
    wrap.className = 'cb-empty';

    wrap.innerHTML = `
        <!-- Hero -->
        <div class="cb-empty-hero">
            <div class="cb-empty-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                ${escHtml(t('chatbot.empty_badge'))}
            </div>
            <h2 class="cb-empty-title">${escHtml(t('chatbot.empty_title'))}</h2>
            <p class="cb-empty-subtitle">${escHtml(t('chatbot.empty_subtitle'))}</p>
        </div>

        <!-- Capability cards -->
        <div class="cb-empty-cards">

            <!-- Roadmap card -->
            <div class="cb-empty-card cb-empty-card--roadmap">
                <div class="cb-card-art">
                    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <marker id="es-arr" viewBox="0 0 8 8" refX="6" refY="4"
                                    markerWidth="4" markerHeight="4" orient="auto">
                                <path d="M0,1 L7,4 L0,7 Z" fill="#6366f1"/>
                            </marker>
                        </defs>
                        <!-- Node 1 -->
                        <rect x="6" y="28" width="36" height="22" rx="5"
                              fill="rgba(99,102,241,0.18)" stroke="#6366f1" stroke-width="1.5"/>
                        <circle cx="14" cy="36" r="3" fill="#6366f1" opacity="0.7"/>
                        <rect x="20" y="33" width="16" height="3" rx="1.5" fill="#818cf8" opacity="0.6"/>
                        <rect x="20" y="39" width="12" height="2.5" rx="1.2" fill="#818cf8" opacity="0.35"/>
                        <!-- Arrow 1→2 -->
                        <line x1="42" y1="39" x2="58" y2="39"
                              stroke="#6366f1" stroke-width="1.4" marker-end="url(#es-arr)"/>
                        <!-- Node 2 -->
                        <rect x="60" y="28" width="36" height="22" rx="5"
                              fill="rgba(99,102,241,0.22)" stroke="#818cf8" stroke-width="1.5"/>
                        <circle cx="68" cy="36" r="3" fill="#818cf8" opacity="0.7"/>
                        <rect x="74" y="33" width="14" height="3" rx="1.5" fill="#818cf8" opacity="0.6"/>
                        <rect x="74" y="39" width="18" height="2.5" rx="1.2" fill="#818cf8" opacity="0.35"/>
                        <!-- Arrow 2→3 -->
                        <line x1="96" y1="39" x2="112" y2="39"
                              stroke="#6366f1" stroke-width="1.4" marker-end="url(#es-arr)"/>
                        <!-- Node 3 -->
                        <rect x="114" y="28" width="36" height="22" rx="5"
                              fill="rgba(34,197,94,0.18)" stroke="#22c55e" stroke-width="1.5"/>
                        <circle cx="122" cy="36" r="3" fill="#22c55e" opacity="0.7"/>
                        <rect x="128" y="33" width="14" height="3" rx="1.5" fill="#4ade80" opacity="0.6"/>
                        <rect x="128" y="39" width="10" height="2.5" rx="1.2" fill="#4ade80" opacity="0.35"/>
                        <!-- Decorative arc -->
                        <path d="M24 28 Q24 10 132 28"
                              stroke="rgba(99,102,241,0.2)" stroke-width="1.2"
                              fill="none" stroke-dasharray="4,3"/>
                    </svg>
                </div>
                <div class="cb-card-body">
                    <div class="cb-card-title-row">
                        <span class="cb-card-title">${escHtml(t('chatbot.card_roadmap_title'))}</span>
                        <span class="cb-card-saveable">${escHtml(t('chatbot.card_saveable'))}</span>
                    </div>
                    <p class="cb-card-desc">${escHtml(t('chatbot.card_roadmap_desc'))}</p>
                </div>
            </div>

            <!-- Folder Tree card -->
            <div class="cb-empty-card cb-empty-card--tree">
                <div class="cb-card-art">
                    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Folder -->
                        <path d="M14 28 H28 L32 24 H52 Q57 24 57 29 V44 Q57 49 52 49 H14 Q9 49 9 44 V33 Q9 28 14 28 Z"
                              fill="rgba(245,158,11,0.2)" stroke="#f59e0b" stroke-width="1.5"/>
                        <rect x="18" y="35" width="16" height="2.5" rx="1.2" fill="#f59e0b" opacity="0.5"/>
                        <rect x="18" y="40" width="12" height="2" rx="1" fill="#f59e0b" opacity="0.3"/>
                        <!-- Vertical line -->
                        <line x1="28" y1="49" x2="28" y2="72"
                              stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                        <!-- Project row -->
                        <line x1="28" y1="57" x2="40" y2="57"
                              stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
                        <circle cx="46" cy="57" r="5"
                                fill="rgba(99,102,241,0.25)" stroke="#6366f1" stroke-width="1.2"/>
                        <rect x="54" y="54" width="44" height="7" rx="3"
                              fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.35)" stroke-width="1"/>
                        <rect x="58" y="56.5" width="20" height="2" rx="1" fill="#818cf8" opacity="0.45"/>
                        <!-- Task rows -->
                        <line x1="28" y1="69" x2="40" y2="69"
                              stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
                        <line x1="51" y1="62" x2="51" y2="69"
                              stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                        <circle cx="55" cy="69" r="3"
                                fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                        <rect x="61" y="66" width="36" height="6" rx="2"
                              fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="0.8"/>
                        <rect x="64" y="68" width="16" height="2" rx="1" fill="rgba(255,255,255,0.15)"/>
                        <!-- Second task ghost -->
                        <rect x="61" y="56" width="0" height="0"/>
                        <!-- Priority dot -->
                        <circle cx="104" cy="69" r="2.5" fill="rgba(239,68,68,0.6)"/>
                    </svg>
                </div>
                <div class="cb-card-body">
                    <div class="cb-card-title-row">
                        <span class="cb-card-title">${escHtml(t('chatbot.card_tree_title'))}</span>
                        <span class="cb-card-saveable">${escHtml(t('chatbot.card_saveable'))}</span>
                    </div>
                    <p class="cb-card-desc">${escHtml(t('chatbot.card_tree_desc'))}</p>
                </div>
            </div>

            <!-- Analysis card -->
            <div class="cb-empty-card cb-empty-card--analysis">
                <div class="cb-card-art">
                    <svg viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <!-- Bar chart bars -->
                        <rect x="18" y="50" width="14" height="22" rx="3"
                              fill="rgba(99,102,241,0.35)" stroke="rgba(99,102,241,0.5)" stroke-width="1"/>
                        <rect x="36" y="36" width="14" height="36" rx="3"
                              fill="rgba(99,102,241,0.5)" stroke="rgba(99,102,241,0.7)" stroke-width="1"/>
                        <rect x="54" y="44" width="14" height="28" rx="3"
                              fill="rgba(99,102,241,0.4)" stroke="rgba(99,102,241,0.6)" stroke-width="1"/>
                        <rect x="72" y="28" width="14" height="44" rx="3"
                              fill="rgba(99,102,241,0.65)" stroke="#6366f1" stroke-width="1.2"/>
                        <rect x="90" y="40" width="14" height="32" rx="3"
                              fill="rgba(99,102,241,0.45)" stroke="rgba(99,102,241,0.65)" stroke-width="1"/>
                        <!-- Baseline -->
                        <line x1="12" y1="72" x2="148" y2="72"
                              stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                        <!-- Trend line -->
                        <path d="M25 61 Q43 45 50 53 Q65 35 79 34 Q93 40 97 53"
                              stroke="#22c55e" stroke-width="1.5"
                              fill="none" stroke-linecap="round"/>
                        <!-- Trend dot -->
                        <circle cx="97" cy="53" r="3" fill="#22c55e"/>
                        <!-- Stat card top-right -->
                        <rect x="112" y="14" width="40" height="38" rx="6"
                              fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.25)" stroke-width="1"/>
                        <text x="132" y="30" text-anchor="middle"
                              font-size="11" font-weight="700" fill="#4ade80"
                              font-family="DM Sans, sans-serif">+24%</text>
                        <rect x="118" y="35" width="28" height="2.5" rx="1.2"
                              fill="rgba(34,197,94,0.3)"/>
                        <rect x="118" y="41" width="20" height="2" rx="1"
                              fill="rgba(34,197,94,0.2)"/>
                        <rect x="118" y="46" width="24" height="2" rx="1"
                              fill="rgba(34,197,94,0.15)"/>
                    </svg>
                </div>
                <div class="cb-card-body">
                    <div class="cb-card-title-row">
                        <span class="cb-card-title">${escHtml(t('chatbot.card_analysis_title'))}</span>
                    </div>
                    <p class="cb-card-desc">${escHtml(t('chatbot.card_analysis_desc'))}</p>
                </div>
            </div>

        </div>

        <!-- Suggested prompts -->
        <div class="cb-empty-chips-section">
            <p class="cb-chips-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round">
                    <path d="m9 18 6-6-6-6"/>
                </svg>
                ${escHtml(t('chatbot.chips_label'))}
            </p>
            <div class="cb-chips-row" id="cb-chips-row"></div>
        </div>`;

    // Wire chip clicks
    const row = wrap.querySelector('#cb-chips-row');
    chips.forEach(text => {
        if (!text || text.startsWith('chatbot.')) return; // key missing
        const btn = document.createElement('button');
        btn.className = 'cb-chip';
        btn.textContent = text;
        btn.addEventListener('click', () => {
            inputEl.value = text;
            autoResizeInput();
            inputEl.focus();
        });
        row.appendChild(btn);
    });

    return wrap;
}

function appendMessage(msg) {
    const el = buildMessageEl(msg);
    if (el) {
        // Insert before typing indicator if present
        if (_typingEl && thread.contains(_typingEl)) {
            thread.insertBefore(el, _typingEl);
        } else {
            thread.appendChild(el);
        }
    }
}

function buildMessageEl(msg) {
    const isUser = msg.role === 'user';
    const isAI   = msg.role === 'assistant';
    if (!isUser && !isAI) return null;

    const wrapper = document.createElement('div');
    wrapper.className = `cb-msg cb-msg--${isUser ? 'user' : 'ai'}`;

    // Sender label
    const sender = document.createElement('div');
    sender.className = 'cb-msg-sender';
    sender.textContent = isUser ? t('chatbot.sender_you') : t('chatbot.sender_ai');
    wrapper.appendChild(sender);

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = 'cb-msg-bubble';
    const mdDiv = document.createElement('div');
    mdDiv.className = 'cb-msg-markdown';
    mdDiv.innerHTML = parseMarkdown(msg.content || '');
    bubble.appendChild(mdDiv);
    wrapper.appendChild(bubble);

    // Preview trigger — AI messages with folder_tree or roadmap type only
    if (isAI && (msg.type === 'folder_tree' || msg.type === 'roadmap') && msg.data) {
        wrapper.appendChild(buildPreviewTrigger(msg.type, msg.data));
    }

    return wrapper;
}

function buildPreviewTrigger(type, data) {
    const isRoadmap = type === 'roadmap';
    const title = data?.title || (isRoadmap ? t('chatbot.label_roadmap') : t('chatbot.label_folder_tree'));

    const iconSvg = isRoadmap
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="3" width="7" height="7" rx="1"/>
               <rect x="14" y="3" width="7" height="7" rx="1"/>
               <rect x="3" y="14" width="7" height="7" rx="1"/>
               <line x1="14" y1="17.5" x2="21" y2="17.5"/>
               <line x1="17.5" y1="14" x2="17.5" y2="21"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
               <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
           </svg>`;

    const trigger = document.createElement('div');
    trigger.className = 'cb-preview-trigger';
    trigger.innerHTML = `
        <div class="cb-preview-trigger-left">
            <div class="cb-preview-trigger-icon ${isRoadmap ? 'cb-trigger-icon--roadmap' : 'cb-trigger-icon--folder-tree'}">
                ${iconSvg}
            </div>
            <span class="cb-preview-trigger-label">${escHtml(title)}</span>
        </div>
        <button class="cb-trigger-save-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
            </svg>
            ${escHtml(t('chatbot.btn_save'))}
        </button>`;

    trigger.addEventListener('click', e => {
        if (e.target.closest('.cb-trigger-save-btn')) return;
        openPreview(type, data);
    });

    trigger.querySelector('.cb-trigger-save-btn').addEventListener('click', e => {
        e.stopPropagation();
        saveData(type, data);
    });

    return trigger;
}

// ══════════════════════════════════════════════════════════════════════════
// PREVIEW MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════

function openPreview(type, data) {
    _previewData = { type, data };

    const title     = data?.title || (type === 'roadmap' ? t('chatbot.label_roadmap') : t('chatbot.label_folder_tree'));
    const badgeText = type === 'roadmap' ? 'Roadmap' : 'Folder Tree';
    const badgeClass = type === 'roadmap' ? 'cb-preview-badge--roadmap' : 'cb-preview-badge--folder-tree';

    const isMobile = window.innerWidth <= 768;

    if (!isMobile) resizerEl.hidden = false;

    if (isMobile) {
        mobPreviewTitle.textContent   = title;
        mobPreviewBadge.textContent   = badgeText;
        mobPreviewBadge.className     = `cb-preview-badge ${badgeClass}`;
        mobPreviewContent.innerHTML   = '';
        renderPreviewContent(mobPreviewContent, type, data);
        mobilePreview.hidden          = false;
        mobPreviewSaveBtn.onclick     = () => saveData(type, data);
    } else {
        previewTitle.textContent      = title;
        previewBadge.textContent      = badgeText;
        previewBadge.className        = `cb-preview-badge ${badgeClass}`;
        previewContent.innerHTML      = '';
        renderPreviewContent(previewContent, type, data);
        previewPanel.hidden           = false;
        previewSaveBtn.onclick        = () => saveData(type, data);
    }
}

function closePreview() {
    previewPanel.hidden         = true;
    previewContent.innerHTML    = '';
    mobilePreview.hidden        = true;
    mobPreviewContent.innerHTML = '';
    _previewData = null;
    resizerEl.hidden = true;
    previewPanel.style.width = '';
}

function renderPreviewContent(container, type, data) {
    if (type === 'roadmap')     renderRoadmapPreview(container, data);
    else if (type === 'folder_tree') renderFolderTreePreview(container, data);
}

// ══════════════════════════════════════════════════════════════════════════
// ROADMAP CANVAS PREVIEW
// Adapted from roadmap.js — view-only (pan + zoom, no editing)
// ══════════════════════════════════════════════════════════════════════════

/**
 * Reconcile parent_id / parent_name across all roadmap nodes so that
 * preview rendering and save payload use the same source of truth.
 *
 * Mutates `data.nodes` in-place (idempotent — safe to call multiple times).
 *
 * Logic:
 *   1. Build folderByItemId  { item.id → item }            — for validating parent_id
 *      Build folderByName    { item.name.lower() → item }  — for recovering via parent_name
 *   2. For each PROJECT:
 *      - parent_id valid & points to a FOLDER → override parent_name to match
 *      - parent_id missing/invalid but parent_name matches a FOLDER → recover parent_id
 *      - neither resolves → leave null, emit console.warn
 *   3. FOLDER always gets parent_id = null, parent_name = null
 */
function reconcileRoadmapParents(data) {
    const nodes = data?.nodes;
    if (!nodes || typeof nodes !== 'object') return;

    // ── Pass 1: index all FOLDERs ────────────────────────────────────────
    const folderByItemId = {};   // item.id  → item  (exact match)
    const folderByName   = {};   // item.name.trim().toLowerCase() → item

    for (const [nodeKey, node] of Object.entries(nodes)) {
        const item = node?.item;
        if (!item || item.type !== 'FOLDER') continue;
        if (item.id)   folderByItemId[item.id] = item;
        if (item.name) folderByName[item.name.trim().toLowerCase()] = item;
    }

    // ── Pass 2: reconcile each node ──────────────────────────────────────
    for (const [nodeKey, node] of Object.entries(nodes)) {
        const item = node?.item;
        if (!item) continue;

        // FOLDER → force parent fields to null (matches backend constraint)
        if (item.type === 'FOLDER') {
            item.parent_id   = null;
            item.parent_name = null;
            continue;
        }

        // Only reconcile PROJECT nodes
        if (item.type !== 'PROJECT') continue;

        const hasValidParentId = item.parent_id && folderByItemId[item.parent_id];
        const nameKey          = item.parent_name ? item.parent_name.trim().toLowerCase() : null;
        const hasMatchByName   = nameKey && folderByName[nameKey];

        if (hasValidParentId) {
            // parent_id is valid → ensure parent_name matches the FOLDER's real name
            item.parent_name = folderByItemId[item.parent_id].name;
        } else if (hasMatchByName) {
            // Recover: parent_id missing/bad, but parent_name matches a known FOLDER
            item.parent_id   = folderByName[nameKey].id;
            item.parent_name = folderByName[nameKey].name;   // normalise casing
        } else {
            // Unresolvable — capture original values before clearing, then warn
            const _origId   = item.parent_id;
            const _origName = item.parent_name;
            item.parent_id   = null;
            item.parent_name = null;
            console.warn(
                '[Chatbot] reconcileRoadmapParents: PROJECT parent unresolved',
                { nodeKey, name: item.name, originalParentId: _origId, originalParentName: _origName }
            );
        }
    }
}

function renderRoadmapPreview(container, data) {
    reconcileRoadmapParents(data);
    // ── Normalise: nodes là dict {nid: {x, y, item}}
    //   item = { id, name, type, color, parent_name }  — nhúng trực tiếp, không lookup _items
    const rawNodes = data.nodes || {};
    const nodes = {};
    Object.entries(rawNodes).forEach(([id, n]) => {
        nodes[id] = { x: n.x || 0, y: n.y || 0, item: n.item || null };
    });

    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    const edges     = JSON.parse(JSON.stringify(data.edges || []));
    let panX = data.panX || 0, panY = data.panY || 0, zoom = data.zoom || 1;
    let isPanning = false, panStart = { x: 0, y: 0 };

    // ── DOM — same structure as roadmap.html ──────────────────────────────
    const wrap = document.createElement('div');
    wrap.className = 'cb-rm-wrap';

    const ct = document.createElement('div');
    ct.className = 'cb-rm-transform';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('cb-rm-edge-svg');
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const edgeG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(defs); svg.appendChild(edgeG);

    const cnv = document.createElement('div');
    cnv.className = 'cb-rm-cnv';

    ct.appendChild(svg); ct.appendChild(cnv);

    const zoomBadge = document.createElement('div');
    zoomBadge.className = 'cb-rm-zoom-badge';

    const hintEl = document.createElement('div');
    hintEl.className = 'cb-rm-hint';
    hintEl.textContent = t('chatbot.rm_hint');

    wrap.appendChild(ct);
    wrap.appendChild(zoomBadge);
    wrap.appendChild(hintEl);

    if (!Object.keys(nodesCopy).length) {
        const empty = document.createElement('div');
        empty.className = 'cb-rm-empty';
        empty.innerHTML = `
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4"  y="4"  width="24" height="24" rx="4"/>
                <rect x="36" y="4"  width="24" height="24" rx="4"/>
                <rect x="4"  y="36" width="24" height="24" rx="4"/>
                <rect x="36" y="36" width="24" height="24" rx="4"/>
            </svg>
            <span>${escHtml(t('chatbot.rm_empty'))}</span>`;
        wrap.appendChild(empty);
    }

    container.appendChild(wrap);

    // Unique prefix so multiple open previews don't clash on getElementById
    const pfx = 'cbnd' + Date.now() + '_';

    // ── Render nodes ──────────────────────────────────────────────────────
    Object.entries(nodesCopy).forEach(([nid, nd]) => {
        const el = buildRoadmapNode(pfx + nid, nd);
        el.style.left = nd.x + 'px';
        el.style.top  = nd.y + 'px';
        cnv.appendChild(el);
    });

    // ── Transform (identical to roadmap.js updateTransform) ───────────────
    function applyTransform() {
        ct.style.transform    = `translate(${panX}px,${panY}px) scale(${zoom})`;
        zoomBadge.textContent = Math.round(zoom * 100) + '%';
    }
    applyTransform();

    // Render edges after first paint so offsetWidth/Height are set
    requestAnimationFrame(() => renderRoadmapEdges(edgeG, defs, nodesCopy, edges, pfx));

    // ── Pan (mouse) — identical to roadmap.js ─────────────────────────────
    function isBg(t) {
        return t === wrap || t === cnv || t === svg || t === ct ||
               t.tagName === 'svg' || t.tagName === 'g' || t.tagName === 'path';
    }

    wrap.addEventListener('mousedown', e => {
        if (!isBg(e.target)) return;
        isPanning = true;
        panStart  = { x: e.clientX - panX, y: e.clientY - panY };
        wrap.classList.add('panning');
        e.preventDefault();
    });

    function onMove(e) {
        if (!isPanning) return;
        panX = e.clientX - panStart.x;
        panY = e.clientY - panStart.y;
        applyTransform();
    }
    function onUp() {
        if (!isPanning) return;
        isPanning = false;
        wrap.classList.remove('panning');
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);

    // ── Pan (single-finger touch) ─────────────────────────────────────────
    let touchOrigin = null;
    wrap.addEventListener('touchstart', e => {
        if (e.touches.length === 1) {
            touchOrigin = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
        } else {
            touchOrigin = null;
        }
    }, { passive: true });

    wrap.addEventListener('touchmove', e => {
        if (e.touches.length !== 1 || !touchOrigin) return;
        e.preventDefault();
        panX = e.touches[0].clientX - touchOrigin.x;
        panY = e.touches[0].clientY - touchOrigin.y;
        applyTransform();
    }, { passive: false });

    wrap.addEventListener('touchend', () => { touchOrigin = null; }, { passive: true });

    // ── Zoom (Ctrl+scroll, same as roadmap.js) ────────────────────────────
    wrap.addEventListener('wheel', e => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const rect  = wrap.getBoundingClientRect();
        const mx    = e.clientX - rect.left, my = e.clientY - rect.top;
        const delta = e.deltaY > 0 ? 0.96 : 1.04;
        const nz    = Math.max(0.15, Math.min(4, zoom * delta));
        panX = mx - (mx - panX) * (nz / zoom);
        panY = my - (my - panY) * (nz / zoom);
        zoom = nz;
        applyTransform();
    }, { passive: false });

    // ── Pinch zoom ────────────────────────────────────────────────────────
    let lastPinch = null;
    wrap.addEventListener('touchstart', e => { if (e.touches.length === 2) lastPinch = null; }, { passive: true });
    wrap.addEventListener('touchmove', e => {
        if (e.touches.length !== 2) return;
        e.preventDefault();
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                                e.touches[0].clientY - e.touches[1].clientY);
        if (lastPinch) { zoom = Math.max(0.15, Math.min(4, zoom * dist / lastPinch)); applyTransform(); }
        lastPinch = dist;
    }, { passive: false });

    // ── Cleanup global listeners when canvas is removed ───────────────────
    const obs = new MutationObserver(() => {
        if (!document.contains(wrap)) {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
            obs.disconnect();
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

/** View-only node — mirrors roadmap.js createNodeEl(): type badge + icon + name + parent */
function buildRoadmapNode(fullId, nd) {
    const el = document.createElement('div');
    el.id        = fullId;
    el.className = 'cb-nd';

    const item      = nd.item || {};
    const type      = item.type || 'PROJECT';
    const typeLabel = { FOLDER: 'Folder', PROJECT: 'Project', TASK: 'Task' }[type] || type;
    const color     = item.color || '#6366f1';

    let icoStyle = '';
    if (type === 'TASK') {
        icoStyle = `border-radius:50%;border:2px solid ${color};background:transparent`;
    } else if (type === 'FOLDER') {
        icoStyle = `border-radius:4px;background:${color}`;
    } else {
        icoStyle = `border-radius:3px;background:${color}`;
    }

    const parentName = item.parent_name || null;

    el.innerHTML = `
        <div class="cb-nd-hdr">
            <div class="cb-nd-ico" style="${icoStyle}"></div>
            <span class="cb-nd-lbl">${escHtml(typeLabel)}</span>
        </div>
        <div class="cb-nd-name">${escHtml(item.name || '—')}</div>
        ${parentName ? `<div class="cb-nd-sub">↳ ${escHtml(parentName)}</div>` : ''}`;

    return el;
}

/** Render edges into SVG <g> — mirrors roadmap.js renderEdges(), view-only */
function renderRoadmapEdges(edgeG, defs, nodes, edges, pfx) {
    if (!defs.childNodes.length) {
        [
            { id: 'cbmk-default', color: '#52525b' },
            { id: 'cbmk-green',   color: '#22c55e' },
            { id: 'cbmk-blue',    color: '#818cf8' },
            { id: 'cbmk-purple',  color: '#8b5cf6' },
            { id: 'cbmk-amber',   color: '#f59e0b' },
        ].forEach(({ id, color }) => {
            const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            m.setAttribute('id', id);
            m.setAttribute('viewBox', '0 0 10 10');
            m.setAttribute('refX', '8'); m.setAttribute('refY', '5');
            m.setAttribute('markerWidth', '5'); m.setAttribute('markerHeight', '5');
            m.setAttribute('orient', 'auto-start-reverse');
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            p.setAttribute('d', 'M0,1 L9,5 L0,9 Z');
            p.setAttribute('fill', color);
            m.appendChild(p);
            defs.appendChild(m);
        });
    }

    while (edgeG.firstChild) edgeG.removeChild(edgeG.firstChild);

    edges.forEach(e => {
        if (!nodes[e.from] || !nodes[e.to]) return;

        let fp = e.fromPort, tp = e.toPort;
        if (!fp || !tp) { const bp = rmBestPorts(e.from, e.to, nodes, pfx); fp = bp.fp; tp = bp.tp; }

        const A  = rmPortXY(e.from, fp, nodes, pfx);
        const B  = rmPortXY(e.to,   tp, nodes, pfx);
        const d  = rmCubicD(A, fp, B, tp);

        const src = nodes[e.from];
        const col = src?.item?.color || '#52525b';
        const mk      = rmGetMarker(col);
        const etype   = e.etype || 'one';
        const opacity = e.style === 'faded' ? 0.25 : 0.75;
        const da      = e.style === 'dashed' ? '8,5' : e.style === 'dotted' ? '2,4' : null;

        // Wide invisible hit-area (mirrors roadmap.js)
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hit.setAttribute('d', d);
        hit.setAttribute('stroke', 'transparent');
        hit.setAttribute('stroke-width', '14');
        hit.setAttribute('fill', 'none');
        hit.style.cursor = 'default';

        // Visible path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', col);
        path.setAttribute('stroke-width', '1.8');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', String(opacity));
        path.style.pointerEvents = 'none';
        if (da)              path.setAttribute('stroke-dasharray', da);
        if (etype === 'two') path.setAttribute('marker-start', `url(#${mk})`);
        if (etype !== 'none') path.setAttribute('marker-end', `url(#${mk})`);

        edgeG.appendChild(hit);
        edgeG.appendChild(path);

        if (e.label) {
            const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
            const tw = e.label.length * 6.5 + 12;
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bg.setAttribute('x', String(mx - tw / 2)); bg.setAttribute('y', String(my - 15));
            bg.setAttribute('width', String(tw)); bg.setAttribute('height', '14');
            bg.setAttribute('rx', '4'); bg.setAttribute('fill', '#1a1a20'); bg.setAttribute('opacity', '0.9');
            bg.style.pointerEvents = 'none';
            const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            lbl.setAttribute('x', String(mx)); lbl.setAttribute('y', String(my - 4));
            lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('font-size', '10');
            lbl.setAttribute('fill', col); lbl.setAttribute('font-family', 'DM Sans, sans-serif');
            lbl.style.pointerEvents = 'none';
            lbl.textContent = e.label;
            edgeG.appendChild(bg); edgeG.appendChild(lbl);
        }
    });
}

// ── Geometry helpers — exact mirror of roadmap.js, namespaced ────────────
function rmNodeBox(nid, nodes, pfx) {
    const nd = nodes[nid];
    const el = document.getElementById(pfx + nid);
    return { x: nd.x, y: nd.y, w: el ? el.offsetWidth : 160, h: el ? el.offsetHeight : 72 };
}

function rmPortXY(nid, p, nodes, pfx) {
    const b = rmNodeBox(nid, nodes, pfx);
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    if (p === 'top')    return { x: cx,        y: b.y       };
    if (p === 'bottom') return { x: cx,        y: b.y + b.h };
    if (p === 'left')   return { x: b.x,       y: cy        };
    if (p === 'right')  return { x: b.x + b.w, y: cy        };
    return { x: cx, y: cy };
}

function rmBestPorts(from, to, nodes, pfx) {
    const f  = rmNodeBox(from, nodes, pfx);
    const t2 = rmNodeBox(to,   nodes, pfx);
    const dx = (t2.x + t2.w / 2) - (f.x + f.w / 2);
    const dy = (t2.y + t2.h / 2) - (f.y + f.h / 2);
    if (Math.abs(dy) >= Math.abs(dx))
        return { fp: dy > 0 ? 'bottom' : 'top', tp: dy > 0 ? 'top' : 'bottom' };
    return { fp: dx > 0 ? 'right' : 'left', tp: dx > 0 ? 'left' : 'right' };
}

function rmCubicD(A, fp, B, tp) {
    const d = 70;
    const c1 = { x: fp === 'right' ? A.x + d : fp === 'left' ? A.x - d : A.x,
                 y: fp === 'bottom' ? A.y + d : fp === 'top'  ? A.y - d : A.y };
    const c2 = { x: tp === 'right' ? B.x + d : tp === 'left' ? B.x - d : B.x,
                 y: tp === 'bottom' ? B.y + d : tp === 'top'  ? B.y - d : B.y };
    return `M${A.x},${A.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${B.x},${B.y}`;
}

function rmGetMarker(color) {
    if (!color) return 'cbmk-default';
    const c = color.toLowerCase();
    if (c.includes('22c5') || c.includes('4ade') || c.includes('16a3')) return 'cbmk-green';
    if (c.includes('8b5c') || c.includes('a855'))                        return 'cbmk-purple';
    if (c.includes('6366') || c.includes('818c') || c.includes('4f52')) return 'cbmk-blue';
    if (c.includes('f59e') || c.includes('fbbf'))                        return 'cbmk-amber';
    return 'cbmk-default';
}

// ══════════════════════════════════════════════════════════════════════════
// FOLDER TREE PREVIEW
// Renders flat tree[] as visual hierarchy via parent_id / project_id
// ══════════════════════════════════════════════════════════════════════════

function renderFolderTreePreview(container, data) {
    const tree = data?.tree || [];

    const wrap = document.createElement('div');
    wrap.className = 'cb-ft-tree';

    if (!tree.length) {
        wrap.innerHTML = `<p style="color:var(--text-tertiary);font-size:13px;text-align:center;padding:24px 0">${escHtml(t('chatbot.ft_empty'))}</p>`;
        container.appendChild(wrap);
        return;
    }

    const folders  = tree.filter(i => i.type === 'FOLDER');
    const projects = tree.filter(i => i.type === 'PROJECT');
    const tasks    = tree.filter(i => i.type === 'TASK');

    const knownIds = new Set(tree.map(i => i.id));

    // Top-level: no parent_id, or parent doesn't exist in tree
    const topFolders  = folders.filter(f => !f.parent_id || !knownIds.has(f.parent_id));
    const topProjects = projects.filter(p => !p.parent_id || !knownIds.has(p.parent_id));

    topFolders.forEach(f  => wrap.appendChild(buildFolderEl(f,  folders, projects, tasks, knownIds)));
    topProjects.forEach(p => wrap.appendChild(buildProjectEl(p, projects, tasks)));

    container.appendChild(wrap);
}

function buildFolderEl(folder, allFolders, allProjects, allTasks, knownIds) {
    const el    = document.createElement('div');
    el.className = 'cb-ft-folder expanded';
    const color  = folder.color || '#6366f1';

    el.innerHTML = `
        <div class="cb-ft-folder-header">
            <div class="cb-ft-folder-icon">
                <svg viewBox="0 0 64 64" fill="none">
                    <path d="M8 20 H22 L26 16 H44 Q50 16 50 22 V40 Q50 48 42 48 H16 Q8 48 8 40 Z"
                          fill="${escAttr(color)}" opacity="0.9"/>
                </svg>
            </div>
            <span class="cb-ft-folder-name">${escHtml(folder.name)}</span>
            <span class="cb-ft-folder-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </span>
        </div>
        <div class="cb-ft-folder-children"></div>`;

    el.querySelector('.cb-ft-folder-header').addEventListener('click', () => {
        el.classList.toggle('expanded');
    });

    const childrenEl = el.querySelector('.cb-ft-folder-children');

    // Nested folders
    allFolders
        .filter(f => f.parent_id === folder.id)
        .forEach(sub => childrenEl.appendChild(buildFolderEl(sub, allFolders, allProjects, allTasks, knownIds)));

    // Projects directly under this folder
    allProjects
        .filter(p => p.parent_id === folder.id)
        .forEach(p => childrenEl.appendChild(buildProjectEl(p, allProjects, allTasks)));

    return el;
}

function buildProjectEl(project, allProjects, allTasks) {
    const el     = document.createElement('div');
    el.className = 'cb-ft-project expanded';
    const color  = project.color || '#6366f1';

    el.innerHTML = `
        <div class="cb-ft-project-header">
            <div class="cb-ft-project-dot" style="background:${escAttr(color)}"></div>
            <span class="cb-ft-project-name">${escHtml(project.name)}</span>
            <span class="cb-ft-project-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            </span>
        </div>
        <div class="cb-ft-project-tasks"></div>`;

    el.querySelector('.cb-ft-project-header').addEventListener('click', () => {
        el.classList.toggle('expanded');
    });

    const tasksEl = el.querySelector('.cb-ft-project-tasks');
    allTasks
        .filter(tk => tk.project_id === project.id)
        .forEach(tk => tasksEl.appendChild(buildTaskEl(tk)));

    return el;
}

function buildTaskEl(task) {
    const el     = document.createElement('div');
    el.className = 'cb-ft-task';

    const priority  = task.priority  || null;
    const startDate = task.start_date ? fmtDate(task.start_date) : null;
    const dueDate   = task.due_date   ? fmtDate(task.due_date)   : null;
    const timeSpent = task.time_spent != null
        ? (task.time_spent / 3600).toFixed(2) + ' h'
        : null;
    const progress  = task.process != null ? Number(task.process) : null;

    // Priority badge
    let badgeHtml = '';
    if (priority) {
        badgeHtml = `<span class="cb-ft-task-badge cb-ft-task-badge--${escAttr(priority)}">${escHtml(priority)}</span>`;
    }

    // Date icons
    const calSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8"  y1="2" x2="8"  y2="6"/>
        <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>`;
    const clockSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>`;

    let metaHtml = badgeHtml;
    if (startDate) metaHtml += `<span class="cb-ft-task-meta-item">${calSvg}${escHtml(startDate)}</span>`;
    if (dueDate)   metaHtml += `<span class="cb-ft-task-meta-item">${clockSvg}${escHtml(dueDate)}</span>`;
    if (timeSpent) {
        const timerSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>`;
        metaHtml += `<span class="cb-ft-task-meta-item">${timerSvg}${escHtml(timeSpent)}</span>`;
    }

    const progressHtml = progress != null
        ? `<div class="cb-ft-task-progress-wrap">
               <div class="cb-ft-task-progress-bar">
                   <div class="cb-ft-task-progress-fill" style="width:${Math.min(100, Math.max(0, progress))}%"></div>
               </div>
           </div>`
        : '';

    const notesHtml = task.notes
        ? `<div class="cb-ft-task-notes">${escHtml(task.notes)}</div>`
        : '';

    el.innerHTML = `
        <div class="cb-ft-task-name">${escHtml(task.name || '')}</div>
        ${metaHtml ? `<div class="cb-ft-task-meta">${metaHtml}</div>` : ''}
        ${progressHtml}
        ${notesHtml}`;

    return el;
}

// ══════════════════════════════════════════════════════════════════════════
// RESIZER — Desktop drag-to-resize chat / preview panels
// ══════════════════════════════════════════════════════════════════════════

function setupResizer() {
    if (!resizerEl) return;

    let dragging = false;

    resizerEl.addEventListener('mousedown', e => {
        if (window.innerWidth <= 768) return;
        e.preventDefault();
        dragging = true;
        resizerEl.classList.add('cb-resizer--dragging');
        document.body.style.cursor    = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const appEl   = document.getElementById('cb-app');
        const appRect = appEl.getBoundingClientRect();
        const newW    = appRect.right - e.clientX;
        const minPreview = 260;
        const minChat    = 300;
        const maxPreview = appRect.width - minChat - resizerEl.offsetWidth;
        previewPanel.style.width = Math.max(minPreview, Math.min(maxPreview, newW)) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        resizerEl.classList.remove('cb-resizer--dragging');
        document.body.style.cursor    = '';
        document.body.style.userSelect = '';
    });
}

// ══════════════════════════════════════════════════════════════════════════
// INPUT + EVENTS
// ══════════════════════════════════════════════════════════════════════════

function setupEvents() {
    // Send
    sendBtn.addEventListener('click', handleSend);

    inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-resize textarea
    inputEl.addEventListener('input', autoResizeInput);

    // Delete history button → confirm dialog
    deleteBtn.addEventListener('click', () => {
        confirmOverlay.hidden = false;
    });

    confirmCancel.addEventListener('click', () => {
        confirmOverlay.hidden = true;
    });

    confirmOk.addEventListener('click', async () => {
        confirmOverlay.hidden = true;
        await deleteHistory();
    });

    // Close confirm on backdrop click
    confirmOverlay.addEventListener('click', e => {
        if (e.target === confirmOverlay) confirmOverlay.hidden = true;
    });

    // Preview close buttons
    previewCloseBtn.addEventListener('click', closePreview);
    mobPreviewCloseBtn.addEventListener('click', closePreview);

    // Re-open in correct mode on resize (mobile ↔ desktop breakpoint crossing)
    window.addEventListener('resize', () => {
        if (!_previewData) return;
        const isMobile = window.innerWidth <= 768;
        const mobileOpen  = !mobilePreview.hidden;
        const desktopOpen = !previewPanel.hidden;
        if (isMobile && desktopOpen) {
            closePreview();
            openPreview(_previewData.type, _previewData.data);
        } else if (!isMobile && mobileOpen) {
            closePreview();
            openPreview(_previewData.type, _previewData.data);
        }
    });
}

async function handleSend() {
    const text = inputEl.value.trim();
    if (!text || _sending) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    await sendMessage(text);
}

function autoResizeInput() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + 'px';
}

// ── Typing indicator ────────────────────────────────────────────────────
function showTyping() {
    if (_typingEl) return;
    _typingEl = document.createElement('div');
    _typingEl.className = 'cb-typing';
    _typingEl.innerHTML = `
        <div class="cb-typing-dots">
            <div class="cb-typing-dot"></div>
            <div class="cb-typing-dot"></div>
            <div class="cb-typing-dot"></div>
        </div>`;
    thread.appendChild(_typingEl);
    scrollToBottom();
}

function hideTyping() {
    _typingEl?.remove();
    _typingEl = null;
}

// ── Helpers ─────────────────────────────────────────────────────────────
function setSendingState(on) {
    sendBtn.disabled  = on;
    inputEl.disabled  = on;
}

function scrollToBottom() {
    requestAnimationFrame(() => { thread.scrollTop = thread.scrollHeight; });
}

function parseMarkdown(text) {
    if (!text) return '';
    try {
        if (window.marked) {
            return window.marked.parse(String(text), { breaks: true, gfm: true });
        }
    } catch {}
    // Fallback: escape HTML, preserve newlines
    return escHtml(String(text)).replace(/\n/g, '<br>');
}

function escHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// escAttr: safe for use inside HTML attribute values (style="...")
function escAttr(s) {
    if (s == null) return '';
    return String(s).replace(/[^a-zA-Z0-9#%.,() ]/g, '');
}

function fmtDate(str) {
    if (!str) return '';
    try {
        const d = new Date(str);
        if (isNaN(d)) return str;
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return str;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}