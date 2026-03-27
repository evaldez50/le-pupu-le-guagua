import { state, TEST } from './state.js';
import { LEVELS, SKILLS } from './data/levels.js';
import { QUESTIONS } from './data/questions.js';
import { renderHistory } from './screens/history.js';
import { renderTemario } from './screens/temario.js';
import { renderPractice } from './screens/practice.js';
import { renderConjugador } from './screens/conjugador.js';
import { renderSkillsScreen } from './screens/levels.js';
import { startTest } from './test/engine.js';
import { clearTimer } from './timer.js';
import { stopEORecording } from './test/eo.js';

/* ────────────────────────────────────────
   NAVIGATION
──────────────────────────────────────── */
export function showScreen(id) {
  window.scrollTo(0, 0);                          // Instant scroll — no smooth
  const overlay = document.getElementById('transitionOverlay');
  overlay.classList.add('flash');
  setTimeout(() => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + id);
    if (target) target.classList.add('active');
    overlay.classList.remove('flash');
    if (id === 'history') renderHistory();
    if (id === 'temario') renderTemario();
    if (id === 'practice') renderPractice();
    if (id === 'conjugador') renderConjugador();
  }, 90);
}

export function selectLevel(lvlId) {
  state.currentLevel = LEVELS.find(l => l.id === lvlId);
  if (!state.currentLevel) return;
  renderSkillsScreen();
  showScreen('skills');
}

export function selectSkill(skillId) {
  state.currentSkill = SKILLS.find(s => s.id === skillId);
  if (!state.currentSkill) return;
  const lvl = state.currentLevel;
  // Check if questions exist for this level+skill
  const key = skillId + '_' + lvl.id;
  if (!QUESTIONS[key]) {
    showComingSoon(skillId, lvl.id);
    return;
  }
  startTest(skillId, lvl.id);
}

export function showComingSoon(skillId, lvlId) {
  const skill = SKILLS.find(s => s.id === skillId);
  alert(`🚧 Próximamente\n\nEl test de ${skill.subtitle} — Nivel ${lvlId} estará disponible en la siguiente actualización.\n\n✅ Disponibles ahora:\n• A1 · CE, CO, EE, EO\n• A2 · CE, CO, EE, EO\n• B1 · CE, CO, EE, EO\n• B2 · CE, CO, EE, EO\n• C1 · CE, CO, EE, EO\n• C2 · CE, CO, EE, EO`);
}

export function confirmExitTest() {
  if (TEST.current > 0 && TEST.current < TEST.questions.length) {
    if (!confirm('¿Salir del test? Se perderá tu progreso actual.')) return;
  }
  clearTimer();
  window.speechSynthesis && window.speechSynthesis.cancel();
  stopEORecording();
  showScreen('skills');
}
