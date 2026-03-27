import { TEST } from '../state.js';
import { LEVELS, SKILLS } from '../data/levels.js';
import { QUESTIONS } from '../data/questions.js';
import { shuffleArray } from '../utils.js';
import { clearTimer } from '../timer.js';
import { startTimer } from '../timer.js';
import { showScreen } from '../navigation.js';
import { buildListenSection, autoPlayAudio, buildMCOptions, buildTFButtons, buildMatchGrid } from './builders.js';
import { buildEEQuestion } from './ee.js';
import { buildEOQuestion } from './eo.js';

/* ────────────────────────────────────────
   TEST ENGINE: START
──────────────────────────────────────── */
export function startTest(skillId, levelId) {
  const key = skillId + '_' + levelId;
  const pool = QUESTIONS[key];
  TEST.skillId = skillId;
  TEST.levelId = levelId;
  TEST.questions = shuffleArray([...pool]).slice(0, 20);
  TEST.current = 0;
  TEST.score = 0;
  TEST.lives = 3;
  TEST.answers = [];
  TEST.answered = false;
  TEST.startTime = Date.now();
  clearTimer();

  const lvl = LEVELS.find(l => l.id === levelId);
  const skill = SKILLS.find(s => s.id === skillId);
  const fillColor = skill.colorMain;

  // Set topbar
  document.getElementById('testBreadLevel').textContent = levelId;
  document.getElementById('testBreadSkill').textContent = skillId + ' · ' + skill.subtitle;
  document.getElementById('testProgressFill').style.background =
    `linear-gradient(90deg, ${lvl.colorMain}, ${fillColor})`;

  renderQuestion();
  showScreen('test');
}

/* ────────────────────────────────────────
   TEST ENGINE: RENDER QUESTION
──────────────────────────────────────── */
export function renderQuestion() {
  const q = TEST.questions[TEST.current];
  TEST.answered = false;
  window.speechSynthesis && window.speechSynthesis.cancel();

  // Progress
  const pct = (TEST.current / TEST.questions.length) * 100;
  document.getElementById('testProgressFill').style.width = pct + '%';
  document.getElementById('testQCounter').textContent =
    `Pregunta ${TEST.current + 1} de ${TEST.questions.length}`;
  document.getElementById('testScoreBadge').textContent = `⭐ ${TEST.score} pts`;
  document.getElementById('testLives').textContent = '❤️'.repeat(TEST.lives) + '🖤'.repeat(3 - TEST.lives);

  // Reset card
  const card = document.getElementById('questionCard');
  card.className = 'question-card';
  document.getElementById('feedbackArea').className = 'hidden';
  document.getElementById('feedbackArea').innerHTML = '';
  const btnNext = document.getElementById('btnNext');
  btnNext.className = 'btn-next hidden';

  const skill = SKILLS.find(s => s.id === TEST.skillId);
  const isLast = TEST.current === TEST.questions.length - 1;
  if (isLast) btnNext.classList.add('last-q');

  // Build question HTML
  let html = '';

  // Type badge
  const badges = {
    mc:    {co:'🔊 Audio · Selección', ce:'📖 Lectura · Selección', icon: TEST.skillId === 'CO' ? '🔊' : '📖', label: 'Selección múltiple', bg: TEST.skillId==='CO'?'#E0F2FE':'#D1FAE5', color: TEST.skillId==='CO'?'#0369a1':'#065f46'},
    tf:    {icon: TEST.skillId==='CO'?'🔊':'📖', label: 'Vrai ou Faux', bg:'#FEF3C7', color:'#92400e'},
    match: {icon:'🔗', label: 'Associer', bg:'#EDE9FE', color:'#5b21b6'},
    ee:    {icon:'✏️', label:'Expression Écrite', bg:'#FEF9C3', color:'#854D0E'},
    eo:    {icon:'🎤', label:'Expression Orale',  bg:'#FCE7F3', color:'#BE185D'},
  };
  const badge = badges[q.t] || badges.mc;
  html += `<div class="q-type-badge" style="background:${badge.bg};color:${badge.color}">${badge.icon} ${badge.label}</div>`;

  // CO: Listen button
  if (TEST.skillId === 'CO' && q.audio) {
    html += buildListenSection(q);
  }

  // Passage (CE reading text)
  if (q.passage) {
    html += `<div class="passage-box" style="border-color:${skill.colorMain}">
      <div class="passage-label" style="color:${skill.colorMain}">📄 Lisez ce texte :</div>
      ${q.passage.replace(/\n/g,'<br>')}
    </div>`;
  }

  // Question text
  html += `<div class="question-text">${q.q.replace(/\n/g,'<br>')}</div>`;

  // Answer area
  if (q.t === 'mc') {
    html += buildMCOptions(q);
  } else if (q.t === 'tf') {
    html += buildTFButtons();
  } else if (q.t === 'match') {
    html += buildMatchGrid(q);
  } else if (q.t === 'ee') {
    html += buildEEQuestion(q);
  } else if (q.t === 'eo') {
    html += buildEOQuestion(q);
  }

  card.innerHTML = html;

  // Auto-play CO audio; for CO questions the timer starts only AFTER audio ends
  if (TEST.skillId === 'CO' && q.audio) {
    setTimeout(() => autoPlayAudio(q, () => startTimer(q.t)), 600);
  } else {
    startTimer(q.t);
  }
}
