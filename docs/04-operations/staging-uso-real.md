# Trabajar con datos reales en staging

Staging es el entorno real de trabajo mientras producción sigue protegida: base de datos
PostgreSQL de verdad, inicio de sesión de verdad y las mismas reglas de seguridad (RLS)
que tendrá producción. **Clientes** y **Auditorías** usan esos datos; el resto de
secciones del panel siguen siendo demostración y así lo indica la barra superior.

La aplicación publicada en Lovable está conectada a producción y sigue en modo
demostración. Para trabajar contra staging se arranca la aplicación en local.

## Preparación (una sola vez)

1. **Migraciones en staging.** Aplica `0005` y `0006` y verifica los 13 escenarios de
   seguridad con el runner (ver [seo-audit-staging.md](seo-audit-staging.md)):
   `npm run staging:seo-audit:all` con `STAGING_DB_URL`, `STAGING_SUPABASE_PROJECT_REF` y
   `STAGING_APPLY_CONFIRM=apply-0005-to-<ref>`. Es idempotente: si `0005` ya existe,
   reconcilia privilegios y aplica `0006`.
2. **Tu cuenta en staging.** En el panel de Supabase del proyecto de staging:
   Authentication → Users → Add user, con tu correo y una contraseña que solo conozcas tú.
3. **Tu rol.** Da a esa cuenta rol `super_admin` activo con cartera completa:
   `npm run staging:grant-admin -- tu@correo.com` con `STAGING_DB_URL`,
   `STAGING_SUPABASE_PROJECT_REF` y `STAGING_GRANT_CONFIRM=grant-admin-in-<ref>`.
   El script se bloquea si la URL apunta a producción.
4. **Configuración local.** Crea `.env.staging.local` en la raíz (git lo ignora):

   ```
   STAGING_SUPABASE_PROJECT_REF=<ref de staging>
   STAGING_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   La clave publicable está en Supabase → Project Settings → API Keys. Nunca uses aquí
   la clave secreta ni la de producción: el script las rechaza.

## Uso diario

```
npm run dev:staging
```

Abre `http://localhost:4180/panel`, inicia sesión con tu cuenta de staging y verás
«● Staging · datos reales» en la barra superior.

- **Clientes → + Nuevo cliente:** nombre, sector, primer proyecto y dominio.
- **Ficha del cliente:** proyectos, auditorías y «Nueva auditoría →» por proyecto.
- **Archivar** (cliente o auditoría): lo retira del trabajo diario y lo deja en solo
  lectura. No borra nada y se deshace con «Restaurar». Solo managers del cliente.

En Windows, `dev:staging` usa `scripts/staging/vite.dev-staging.config.ts` para sortear
un fallo del plugin `@lovable.dev/mcp-js` con las rutas de Windows. Al arrancar, ese
plugin puede reescribir los saltos de línea de `src/routeTree.gen.ts`,
`src/routes/mcp.ts` y `src/routes/[.well-known]/oauth-protected-resource.ts`: no hay
cambios de contenido y se descartan con `git checkout -- <archivo>`.

## Límites actuales

- Los hallazgos y evidencias del piloto VALME siguen en modo demostración; todavía no
  se cargan en el expediente remoto.
- Solo super admin o Project Manager con cartera completa pueden dar de alta clientes,
  para que quien crea un cliente pueda verlo después.
- Producción no se toca: `0005` y `0006` se aplicarán en Lovable Cloud en un despliegue
  controlado antes del lanzamiento.
