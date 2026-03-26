import { TEST } from '../state.js';
import { clearTimer } from '../timer.js';
import { recordAnswer, showFeedback } from './results.js';

/* ────────────────────────────────────────
   HANDLERS: MC
──────────────────────────────────────── */
export function handleMC(chosenIdx) {
  if (TEST.answered) return;
  TEST.answered = true;
  clearTimer();

  const q = TEST.questions[TEST.current];
  const correct = chosenIdx === q.c;
  const btns = document.querySelectorAll('.option-btn');

  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === chosenIdx) {
      btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
      btn.querySelector('.option-letter').textContent = correct ? '✓' : '✗';
    } else if (i === q.c && !correct) {
      btn.classList.add('reveal-correct');
      btn.querySelector('.option-letter').textContent = '✓';
    }
  });

  recordAnswer(correct, q);
  showFeedback(correct, q);
}

/* ────────────────────────────────────────
   HANDLERS: TF
──────────────────────────────────────── */
export function handleTF(answer) {
  if (TEST.answered) return;
  TEST.answered = true;
  clearTimer();

  const q = TEST.questions[TEST.current];
  const correct = answer === q.c;
  const btns = document.querySelectorAll('.tf-btn');

  btns.forEach(btn => {
    btn.disabled = true;
    const isVrai = btn.classList.contains('vrai');
    const wasChosen = (isVrai && answer === true) || (!isVrai && answer === false);
    const isCorrectBtn = (isVrai && q.c === true) || (!isVrai && q.c === false);

    if (wasChosen) btn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
    else if (isCorrectBtn && !correct) btn.classList.add('reveal-correct');
  });

  recordAnswer(correct, q);
  showFeedback(correct, q);
}

/* ────────────────────────────────────────
   HANDLERS: MATCH
──────────────────────────────────────── */
export function matchSelectLeft(idx) {
  if (TEST.match.verified) return;
  if (TEST.match.connections[idx] !== undefined) return; // already matched

  // Clear previous selection
  document.querySelectorAll('.match-item[id^="ml"]').forEach(el => el.classList.remove('active'));

  TEST.match.selectedLeft = idx;
  document.getElementById('ml' + idx).classList.add('active');
}

export function matchSelectRight(displayIdx) {
  if (TEST.match.verified) return;
  if (TEST.match.selectedLeft === null) return;

  const leftIdx = TEST.match.selectedLeft;
  const actualRightIdx = TEST.match.rightOrder[displayIdx];

  // Check if right item already used
  const usedRight = Object.values(TEST.match.connections);
  if (usedRight.includes(actualRightIdx)) return;

  // Make connection
  TEST.match.connections[leftIdx] = actualRightIdx;
  TEST.match.selectedLeft = null;

  // Visual feedback for this pair
  const q = TEST.questions[TEST.current];
  const leftItem  = document.getElementById('ml' + leftIdx);
  const rightItem = document.getElementById('mr' + displayIdx);
  const pairColor = `hsl(${(leftIdx * 70 + 180)}deg,60%,85%)`;

  leftItem.classList.remove('active');
  leftItem.classList.add('matched');
  leftItem.style.borderColor = `hsl(${leftIdx*70+180}deg,60%,50%)`;
  leftItem.style.background  = pairColor;

  rightItem.classList.add('matched');
  rightItem.style.borderColor = `hsl(${leftIdx*70+180}deg,60%,50%)`;
  rightItem.style.background  = pairColor;

  // Show connections summary
  const connDiv = document.getElementById('matchConnections');
  const leftLabel  = q.p[leftIdx][0];
  const rightLabel = q.p[TEST.match.rightOrder[displayIdx]][1];
  connDiv.innerHTML += `<div class="match-pair-chip" id="chip${leftIdx}">
    <span>${leftLabel}</span><span>↔</span><span>${rightLabel}</span>
  </div>`;

  // Show verify button when all 4 matched
  if (Object.keys(TEST.match.connections).length === 4) {
    document.getElementById('matchVerifyBtn').classList.remove('hidden');
    // Disable all items
    document.querySelectorAll('.match-item').forEach(el => el.style.cursor = 'default');
  }
}

export function verifyMatch() {
  if (TEST.answered) return;
  TEST.answered = true;
  clearTimer();
  TEST.match.verified = true;

  const q = TEST.questions[TEST.current];
  let correctCount = 0;

  // Check each connection: correct if connections[leftIdx] === leftIdx
  [0,1,2,3].forEach(leftIdx => {
    const actualRight = TEST.match.connections[leftIdx];
    const correct = actualRight === leftIdx;
    if (correct) correctCount++;

    const chip = document.getElementById('chip' + leftIdx);
    if (chip) chip.classList.add(correct ? 'correct-pair' : 'wrong-pair');

    const ml = document.getElementById('ml' + leftIdx);
    if (ml) { ml.style.borderColor = correct ? '#22C55E' : '#EF4444'; ml.style.background = correct ? '#DCFCE7' : '#FEE2E2'; }
  });

  const allCorrect = correctCount === 4;
  recordAnswer(allCorrect, q);
  showFeedback(allCorrect, q, correctCount === 4 ? null : `Pares correctos: ${correctCount}/4.`);
  document.getElementById('matchVerifyBtn').disabled = true;
}
