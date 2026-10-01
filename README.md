# Valme Solutions

Monorepo con npm workspaces:

| Carpeta | Qué es | Dónde corre |
| --- | --- | --- |
| `apps/web` | Web pública + área de admin (Valme OS). Next.js 16, React 19, Tailwind v4 | Vercel |
| `apps/worker` | Backend de agentes: cola sobre Postgres (pgmq) + bucle de herramientas con Claude | Coolify (Hetzner) |
| `apps/worker/sandbox` | Chromium aislado al que se conecta el worker para navegar | Coolify (Hetzner) |
| `packages/os` | `@valme/os`: dominio, proveedores, auditoría y acceso a datos. Lo comparten web y worker | — |
| `supabase/` | Migraciones del esquema (Supabase CLI) | Supabase |
| `studio-valme/` | Sanity Studio (proyecto `zsu74u9b`, dataset `production`), fuera de los workspaces | https://valme-solutions.sanity.studio |

El contenido de la web sale de `apps/web/src/content/seed.ts` por defecto. Sanity sólo se
lee con `NEXT_PUBLIC_USE_SANITY=1` (ver `apps/web/src/sanity/env.ts`).

## Desarrollo local

```bash
npm install                 # una vez, en la raíz: instala todos los workspaces
npm run dev                 # web en http://localhost:3000 (variables en apps/web/.env.local)
npm run worker              # worker de agentes (variables en apps/worker/.env.local)
npm run check               # tipos + lint + tests de todos los workspaces
npm run audit -- dominio.com

# Studio (en otra terminal)
cd studio-valme
npm install
npm run dev                 # http://localhost:3333
```

Todas las variables de entorno, con lo que hace cada una, están en `.env.example`.

## Despliegue en Vercel

1. **Root Directory**: `apps/web`. Deja activado *Include files outside the root directory*:
   la web importa `packages/os`. Vercel detecta Next.js y los workspaces solo.
2. **Variables de entorno** (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SANITY_PROJECT_ID=zsu74u9b`
   - `NEXT_PUBLIC_SANITY_DATASET=production`
   - `SANITY_REVALIDATE_SECRET=` (una cadena aleatoria; debe coincidir con el webhook de Sanity)

   > El build **falla** si faltan las dos primeras variables.
3. **Webhook** (Sanity → Manage → API → Webhooks): URL `https://<dominio>/api/revalidate`,
   dataset `production`, trigger create/update/delete, proyección `{ "_type": _type }`, secreto = `SANITY_REVALIDATE_SECRET`.
4. **CORS** (Sanity → Manage → API → CORS origins): añade el dominio de producción.

## Actualizar contenido

Edita en el Studio → **Publicar**. El webhook revalida la web al instante; además hay
ISR de 60 s como red de seguridad.
