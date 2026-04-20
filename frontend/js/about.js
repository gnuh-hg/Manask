/* ═══════════════════════════════════════
   about.js — Manask About Us
   ═══════════════════════════════════════ */

import { t, initI18n, setLang, getLang } from '../i18n.js';

document.addEventListener('DOMContentLoaded', async () => {

  await initI18n();

  // ── AUTH-AWARE NAV BUTTON ──
  const token = localStorage.getItem('access_token');
  const btnNav = document.querySelector('.btn-nav-action');
  if (btnNav) {
    if (token) {
      btnNav.href = '../index.html';
      btnNav.textContent = t('about.nav_btn_home');
    } else {
      btnNav.href = '../pages/auth.html';
      btnNav.textContent = t('about.nav_btn_auth');
    }
  }

  // ── LANG SWITCHER ──
  function syncLangButtons() {
    const lang = getLang();
    document.querySelectorAll('.lang-switcher button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }
  syncLangButtons();

  document.querySelectorAll('.lang-switcher button').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      syncLangButtons();
      // Cập nhật lại text nút nav sau khi đổi ngôn ngữ
      if (btnNav) {
        btnNav.textContent = token
          ? t('about.nav_btn_home')
          : t('about.nav_btn_auth');
      }
    });
  });

  // ── SCROLL REVEAL ──
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

});
