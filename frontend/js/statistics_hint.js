/**
 * statistics_hint.js — Floating hint card for the Statistics page.
 *
 * Included as a separate module because statistics.html uses 4 sub-modules
 * (summary, line_chart, donut_chart, heatmap) with no single statistics.js entry point.
 *
 * Usage in statistics.html inline script:
 *   import { initStatsHint } from '../js/statistics_hint.js';
 *   initStatsHint();
 */

import { t, initI18n } from '../i18n.js';
import { showHintFloat } from './hint_float.js';

export async function initStatsHint() {
    await initI18n();
    showHintFloat({
        storageKey:   'manask_stats_hinted',
        title:        () => t('hints.stats_title'),
        steps: [
            () => t('hints.stats_step1'),
            () => t('hints.stats_step2'),
            () => t('hints.stats_step3'),
        ],
        dismissLabel: () => t('hints.dismiss'),
    });
}