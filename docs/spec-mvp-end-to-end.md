# Especificación funcional — MVP end-to-end

Cómo se construye cada funcionalidad del MVP. Complementa
[`plan-area-admin.md`](./plan-area-admin.md), que cubre el caparazón (login, área, filtro
global por cliente). Aquí está el relleno: contratos de API, trabajos, esquemas y estados.

Todo lo que se afirma de una API externa está verificado contra su documentación en
septiembre de 2026. Donde el MD daba algo por supuesto y la API dice otra cosa, aparece
marcado como **⚠ Corrección al MD**.

---

## 0. Stack y piezas transversales

| Pieza | Elección | Nota |
| --- | --- | --- |
| BBDD | Supabase Postgres + RLS por `client_id` | Sprint 1 |
| Storage | Supabase Storage, bucket privado `assets` | URLs firmadas |
| Cola | Trigger.dev | Todo lo que llama a un tercero va en un job |
| LLM | **Claude Opus 5** (`claude-opus-5`) vía `@anthropic-ai/sdk` | $5/$25 por MTok, contexto 1M |
| Imágenes | Higgsfield (SOUL 2 / Marketing Studio) | Asíncrono con webhook |
| Extracción web | Firecrawl, formato `branding` + `markdown` | |
| Correo | Resend + React Email | |
| Anuncios | Meta Marketing API **v26.0** | Versión actual desde el 29/07/2026 |

### 0.1 Modelo de datos

Las tablas del MD, con los campos que el código necesita de verdad. `client_id` en todas,
RLS en todas.

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  slug text not null unique,               -- subdominio de la landing
  status text not null default 'onboarding', -- onboarding|active|paused
  created_at timestamptz default now()
);

create table memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  role text not null,                      -- admin|strategist|operator
  primary key (user_id, client_id)
);

create table brand_kits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  status text not null default 'draft',    -- draft|extracting|extracted|approved
  version int not null default 1,
  identity jsonb not null default '{}',    -- logo, colores, tipografías, estilo fotográfico
  voice    jsonb not null default '{}',    -- tono, tuteo, palabras sí/no, ejemplos
  business jsonb not null default '{}',    -- propuesta de valor, servicios, pruebas, zona
  personas jsonb not null default '[]',    -- 1-3 buyer personas
  legal    jsonb not null default '{}',    -- textos legales, responsable, base legal CAPI
  source   jsonb not null default '{}',    -- respuesta cruda de Firecrawl (auditoría)
  approved_at timestamptz, approved_by uuid,
  unique (client_id)                       -- 1 por cliente; el histórico va en _versions
);
create table brand_kit_versions (   -- snapshot inmutable en cada aprobación
  id uuid primary key default gen_random_uuid(),
  brand_kit_id uuid not null references brand_kits(id) on delete cascade,
  version int not null, snapshot jsonb not null, created_at timestamptz default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  brand_kit_id uuid not null references brand_kits(id) on delete cascade,
  name text not null, what text not null, hook text,
  persona_index int, cta text not null, ends_at date,
  created_at timestamptz default now()
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  parent_asset_id uuid references assets(id),  -- recorte/overlay derivado de un máster
  kind text not null,                          -- logo|client_photo|generated|overlay
  format text,                                 -- 3:4|4:5|1:1|9:16
  storage_path text not null, width int, height int,
  origin text not null,                        -- upload|firecrawl|higgsfield
  ai_job_id uuid references ai_jobs(id),
  created_at timestamptz default now()
);

create table ad_creatives (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  offer_id uuid not null references offers(id) on delete cascade,
  angle text not null,                     -- pain|benefit|social_proof|urgency|objection
  variant int not null,
  primary_text text, headline text, description text, cta text,
  asset_master_id uuid references assets(id),
  status text not null default 'generated', -- generated|reviewed|approved|discarded
  meta_ad_id text,
  created_at timestamptz default now()
);

create table landings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  offer_id uuid not null references offers(id) on delete cascade,
  slug text not null,
  blocks jsonb not null,                   -- borrador que edita el usuario
  published_blocks jsonb,                  -- lo único que lee el renderizador
  form_fields jsonb not null default '[]',
  email_template jsonb,                    -- asunto + bloques del correo
  status text not null default 'draft',    -- draft|published
  published_at timestamptz,
  unique (client_id, slug)
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  landing_id uuid references landings(id),
  ad_creative_id uuid references ad_creatives(id),
  name text, email text, phone text,
  email_normalized text generated always as (lower(trim(email))) stored,
  answers jsonb not null default '{}',
  utm_source text, utm_medium text, utm_campaign text, utm_content text, utm_term text,
  fbclid text, fbc text, fbp text,
  consent boolean not null, consent_text text, consent_at timestamptz,
  ip inet, user_agent text,
  event_id uuid not null,                  -- deduplicación píxel ↔ CAPI
  created_at timestamptz default now()
);
create unique index leads_dedupe on leads (client_id, email_normalized)
  where email_normalized is not null;

create table email_sends (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null, lead_id uuid not null references leads(id) on delete cascade,
  kind text not null default 'confirmation',
  provider_id text,                        -- id de Resend
  status text not null default 'queued',   -- queued|sent|delivered|bounced|complained|failed
  updated_at timestamptz default now()
);

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  kind text not null,      -- brand_kit.extract | copy.generate | image.generate | ...
  provider text not null,  -- anthropic|higgsfield|firecrawl|meta|resend
  model text, status text not null default 'queued',
  external_id text,        -- request_id de Higgsfield
  input jsonb not null, output jsonb, error text,
  input_tokens int, output_tokens int, cache_read_tokens int,
  cost_usd numeric(10,5),
  created_at timestamptz default now(), finished_at timestamptz
);
create unique index ai_jobs_external on ai_jobs (provider, external_id)
  where external_id is not null;

create table integrations (
  client_id uuid not null references clients(id) on delete cascade,
  provider text not null,                  -- meta|resend
  credentials bytea not null,              -- AES-256-GCM, clave en INTEGRATIONS_KEY
  meta jsonb not null default '{}',        -- ad_account_id, page_id, pixel_id, sending_domain
  primary key (client_id, provider)
);
```

**RLS** — una política por tabla, todas iguales:

```sql
alter table offers enable row level security;
create policy tenant_isolation on offers using (
  exists (select 1 from memberships m
          where m.client_id = offers.client_id and m.user_id = auth.uid())
);
```

La ingesta pública de leads y los webhooks no pasan por RLS: usan la `service_role` key desde
el servidor y validan el `client_id` ellos mismos a partir de la landing o del `ai_job`.

### 0.2 La regla del `ai_job`

**Ninguna llamada a un proveedor de IA sale del código directamente.** Todas pasan por un
helper que abre la fila de `ai_jobs`, ejecuta, y la cierra con tokens y coste:

```ts
export async function runJob<T>(spec: {
  clientId: string; kind: string; provider: string; model?: string; input: unknown
}, fn: (job: AiJob) => Promise<{ output: T; usage?: Usage; costUsd?: number }>): Promise<T>
```

Esto es lo que hace cierta la promesa del MD de *"saber desde el primer día cuánto cuesta en
IA cada cliente"*. Sin la regla, a la tercera semana hay tres llamadas sueltas y el dato ya
no vale.

Coste de Claude: de `response.usage` × las tarifas de `claude-opus-5` ($5 entrada / $25
salida por MTok; lectura de caché ~0,1×). Coste de Higgsfield: del endpoint `/estimate`
(§4.4).

---

## 1. Alta de cliente y Brand Kit

**Pantallas 2 y 4.** El usuario pega una URL y en menos de un minuto tiene un kit
prerrellenado que revisa y aprueba. Sin kit aprobado no se genera nada.

### 1.1 Lo que ve el usuario

1. `/app/clients/new` — un campo: la URL del cliente. Botón *Extraer*.
2. Server Action: crea `clients` + `brand_kits` en `extracting`, encola
   `brand-kit.extract`, redirige a `/app/c/<slug>/brand-kit`.
3. La pantalla muestra progreso real por pasos (identidad → páginas → mensaje), suscrita a
   los cambios de `brand_kits.status` por Supabase Realtime.
4. Al terminar, el formulario por pestañas sale relleno con todo marcado como *sugerido*.
   Cada campo que el usuario toca pierde esa marca: al final se ve de un vistazo qué ha
   revisado una persona y qué no.
5. *Aprobar* exige que los campos obligatorios estén revisados. Escribe `approved_at`, sube
   `version` y guarda el snapshot en `brand_kit_versions`.

### 1.2 Extracción — paso 1: identidad (sin LLM)

```http
POST https://api.firecrawl.dev/v2/scrape
Authorization: Bearer fc-...
{ "url": "<web del cliente>", "formats": ["branding", "markdown"] }
```

La respuesta trae `data.branding`, que se mapea **directamente**, sin pasar por el modelo:

| Campo de Firecrawl | Bloque del Brand Kit |
| --- | --- |
| `branding.logo`, `branding.images.logo/favicon/ogImage` | Identidad → logo (se **descarga** a Storage, nunca se enlaza la URL del cliente) |
| `branding.colors.{primary,secondary,accent,background,textPrimary,textSecondary}` | Identidad → paleta |
| `branding.typography.fontFamilies.{primary,heading}` | Identidad → tipografías |
| `branding.colorScheme` (`light`/`dark`) | Identidad → modo dominante |
| `branding.spacing.{baseUnit,borderRadius}` | Identidad → radios de la landing |
| `branding.components.buttonPrimary` | Identidad → estilo de botón de la landing |
| **`branding.personality`** (tone, energy, target audience) | **Voz → semilla del tono y Público → semilla de la persona** |

> `branding.personality` no estaba en el MD. Ahorra una parte del trabajo del LLM y, sobre
> todo, da un punto de partida que no es una alucinación: sale del sitio real.

### 1.3 Extracción — paso 2: mensaje (con LLM)

`POST /v2/map` sobre el dominio para listar URLs; se eligen hasta 6 por patrón
(`/`, `servicios|productos`, `sobre|nosotros|quienes`, `casos|clientes`, `contacto`,
`privacidad|legal`) y se hace `scrape` en `markdown` de cada una.

Una sola llamada a Claude con todo ese markdown + el JSON de `branding`, con salida
estructurada:

```ts
const res = await client.messages.create({
  model: "claude-opus-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  system: [{ type: "text", text: EXTRACTION_SYSTEM, cache_control: { type: "ephemeral" } }],
  output_config: {
    format: {
      type: "json_schema",
      schema: {
        type: "object", additionalProperties: false,
        required: ["voice", "business", "personas", "legal"],
        properties: {
          voice: { type: "object", additionalProperties: false,
            required: ["tone", "address", "wordsToUse", "wordsToAvoid", "sampleCopy"],
            properties: {
              tone: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 },
              address: { enum: ["tu", "usted"] },
              wordsToUse:   { type: "array", items: { type: "string" } },
              wordsToAvoid: { type: "array", items: { type: "string" } },
              sampleCopy:   { type: "array", items: { type: "string" } } } },
          business: { /* valueProposition, services[], differentiators[], proof[], geo */ },
          personas: { type: "array", minItems: 1, maxItems: 3, items: { /* profile, pains[], desires[], objections[] */ } },
          legal:    { /* privacyUrl, controller, capiLegalBasis */ }
        } } } },
  messages: [{ role: "user", content: buildContext(pages, branding) }],
});
```

Dos reglas en el system prompt que evitan el 90 % de los problemas:

- **Nada de inventar pruebas.** Cifras, testimonios y logos solo si aparecen literalmente en
  las páginas; si no, el array va vacío y la UI muestra *"no encontrado, rellénalo tú"*.
  Una prueba social inventada acaba en un anuncio pagado.
- **Citar el origen.** Cada afirmación de `business` lleva la URL de donde salió, y la UI la
  enseña al lado del campo para que revisar sea comprobar, no leer y confiar.

### 1.4 Estados y fallos

`draft → extracting → extracted → approved`

| Fallo | Qué pasa |
| --- | --- |
| Firecrawl no devuelve `branding` | El kit pasa a `extracted` con Identidad vacía y un aviso: *"no hemos podido leer la identidad visual, súbela a mano"*. No bloquea. |
| La web es una SPA sin contenido en el HTML | Se reintenta el scrape con `actions: [{type:"wait"}]`. Si sigue vacío, se avisa y se sigue a mano. |
| El LLM devuelve JSON que no valida | Un reintento con el error de validación añadido al contexto. Si vuelve a fallar, `extracted` con esos bloques vacíos. |

**Criterio de aceptación**: pegada la web del piloto, en menos de 10 minutos hay un Brand Kit
aprobado con logo, paleta, tono, propuesta de valor y una persona — y todo campo con dato
real trae su URL de origen.

---

## 2. Ofertas

**Pantalla 5.** La pieza que une todo: un Brand Kit tiene N ofertas y cada oferta genera sus
creatividades, su landing y su campaña.

CRUD simple, sin IA. Formulario de seis campos (`name`, `what`, `hook`, `persona`, `cta`,
`ends_at`). La única lógica: **no se puede crear una oferta si el Brand Kit no está
`approved`**, comprobado en el Server Action y con un `check` en base de datos, no solo
escondiendo el botón.

Desde la ficha de la oferta salen las tres acciones del flujo: *Generar anuncios*,
*Generar landing*, *Lanzar a Meta* — cada una deshabilitada hasta que existe su
precondición, y con el motivo escrito al lado del botón.

---

## 3. Copys para Meta

**Pantalla 6, mitad izquierda de cada tarjeta.**

### 3.1 Generación

El usuario elige ángulos y variantes (por defecto 3 × 2). Se lanza **una llamada por
ángulo**, en paralelo. Tres razones, todas prácticas: regenerar un ángulo no re-tira los
otros, las tres comparten prefijo cacheado, y un fallo afecta a un tercio.

```ts
system: [
  { type: "text", text: COPY_SYSTEM },                                  // fijo
  { type: "text", text: renderBrandKit(kit) + renderOffer(offer),
    cache_control: { type: "ephemeral", ttl: "1h" } },                  // ← prefijo cacheado
],
messages: [{ role: "user", content: `Ángulo: ${angle}. Variantes: ${n}.` }],
output_config: { format: { type: "json_schema", schema: VARIANTS_SCHEMA } },
```

El Brand Kit renderizado ronda los 2–4k tokens y es idéntico para los tres ángulos y para
todas las ediciones por tarjeta de esa sesión. Con caché de 1 h, la segunda llamada en
adelante paga ~0,1× por esa parte. Es el mayor ahorro del sistema y sale gratis con ordenar
bien el prompt: **lo estable primero, lo volátil después**.

Esquema de salida por variante:

```jsonc
{ "primary_text": "string",   // texto principal
  "headline": "string",       // título
  "description": "string",    // descripción del enlace
  "cta": "LEARN_MORE | SIGN_UP | GET_QUOTE | CONTACT_US | BOOK_NOW | DOWNLOAD" }
```

El `cta` es un enum con los valores exactos de `call_to_action.type` de Meta, para que el
Sprint 4 no tenga que traducir nada.

### 3.2 Validación de longitudes

Meta *recomienda* 125 caracteres de texto principal, 27 de título y 27 de descripción. No son
límites duros: pasarse no rompe la subida, recorta la vista en el feed. Por tanto la UI
**avisa en ámbar, no bloquea**, y muestra el contador sobre una vista previa tipo Instagram
para que se vea dónde cae el *"…ver más"*. Los umbrales viven en una constante, no repartidos
por el código: Meta los cambia.

### 3.3 Acciones por tarjeta

*Más corto*, *Más directo*, *Regenerar*, *Editar en línea*. Las tres primeras son la misma
llamada con el texto actual y una instrucción distinta; cada una abre su `ai_job` y guarda la
versión anterior en `ad_creatives.history` para poder deshacer. La edición en línea no llama
a nada.

---

## 4. Imágenes (Higgsfield)

**Pantalla 6, mitad derecha.** Aquí es donde la documentación real se separa más del MD.

### 4.1 ⚠ Corrección al MD — qué modelo, y por qué importa

| | `higgsfield-ai/soul/v2/standard` | `marketing-studio/image` |
| --- | --- | --- |
| Entradas | Solo `prompt` | `prompt` + **`image_urls`** (hasta 16 en modo directo) |
| Imágenes de referencia | **No las acepta** | Sí — es la razón para usarlo |
| Ratios | 9:16, 16:9, 4:3, 3:4, 1:1, 2:3, 3:2 | auto, 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 21:9 |
| Resolución | 720p, 1080p | 1k, 2k, 4k + `quality` low/medium/high |
| Extras | `style_id`, `style_strength`, `seed`, `batch_size` 1 o 4 | `preset_id` (modo guiado), `moderation` |

El MD dice que el prompt se compone *"con fotos reales del cliente como referencia"*. **SOUL
no acepta referencias de imagen.** Por tanto la regla es:

> Si el Brand Kit tiene fotos del cliente → `marketing-studio/image` con `image_urls`.
> Si no las tiene → `soul/v2/standard`.

Se guarda en `brand_kits.identity.imageModel` para que sea revisable, y la prueba de 20–30
imágenes del sprint 2 compara los dos caminos, no cinco modelos sueltos.

### 4.2 ⚠ Corrección al MD — el formato 4:5 no existe en la API

Ninguno de los dos modelos ofrece 4:5, que es el formato de feed que pide el MD. Solución, y
además sale más barata:

```
Generación 1 → 3:4  (1080×1440)  ─┬─ recorte central → 4:5 (1080×1350)   pierde 6 %
                                  └─ recorte central → 1:1 (1080×1080)   pierde 25 %
Generación 2 → 9:16 (1080×1920)  ──── tal cual → stories/reels
```

**Dos generaciones, cuatro entregables.** El recorte se hace con `sharp` en el job, con
gravedad centrada por defecto y punto de anclaje editable en la UI si algo importante queda
fuera. El 3:4 se guarda como máster (`assets.parent_asset_id = null`) y los recortes cuelgan
de él.

### 4.3 El ciclo asíncrono

```
1. POST https://api.higgsfield.ai/marketing-studio/image?hf_webhook=https%3A%2F%2F…%2Fapi%2Fwebhooks%2Fhiggsfield
   Authorization: Key ${HF_API_KEY_ID}:${HF_API_KEY_SECRET}
   → { status: "queued", request_id, status_url, cancel_url }
   → se guarda request_id en ai_jobs.external_id

2. El webhook llega con { request_id, status, error, payload:{ images:[{url, content_type}] } }
   El handler SOLO: valida el envelope, marca el job y encola la descarga. Responde 2xx.

3. Job de descarga: copia cada URL a Supabase Storage, crea assets, genera los recortes,
   aplica los overlays y marca el ad_creative como listo.
```

Cuatro cosas que la documentación exige y que, si se ignoran, fallan en producción:

- **Diez segundos.** El endpoint debe responder en menos de 10 s. Por eso el handler no
  descarga nada: sería una descarga de varios MB dentro del webhook.
- **Duplicados garantizados.** El índice único `ai_jobs (provider, external_id)` más un
  `status` terminal hacen el handler idempotente. Una segunda entrega responde 2xx y no hace
  nada.
- **Reintentos de hasta 2 horas** ante 5xx o fallo de red; un 4xx es permanente. Si la
  entrega se pierde del todo, un job de barrido consulta `status_url` para los `ai_jobs` en
  `running` con más de 15 minutos.
- **Siete días de retención.** *"Output is accessible for at least seven days."* Por eso la
  copia a Storage es el paso 3 y no una tarea de mantenimiento: a los 8 días el enlace
  desaparece y el anuncio se queda sin imagen.

Las fotos del cliente que se pasan en `image_urls` tienen que ser HTTPS públicas. En vez de
abrir el bucket, se suben a Higgsfield con su flujo de presignado
(`POST /files/generate-upload-url` → `PUT` a la URL devuelta con **todas** las cabeceras de
`upload_headers` → se usa `public_url`). La URL de subida caduca en una hora.

### 4.4 Coste

Antes de generar, `POST https://api.higgsfield.ai/estimate/<endpoint-id>` con **el mismo
cuerpo** devuelve `{ "credits": "1.500", "usd": "0.094" }`. Ese valor va a
`ai_jobs.cost_usd` y se enseña en la UI antes de pulsar *Generar*: "6 anuncios ≈ 1,13 $".
Los estados `failed` y `nsfw` no se cobran y los créditos reservados se devuelven solos, así
que el job pone `cost_usd = 0` al cerrarlos.

### 4.5 Overlays de marca en código

Logo y texto corto **nunca** los pone la IA. Se componen en el job con `satori` +
`@resvg/resvg-js`: una plantilla React por formato, alimentada con `identity.colors`,
`identity.fonts` y el logo del Storage. Sale un PNG por formato, con su fila en `assets` y
`parent_asset_id` apuntando al máster.

Que la marca salga bien no es una cuestión de calidad de modelo: es que un logo generado por
IA está mal siempre.

---

## 5. Landings

**Pantalla 8.**

### 5.1 Los bloques

El JSON es una unión discriminada validada con Zod. El mismo esquema sirve para tres cosas —
validar lo que escribe el LLM, tipar el editor y tipar el renderizador — y eso es justo lo
que impide que se desincronicen:

```ts
const Block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"),     headline: z.string(), subheadline: z.string(),
                                          ctaLabel: z.string(), imageAssetId: z.string().nullable() }),
  z.object({ type: z.literal("benefits"), title: z.string(),
                                          items: z.array(z.object({ title: z.string(), body: z.string() })).min(3).max(6) }),
  z.object({ type: z.literal("how"),      steps: z.array(z.object({ title: z.string(), body: z.string() })).min(2).max(4) }),
  z.object({ type: z.literal("proof"),    quotes: z.array(...), logos: z.array(...) }),
  z.object({ type: z.literal("faq"),      items: z.array(z.object({ q: z.string(), a: z.string() })).min(3).max(8) }),
  z.object({ type: z.literal("form"),     title: z.string(), submitLabel: z.string() }),
  z.object({ type: z.literal("footer"),   legalHtml: z.string() }),
]);
const Landing = z.object({ blocks: z.array(z.object({ id: z.string(), visible: z.boolean(), block: Block })) });
```

Generación: una llamada a Claude con Brand Kit + oferta, salida estructurada contra ese mismo
esquema (convertido con `zod-to-json-schema`). Colores, tipografías y logo **no** los escribe
el modelo: salen del kit en tiempo de render.

### 5.2 Editor

Reordenar (arrastrar), ocultar (interruptor), editar texto en línea, cambiar imagen (subida o
reutilizada de las creatividades). Vista móvil y escritorio en un iframe con el renderizador
real, no una aproximación. Guardado con *debounce* de 800 ms sobre `landings.blocks`.

No es un constructor libre: no se pueden añadir bloques que no estén en la unión, ni tocar
colores, ni mover nada dentro de un bloque. Menos libertad, siempre on-brand.

### 5.3 Publicación y render

*Publicar* copia `blocks` → `published_blocks`, pone `status='published'` y `published_at`.
**El renderizador solo lee `published_blocks`**, así que editar nunca toca la página viva.

App aparte (`apps/landings`, Sprint 3), con `cacheComponents: true` en su
`next.config.ts` — la app de marketing y el área **no** lo activan, porque cambia la
semántica de caché de la web actual.

```ts
async function getLanding(tenant: string, slug: string) {
  "use cache";
  cacheTag(`landing:${tenant}:${slug}`);
  return db.landing.findPublished(tenant, slug);
}
```

Publicar llama a un endpoint interno de esa app que hace `revalidateTag('landing:…')`. Sin
ISR por tiempo: la página es estática hasta que alguien publica.

Enrutado multi-tenant: `proxy.ts` lee el subdominio del `Host` y reescribe
`cliente.valme.site/oferta` → `/_render/cliente/oferta`.

### 5.4 Formulario, cookies y medición

- Campos configurables (`landings.form_fields`): nombre, email, teléfono + 1–2 preguntas de
  cualificación. Consentimiento RGPD con el texto del bloque `legal` del kit, guardado
  literal en el lead — el texto cambia con el tiempo y hay que poder probar qué aceptó cada
  persona.
- Anti-spam: honeypot (campo oculto; si viene relleno, 200 y a la basura, sin pista para el
  bot) + límite de 5 envíos por IP y landing por minuto.
- Banner de cookies: el píxel de Meta **no se carga** hasta que hay consentimiento.
- ⚠ **Decisión legal, no técnica**: el MD dice que la Conversions API se envía "según la base
  legal definida en el Brand Kit". Mandar el evento a Meta sin consentimiento es una postura
  que firma el cliente, no un ajuste por defecto. El campo existe
  (`legal.capiLegalBasis`), **su valor por defecto es "solo con consentimiento"**, y
  cambiarlo requiere marcarlo explícitamente en la pantalla de Settings.

---

## 6. Lead, correo de confirmación y medición

### 6.1 El endpoint

`POST /api/leads` en la app de landings. Orden exacto:

```
1. Rate limit (IP + landing)              → 429
2. Honeypot relleno                       → 200 y descartar en silencio
3. Zod                                    → 422 con errores por campo
4. Normalizar: email en minúsculas, teléfono a E.164
5. UPSERT por (client_id, email_normalized) → devuelve el lead, nuevo o existente
6. Guardar utm_*, fbclid, fbc, fbp, consentimiento, ip, user_agent, event_id = randomUUID()
7. Encolar lead.capi y lead.confirmation-email
8. 200 → la landing navega a /gracias
```

**Por qué una cola y no `after()`**: `after()` existe en Next 16 y serviría para registrar.
Pero no reintenta, y si la instancia muere el trabajo se pierde. Un evento de conversión
perdido descuadra la optimización de la campaña y un correo de confirmación perdido es un
lead que cree que no le ha llegado el formulario. Las dos cosas van a Trigger.dev, con
reintentos y visibilidad.

### 6.2 Conversions API

```http
POST https://graph.facebook.com/v26.0/<PIXEL_ID>/events?access_token=<token>
{ "data": [{
    "event_name": "Lead",
    "event_time": 1758300000,
    "event_id": "<leads.event_id>",
    "event_source_url": "https://cliente.valme.site/oferta",
    "action_source": "website",
    "user_data": {
      "em": ["<sha256(email normalizado)>"],
      "ph": ["<sha256(teléfono E.164 sin '+')>"],
      "fbc": "<_fbc>", "fbp": "<_fbp>",
      "client_ip_address": "…", "client_user_agent": "…" } }] }
```

La deduplicación con el píxel del navegador es el **mismo `event_id`** en los dos lados:
`fbq('track','Lead',{},{ eventID: '<event_id>' })`. Si no coinciden, Meta cuenta dos
conversiones por lead y el coste por lead del informe sale a la mitad del real.

El hash es SHA-256 del valor normalizado. Un email sin pasar a minúsculas produce un hash
distinto y la atribución se pierde en silencio, sin error: por eso la normalización es el
paso 4 y no algo que haga cada llamada por su cuenta.

### 6.3 Correo de confirmación

Plantilla React Email con logo y colores del kit. El texto se genera junto con la landing y
se aprueba con ella, en su propia pestaña del editor: gracias, qué pasa ahora, datos de
contacto del cliente y, si lo hay, enlace para agendar.

Envío con Resend desde el subdominio verificado del cliente (SPF, DKIM, DMARC configurados en
la semana 0 para que el dominio caliente). Se guarda `email_sends` con el id de Resend; el
webhook `/api/webhooks/resend` actualiza a `delivered`, `bounced` o `complained`, y ese
estado es una columna del listado de leads.

### 6.4 Listado de leads

**Pantalla 9.** Tabla del servidor con paginación por cursor, filtros por fecha, oferta y
campaña, y columna de miniatura del anuncio (vía `leads.ad_creative_id`, que se resuelve del
`utm_content`). Exportación CSV en streaming, para que 10.000 leads no carguen en memoria.
Ficha de solo lectura con UTMs y el texto de consentimiento literal.

---

## 7. Salida a Meta

**Pantalla 7.**

### 7.1 Conexión

Facebook Login for Business con `ads_management`, `business_management` y `pages_show_list`.
El token de corta duración se cambia por uno de larga duración y se guarda cifrado
(AES-256-GCM, clave en `INTEGRATIONS_KEY`) en `integrations`. En `meta` se guardan
`ad_account_id`, `page_id` y `pixel_id`.

### 7.2 La secuencia, y por qué es reanudable

Un job por lanzamiento, contra **v26.0**, todo en `PAUSED`:

| # | Llamada | Se guarda |
| --- | --- | --- |
| 1 | `POST /act_<id>/campaigns` — `objective: OUTCOME_LEADS`, `status: PAUSED`, `special_ad_categories: []` | `campaigns.meta_campaign_id` |
| 2 | `POST /act_<id>/adsets` — `daily_budget` en céntimos, `billing_event: IMPRESSIONS`, `optimization_goal: OFFSITE_CONVERSIONS`, `promoted_object: { pixel_id, custom_event_type: "LEAD" }`, `targeting: { geo_locations, age_min, age_max }`, `PAUSED` | `campaigns.meta_adset_id` |
| 3 | `POST /act_<id>/adimages` (multipart, una por formato aprobado) | `assets.meta_image_hash` |
| 4 | `POST /act_<id>/adcreatives` — `object_story_spec.link_data` con `image_hash`, `message`, `name`, `description`, `call_to_action` y **`url_tags`** | `ad_creatives.meta_creative_id` |
| 5 | `POST /act_<id>/ads` — `adset_id`, `creative:{creative_id}`, `PAUSED` | `ad_creatives.meta_ad_id` |

Las UTMs van en `url_tags` de la creatividad:

```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content=<id del ad_creative en Valme OS>
```

`utm_content` es el id interno, no el de Meta: así el lead se ata al anuncio aunque en Ads
Manager lo renombren.

**Cada paso guarda su id de Meta antes de lanzar el siguiente, y el job salta los pasos que
ya tienen id.** Sin eso, un fallo en el paso 4 con reintento deja dos campañas y dos
conjuntos huérfanos en la cuenta del cliente — y esa cuenta la mira el cliente.

Errores de Meta: código y subcódigo se guardan en `ai_jobs.error` y se traducen a castellano
en la UI para los diez o doce habituales (token caducado, presupuesto bajo el mínimo,
categoría especial requerida…). Un JSON crudo de Meta delante de una persona de marketing no
es un mensaje de error.

### 7.3 Plan B — *Descargar pack*

Mientras el Advanced Access de `ads_management` no llegue, el mismo botón genera un ZIP:
imágenes por formato con nombres `<angulo>-<variante>-<formato>.png` y un `copys.csv` con
texto principal, título, descripción, CTA y la URL final con sus UTMs ya montadas.

No es un apaño: es lo que permite que el piloto capte leads reales en la semana 8 aunque Meta
no haya aprobado nada. El MD ya lo contempla y conviene construirlo **en el sprint 2**, no
en el 4, porque es también la forma de probar los anuncios antes de tener la integración.

---

## 8. Lo que el MVP no hace

Escrito para que no se cuele por la puerta de atrás: SEO, blog y orgánico; vídeo; Google,
LinkedIn y TikTok Ads; activar u optimizar campañas desde la herramienta; A/B testing;
dominios propios del cliente; pipeline o CRM; Meta Lead Ads; WhatsApp; secuencias de
seguimiento y aviso interno al comercial.

---

## 9. Variables de entorno

```bash
# Área (Fase 0)
OS_SESSION_SECRET=            # firma HMAC de la cookie de sesión falsa
OS_ACCESS_PASSWORD=           # contraseña compartida del equipo

# Supabase (Sprint 1)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # solo servidor: ingesta de leads y webhooks
INTEGRATIONS_KEY=             # AES-256-GCM para integrations.credentials

# IA y extracción
ANTHROPIC_API_KEY=
FIRECRAWL_API_KEY=
HF_API_KEY_ID=
HF_API_KEY_SECRET=
HIGGSFIELD_WEBHOOK_URL=

# Correo y anuncios
RESEND_API_KEY=
META_APP_ID=
META_APP_SECRET=
META_API_VERSION=v26.0

TRIGGER_SECRET_KEY=
SENTRY_DSN=
```

---

## 10. Resumen de las tres correcciones al MD

1. **SOUL no acepta imágenes de referencia.** Usar `marketing-studio/image` cuando el cliente
   aporta fotos; SOUL 2 cuando no. (§4.1)
2. **El formato 4:5 no existe en la API.** Generar 3:4 y 9:16, derivar 4:5 y 1:1 por recorte:
   dos generaciones en vez de tres, y un 6 % de pérdida en el formato de feed. (§4.2)
3. **`middleware.ts` es `proxy.ts` en Next 16 y un layout no protege sus hijos.** La
   autorización va en la capa de datos. (Ver `plan-area-admin.md` §1)

Y un regalo: **`branding.personality` de Firecrawl** (tono, energía, público objetivo) da
semilla al bloque Voz del Brand Kit sin gastar una llamada al modelo. (§1.2)
