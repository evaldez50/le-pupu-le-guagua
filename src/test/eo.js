import { TEST } from '../state.js';
import { clearTimer } from '../timer.js';
import { speakFrench } from '../utils.js';
import { nextQuestion } from './results.js';

/* ────────────────────────────────────────
   BUILD: EO QUESTION
──────────────────────────────────────── */
let EO_recognition = null;
let EO_isRecording  = false;

export function buildEOQuestion(q) {
  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const modeLabel = {repeat:'🔁 Répétez', answer:'💬 Répondez', produce:'🎙️ Produisez'}[q.mode] || '🎤';

  let html = `<div class="eo-model-box">
    <div style="font-size:.78rem;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${modeLabel}</div>
    <div class="eo-model-phrase">${q.model}</div>
    <button class="eo-listen-btn" onclick="speakFrench(TEST.questions[TEST.current].model)">🔊 Écouter le modèle</button>
  </div>`;

  if (hasSR) {
    html += `<div class="eo-record-wrap">
      <button class="eo-record-btn" id="eoRecordBtn" onclick="toggleEORecording()">🎤</button>
      <div class="eo-record-label" id="eoRecordLabel">Pulsa para hablar en francés</div>
    </div>
    <div class="eo-transcript-label">Tu respuesta (reconocida):</div>
    <div class="eo-transcript-box" id="eoTranscript">—</div>`;
  } else {
    html += `<div class="eo-no-sr-warn">⚠️ Tu navegador no soporta reconocimiento de voz. Escribe tu respuesta:</div>
    <input class="eo-fallback-input" id="eoFallbackInput" type="text"
           placeholder="Écrivez votre réponse orale ici..." />`;
  }

  html += `<div style="margin-top:16px">
    <div class="sa-label">¿Cómo fue tu pronunciación?</div>
    <div class="self-assess-row">
      <button class="sa-btn bien"     onclick="handleEOSelfAssess(5)">😊 Bien<br><small>5 pts</small></button>
      <button class="sa-btn passable" onclick="handleEOSelfAssess(3)">😐 Passable<br><small>3 pts</small></button>
      <button class="sa-btn revisar"  onclick="handleEOSelfAssess(0)">😔 À réviser<br><small>0 pts</small></button>
    </div>`;

  if (q.keywords && q.keywords.length) {
    html += `<div style="margin-top:12px">
      <div class="eo-transcript-label">Mots-clés à prononcer :</div>
      <div class="eo-keywords">${q.keywords.map(kw =>
        `<span class="eo-keyword-chip" id="kw_${kw}">${kw}</span>`).join('')}
      </div></div>`;
  }
  html += '</div>';
  return html;
}

export function toggleEORecording() {
  if (EO_isRecording) stopEORecording(); else startEORecording();
}

export function startEORecording() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  stopEORecording(); // cancel previous if any

  EO_recognition = new SR();
  EO_recognition.lang = 'fr-FR';
  EO_recognition.continuous = false;
  EO_recognition.interimResults = true;

  const btn   = document.getElementById('eoRecordBtn');
  const label = document.getElementById('eoRecordLabel');
  const box   = document.getElementById('eoTranscript');

  EO_recognition.onstart = () => {
    EO_isRecording = true;
    if (btn)   { btn.classList.add('recording'); btn.textContent = '⏹'; }
    if (label)   label.textContent = 'Grabando… habla ahora en francés';
    if (box)     box.textContent = '...';
  };

  EO_recognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    if (box) box.textContent = transcript;
    // Highlight matched keywords
    const q = TEST.questions[TEST.current];
    if (q.keywords) {
      const lower = transcript.toLowerCase();
      q.keywords.forEach(kw => {
        const chip = document.getElementById('kw_' + kw);
        if (chip && lower.includes(kw.toLowerCase())) chip.classList.add('found');
      });
    }
  };

  EO_recognition.onend = () => {
    EO_isRecording = false;
    if (btn)   { btn.classList.remove('recording'); btn.textContent = '🎤'; }
    if (label)   label.textContent = 'Pulsa para volver a grabar';
  };

  EO_recognition.onerror = (ev) => {
    EO_isRecording = false;
    if (btn)   { btn.classList.remove('recording'); btn.textContent = '🎤'; }
    if (label)   label.textContent = 'Error: ' + ev.error + '. Intenta de nuevo.';
  };

  EO_recognition.start();
}

export function stopEORecording() {
  if (EO_recognition) { try { EO_recognition.stop(); } catch(e) {} EO_recognition = null; }
  EO_isRecording = false;
}

export function handleEOSelfAssess(score) {
  if (TEST.answered) return;
  TEST.answered = true;
  clearTimer();
  stopEORecording();

  const fallback = document.getElementById('eoFallbackInput');
  if (fallback) fallback.disabled = true;
  document.querySelectorAll('.sa-btn').forEach(b => b.disabled = true);

  const map = {5:'bien', 3:'passable', 0:'revisar'};
  const cls = map[score];
  if (cls) document.querySelector(`.sa-btn.${cls}`)?.classList.add('selected');

  const q = TEST.questions[TEST.current];
  TEST.answers.push({correct: score > 0, q});
  TEST.score += score;
  document.getElementById('testScoreBadge').textContent = `⭐ ${TEST.score} pts`;
  if (score === 0) TEST.lives = Math.max(0, TEST.lives - 1);
  document.getElementById('testLives').textContent = '❤️'.repeat(TEST.lives) + '🖤'.repeat(3 - TEST.lives);
  document.getElementById('questionCard').classList.add(score >= 3 ? 'correct-border' : 'wrong-border');

  const fb = score === 5 ? {cls:'correct-fb', icon:'🎤✅', msg:'¡Excelente pronunciación! Sigue así.'} :
             score === 3 ? {cls:'correct-fb', icon:'👍',    msg:'Passable. Practica la pronunciación a diario.'} :
                           {cls:'wrong-fb',   icon:'📚',    msg:'Practica repitiendo en voz alta todos los días.'};
  const fbArea = document.getElementById('feedbackArea');
  fbArea.className = '';
  fbArea.innerHTML = `<div class="feedback-box ${fb.cls}">
    <div class="feedback-header ${fb.cls}">${fb.icon} ${score} pts — Autoevaluación oral</div>
    <div class="feedback-text">${q.e}</div>
  </div>`;

  const isLast = TEST.current === TEST.questions.length - 1;
  const btn = document.getElementById('btnNext');
  btn.className = 'btn-next' + (isLast ? ' last-q' : '');
  btn.innerHTML = isLast ? '🏁 Ver resultados' : 'Siguiente →';
  btn.onclick = nextQuestion;
}
