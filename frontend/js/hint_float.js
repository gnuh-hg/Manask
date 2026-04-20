/**
 * hint_float.js — Shared floating hint card helper
 *
 * Usage:
 *   import { showHintFloat } from './hint_float.js';
 *
 *   showHintFloat({
 *     storageKey:   'manask_xxx_hinted',
 *     title:        () => t('hints.xxx_title'),   // string or () => string
 *     steps:        [() => t('hints.xxx_step1')], // array of string or () => string
 *     dismissLabel: () => t('hints.dismiss'),
 *     // --- intent variant only ---
 *     variant:      'intent',
 *     placeholder:  () => t('hints.intent_placeholder'),
 *     submitLabel:  () => t('hints.intent_submit'),
 *     skipLabel:    () => t('hints.intent_skip'),
 *     onSubmit:     async (text) => { ... },  // throw to keep card alive
 *     onSkip:       () => {},
 *   });
 */

const resolve = v => (typeof v === 'function' ? v() : v);

/**
 * Show a floating hint card.
 * Returns early (no-op) if the storageKey flag is already set.
 */
export function showHintFloat(options = {}) {
    const {
        storageKey,
        title,
        steps = [],
        dismissLabel,
        variant = 'default',
        placeholder,
        submitLabel,
        skipLabel,
        onSubmit,
        onSkip,
    } = options;

    if (!storageKey) return;
    if (localStorage.getItem(storageKey)) return;

    const card = document.createElement('div');
    card.className = `hint-float hint-float--${variant}`;

    if (variant === 'intent') {
        card.innerHTML = `
            <p class="hint-float-title">${resolve(title) ?? ''}</p>
            <textarea
                class="hint-float-textarea"
                placeholder="${resolve(placeholder) ?? ''}"
                rows="3"
            ></textarea>
            <div class="hint-float-actions">
                <button class="hint-float-btn-ghost hint-float-skip">${resolve(skipLabel) ?? 'Later'}</button>
                <button class="hint-float-btn-primary hint-float-submit">${resolve(submitLabel) ?? 'Submit'}</button>
            </div>`;

        const textarea   = card.querySelector('.hint-float-textarea');
        const submitBtn  = card.querySelector('.hint-float-submit');
        const skipBtn    = card.querySelector('.hint-float-skip');

        submitBtn.addEventListener('click', async () => {
            const text = textarea.value.trim();
            if (!text) {
                textarea.focus();
                return;
            }

            // Disable UI while loading
            textarea.disabled = true;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="hint-float-spinner"></span>';
            skipBtn.disabled = true;

            try {
                await onSubmit?.(text);
                _dismiss(card, storageKey);
            } catch {
                // Restore UI so user can retry — caller handles toast error
                textarea.disabled = false;
                submitBtn.disabled = false;
                submitBtn.textContent = resolve(submitLabel) ?? 'Submit';
                skipBtn.disabled = false;
            }
        });

        skipBtn.addEventListener('click', () => {
            onSkip?.();
            _dismiss(card, storageKey);
        });

    } else {
        // Default variant: title + ordered steps + dismiss button
        const stepsHtml = steps
            .map((s, i) => `<li><span class="hint-num">${i + 1}.</span> ${resolve(s)}</li>`)
            .join('');

        card.innerHTML = `
            <p class="hint-float-title">${resolve(title) ?? ''}</p>
            <ol class="hint-float-steps">${stepsHtml}</ol>
            <button class="hint-float-dismiss">${resolve(dismissLabel) ?? 'Got it'}</button>`;

        card.querySelector('.hint-float-dismiss').addEventListener('click', () => {
            _dismiss(card, storageKey);
        });
    }

    document.body.appendChild(card);
}

/**
 * Programmatically dismiss a hint card (e.g. if shown via code).
 * Sets the flag and fades out / removes the card if present.
 */
export function dismissHintFloat(storageKey) {
    if (!storageKey) return;
    localStorage.setItem(storageKey, '1');
    document.querySelectorAll('.hint-float').forEach(el => {
        if (el.dataset.storageKey === storageKey) {
            _dismiss(el, storageKey);
        }
    });
}

// ── Internal helpers ────────────────────────────────────────────────────────

function _dismiss(card, storageKey) {
    localStorage.setItem(storageKey, '1');
    card.classList.add('hint-float--out');
    setTimeout(() => card.remove(), 300);
}