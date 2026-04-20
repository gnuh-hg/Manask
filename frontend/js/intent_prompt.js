/**
 * intent_prompt.js — Floating intent card for new users after onboarding.
 *
 * Trigger conditions (ALL must be true):
 *   - manask_onboarded === '1'
 *   - !manask_intent_asked
 *   - current page is index.html (or root '/')
 *
 * If user just finished onboarding in this session → wait for 'onboardingClosed' event.
 * If user already onboarded before (flag set on load) → show after DOMContentLoaded.
 */

(async function () {
    try {
    // ── Guard: only index.html ──────────────────────────────────────────────
    const path = window.location.pathname;
    const isIndex = path.endsWith('index.html') || path === '/' || path === '';
    if (!isIndex) return;

    // ── Guard: already asked ────────────────────────────────────────────────
    if (localStorage.getItem('manask_intent_asked')) return;

    // ── Lazy imports (deferred so non-index pages pay no cost) ──────────────
    const [{ showHintFloat }, { t, initI18n }, utils] = await Promise.all([
        import('./hint_float.js'),
        import('../i18n.js'),
        import('../utils.js').then(m => ({ 
            showInfo: m.showInfo, 
            showError: m.showError, 
            showSuccess: m.showSuccess, 
            URL_API: m.URL_API 
        })),
    ]);

    await initI18n();

    // ── onSubmit handler ────────────────────────────────────────────────────
    async function onSubmit(text) {
        utils.showInfo(t('hints.intent_thinking'));

        const token = localStorage.getItem('access_token');

        // ── helpers ──────────────────────────────────────────────────
        function extractAIMessage(data) {
            if (!data) return null;
            if (typeof data.message === 'string' && data.message)
                return { role: 'assistant', content: data.message, type: data.type ?? null, data: data.data ?? null };
            if (data.role === 'assistant' && data.content) return data;
            return null;
        }

        async function pollAI(maxAttempts = 15, intervalMs = 2000) {
            for (let i = 0; i < maxAttempts; i++) {
                if (i > 0) await new Promise(r => setTimeout(r, intervalMs));
                try {
                    const r = await fetch(`${utils.URL_API}/chatbot`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!r.ok) continue;
                    const msg = extractAIMessage(await r.json());
                    if (msg) return msg;
                } catch { /* network blip — retry */ }
            }
            return null;
        }

        async function saveAIData(type, data) {
            const endpoint = type === 'folder_tree'
                ? `${utils.URL_API}/chatbot/save/folder-tree`
                : `${utils.URL_API}/chatbot/save/roadmap`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('save failed');
        }

        // ── 1. POST /chatbot ──────────────────────────────────────────
        let postRes;
        try {
            postRes = await fetch(`${utils.URL_API}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ message: text.trim() }),
            });
        } catch {
            utils.showError(t('hints.intent_error'));
            throw new Error('network error');
        }

        if (!postRes.ok) {
            if (postRes.status === 401) {
                localStorage.removeItem('access_token');
                window.location.href = '/pages/auth.html';
                return;
            }
            utils.showError(t('hints.intent_error'));
            throw new Error('POST /chatbot failed');   // giữ card alive để retry
        }

        // ── 2. Lấy AI message (từ POST response hoặc poll) ────────────
        let aiMsg = null;
        try { aiMsg = extractAIMessage(await postRes.json()); } catch { /* body empty */ }
        if (!aiMsg) aiMsg = await pollAI();

        if (!aiMsg || !aiMsg.type || !aiMsg.data) {
            utils.showError(t('hints.intent_error'));
            return;
        }

        // ── 3. Auto-save ──────────────────────────────────────────────
        try {
            await saveAIData(aiMsg.type, aiMsg.data);
        } catch {
            utils.showError(t('hints.intent_error'));
            return;
        }

        // ── 4. Đếm folder và thông báo ────────────────────────────────
        let folderCount = 0;
        if (aiMsg.type === 'roadmap') {
            folderCount = Object.values(aiMsg.data.nodes || {})
                .filter(n => n.item?.type === 'FOLDER').length;
        } else {
            folderCount = (aiMsg.data.tree || [])
                .filter(i => i.type === 'FOLDER').length;
        }

        utils.showSuccess(t('hints.intent_folders_done', { n: folderCount }));
        document.dispatchEvent(new CustomEvent('projectUpdated', { detail: {} }));
    }

    // ── Show card ───────────────────────────────────────────────────────────
    function showCard() {
        // Re-check flag (user may have refreshed mid-session)
        if (localStorage.getItem('manask_intent_asked')) return;

        showHintFloat({
            variant: 'intent',
            storageKey: 'manask_intent_asked',
            title: () => t('hints.intent_title'),
            placeholder: () => t('hints.intent_placeholder'),
            submitLabel: () => t('hints.intent_submit'),
            skipLabel: () => t('hints.intent_skip'),
            onSubmit,
            onSkip: () => { },   // flag set by helper; no extra action needed
        });
    }

    // ── Timing: wait for onboarding if it's still open ──────────────────────
    if (!localStorage.getItem('manask_onboarded')) {
        // onboarding will fire 'onboardingClosed' when done
        document.addEventListener('onboardingClosed', () => {
            setTimeout(showCard, 300);
        }, { once: true });
    } else {
        // Already onboarded before — show after a short delay so the page settles
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(showCard, 300));
        } else {
            setTimeout(showCard, 300);
        }
    }
    } catch (err) {
        console.error('[intent_prompt] Error:', err);
    }
})();