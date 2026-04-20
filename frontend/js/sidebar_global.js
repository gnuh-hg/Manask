import * as utils from '../utils.js';
import { t, initI18n, setLang, getLang } from '../i18n.js';

// ── Path helpers ──────────────────────────────────────────────────────────
const inPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
const BASE    = inPages ? '../' : './';

const LINKS = {
    home:       inPages ? '../index.html'           : './index.html',
    pomodoro:   inPages ? './pomodoro.html'          : './pages/pomodoro.html',
    roadmap:    inPages ? './roadmap.html'           : './pages/roadmap.html',
    statistics: inPages ? './statistics.html'        : './pages/statistics.html',
    chatbot:    inPages ? './chatbot.html'           : './pages/chatbot.html',
    about:      inPages ? './about.html'             : './pages/about.html',
    help:       inPages ? './help.html'              : './pages/help.html',
    auth:       inPages ? './auth.html'              : './pages/auth.html',
};

const IMG_LOGO = `${BASE}img/logo_web_v2.png`;

// Pages that don't require auth
const PUBLIC_PAGES = ['about', 'auth', 'help'];

// Pages that auto-collapse the sidebar
const AUTO_COLLAPSE_PAGES = ['roadmap', 'chatbot'];

// Page id → display name key mapping
const PAGE_LABELS = {
    home:       'sidebar.nav_home',
    pomodoro:   'sidebar.nav_pomodoro',
    roadmap:    'sidebar.nav_roadmap',
    statistics: 'sidebar.nav_statistics',
    chatbot:    'sidebar.nav_chatbot',
    about:      'sidebar.nav_about',
    help:       'sidebar.nav_help',
};

// ── Current page detection ────────────────────────────────────────────────
function getCurrentPage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    if (!path.includes('/pages/')) return 'home';
    const m = path.match(/\/pages\/(\w+)\.html/);
    return m ? m[1] : 'home';
}

// ── SVG icons ────────────────────────────────────────────────────────────
const ICONS = {
    home: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><polyline points="9 21 9 12 15 12 15 21"/></svg>`,
    pomodoro: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    roadmap: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><line x1="14" y1="17.5" x2="21" y2="17.5"/><line x1="17.5" y1="14" x2="17.5" y2="21"/></svg>`,
    statistics: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>`,
    chatbot: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    about: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    help: `<svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    collapse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    hamburger: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    chevronDown: `<svg class="gsp-collapsible-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`,
};

// ── State ─────────────────────────────────────────────────────────────────
let currentUser = { username: '', email: '' };

// ── Build sidebar HTML ────────────────────────────────────────────────────
function buildSidebarHTML(page) {
    const navItems = [
        { id: 'home',       href: LINKS.home,       labelKey: 'sidebar.nav_home' },
        { id: 'pomodoro',   href: LINKS.pomodoro,   labelKey: 'sidebar.nav_pomodoro' },
        { id: 'roadmap',    href: LINKS.roadmap,    labelKey: 'sidebar.nav_roadmap' },
        { id: 'statistics', href: LINKS.statistics, labelKey: 'sidebar.nav_statistics' },
        { id: 'chatbot',    href: LINKS.chatbot,    labelKey: 'sidebar.nav_chatbot' },
        { id: 'about',      href: LINKS.about,      labelKey: 'sidebar.nav_about' },
        { id: 'help',       href: LINKS.help,       labelKey: 'sidebar.nav_help' },
    ];

    const navHTML = navItems.map(item => `
        <a href="${item.href}"
           class="gs-nav-item${item.id === page ? ' active' : ''}"
           data-label="${t(item.labelKey)}">
            ${ICONS[item.id]}
            <span class="gs-nav-label" data-i18n="${item.labelKey}">${t(item.labelKey)}</span>
        </a>
    `).join('');

    return `
    <aside class="global-sidebar" id="globalSidebar">
        <!-- Brand: expanded shows name+collapse; collapsed shows hamburger only -->
        <div class="gs-brand">
            <span class="gs-brand-name gs-brand-expanded-only">Manask</span>
            <button class="gs-toggle" id="gsToggle"
                    aria-label="${t('sidebar.collapse')}">
                <svg class="gs-toggle-icon gs-toggle-icon--collapse"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                </svg>
                <svg class="gs-toggle-icon gs-toggle-icon--expand"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2.5" stroke-linecap="round">
                    <line x1="3" y1="6"  x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
        </div>
        <nav class="gs-nav" id="gsNav">
            ${navHTML}
        </nav>
        <!-- Bottom: website logo instead of user avatar -->
        <div class="gs-user" id="gsUser">
            <img class="gs-user-logo" src="${IMG_LOGO}" alt="Manask">
            <div class="gs-user-info">
                <div class="gs-user-name" id="gsUserName">${t('home.header_loading')}</div>
                <div class="gs-user-email" id="gsUserEmail"></div>
            </div>
        </div>
    </aside>

    <!-- Profile Popup -->
    <div class="gs-profile-popup" id="gsProfilePopup">
        <div class="gsp-header">
            <div class="gsp-avatar" id="gspAvatar">?</div>
            <div class="gsp-info">
                <div class="gsp-name" id="gspName">—</div>
                <div class="gsp-email" id="gspEmail">—</div>
            </div>
            <button class="gsp-lang" id="gspLang">${getLang().toUpperCase()}</button>
        </div>

        <!-- Edit name -->
        <label class="gsp-section-label" data-i18n="home.profile_change_name">${t('home.profile_change_name')}</label>
        <input  class="gsp-input" id="gspNameInput"
                data-i18n-placeholder="home.profile_name_placeholder"
                placeholder="${t('home.profile_name_placeholder')}">
        <div class="gsp-btn-row">
            <button class="gsp-btn" id="gspCancelName" data-i18n="home.btn_cancel">${t('home.btn_cancel')}</button>
            <button class="gsp-btn gsp-btn-primary" id="gspSaveName" data-i18n="home.btn_save">${t('home.btn_save')}</button>
        </div>

        <div class="gsp-divider"></div>

        <!-- Change password collapsible -->
        <div class="gsp-collapsible-header" id="gspPwHeader">
            <div class="gsp-collapsible-title">
                ${ICONS.lock}
                <span data-i18n="home.profile_change_password">${t('home.profile_change_password')}</span>
            </div>
            ${ICONS.chevronDown}
        </div>
        <div class="gsp-collapsible-content" id="gspPwContent">
            <div class="gsp-collapsible-body">
                <label class="gsp-pw-label" data-i18n="home.password_current">${t('home.password_current')}</label>
                <div class="gsp-pw-wrap">
                    <input class="gsp-pw-input" id="gspCurrentPw" type="password"
                           data-i18n-placeholder="home.password_current_placeholder"
                           placeholder="${t('home.password_current_placeholder')}">
                    <span class="gsp-pw-toggle" id="gspToggleCurrent">${ICONS.eye}</span>
                </div>
                <label class="gsp-pw-label" data-i18n="home.password_new">${t('home.password_new')}</label>
                <div class="gsp-pw-wrap">
                    <input class="gsp-pw-input" id="gspNewPw" type="password"
                           data-i18n-placeholder="home.password_new_placeholder"
                           placeholder="${t('home.password_new_placeholder')}">
                    <span class="gsp-pw-toggle" id="gspToggleNew">${ICONS.eye}</span>
                </div>
                <label class="gsp-pw-label" data-i18n="home.password_confirm">${t('home.password_confirm')}</label>
                <div class="gsp-pw-wrap">
                    <input class="gsp-pw-input" id="gspConfirmPw" type="password"
                           data-i18n-placeholder="home.password_confirm_placeholder"
                           placeholder="${t('home.password_confirm_placeholder')}">
                    <span class="gsp-pw-toggle" id="gspToggleConfirm">${ICONS.eye}</span>
                </div>
                <div class="gsp-btn-row">
                    <button class="gsp-btn" id="gspCancelPw" data-i18n="home.btn_cancel">${t('home.btn_cancel')}</button>
                    <button class="gsp-btn gsp-btn-primary" id="gspSavePw" data-i18n="home.profile_change_password">${t('home.profile_change_password')}</button>
                </div>
            </div>
        </div>

        <div class="gsp-divider"></div>

        <button class="gsp-logout" id="gspLogout">
            ${ICONS.logout}
            <span data-i18n="home.btn_logout">${t('home.btn_logout')}</span>
        </button>
    </div>

    <!-- Mobile floating trigger -->
    <button class="gs-mob-trigger" id="gsMobTrigger" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
    </button>

    <!-- Mobile overlay -->
    <div class="gs-mobile-overlay" id="gsMobileOverlay"></div>
    `;
}

// ── Inject sidebar ────────────────────────────────────────────────────────
function injectSidebar(page) {
    const tmp = document.createElement('div');
    tmp.innerHTML = buildSidebarHTML(page);
    while (tmp.firstChild) {
        document.body.insertBefore(tmp.firstChild, document.body.firstChild);
    }
}

// ── Collapse / Expand ─────────────────────────────────────────────────────
function isCollapsed() {
    return localStorage.getItem('sidebarCollapsed') === 'true';
}

function applyCollapse(collapsed) {
    document.body.classList.toggle('gs-collapsed', collapsed);
}

function toggleCollapse() {
    const next = !isCollapsed();
    localStorage.setItem('sidebarCollapsed', String(next));
    applyCollapse(next);
}

// ── Mobile sidebar ────────────────────────────────────────────────────────
function openMobileSidebar() {
    document.getElementById('globalSidebar')?.classList.add('mobile-open');
    document.getElementById('gsMobileOverlay')?.classList.add('active');
    document.getElementById('gsMobTrigger')?.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden';
}

function closeMobileSidebar() {
    document.getElementById('globalSidebar')?.classList.remove('mobile-open');
    document.getElementById('gsMobileOverlay')?.classList.remove('active');
    document.getElementById('gsMobTrigger')?.classList.remove('sidebar-open');
    document.body.style.overflow = '';
}

// ── Profile popup ─────────────────────────────────────────────────────────
function openProfilePopup() {
    document.getElementById('gsProfilePopup')?.classList.add('active');
}

function closeProfilePopup() {
    document.getElementById('gsProfilePopup')?.classList.remove('active');
}

// ── Update UI with user data ──────────────────────────────────────────────
function updateUserUI() {
    const initial = (currentUser.username || '?')[0].toUpperCase();

    // Sidebar user section (name + email only; logo is website image now)
    const gsUserName  = document.getElementById('gsUserName');
    const gsUserEmail = document.getElementById('gsUserEmail');
    if (gsUserName)  gsUserName.textContent  = currentUser.username || '—';
    if (gsUserEmail) gsUserEmail.textContent = currentUser.email    || '';

    // Popup header avatar (still uses initials)
    const gspAvatar = document.getElementById('gspAvatar');
    const gspName   = document.getElementById('gspName');
    const gspEmail  = document.getElementById('gspEmail');
    if (gspAvatar) gspAvatar.textContent = initial;
    if (gspName)   gspName.textContent   = currentUser.username || '—';
    if (gspEmail)  gspEmail.textContent  = currentUser.email    || '';

    // Name input
    const nameInput = document.getElementById('gspNameInput');
    if (nameInput) nameInput.value = currentUser.username || '';

}

// ── Fetch user data ───────────────────────────────────────────────────────
async function fetchUserData() {
    try {
        const cached = utils.getUserItem('username');
        if (cached) {
            currentUser = { username: cached, email: utils.getUserItem('email') || '' };
            updateUserUI();
        }
        if (utils.TEST) {
            currentUser = { username: 'Admin Taskora', email: 'admin@example.com' };
            updateUserUI();
            return;
        }
        const res = await utils.fetchWithAuth(
            `${utils.URL_API}/account`,
            { method: 'GET' },
            { onLoadStart: () => {}, onLoadEnd: () => {} },
            utils.generateId(), 1
        );
        if (!res.ok) throw new Error('Failed');
        currentUser = await res.json();
        utils.setUserItem('username', currentUser.username);
        utils.setUserItem('email',    currentUser.email);
        updateUserUI();
    } catch (e) {
        console.error('Sidebar: fetch user error', e);
    }
}

// ── Password toggle helper ────────────────────────────────────────────────
function togglePwVisibility(inputEl, toggleEl) {
    if (!inputEl) return;
    const isHidden = inputEl.type === 'password';
    inputEl.type = isHidden ? 'text' : 'password';
    toggleEl.innerHTML = isHidden ? ICONS.eyeOff : ICONS.eye;
}

// ── Save name ─────────────────────────────────────────────────────────────
async function saveName() {
    const input = document.getElementById('gspNameInput');
    const newName = input?.value.trim();
    if (!newName) { utils.showWarning(t('home.profile_name_placeholder')); return; }
    try {
        if (utils.TEST) {
            currentUser.username = newName;
            utils.setUserItem('username', newName);
            updateUserUI();
            utils.showSuccess(t('home.msg_name_updated'));
            return;
        }
        const res = await utils.fetchWithAuth(
            `${utils.URL_API}/account`,
            { method: 'PATCH', body: JSON.stringify({ username: newName }) },
            { enableQueue: true },
            utils.generateId(), 1
        );
        if (!res.ok) throw new Error();
        currentUser.username = newName;
        utils.setUserItem('username', newName);
        updateUserUI();
        utils.showSuccess(t('home.msg_name_updated'));
    } catch {
        utils.showError(t('home.msg_name_failed'));
    }
}

// ── Save password ─────────────────────────────────────────────────────────
async function savePassword() {
    const current = document.getElementById('gspCurrentPw')?.value;
    const newPw   = document.getElementById('gspNewPw')?.value;
    const confirm = document.getElementById('gspConfirmPw')?.value;

    if (!current || !newPw || !confirm) {
        utils.showWarning(t('home.msg_password_fill_all')); return;
    }
    if (newPw.length < 6) {
        utils.showWarning(t('home.msg_password_min_length')); return;
    }
    if (newPw !== confirm) {
        utils.showWarning(t('home.msg_password_mismatch')); return;
    }
    try {
        if (utils.TEST) {
            utils.showSuccess(t('home.msg_password_changed'));
            clearPasswordFields();
            return;
        }
        const res = await utils.fetchWithAuth(`${utils.URL_API}/account/password`, {
            method: 'PATCH',
            body: JSON.stringify({ current_password: current, new_password: newPw, confirm_password: confirm })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed');
        }
        utils.showSuccess(t('home.msg_password_changed'));
        clearPasswordFields();
        // collapse password section
        document.getElementById('gspPwContent')?.classList.remove('active');
        document.getElementById('gspPwHeader')?.classList.remove('active');
    } catch {
        utils.showError(t('home.msg_password_failed'));
    }
}

function clearPasswordFields() {
    ['gspCurrentPw', 'gspNewPw', 'gspConfirmPw'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ── Bind events ───────────────────────────────────────────────────────────
function bindEvents() {
    // Collapse toggle (desktop) / close button (mobile)
    document.getElementById('gsToggle')?.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            closeMobileSidebar();
        } else {
            toggleCollapse();
        }
    });

    // Mobile floating trigger → open sidebar
    document.getElementById('gsMobTrigger')?.addEventListener('click', openMobileSidebar);
    document.getElementById('gsMobileOverlay')?.addEventListener('click', closeMobileSidebar);

    // Close sidebar on nav click (mobile)
    document.querySelectorAll('.gs-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeMobileSidebar();
        });
    });

    // User section → open popup
    document.getElementById('gsUser')?.addEventListener('click', e => {
        e.stopPropagation();
        const popup = document.getElementById('gsProfilePopup');
        popup?.classList.contains('active') ? closeProfilePopup() : openProfilePopup();
    });

    // Close popup on outside click
    document.addEventListener('click', e => {
        const popup = document.getElementById('gsProfilePopup');
        const user  = document.getElementById('gsUser');
        if (popup && !popup.contains(e.target) && !user?.contains(e.target)) {
            closeProfilePopup();
        }
    });
    document.getElementById('gsProfilePopup')?.addEventListener('click', e => e.stopPropagation());

    // Language toggle
    document.getElementById('gspLang')?.addEventListener('click', () => {
        const next = getLang() === 'en' ? 'vi' : 'en';
        setLang(next);
        const btn = document.getElementById('gspLang');
        if (btn) btn.textContent = next.toUpperCase();
    });

    // Save name
    document.getElementById('gspSaveName')?.addEventListener('click', saveName);
    document.getElementById('gspCancelName')?.addEventListener('click', () => {
        const input = document.getElementById('gspNameInput');
        if (input) input.value = currentUser.username || '';
    });

    // Password section toggle
    document.getElementById('gspPwHeader')?.addEventListener('click', () => {
        document.getElementById('gspPwContent')?.classList.toggle('active');
        document.getElementById('gspPwHeader')?.classList.toggle('active');
    });

    // Password visibility toggles
    document.getElementById('gspToggleCurrent')?.addEventListener('click', () =>
        togglePwVisibility(document.getElementById('gspCurrentPw'), document.getElementById('gspToggleCurrent')));
    document.getElementById('gspToggleNew')?.addEventListener('click', () =>
        togglePwVisibility(document.getElementById('gspNewPw'), document.getElementById('gspToggleNew')));
    document.getElementById('gspToggleConfirm')?.addEventListener('click', () =>
        togglePwVisibility(document.getElementById('gspConfirmPw'), document.getElementById('gspToggleConfirm')));

    // Save / cancel password
    document.getElementById('gspSavePw')?.addEventListener('click', savePassword);
    document.getElementById('gspCancelPw')?.addEventListener('click', () => {
        clearPasswordFields();
        document.getElementById('gspPwContent')?.classList.remove('active');
        document.getElementById('gspPwHeader')?.classList.remove('active');
    });

    // Logout
    document.getElementById('gspLogout')?.addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_id');
        window.location.href = LINKS.auth;
    });

    // Resize → reset mobile state
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMobileSidebar();
    });

    // Lang change → update nav labels
    window.addEventListener('langChanged', () => {
        document.querySelectorAll('.gs-nav-item .gs-nav-label').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) el.textContent = t(key);
        });
        document.querySelectorAll('.gs-nav-item').forEach(el => {
            const labelEl = el.querySelector('.gs-nav-label');
            if (labelEl) el.setAttribute('data-label', labelEl.textContent);
        });
        const langBtn = document.getElementById('gspLang');
        if (langBtn) langBtn.textContent = getLang().toUpperCase();
    });
}

// ── Auth check ────────────────────────────────────────────────────────────
function checkAuth(page) {
    if (PUBLIC_PAGES.includes(page)) return true;
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = LINKS.auth;
        return false;
    }
    return true;
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await initI18n();

    const page = getCurrentPage();

    // Auth check
    if (!checkAuth(page)) return;

    // Inject sidebar HTML
    injectSidebar(page);

    // Apply collapse state
    const page_auto_collapse = AUTO_COLLAPSE_PAGES.includes(page);
    if (page_auto_collapse) {
        // Auto-collapse on focused pages, don't overwrite user pref
        document.body.classList.add('gs-collapsed');
    } else {
        applyCollapse(isCollapsed());
    }

    // Bind events
    bindEvents();

    // Fetch user (skip on public pages)
    if (!PUBLIC_PAGES.includes(page)) {
        fetchUserData();
    }
});
