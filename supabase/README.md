# Supabase

Proyecto `tvgtknxjaaughmqpspap` (org Valme, región ca-central-1).

`migrations/` es la fuente de verdad del esquema. Nada se crea a mano en el panel: si
hace falta una tabla, una migración nueva.

## Aplicar las migraciones

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli), desde la raíz del repo:

```bash
npx supabase login
npx supabase link --project-ref tvgtknxjaaughmqpspap   # pide la contraseña de la BD
npx supabase db push                                     # aplica lo que falte
```

`db push` sólo aplica las migraciones que no estén ya en la base de datos.

## Qué hay

| Bloque | Tablas |
| --- | --- |
| Equipo y acceso | `members`, `memberships`, `clients` + `has_client_access()` para RLS |
| Cuentas | `brand_kits`, `brand_kit_versions`, `offers`, `assets`, `ad_creatives`, `campaigns`, `landings`, `leads`, `integrations`, `ai_jobs` |
| Agentes | `agent_runs`, `agent_steps`, la cola pgmq `agent_runs` y sus funciones (`create_agent_run`, `agent_queue_*`) |
| Diagnóstico | `dx_leads`, `audits` |

Todas las tablas tienen RLS. Un miembro (`members.auth_user_id = auth.uid()`) ve los
clientes de sus `memberships`; un admin ve todos. `ai_jobs`, `agent_steps` y `audits`
sólo los escribe `service_role`, que es el worker.

## Antes de meter datos reales

La web todavía entra con el login falso (cookie + contraseña compartida), así que no
lee de aquí: sigue con los datos de demo. Para que lea de Supabase hace falta cambiar
`packages/os/src/auth/` a Supabase Auth y dar de alta a cada miembro en `members` con su
`auth_user_id`. Mientras tanto, esta base de datos sólo la usa el worker.

## Plan gratuito

Un proyecto free se pausa tras una semana sin actividad. El worker consulta la cola
cada pocos segundos, lo que debería contar como actividad mientras esté desplegado.
Conviene comprobarlo en el panel la primera semana.
