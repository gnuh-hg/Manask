import * as utils from '../utils.js';
import { t, initI18n } from '../i18n.js';
import * as idb from '../idb.js';
import { showHintFloat } from './hint_float.js';

document.addEventListener('DOMContentLoaded', async function () {
    await initI18n();
    if (!utils.TEST){
        const token = localStorage.getItem('access_token');
        if (!token) window.location.href = '/pages/auth.html';
    }
    await utils.ensureUserId();

    showHintFloat({
        storageKey:   'manask_pomo_hinted',
        title:        () => t('hints.pomodoro_title'),
        steps: [
            () => t('hints.pomodoro_step1'),
            () => t('hints.pomodoro_step2'),
            () => t('hints.pomodoro_step3'),
        ],
        dismissLabel: () => t('hints.dismiss'),
    });

    // --- 1. DOM ELEMENTS ---
    const overlay          = document.getElementById('taskOverlay');
    const taskModal        = document.getElementById('taskModal');
    const taskModalList    = document.getElementById('taskModalList');
    const taskSearchInput  = document.getElementById('taskSearchInput');
    const taskTriggerLabel = document.getElementById('taskTriggerLabel');
    const timerDisplay     = document.getElementById('timerDisplay');
    const timerProgress    = document.getElementById('timerProgress');
    const modeLabel        = document.getElementById('modeLabel');
    const sessionDots      = document.getElementById('sessionDots');
    const startBtn         = document.getElementById('startBtn');
    const startIcon        = document.getElementById('startIcon');
    const startLabel       = document.getElementById('startLabel');

    // --- 2. TASK DATA ---
    let tasks        = [];
    let selectedTask = null;
    let tasksLoading = false;
    let tasksError   = false;

    // --- 3. TASK MODAL MANAGEMENT ---

    function getSearchKeyword() {
        return taskSearchInput ? taskSearchInput.value.trim().toLowerCase() : '';
    }

    function onTaskSearch() {
        renderTaskList(getSearchKeyword());
    }

    function renderTaskList(keyword = '') {
        taskModalList.innerHTML = '';

        if (tasksLoading) {
            taskModalList.innerHTML = TASK_SKELETON_HTML;
            return;
        }

        if (tasksError) {
            taskModalList.innerHTML = `
                <div class="pomo-task-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div class="pomo-err-text">
                        <p>${t('pomodoro.task_offline_title')}</p>
                        <span>${t('pomodoro.task_offline_desc')}</span>
                    </div>
                    <button class="pomo-retry-btn">${t('pomodoro.offline_retry')}</button>
                </div>`;
            taskModalList.querySelector('.pomo-retry-btn')?.addEventListener('click', async () => {
                tasksError = false;
                await loadTasks();
            });
            return;
        }

        if (!keyword) {
            const noneItem = document.createElement('div');
            noneItem.className = 'task-item task-item-none' + (selectedTask === null ? ' selected' : '');
            noneItem.innerHTML = `<span class="task-item-dot"></span> ${t('pomodoro.no_task_selected')}`;
            noneItem.addEventListener('click', () => selectTask(null));
            taskModalList.appendChild(noneItem);
        }

        const filtered = keyword
            ? tasks.filter(t => t.name.toLowerCase().includes(keyword))
            : tasks;

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'task-item';
            empty.style.color = 'var(--text-tertiary)';
            empty.style.justifyContent = 'center';
            empty.style.pointerEvents = 'none';
            empty.textContent = keyword ? t('pomodoro.no_tasks_found') : t('pomodoro.no_tasks_available');
            taskModalList.appendChild(empty);
            return;
        }

        filtered.forEach(t => {
            const item = document.createElement('div');
            item.className = 'task-item' + (selectedTask && selectedTask.id === t.id ? ' selected' : '');
            item.innerHTML = `<span class="task-item-dot"></span> <span class="task-item-name">${t.name}</span>`;
            item.addEventListener('click', () => selectTask(t));
            taskModalList.appendChild(item);
        });
    }

    function selectTask(task) {
        selectedTask = task;
        taskTriggerLabel.textContent = task ? task.name : t('pomodoro.select_active_task');
        taskTriggerLabel.style.color = task ? 'var(--text-primary)' : '';
        closeTaskModal();
    }

    function openTaskModal() {
        if (taskSearchInput) taskSearchInput.value = '';
        renderTaskList();
        overlay.classList.add('open');
        requestAnimationFrame(() => {
            taskModal.style.display = 'block';
            requestAnimationFrame(() => {
                taskModal.classList.add('open');
                if (taskSearchInput) taskSearchInput.focus();
            });
        });
    }

    function closeTaskModal() {
        overlay.classList.remove('open');
        taskModal.classList.remove('open');
        setTimeout(() => { taskModal.style.display = 'none'; }, 150);
    }

    // --- 5. TIMER STATE ---
    let interval           = null;
    let running            = false;
    let currentMode        = 'focus'; // 'focus' | 'short' | 'long'
    let totalSeconds       = 25 * 60;
    let remainingSeconds   = totalSeconds;
    let completedPomodoros = 0;

    const CIRCUMFERENCE = 2 * Math.PI * 100; // ~628

    // --- 6. SETTINGS MANAGEMENT ---

    function getSettings() {
        return {
            focusDur:     parseInt(document.getElementById('focusDur').value)  || 25,
            shortDur:     parseInt(document.getElementById('shortDur').value)  || 5,
            longDur:      parseInt(document.getElementById('longDur').value)   || 15,
            longAfter:    parseInt(document.getElementById('longAfter').value) || 4,
            disableBreak: document.getElementById('disableBreak').checked,
            autoFocus:    document.getElementById('autoFocus').checked,
            autoBreak:    document.getElementById('autoBreak').checked,
            soundEnabled: document.getElementById('soundEnabled').checked,
        };
    }

    function applySettingsToUI(data) {
        // API trả về giây, UI dùng phút
        document.getElementById('focusDur').value  = Math.round(data.focus_duration / 60);
        document.getElementById('shortDur').value  = Math.round(data.short_break    / 60);
        document.getElementById('longDur').value   = Math.round(data.long_break     / 60);
        document.getElementById('longAfter').value = data.long_break_after;
        document.getElementById('disableBreak').checked = data.disable_break;
        document.getElementById('autoFocus').checked    = data.auto_start_focus;
        document.getElementById('autoBreak').checked    = data.auto_start_break;
        if (data.sound_enabled !== undefined) document.getElementById('soundEnabled').checked = data.sound_enabled;
    }

    function getDuration(mode) {
        const s = getSettings();
        if (mode === 'focus') return s.focusDur * 60;
        if (mode === 'short') return s.shortDur * 60;
        if (mode === 'long')  return s.longDur  * 60;
    }

    // Debounce PATCH settings — tránh gọi API liên tục khi người dùng bấm +/-
    let settingsPatchTimer = null;
    function schedulePatchSettings() {
        clearTimeout(settingsPatchTimer);
        settingsPatchTimer = setTimeout(() => patchSettings(), 800);
    }

    async function patchSettings() {
        if (utils.TEST) return;
        const s = getSettings();
        const body = {
            focus_duration:   s.focusDur  * 60,
            short_break:      s.shortDur  * 60,
            long_break:       s.longDur   * 60,
            long_break_after: s.longAfter,
            disable_break:    s.disableBreak,
            auto_start_focus: s.autoFocus,
            auto_start_break: s.autoBreak,
            sound_enabled:    s.soundEnabled,
        };

        utils.setUserItem('pomodoro_focus_duration', body.focus_duration);
        utils.setUserItem('pomodoro_short_break', body.short_break);
        utils.setUserItem('pomodoro_long_break', body.long_break);
        utils.setUserItem('pomodoro_long_break_after', body.long_break_after);
        utils.setUserItem('pomodoro_disable_break', body.disable_break);
        utils.setUserItem('pomodoro_auto_focus', body.auto_start_focus);
        utils.setUserItem('pomodoro_auto_break', body.auto_start_break);
        utils.setUserItem('pomodoro_sound_enabled', s.soundEnabled);

        try {
            const res = await utils.fetchWithAuth(
                `${utils.URL_API}/pomodoro/settings`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(body),
                },
                { enableQueue: true},
                utils.generateId(), 1
            );
            if (res.ok) {}
            else { utils.showError('PATCH settings failed'); }
        } catch (err) {
            if (err.message !== 'Unauthorized') utils.showError('PATCH settings error');
        }
    }
    
    function onSettingChange() {
        if (running) return;
        totalSeconds     = getDuration(currentMode);
        remainingSeconds = totalSeconds;
        updateDisplay();
        schedulePatchSettings();
    }

    function changeVal(id, delta) {
        const el     = document.getElementById(id);
        const newVal = Math.max(
            parseInt(el.min || 1),
            Math.min(parseInt(el.max || 99), (parseInt(el.value) || 0) + delta)
        );
        el.value = newVal;
        onSettingChange();
    }

    // --- 7. API: LOAD ON STARTUP ---

    async function loadSettings() {
        const focusDur = utils.getUserItem('pomodoro_focus_duration') || 25 * 60;
        const shortDur = utils.getUserItem('pomodoro_short_break') || 5 * 60;
        const longDur = utils.getUserItem('pomodoro_long_break') || 15 * 60;
        const longAfter = utils.getUserItem('pomodoro_long_break_after') || 4;
        const disableBreak = utils.getUserItem('pomodoro_disable_break') === 'true';
        const autoFocus = utils.getUserItem('pomodoro_auto_focus') === 'true';
        const autoBreak = utils.getUserItem('pomodoro_auto_break') === 'true';
        const soundEnabled = utils.getUserItem('pomodoro_sound_enabled') !== 'false';

        const localData = {
            focus_duration:   parseInt(focusDur),
            short_break:      parseInt(shortDur),
            long_break:       parseInt(longDur),
            long_break_after: parseInt(longAfter),
            disable_break:    disableBreak,
            auto_start_focus: autoFocus,
            auto_start_break: autoBreak,
            sound_enabled:    soundEnabled,
        }

        applySettingsToUI(localData);

        if (utils.TEST) return;

        try {
            const res  = await utils.fetchWithAuth(
                `${utils.URL_API}/pomodoro/settings`,
                { method: 'GET' },
                { onLoadStart: () => {}, onLoadEnd: () => {} }, utils.generateId(), 1
            );

            if (!res.ok) return;
            const data = await res.json();
            applySettingsToUI(data);

            utils.setUserItem('pomodoro_focus_duration', data.focus_duration);
            utils.setUserItem('pomodoro_short_break', data.short_break);
            utils.setUserItem('pomodoro_long_break', data.long_break);
            utils.setUserItem('pomodoro_long_break_after', data.long_break_after);
            utils.setUserItem('pomodoro_disable_break', data.disable_break);
            utils.setUserItem('pomodoro_auto_focus', data.auto_start_focus);
            utils.setUserItem('pomodoro_auto_break', data.auto_start_break);
            if (data.sound_enabled !== undefined) utils.setUserItem('pomodoro_sound_enabled', data.sound_enabled);
        } catch (err) {
            if (err.message !== 'Unauthorized') utils.showError('Load settings error');
        }
    }

    const TASK_SKELETON_HTML = Array.from({ length: 5 }, (_, i) => `
        <div class="pomo-skeleton-row">
            <div class="pomo-sk-dot pm-shimmer"></div>
            <div class="pomo-sk-line pm-shimmer" style="width:${50 + (i % 3) * 14}%"></div>
        </div>`).join('');

    async function loadTasks() {
        if (utils.TEST) {
            tasks = [
                { id: 1, name: 'Design dashboard UI' },
                { id: 2, name: 'Review backend API code' },
                { id: 3, name: 'Write documentation' },
                { id: 4, name: 'Fix bug in login module' },
                { id: 5, name: 'Meeting planning sprint Q2' },
            ];
            return;
        }
        tasksLoading = true;
        tasksError   = false;
        renderTaskList(getSearchKeyword());

        try {
            const res = await utils.fetchWithAuth(
                `${utils.URL_API}/pomodoro/tasks`,
                {},
                { onLoadStart: () => {}, onLoadEnd: () => {} }
            );
            tasksLoading = false;
            if (res.ok) tasks = await res.json();
        } catch (err) {
            tasksLoading = false;
            if (err.message === 'Unauthorized') return;
            tasksError = true;
        }
        renderTaskList(getSearchKeyword());
    }

    // --- 8. API: POST SESSION ---

    async function postSession(mode, durationSeconds) {
        if (utils.TEST) return;

        const modeMap = { focus: 'focus', short: 'short_break', long: 'long_break' };
        const body = {
            mode:         modeMap[mode],
            duration:     durationSeconds,
            task_id:      selectedTask ? selectedTask.id : null,
            completed_at: new Date().toISOString(),
        };
        try {
            const res = await utils.fetchWithAuth(
                `${utils.URL_API}/pomodoro/sessions`,
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                },
                { enableQueue: true },
                utils.generateId(), 1
            );
            if (!res.ok) utils.showError('POST session failed');
        } catch (err) {
            if (err.message !== 'Unauthorized') utils.showError('POST session error');
        }
    }

    // --- 9. UI RENDERING & DISPLAY LOGIC ---

    function updateDisplay() {
        const m = Math.floor(remainingSeconds / 60);
        const s = remainingSeconds % 60;
        timerDisplay.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');

        const ratio = remainingSeconds / totalSeconds;
        timerProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
        timerProgress.setAttribute('class', 'timer-progress' + (currentMode !== 'focus' ? ' break' : ''));

        renderSessionDots();
    }

    function renderSessionDots() {
        const { longAfter } = getSettings();
        sessionDots.innerHTML = '';
        for (let i = 0; i < longAfter; i++) {
            const dot = document.createElement('div');
            dot.className = 'session-dot' + (i < completedPomodoros ? ' done' : '');
            sessionDots.appendChild(dot);
        }
    }

    function updateStartBtn() {
        if (running) {
            startIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            startLabel.textContent = t('pomodoro.btn_pause');
            startBtn.classList.add('pulsing');
        } else {
            startIcon.innerHTML = '<polygon points="5,3 19,12 5,21"/>';
            startLabel.textContent = t('pomodoro.btn_start');
            startBtn.classList.remove('pulsing');
        }
    }

    // --- 10. TIMER CONTROLS ---

    function setMode(mode, tabEl) {
        currentMode = mode;
        document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
        if (tabEl) tabEl.classList.add('active');

        modeLabel.textContent = t(`pomodoro.mode_${mode}`);

        totalSeconds     = getDuration(mode);
        remainingSeconds = totalSeconds;

        if (running) {
            clearInterval(interval);
            running = false;
            updateStartBtn();
        }
        updateDisplay();
    }

    function toggleTimer() {
        if (running) {
            clearInterval(interval);
            running = false;
        } else {
            interval = setInterval(tick, 1000);
            running  = true;
        }
        updateStartBtn();
    }

    function tick() {
        remainingSeconds--;
        updateDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(interval);
            running = false;
            updateStartBtn();
            onTimerEnd();
        }
    }

    function playSessionEndSound() {
        if (!getSettings().soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [783.99, 987.77, 1318.51]; // G5, B5, E6
            notes.forEach((freq, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t0 = ctx.currentTime + i * 0.18;
                gain.gain.setValueAtTime(0, t0);
                gain.gain.linearRampToValueAtTime(0.25, t0 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, t0 + 1.0);
                osc.start(t0);
                osc.stop(t0 + 1.0);
            });
        } catch (_) {}
    }

    async function onTimerEnd(isSkipped = false) {
        const s              = getSettings();
        const finishedMode   = currentMode;
        const finishedDuration = totalSeconds; // thời lượng đã đặt (giây)

        // Ghi nhận phiên vào backend
        if (!isSkipped) {
            playSessionEndSound();
            await postSession(finishedMode, finishedDuration);
        }

        if (finishedMode === 'focus') {
            completedPomodoros++;
            updateDisplay();
            if (!isSkipped) utils.showSuccess(t('pomodoro.msg_focus_done'));

        if (!s.disableBreak) {
                const isLongBreak = completedPomodoros % s.longAfter === 0;
                const nextMode = isLongBreak ? 'long' : 'short';
                const tabs = document.querySelectorAll('.mode-tab');
                const nextTab = isLongBreak ? tabs[2] : tabs[1];
                setMode(nextMode, nextTab);
                if (s.autoBreak) setTimeout(() => toggleTimer(), 500);
            } else {
                const tab = document.querySelectorAll('.mode-tab')[0];
                setMode('focus', tab);
                if (s.autoFocus) setTimeout(() => toggleTimer(), 500);
            }
        } else {
            // Break ended → return to focus
            if (completedPomodoros % s.longAfter === 0) completedPomodoros = 0;
            const tab = document.querySelectorAll('.mode-tab')[0];
            setMode('focus', tab);
            if (!isSkipped) utils.showInfo(t('pomodoro.msg_break_done'));
            if (s.autoFocus) setTimeout(() => toggleTimer(), 500);
        }
    }

    function resetTimer() {
        if (running) {
            clearInterval(interval);
            running = false;
            updateStartBtn();
        }
        remainingSeconds = totalSeconds;
        updateDisplay();
    }

    function skipTimer() {
        if (running) {
            clearInterval(interval);
            running = false;
            updateStartBtn();
        }
        remainingSeconds = 0;
        updateDisplay();
        onTimerEnd(true);
    }

    function closePomodoro() {
        document.body.style.transition = 'opacity 0.3s';
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 300);
    }

    // =========================================================
    // --- 11. UI EVENT BINDINGS ---
    // =========================================================

    document.getElementById('taskTrigger').addEventListener('click', openTaskModal);
    overlay.addEventListener('click', closeTaskModal);
    taskSearchInput?.addEventListener('input', onTaskSearch);

    startBtn.addEventListener('click', toggleTimer);

    document.querySelectorAll('.num-btn').forEach(btn => {
        const target = btn.getAttribute('data-target');
        const delta  = parseInt(btn.getAttribute('data-delta'));
        if (!target || isNaN(delta)) return;
        btn.addEventListener('click', () => changeVal(target, delta));
    });

    document.querySelectorAll('.num-input').forEach(input => {
        input.addEventListener('change', onSettingChange);
    });

    document.querySelectorAll('.toggle input').forEach(toggle => {
        toggle.addEventListener('change', onSettingChange);
    });

    document.querySelector('[title="Reset"]')?.addEventListener('click', resetTimer);
    document.querySelector('[title="Skip"]')?.addEventListener('click', skipTimer);
    document.querySelector('.close-btn')?.addEventListener('click', closePomodoro);

    // --- 12. GLOBAL EXPOSE ---
    window.setMode         = setMode;
    window.toggleTimer     = toggleTimer;
    window.resetTimer      = resetTimer;
    window.skipTimer       = skipTimer;
    window.changeVal       = changeVal;
    window.openTaskModal   = openTaskModal;
    window.closeTaskModal  = closeTaskModal;
    window.onTaskSearch    = onTaskSearch;
    window.onSettingChange = onSettingChange;
    window.closePomodoro   = closePomodoro;
    // ── 13. MOBILE TAB BAR ──────────────────────────────────────────────────
    function setupMobileTabs() {
        const timerPanel    = document.querySelector('.timer-panel');
        const settingsPanel = document.querySelector('.settings-panel');
        const tabs          = document.querySelectorAll('.pomo-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                // Update active indicator
                tabs.forEach(t => t.classList.remove('pomo-tab--active'));
                tab.classList.add('pomo-tab--active');

                // Switch panels
                timerPanel.classList.toggle('pomo-hidden',  target !== 'timer');
                settingsPanel.classList.toggle('pomo-active', target === 'settings');
            });
        });

        const syncPanelsForViewport = () => {
            if (window.innerWidth > 640) {
                // Desktop: cả 2 panel hiện song song — xoá class mobile-toggle
                timerPanel?.classList.remove('pomo-hidden');
                settingsPanel?.classList.remove('pomo-active');
            }
        };
        window.addEventListener('resize', syncPanelsForViewport);
    }

    // ── 14. INITIALIZATION ──────────────────────────────────────────────────
    await Promise.all([loadSettings(), loadTasks()]);
    totalSeconds     = getDuration(currentMode);
    remainingSeconds = totalSeconds;
    updateDisplay();
    setupMobileTabs();

});