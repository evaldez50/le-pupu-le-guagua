# Le Pupu Le Guagua — Aprende Francés

Aplicación web para aprender francés desde español. Incluye ejercicios interactivos por niveles (A1–C2), conjugador de verbos, práctica con audio (text-to-speech), sistema de progreso, y modelo freemium con pagos via Stripe y autenticación con Google OAuth via Supabase.

## Stack tecnológico

- **Frontend:** Vanilla JS modularizado con Vite como bundler
- **Auth:** Supabase Auth con Google OAuth (@supabase/supabase-js via npm)
- **Base de datos:** Supabase (PostgreSQL) — tablas `user_profiles` y `pending_activations`
- **Pagos:** Stripe Checkout (payment links)
- **Backend:** Supabase Edge Function (Deno/TypeScript) para webhook de Stripe
- **Deploy:** GitHub Pages via GitHub Actions (main → prod, dev → QA) con build step
- **Audio:** Web Speech API (SpeechSynthesis) para pronunciación
- **Build:** Vite 5 — bundle de 260KB (70KB gzip)

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
├── index.html                              # HTML slim: pantallas y modals
├── package.json                            # Dependencias: vite, @supabase/supabase-js
├── vite.config.js                          # Config Vite
├── src/
│   ├── main.js                             # Entry point: imports + window bindings + init
│   ├── config.js                           # Constantes Supabase/Stripe
│   ├── supabase.js                         # Cliente Supabase
│   ├── state.js                            # Estado global (state, TEST, appUser)
│   ├── auth.js                             # Google OAuth, sesiones, renderAuthUI
│   ├── payment.js                          # Stripe checkout, paywall, modals
│   ├── navigation.js                       # showScreen, selectLevel, selectSkill
│   ├── timer.js                            # Timer de exámenes
│   ├── utils.js                            # shuffleArray, showToast, speakFrench, etc.
│   ├── data/
│   │   ├── levels.js                       # LEVELS y SKILLS
│   │   ├── questions.js                    # Banco de preguntas (~900 líneas)
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
│   │   ├── temario.js                      # Pantalla de temario
│   │   ├── practice.js                     # Modo práctica
│   │   └── conjugador.js                   # Conjugador de verbos
│   └── styles/
│       ├── index.css                       # Barrel: importa todos los CSS
│       ├── variables.css                   # Variables CSS, reset, utilidades
│       ├── layout.css                      # Topbar, auth UI, profile menu
│       ├── home.css                        # Pantalla home
│       ├── levels.css                      # Pantalla de niveles
│       ├── skills.css                      # Pantalla de habilidades
│       ├── test.css                        # Pantalla de examen
│       ├── results.css                     # Pantalla de resultados
│       ├── ee-eo.css                       # Expression Écrite/Orale
│       ├── history.css                     # Historial
│       ├── temario.css                     # Temario y práctica
│       └── conjugador.css                  # Conjugador
├── .github/workflows/deploy.yml            # CI/CD con build step
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

- App funcional con Vite como bundler
- Modularizada: ~33 archivos JS/CSS separados desde un HTML monolítico
- Build de producción: 260KB JS + 18KB HTML (70KB gzip)
- 9 pantallas: home, levels, skills, test, results, history, temario, practice, conjugador
- Niveles A1–C2 con contenido completo
- 4 habilidades TEF: CE, CO, EE, EO
- Conjugador de verbos completo
- Modelo freemium con Stripe + Google OAuth
- CI/CD con GitHub Actions (main → prod, dev → QA)
- 2 ambientes: PROD (zyrmayxpstuplwxtkitu) y QA (ruasctrwyktlumtiyuzo)

## Notas para Claude Code

- Los módulos JS usan `window.*` para exponer funciones a los onclick del HTML
- Las credenciales del frontend son públicas por diseño (anon key + payment link)
- Los datos están en `src/data/` — temario.js y verbs.js son los más grandes (~5500 líneas juntos)
- Circular deps entre auth.js y payment.js se resuelven con late binding via window
- Hay 2 ambientes: PROD (main) y QA (dev) — verificar rama antes de cambiar credenciales
- Nunca commitear service role keys, webhook secrets, ni tokens de deploy
- El build genera `dist/` — el deploy usa `dist/`, no la raíz
