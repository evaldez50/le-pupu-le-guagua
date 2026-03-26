/* ────────────────────────────────────────
   UTILITIES
──────────────────────────────────────── */
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createStars() {
  const field = document.getElementById('starField');
  if (!field) return;
  for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*4}s;--max-op:${0.3+Math.random()*.7};width:${1+Math.random()*3}px;height:${1+Math.random()*3}px;`;
    field.appendChild(star);
  }
}

export function showToast(msg, duration) {
  let t = document.getElementById('app-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'app-toast';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:#fff;padding:12px 22px;border-radius:50px;font-size:.9rem;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, duration || 3500);
}

/* Selects the best available French voice using a quality-priority list.
   Prefers network voices (Google/Microsoft) over built-in system voices. */
export function getBestFrenchVoice() {
  const voices = window.speechSynthesis.getVoices();
  // All French voices (fr-FR, fr-CA, fr-BE, fr…)
  const frVoices = voices.filter(v => v.lang && /^fr/i.test(v.lang));
  if (frVoices.length === 0) return null;
  // Priority keywords — voices whose name contains these sound most natural
  const priority = [
    'Google français', 'Google French',
    'Microsoft Julie',  'Microsoft Hortense', 'Microsoft Paul',
    'Amélie', 'Thomas', 'Marie', 'Virginie', 'Audrey',
  ];
  for (const kw of priority) {
    const v = frVoices.find(v => v.name.toLowerCase().includes(kw.toLowerCase()));
    if (v) return v;
  }
  // Fall back to first fr-FR, then first fr-CA, then any fr
  return frVoices.find(v => v.lang === 'fr-FR')
      || frVoices.find(v => v.lang === 'fr-CA')
      || frVoices[0];
}

export function speakFrench(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();

  // Preprocess: normalise spacing around punctuation for more natural pacing
  const clean = text
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang   = 'fr-FR';
  utter.rate   = 0.88;   // 0.82 was too slow → artifacts more audible; 0.88 is cleaner
  utter.pitch  = 1.05;   // very slight lift sounds more conversational
  utter.volume = 1;

  const bestVoice = getBestFrenchVoice();
  if (bestVoice) utter.voice = bestVoice;

  utter.onend  = onEnd;
  utter.onerror = onEnd;
  window.speechSynthesis.speak(utter);
}

/* ────────────────────────────────────────
   CONFETTI
──────────────────────────────────────── */
export function launchConfetti() {
  const colors = ['#FFD166','#EF4135','#0055A4','#22C55E','#8B5CF6','#EC4899'];
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.cssText = `
        left:${Math.random()*100}vw;
        top:-10px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        animation-delay:${Math.random()*0.5}s;
        animation-duration:${0.8 + Math.random()*0.8}s;
        transform:rotate(${Math.random()*360}deg);
        border-radius:${Math.random()>.5?'50%':'2px'};
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }, i * 30);
  }
}

// Load voices when available (needed for some browsers)
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}
