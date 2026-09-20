# Plan de ejecución — Área de admin (Valme OS)

Cómo llevar el MVP de `MVP end-to-end.md` al repo actual. Dos partes:

1. **Fase 0 — el caparazón** (≈1 semana, 1 dev): login fake, área de admin, segmentación
   global por cliente y las 9 pantallas recorribles. Es lo que no está en el MD y lo que
   condiciona todo lo demás.
2. **Sprints 1–4 del MD** (8 semanas, 2 devs), re-anclados a lo que Fase 0 deja montado.

Cómo se construye cada funcionalidad por dentro — contratos de API, trabajos, esquemas y
estados — está en [`spec-mvp-end-to-end.md`](./spec-mvp-end-to-end.md).

Fase 0 se solapa con la **Semana 0** del MD (accesos a Meta, Higgsfield, Firecrawl, Resend,
dominio de envío). Esos trámites tardan semanas y no dependen de código: hay que arrancarlos
el primer día, en paralelo.

---

## 1. De qué partimos

| | Estado hoy |
| --- | --- |
| App | Next.js **16.3** (App Router), React 19, Tailwind v4, TypeScript `strict` |
| Rutas | `/`, `/areas/[slug]`, `/casos/[slug]`, `/api/revalidate` |
| Contenido | Seed local (`src/content/seed.ts`); Sanity detrás de `NEXT_PUBLIC_USE_SANITY=1` |
| Auth / BBDD / colas | **No hay nada** |
| Despliegue | Vercel, un solo proyecto |

Tres cosas del repo condicionan el diseño del área:

- **`src/app/layout.tsx` envuelve toda la app en `Providers`**: Lenis (scroll suave), cursor
  personalizado que oculta el nativo (`cursor: none !important`), grano y `ScrollManager`.
  Eso es la experiencia de la web comercial y es **incompatible con una herramienta de
  trabajo**: en un editor de landings o una tabla de leads, el scroll interceptado y el
  cursor oculto son un fallo, no un detalle de marca. El área tiene que quedar fuera de ese
  árbol.
- **`body` es negro** (`--color-brand-black`) y la tipografía de display es Space Grotesk.
  La app necesita su propia superficie.
- El contenido vive en un **seed en fichero** detrás de una interfaz. Ese patrón ya
  funciona aquí y es exactamente el que conviene replicar para los datos del área.

### Tres detalles de Next.js 16 que cambian el plan

Verificados en `node_modules/next/dist/docs/` (el repo corre una versión con cambios de
ruptura respecto a lo que la mayoría de nosotros tenemos en la cabeza):

1. **`middleware.ts` está deprecado y se llama `proxy.ts`.** Mismo comportamiento, otro
   fichero y otro nombre de export. Va en `src/proxy.ts`. Hay codemod:
   `npx @next/codemod@canary middleware-to-proxy .`
2. **Un `layout.tsx` NO protege lo que hay debajo.** Por el renderizado parcial, el layout no
   se re-renderiza al navegar y no controla si los segmentos hijos se ejecutan ni si
   aparecen en el payload RSC. Poner el `if (!session) redirect()` en el layout del área es
   el error clásico y aquí es directamente inseguro. La comprobación va en una **capa de
   acceso a datos (DAL)** que llama *cada* página, acción y route handler.
3. **`forbidden()` / `unauthorized()` siguen siendo experimentales** (requieren
   `experimental.authInterrupts`). Para el MVP: `redirect()` y `notFound()` de toda la vida.

Además, leer `cookies()` vuelve la ruta dinámica. Es lo correcto para el área, pero implica
que **nada bajo `/app` se prerenderiza** — y que no hay que ponerle `generateStaticParams`.

---

## 2. Decisiones de arquitectura

| # | Decisión | Recomendación | Por qué |
| --- | --- | --- | --- |
| D1 | ¿Dónde vive el área? | Mismo repo y mismo despliegue, con **dos root layouts**: `src/app/(site)/` y `src/app/(os)/` | Un solo deploy, una sola cookie, un solo dominio. Dos root layouts dan al área un documento limpio: sin Lenis, sin cursor, sin grano. Navegar entre web y área provoca recarga completa — que es justo lo que queremos en esa frontera. |
| D2 | Espacio de URLs | `/login` y `/app/**` | Corto, legible y una sola regla en `robots.ts`. Si algún día se quiere separar, `os.valmesolutions.com` es un cambio de dominio, no de código. |
| D3 | **Cómo se filtra el cliente** | En la **URL**: `/app/c/[client]/…`. Cookie sólo para recordar el último | Ver abajo. Es la decisión más importante del área. |
| D4 | Autenticación | DAL `verifySession()` + cookie firmada. Hoy falsa, mañana Supabase Auth, **un módulo** | Es el patrón que recomiendan los docs de Next 16 y el que sobrevive al cambio de proveedor. |
| D5 | Datos | Interfaz `repo` con implementación seed hoy → Supabase en Sprint 1 | Mismo patrón que `useSanity` en la web. Permite recorrer las 9 pantallas en días, sin infra. |
| D6 | UI | **shadcn/ui ya en Fase 0**, bajo `src/os/ui/` | El MD lo pide en Sprint 1. Hacer 10 primitivas a mano ahora para tirarlas en tres semanas es retrabajo puro. Separado de `src/components/` para no mezclarlo con la web. |

### D3 — El cliente en la URL (el "filtro global")

```
/app/c/acme/brand-kit
/app/c/acme/offers/reformas-verano/studio
/app/c/otro-cliente/leads
```

Frente a guardar el cliente activo en una cookie y dejar las URLs en `/app/brand-kit`:

- **Enlaces que funcionan.** Pegas una URL en Slack y el otro ve lo mismo que tú.
- **Dos clientes en dos pestañas.** Con cookie, abrir un segundo cliente cambia el primero
  bajo los pies. En una agencia esto pasa todos los días.
- **Los Server Components reciben el ámbito en `params`**, sin leer cookies ni hacer un
  salto extra.
- **Mapea 1:1 con la RLS que viene después.** Hoy `client_id` sale de la URL y se valida
  contra `memberships`; en Sprint 1 ese mismo `client_id` es el que filtra Postgres. La
  forma del código no cambia.

El prefijo `c/` evita que `/app/clients` colisione con un cliente que se llame `clients`.

**Cómo se hace imposible olvidarlo:** el repositorio no expone ningún método sin ámbito.

```ts
// src/os/repo/index.ts
const data = await repo.forClient(clientId).offers.list()
//                     └─ resuelve la sesión, valida pertenencia y, si no la hay, redirige.
//                        No hay repo.offers.list() al que llamar por error.
```

Y el selector de cliente del topbar te deja **en la misma pantalla**:
`router.push(pathname.replace('/c/' + actual, '/c/' + nuevo))`. Cambias de cliente estando
en Leads y sigues en Leads, con los leads del otro. Eso es lo que hace que el área se sienta
"filtrada a nivel global".

### El login falso: qué es y qué no

Un login falso **no es control de acceso**. Con la cookie firmada por HMAC y una contraseña
compartida en variable de entorno, `/app` queda fuera del alcance de un curioso y de los
buscadores — y nada más. No aguanta a nadie que se lo proponga.

Consecuencia práctica, mientras la auth sea falsa:

- **Nada de datos reales de clientes ni de leads reales** en el área.
- **Ningún token de integración** (Meta, Resend, Higgsfield) guardado desde el área.
- `noindex` en el root layout del área y `Disallow: /app` en `robots.ts`.

Los datos reales entran cuando entra Supabase Auth + RLS, en el Sprint 1. El calendario del
MD ya lo permite: el piloto real no toca el área hasta la semana 2.

---

## 3. Mapa de rutas y ficheros

```
src/
  proxy.ts                        ← redirect optimista (sin BBDD): /app/* sin cookie → /login
  app/
    (site)/                       ← ROOT LAYOUT A — la web de hoy, intacta
      layout.tsx                    <Providers> + generateMetadata de Sanity   [movido]
      page.tsx                      /                                          [movido]
      areas/[slug]/                 /areas/[slug]                              [movido]
      casos/[slug]/                 /casos/[slug]                              [movido]
    (os)/                         ← ROOT LAYOUT B — documento limpio, noindex
      layout.tsx
      login/page.tsx                /login
      app/
        layout.tsx                  shell: sidebar + topbar + selector de cliente
        page.tsx                    /app → redirect al último cliente, o a /app/clients
        clients/page.tsx            (1) Clientes
        clients/new/page.tsx        (2) Alta de cliente — asistente
        c/[client]/
          layout.tsx                resuelve el cliente activo para pintar el shell
          page.tsx                  (3) Home del cliente
          brand-kit/page.tsx        (4) Brand Kit — pestañas
          offers/page.tsx           (5) Ofertas
          offers/[offer]/studio/    (6) Estudio de anuncios
          offers/[offer]/launch/    (7) Lanzar a Meta
          landings/page.tsx         (8) Landings — lista
          landings/[landing]/       (8) Editor de bloques
          leads/page.tsx            (9) Leads
          settings/page.tsx         Integraciones: Meta, Resend, dominio
    api/
      revalidate/route.ts           (ya existe)
      leads/route.ts                (Sprint 3 — ingesta pública de leads)
    robots.ts  sitemap.ts

  os/                             ← todo el área, autocontenido
    auth/
      session.ts                  firmar/verificar cookie, crear y destruir sesión
      dal.ts                      verifySession(), getCurrentUser()  ['server-only' + cache]
      actions.ts                  'use server': signIn / signOut
    tenancy/
      dal.ts                      requireClient(clientId) → { client, role }
      lastClient.ts               cookie del último cliente visitado
    repo/
      types.ts                    el modelo de datos del MD, en TypeScript
      index.ts                    export const repo = seedRepo   ← EL punto de cambio
      seed.repo.ts                2–3 clientes de demo
      supabase.repo.ts            (Sprint 1)
    data/members.ts               el equipo, a mano (Fase 0)
    ui/                           shadcn/ui + Sidebar, ClientSwitcher, PageHeader, EmptyState…
```

`src/os/` está deliberadamente aislado: en el Sprint 3 el repo se convierte en monorepo para
alojar la app de landings (`*.valme.site`, que el MD ya define como app aparte), y `src/os/`
se mueve a `apps/os/` sin tocar nada por dentro.

---

## 4. Fase 0 — el caparazón (≈1 semana, 1 dev)

### F0.1 · Aislar la web comercial del área — *medio día, es el único paso con riesgo*

Crear los dos root layouts, mover `page.tsx`, `areas/` y `casos/` dentro de `(site)/` junto
con el layout actual, y **borrar `src/app/layout.tsx`**. Los grupos de rutas no aparecen en
la URL: ninguna URL pública cambia.

El nuevo `(os)/layout.tsx` es mínimo: `<html lang="es">`, `globals.css`, `metadata.robots`
en `noindex, nofollow`. Sin `Providers`.

> **Verificación obligatoria antes de seguir**: `/`, `/areas/*` y `/casos/*` idénticas —
> preloader, revelado del hero, cursor, grano y scroll suave. La intro es una animación
> encadenada entre componentes y es lo único que este refactor puede romper. Comparar contra
> `main` en el navegador, no sólo que compile.

Añadir `Disallow: /app` y `/login` en `src/app/robots.ts`.

### F0.2 · Base visual del área — *medio día*

- `npx shadcn@latest init` apuntando a `src/os/ui/`.
- Bloque de tokens del área en `globals.css` (superficies claras, bordes, radios). Se
  mantiene `--color-brand-accent` (#ff3b21) como acento y Inter como tipografía; Space
  Grotesk queda para la web.
- **El área en claro, la web en negro.** Densidad de datos, formularios largos y lectura
  prolongada: el negro de marca es para impresionar en la home, no para rellenar un Brand Kit
  durante una hora.

### F0.3 · Login falso con forma de login real — *1 día*

- `src/os/auth/session.ts`: cookie `valme_os_session`, `httpOnly`, `secure`, `sameSite=lax`,
  firmada HMAC-SHA256 con `OS_SESSION_SECRET`, TTL 8 h, payload
  `{ userId, email, name, role, exp }`.
- `src/os/data/members.ts`: el equipo a mano, con rol `admin | estratega | ejecutor`.
  Contraseña compartida en `OS_ACCESS_PASSWORD`.
- `/login`: formulario con Server Action + `useActionState`, soporte de `?next=`.
- `src/proxy.ts`: matcher `/app/:path*`. **Sólo lee la cookie**, nunca consulta datos — los
  docs de Next avisan de que el proxy corre también en prefetch.
- `src/os/auth/dal.ts`: `verifySession()` con `'server-only'` y `React.cache`. **Esta es la
  comprobación de verdad**; el proxy sólo evita el parpadeo.

Contrato a respetar: fuera de `src/os/auth/`, nadie lee la cookie. Cambiar a Supabase Auth en
el Sprint 1 debe ser reescribir tres funciones.

### F0.4 · Ámbito de cliente global — *1,5 días*

- `src/os/repo/types.ts`: las tablas del MD como tipos — `Client`, `Membership`, `BrandKit`,
  `Offer`, `Asset`, `AdCreative`, `Campaign`, `Landing`, `Lead`, `EmailSend`, `AiJob`,
  `Integration`. Nombres en inglés, `clientId` en todas. Escribirlos bien ahora es la mitad
  del Sprint 1.
- `seed.repo.ts` con 2–3 clientes ficticios: uno con Brand Kit aprobado, oferta, 6 anuncios y
  leads; otro recién dado de alta y vacío (para diseñar los estados vacíos con algo real
  delante).
- `repo.forClient(clientId)`: resuelve sesión, valida pertenencia, redirige si no. Único
  acceso a datos.
- `ClientSwitcher` en el topbar, con la reescritura de ruta que mantiene la pantalla.
- Cookie `valme_os_last_client` para que `/app` devuelva a donde estabas.

### F0.5 · Shell y las 9 pantallas — *2 días*

Sidebar fija con las secciones del MD, topbar con selector de cliente y menú de usuario.
Las 9 pantallas como rutas reales, cada una con su cabecera, su estado vacío redactado y, con
el seed, datos suficientes para que se vean como se van a ver: lista de clientes con leads
del mes, tabla de leads con filtros, tablero de tarjetas de anuncios, pestañas del Brand Kit.

Los roles ya condicionan la UI (p. ej. "Nuevo cliente" y Settings sólo para `admin`), aunque
en Fase 0 sea sólo mostrar u ocultar.

### Criterio de terminado de Fase 0

> Entras con tu email, ves tres clientes, eliges uno, recorres las nueve pantallas, cambias de
> cliente desde cualquiera de ellas y te quedas en la misma pantalla con los datos del otro.
> La web pública sigue exactamente igual que en `main`.

Con esto, diseño puede trabajar sobre pantallas reales en lugar de sobre Figma, y las tres
pantallas críticas que el MD señala (alta de cliente, estudio de anuncios, editor de landing)
se pueden probar con la usuaria piloto **antes** de que exista una sola integración.

---

## 5. Cómo encaja con los cuatro sprints del MD

Fase 0 no adelanta trabajo de los sprints: adelanta las **decisiones** y deja los enchufes
puestos. Lo que cambia en cada sprint respecto al MD:

| Sprint | Qué dice el MD | Qué cambia teniendo Fase 0 |
| --- | --- | --- |
| **1** · Cimientos + Brand Kit | Monorepo, Supabase, RLS, roles, design system, Trigger.dev, Vercel; Brand Kit con Firecrawl + LLM; CRUD de ofertas | Shell, roles, design system y las pantallas **ya están**. El sprint se concentra en lo que de verdad cuesta: esquema Postgres + **RLS por `client_id`**, cambiar `seedRepo` → `supabaseRepo` (una línea en `repo/index.ts`), cambiar auth falsa → Supabase Auth (un módulo), Trigger.dev y la extracción con Firecrawl + LLM. **Aquí entran los datos reales.** |
| **2** · Creatividades y copys | Copys por ángulo, Higgsfield asíncrono con webhook, overlays en código, tablero, "Descargar pack" | Sin cambios. El tablero de la pantalla 6 ya existe como maqueta con el seed; se le enchufa la generación real. La prueba de 20–30 imágenes de la primera semana sigue siendo lo primero. |
| **3** · Landing, lead y correo | Landing por bloques, app multi-tenant en `valme.site`, formulario, ingesta, Resend, píxel + CAPI | Aquí el repo pasa a **monorepo**: `apps/web` (comercial + OS) y `apps/landings`. Recomendación: **despliegues separados** — una landing que capta leads reales no debe caerse por un bug del área de admin. `src/os/` se mueve entero, sin tocarlo. |
| **4** · Salida a Meta y piloto | OAuth, formulario de lanzamiento, campaña en pausa, atribución, Sentry | Sin cambios. El plan B del MD (pack descargable) sigue siendo la red de seguridad si el Advanced Access no llega. |

El calendario del MD (8 semanas, 2 devs) se mantiene. Fase 0 la hace **un** dev mientras el
otro y la parte no técnica empujan la Semana 0.

---

## 6. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| **El refactor de root layouts rompe la intro de la web** | Es el único paso peligroso y es el primero: se hace aislado, se verifica en navegador contra `main` y se mergea solo, antes de escribir nada del área. |
| **El login falso se queda más de lo previsto** | Mientras sea falso: cero datos reales, cero tokens. Es una regla, no una recomendación. Si el Sprint 1 se retrasa, lo que se retrasa es meter datos reales, no el área. |
| **Accesos de Semana 0 (Meta sobre todo)** | Arrancar el día 1, en paralelo a Fase 0. El Advanced Access de `ads_management` es lo que más tarda y el MD ya asume que puede no llegar. |
| **El dominio de envío de correo llega frío al Sprint 3** | Configurar SPF/DKIM/DMARC en la Semana 0 para que caliente. Ya está en el MD; se menciona porque es lo que más se olvida. |
| **Deriva entre la maqueta de Fase 0 y los datos reales** | Los tipos de `repo/types.ts` son los mismos que generará Supabase. Si el esquema del Sprint 1 se desvía, se corrige en los tipos, no en las pantallas. |

## 7. Decisiones que hacen falta antes de empezar

1. **`/app` o subdominio.** El plan asume `/app`. Un subdominio (`os.valmesolutions.com`)
   aísla mejor pero obliga a resolver cookies entre dominios antes de tiempo.
2. **Quién entra en Fase 0.** La lista de miembros y sus roles van a mano en
   `src/os/data/members.ts`.
3. **Área en claro** (asumido) frente a área en negro como la web.
4. **Cuándo entra Supabase.** El plan lo mete en el Sprint 1. Meterlo ya en Fase 0 añade
   2–3 días y quita la ventaja de recorrer las pantallas sin infra.
