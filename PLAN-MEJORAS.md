# Plan de Mejoras — le-pupu-le-guagua

> Fuente: Auditoría integral 2026-07-03 (`AUDITORIA-PROYECTOS-2026-07-03.md` en el directorio contenedor).
> **Calidad: 6.5/10 · Riesgo: 🔴 ALTO** (XSS + sin RLS).
> Uso: marca los checkboxes al completar. Prompts para sesiones de Claude Code en esta carpeta, rama `dev`.

## Estado según auditoría

- **XSS:** +20 usos de `innerHTML` con template literals (`src/timer.js:83`, `src/payment.js:70`, `src/test/engine.js:114`, `src/screens/temario.js:16,59,65`, `src/screens/conjugador.js:70,197`, entre otros).
- **Sin Row Level Security** en `user_profiles` y `pending_activations`: cualquiera con la anon key (pública por diseño) lee todos los perfiles.
- 21 `console.log` en código productivo (`src/auth.js:20`, `src/payment.js:1`...).
- Dependencia circular `auth.js ↔ payment.js` resuelta con `window.*` late binding (frágil, intesteable).
- 0 tests; dependencias sin fijar (`@supabase/supabase-js: "^2"`, `vite: "^5"`).
- Anon key de QA hardcodeada en `src/config.js` de la rama main (riesgo: PROD apuntando al Supabase de QA).
- `temario.js` 3,717 líneas y `verbs.js` 1,873 (datos + render mezclados); solo 2 media queries (poco responsive <768px).
- Repo hermano `le-pupu-qa` como target de deploy = antipatrón a consolidar.

## Fase 1 — Seguridad (P0) 🔴

- [ ] Sanitizar/refactorizar todos los `innerHTML` con datos dinámicos
- [ ] Habilitar RLS en `user_profiles` y `pending_activations` (QA primero, luego PROD)

**Prompt:**
```
Lee PLAN-MEJORAS.md y ejecuta la Fase 1 en rama dev:
1. XSS: audita TODOS los usos de element.innerHTML del proyecto (la auditoría encontró +20: timer.js:83, payment.js:70, test/engine.js:114, screens/temario.js, screens/conjugador.js...). Refactoriza: textContent/createElement donde sea posible; donde se necesite HTML, un helper de escape con tests. Sin cambiar el comportamiento visual. Usa como referencia el patrón esc() de mi proyecto RADEC-Monitor-SnOP-E.
2. RLS: escribe las migraciones SQL con políticas para user_profiles y pending_activations: cada usuario solo lee/actualiza su propia fila (auth.uid() = user_id); pending_activations solo accesible por service_role. Dame los pasos numerados para aplicarlas en el dashboard de Supabase QA primero y luego PROD.
Muéstrame el plan antes de tocar código.
```

## Fase 2 — Calidad y configuración (P1)

- [ ] Logger condicionado (`localStorage.debug`) en lugar de los 21 console.log
- [ ] Fijar versiones en package.json
- [ ] Tests con Vitest para auth, payment y webhook Stripe
- [ ] Config por ambiente: main→PROD, dev→QA (vía GitHub Actions)

**Prompt:**
```
Lee PLAN-MEJORAS.md, Fase 2, en rama dev:
1. Reemplaza los 21 console.log productivos por un módulo logger.js que solo loguee si localStorage.debug === 'true'.
2. Fija versiones exactas en package.json (quita los ^).
3. Agrega Vitest y tests para auth.js, payment.js y la Edge Function stripe-webhook: flujos de activación de cuenta y verificación de firma Stripe.
4. La rama main tiene la anon key de QA en src/config.js: propón un mecanismo para que el build de main use config PROD y el de dev use QA (config inyectada por GitHub Actions con variables por ambiente).
```

## Fase 3 — Arquitectura y modularización

- [ ] Romper dependencia circular auth↔payment con `session.js` (eventos)
- [ ] Separar datos de render: `temario.js` → `src/data/temario/*.json` + screen <300 líneas
- [ ] Mismo tratamiento para `verbs.js`

**Prompt:**
```
Lee PLAN-MEJORAS.md, Fase 3. Método obligatorio: tests de caracterización primero, extraer un módulo a la vez sin cambiar lógica, un commit por extracción.
1. Crea src/session.js: mantiene el estado del usuario y emite eventos (sessionChanged). Refactoriza auth.js y payment.js para depender de session.js y elimina los bindings window.*.
2. Extrae el contenido de temario.js (3,717 líneas) a archivos de datos por nivel (src/data/temario/a1.json, a2.json...) cargados con fetch bajo demanda; el screen queda solo con render (<300 líneas). Igual con verbs.js.
Muéstrame el orden de extracción antes de empezar.
```

## Fase 4 — UX responsive y consolidación de ambientes

- [ ] Sprint responsive: auditar cada pantalla a 375px y 768px
- [ ] Consolidar le-pupu-qa dentro de este repo (eliminar repo separado con bundle previo)

**Prompt (responsive):**
```
Audita el responsive de todas las pantallas a 375px y 768px: lista los quiebres (hoy solo hay 2 media queries en todo el CSS) y corrígelos con enfoque mobile-first: grid/flex fluido, targets táctiles ≥44px, tipografía escalable. Esta app se usa naturalmente en celular.
```

**Prompt (ambientes):**
```
Hoy le-pupu-qa es un repo separado que recibe deploys por Actions (antipatrón). Analiza .github/workflows y propón el plan para: (a) servir QA desde este mismo repo (rama gh-pages-qa o segundo Pages environment), (b) eliminar el repo le-pupu-qa con bundle de respaldo previo, (c) documentar en PROJECT.md el flujo dev→QA→PROD con rollback. Solo el plan; no ejecutes nada.
```

## Orden y estimación

| Fase | Esfuerzo | Notas |
|------|----------|-------|
| 1 — XSS + RLS | 1-2 sesiones | Antes que todo |
| 2 — Calidad | 1-2 sesiones | Tests habilitan la Fase 3 |
| 3 — Modularización | 2 sesiones | Método incremental |
| 4 — Responsive + ambientes | 1-2 sesiones | Puede ir en paralelo con 3 |
