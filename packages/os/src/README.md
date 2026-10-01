# Valme OS — área de admin

Todo el área vive aquí dentro. Es el paquete `@valme/os` del monorepo: lo consumen
`apps/web` (las pantallas) y `apps/worker` (los agentes). Se importa como
`@valme/os/<carpeta>/<fichero>`.

El worker sólo importa lo que no depende de Next (`domain/`, `providers/`, `audit/`,
`db/`). `auth/`, `tenancy/`, `ui/`, `seo/` y `repo/index.ts` son de Next y sólo los usa la web.

Un `.ts` nuevo dentro de una carpeta de `.tsx`, o una carpeta con `index.ts`, necesita su
entrada en `exports` de `package.json`; `npm run check` lo comprueba.

## Mapa

```
auth/        session.ts (cookie firmada) · dal.ts (LA comprobación) · actions.ts
tenancy/     lastClient.ts (comodidad de navegación, nunca autoriza)
repo/        types.ts (el modelo) · index.ts (forClient) · seed.data.ts (demo)
domain/      lógica pura y comprobable: copys, formatos, leads, bloques, coste
providers/   firecrawl · anthropic · higgsfield · meta — código real, sin credenciales
ui/          primitivas, shell, navegación, selector de cliente
data/        members.ts — el equipo, a mano (Fase 0)
```

## Tres reglas que no son negociables

**1. Un layout no protege lo que cuelga de él.** En Next 16, por el renderizado parcial, un
layout no se re-renderiza al navegar y no controla si sus hijos se ejecutan ni si aparecen
en el payload RSC. La comprobación vive en `auth/dal.ts` y la llama cada página, cada Server
Action y cada route handler. `apps/web/src/proxy.ts` sólo evita el parpadeo.

**2. No existe acceso a datos sin cliente.** No hay `repo.offers.list()`. El único camino es
`forClient(slug)`, que resuelve la sesión, valida la pertenencia y devuelve consultas ya
filtradas. Olvidarse del filtro no es un descuido posible porque no hay función que llamar
sin él. En el Sprint 1 esto se apoya en RLS y `forClient` pasa a fijar el `client_id` de la
sesión de Postgres; el resto del código no cambia.

**3. Ninguna llamada a IA fuera de `runJob`.** `domain/aiJobs.ts` abre la fila, ejecuta y la
cierra con tokens y coste. Sin esta regla, a la tercera semana hay tres llamadas sueltas y
el coste por cliente ya no vale para nada — y nadie se entera hasta que alguien pregunta.

## El login es falso

Cookie firmada con HMAC-SHA256 y contraseña compartida en `OS_ACCESS_PASSWORD`. Eso deja
fuera a curiosos y buscadores; **no es control de acceso**. Mientras siga así:

- ningún dato real de cliente ni de lead,
- ningún token de integración guardado desde el área.

Los datos reales entran con Supabase Auth + RLS en el Sprint 1. Cambiar de proveedor debe
ser reescribir `auth/session.ts` y `auth/dal.ts`, nada más: fuera de `auth/` nadie lee la
cookie.

## Estado de las integraciones

Todo el código de los proveedores es real y sigue la documentación de septiembre de 2026.
Lo que falta son credenciales. Cada superficie comprueba `providers/config.ts` y **dice
explícitamente qué variable falta** en vez de fallar con un 401 opaco o, peor, de fingir un
resultado: un Brand Kit inventado es peor que no tener Brand Kit, porque nadie lo revisaría
con la misma desconfianza.

## Desarrollo

```bash
npm run dev     # http://localhost:3000/login
npm test        # pruebas de la lógica de dominio, sin red
```

Credenciales de desarrollo en `apps/web/.env.local`: cualquier email de `data/members.ts` con la
contraseña de `OS_ACCESS_PASSWORD`.
