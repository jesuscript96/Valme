# Worker de agentes

Un proceso largo que consume la cola `agent_runs` de Supabase (pgmq) y ejecuta cada
tarea con un bucle de herramientas sobre Claude.

```
create_agent_run()  →  cola pgmq  →  worker  →  Claude ⇄ herramientas  →  agent_runs.result
     (web o CLI)        {run_id}       │                                   agent_steps (traza)
                                       └─ todo dentro de runJob  →  ai_jobs (coste por cliente)
```

## Piezas

| Fichero | Qué hace |
| --- | --- |
| `src/main.ts` | Arranque: configuración, consumidor de la cola y `GET /health` |
| `src/loop.ts` | Lee de la cola hasta `WORKER_CONCURRENCY` mensajes y para limpio con SIGTERM |
| `src/process.ts` | Un mensaje de principio a fin: intentos, latido, tope de tiempo, cierre |
| `src/agent.ts` | El bucle: Claude elige herramienta, el worker la ejecuta, se repite |
| `src/tools/` | Las herramientas de v0 (abajo) |
| `src/urlGuard.ts` | Sólo deja navegar a http(s) público: nada de red interna ni metadatos |
| `sandbox/` | El contenedor con Chromium al que se conecta el worker |

## Herramientas de v0

| Herramienta | Qué hace |
| --- | --- |
| `browser_navigate` | Abre una URL pública |
| `browser_snapshot` | Árbol de accesibilidad de la página: qué hay y cómo señalarlo |
| `browser_click` | Clic en un elemento (role+name, texto o selector) |
| `browser_type` | Escribe en un campo y, si se pide, lo envía |
| `browser_screenshot` | Captura de la página, para juzgar lo visual |
| `browser_extract` | Texto visible y enlaces |
| `auditar_dominio` | El motor de auditoría de `@valme/os`; guarda el informe en `audits` |

Una ejecución puede limitarse a algunas (`agent_runs.tools`); vacío = todas.

## Desenlaces

| Qué pasa | Fila | Mensaje |
| --- | --- | --- |
| Termina | `succeeded` con `result = { text, steps }` | archivado |
| Rechazo del modelo, tope de pasos, tope de tiempo | `failed` | archivado |
| 429/5xx del modelo, red, Supabase | vuelve a `queued` con el motivo | reaparece al vencer la invisibilidad |
| Lo anterior en el último intento | `failed` | archivado |
| El worker muere a mitad | sigue `running` | vuelve solo a la cola |
| Cancelada desde fuera (`status = 'cancelled'`) | se respeta | archivado |

Cada intento abre su propio `ai_job`, y un intento fallido también apunta lo que gastó.

## Desarrollo

```bash
cp ../../.env.example .env.local   # rellena SUPABASE_* y OS_LLM_API_KEY
npm run worker                      # desde la raíz
npm run run:agent -w @valme/worker -- nordic-clinic "Audita nordic-clinic.es y resume lo grave" --wait
npm run check -w @valme/worker      # tipos + lint + tests (sin red)
```

Sin `SANDBOX_URL` las páginas se cargan con el Chrome local. Para probar el sandbox:

```bash
SANDBOX_TOKEN=un_token_largo_de_prueba_123456 PORT=3999 CHROME_PATH="<ruta a chrome>" node sandbox/server.mjs
SANDBOX_URL=ws://127.0.0.1:3999/un_token_largo_de_prueba_123456 npm run worker
```

## Despliegue (Coolify)

Dos recursos, los dos con la **raíz del repo** como contexto de build:

| Recurso | Dockerfile | Puertos | Variables |
| --- | --- | --- | --- |
| worker | `apps/worker/Dockerfile` | 8080 interno (`/health`) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OS_LLM_API_KEY`, `SANDBOX_URL`, opcionales `OS_LLM_MODEL`, `PAGESPEED_API_KEY`, `META_ADLIB_TOKEN`, `WORKER_*` |
| sandbox | `apps/worker/sandbox/Dockerfile` | 3000 interno, **ninguno público** | `SANDBOX_TOKEN` |

`SANDBOX_URL = ws://<host-interno-del-sandbox>:3000/<SANDBOX_TOKEN>`.

El sandbox no lleva credenciales. Su red sólo debe dejarle salir a internet y hablar con
el worker: sin ruta a la red interna del servidor ni a otros servicios. La guarda de
destinos del worker es la segunda capa, no la única.

El arranque es `node --conditions=react-server --import tsx apps/worker/src/main.ts`
(el `CMD` de la imagen). La condición `react-server` hace falta porque el código
compartido lleva `import "server-only"`.
