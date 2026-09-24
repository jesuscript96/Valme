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

## Inicio de sesión con Google (añadido)
Principio: «Google verifica quién eres. VALME decide a qué puedes acceder.»

Pantalla `/auth`: Email, Contraseña, botón «Iniciar sesión», separador «o», botón «Continuar con Google», enlace «¿Has olvidado tu contraseña?». Sin «Crear cuenta» ni «Registrarse». Identidad VALME vigente (negro, marfil, IBM Plex, acento teja de la Ruta 3 «El Corte»; el lima ya no es acento, se mantiene así salvo que indiques lo contrario).

Reglas:
- Google no crea acceso. Solo entra quien ya fue invitado, existe como usuario autorizado, tiene rol válido y estado activo.
- Si no se cumple: mensaje «Tu cuenta no tiene acceso a VALME Search OS. Solicita acceso al administrador.», se cierra la sesión y se registra `login_google_denied`.
- No se asigna nunca rol, cliente ni permiso automáticamente; nunca se infiere nada por el dominio del email ni por datos del perfil de Google.
- Usuarios desactivados o con acceso retirado quedan bloqueados aunque Google los autentique.
- `super_admin` solo se asigna por el flujo administrativo protegido; se conserva el acceso por email y contraseña como vía de recuperación.
- Vinculación: si la persona invitada entra con Google usando exactamente el mismo email verificado, se mantiene el mismo usuario, rol, clientes, historial y permisos; no se crean perfiles duplicados.
- Solo se pide identidad, email y perfil básico; nunca Gmail, Drive, Calendar ni contactos.
- Registro de actividad: `login_password_success`, `login_google_success`, `login_google_denied`, `logout`; nunca se guardan tokens ni secretos.

Cómo se hace cumplir (en servidor y base de datos, no solo en pantalla):
- Tabla `user_access(user_id, email, status activo/desactivado, invited_by, invited_at)`: la única fuente de «usuario autorizado». Las invitaciones de Super Admin crean la cuenta con ese email antes de su primer acceso.
- Protección equivalente a «antes de crear usuario»: un disparador de validación en la base de datos rechaza la creación de cualquier cuenta nueva cuyo email no esté en la lista de invitaciones pendientes. Así, una cuenta Google nunca invitada no llega a existir. Si el proveedor no permite bloquear la creación por esa vía, la cuenta creada queda sin rol ni acceso, se marca rechazada y se elimina desde servidor.
- Tras volver de Google y antes de montar `/panel`, una función de servidor comprueba sesión, usuario existente, estado activo, rol válido y permisos; si falla, cierra sesión y muestra el mensaje de acceso denegado. Las reglas de acceso de la base de datos también exigen estado activo, así que una sesión válida sola no abre datos.
- Callback: vuelve a una página pública (`/auth`), nunca directo a `/panel`; el destino se guarda aparte y solo se aplica tras confirmar la sesión. Direcciones exactas, sin comodines en producción.
- Secretos: se usa el acceso de Google gestionado por Lovable Cloud; nada de credenciales en el repositorio ni en el chat. Si más adelante quieres tus propias credenciales de Google, se configuran en los ajustes de autenticación de Lovable Cloud.

Direcciones de retorno a registrar/permitir:
- Vista previa: https://id-preview--55967e9c-9dea-4636-86df-ca446b5da950.lovable.app/auth
- Publicada: https://dev-hugger-api.lovable.app/auth
- Dominio propio futuro: la dirección equivalente terminada en /auth.

Pruebas obligatorias añadidas:
1. Usuario autorizado entra con Google y conserva rol y clientes.
2. Cuenta Google nunca invitada: acceso denegado, sin rol ni cliente, sin cuenta creada.
3. Cliente autorizado vía Google cambia el cliente en la dirección o en la llamada: bloqueado.
4. Usuario desactivado entra con Google: denegado.
5. Usuario de email/contraseña entra luego con Google con el mismo email: un solo perfil, permisos intactos.
6. La pantalla de Google solo pide identidad, email y perfil básico.
Las pruebas que requieren una cuenta Google real (1, 2, 4, 5) necesitarán que tú pulses el botón en la vista previa; las marcaré como «pendiente de tu comprobación» si no puedo realizarlas yo.

Documentación: se añade a `docs/04-operations/seguridad-fase-1.md` el flujo Google y email, autenticación frente a autorización, bloqueo del registro público, vinculación, redirecciones, usuarios desactivados y manejo de secretos.

Informe final incluirá los diez puntos pedidos, incluida la confirmación de que no hay secretos en el repositorio.

Detalle técnico Google: `supabase--configure_social_auth` con `google` (gestionado), `lovable.auth.signInWithOAuth("google", { redirect_uri: origin + "/auth" })`; `disable_signup` activo; disparador BEFORE INSERT no es posible en el esquema `auth`, por lo que la protección real se aplica con la comprobación de invitación en `user_access` + guard de servidor + RLS que exige `status = 'activo'`, y limpieza server-side de cuentas no invitadas. Si la configuración del proveedor rechaza el primer acceso Google para usuarios invitados por email, se documentará y se ajustará con vinculación manual desde el panel de administración.
