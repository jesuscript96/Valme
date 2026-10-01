# Plan — Backend de agentes de Valme (v0)

> **Qué es este documento.** El mapa ordenado de qué vamos a construir, qué es cada
> pieza, quién hace qué y en qué orden. Pensado para no depender de ningún chat: si te
> pierdes, vuelve aquí.
>
> Fecha: 2026-10-01 · Estado: decisiones cerradas, pendiente de arrancar el código.

---

## 1. Qué estamos construyendo (en una frase)

El **backend de Valme**: unos **agentes de IA** (como los de Claude) que navegan webs, las
auditan y generan cosas — viviendo en el **servidor Hetzner** de Edgecute, con memoria en
**Supabase**.

---

## 2. Las piezas (qué es cada una y para qué)

| Pieza | Qué es | Para qué |
|---|---|---|
| 🌐 **Web (front)** | La app Next que **ya existe** (landing + Valme OS) | No cambia lo que hace; solo se **mueve de carpeta** al pasar a monorepo. Sigue en Vercel. |
| ⚙️ **Worker (back)** | Un **programa que corre sin parar** en segundo plano | Es **el cerebro de los agentes**: coge una tarea → llama a Claude → Claude decide qué herramienta usar → el worker la ejecuta → repite. |
| 🧪 **Sandbox de navegador** | Un contenedor aislado con un Chrome | Lo usa el worker para "browser use" (navegar, clicar, rellenar). Aislado = seguridad. |
| 🗄️ **Supabase** | La base de datos / memoria | Tareas, resultados, datos por cliente. **Ya existe.** |
| 🚀 **Coolify** | **NO es código.** El panel que coge el código del repo y lo enciende como contenedores en Hetzner | El "dónde vive y cómo se arranca". |

**¿Por qué un worker y no la web?** Un agente tarda **minutos** (muchos pasos); una web se
corta en segundos. Por eso el back es un **proceso largo aparte**. Eso es el worker.

---

## 3. Qué va a escribir la sesión de código ("valme")

1. **Reorganizar a monorepo**: mover la web a `apps/web`, crear `apps/worker` (el back
   nuevo), `packages/os` (código común). ← *esto es "integrar carpetas back y front".*
   Gestor: **npm workspaces** (ya hay `package-lock.json`).
2. **Programar el worker**: conectar Supabase, la cola, el bucle de agente, y envolver las
   funciones que ya existen (`brandKit`, `copy`, `meta`, `higgsfield`, `firecrawl`,
   auditoría…) como **herramientas**.
3. **El Dockerfile** del worker (la receta para que Coolify lo construya).

---

## 4. Los DOS mundos (para no mezclarlos)

| 🟦 CÓDIGO (sesión **valme**, en el repo) | 🟩 INFRA (**Adrián + sesión BTT**, en **Coolify**) |
|---|---|
| Monorepo + worker + Dockerfile | Coger ese código y desplegarlo en Hetzner |
| Es *qué se programa* | Es *dónde vive y cómo se enciende* |

**El código va primero; Coolify despliega lo que el código produjo.**

---

## 5. El flujo ordenado (la ruta completa)

- **Fase 0 — Decisiones** ✅ *(ver §8)*
- **Paso 1 — Luz verde a valme** → reorganiza a monorepo + escribe el worker. *(CÓDIGO)*
- **Paso 2 — Push a GitHub** (Adrián, por HTTPS; es colaborador). *(2 min)*
- **Paso 3 — Jesús habilita el acceso de Coolify** al repo privado (GitHub App o deploy key).
- **Paso 4 — Coolify** (Adrián + sesión BTT): proyecto `Valme-backend` + recurso worker
  (`apps/worker/Dockerfile`) + secrets (Supabase/Claude) + límites → desplegar.
- **Paso 5 — Sandbox** de navegador como 2º recurso + prueba de humo.
- **Nota Vercel:** al migrar, apuntar su **Root Directory** a `apps/web` o el front deja de
  desplegarse.

---

## 6. Estado actual

Todo decidido. El único botón pendiente es el **Paso 1: luz verde a valme** para empezar el
código. Hasta eso, nada más se mueve.

---

## 7. Accesos / permisos (los dos, no confundir)

| | Para qué | Quién | Cómo |
|---|---|---|---|
| **(A) Push** | Que **valme suba** el código a GitHub | **Adrián** (ya es colaborador ✅) | **HTTPS** (login de navegador / token). **No hace falta SSH.** |
| **(B) Pull** | Que **Coolify baje** el código (repo **privado**) | **Jesús** (dueño del repo) | **GitHub App** de Coolify *(recomendado, da auto-deploy)* **o deploy key** que genera Coolify. |

> Las claves SSH locales de Adrián "no matchean" porque ninguna está dada de alta en su
> GitHub — pero para push por HTTPS no se necesitan.

---

## 8. Decisiones cerradas (log)

- **Stack:** seguir en **TypeScript / Node** (no se cambia de lenguaje). Repo ya es TS +
  Next 16.3 + Zod 4 + Playwright + `@anthropic-ai/sdk`.
- **Monorepo** (decisión de Jesús): `apps/web` + `apps/worker` + `packages/os`.
- **Datos:** Supabase `tvgtknxjaaughmqpspap` (org Valme, FREE, NANO, región Canadá).
  Vacía → crear esquema + migraciones. *(Ojo: latencia transatlántica con Hetzner; free se
  pausa tras ~1 semana de inactividad.)*
- **Ejecución:** worker de proceso largo + **cola sobre Postgres (pgmq)**. Sin Redis.
- **Orquestación:** bucle *tool-runner*, siempre envuelto en `runJob` (coste por cliente).
- **Capacidad v0:** **solo browser use**. Computer use **fuera de v0** (se diseña para
  añadirlo como contenedor aparte; si llega, iría a servidor/VM propio).
- **Tools v0:** `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`,
  `browser_screenshot`, `browser_extract`, `auditar_dominio`.
- **Despliegue:** **Opción C** — proyecto en el Coolify **existente** de Hetzner (no se
  levanta otro Coolify; dos no caben en una misma máquina). Con límites de recursos y
  aislado de BTT.
- **Repo:** `github.com/jesuscript96/Valme`, rama `main`, **privado**.
- La rama `GEO-SEO-AEO` es **otra app** y apunta a **otro** Supabase → se ignora en v0.

---

## 9. Datos de despliegue en Coolify (para el Paso 4)

- **Build pack:** Dockerfile.
- **Base Directory:** `/` (la raíz del repo; el build necesita los packages compartidos).
- **Dockerfile:** `apps/worker/Dockerfile`.
- **Arranque (previsto):** `node --import tsx apps/worker/src/main.ts`. Proceso largo, sin
  HTTP público. Si Coolify pide healthcheck → `GET /health` en `:8080` (env `PORT`).
- **Sandbox (2º recurso):** `apps/worker/sandbox/Dockerfile`, **solo red interna**, sin
  puertos públicos y **sin env de Supabase**. El worker lo localiza con `SANDBOX_URL`.
- **Playwright:** usar Chromium del sistema vía `CHROME_PATH` (no el de Lambda).

### Variables de entorno (nombres; los valores van como secrets en Coolify)

- **Nuevas (worker):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SANDBOX_URL`.
- **Ya usadas en el código:** `OS_LLM_API_KEY` (o `ANTHROPIC_API_KEY`), `OS_LLM_MODEL`,
  `OS_LLM_BASE_URL`, `PAGESPEED_API_KEY`, `META_ADLIB_TOKEN`, `META_API_VERSION`,
  `META_APP_ID`, `META_APP_SECRET`, `FIRECRAWL_API_KEY`, `HF_API_KEY_ID`,
  `HF_API_KEY_SECRET`, `RESEND_API_KEY`, `CHROME_PATH` (solo en el sandbox).
- **Web (Vercel):** `SUPABASE_URL` + `SUPABASE_ANON_KEY` (y mantener `OS_SESSION_SECRET` y
  `OS_ACCESS_PASSWORD` hasta que entre Supabase Auth).

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` y la contraseña de la BD **solo** se escriben en la caja de
> *Environment Variables* de Coolify. Nunca al repo ni a un chat. Si se filtran, se rotan.

### Pendiente de confirmar por "valme" (cuando escriba el código)

- Comando de arranque definitivo.
- Lista final de env vars del worker.
