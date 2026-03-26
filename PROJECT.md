# Le Pupu Le Guagua — Aprende Francés

Aplicación web para aprender francés desde español. Incluye ejercicios interactivos por niveles (A1–C2), conjugador de verbos, práctica con audio (text-to-speech), sistema de progreso, y modelo freemium con pagos via Stripe y autenticación con Google OAuth via Supabase.

## Stack tecnológico

- **Frontend:** HTML + CSS + JavaScript vanilla (single-file `index.html`, ~10k líneas)
- **Auth:** Supabase Auth con Google OAuth
- **Base de datos:** Supabase (PostgreSQL) — tablas `user_profiles` y `pending_activations`
- **Pagos:** Stripe Checkout (payment links)
- **Backend:** Supabase Edge Function (Deno/TypeScript) para webhook de Stripe
- **Deploy:** GitHub Pages via GitHub Actions (main → prod, dev → QA)
- **Audio:** Web Speech API (SpeechSynthesis) para pronunciación

## Variables de entorno

### Frontend (públicas, en index.html)
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

### GitHub Actions (secrets del repo)
| Variable | Descripción |
|---|---|
| `QA_DEPLOY_TOKEN` | Personal access token para deploy al repo QA |

Ver `.env.example` para las variables secretas.

## Estructura de archivos

```
le-pupu-le-guagua/
├── index.html                              # App completa (HTML + CSS + JS + datos)
├── .github/workflows/deploy.yml            # CI/CD: deploy a GitHub Pages (prod + QA)
├── supabase/
│   ├── config.toml                         # Config del proyecto Supabase
│   └── functions/stripe-webhook/index.ts   # Edge function para webhook de Stripe
├── .claude/launch.json                     # Config de launch para dev local
├── .env.example                            # Template de variables secretas
├── PROJECT.md                              # Este archivo
└── CLAUDE.md                               # Instrucciones para Claude Code
```

## Qué hace cada archivo

### index.html
App completa en un solo archivo (~10,000 líneas):
- **CSS** (~600 líneas): diseño responsive, sistema de pantallas, colores por nivel (A1 verde, A2 azul, B1 amarillo, etc.)
- **Auth** (~600 líneas): Google OAuth con Supabase, flujo freemium con 3 escenarios (usuario nuevo, pago anónimo, cuenta existente), activación de pagos pendientes
- **Pantallas**: home, levels, skills, test, results, history, temario, practice, conjugador
- **Motor de ejercicios**: preguntas de opción múltiple, escucha (TTS), traducción, conjugación
- **Conjugador de verbos**: todos los tiempos verbales del francés con frases de ejemplo
- **Datos**: vocabulario, frases, verbos conjugados — todo embebido como objetos JS
- **Progreso**: guardado en localStorage, sincronizado con Supabase para usuarios logueados

### supabase/functions/stripe-webhook/index.ts
Edge function que recibe webhooks de Stripe (`checkout.session.completed`):
- **Caso A**: usuario logueado al pagar → actualiza `has_paid = true` en `user_profiles`
- **Caso B**: pago anónimo con checkout ID → guarda en `pending_activations`
- **Caso C**: sin reference ID → guarda por email en `pending_activations`
- Verifica firma HMAC-SHA256 del webhook

### .github/workflows/deploy.yml
GitHub Actions con 2 jobs:
- **main** → deploy a GitHub Pages (producción)
- **dev** → deploy a repo `le-pupu-qa` (QA)

## Cómo correr el proyecto

```bash
# Dev local — servir el HTML estático
npx serve -l 3000 .

# Abrir en navegador
# http://localhost:3000

# Deploy de edge function
supabase functions deploy stripe-webhook
```

## Status actual

- App funcional y en producción via GitHub Pages
- Niveles A1 y A2 con contenido completo
- Conjugador de verbos completo (todos los tiempos)
- Modelo freemium: contenido gratis limitado, premium via Stripe
- Auth con Google OAuth + Supabase
- CI/CD con GitHub Actions (main → prod, dev → QA)
- Todo el frontend está en un solo archivo HTML de 1.8MB

## Notas para Claude Code

- `index.html` es un archivo monolítico de ~10k líneas — no intentar leerlo completo, buscar secciones específicas
- Las credenciales del frontend (SUPABASE_KEY, STRIPE_PAYMENT_LINK) son públicas por diseño
- Hay 2 ambientes: PROD (main branch, proyecto `zyrmayxpstuplwxtkitu`) y QA (dev branch, proyecto `ruasctrwyktlumtiyuzo`)
- Los datos de vocabulario y conjugaciones están embebidos en el HTML como objetos JS
- El flujo de pagos tiene 3 caminos: usuario logueado, pago anónimo, y cuenta existente
- Nunca commitear service role keys, webhook secrets, ni tokens de deploy
