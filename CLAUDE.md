# Instrucciones para Claude Code

## Al iniciar cada sesión

1. Leer `PROJECT.md` para entender el estado actual del proyecto
2. Si haces cambios significativos, actualizar `PROJECT.md` (estructura, status, notas)

## Reglas

- `index.html` es enorme (~10k líneas) — buscar secciones con Grep, no leer completo
- Las keys del frontend (SUPABASE_KEY, STRIPE_PAYMENT_LINK) son públicas, no moverlas a .env
- Nunca commitear service role keys, webhook secrets, ni tokens
- Hay 2 ambientes: PROD (main) y QA (dev) — verificar en qué rama estás antes de cambiar credenciales
- Mantener PROJECT.md actualizado como fuente de verdad del proyecto
