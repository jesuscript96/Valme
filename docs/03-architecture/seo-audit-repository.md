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

## Condiciones para habilitar Supabase

1. Aplicar `0005_seo_audit_persistence.sql` en un proyecto de staging separado.
2. Ejecutar `verify_seo_audit_rls.sql` y obtener los 12 escenarios correctos con `ROLLBACK`.
3. Regenerar `src/integrations/supabase/types.ts` desde ese proyecto; no editarlo manualmente.
4. Implementar funciones de servidor autenticadas que operen con el cliente del usuario y respeten RLS. El navegador no recibirá `service_role`.
5. Probar lectura, creación de borradores, transiciones, aislamiento entre tenants y fallos de red.
6. Activar el modo remoto mediante una configuración explícita y reversible, manteniendo `local-demo` para las vistas de demostración.

Hasta completar estos puntos, la aplicación no consulta las tablas de auditoría ni modifica producción.

El procedimiento operativo y el ejecutor protegido para los tres primeros pasos se documentan en `docs/04-operations/seo-audit-staging.md`.
