import { TEST } from '../state.js';
import { shuffleArray, speakFrench } from '../utils.js';

/* ────────────────────────────────────────
   BUILD: LISTEN SECTION (CO)
──────────────────────────────────────── */
export let audioPlays = 0;
export const MAX_PLAYS = 2;

export function buildListenSection(q) {
  audioPlays = 0;
  return `<div class="listen-section">
    <button class="listen-btn" id="listenBtn" onclick="playAudio()">
      🔊 Écouter le texte
    </button>
    <div class="listen-replay-count" id="listenCount">Puedes escuchar ${MAX_PLAYS} veces</div>
    <div class="listen-transcript" id="listenTranscript">${q.audio}</div>
  </div>`;
}

export function autoPlayAudio(q, onDone) {
  if (!window.speechSynthesis) { onDone?.(); return; }
  playAudio(onDone);
}

export function playAudio(onDone) {
  const q = TEST.questions[TEST.current];
  if (!q.audio) { onDone?.(); return; }
  if (audioPlays >= MAX_PLAYS) { onDone?.(); return; }

  const btn = document.getElementById('listenBtn');
  if (!btn) { onDone?.(); return; }
  btn.disabled = true;
  btn.className = 'listen-btn playing';
  btn.textContent = '⏸ Escuchando...';

  speakFrench(q.audio, () => {
    audioPlays++;
    if (btn) {
      btn.disabled = false;
      btn.className = 'listen-btn';
      const remaining = MAX_PLAYS - audioPlays;
      if (remaining > 0) {
        btn.innerHTML = `🔄 Repetir (${remaining} restante${remaining>1?'s':''})`;
        document.getElementById('listenCount').textContent = `Puedes repetir ${remaining} vez${remaining>1?'es':''}`;
      } else {
        btn.disabled = true;
        btn.style.opacity = '.5';
        btn.innerHTML = '✅ Reproducciones agotadas';
        document.getElementById('listenCount').textContent = 'Máximo de reproducciones alcanzado';
      }
    }
    onDone?.();
  });
}

/* ────────────────────────────────────────
   BUILD: MC OPTIONS
──────────────────────────────────────── */
export function buildMCOptions(q) {
  const letters = ['A','B','C','D'];
  return `<div class="options-grid">
    ${q.a.map((opt,i) => `
      <button class="option-btn" onclick="handleMC(${i})">
        <span class="option-letter">${letters[i]}</span>
        ${opt}
      </button>`).join('')}
  </div>`;
}

/* ────────────────────────────────────────
   BUILD: TRUE/FALSE BUTTONS
──────────────────────────────────────── */
export function buildTFButtons() {
  return `<div class="tf-row">
    <button class="tf-btn vrai" onclick="handleTF(true)">
      <span class="tf-btn-icon">✅</span>
      <span>Vrai</span>
    </button>
    <button class="tf-btn faux" onclick="handleTF(false)">
      <span class="tf-btn-icon">❌</span>
      <span>Faux</span>
    </button>
  </div>`;
}

/* ────────────────────────────────────────
   BUILD: MATCH GRID
──────────────────────────────────────── */
export function buildMatchGrid(q) {
  // Shuffle right items
  const rightOrder = shuffleArray([0,1,2,3]);
  TEST.match = { selectedLeft: null, connections: {}, rightOrder, verified: false };

  const leftItems  = q.p.map(pair => pair[0]);
  const rightItems = q.p.map(pair => pair[1]);

  let html = `<p class="match-instruction">Haz clic en un elemento de la izquierda y luego en su par de la derecha.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div>
      <div class="match-col-label" style="color:var(--blue)">Términos</div>
      <div id="matchLeft">
        ${leftItems.map((item,i) => `
          <div class="match-item" id="ml${i}" onclick="matchSelectLeft(${i})" style="margin-bottom:8px">${item}</div>
        `).join('')}
      </div>
    </div>
    <div>
      <div class="match-col-label" style="color:var(--blue)">Definiciones</div>
      <div id="matchRight">
        ${rightOrder.map((actualIdx,displayIdx) => `
          <div class="match-item" id="mr${displayIdx}" onclick="matchSelectRight(${displayIdx})" style="margin-bottom:8px">${rightItems[actualIdx]}</div>
        `).join('')}
      </div>
    </div>
  </div>
  <div id="matchConnections" class="match-connections" style="margin-top:12px"></div>
  <button class="match-verify-btn hidden" id="matchVerifyBtn" onclick="verifyMatch()">✓ Verificar respuestas</button>`;
  return html;
}
