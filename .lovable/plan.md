# Fase 1 — Seguridad y autenticación de VALME Search OS

Rama de trabajo: `feat/audit-orchestrator-mvp` (en GitHub, PR en borrador hacia main). Sin publicar, sin desplegar, sin fusionar, sin tocar el motor de auditoría ni conectar servicios externos.

## Qué se reutiliza
- Base de datos existente: tablas clients, agents, approvals, decisions, activity, tasks; tabla de roles aparte `user_roles` con funciones `has_role` / `is_equipo`. Se amplían, no se duplican.
- Interfaz V2 (public/v2) con su identidad, sin cambios visuales salvo la cabecera de sesión.
- Acceso de asistentes (MCP) ya protegido con inicio de sesión.

## Lo que verá el usuario
1. Pantalla «VALME Search OS» con Email, Contraseña y botón «Iniciar sesión»; enlace «¿Has olvidado tu contraseña?»; errores claros en español (credenciales incorrectas, cuenta sin acceso, sesión caducada). Sin botón «Crear cuenta».
2. Recuperación de contraseña: envío de enlace y página para fijar la nueva.
3. Sin sesión válida no se puede ver el panel: cualquier dirección del panel lleva al inicio de sesión.
4. En el panel: nombre del usuario, su rol y botón «Cerrar sesión».
5. Una sección de administración (solo Super Admin) para invitar usuarios, cambiar su rol, asignar o retirar clientes y consultar la actividad.
6. Pantalla «Acceso denegado» cuando alguien intenta abrir un cliente que no le corresponde.

## Roles
- Super Admin: gestiona usuarios, clientes y permisos; ve toda la cartera y la actividad global.
- Project Manager: clientes asignados o toda la cartera si se le concede; revisa, aprueba, rechaza, pide cambios, gestiona planes.
- Equipo: solo clientes asignados; consulta, trabaja tareas, revisa hallazgos; no gestiona usuarios ni permisos.
- Cliente: solo su propia empresa; nunca ve datos internos, agentes, prompts, configuración, otros usuarios ni registros sensibles.

## Reglas de acceso (base de datos y servidor, «denegado por defecto»)
- Nueva relación usuario–cliente (varios a varios) con rol, estado (activo, retirado) y fecha.
- Cada tabla con cliente asociado solo se lee o modifica si el usuario tiene acceso activo a ese cliente, o es Super Admin (o PM con cartera completa).
- Los usuarios Cliente solo leen; no ven agentes, actividad interna ni decisiones internas.
- Las funciones del servidor comprueban siempre: sesión, identidad, rol, acceso al cliente y permiso para la acción; nunca se fían del cliente indicado por el navegador.
- Las futuras tablas de auditoría (ejecuciones, módulos, hallazgos, evidencias, eventos) quedan con una regla preparada y documentada para aplicar el mismo control el día que se creen; en esta fase no se crean.

## Registro de actividad
Nuevo registro de solo añadir (nadie puede editar ni borrar): quién, qué, cuándo, cliente, resultado. Acciones: inicio y cierre de sesión, invitación, cambio de rol, asignación y retirada de cliente, aprobación, rechazo; auditoría iniciada/cancelada quedan previstas.

## Sesiones y doble factor
- Sesiones gestionadas por la plataforma: caducan, se renuevan, se invalidan al cerrar sesión y al retirar un acceso.
- Doble factor: se deja preparada la comprobación del nivel de seguridad de la sesión para poder exigirlo al Super Admin más adelante; no se activa ahora.

## Datos de demostración
Nébula Hogar sigue marcado como demostración. Los datos reales solo llegarán por funciones protegidas; los archivos públicos de la V2 no contendrán nunca información real.

## Necesito de ti
- El email de la primera cuenta Super Admin (la tuya). Se crea por invitación; recibirás un enlace para fijar tu contraseña.

## Detalles técnicos
- Auth: email/contraseña de Lovable Cloud (enable_email_auth), registro público desactivado (disable_signup), invitaciones con la API de administración desde una función de servidor que verifica Super Admin.
- Rutas: `/auth` y `/reset-password` públicas; el panel pasa a `src/routes/_authenticated/panel.tsx` (gate gestionado, ssr:false) que monta la V2; `/` redirige a `/panel` o `/auth`. `/acceso-denegado`. `/admin` bajo un layout que exige super_admin.
- Migración aditiva: ampliar enum `app_role` con `super_admin`, `project_manager`, `cliente` (mantener `admin`/`equipo` por compatibilidad, mapeados); tabla `user_client_access(user_id, client_id, role, status, created_at, granted_by)`; tabla `activity_events(id, actor_id, action, client_id, target_user_id, metadata jsonb, ip, created_at)` append-only; funciones SECURITY DEFINER `is_super_admin()`, `has_client_access(client_id)`, `is_internal()`; reescritura de políticas RLS de las seis tablas con esas funciones; GRANT en cada tabla nueva.
- Servidor: `src/lib/auth/guards.server.ts` (requireRole, requireClientAccess), `src/lib/admin.functions.ts` (invitar, cambiar rol, asignar/retirar cliente, listar actividad) con `requireSupabaseAuth`; `attachSupabaseAuth` en `src/start.ts`.
- Limitación a declarar: el cliente web de la plataforma guarda el token de sesión en el almacenamiento del navegador; es el mecanismo estándar soportado. Se mitiga con caducidad corta, invalidación al cerrar sesión y sin datos sensibles en URLs.
- Documento `docs/04-operations/seguridad-fase-1.md` con el modelo de permisos y la regla para las futuras tablas de auditoría.
- Verificación: pruebas en navegador con cuenta sin sesión, Super Admin, Equipo con un cliente asignado y Cliente; intento de abrir otro cliente por dirección y por llamada directa debe devolver «Acceso denegado».
