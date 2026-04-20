/* ── summary.js ── */

import * as utils from '../../utils.js';
import { t, initI18n } from '../../i18n.js';

let SUMMARY_DATASETS;

async function initSummary() {
    await initI18n();
    if (utils.TEST) {
        SUMMARY_DATASETS = {
          week: {
            tasks:   [5, 14, 8, 18, 11, 3, 7],
            focus:   [1.5, 6.0, 2.0, 7.5, 3.5, 1.0, 4.0],
            pomo:    [3, 10, 5, 13, 7, 2, 5],
            created: 74, done: 56,
            streak: 4, bestStreak: 12,
            prevTasks: 52, prevFocus: 19.5, prevPomo: 31
          },
          month: {
            tasks:   [12,28,15,35,20,42,18,30,25,38,22,45,19,33,28,40,17,36,24,41,20,38,26,44,21,37,23,42,18,35],
            focus:   [8.5,5,12,4.5,14,6.5,10,7,11,4,13,5.5,9,6,10.5,4,12,5,9.5,5,11,4.5,10,5,12,4.5,9,5.5,11,4],
            pomo:    [8,20,11,25,14,30,13,22,18,27,16,32,14,24,20,28,12,26,17,29,14,27,18,31,15,27,16,30,13,25],
            created: 880, done: 694,
            streak: 4, bestStreak: 29,
            prevTasks: 612, prevFocus: 198, prevPomo: 401
          },
          year: {
            tasks:   [38,72,51,88,64,110,79,95,58,120,83,140],
            focus:   [28,18,35,15,42,12,38,22,45,10,50,20],
            pomo:    [65,130,92,158,115,198,142,171,104,216,149,252],
            created: 1240, done: 998,
            streak: 4, bestStreak: 29,
            prevTasks: 820, prevFocus: 267, prevPomo: 1050
          },
        };
    } else {
        const section = document.querySelector('.summary-section');
        const ERROR_HTML = `
            <div class="stat-error-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
                </svg>
                <p>${t('statistics.offline_title')}</p>
                <button class="stat-retry-btn" id="summaryRetry">${t('statistics.offline_retry')}</button>
            </div>`;
        try {
            const res = await utils.fetchWithAuth(`${utils.URL_API}/statistic/summary`, {}, {
                onLoadStart: () => { section.style.position = 'relative'; section.insertAdjacentHTML('beforeend', '<div class="stat-spinner-wrap"><div class="stat-spinner"></div></div>'); },
                onLoadEnd:   () => section.querySelector('.stat-spinner-wrap')?.remove(),
            });
            if (!res.ok) throw new Error(res.status);
            SUMMARY_DATASETS = await res.json();
        } catch (err) {
            section.querySelector('.stat-spinner-wrap')?.remove();
            if (err.message !== 'Unauthorized') {
                section.style.position = 'relative';
                section.insertAdjacentHTML('beforeend', ERROR_HTML);
                document.getElementById('summaryRetry')?.addEventListener('click', () => {
                    section.querySelector('.stat-error-wrap')?.remove();
                    initSummary();
                });
            }
        }
    }
    if (SUMMARY_DATASETS) renderSummary();
}

const DAYS_DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

let summaryPeriod = 'month';

function setSummaryPeriod(p, btn) {
  summaryPeriod = p;
  document.querySelectorAll('.summary-period-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderSummary();
}

export { initSummary, setSummaryPeriod };

function calcDelta(curr, prev) {
  if (!prev) return { pct: 0, dir: 'neutral', noData: true };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { pct, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral', noData: false };
}

function applyDelta(id, curr, prev) {
  const { pct, dir, noData } = calcDelta(curr, prev);
  const el = document.getElementById(id);
  if (noData) {
    el.className = 'delta neutral';
    el.innerHTML = '';
    return;
  }
  el.className = 'delta ' + dir;
  const arrow = dir === 'up' ? '↑' : dir === 'down' ? '↓' : '→';
  el.innerHTML = `<span class="delta-arrow">${arrow}</span><span class="delta-pct">${Math.abs(pct)}%</span>`;
}

function buildSparkline(vals, lineId, areaId) {
  const W = 100, H = 40, pad = 4;
  const n = vals.length;
  const maxV = Math.max(...vals) || 1;
  const pts = vals.map((v, i) => ({
    x: (i / (n - 1)) * W,
    y: pad + (H - pad * 2) - (v / maxV) * (H - pad * 2),
  }));

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cx = (pts[i-1].x + pts[i].x) / 2;
    d += ` C${cx},${pts[i-1].y} ${cx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }

  const lineEl = document.getElementById(lineId);
  const areaEl = document.getElementById(areaId);
  if (lineEl) lineEl.setAttribute('d', d);
  if (areaEl) areaEl.setAttribute('d', d + ` L${pts.at(-1).x},${H} L${pts[0].x},${H} Z`);
}

function renderSummary() {
  const d = SUMMARY_DATASETS[summaryPeriod];

  const totTasks = d.tasks.reduce((a,b)=>a+b,0);
  const totFocus = Math.round(d.focus.reduce((a,b)=>a+b,0) * 100) / 100;
  const totPomo  = d.pomo.reduce((a,b)=>a+b,0);
  const rate     = d.created ? Math.round((d.done / d.created) * 100) : 0;

  document.getElementById('sumValTasks').innerHTML = totTasks;
  applyDelta('sumDeltaTasks', totTasks, d.prevTasks);

  document.getElementById('sumValFocus').innerHTML = `${totFocus}<span class="unit">h</span>`;
  applyDelta('sumDeltaFocus', totFocus, d.prevFocus);

  document.getElementById('sumValPomo').innerHTML = totPomo;
  applyDelta('sumDeltaPomo', totPomo, d.prevPomo);

  document.getElementById('sumValStreak').innerHTML = `${d.streak}<span class="unit">${t('statistics.days_unit')}</span>`;
  document.getElementById('sumFooterStreak').innerHTML =
    `<span style="color:var(--text-tertiary);font-size:11px">${t('statistics.streak_longest')}: <span style="color:#06b6d4;font-family:'DM Mono',monospace;font-weight:600">${t('statistics.n_days', { n: d.bestStreak })}</span></span>`;

  document.getElementById('sumValRate').innerHTML = `${rate}<span class="unit">%</span>`;
  setTimeout(() => { const b = document.getElementById('sumRateBar'); if(b) b.style.width = rate + '%'; }, 50);
  document.getElementById('sumRateCreated').textContent = t('statistics.rate_created', { n: d.created });
  document.getElementById('sumRateDone').textContent    = t('statistics.rate_done', { n: d.done });

  buildSparkline(d.tasks, 'sparkTasksLine', 'sparkTasksArea');
  buildSparkline(d.focus, 'sparkFocusLine', 'sparkFocusArea');
  buildSparkline(d.pomo,  'sparkPomoLine',  'sparkPomoArea');
}