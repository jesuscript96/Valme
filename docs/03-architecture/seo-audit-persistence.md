# Persistencia de auditorias SEO

Fecha: 24 de septiembre de 2026. Estado: migracion preparada, pendiente de despliegue.

## Alcance

La migracion `drizzle/migrations/0005_seo_audit_persistence.sql` convierte el contrato de auditoria en un modelo PostgreSQL/Supabase persistente y aislado por tenant. No activa crawling, conectores, colas ni escritura externa.

El modelo incorpora:

- `tenants` y `tenant_memberships` para separar organizaciones;
- `projects` para relacionar un cliente con un dominio operativo;
- `seo_audits` para el contrato versionado y su estado;
- `seo_audit_access_refs` para referencias de acceso sin credenciales;
- `seo_audit_evidence` para observaciones y artefactos;
- `seo_audit_findings` y `seo_finding_evidence` para hallazgos trazables;
- `seo_service_coverage` para declarar cobertura por servicio;
- `seo_audit_state_events` como historial inmutable de estados.

## Limites de seguridad

Cada tabla operativa incluye `tenant_id`. Las relaciones cliente-proyecto-auditoria y auditoria-hallazgo-evidencia usan claves foraneas compuestas, por lo que PostgreSQL rechaza relaciones entre tenants aunque una aplicacion envie identificadores inconsistentes.

La migracion define cuatro roles de tenant:

| Rol        | Lectura | Contribucion | Autorizar/validar |
| ---------- | ------- | ------------ | ----------------- |
| `owner`    | Si      | Si           | Si                |
| `manager`  | Si      | Si           | Si                |
| `member`   | Si      | Si           | No                |
| `reviewer` | Si      | No           | No                |

RLS se aplica en la base de datos. Las operaciones con usuarios autenticados deben conservar su JWT para que `auth.uid()` y las politicas puedan evaluar la membresia. El cliente `service_role` omite RLS y solo debe utilizarse en procesos internos de confianza.

No existen columnas para contrasenas, tokens, API keys o credenciales. `access_ref` es un identificador opaco hacia un almacen seguro futuro; el `CHECK` de la tabla tambien rechaza tipos de acceso que aparenten contener secretos.

## Gobierno persistente

Una auditoria nueva debe comenzar en `borrador`. La funcion `seo_audit_transition_allowed` refleja `ALLOWED_TRANSITIONS` del dominio TypeScript. Un trigger rechaza transiciones invalidas y evita ampliar el alcance despues de salir de `borrador` o `devuelto`.

### Autorizacion y reautorizacion

- Ningun estado ejecutable (`en_cola`, `en_ejecucion`) es alcanzable sin pasar por `autorizado`. `devuelto` ya no puede saltar a `en_ejecucion`.
- `authorized_by` y `authorization_ref` solo se fijan en la transicion `pendiente_autorizacion -> autorizado`, la hace un owner o manager efectivo y `authorized_by` debe ser el propio usuario.
- Volver a `borrador` o `pendiente_autorizacion` anula la autorizacion anterior. Cambiar en `devuelto` dominios, URLs, servicios, capacidades, mercados, idiomas, alcance, limites, coste o version del contrato tambien la anula.
- Reanudar una auditoria devuelta exige `devuelto -> pendiente_autorizacion -> autorizado -> en_cola/en_ejecucion`.
- `validado` y `cancelado` son estados terminales tambien para sus artefactos: no se pueden crear ni modificar referencias de acceso, evidencias, hallazgos, enlaces de evidencia o cobertura. La lectura autorizada se conserva.

### Rol efectivo en el tenant

`effective_tenant_role` toma el menor privilegio entre la membresia del tenant (owner > manager > member > reviewer) y el rol VALME vigente (super_admin > project_manager > equipo > cliente), solo con `status = 'activo'`. Consecuencias:

- Un Project Manager degradado a `equipo` pasa a `member` en todos los tenants, sin actualizar sus membresias, y solo ve los clientes que tenga asignados.
- Gestionar clientes exige `owner` o `manager` efectivo en ese tenant, ademas del permiso global de gestion. Un `project_manager` global limitado a `member` en un tenant puede contribuir, pero no crear ni modificar clientes.
- `cliente` + `reviewer` es valido y de solo lectura: tenant, cliente, proyecto, auditoria, hallazgos y cobertura de sus clientes asignados. Nunca evidencias, enlaces de evidencia, referencias de acceso ni historial de estados, y no puede crear ni actualizar.

### Verificacion

`scripts/staging/verify_seo_audit_rls.sql` es la prueba real de permisos: se ejecuta contra PostgreSQL con 0000-0005 aplicadas, dentro de una transaccion con `ROLLBACK`, y cubre 12 escenarios positivos y negativos con SQLSTATE esperado explicito. Las pruebas de `persistence.test.ts` solo comprueban el texto de la migracion.

Las transiciones a `autorizado` y `validado` requieren rol `owner` o `manager`. Bloquear, devolver o cancelar exige un motivo. Cada cambio de estado crea automaticamente un registro en `seo_audit_state_events`.

La auditoria validada sigue sin autorizar la ejecucion de un plan. Esa separacion continua siendo responsabilidad del dominio y de las futuras tablas de planificacion.

## Compatibilidad

Los clientes ficticios existentes se asignan al tenant fijo `VALME Demo`. Las membresias de ese tenant derivan de `public.user_access` (Fase 1), nunca de `user_roles`:

- solo usuarios con `status = 'activo'`;
- solo roles internos, con mapeo explicito: `super_admin` -> `owner`, `project_manager` -> `manager`, `equipo` -> `member`;
- invitados, desactivados y el rol `cliente` no entran en el tenant.

El trigger `user_access_sync_demo_membership` mantiene esa correspondencia en altas, activaciones, desactivaciones, cambios de rol y bajas. Ademas, `has_tenant_role` exige en cada consulta que `user_access.status = 'activo'` y que el rol del tenant no supere el rol VALME vigente: un Project Manager degradado a Equipo pierde `manager` en todos los tenants aunque conserve la fila de membresia.

Evidencias, enlaces de evidencia, referencias de acceso e historial de estados exigen tambien `public.is_internal()`: un usuario cliente no los lee aunque figure como `reviewer`. Este tenant no es un valor por defecto: clientes y proyectos nuevos deben declarar su tenant.

`drizzle/schema.ts` permanece intacto porque Lovable lo marca como autogenerado. La migracion SQL custom y el diario de Drizzle son la fuente versionada de esta entrega. Los tipos de auditoria se regeneran desde staging en `src/integrations/supabase/seo-audit-staging.types.ts`; `src/integrations/supabase/types.ts` queda reservado para la sincronizacion automatica de Lovable Cloud.

## Verificacion en staging

`scripts/staging/verify_seo_audit_rls.sql` se ejecuta contra PostgreSQL con `0000`-`0005` aplicadas, dentro de una transaccion que termina en `ROLLBACK`. Crea su propio fixture (dos tenants, PM de cada tenant, un usuario cliente, un invitado, un PM que se degrada, un usuario de equipo que se desactiva y un PM global limitado a `member`) y comprueba antes que las 10 tablas tienen filas en ambos tenants.

### Contrato del verificador

Cada escritura tiene uno de tres resultados esperados, nunca intercambiables:

- `pg_temp.rechazado(sql, etiqueta, sqlstate, patron)`: debe lanzar exactamente ese SQLSTATE y, si se indica, un mensaje que cumpla el patron. Una clave foranea (`23503`), columna inexistente (`42703`), sintaxis (`42601`), unicidad (`23505`) o check (`23514`) hace fallar la verificacion.
- `pg_temp.sin_efecto(sql, etiqueta)`: debe ejecutarse sin error y afectar a 0 filas (RLS filtra la fila).
- `pg_temp.permitido(sql, etiqueta)`: debe ejecutarse sin error y afectar al menos a una fila.

SQLSTATE usados: `42501` para falta de GRANT (`permission denied for table ...`) o WITH CHECK de RLS (`new row violates row-level security policy ...`); `P0001` para las excepciones de los triggers, con su mensaje concreto.

### Escenarios

- `1`: sincronizacion de membresias del tenant de demostracion.
- `2-3`: cross-tenant en ambos sentidos (PM A contra B y PM B contra A) sobre las 10 tablas: no lee, no inserta (42501) y no modifica (0 filas con GRANT UPDATE; 42501 sin el).
- `4`: usuario cliente con lectura no interna y matriz de denegacion de escrituras sobre `clients` y las 10 tablas nuevas dentro de su propio tenant.
- `5`: toda auditoria nace en `borrador` (P0001).
- `6-7`: autorizacion solo por manager, reautorizacion obligatoria e invalidacion al cambiar alcance.
- `8`: PM degradado: una auditoria de un cliente que sigue asignado, visible y en `pendiente_autorizacion`, no puede pasar a `autorizado` (P0001, falta de rol manager); conserva operaciones de member (actualizar hallazgo, registrar evidencia, devolver con motivo).
- `9`: usuario desactivado pierde el acceso previo.
- `10`: DELETE: catalogo sin privilegio `DELETE`/`TRUNCATE` ni politicas DELETE/ALL en las 10 tablas, y DELETE real sobre una fila visible de cada tabla rechazado con 42501; la fila sigue existiendo.
- `11`: inmutabilidad terminal: `validado` y `cancelado` conservan lectura, pero rechazan todos los INSERT/UPDATE de sus cinco tipos de artefactos hijos y mantienen los datos originales.
- `12`: limite del rol efectivo: un `project_manager` global con membresia `member` no crea ni actualiza clientes; tras elevar la membresia a `manager`, ambas operaciones se permiten.

Ejecucion recomendada: `npm run staging:seo-audit:verify`, despues del preflight y de aplicar `0005` mediante el procedimiento protegido de `docs/04-operations/seo-audit-staging.md`. El SQL tambien admite `psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f scripts/staging/verify_seo_audit_rls.sql`. Termina con `VERIFICACION COMPLETA`; cualquier fallo aborta con `FALLO: ...`.

Las pruebas de `persistence.test.ts` solo comprueban el texto de la migracion y del guion; no sustituyen su ejecucion en PostgreSQL.

## Despliegue

Antes de aplicar `0005` en produccion:

1. Crear una copia de seguridad.
2. Ejecutar el script de verificacion en staging y confirmar `VERIFICACION COMPLETA`.
3. Confirmar que los usuarios activos internos de `user_access` tienen membresia en `VALME Demo` y ningun `cliente` la tiene.
4. Probar transiciones validas e invalidas, incluida autorizacion por `manager`.
5. Regenerar los tipos de Supabase y revisar el diff resultante.
6. Desplegar la aplicacion que consuma estas tablas en una entrega posterior.
