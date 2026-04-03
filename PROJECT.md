# Le Pupu Le Guagua — Aprende Francés

Aplicación web para aprender francés desde español. Incluye ejercicios interactivos por niveles (A1–C2), conjugador de verbos, práctica con audio (text-to-speech), sistema de progreso, y modelo freemium con pagos via Stripe y autenticación con Google OAuth via Supabase.

## Stack tecnológico

- **Frontend:** Vanilla JS modularizado con Vite como bundler
- **Auth:** Supabase Auth con Google OAuth (@supabase/supabase-js via npm)
- **Base de datos:** Supabase (PostgreSQL) — tablas `user_profiles` y `pending_activations`
- **Pagos:** Stripe Checkout (payment links) — $19.99 USD pago único
- **Backend:** Supabase Edge Function (Deno/TypeScript) para webhook de Stripe
- **Deploy:** GitHub Pages via GitHub Actions (main → prod, dev → QA) con build step
- **Audio:** Web Speech API (SpeechSynthesis) para pronunciación
- **Build:** Vite 5

## Variables de entorno

### Frontend (en src/config.js)
| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase (publishable) |
| `SUPABASE_KEY` | Anon key de Supabase (publishable) |
| `STRIPE_PAYMENT_LINK` | Payment link de Stripe (público) |

### Edge Function (secretas, en Supabase)
| Variable | Descripción |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | Signing secret del webhook de Stripe |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (acceso admin a la DB) |

## Estructura de archivos

```
le-pupu-le-guagua/
├── index.html                              # HTML slim: pantallas, modals y modal legal
├── package.json                            # Dependencias: vite, @supabase/supabase-js
├── vite.config.js                          # Config Vite
├── src/
│   ├── main.js                             # Entry point: imports + window bindings + init
│   ├── config.js                           # Constantes Supabase/Stripe (varían por ambiente)
│   ├── supabase.js                         # Cliente Supabase
│   ├── state.js                            # Estado global (state, TEST, appUser)
│   ├── auth.js                             # Google OAuth, sesiones, renderAuthUI, canAccess*
│   ├── payment.js                          # Stripe checkout, paywall, modals ($19.99)
│   ├── navigation.js                       # showScreen, selectLevel, selectSkill
│   ├── landing.js                          # Contadores landing, carrusel testimonios
│   ├── timer.js                            # Timer de exámenes
│   ├── utils.js                            # shuffleArray, showToast, speakFrench, etc.
│   ├── data/
│   │   ├── levels.js                       # LEVELS y SKILLS
│   │   ├── questions.js                    # Banco de preguntas (24 combinaciones nivel+skill)
│   │   ├── tips.js                         # STUDY_TIPS
│   │   ├── temario.js                      # TEMARIO (~3700 líneas)
│   │   └── verbs.js                        # TENSES, VERB_GROUPS (~1870 líneas)
│   ├── test/
│   │   ├── engine.js                       # startTest, renderQuestion
│   │   ├── builders.js                     # Constructores de UI de preguntas
│   │   ├── handlers.js                     # Handlers de respuestas MC/TF/Match
│   │   ├── ee.js                           # Expression Écrite
│   │   ├── eo.js                           # Expression Orale
│   │   └── results.js                      # Feedback, resultados, retry
│   ├── screens/
│   │   ├── levels.js                       # Render de grids de niveles/skills
│   │   ├── history.js                      # Historial de resultados
│   │   ├── tips.js                         # Tips de estudio
│   │   ├── temario.js                      # Pantalla de temario (renderTemario expuesto en window)
│   │   ├── practice.js                     # Modo práctica
│   │   └── conjugador.js                   # Conjugador de verbos
│   └── styles/
│       ├── index.css                       # Barrel: importa todos los CSS
│       ├── variables.css                   # Variables CSS, reset, utilidades
│       ├── layout.css                      # Topbar, auth UI, profile menu
│       ├── home.css                        # Pantalla home
│       ├── landing.css                     # Landing page + FAQ + legal + footer
│       ├── levels.css                      # Pantalla de niveles
│       ├── skills.css                      # Pantalla de habilidades
│       ├── test.css                        # Pantalla de examen
│       ├── results.css                     # Pantalla de resultados
│       ├── ee-eo.css                       # Expression Écrite/Orale
│       ├── history.css                     # Historial
│       ├── temario.css                     # Temario y práctica
│       └── conjugador.css                  # Conjugador
├── .github/workflows/deploy.yml            # CI/CD con build step (dev→QA, main→PROD)
├── supabase/
│   ├── config.toml                         # Config del proyecto Supabase
│   └── functions/stripe-webhook/index.ts   # Edge function para webhook de Stripe
├── .env.example                            # Template de variables secretas
├── .gitignore                              # Exclusiones
├── PROJECT.md                              # Este archivo
└── CLAUDE.md                               # Instrucciones para Claude Code
```

## Cómo correr el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Dev server
npm run dev
# http://localhost:5173

# 3. Build para producción
npm run build

# 4. Preview del build
npm run preview
```

## Status actual

### QA (rama dev) — validado
- App modularizada con Vite, funcionando en https://evaldez50.github.io/le-pupu-qa/
- 10 pantallas: landing, home, levels, skills, test, results, history, temario, practice, conjugador
- Landing page completa con: hero, features, levels, how-it-works, conjugador, pricing, testimonios, FAQ (6 preguntas), CTA, footer
- Legal (T&C, privacidad, pagos, OAuth) en modal accesible desde footer
- Precio: $19.99 USD (lanzamiento) / $39.99 USD (regular)
- Stripe en modo TEST (no cobra dinero real)
- Supabase QA: ruasctrwyktlumtiyuzo
- Copy legal validado: sin promesas de certificación ni resultados garantizados
- Testimonios sin lenguaje de garantía

### PROD (rama main) — pendiente de migrar
- Todavía tiene el HTML monolítico (~10,000 líneas) sin modularizar
- Supabase PROD: zyrmayxpstuplwxtkitu
- Para migrar: mergear dev → main, cambiar config.js a credenciales PROD y Stripe live link

## Pendientes para migrar a PROD

1. Mergear `dev` → `main`
2. Cambiar `src/config.js` a credenciales PROD:
   - SUPABASE_URL: zyrmayxpstuplwxtkitu
   - SUPABASE_KEY: (la anon key de prod)
   - STRIPE_PAYMENT_LINK: https://buy.stripe.com/00wfZj9fYg7Y16obPldMI01
3. Verificar deploy en https://evaldez50.github.io/le-pupu-le-guagua/
4. Verificar flujo de pago con Stripe live

## Notas para Claude Code

- Los módulos JS usan `window.*` para exponer funciones a los onclick del HTML
- Si agregas una función que se llama desde onclick en HTML, DEBES exponerla en src/main.js con `window.nombreFuncion = nombreFuncion`
- Las credenciales del frontend son públicas por diseño (anon key + payment link)
- Los datos están en `src/data/` — temario.js y verbs.js son los más grandes (~5500 líneas juntos)
- Circular deps entre auth.js y payment.js se resuelven con late binding via window
- Nunca commitear service role keys, webhook secrets, ni tokens de deploy
- El build genera `dist/` — el deploy usa `dist/`, no la raíz
- El repo `le-pupu-qa` NO tiene código fuente — es solo destino de deploy para QA
- El cache de GitHub Pages tarda ~2-5 minutos en actualizarse tras un deploy
