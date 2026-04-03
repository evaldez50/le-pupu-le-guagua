# Instrucciones para Claude Code

## Al iniciar cada sesión

1. Leer `PROJECT.md` para entender el estado actual del proyecto
2. Si haces cambios significativos, actualizar `PROJECT.md` (estructura, status, notas)

## Reglas

- Proyecto modularizado con Vite — correr `npm run build` para verificar cambios
- Las keys del frontend (SUPABASE_KEY, STRIPE_PAYMENT_LINK) son públicas, viven en src/config.js
- Nunca commitear service role keys, webhook secrets, ni tokens
- Hay 2 ambientes: PROD (main) y QA (dev) — verificar en qué rama estás antes de cambiar credenciales
- Los onclick del HTML llaman funciones via window.* — exponer nuevas funciones en src/main.js
- Mantener PROJECT.md actualizado como fuente de verdad del proyecto

## Ambientes y ramas

- **PROD**: rama `main` → despliega a `evaldez50.github.io/le-pupu-le-guagua/` (Supabase: zyrmayxpstuplwxtkitu)
- **QA**: rama `dev` → despliega a `evaldez50.github.io/le-pupu-qa/` (Supabase: ruasctrwyktlumtiyuzo)
- El repo `le-pupu-qa` es solo un contenedor de archivos estáticos para GitHub Pages — NO tiene código fuente
- Todo el código se maneja desde este repo (`le-pupu-le-guagua`)
- `main` todavía tiene un HTML monolítico de ~10,000 líneas (pendiente de migrar desde dev)
- `dev` tiene la versión modularizada con Vite (la versión actual y correcta)
- Flujo: feature branch → dev (QA) → validar → main (PROD)

## Credenciales por ambiente

| | QA (dev) | PROD (main) |
|---|---|---|
| Supabase | ruasctrwyktlumtiyuzo | zyrmayxpstuplwxtkitu |
| Stripe | test link (no cobra) | live link |
| Config | src/config.js en rama dev | src/config.js en rama main |

**Al mergear dev → main**: cambiar config.js a credenciales PROD y Stripe live link.

## Reglas de deploy y branches

- NO crear ramas innecesarias — trabajar en dev directamente para cambios menores
- Para features grandes: crear feature branch desde dev → PR a dev → borrar branch
- NO pushear directo a main sin validar en QA primero
- Después de merge, borrar branches obsoletas y correr `git remote prune origin`
- El deploy es automático via GitHub Actions al pushear a dev o main

## Precauciones

- NO reemplazar secciones enteras del HTML sin verificar que no se pierden funcionalidades existentes
- Verificar visualmente los cambios en QA antes de dar por bueno
- El cache de GitHub Pages puede tardar ~2-5 minutos en actualizarse
- Si el usuario reporta que no ve cambios, verificar que el deploy de GitHub Actions completó exitosamente
- Hacer UN commit consolidado cuando sea posible, no múltiples commits incrementales que generen inconsistencias

## Contacto del proyecto

- Email: info@sci-mexico.net
- Precio actual: $19.99 USD (pago único), precio regular: $39.99 USD
