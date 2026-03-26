import { TEST } from '../state.js';
import { clearTimer } from '../timer.js';
import { recordAnswer, showFeedback, nextQuestion } from './results.js';

/* ────────────────────────────────────────
   BUILD: EE QUESTION
──────────────────────────────────────── */
export function buildEEQuestion(q) {
  if (q.mode === 'fill') {
    return `<div class="ee-fill-wrap">
      <input class="ee-fill-input" id="eeFillInput" type="text"
             placeholder="Écrivez votre réponse..." autocomplete="off"
             onkeydown="if(event.key==='Enter')handleEEFill()" />
      <button class="btn btn-primary btn-sm ee-fill-btn" onclick="handleEEFill()">Vérifier ✓</button>
    </div>`;
  }
  // mode === 'write'
  return `<div class="ee-write-wrap">
    <div class="ee-prompt-box">📝 ${q.prompt}</div>
    ${q.criteria ? `<ul class="ee-criteria-list">
      ${q.criteria.map(c => `<li>${c}</li>`).join('')}
    </ul>` : ''}
    <textarea class="ee-textarea" id="eeTextarea"
              placeholder="Écrivez votre réponse ici..."
              oninput="updateEECharCount(this)"></textarea>
    <div class="ee-char-count" id="eeCharCount">0 caractères</div>
    <div class="sa-label">¿Cómo fue tu respuesta?</div>
    <div class="self-assess-row">
      <button class="sa-btn bien"    onclick="handleEEWrite(5)">😊 Bien<br><small>5 pts</small></button>
      <button class="sa-btn passable" onclick="handleEEWrite(3)">😐 Passable<br><small>3 pts</small></button>
      <button class="sa-btn revisar" onclick="handleEEWrite(0)">😔 À réviser<br><small>0 pts</small></button>
    </div>
  </div>`;
}

export function updateEECharCount(el) {
  const n = el.value.length;
  document.getElementById('eeCharCount').textContent = n + ' caractère' + (n !== 1 ? 's' : '');
}

export function handleEEFill() {
  if (TEST.answered) return;
  const input = document.getElementById('eeFillInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) { input.focus(); input.style.borderColor = '#EF4444'; return; }

  const q = TEST.questions[TEST.current];
  const userLower = val.toLowerCase();
  const accepted = [q.a.toLowerCase(), ...(q.alt || []).map(a => a.toLowerCase())];
  const correct = accepted.includes(userLower);

  TEST.answered = true;
  clearTimer();
  input.disabled = true;
  input.classList.add(correct ? 'fill-correct' : 'fill-wrong');
  const fillBtn = document.querySelector('.ee-fill-btn');
  if (fillBtn) fillBtn.disabled = true;

  if (!correct) {
    const hint = document.createElement('div');
    hint.className = 'ee-fill-hint';
    hint.textContent = '✓ Réponse correcte : ' + q.a;
    input.parentNode.appendChild(hint);
  }
  recordAnswer(correct, q);
  showFeedback(correct, q);
}

export function handleEEWrite(score) {
  if (TEST.answered) return;
  const textarea = document.getElementById('eeTextarea');
  if (textarea && textarea.value.trim().length < 3) {
    textarea.focus(); textarea.style.borderColor = '#EF4444'; return;
  }
  TEST.answered = true;
  clearTimer();
  if (textarea) textarea.disabled = true;
  document.querySelectorAll('.sa-btn').forEach(b => b.disabled = true);

  const map = {5:'bien', 3:'passable', 0:'revisar'};
  const cls = map[score];
  if (cls) document.querySelector(`.sa-btn.${cls}`)?.classList.add('selected');

  // Show model answer
  const q = TEST.questions[TEST.current];
  const writeWrap = document.querySelector('.ee-write-wrap');
  if (writeWrap && q.model) {
    const modelDiv = document.createElement('div');
    modelDiv.className = 'ee-model-box';
    modelDiv.innerHTML = `<div class="ee-model-label">💡 Réponse modèle</div>
      <div class="ee-model-text">${q.model}</div>`;
    writeWrap.appendChild(modelDiv);
  }

  // Push score manually (self-assessed)
  TEST.answers.push({correct: score > 0, q});
  TEST.score += score;
  document.getElementById('testScoreBadge').textContent = `⭐ ${TEST.score} pts`;
  if (score === 0) TEST.lives = Math.max(0, TEST.lives - 1);
  document.getElementById('testLives').textContent = '❤️'.repeat(TEST.lives) + '🖤'.repeat(3 - TEST.lives);
  document.getElementById('questionCard').classList.add(score >= 3 ? 'correct-border' : 'wrong-border');

  const fb = score === 5 ? {cls:'correct-fb', icon:'✅', msg:'¡Excelente! Respuesta completa y correcta.'} :
             score === 3 ? {cls:'correct-fb', icon:'👍', msg:'Passable. Continúa practicando para mejorar.'} :
                           {cls:'wrong-fb',   icon:'📚', msg:'Necessitas repasar. Estudia la respuesta modelo.'};
  const fbArea = document.getElementById('feedbackArea');
  fbArea.className = '';
  fbArea.innerHTML = `<div class="feedback-box ${fb.cls}">
    <div class="feedback-header ${fb.cls}">${fb.icon} ${score} pts — Autoevaluación</div>
    <div class="feedback-text">${q.e}</div>
  </div>`;

  const isLast = TEST.current === TEST.questions.length - 1;
  const btn = document.getElementById('btnNext');
  btn.className = 'btn-next' + (isLast ? ' last-q' : '');
  btn.innerHTML = isLast ? '🏁 Ver resultados' : 'Siguiente →';
  btn.onclick = nextQuestion;
}
