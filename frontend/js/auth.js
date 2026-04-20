import * as utils from '../utils.js';
import { t, initI18n, setLang, getLang } from '../i18n.js';

async function fetchAndStoreUserId(token) {
    try {
        const response = await utils.fetchWithRetry(
            `${utils.URL_API}/user-id`,
            { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (response.ok) {
            const data = await response.json();
            if (data.user_id !== undefined)
                localStorage.setItem('user_id', String(data.user_id));
        }
    } catch (e) {
        console.error('[Auth] Error fetching user_id:', e);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    await initI18n();

    /* ══ DOM refs ══ */
    const tabLogin  = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const panelLogin  = document.getElementById('panel-login');
    const panelSignup = document.getElementById('panel-signup');
    const authTagline = document.getElementById('auth-tagline');
    const langBtn     = document.getElementById('auth-lang-btn');

    const loginEmail    = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn      = document.getElementById('login-btn');
    const loginMsg      = document.getElementById('login-msg');

    const signupName     = document.getElementById('signup-name');
    const signupEmail    = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupConfirm  = document.getElementById('signup-confirm');
    const signupBtn      = document.getElementById('signup-btn');
    const signupMsg      = document.getElementById('signup-msg');
    const strengthWrap   = document.querySelector('.password-strength');
    const strengthFill   = document.querySelector('.strength-fill');
    const strengthText   = document.querySelector('.strength-text');

    /* ══ Carousel ══ */
    const carouselEl = document.querySelector('.left-carousel');
    const slides = document.querySelectorAll('.carousel-slide');
    const dots   = document.querySelectorAll('.l-dot');
    let currentSlide = 0;
    let carouselTimer;

    function goToSlide(i) {
        slides[currentSlide].classList.remove('active');
        dots[currentSlide].classList.remove('active');
        currentSlide = i;
        slides[currentSlide].classList.add('active');
        dots[currentSlide].classList.add('active');
    }

    function startCarousel() {
        carouselTimer = setInterval(() => goToSlide((currentSlide + 1) % slides.length), 4500);
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            clearInterval(carouselTimer);
            goToSlide(i);
            startCarousel();
        });
    });

    startCarousel();

    /* ══ Carousel swipe (touch) & drag (mouse) ══ */
    let touchStartX = 0, mouseStartX = 0, isDragging = false;

    // Touch — mobile / trackpad swipe
    carouselEl.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });

    carouselEl.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
            clearInterval(carouselTimer);
            goToSlide(dx < 0
                ? (currentSlide + 1) % slides.length
                : (currentSlide - 1 + slides.length) % slides.length);
            startCarousel();
        }
    }, { passive: true });

    // Mouse drag — desktop
    carouselEl.addEventListener('mousedown', e => {
        mouseStartX = e.clientX;
        isDragging = true;
        carouselEl.classList.add('dragging');
    });

    window.addEventListener('mouseup', e => {
        if (!isDragging) return;
        isDragging = false;
        carouselEl.classList.remove('dragging');
        const dx = e.clientX - mouseStartX;
        if (Math.abs(dx) > 40) {
            clearInterval(carouselTimer);
            goToSlide(dx < 0
                ? (currentSlide + 1) % slides.length
                : (currentSlide - 1 + slides.length) % slides.length);
            startCarousel();
        }
    });

    /* ══ Language button ══ */
    langBtn.textContent = getLang().toUpperCase();
    langBtn.addEventListener('click', () => {
        const next = getLang() === 'en' ? 'vi' : 'en';
        setLang(next);
        langBtn.textContent = next.toUpperCase();
        // Re-sync tagline after lang change
        const mode = tabLogin.classList.contains('active') ? 'login' : 'signup';
        authTagline.textContent = t(`${mode}.tagline`);
    });

    /* ══ Initial mode from URL ══ */
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (urlMode === 'signup') showPanel('signup');

    /* ══ Tab switching ══ */
    tabLogin.addEventListener('click',  () => showPanel('login'));
    tabSignup.addEventListener('click', () => showPanel('signup'));

    function showPanel(mode) {
        if (mode === 'login') {
            tabLogin.classList.add('active');
            tabSignup.classList.remove('active');
            panelSignup.classList.add('hidden');
            panelLogin.classList.remove('hidden');
            panelLogin.classList.add('slide-in');
            document.title = 'Manask — Login';
            authTagline.textContent = t('login.tagline');
        } else {
            tabSignup.classList.add('active');
            tabLogin.classList.remove('active');
            panelLogin.classList.add('hidden');
            panelSignup.classList.remove('hidden');
            panelSignup.classList.add('slide-in');
            document.title = 'Manask — Sign Up';
            authTagline.textContent = t('signup.tagline');
            setTimeout(() => signupName.focus(), 80);
        }
        setTimeout(() => {
            panelLogin.classList.remove('slide-in');
            panelSignup.classList.remove('slide-in');
        }, 350);
    }

    /* ══ Eye toggle (shared for all password fields) ══ */
    document.querySelectorAll('.eye-toggle').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.target);
            const eyeSvg = this.querySelector('.eye-icon');
            const isVisible = input.type === 'text';
            input.type = isVisible ? 'password' : 'text';
            eyeSvg.innerHTML = isVisible
                ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`
                : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
        });
    });

    /* ══ Password strength ══ */
    function checkStrength(password) {
        if (!password) {
            strengthWrap.classList.remove('active');
            return null;
        }
        strengthWrap.classList.add('active');
        const score = [
            password.length >= 8,
            /[a-z]/.test(password),
            /[A-Z]/.test(password),
            /[0-9]/.test(password),
            /[^A-Za-z0-9]/.test(password),
        ].filter(Boolean).length * 20;

        strengthFill.className = 'strength-fill';
        strengthText.className = 'strength-text';

        if (score < 40) {
            strengthFill.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = t('signup.strength_weak') || 'Weak';
            return 'weak';
        } else if (score < 80) {
            strengthFill.classList.add('medium');
            strengthText.classList.add('medium');
            strengthText.textContent = t('signup.strength_medium') || 'Medium';
            return 'medium';
        } else {
            strengthFill.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = t('signup.strength_strong') || 'Strong';
            return 'strong';
        }
    }

    signupPassword.addEventListener('input', function () {
        checkStrength(this.value);
        clearMsg(signupMsg);
    });

    /* ══ Clear messages on input ══ */
    function clearMsg(el) {
        if (el.textContent) el.textContent = '';
    }

    loginEmail.addEventListener('input',    () => clearMsg(loginMsg));
    loginPassword.addEventListener('input', () => clearMsg(loginMsg));
    signupName.addEventListener('input',    () => { clearMsg(signupMsg); signupName.classList.remove('error'); });
    signupEmail.addEventListener('input',   () => { clearMsg(signupMsg); signupEmail.classList.remove('error'); });
    signupConfirm.addEventListener('input', () => { clearMsg(signupMsg); signupConfirm.classList.remove('error'); });

    /* ══ Enter key ══ */
    [loginEmail, loginPassword].forEach(el =>
        el.addEventListener('keypress', e => { if (e.key === 'Enter') loginBtn.click(); })
    );
    [signupName, signupEmail, signupPassword, signupConfirm].forEach(el =>
        el.addEventListener('keypress', e => { if (e.key === 'Enter') { e.preventDefault(); signupBtn.click(); } })
    );

    /* ══ Validation helpers ══ */
    const validate = {
        username(v) {
            if (!v || v.length < 3) return { ok: false, msg: t('signup.msg_username_min') || 'Username must be at least 3 characters' };
            if (v.length > 30)      return { ok: false, msg: t('signup.msg_username_max') || 'Username is too long' };
            return { ok: true };
        },
        email(v) {
            if (!v) return { ok: false, msg: t('signup.msg_email_empty') || 'Email is required' };
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, msg: t('signup.msg_invalid_email') || 'Invalid email address' };
            return { ok: true };
        },
        password(v) {
            if (!v)          return { ok: false, msg: t('signup.msg_password_empty') || 'Password is required' };
            if (v.length < 6) return { ok: false, msg: t('signup.msg_password_min') || 'Password must be at least 6 characters' };
            return { ok: true };
        },
        confirm(pw, confirm) {
            if (!confirm)      return { ok: false, msg: t('signup.msg_confirm_empty') || 'Please confirm your password' };
            if (pw !== confirm) return { ok: false, msg: t('signup.msg_passwords_mismatch') || 'Passwords do not match' };
            return { ok: true };
        },
    };

    /* ══ LOGIN ══ */
    loginBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (loginBtn.classList.contains('loading')) return;

        const email    = loginEmail.value.trim();
        const password = loginPassword.value;

        if (!email || !password) {
            loginMsg.textContent = t('login.msg_fill_all') || 'Please fill in all fields';
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            loginMsg.textContent = t('login.msg_invalid_email') || 'Invalid email address';
            return;
        }

        const origText = loginBtn.textContent;
        loginBtn.classList.add('loading');
        loginMsg.textContent = '';

        try {
            const response = await utils.fetchWithRetry(`${utils.URL_API}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                loginBtn.classList.remove('loading');
                loginBtn.textContent = t('login.btn_success') || 'Welcome back!';
                localStorage.setItem('access_token', data.access_token);
                await fetchAndStoreUserId(data.access_token);
                setTimeout(() => { window.location.href = '/index.html'; }, 500);
            } else {
                loginMsg.textContent = data.detail || t('login.msg_failed') || 'Login failed';
                loginBtn.classList.remove('loading');
                loginBtn.textContent = origText;
            }
        } catch {
            loginMsg.textContent = t('login.msg_connection_error') || 'Connection error. Please try again.';
            loginBtn.classList.remove('loading');
            loginBtn.textContent = origText;
        }
    });

    /* ══ SIGNUP ══ */
    signupBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (signupBtn.classList.contains('loading')) return;

        const username = signupName.value;
        const email    = signupEmail.value.trim();
        const password = signupPassword.value;
        const confirm  = signupConfirm.value;

        // Clear previous error states
        [signupName, signupEmail, signupPassword, signupConfirm].forEach(el => el.classList.remove('error'));
        signupMsg.classList.remove('success');

        // Run validations in order
        const checks = [
            [validate.username(username),       signupName],
            [validate.email(email),             signupEmail],
            [validate.password(password),       signupPassword],
            [validate.confirm(password, confirm), signupConfirm],
        ];

        for (const [result, input] of checks) {
            if (!result.ok) {
                signupMsg.textContent = result.msg;
                input.classList.add('error');
                input.focus();
                return;
            }
        }

        const strength = checkStrength(password);
        if (strength === 'weak') {
            signupMsg.textContent = t('signup.msg_password_weak_warn') || 'Your password is weak — consider a stronger one';
        }

        const origText = signupBtn.textContent;
        signupBtn.classList.add('loading');
        signupMsg.textContent = '';

        try {
            const response = await utils.fetchWithRetry(`${utils.URL_API}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                signupBtn.classList.remove('loading');
                signupBtn.textContent = t('signup.btn_success') || 'Account created!';
                signupMsg.textContent = t('signup.msg_success') || 'Account created successfully!';
                signupMsg.classList.add('success');
                localStorage.setItem('access_token', data.access_token);
                await fetchAndStoreUserId(data.access_token);
                setTimeout(() => { window.location.href = '/index.html'; }, 800);
            } else {
                let errMsg = t('signup.msg_failed') || 'Sign up failed';
                if (Array.isArray(data.detail))          errMsg = data.detail[0]?.msg || data.detail[0];
                else if (typeof data.detail === 'string') errMsg = data.detail;
                else if (data.message)                    errMsg = data.message;

                signupMsg.textContent = errMsg;
                const lower = errMsg.toLowerCase();
                if (lower.includes('email'))          signupEmail.classList.add('error');
                else if (lower.includes('username'))  signupName.classList.add('error');
                else if (lower.includes('password'))  signupPassword.classList.add('error');

                signupBtn.classList.remove('loading');
                signupBtn.textContent = origText;
            }
        } catch {
            signupMsg.textContent = t('signup.msg_connection_error') || 'Connection error. Please try again.';
            signupBtn.classList.remove('loading');
            signupBtn.textContent = origText;
        }
    });
});
