/* ══════════════════════════════════════════════════════
   LANDING — Contadores dinámicos + Carrusel de testimonios
   ══════════════════════════════════════════════════════ */

const BASE_EXERCISES = 15000;
const BASE_USERS     = 1247;   // Se muestra como "1,200+"

/* ── Contador de ejercicios (localStorage, crece con cada startTest) ── */
export function getExerciseCount() {
  const extra = parseInt(localStorage.getItem('lp_exCount') || '0', 10);
  return BASE_EXERCISES + extra;
}

export function incrementExerciseCount() {
  const cur = parseInt(localStorage.getItem('lp_exCount') || '0', 10);
  localStorage.setItem('lp_exCount', cur + 1);
}

/* ── Animación count-up ── */
function animateCounter(el, target, suffix, duration) {
  const startAt = Math.max(0, target - Math.ceil(target * 0.08)); // empieza en ~92%
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const val = Math.round(startAt + (target - startAt) * ease);
    el.textContent = val.toLocaleString('es') + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Inicializa contadores en la landing ── */
export function initLandingCounters() {
  const exEl = document.getElementById('landing-exercises-count');
  if (exEl) animateCounter(exEl, getExerciseCount(), '+', 2200);

  const usEl = document.getElementById('landing-users-count');
  if (usEl) animateCounter(usEl, BASE_USERS, '+', 1600);
}

/* ══════════════════════════════════════════════════════
   CARRUSEL DE TESTIMONIOS
   ══════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  {
    name: 'María García',
    flag: '🇨🇴', country: 'Colombia',
    result: 'Practica nivel B2 ⭐',
    text: 'Los ejercicios son muy similares al formato real del TEF. El temario específico me ahorró meses de búsqueda de material. Me siento mucho más preparada.',
  },
  {
    name: 'Carlos Mendoza',
    flag: '🇲🇽', country: 'México',
    result: 'Practica nivel B1 ⭐',
    text: 'El conjugador interactivo transformó mi francés. Pasé de huirle a los verbos a dominarlos en pocas semanas. ¡100% recomendado para preparar el TEF!',
  },
  {
    name: 'Ana Ruiz',
    flag: '🇻🇪', country: 'Venezuela',
    result: 'De A1 a B1 en 4 meses ⭐',
    text: 'En 4 meses avancé de A1 a B1. Los ejercicios de Comprensión Oral se sienten muy cercanos al formato del TEF real. Gran herramienta de preparación.',
  },
  {
    name: 'Diego Torres',
    flag: '🇵🇪', country: 'Perú',
    result: 'Practica nivel A2 ⭐',
    text: 'La corrección automática e instantánea hace toda la diferencia. No imaginaba que aprender francés podía ser tan eficiente desde el teléfono.',
  },
  {
    name: 'Valentina López',
    flag: '🇦🇷', country: 'Argentina',
    result: 'Practica nivel B2 ⭐',
    text: 'El temario del TEF Canadá me dio exactamente lo que necesitaba — sin perder tiempo con material irrelevante para mi preparación.',
  },
  {
    name: 'Roberto Sánchez',
    flag: '🇨🇱', country: 'Chile',
    result: 'Preparación completa ✅',
    text: 'Pago único sin suscripciones: la mejor inversión para mi preparación. Llegué al examen sintiéndome confiado gracias a la práctica constante.',
  },
];

let _carouselIdx   = 0;
let _carouselTimer = null;

export function initTestimonialCarousel() {
  const wrap  = document.getElementById('testimonialTrack');
  const dotsW = document.getElementById('testimonialDots');
  if (!wrap || !dotsW) return;

  /* Render cards */
  wrap.innerHTML = TESTIMONIALS.map((t, i) => `
    <div class="tcard" data-idx="${i}" aria-hidden="${i !== 0}">
      <div class="tcard-stars">★★★★★</div>
      <p class="tcard-text">"${t.text}"</p>
      <div class="tcard-foot">
        <div class="tcard-avatar">${t.flag}</div>
        <div class="tcard-info">
          <span class="tcard-name">${t.name}</span>
          <span class="tcard-meta">${t.country} · ${t.result}</span>
        </div>
      </div>
    </div>
  `).join('');

  /* Render dots */
  dotsW.innerHTML = TESTIMONIALS.map((_, i) => `
    <button class="tdot${i === 0 ? ' active' : ''}" data-idx="${i}" aria-label="Testimonio ${i + 1}"></button>
  `).join('');

  dotsW.querySelectorAll('.tdot').forEach(btn => {
    btn.addEventListener('click', () => goTo(+btn.dataset.idx, true));
  });

  const prev = document.getElementById('tcaPrev');
  const next = document.getElementById('tcaNext');
  if (prev) prev.addEventListener('click', () => goTo((_carouselIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length, true));
  if (next) next.addEventListener('click', () => goTo((_carouselIdx + 1) % TESTIMONIALS.length, true));

  goTo(0, false);
  startAuto();
}

function goTo(idx, resetTimer) {
  const cards = document.querySelectorAll('.tcard');
  const dots  = document.querySelectorAll('.tdot');
  if (!cards.length) return;

  cards.forEach((c, i) => {
    c.classList.toggle('active', i === idx);
    c.setAttribute('aria-hidden', i !== idx);
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
  _carouselIdx = idx;

  if (resetTimer) {
    clearInterval(_carouselTimer);
    startAuto();
  }
}

function startAuto() {
  _carouselTimer = setInterval(() => {
    goTo((_carouselIdx + 1) % TESTIMONIALS.length, false);
  }, 5000);
}

/* Exponer para llamarlo desde navigation.js cuando se muestre la landing */
export function stopCarouselAuto() {
  clearInterval(_carouselTimer);
}
