# Plan: llevar VALME Search OS (GEO · SEO · AEO) a Valme

Origen: rama `GEO-SEO-AEO` (proyecto Search OS, Vite + TanStack + Supabase, 207 commits).
Destino: esta app (Next.js 16, área `src/app/(os)` y `src/os/`), con su look and feel.
Rama de trabajo: `port/geo-seo-aeo`, en local hasta que se decida subir.

> **Alcance acordado (30 sep 2026):** solo funcionalidad y pantallas. Usuarios, base de datos y
> permisos los decide el CTO, así que **F0, F1 y F6 quedan fuera**: el módulo usa los usuarios y
> roles actuales de Valme y guarda en memoria (con copia en `.valme-data/seo.json` en local).
>
> **Hecho:** F2 (herramientas en `src/os/seo/`), F3 (pantallas en `/app/c/[client]/seo`), F5
> (agente HTTP) y F8 (revisión de VALME), más la parte de F4 que conecta el motor existente.
> **F7 hecho (30 sep 2026):** todas las secciones de Search OS dentro del módulo, como funcionalidad
> real sobre los datos (no demo): Centro de mando, Onboarding (8 pasos, requisitos, excepciones,
> vista del cliente, activación que da de alta al cliente en Valme), Clientes (ficha con 12 pestañas),
> Diagnóstico (encargo, evidencia por hallazgo, bloqueos por acceso, calidad), Plan de trabajo
> versionado con decisión del PM, Agentes, Supervisión, Operaciones, Informes (aprobar contenido y
> autorizar envío) y Configuración. Código en `src/os/seo/operacion/`.
>
> **Estructura (30 sep 2026):** SEO · GEO · AEO es un **módulo** propio, elegido en el selector de
> módulos de la barra lateral (`src/os/ui/modulos.ts`: añadir un módulo es una línea). Vive en
> `/app/seo` con filtro de cliente y menú propio: Panel, Auditorías, Plan y tareas, Visibilidad IA
> (GEO), Herramientas y Proyectos. F4 hecho: nuevas reglas de Search OS en `03-seo.ts` y
> herramienta `geo` en el motor.

---

## 0. Decisiones de partida

| # | Decisión | Por qué |
| --- | --- | --- |
| D1 | **Persistencia en Supabase (Postgres + Auth)**, detrás de una interfaz de repositorio con dos implementaciones: `memoria` (por defecto, datos de ejemplo, como hoy) y `supabase` (si hay variables de entorno). | Es lo previsto en `spec-mvp-end-to-end.md` §0.1 y `plan-area-admin.md` Sprint 1. La app sigue arrancando sin base de datos. Las migraciones se entregan listas y el CTO decide cuándo aplicarlas (`roadmap.md`: la base de datos es suya). |
| D2 | **Sin `tenants`.** Valme es una sola agencia: los permisos van por `memberships(user_id, client_id, role)`. | Search OS usaba tenants porque nació multi-agencia. Aquí sobra. |
| D3 | **Roles:** `super_admin → admin`, `project_manager → strategist`, `equipo → operator`. El rol `cliente` no se porta. | `roadmap.md`: «el cliente no entra en la aplicación». «PM» en Search OS = admin o strategist en Valme. |
| D4 | **Un solo motor de auditoría.** Las comprobaciones de `engine.server.ts` pasan a colectores y reglas de `src/os/audit` (03-seo + nueva herramienta `geo`). | No duplicar lo que ya existe; la herramienta SEO de Valme está «en desarrollo». |
| D5 | **Solo primitivas de Valme** (`src/os/ui`). Fuera el iframe, el puente `postMessage`, el CSS `v-*` y el `localStorage`. | Look and feel de Valme. |
| D6 | **Todo es una herramienta.** Cada operación es una función en `src/os/seo/` (una entrada, una salida), llamada desde server actions y, más adelante, desde el asistente o MCP. | Principio de `roadmap.md`. |
| D7 | **SEO vive en la ficha del cliente:** `/app/c/[client]/seo`. La auditoría rápida de prospectos sigue en `/app/dx/tools/seo`. | Respeta la separación Diagnóstico / Cuentas de `plan-diagnostico-y-cuentas.md`. |

---

## 1. Equivalencias

| Search OS | Valme |
| --- | --- |
| `clients` + `tenant_id` | `clients` (slug) de Valme |
| `projects` (dominio por cliente) | `seo_proyectos` |
| `seo_audits` + máquina de 10 estados | `seo_auditorias` + `src/os/seo/estados.ts` |
| `seo_audit_evidence` | `seo_evidencias` (guarda las `Señal` del motor) |
| `seo_audit_findings` + decisión del PM | `seo_hallazgos` (guarda los `Hallazgo` del motor + decisión) |
| `seo_finding_evidence` | `seo_hallazgo_evidencia` |
| `seo_service_coverage` | `seo_cobertura` (real, no marcador) |
| `seo_audit_state_events` | `seo_eventos` (alimenta la pestaña Historial) |
| `seo_finding_actions` | `seo_tareas` |
| `user_access` + `user_client_access` | `memberships` + `members` (sustituye `members.ts`) |
| `activity_events` | `actividad` |
| Server functions + `public-errors.ts` | Server actions + `src/os/seo/errores.ts` |

---

## 2. Fases

Cada fase termina con `npm run check` en verde y un commit. Las pantallas se prueban en el navegador.

### F0 · Base de datos y sesión

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`. Cliente en `src/os/db/` (servidor, con la sesión del usuario; y service role solo en scripts).
- `.env.example` con los nombres: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (solo scripts).
- `session.ts` / `dal.ts` / `actions.ts`: Supabase Auth con la misma API (`getSession`, `requireSession`, `requireMember`). Sin variables → login actual.
- `members.ts` → lectura de `members` + `memberships`; `forClient()` igual que hoy.
- **Hecho cuando:** login y `/app` funcionan en los dos modos; `proxy.ts` sin cambios de contrato.

### F1 · Modelo y seguridad

- `supabase/migrations/0001_equipo.sql`: `members`, `memberships`, `actividad`, helpers `es_admin()`, `rol_en_cliente(client)`, `puede_leer_cliente`, `puede_decidir(client)` (admin o strategist).
- `supabase/migrations/0002_seo.sql`: port de 0005-0008 sin tenants:
  - tablas de la sección 1, enums de estado, prioridad, confianza, cobertura, decisión y tarea;
  - trigger de la máquina de estados (nace en borrador, autorización firmada con referencia, motivos obligatorios en bloqueado/devuelto/cancelado, alcance editable solo en borrador/devuelto, validado/cancelado dejan todo en solo lectura);
  - archivado firmado y sin cambios combinados; cliente archivado no admite trabajo nuevo;
  - decisión del hallazgo solo por admin/strategist, firmada por la base de datos; descartar exige nota (constraint válida);
  - tareas: responsable admin/strategist activo, nacen pendientes, cierre firmado, cerradas inmutables, conclusión obligatoria;
  - RLS por `memberships`; sin DELETE; `anon` sin privilegios.
- `scripts/seo/verificar-rls.sql`: los 15 escenarios de Search OS adaptados (aislamiento entre clientes en lugar de tenants).
- `src/os/seo/estados.ts` (máquina de estados pura) + tests.
- **Hecho cuando:** las migraciones aplican en un Supabase vacío y el verificador da 15/15.

### F2 · Capa de herramientas `src/os/seo/`

- `tipos.ts`, `esquemas.ts` (zod), `errores.ts` (mensajes públicos), `repo/` (`memoria` + `supabase`, misma interfaz).
- Herramientas: `crearProyecto`, `crearAuditoria`, `cambiarEstado`, `archivar` / `restaurar`, `importarRevision`, `decidirHallazgo`, `crearTarea`, `actualizarTarea`, `ejecutarAuditoria`, `resumenCliente` (próximas acciones).
- Reglas de gobierno en servidor (hoy no se aplican en Search OS): no se entra en control de calidad ni se valida sin cobertura justificada por servicio.
- Alta de cliente + proyecto en una sola transacción (RPC).
- Tests: port de `remote-repository` (22), `seo-audit` (12) y `pilot` (6) a `src/os/seo/__tests__/`.
- **Hecho cuando:** los tests pasan contra el repo en memoria.

### F3 · Pantallas por cliente

- Ruta `src/app/(os)/app/c/[client]/seo/`:
  - `page.tsx`: proyectos, auditorías (filtros por estado, archivadas), **Próximas acciones**.
  - `nueva/`: formulario de auditoría (proyecto, servicios, alcance, límites).
  - `[auditoria]/page.tsx`: cabecera con la pista de estados y la siguiente decisión; pestañas Resumen, Alcance, Evidencias, Hallazgos, Cobertura, Historial (`?tab=`).
  - Hallazgo: decisión del PM + bloque Seguimiento (crear tarea, empezar, cerrar con conclusión y resultado, cancelar).
- Entrada «SEO» en `clientNav()` con icono en `Nav.tsx`.
- Server actions con `useActionState`, confirmaciones con `ActionButton`, `refresh()` tras cada cambio; cada página y acción llama a `forClient()`.
- **Hecho cuando:** el flujo completo (auditoría → autorizar → ejecutar → hallazgos → decisión → tarea → cierre) funciona en el navegador en escritorio y móvil.

### F4 · Motor SEO / GEO / AEO

- Colectores y reglas nuevos en `src/os/audit` a partir de `engine.server.ts`: HSTS, meta robots e indexabilidad, jerarquía de encabezados, `alt` en imágenes, bots de IA en `robots.txt`, JSON-LD por tipo, PageSpeed por dispositivo.
- Reglas para señales que `crawl.ts` ya emite y nadie consume: títulos duplicados o vacíos, descripciones vacías, páginas sin H1 o con varios.
- Herramienta nueva `geo` (`collect/tools/geo.ts`): preguntas de categoría y embudo a varios modelos vía `runJob`, registro de presencia, posición y qué se dice (método de `plan-auditoria-comercial.md` §03). Registrada en `HERRAMIENTAS`.
- `fetch` seguro compartido (`src/os/audit/net/`): DNS a IPv4 pública fijada, sin redirecciones a hosts privados, límites de tiempo y tamaño. Corrige el SSRF de `/api/audit-run`.
- `ejecutarAuditoria` guarda señales como evidencias, hallazgos como hallazgos y la cobertura por servicio.
- `runJob` acepta auditorías sin `clientId` (prospectos).

### F5 · Agente de investigación

- Port de `agent-run` + `agent-probe`, generalizado al dominio del proyecto (no solo valmesolutions.com), con los mismos límites.
- Una tarea de investigación puede lanzar el agente; la evidencia queda enlazada al hallazgo en una transacción (RPC), con reintento seguro.

### F6 · Equipo y accesos

- `/app/admin` (solo admin): invitar, cambiar rol, dar o quitar clientes, desactivar (cierra sesiones), registro de actividad. Port de `/admin` de Search OS.

### F7 · El resto de Search OS (hoy demo, pasa a real)

| Search OS | Valme | Encaje en `roadmap.md` |
| --- | --- | --- |
| Onboarding de cliente A-H, requisitos y excepciones | `/app/c/[client]/onboarding` | Fase 2 (convertir lead en cliente) |
| Diagnóstico con QA y plan versionado (aprobar, pedir cambios, rechazar) | `/app/c/[client]/plan` sobre `seo_tareas` con semana y criterio de hecho | Fase 3 (plan a 90 días) |
| Supervisión (cola de decisiones pendientes) | `/app/supervision` | Fase 3 |
| Agentes (8 especialidades, carga) | Catálogo ligado a `HERRAMIENTAS` | Fase 3 |
| Informes (aprobar contenido, autorizar envío) | `/app/c/[client]/informes` | Fase 4 |
| Centro de mando | Portada de `/app` | Fase 4 |
| Tools MCP de solo lectura | Registro de herramientas / MCP | Asistente |

### F8 · Datos reales de VALME

- `src/os/seo/piloto/`: revisión externa de valmesolutions.com (5 hallazgos, 8 evidencias) importable con `importarRevision`.
- Script para migrar desde el staging de Search OS la auditoría real, sus decisiones y sus 5 tareas.

---

## 3. Qué no se porta

Integración con Lovable, iframe y `srcdoc`, CSS `v-*`, demo en `localStorage`, tablas heredadas sin uso (`approvals`, `decisions`, `activity`, `tasks`, `user_roles`), los 84 clientes de ejemplo, `tenants`, rol `cliente` y scripts de staging propios de Lovable (se sustituyen por Supabase CLI).

## 4. Fallos de Search OS que se corrigen en el camino

SSRF de `/api/audit-run` · reglas de gobierno no aplicadas en servidor · cobertura e historial de relleno · alta de cliente no atómica · responsable de tarea limitado a uno mismo · escrituras del agente no transaccionales · constraint de descarte `NOT VALID`.

## 5. Ejecución

- Orden: F0 → F1 → F2 → F3 → F4 → F5 → F8 → F6 → F7. F0-F5 + F8 es el núcleo usable.
- Un commit por fase en `port/geo-seo-aeo`; `npm run check` y prueba en navegador al cerrar cada una.
- Nada se sube a `origin` sin pedirlo.
