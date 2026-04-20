(function () {
    if (localStorage.getItem('manask_onboarded')) return;

    let currentStep = 1;
    const TOTAL_STEPS = 3;

    const STEPS_HTML = [
        /* Step 1 — Chào mừng */
        `<div class="ob-step-icon">
            <img src="./img/logo_web_v2.png" alt="Manask" width="48" height="48">
        </div>
        <h2 class="ob-step-title">Chào mừng đến Manask</h2>
        <p class="ob-step-desc">Quản lý công việc toàn diện — Folder, Pomodoro, AI, Roadmap và Thống kê trong một nơi.</p>
        <div class="ob-inline-preview">
            <div class="ob-task-card ob-card-1">
                <span class="ob-task-dot" style="background:#818cf8"></span>
                <span class="ob-task-name">Hoàn thiện báo cáo</span>
                <span class="ob-task-tag">Xong</span>
            </div>
            <div class="ob-task-card ob-card-2">
                <span class="ob-task-dot" style="background:#f59e0b"></span>
                <span class="ob-task-name">Lên kế hoạch tuần</span>
                <span class="ob-task-pri">Cao</span>
            </div>
            <div class="ob-task-card ob-card-3">
                <span class="ob-task-dot" style="background:#22c55e"></span>
                <span class="ob-task-name">Review tiến độ nhóm</span>
            </div>
        </div>`,

        /* Step 2 — Cấu trúc 3 cấp */
        `<h2 class="ob-step-title">Cấu trúc 3 cấp</h2>
        <p class="ob-step-desc">Mọi công việc được tổ chức theo thứ bậc rõ ràng.</p>
        <div class="ob-hierarchy">
            <div class="ob-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Folder</span>
            </div>
            <span class="ob-arrow">→</span>
            <div class="ob-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <polyline points="8 21 12 17 16 21"/>
                </svg>
                <span>Project</span>
            </div>
            <span class="ob-arrow">→</span>
            <div class="ob-pill">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 11 12 14 22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                <span>Task</span>
            </div>
        </div>
        <ul class="ob-hierarchy-desc">
            <li><strong>Folder</strong> — Nhóm lớn. VD: "Học tập", "Công việc"</li>
            <li><strong>Project</strong> — Mảng cụ thể. VD: "Luyện thi IELTS", "Website công ty"</li>
            <li><strong>Task</strong> — Công việc cụ thể. Có ưu tiên, deadline, ghi chú, time spent</li>
        </ul>`,

        /* Step 3 — Khám phá tính năng */
        `<h2 class="ob-step-title">Khám phá các tính năng</h2>
        <p class="ob-step-desc">Manask có thêm nhiều công cụ giúp bạn làm việc hiệu quả hơn.</p>
        <div class="ob-feature-grid">
            <a class="ob-feature-tile" href="./pages/pomodoro.html">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <strong>Pomodoro</strong>
                <span>Đếm giờ tập trung, ghi time spent</span>
            </a>
            <a class="ob-feature-tile" href="./pages/statistics.html">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="4"/><line x1="12" y1="20" x2="12" y2="10"/><line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
                <strong>Thống kê</strong>
                <span>Heatmap, biểu đồ, tổng quan</span>
            </a>
            <a class="ob-feature-tile" href="./pages/chatbot.html">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <strong>AI Chat</strong>
                <span>Tạo roadmap và folder tree bằng AI</span>
            </a>
            <a class="ob-feature-tile" href="./pages/roadmap.html">
                <svg class="gs-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <line x1="14" y1="17.5" x2="21" y2="17.5"/>
                    <line x1="17.5" y1="14" x2="17.5" y2="21"/>
                </svg>
                <strong>Roadmap</strong>
                <span>Sơ đồ node-based kế hoạch dự án</span>
            </a>
        </div>
        <a class="ob-help-link" href="./pages/help.html">Xem Trung tâm Hỗ trợ →</a>`
    ];

    function buildModal() {
        const backdrop = document.createElement('div');
        backdrop.className = 'onboarding-backdrop';
        backdrop.innerHTML = `
            <div class="onboarding-modal" role="dialog" aria-modal="true" aria-label="Hướng dẫn bắt đầu">
                <div class="onboarding-steps">
                    ${STEPS_HTML.map((html, i) =>
                        `<div class="ob-step${i === 0 ? ' active' : ''}" data-step="${i + 1}">${html}</div>`
                    ).join('')}
                </div>
                <div class="onboarding-dots">
                    ${Array.from({ length: TOTAL_STEPS }, (_, i) =>
                        `<button class="ob-dot${i === 0 ? ' active' : ''}" data-dot="${i + 1}" aria-label="Bước ${i + 1}"></button>`
                    ).join('')}
                </div>
                <div class="onboarding-nav">
                    <button class="ob-btn-back" id="ob-back" disabled>Quay lại</button>
                    <button class="ob-btn-next" id="ob-next">Tiếp theo</button>
                </div>
            </div>`;
        return backdrop;
    }

    function goToStep(step, backdropEl) {
        currentStep = step;
        backdropEl.querySelectorAll('.ob-step').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.step) === step);
        });
        backdropEl.querySelectorAll('.ob-dot').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.dot) === step);
        });

        const backBtn = backdropEl.querySelector('#ob-back');
        const nextBtn = backdropEl.querySelector('#ob-next');
        backBtn.disabled = step === 1;
        nextBtn.textContent = step === TOTAL_STEPS ? 'Bắt đầu' : 'Tiếp theo';
    }

    function dismiss(backdropEl) {
        localStorage.setItem('manask_onboarded', '1');
        document.dispatchEvent(new CustomEvent('onboardingClosed'));
        backdropEl.classList.remove('visible');
        setTimeout(() => {
            backdropEl.remove();
            const folderBtn = document.getElementById('btn-folders');
            if (folderBtn) folderBtn.click();
        }, 300);
    }

    function init() {
        const backdropEl = buildModal();
        document.body.appendChild(backdropEl);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => backdropEl.classList.add('visible'));
        });

        backdropEl.querySelector('#ob-back').addEventListener('click', () => {
            if (currentStep > 1) goToStep(currentStep - 1, backdropEl);
        });

        backdropEl.querySelector('#ob-next').addEventListener('click', () => {
            if (currentStep < TOTAL_STEPS) {
                goToStep(currentStep + 1, backdropEl);
            } else {
                dismiss(backdropEl);
            }
        });

        backdropEl.querySelectorAll('.ob-dot').forEach(dot => {
            dot.addEventListener('click', () => goToStep(parseInt(dot.dataset.dot), backdropEl));
        });

        backdropEl.addEventListener('click', e => {
            if (e.target === backdropEl) dismiss(backdropEl);
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                dismiss(backdropEl);
                document.removeEventListener('keydown', handler);
            }
            if (e.key === 'ArrowRight' && currentStep < TOTAL_STEPS) goToStep(currentStep + 1, backdropEl);
            if (e.key === 'ArrowLeft' && currentStep > 1) goToStep(currentStep - 1, backdropEl);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();