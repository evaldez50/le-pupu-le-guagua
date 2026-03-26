import { canAccessTopic } from '../auth.js';
import { showPaywall } from '../payment.js';

/* ────────────────────────────────────────
   TEMARIO FUNCTIONS
──────────────────────────────────────── */
export const TEMARIO_STATE = { level: 'A1' };

export function renderTemario() {
  // ── Tabs ──
  const tabsEl = document.getElementById('temarioTabs');
  if (tabsEl && tabsEl.childElementCount === 0) {
    // Build tabs once
    tabsEl.innerHTML = LEVELS.map(lvl =>
      `<button class="temario-tab${lvl.id === TEMARIO_STATE.level ? ' active' : ''}"
        style="${lvl.id === TEMARIO_STATE.level ? `background:${lvl.colorMain};color:#fff;` : `color:${lvl.colorDark};border-color:${lvl.colorMain};`}"
        onclick="temarioSetLevel('${lvl.id}')">
        ${lvl.emoji} ${lvl.id}
      </button>`
    ).join('');
  } else if (tabsEl) {
    // Update active state
    tabsEl.querySelectorAll('.temario-tab').forEach((btn, i) => {
      const lvl = LEVELS[i];
      const isActive = lvl.id === TEMARIO_STATE.level;
      btn.className = 'temario-tab' + (isActive ? ' active' : '');
      btn.style.cssText = isActive
        ? `background:${lvl.colorMain};color:#fff;border-color:transparent;`
        : `color:${lvl.colorDark};border-color:${lvl.colorMain};background:#fff;`;
    });
  }

  // ── Filter + sort topics (localeCompare handles é=e, à=a, etc.) ──
  const query = (document.getElementById('temarioSearch')?.value || '').toLowerCase().trim();
  const raw = TEMARIO[TEMARIO_STATE.level] || [];
  const filtered = query
    ? raw.filter(item => item.t.toLowerCase().includes(query) || item.d.toLowerCase().includes(query))
    : raw;
  const topics = [...filtered].sort((a, b) =>
    a.t.localeCompare(b.t, 'fr', { sensitivity: 'base' })
  );

  // ── Count label ──
  const lvl = LEVELS.find(l => l.id === TEMARIO_STATE.level);
  const countEl = document.getElementById('temarioCount');
  if (countEl) {
    countEl.textContent = `${topics.length} tema${topics.length !== 1 ? 's' : ''} · ${lvl.name} (${TEMARIO_STATE.level})`;
  }

  // ── Skill badge helper ──
  const SKILL_LABELS = { co:'CO', ce:'CE', eo:'EO', ee:'EE' };

  // ── Topic list ──
  const listEl = document.getElementById('temarioList');
  if (!listEl) return;
  if (topics.length === 0) {
    listEl.innerHTML = `<div class="temario-empty">
      <div class="temario-empty-icon">🔍</div>
      <div>No se encontraron temas con "<strong>${query}</strong>"</div>
    </div>`;
    return;
  }
  listEl.innerHTML = topics.map(item => {
    const badges = item.s.map(s =>
      `<span class="t-badge ${s}">${SKILL_LABELS[s]}</span>`
    ).join('');
    const hasPractice = !!PRACTICE_BANK[item.t];
    const practiceBtn = hasPractice
      ? `<button class="temario-practice-btn"
           onclick='startPractice(${JSON.stringify(item.t)})'>▶ Practicar</button>`
      : '';
    return `<div class="temario-item">
      <div class="temario-item-top">
        <div class="temario-item-info">
          <div class="temario-topic-name">${item.t}</div>
          <div class="temario-topic-desc">${item.d}</div>
        </div>
        ${practiceBtn}
      </div>
      <div class="temario-badges" style="margin-top:8px">${badges}</div>
    </div>`;
  }).join('');
}

export function temarioSetLevel(levelId) {
  TEMARIO_STATE.level = levelId;
  // Reset search
  const search = document.getElementById('temarioSearch');
  if (search) search.value = '';
  renderTemario();
}
