/* ────────────────────────────────────────
   HISTORY FUNCTIONS (localStorage)
──────────────────────────────────────── */
const HISTORY_KEY = 'tef_history';

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch(e) { return []; }
}

export function saveResult(entry) {
  const history = loadHistory();
  history.push(entry);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
}

export function clearHistory() {
  if (!confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) return;
  localStorage.removeItem(HISTORY_KEY);
  updateHistoryBadge();
  renderHistory();
}

export function updateHistoryBadge() {
  const h = loadHistory();
  const badge = document.getElementById('historyBadge');
  if (!badge) return;
  if (h.length > 0) {
    badge.style.display = '';
    badge.textContent = h.length > 99 ? '99+' : h.length;
  } else {
    badge.style.display = 'none';
  }
}

export function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('es-MX', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
  } catch(e) { return ''; }
}

export function formatTime(seconds) {
  if (!seconds) return '–';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function renderHistory() {
  const history = loadHistory().reverse(); // newest first
  const statsRow = document.getElementById('historyStatsRow');
  const listEl = document.getElementById('historyList');
  if (!statsRow || !listEl) return;

  if (history.length === 0) {
    statsRow.innerHTML = '';
    listEl.innerHTML = `<div class="history-empty">
      <div class="history-empty-icon">📭</div>
      <div class="history-empty-text">Sin resultados aún</div>
      <div class="history-empty-sub">Completa un test para ver tu historial aquí</div>
    </div>`;
    return;
  }

  // Stats
  const total = history.length;
  const avgPct = Math.round(history.reduce((a, b) => a + (b.pct || 0), 0) / total);
  const bestPct = Math.max(...history.map(h => h.pct || 0));
  const stars3 = history.filter(h => h.stars === 3).length;

  statsRow.innerHTML = `
    <div class="history-stat-chip"><div class="history-stat-num">${total}</div><div class="history-stat-label">Sesiones</div></div>
    <div class="history-stat-chip"><div class="history-stat-num">${avgPct}%</div><div class="history-stat-label">Promedio</div></div>
    <div class="history-stat-chip"><div class="history-stat-num">${bestPct}%</div><div class="history-stat-label">Mejor</div></div>
    <div class="history-stat-chip"><div class="history-stat-num">${stars3}</div><div class="history-stat-label">⭐⭐⭐</div></div>
  `;

  // List
  listEl.innerHTML = `<div class="history-list">
    ${history.map(entry => {
      const lvl = LEVELS.find(l => l.id === entry.level) || {colorMain:'#6B7280',colorLight:'#F0F2F5',colorDark:'#374151',emoji:'🎓'};
      const skill = SKILLS.find(s => s.id === entry.skill) || {colorMain:'#6B7280', subtitle: entry.skill};
      const fillColor = entry.pct >= 80 ? '#22C55E' : entry.pct >= 60 ? '#F59E0B' : '#EF4444';
      const stars = entry.stars === 3 ? '⭐⭐⭐' : entry.stars === 2 ? '⭐⭐' : '⭐';
      return `<div class="history-item">
        <div class="history-item-badge" style="background:${lvl.colorLight};color:${lvl.colorDark}">
          <span style="font-size:1.3rem">${lvl.emoji}</span>
          <span>${entry.level}</span>
        </div>
        <div class="history-item-body">
          <div class="history-item-top">
            <div class="history-item-title" style="color:${skill.colorMain}">${skill.subtitle} · ${entry.level}</div>
            <div class="history-item-date">${formatDate(entry.date)}</div>
          </div>
          <div class="history-item-meta">
            <div class="history-score-bar">
              <div class="history-score-fill" style="width:${entry.pct}%;background:${fillColor}"></div>
            </div>
            <span class="history-score-text" style="color:${fillColor}">${entry.score}/${entry.total}</span>
            <span class="history-stars">${stars}</span>
          </div>
          <div style="font-size:.75rem;color:var(--gray-400);margin-top:3px">⏱ ${formatTime(entry.time)}</div>
        </div>
      </div>`;
    }).join('')}
    <div class="history-clear-btn">
      <button class="btn btn-ghost btn-sm" style="color:#EF4444;border-color:#FCA5A5" onclick="clearHistory()">🗑 Limpiar historial</button>
    </div>
  </div>`;
}
