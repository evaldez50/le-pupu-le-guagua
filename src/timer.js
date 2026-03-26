import { TEST } from './state.js';
import { recordAnswer } from './test/results.js';
import { nextQuestion } from './test/results.js';

/* ────────────────────────────────────────
   TIMER FUNCTIONS
──────────────────────────────────────── */
const CIRCUMFERENCE = 2 * Math.PI * 15; // r=15 → 94.25

export function getTimeLimit(type) {
  if (type === 'ee' || type === 'eo') return 120;
  if (type === 'match') return 60;
  return 30; // mc, tf
}

export function clearTimer() {
  if (TEST.timerInterval) {
    clearInterval(TEST.timerInterval);
    TEST.timerInterval = null;
  }
}

export function updateTimerUI() {
  const arc = document.getElementById('timerArc');
  const num = document.getElementById('timerNum');
  const wrap = document.getElementById('timerWrap');
  if (!arc || !num || !wrap) return;

  const pct = TEST.timeLeft / TEST.timeLimit;
  const offset = CIRCUMFERENCE * (1 - pct);
  arc.style.strokeDashoffset = offset;
  num.textContent = TEST.timeLeft;

  // Color states
  wrap.classList.remove('timer-urgent', 'timer-warning');
  if (pct <= 0.25) wrap.classList.add('timer-urgent');
  else if (pct <= 0.5) wrap.classList.add('timer-warning');
}

export function startTimer(type) {
  clearTimer();
  if (TEST.answered) return;
  TEST.timeLimit = getTimeLimit(type);
  TEST.timeLeft = TEST.timeLimit;

  // Set initial arc full
  const arc = document.getElementById('timerArc');
  if (arc) {
    arc.style.transition = 'none';
    arc.style.strokeDashoffset = '0';
    arc.style.strokeDasharray = CIRCUMFERENCE;
  }
  updateTimerUI();

  // Re-enable transition after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const a = document.getElementById('timerArc');
      if (a) a.style.transition = 'stroke-dashoffset 1s linear, stroke .4s ease';
    });
  });

  TEST.timerInterval = setInterval(() => {
    if (TEST.answered) { clearTimer(); return; }
    TEST.timeLeft--;
    updateTimerUI();
    if (TEST.timeLeft <= 0) {
      clearTimer();
      onTimerExpired();
    }
  }, 1000);
}

export function onTimerExpired() {
  if (TEST.answered) return;
  TEST.answered = true;
  const q = TEST.questions[TEST.current];
  recordAnswer(false, q);
  // Show timeout feedback
  const fb = document.getElementById('feedbackArea');
  if (fb) {
    fb.className = 'feedback-wrong';
    fb.innerHTML = `<div class="fb-icon">⏰</div>
      <div class="fb-text"><strong>¡Tiempo!</strong></div>
      ${q.e ? `<div class="fb-exp">${q.e}</div>` : ''}`;
  }
  const btnNext = document.getElementById('btnNext');
  if (btnNext) btnNext.className = 'btn-next';
  setTimeout(() => nextQuestion(), 1400);
}
