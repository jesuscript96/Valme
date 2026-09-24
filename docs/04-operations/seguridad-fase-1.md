# Seguridad y autenticación — Fase 1

Principio: **Google verifica quién eres. VALME decide a qué puedes acceder.**

## Autenticación
- Email y contraseña (Lovable Cloud Auth) o Google gestionado por Lovable Cloud (solo identidad, email y perfil básico).
- Registro público desactivado (`disable_signup`). No existe botón «Crear cuenta».
- Recuperación: `/auth` → «¿Has olvidado tu contraseña?» → email → `/reset-password`. Mensaje neutro para no revelar si un email existe.
- Comprobación de contraseñas filtradas activada.
- Retorno de Google: siempre a `/auth` (pública). Solo tras confirmar sesión **y** autorización se navega a `/panel`.
  - Vista previa: `https://id-preview--55967e9c-9dea-4636-86df-ca446b5da950.lovable.app/auth`
  - Publicada: `https://dev-hugger-api.lovable.app/auth`
  - Dominio propio futuro: `https://<dominio>/auth`. Sin comodines.

## Autorización (independiente de la autenticación)
- `user_access`: única fuente de «usuario autorizado» (rol `valme_role`, estado `invitado | activo | desactivado`, cartera completa para PM).
- `user_client_access`: usuario ↔ cliente (varios a varios), estado `activo | retirado`.
- Tras cualquier inicio de sesión, `getMyAccess` (servidor) comprueba sesión, usuario, estado y rol. Si no hay invitación: **denegar → registrar `acceso_rechazado_sin_invitacion` → cerrar e invalidar la sesión en servidor**. La cuenta **no se elimina** automáticamente; la limpieza de cuentas huérfanas será una acción administrativa explícita de Super Admin. Si está desactivado o sin rol: denegar e invalidar la sesión.
- Una sesión válida no abre datos: todas las funciones de acceso (`current_valme_role`, `is_internal`, `has_client_access`) exigen `status = 'activo'`.
- Nunca se infiere nada del dominio del email ni del perfil de Google. Nunca se asigna rol automáticamente. `super_admin` solo desde Administración.

## Vinculación de identidades
Las invitaciones crean la cuenta con el email antes del primer acceso. Si la persona entra con Google usando el mismo email verificado, Lovable Cloud vincula la identidad al mismo usuario: mismo rol, clientes e historial.

## Roles
| Rol | Alcance |
| --- | --- |
| Super Admin | Todo; gestiona usuarios, roles, clientes y actividad |
| Project Manager | Clientes asignados o toda la cartera; decide aprobaciones y planes |
| Equipo | Clientes asignados; trabaja tareas; sin gestión de usuarios ni permisos |
| Cliente | Solo lectura de su empresa (aprobaciones y tareas); nunca agentes, actividad interna ni decisiones |

## Aislamiento (RLS, denegado por defecto)
clients, approvals, tasks: `has_client_access(client_id)`. activity, decisions: además `is_internal()`. agents: `is_internal()`. Escrituras sensibles: `can_manage_clients()`.

## Regla para las futuras tablas de auditoría
`audit_runs`, `audit_modules`, `audit_findings`, `audit_evidence`, `audit_events` deberán llevar `client_id NOT NULL`, GRANT explícito, RLS con `has_client_access(client_id)` (y `is_internal()` para evidencias y eventos internos), y sus funciones de servidor usarán `requireSupabaseAuth` + `requireRole` + `requireClientAccess` (`src/lib/auth/guards.server.ts`). Nunca se confía en el `client_id` del navegador.

## Registro de actividad
`activity_events` es de solo añadir (un disparador bloquea UPDATE y DELETE). Eventos: `login_password_success`, `login_google_success`, `login_google_denied`, `login_password_denied`, `logout`, `acceso_rechazado_sin_invitacion`, `usuario_invitado`, `cambio_de_rol`, `usuario_desactivado`, `usuario_reactivado`, `cliente_asignado`, `acceso_retirado`. Previstos: `auditoria_iniciada`, `auditoria_cancelada`. Nunca tokens ni secretos.

## Sesiones y MFA
Sesiones de la plataforma (caducan y se renuevan; al desactivar a alguien se invalidan sus sesiones). `getMyAccess` devuelve el nivel `aal` para poder exigir doble factor al Super Admin en una fase posterior.

## Secretos
Ninguna credencial en el repositorio. Google usa las credenciales gestionadas; si se quieren propias, se configuran en los ajustes de autenticación de Lovable Cloud.

## Limitaciones conocidas
- El cliente web guarda el token de sesión en el almacenamiento del navegador (mecanismo estándar de la plataforma).
- Los recursos estáticos `/v2/scripts`, `/v2/styles` y `/v2/assets` siguen siendo públicos (el navegador debe poder cargarlos). Sin la estructura del panel no forman una aplicación navegable. Nunca deben contener datos reales.
- Lovable Cloud no permite disparadores sobre las cuentas; la protección frente a cuentas Google no invitadas es: registro desactivado + comprobación de servidor + cierre de sesión. Las cuentas rechazadas quedan como huérfanas hasta que un Super Admin las limpie (acción aún no implementada).
- Doble factor preparado, no exigido.

## Protección de la V2
- Ya no existe `public/v2/index.html`. La estructura del centro de mando vive en `src/lib/v2/shell.html` (solo servidor).
- `/panel` (ruta autenticada) pide la estructura a `getV2Shell`, función de servidor que exige sesión válida y rol interno activo (`super_admin`, `project_manager`, `equipo`). El rol `cliente` no la recibe.
- El panel la monta en un marco (`srcdoc`). Abrir `/v2/index.html` o `/v2/` directamente ya no muestra ningún dashboard.
- La protección depende del servidor, no de JavaScript del navegador.

## Bootstrap del primer Super Admin
Operación administrativa única, fuera de la interfaz pública. No existe endpoint, contraseña maestra, email ni secreto en el repositorio.
1. El PM indica el email por el canal de trabajo con el operador de Lovable Cloud.
2. El operador comprueba en la base de datos: `select count(*) from public.user_access where role = 'super_admin'` → debe ser `0`. Si no, se detiene: los usuarios se gestionan desde Administración.
3. Invitación con la API de administración de Lovable Cloud (`inviteUserByEmail`, `redirectTo` = `<origen>/reset-password`).
4. Alta en `user_access` con `role = 'super_admin'`, `status = 'invitado'`, `full_portfolio = true`.
5. Evento `bootstrap_super_admin` en `activity_events` (actor nulo, `target_user_id` = la cuenta nueva, metadatos sin secretos).
6. Al primer acceso válido, `status` pasa a `activo`. A partir de aquí, todo alta, rol o permiso se hace solo desde Administración.

## Mínimo privilegio: Project Manager (pendiente de aprobación del PM)
Políticas actuales:
- Crear clientes: permitido (`can_manage_clients()`), sin limitación por cartera.
- Modificar clientes: permitido solo en los clientes a los que tiene acceso.
- Modificar agentes: permitido sobre **todos** los agentes, sin limitación por cliente.
Ninguno de estos permisos se ha ampliado ni reducido. Usuarios, roles, asignaciones y permisos: solo Super Admin.
