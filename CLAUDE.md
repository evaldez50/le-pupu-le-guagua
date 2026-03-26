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
