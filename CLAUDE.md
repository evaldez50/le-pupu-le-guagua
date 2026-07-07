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

## Regla de propagación entre proyectos

Cuando se agregue una mejora al PROJECT.md de este proyecto que pueda beneficiar a otros proyectos (nueva sección, mejor formato, nueva convención), se debe:

1. Documentar la mejora en el Changelog de este proyecto
2. Agregar una nota en la sección de Changelog indicando que es una mejora propagable
3. El Project Monitor Dashboard detectará automáticamente las diferencias de estructura entre proyectos y mostrará alertas de "Falta: [sección]" para los proyectos que no tengan las secciones estándar

### Secciones estándar que todo PROJECT.md debe tener:
- **Nombre y descripción** (H1 + párrafo)
- **Versión actual** (`Versión: X.Y.Z`)
- **Stack tecnológico**
- **Variables de entorno** (tabla clasificada)
- **Estructura de archivos**
- **Status actual**
- **Roadmap** (sprints ejecutados y planificados)
- **Bugs conocidos** (tabla con severidad y status)
- **Changelog** (historial de cambios por versión)
- **Siguientes pasos recomendados**
- **Notas para Claude Code**

