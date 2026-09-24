# Staging de persistencia SEO

## Objetivo

Este procedimiento aplica y verifica `0005_seo_audit_persistence.sql` exclusivamente en un proyecto Supabase de staging separado. No habilita el repositorio remoto de la aplicacion, no regenera tipos y no modifica produccion.

El ejecutor usa `postgres.js`, ya incluido en el proyecto. No requiere `psql`, Docker ni Supabase CLI.

## Topologia de entornos

| Entorno    | Proposito                       | Datos                           | Despliegue         |
| ---------- | ------------------------------- | ------------------------------- | ------------------ |
| local-demo | Interfaz y desarrollo cotidiano | Fixtures ficticios en navegador | Manual             |
| staging    | Migraciones, RLS e integracion  | Fixtures sinteticos             | GitHub Environment |
| produccion | Usuarios y clientes reales      | Datos reales                    | Fuera de este PR   |

Staging es un proyecto Supabase independiente. Sus credenciales no se comparten con produccion y no se copian datos reales. Esta separacion funciona en todos los planes y permite incorporar despues ramas persistentes o previews aisladas por PR sin cambiar el contrato de seguridad.

## Protecciones

El script `scripts/staging/seo-audit-staging.mjs` falla antes de conectarse cuando:

- falta `STAGING_DB_URL` o `STAGING_SUPABASE_PROJECT_REF`;
- el project ref declarado coincide con el de produccion en `supabase/config.toml`;
- la URL apunta al project ref de produccion;
- la URL no permite demostrar que pertenece al project ref declarado y a un host oficial de Supabase;
- faltan tablas, funciones o roles de la Fase 1;
- detecta una aplicacion parcial de las diez tablas de `0005`.

La URL se mantiene en una variable de entorno, se oculta en los errores y nunca se imprime. Para `apply` y `all` se exige ademas una confirmacion vinculada al project ref exacto. La migracion se aplica dentro de una transaccion: un fallo revierte el bloque completo.

## Preparacion

Crear un proyecto Supabase separado y copiar su **connection string** directa o del pooler. La URL directa contiene el ref en `db.<project-ref>.supabase.co`; la del pooler debe usar el usuario `postgres.<project-ref>`.

En PowerShell, definir las variables solo para la terminal actual:

```powershell
$env:STAGING_SUPABASE_PROJECT_REF = "<project-ref-de-staging>"
$env:STAGING_DB_URL = "<connection-string-de-staging>"
```

No guardar `STAGING_DB_URL` en el repositorio, en comentarios del PR ni en salidas de pruebas.

## Ejecucion

1. Comprobar conexion y Fase 1 sin escribir:

```powershell
npm run staging:seo-audit:preflight
```

2. Autorizar y aplicar exclusivamente `0005`:

```powershell
$env:STAGING_APPLY_CONFIRM = "apply-0005-to-$env:STAGING_SUPABASE_PROJECT_REF"
npm run staging:seo-audit:apply
```

3. Ejecutar los doce escenarios RLS. El fixture se crea dentro de una transaccion y termina en `ROLLBACK`:

```powershell
npm run staging:seo-audit:verify
```

Para un proyecto que ya tiene la Fase 1 preparada se pueden ejecutar los tres pasos seguidos con `npm run staging:seo-audit:all`.

## Ejecucion desde GitHub

Crear en GitHub un Environment llamado `staging` con:

- secret `STAGING_DB_URL`;
- variable `STAGING_SUPABASE_PROJECT_REF`;
- revisores requeridos antes de desplegar, cuando el plan de GitHub lo permita.

El workflow `.github/workflows/seo-audit-staging.yml` solo admite ejecucion manual. Solicita escribir `APPLY-0005-STAGING`, serializa las ejecuciones y realiza pruebas, preflight, migracion y verificacion. No contiene disparadores por `push`, credenciales de produccion ni permisos de escritura sobre el repositorio.

Para ejecutarlo: GitHub > Actions > **SEO audit staging migration** > **Run workflow**. La migracion solo comienza despues de superar las protecciones del Environment.

El workflow independiente `.github/workflows/ci.yml` ejecuta pruebas y build en cada pull request y en cada cambio de `main`. No recibe secretos y cancela ejecuciones antiguas de la misma rama, por lo que el control de calidad escala sin multiplicar trabajo innecesario.

## Criterio de exito

La ejecucion es valida solo cuando:

- el preflight identifica el project ref de staging;
- `0005` queda aplicada por completo, nunca parcialmente;
- aparecen `OK 1` a `OK 12`;
- aparece `VERIFICACION COMPLETA`;
- el ejecutor confirma que el fixture termino en `ROLLBACK`.

Después se regeneran los tipos desde ese mismo proyecto con Supabase CLI y se revisa el diff en un PR separado. Hasta entonces, `local-demo` sigue siendo el unico repositorio habilitado.

## Evolucion

Cuando el volumen de cambios lo justifique y el plan de Supabase lo permita, se pueden añadir previews efimeras por PR y una rama persistente de QA. Deben seguir usando datos sinteticos, credenciales propias y el mismo verificador. Staging permanece como puerta de aceptacion antes de cualquier migracion de produccion.
