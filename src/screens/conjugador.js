import { canAccessVerbGroup } from '../auth.js';
import { showPaywall } from '../payment.js';
import { showScreen } from '../navigation.js';

/* ────────────────────────────────────────
   CONJUGADOR FUNCTIONS
──────────────────────────────────────── */
export const CONJ = {
  groupId: null,
  verbInf: null,
  phase: 'select', // 'select' | 'practice'
};

export function exitConjugador() {
  CONJ.groupId = null;
  CONJ.verbInf = null;
  CONJ.phase = 'select';
  showScreen('home');
}

export function renderConjugador() {
  const c = document.getElementById('conjContainer');
  if (!c) return;
  c.classList.toggle('practice-phase', CONJ.phase === 'practice');
  if (CONJ.phase === 'practice') {
    renderConjPractice(c);
  } else {
    renderConjSelect(c);
  }
}

export function renderConjSelect(c) {
  const selectedGroup = VERB_GROUPS.find(g => g.id === CONJ.groupId);

  const groupCards = VERB_GROUPS.map(g => {
    const isSel = g.id === CONJ.groupId;
    const borderStyle = isSel ? `border-color:${g.color};background:${g.colorLight};` : '';
    return `<div class="conj-group-card${isSel ? ' selected' : ''}" style="${borderStyle}" onclick="selectConjGroup('${g.id}')">
      <div class="conj-group-emoji">${g.emoji}</div>
      <div class="conj-group-label">${g.label}</div>
      <div class="conj-group-sublabel">${g.sublabel}</div>
      <div class="conj-group-desc">${g.desc}</div>
    </div>`;
  }).join('');

  let verbSection = '';
  if (selectedGroup) {
    const pills = [...selectedGroup.verbs].sort((a,b) => a.inf.localeCompare(b.inf,'fr')).map(v => {
      const isSel = v.inf === CONJ.verbInf;
      const hasSentences = !!v.sentences;
      const selStyle = isSel ? `background:${selectedGroup.color};` : '';
      const soon = !hasSentences ? `<span class="conj-pill-es">🔜</span>` : `<span class="conj-pill-es">(${v.es})</span>`;
      return `<button class="conj-verb-pill${isSel ? ' selected' : ''}${!hasSentences ? ' soon' : ''}" style="${selStyle}" onclick="selectConjVerb('${v.inf.replace("'","\\'")}')">
        ${v.inf}${soon}
      </button>`;
    }).join('');
    verbSection = `<div class="conj-verb-section">
      <div class="conj-verb-section-title">Elige el verbo a practicar</div>
      <div class="conj-verb-pills">${pills}</div>
    </div>`;
  }

  const selectedVerb = selectedGroup && CONJ.verbInf
    ? selectedGroup.verbs.find(v => v.inf === CONJ.verbInf)
    : null;
  const canStart    = !!(selectedVerb && selectedVerb.sentences);
  const verbChosen  = !!(CONJ.groupId && CONJ.verbInf);
  const startLabel  = verbChosen && !canStart ? '🔜 Próximamente' : '🚀 Comenzar práctica';
  c.innerHTML = `
    <div class="conj-hero">
      <div class="conj-hero-icon">🔤</div>
      <div class="conj-hero-title">Conjugador de Verbos</div>
      <div class="conj-hero-sub">Selecciona un grupo y un verbo · practica los 10 tiempos gramaticales</div>
    </div>
    <div class="conj-groups-grid">${groupCards}</div>
    ${verbSection}
    <button class="conj-start-btn" ${canStart ? '' : 'disabled'} onclick="beginConjPractice()">
      ${startLabel}
    </button>`;
}

export function selectConjGroup(gid) {
  CONJ.groupId = gid;
  CONJ.verbInf = null;
  CONJ.phase = 'select';
  renderConjugador();
}

export function selectConjVerb(vinf) {
  // Verificar acceso freemium
  const grupoVerbo = CONJ.groupId;
  if (!canAccessVerbGroup(grupoVerbo)) {
    showPaywall('El conjugador completo (verbos -IR, -RE e irregulares) requiere la versión completa.');
    return;
  }
  CONJ.verbInf = vinf;
  renderConjugador();
}

export function beginConjPractice() {
  if (!CONJ.groupId || !CONJ.verbInf) return;
  const grp = VERB_GROUPS.find(g => g.id === CONJ.groupId);
  const vrb = grp && grp.verbs.find(v => v.inf === CONJ.verbInf);
  if (!vrb || !vrb.sentences) return;
  CONJ.phase = 'practice';
  const badge = document.getElementById('conjScoreBadge');
  if (badge) badge.style.display = 'none';
  renderConjugador();
}

/* Normalize for comparison: trim, straight apostrophe, remove trailing punctuation */
export function normalizeConj(s) {
  return s.trim().replace(/\u2019/g, "'").replace(/[.!?]+$/, '');
}

/* Extract just the verb form (without pronoun or sentence frame) from a full sentence.
   Compound tenses (passé composé, plus-que-parfait, conditionnel passé, subjonctif passé,
   futur proche) return 2 words (auxiliary + participle/infinitive); simple tenses return 1. */
export function extractVerbForm(fr, pronounKey, tenseId) {
  const COMPOUND = new Set(['passe_compose','plus_que_parfait','conditionnel_passe','subjonctif_passe','futur_proche']);
  let s = normalizeConj(fr).toLowerCase();
  // Strip subjonctif sentence frames
  s = s
    .replace(/^il faut que j'/, '')
    .replace(/^il faut qu'/, '')
    .replace(/^il faut que /, '')
    .replace(/^je doute que j'/, '')
    .replace(/^je doute qu'/, '')
    .replace(/^je doute que /, '');
  // Strip leading subject pronoun (il/ils entries also accept elle/elles)
  const prefixes = {
    je:   ["j'", 'je '],
    tu:   ['tu '],
    il:   ['il ', 'elle '],
    nous: ['nous '],
    vous: ['vous '],
    ils:  ['ils ', 'elles '],
  };
  for (const p of (prefixes[pronounKey] || [])) {
    if (s.startsWith(p)) { s = s.slice(p.length); break; }
  }
  const words = s.split(' ');
  return COMPOUND.has(tenseId) && words.length >= 2 ? words[0] + ' ' + words[1] : words[0];
}

/* Check a single pronoun slot — user types only the verb form (e.g. "parle", "ai parlé").
   Accepts il/elle and ils/elles verb forms interchangeably. */
export function checkPronounSlot(userInput, slotData, slot, tenseId) {
  const norm     = normalizeConj(userInput).toLowerCase();
  const expected = extractVerbForm(slotData.fr, slot, tenseId);
  if (norm === expected) return true;

  if (slot === 'il') {
    // Accept explicit fr_elle (être-verbs: "est parti" vs "est partie")
    if (slotData.fr_elle && norm === extractVerbForm(slotData.fr_elle, 'il', tenseId)) return true;
  }

  if (slot === 'ils') {
    // Accept explicit fr_elles
    if (slotData.fr_elles && norm === extractVerbForm(slotData.fr_elles, 'ils', tenseId)) return true;
  }

  return false;
}

export const PRONOUN_SLOTS = [
  {key:'je',   label:'Je'},
  {key:'tu',   label:'Tu'},
  {key:'il',   label:'Il / Elle'},
  {key:'nous', label:'Nous'},
  {key:'vous', label:'Vous'},
  {key:'ils',  label:'Ils / Elles'},
];

export function renderConjPractice(c) {
  const group = VERB_GROUPS.find(g => g.id === CONJ.groupId);
  const verb  = group.verbs.find(v => v.inf === CONJ.verbInf);

  const cards = TENSES.map(t => {
    const tenseSentences = verb.sentences[t.id];
    const pronounRows = PRONOUN_SLOTS.map(p => {
      const hint = p.key === 'je' && tenseSentences.je.es
        ? `<div class="conj-pronoun-hint">${tenseSentences.je.es}</div>`
        : '';
      return `<div class="conj-pronoun-row">
        <span class="conj-pronoun-label">${p.label}</span>
        ${hint}
        <input class="conj-tense-input" id="conjInput-${t.id}-${p.key}" type="text"
          placeholder="En francés…"
          onkeydown="if(event.key==='Enter')verifyTense('${t.id}')">
        <div class="conj-pronoun-feedback" id="conjFb-${t.id}-${p.key}"></div>
      </div>`;
    }).join('');

    return `<div class="conj-tense-card" id="conjCard-${t.id}">
      <div class="conj-tense-header">
        <span class="conj-tense-badge">${t.label}</span>
      </div>
      ${pronounRows}
      <button class="conj-tense-verify-btn" id="conjVerifyTense-${t.id}"
        onclick="verifyTense('${t.id}')">Verificar</button>
    </div>`;
  }).join('');

  c.innerHTML = `
    <div class="conj-practice-header">
      <div class="conj-practice-verb">${verb.inf} <span>(${verb.es})</span></div>
    </div>
    <div class="conj-grid">${cards}</div>
    <div class="conj-action-btns" id="conjActionBtns" style="display:none">
      <button class="conj-retry-btn" onclick="resetConjugation()">🔄 Intentar de nuevo</button>
      <button class="conj-back-btn" onclick="selectConjGroup('${CONJ.groupId}')">← Elegir otro verbo</button>
    </div>`;
}

export function verifyTense(tenseId) {
  const group = VERB_GROUPS.find(g => g.id === CONJ.groupId);
  const verb  = group.verbs.find(v => v.inf === CONJ.verbInf);
  const card  = document.getElementById('conjCard-' + tenseId);
  const btn   = document.getElementById('conjVerifyTense-' + tenseId);
  if (!card) return;

  const tenseSentences = verb.sentences[tenseId];
  let allCorrect = true;

  PRONOUN_SLOTS.forEach(p => {
    const input = document.getElementById(`conjInput-${tenseId}-${p.key}`);
    const fb    = document.getElementById(`conjFb-${tenseId}-${p.key}`);
    if (!input) return;

    const slotData  = tenseSentences[p.key];
    const userVal   = input.value;
    const isCorrect = userVal.trim() && checkPronounSlot(userVal, slotData, p.key, tenseId);

    input.disabled = true;
    input.style.borderColor = isCorrect ? '#22C55E' : '#EF4444';

    if (fb) {
      if (isCorrect) {
        fb.className = 'conj-pronoun-feedback ok';
        fb.textContent = '✓ Correcto';
      } else {
        fb.className = 'conj-pronoun-feedback err';
        fb.textContent = '✗ ' + slotData.fr;
        allCorrect = false;
      }
    }
  });

  card.classList.remove('correct', 'wrong');
  card.classList.add(allCorrect ? 'correct' : 'wrong');
  if (btn) btn.disabled = true;
  updateConjScore();
}

export function updateConjScore() {
  const verifiedCount = TENSES.filter(t => {
    const c = document.getElementById('conjCard-' + t.id);
    return c?.classList.contains('correct') || c?.classList.contains('wrong');
  }).length;
  const correctCount = TENSES.filter(t =>
    document.getElementById('conjCard-' + t.id)?.classList.contains('correct')
  ).length;

  const badge = document.getElementById('conjScoreBadge');
  if (badge) {
    if (verifiedCount === 0) { badge.style.display = 'none'; return; }
    badge.style.display = 'inline-block';
    badge.textContent   = verifiedCount + ' / 10';
    badge.style.background = '#E0E7FF';
    badge.style.color      = '#3730A3';
  }
  if (verifiedCount === 10) {
    const actionBtns = document.getElementById('conjActionBtns');
    if (actionBtns) actionBtns.style.display = 'flex';
  }
}

export function resetConjugation() {
  TENSES.forEach(t => {
    const card  = document.getElementById('conjCard-' + t.id);
    const btn   = document.getElementById('conjVerifyTense-' + t.id);
    if (card) card.classList.remove('correct', 'wrong');
    if (btn)  btn.disabled = false;
    PRONOUN_SLOTS.forEach(p => {
      const input = document.getElementById(`conjInput-${t.id}-${p.key}`);
      const fb    = document.getElementById(`conjFb-${t.id}-${p.key}`);
      if (input) { input.value = ''; input.disabled = false; input.style.borderColor = ''; }
      if (fb)    { fb.className = 'conj-pronoun-feedback'; fb.textContent = ''; }
    });
  });
  const badge = document.getElementById('conjScoreBadge');
  if (badge) badge.style.display = 'none';
  const actionBtns = document.getElementById('conjActionBtns');
  if (actionBtns) actionBtns.style.display = 'none';
  window.scrollTo(0, 0);
}
