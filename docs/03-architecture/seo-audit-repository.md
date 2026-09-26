# Repositorio de auditorías SEO

## Propósito

El PR 10 separa la interfaz de Auditorías de su mecanismo de almacenamiento. La vista deja de leer y escribir directamente en `localStorage` y utiliza un repositorio explícito, preparado para sustituirse por una implementación remota cuando exista un entorno seguro.

## Modo activo

`local-demo` es el único modo habilitado. Conserva los datos ficticios en el navegador mediante un sobre versionado:

- `schemaVersion`: versión del formato local;
- `savedAt`: fecha de escritura;
- `records`: colección de expedientes ficticios.

El adaptador migra automáticamente el array utilizado por el PR 9 al formato versionado. Si el navegador bloquea el almacenamiento, continúa en memoria, lo indica en la interfaz y no afirma que los cambios estén guardados.

Si encuentra un sobre con una versión de esquema que no reconoce, trabaja en memoria y no lo sobrescribe, ni siquiera con **Restablecer demo**, para no destruir datos guardados por una versión posterior.

Todas las operaciones son asíncronas para que una futura implementación remota pueda respetar el mismo límite arquitectónico sin introducir llamadas de red directamente en la vista.

## Bloqueo remoto

Solicitar cualquier modo distinto de `local-demo` activa un repositorio cerrado: permite mostrar los datos iniciales, pero rechaza escrituras con `remote-not-ready`. No existe conmutación automática a Supabase, ni llamadas HTTP, credenciales o clientes de red en el adaptador.

La capa de servidor también falla cerrada. `loadSeoAuditWorkspace`, `listSeoAudits`, `createSeoAuditDraft` y `transitionSeoAudit` exigen una sesión Supabase válida. La activación requiere simultáneamente las variables exclusivamente de servidor `SEO_AUDIT_REMOTE_ENABLED=true`, `SEO_AUDIT_REMOTE_ENVIRONMENT=staging` y `SEO_AUDIT_REMOTE_PROJECT_REF`, además de que esta última coincida con el host de `SUPABASE_URL`. La interfaz nunca lee esas variables: el servidor decide el modo y lo comunica al iframe autenticado.

## Puente de la interfaz V2

El centro de mando se sirve dentro de un iframe `srcDoc`. El componente React padre es el único puente hacia las funciones de servidor:

- solo acepta peticiones cuyo `event.source` coincide con el iframe creado por el panel;
- el iframe solo acepta configuración y respuestas procedentes de `window.parent`;
- el canal expone tres operaciones concretas: cargar el contexto visible, crear un borrador y solicitar una transición;
- no expone un guardado masivo, un cliente Supabase, tokens ni variables de entorno;
- un fallo remoto se muestra como tal y nunca carga silenciosamente la demostración local;
- el análisis web y **Restablecer demo** permanecen limitados al modo local.

Cuando el modo remoto está activo, los selectores se construyen con los clientes y proyectos que RLS permite ver. La creación solo envía `projectId` y los campos autorizables; tenant, cliente, solicitante y estado siguen derivándose en servidor.

## Frontera de confianza del servidor

Las funciones viven en `src/lib/seo-audit/repository.functions.ts` y delegan en `repository.server.ts`:

- usan el cliente Supabase autenticado con el token de la persona; nunca importan el cliente administrador ni `service_role`;
- listar devuelve solo las filas que RLS permite leer;
- crear recibe `projectId`, resuelve en servidor el `tenant_id` y `client_id` del proyecto visible y fija `requested_by` al usuario autenticado;
- una auditoría nueva siempre se inserta como `borrador`, sin campos de autorización;
- transicionar valida la máquina de estados en aplicación y vuelve a someter la operación a las políticas y triggers de PostgreSQL;
- la actualización incluye el estado anterior esperado, por lo que una transición concurrente no sobrescribe silenciosamente otra;
- proyectos y auditorías no visibles se tratan como ausentes, sin confirmar si existen en otro tenant;
- un fallo de red o base de datos se propaga; nunca cae automáticamente a datos locales que pudieran aparentar persistencia remota.

## Condiciones para habilitar Supabase

1. Aplicar `0005_seo_audit_persistence.sql` en un proyecto de staging separado.
2. Ejecutar `verify_seo_audit_rls.sql` y obtener los 12 escenarios correctos con `ROLLBACK`.
3. Regenerar `src/integrations/supabase/seo-audit-staging.types.ts` desde ese proyecto; no editarlo manualmente. `src/integrations/supabase/types.ts` pertenece a la sincronizacion automatica de Lovable Cloud.
4. Implementar funciones de servidor autenticadas que operen con el cliente del usuario y respeten RLS. El navegador no recibirá `service_role`.
5. Probar lectura, creación de borradores, transiciones, aislamiento entre tenants y fallos de red.
6. Activar el modo remoto mediante una configuración explícita y reversible, manteniendo `local-demo` para las vistas de demostración.

Hasta completar estos puntos, la aplicación no consulta las tablas de auditoría ni modifica producción.

Los pasos 1 a 4 quedaron completados: `0005` está aplicada en staging, los doce escenarios RLS pasan, los tipos se regeneraron mediante el workflow protegido y las funciones autenticadas de servidor están implementadas. El puente reversible del paso 6 está implementado, pero la variable no se define en ningún entorno desde el repositorio. Antes de activarlo debe completarse el paso 5 con una sesión real en staging y validar lectura, creación, transición, aislamiento y fallo de red de extremo a extremo.

El procedimiento operativo y el ejecutor protegido para los tres primeros pasos se documentan en `docs/04-operations/seo-audit-staging.md`.
