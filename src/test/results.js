import { TEST } from '../state.js';
import { LEVELS, SKILLS } from '../data/levels.js';
import { clearTimer } from '../timer.js';
import { launchConfetti } from '../utils.js';
import { showScreen } from '../navigation.js';
import { stopEORecording } from './eo.js';
import { saveResult, updateHistoryBadge } from '../screens/history.js';
import { buildResultsTip } from '../screens/tips.js';

/* ────────────────────────────────────────
   FEEDBACK
──────────────────────────────────────── */
export function showFeedback(correct, q, extraMsg) {
  // Reveal CO transcript after answering
  const transcript = document.getElementById('listenTranscript');
  if (transcript) transcript.classList.add('visible');

  // Update card border
  document.getElementById('questionCard').classList.add(correct ? 'correct-border' : 'wrong-border');

  if (!correct) TEST.lives = Math.max(0, TEST.lives - 1);
  document.getElementById('testLives').textContent = '❤️'.repeat(TEST.lives) + '🖤'.repeat(3 - TEST.lives);

  const fbArea = document.getElementById('feedbackArea');
  fbArea.className = '';
  fbArea.innerHTML = `
    <div class="feedback-box ${correct ? 'correct-fb' : 'wrong-fb'}">
      <div class="feedback-header ${correct ? 'correct-fb' : 'wrong-fb'}">
        ${correct ? '✅ ¡Correct!' : '❌ Incorrect'}
        ${extraMsg ? ` · ${extraMsg}` : ''}
      </div>
      <div class="feedback-text">${q.e}</div>
    </div>`;

  // Show next button
  const isLast = TEST.current === TEST.questions.length - 1;
  const btn = document.getElementById('btnNext');
  btn.className = 'btn-next' + (isLast ? ' last-q' : '');
  btn.innerHTML = isLast ? '🏁 Ver resultados' : 'Siguiente →';
  btn.onclick = nextQuestion;
}

/* ────────────────────────────────────────
   RECORD & NEXT
──────────────────────────────────────── */
export function recordAnswer(correct, q) {
  TEST.answers.push({correct, q});
  if (correct) TEST.score += 5; // 5 pts per correct answer, max 100
  document.getElementById('testScoreBadge').textContent = `⭐ ${TEST.score} pts`;
}

export function nextQuestion() {
  clearTimer();
  window.speechSynthesis && window.speechSynthesis.cancel();
  stopEORecording();
  TEST.current++;
  if (TEST.current >= TEST.questions.length) {
    showResults();
  } else {
    // Import renderQuestion dynamically to avoid circular dependency
    // engine.js imports results.js and results.js needs renderQuestion from engine.js
    // Use late binding via window
    window.renderQuestion();
    window.scrollTo(0, 0);
  }
}

/* ────────────────────────────────────────
   RESULTS
──────────────────────────────────────── */
export function showResults() {
  const correct = TEST.answers.filter(a => a.correct).length;
  const total   = TEST.answers.length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const lvl     = LEVELS.find(l => l.id === TEST.levelId);
  const skill   = SKILLS.find(s => s.id === TEST.skillId);
  const stars   = pct >= 90 ? 3 : pct >= 65 ? 2 : 1;

  // Score circle
  const circle = document.getElementById('scoreCircle');
  const circleColor = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F59E0B' : '#EF4444';
  circle.style.borderColor = circleColor;
  circle.style.color = circleColor;
  document.getElementById('scoreNum').textContent = correct;
  document.getElementById('scoreDenom').textContent = `/ ${total}`;

  // Stars (animated)
  const starsRow = document.getElementById('starsRow');
  starsRow.innerHTML = [1,2,3].map((s,i) =>
    `<span class="star-anim" style="animation-delay:${i*0.15}s;filter:${s<=stars?'none':'grayscale(1) opacity(.3)'}">${s<=stars?'⭐':'⭐'}</span>`
  ).join('');

  // Level badge
  document.getElementById('resultsLevelBadge').innerHTML =
    `<span>${lvl.emoji}</span><span style="color:${lvl.colorDark};font-weight:800">${lvl.id}</span>
     <span style="color:${skill.colorMain};font-weight:700">· ${skill.subtitle}</span>`;
  document.getElementById('resultsLevelBadge').style.background = lvl.colorLight;

  // Title + subtitle
  const titles = {3:'🏆 Excellent!', 2:'👍 Bien joué!', 1:'💪 Continue!'};
  const subtitles = {
    3:`Dominaste el ${skill.subtitle} ${lvl.id}. ¡Listo para el TEF! 🇫🇷`,
    2:`Buen progreso. Repasa las preguntas incorrectas para mejorar.`,
    1:`Sigue practicando. El éxito llega con la constancia. 🐸`,
  };
  document.getElementById('resultsTitle').textContent = titles[stars];
  document.getElementById('resultsSubtitle').textContent = subtitles[stars];

  // Stats
  document.getElementById('statCorrect').textContent = correct;
  document.getElementById('statWrong').textContent = total - correct;
  document.getElementById('statPct').textContent = pct + '%';

  // Per-question review
  const reviewList = document.getElementById('reviewList');
  reviewList.innerHTML = TEST.answers.map((ans, i) => {
    const q = ans.q;
    const shortQ = q.q.replace(/\n/g,' ').substring(0, 80) + (q.q.length > 80 ? '…' : '');
    return `<div class="review-item ${ans.correct ? 'review-correct' : 'review-wrong'}">
      <div class="review-icon">${ans.correct ? '✅' : '❌'}</div>
      <div class="review-content">
        <div class="review-q">${i+1}. ${shortQ}</div>
        ${!ans.correct ? `<div class="review-exp">${q.e.substring(0,120)}${q.e.length>120?'…':''}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  // Save to localStorage history
  const elapsed = Math.round((Date.now() - (TEST.startTime || Date.now())) / 1000);
  saveResult({
    id: Date.now(),
    date: new Date().toISOString(),
    level: TEST.levelId,
    skill: TEST.skillId,
    score: correct,
    total,
    pct,
    time: elapsed,
    stars,
  });
  updateHistoryBadge();

  // Study tip for results screen
  const tipEl = document.getElementById('resultsTipCard');
  if (tipEl) tipEl.innerHTML = buildResultsTip(TEST.skillId, TEST.levelId, pct);

  // Confetti on 3 stars
  if (stars === 3) launchConfetti();

  showScreen('results');
}

export function retryTest() {
  // Import startTest dynamically to avoid circular dependency
  window.startTest(TEST.skillId, TEST.levelId);
}
