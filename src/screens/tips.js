import { STUDY_TIPS } from '../data/tips.js';

/* ────────────────────────────────────────
   STUDY TIPS FUNCTIONS
──────────────────────────────────────── */
export function getRandomTips(arr, n) {
  if (!arr || arr.length === 0) return [];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function buildSkillsTip(levelId) {
  const levelTips = getRandomTips(STUDY_TIPS[levelId], 3);
  if (levelTips.length === 0) return '';
  const itemsHtml = levelTips.map(t =>
    `<div class="tip-item"><span class="tip-icon">${t.icon}</span><span class="tip-text">${t.text}</span></div>`
  ).join('');
  return `<div class="tips-panel">
    <div class="tips-panel-header" onclick="this.nextElementSibling.classList.toggle('open');this.querySelector('.tips-panel-toggle').classList.toggle('open')">
      <div class="tips-panel-title">💡 Consejos TEF para nivel ${levelId}</div>
      <span class="tips-panel-toggle">▼</span>
    </div>
    <div class="tips-panel-body open">
      ${itemsHtml}
    </div>
  </div>`;
}

export function buildResultsTip(skillId, levelId, pct) {
  const skillTips = getRandomTips(STUDY_TIPS[skillId], 1);
  const levelTips = getRandomTips(STUDY_TIPS[levelId], 1);
  const allTips = [...skillTips, ...levelTips];
  if (allTips.length === 0) return '';
  const title = pct >= 80 ? '🏅 Para seguir mejorando' : pct >= 60 ? '📈 Consejos para subir tu nota' : '💪 Cómo mejorar esta habilidad';
  return `<div class="results-tip-card">
    <div class="results-tip-title">${title}</div>
    ${allTips.map(t => `<div class="results-tip-item"><span>${t.text}</span></div>`).join('')}
  </div>`;
}
