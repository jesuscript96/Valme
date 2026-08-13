# Valme Solutions

Web (**Next.js**) + CMS (**Sanity**). Todo el contenido, las imágenes, los CTAs y el
SEO se gestionan desde Sanity — la web no tiene nada hardcodeado.

## Estructura

- **Raíz** — app Next.js 16 (App Router, React 19, Tailwind v4). Es lo que despliega Vercel.
- **`studio-valme/`** — Sanity Studio (proyecto `zsu74u9b`, dataset `production`).
  Ya desplegado en **https://valme-solutions.sanity.studio**

## Desarrollo local

```bash
# Web
npm install
npm run dev                 # http://localhost:3000

# Studio (en otra terminal)
cd studio-valme
npm install
npm run dev                 # http://localhost:3333
```

## Despliegue en Vercel

1. **Root Directory**: la raíz del repo (la app Next está en la raíz). Vercel detecta Next.js automáticamente.
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
ISR de 60 s como red de seguridad. Ver `.env.example`.
