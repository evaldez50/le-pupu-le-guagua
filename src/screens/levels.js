import { state } from '../state.js';
import { buildSkillsTip } from './tips.js';

/* ────────────────────────────────────────
   RENDER: LEVELS GRID
──────────────────────────────────────── */
export function renderLevelsGrid() {
  const grid = document.getElementById('levelsGrid');
  grid.innerHTML = LEVELS.map(lvl => `
    <div class="level-card" onclick="selectLevel('${lvl.id}')">
      <div class="level-card-stripe" style="background:linear-gradient(90deg,${lvl.colorDark},${lvl.colorMain})"></div>
      <div class="level-card-body">
        <div class="level-card-header">
          <div>
            <div class="level-badge" style="color:${lvl.colorDark}">${lvl.id}</div>
            <div class="level-name" style="color:${lvl.colorDark}">${lvl.name}</div>
          </div>
          <div class="level-card-icon" style="background:${lvl.colorLight};font-size:1.5rem">${lvl.emoji}</div>
        </div>
        <div class="divider" style="background:linear-gradient(90deg,${lvl.colorMain},${lvl.colorLight})"></div>
        <p class="level-desc">${lvl.desc}</p>
        <div class="skill-tags" style="margin-bottom:14px">
          ${lvl.examples.map(ex => `<span class="skill-tag" style="background:${lvl.colorLight};color:${lvl.colorDark}">${ex}</span>`).join('')}
        </div>
        <div class="progress-mini" style="margin-bottom:12px">
          <div class="progress-mini-fill" style="width:0%;background:${lvl.colorMain}"></div>
        </div>
        <div class="level-meta">
          <span class="level-topics" style="color:${lvl.colorDark}">📚 ${lvl.topics} temas · ${lvl.tef}</span>
          <span class="level-card-arrow" style="color:${lvl.colorMain}">→</span>
        </div>
      </div>
    </div>`).join('');
}

/* ────────────────────────────────────────
   RENDER: SKILLS SCREEN
──────────────────────────────────────── */
export function renderSkillsScreen() {
  const lvl = state.currentLevel;
  document.getElementById('skillsLevelLabel').textContent = `${lvl.id} – ${lvl.name}`;

  const chip = document.getElementById('skillsLevelChip');
  chip.innerHTML = `<span style="font-size:1.1rem">${lvl.emoji}</span>
    <span style="font-weight:800;color:${lvl.colorDark}">${lvl.id} – ${lvl.name}</span>
    <span style="font-size:.75rem;color:${lvl.colorDark};opacity:.7">${lvl.tef}</span>`;
  chip.style.cssText = `background:${lvl.colorLight};padding:6px 16px;border-radius:50px;display:inline-flex;gap:8px;align-items:center;`;

  const grid = document.getElementById('skillsGrid');
  grid.innerHTML = SKILLS.map(skill => {
    const key = skill.id + '_' + lvl.id;
    const hasTest = !!QUESTIONS[key];
    const badge = hasTest ? '' : `<span style="font-size:.65rem;background:#FEF3C7;color:#92400e;padding:2px 8px;border-radius:10px;font-weight:700;margin-left:6px">PRÓX.</span>`;
    return `
    <div class="skill-card" onclick="selectSkill('${skill.id}')"
         style="border-color:transparent"
         onmouseenter="this.style.borderColor='${skill.colorMain}'"
         onmouseleave="this.style.borderColor='transparent'">
      <div class="skill-card-inner">
        <div class="skill-emoji-wrap" style="background:${skill.colorLight}">
          <span style="font-size:2rem">${skill.emoji}</span>
          <div class="skill-wave" style="background:${skill.colorMain};color:white">${skill.icon}</div>
        </div>
        <div class="skill-subtitle" style="color:${skill.colorMain}">${skill.id} ${badge}</div>
        <div class="skill-title" style="white-space:pre-line">${skill.title}</div>
        <p class="skill-desc">${skill.desc}</p>
        <div class="skill-tags">
          ${skill.tags.map(t => `<span class="skill-tag" style="background:${skill.colorLight};color:${skill.colorMain}">${t}</span>`).join('')}
        </div>
        <div class="progress-mini">
          <div class="progress-mini-fill" style="width:0%;background:${skill.colorMain}"></div>
        </div>
      </div>
      <div class="skill-card-footer">
        <span class="skill-footer-label">⏱ ${skill.duration}</span>
        <button class="skill-start-btn" style="background:${skill.colorMain}"
                onclick="event.stopPropagation();selectSkill('${skill.id}')">
          ${hasTest ? 'Iniciar →' : 'Próximamente'}
        </button>
      </div>
    </div>`}).join('');

  // Render tips panel
  const tipsEl = document.getElementById('tipsPanel');
  if (tipsEl) tipsEl.innerHTML = buildSkillsTip(lvl.id);
}
