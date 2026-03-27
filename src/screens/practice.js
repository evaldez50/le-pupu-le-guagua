import { canAccessTopic } from '../auth.js';
import { showPaywall } from '../payment.js';
import { showScreen } from '../navigation.js';
import { TEMARIO, PRACTICE_BANK } from '../data/temario.js';
import { LEVELS } from '../data/levels.js';

/* ────────────────────────────────────────
   PRACTICE FUNCTIONS
──────────────────────────────────────── */
export const PRACTICE = {
  topicName: null,
  data: null,
  questions: [],   // shuffled 10-question subset
  current: 0,
  answers: [],     // [{correct, q, chosen}]
  phase: 'intro',  // 'intro' | 'questions' | 'results'
  answered: false,
};

export function startPractice(topicName) {
  const data = PRACTICE_BANK[topicName];
  if (!data) return;

  // Verificar acceso freemium
  const nivelActual = data.level;
  const levelTopics = TEMARIO[nivelActual] || [];
  const sortedTopics = [...levelTopics].sort((a, b) =>
    a.t.localeCompare(b.t, 'fr', { sensitivity: 'base' })
  );
  const temaIndex = sortedTopics.findIndex(item => item.t === topicName);
  if (!canAccessTopic(nivelActual, temaIndex)) {
    alert('DEBUG: bloqueado por freemium. Nivel=' + nivelActual + ' index=' + temaIndex);
    showPaywall('Para practicar más de 3 temas por nivel necesitas la versión completa.');
    return;
  }

  PRACTICE.topicName = topicName;
  PRACTICE.data = data;
  // Shuffle pool and pick first 10 (different every run)
  PRACTICE.questions = [...data.questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, data.questions.length));
  PRACTICE.current = 0;
  PRACTICE.answers = [];
  PRACTICE.phase = 'intro';
  PRACTICE.answered = false;
  const crumb = document.getElementById('practiceBreadcrumb');
  if (crumb) crumb.textContent = topicName.length > 32 ? topicName.slice(0,30) + '…' : topicName;
  showScreen('practice');
}

export function exitPractice() {
  showScreen('temario');
}

export function renderPractice() {
  const c = document.getElementById('practiceContainer');
  if (!c || !PRACTICE.data) return;
  if (PRACTICE.phase === 'intro')     { renderPracticeIntro(c); return; }
  if (PRACTICE.phase === 'questions') { renderPracticeQuestion(c); return; }
  if (PRACTICE.phase === 'results')   { renderPracticeResults(c); return; }
}

export function renderPracticeIntro(c) {
  const d = PRACTICE.data;
  const n = PRACTICE.questions.length;
  // Parse **bold** markers → <strong>
  const introHtml = d.intro
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  const tipsHtml = d.tips.map(tip =>
    `<div class="practice-tip"><span>${tip}</span></div>`
  ).join('');
  // Level badge color
  const lvl = LEVELS.find(l => l.id === d.level) || {};
  const badge = document.getElementById('practiceProgressBadge');
  if (badge) badge.style.display = 'none';
  c.innerHTML = `
    <div class="practice-intro">
      <div class="practice-intro-level" style="background:${lvl.colorLight||'#e8f0fb'};color:${lvl.colorDark||'#1D4ED8'}">
        ${lvl.emoji||'📝'} Nivel ${d.level}
      </div>
      <div class="practice-intro-title">${PRACTICE.topicName}</div>
      <div class="practice-intro-box">
        <div class="practice-intro-label">📚 ¿Qué vas a practicar?</div>
        <div class="practice-intro-text">${introHtml}</div>
      </div>
      <div class="practice-intro-box">
        <div class="practice-intro-label">💡 Tips clave</div>
        ${tipsHtml}
      </div>
      <div class="practice-intro-meta">${n} preguntas · sin límite de tiempo · sin impacto en el historial</div>
      <button class="practice-start-btn" onclick="beginPracticeQuestions()">🚀 Comenzar práctica</button>
    </div>`;
}

export function beginPracticeQuestions() {
  PRACTICE.phase = 'questions';
  PRACTICE.current = 0;
  PRACTICE.answers = [];
  PRACTICE.answered = false;
  const badge = document.getElementById('practiceProgressBadge');
  if (badge) badge.style.display = '';
  renderPractice();
  window.scrollTo(0, 0);
}

export function renderPracticeQuestion(c) {
  const q = PRACTICE.questions[PRACTICE.current];
  const n = PRACTICE.questions.length;
  const i = PRACTICE.current;
  const isLast = i === n - 1;
  // Progress bar fill
  const pct = (i / n) * 100;
  // Update badge
  const badge = document.getElementById('practiceProgressBadge');
  if (badge) badge.textContent = `${i + 1}/${n}`;
  // Question type label
  const typeLabel = q.t === 'mc' ? '📝 SELECCIÓN MÚLTIPLE' : '✔️ VERDADERO / FALSO';
  // Options HTML
  let optionsHtml = '';
  if (q.t === 'mc') {
    optionsHtml = q.a.map((opt, idx) =>
      `<button class="practice-mc-btn" onclick="handlePracticeMC(${idx})">${String.fromCharCode(65 + idx)}. ${opt}</button>`
    ).join('');
  } else {
    optionsHtml = `
      <button class="practice-tf-btn" onclick="handlePracticeTF(true)">✅ Vrai</button>
      <button class="practice-tf-btn" onclick="handlePracticeTF(false)">❌ Faux</button>`;
  }
  PRACTICE.answered = false;
  c.innerHTML = `
    <div class="practice-q-area" style="padding:16px 0;">
      <div class="practice-q-header">
        <span class="practice-q-num">Pregunta ${i + 1} de ${n}</span>
      </div>
      <div class="practice-progress-bar">
        <div class="practice-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="practice-card">
        <div class="practice-q-type-badge">${typeLabel}</div>
        <div class="practice-q-text">${q.q}</div>
        <div class="practice-options">${optionsHtml}</div>
        <div class="practice-feedback" id="practiceFeedback" style="display:none"></div>
        <button class="practice-next-btn" id="practiceNextBtn" style="display:none"
          onclick="nextPracticeQuestion()">
          ${isLast ? '🏁 Ver resultados' : 'Siguiente →'}
        </button>
      </div>
    </div>`;
}

export function handlePracticeMC(chosen) {
  if (PRACTICE.answered) return;
  PRACTICE.answered = true;
  const q = PRACTICE.questions[PRACTICE.current];
  const correct = chosen === q.c;
  // Style all buttons
  document.querySelectorAll('.practice-mc-btn').forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.c) btn.classList.add('practice-mc-correct');
    else if (idx === chosen && !correct) btn.classList.add('practice-mc-wrong');
  });
  showPracticeFeedback(correct, q);
  PRACTICE.answers.push({ correct, q, chosen });
}

export function handlePracticeTF(answer) {
  if (PRACTICE.answered) return;
  PRACTICE.answered = true;
  const q = PRACTICE.questions[PRACTICE.current];
  const correct = answer === q.c;
  document.querySelectorAll('.practice-tf-btn').forEach(btn => {
    btn.disabled = true;
    const isVrai = btn.textContent.includes('Vrai');
    const isCorrectBtn = (isVrai && q.c === true) || (!isVrai && q.c === false);
    const isWrongChoice = (isVrai && answer === true && !correct) || (!isVrai && answer === false && !correct);
    if (isCorrectBtn) btn.classList.add('practice-mc-correct');
    else if (isWrongChoice) btn.classList.add('practice-mc-wrong');
  });
  showPracticeFeedback(correct, q);
  PRACTICE.answers.push({ correct, q, chosen: answer });
}

export function showPracticeFeedback(correct, q) {
  const fb = document.getElementById('practiceFeedback');
  if (fb) {
    fb.style.display = 'block';
    fb.className = 'practice-feedback ' + (correct ? 'practice-feedback-correct' : 'practice-feedback-wrong');
    fb.innerHTML = `
      <div class="practice-fb-header">
        <span class="practice-fb-icon">${correct ? '✅' : '❌'}</span>
        <strong class="practice-fb-title">${correct ? '¡Correcto!' : 'Incorrecto'}</strong>
      </div>
      <div class="practice-fb-exp">${q.e}</div>`;
  }
  const nextBtn = document.getElementById('practiceNextBtn');
  if (nextBtn) nextBtn.style.display = 'block';
}

export function nextPracticeQuestion() {
  if (PRACTICE.current >= PRACTICE.questions.length - 1) {
    showPracticeResults();
  } else {
    PRACTICE.current++;
    const c = document.getElementById('practiceContainer');
    renderPracticeQuestion(c);
    window.scrollTo(0, 0);
  }
}

export function showPracticeResults() {
  PRACTICE.phase = 'results';
  const badge = document.getElementById('practiceProgressBadge');
  if (badge) badge.style.display = 'none';
  const c = document.getElementById('practiceContainer');
  renderPracticeResults(c);
  window.scrollTo(0, 0);
}

export function renderPracticeResults(c) {
  const correct = PRACTICE.answers.filter(a => a.correct).length;
  const total   = PRACTICE.answers.length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const stars   = pct >= 90 ? '⭐⭐⭐' : pct >= 70 ? '⭐⭐' : '⭐';
  const color   = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
  const msg     = pct >= 90 ? '🏆 ¡Excelente dominio del tema!'
                : pct >= 70 ? '👍 Buen trabajo, sigue practicando.'
                :             '💪 Repasa el tema y vuelve a intentarlo.';
  // Recommendations from wrong answers
  const wrong = PRACTICE.answers.filter(a => !a.correct);
  const recsHtml = wrong.length > 0
    ? `<div class="practice-recs">
        <div class="practice-recs-title">📌 Repasa estos conceptos:</div>
        ${wrong.map(a => `
          <div class="practice-rec-item">
            <div class="practice-rec-q">${a.q.q.length > 85 ? a.q.q.slice(0,83) + '…' : a.q.q}</div>
            <div class="practice-rec-exp">${a.q.e.length > 160 ? a.q.e.slice(0,158) + '…' : a.q.e}</div>
          </div>`).join('')}
      </div>`
    : `<div class="practice-perfect">🎉 ¡Sin errores! Dominas este tema a la perfección.</div>`;
  c.innerHTML = `
    <div class="practice-results">
      <div class="practice-results-score" style="border-color:${color};color:${color}">
        <span class="practice-score-num">${correct}</span>
        <span class="practice-score-denom">/ ${total}</span>
      </div>
      <div class="practice-results-stars">${stars}</div>
      <div class="practice-results-pct">${pct}% de precisión</div>
      <div class="practice-results-msg">${msg}</div>
      ${recsHtml}
      <div class="practice-results-btns">
        <button class="btn btn-primary" onclick="retryPractice()">🔄 Repetir práctica</button>
        <button class="btn btn-ghost" onclick="exitPractice()">← Volver al temario</button>
      </div>
    </div>`;
}

export function retryPractice() {
  // Re-shuffle for a different set of questions
  PRACTICE.questions = [...PRACTICE.data.questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, PRACTICE.data.questions.length));
  PRACTICE.current = 0;
  PRACTICE.answers = [];
  PRACTICE.phase = 'intro';
  PRACTICE.answered = false;
  const c = document.getElementById('practiceContainer');
  renderPracticeIntro(c);
  window.scrollTo(0, 0);
}
