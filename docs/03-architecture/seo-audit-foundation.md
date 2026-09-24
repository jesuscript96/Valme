# Núcleo nativo de auditoría SEO

Fecha: 24 de septiembre de 2026. Estado: primera base de dominio, sin ejecución real.

## Principio

**Los agentes ejecutan. El Project Manager dirige.**

Claude SEO queda como fuente externa de conocimiento, criterios y posibles herramientas futuras. No orquesta VALME Search OS, no crea Agent Pods nuevos y no se registra automáticamente como skill operativa.

## Ubicación

El núcleo vive en `src/lib/seo-audit/` porque la arquitectura real ya centraliza las herramientas consultivas en `src/lib/mcp/` y la ruta `/mcp` importa desde librerías TypeScript. Mantener auditoría como módulo de dominio evita acoplarla al frontend V2 de demostración o a la ruta MCP autogenerada por Lovable.

Archivos principales:

- `types.ts`: estados, tipos de hallazgos, evidencias, cobertura, capacidades y errores estructurados.
- `schemas.ts`: contratos Zod para validar encargos, hallazgos, evidencias, cobertura y capacidades.
- `states.ts`: máquina de estados y transiciones permitidas.
- `capabilities.ts`: catálogo VALME de capacidades SEO/AEO/GEO relacionadas con Claude SEO.
- `governance.ts`: reglas puras de alcance, accesos, inicio, cobertura, calidad, devolución y validación.

## Contrato de auditoría

`SeoAuditContract` representa un encargo versionado y separado por `tenantId`, `clientId` y `projectId`. Incluye servicios, solicitante, autorización, dominio principal, URLs iniciales, mercados, idiomas, alcance autorizado, capacidades solicitadas, referencias a accesos, límites de páginas/tiempo/coste, fecha, versión y estado.

El contrato no guarda credenciales. Los accesos se referencian por `accessId`, tipo y estado. Cualquier secreto o token debe vivir en un mecanismo seguro externo que todavía no forma parte de esta entrega.

Autorizar una auditoría permite iniciar la recogida de evidencias dentro del alcance autorizado. No autoriza:

- cambios en la web;
- publicación;
- comunicaciones al cliente;
- gasto adicional;
- ejecución de un plan posterior;
- ampliación de alcance por parte de agentes.

## Estados

Estados nativos:

1. `borrador`
2. `pendiente_autorizacion`
3. `autorizado`
4. `en_cola`
5. `en_ejecucion`
6. `bloqueado`
7. `control_calidad`
8. `devuelto`
9. `validado`
10. `cancelado`

Las transiciones están en `ALLOWED_TRANSITIONS`. Cualquier transición inválida lanza `SeoAuditGovernanceError` con `code`, `message` e `issues`.

`validado` es terminal para la auditoría. Permite preparar una propuesta de plan versionado, pero `validateAuditFromQuality` devuelve explícitamente `planExecutionApproved: false`.

## Hallazgos y evidencias

Un `Finding` contiene ID estable, auditoría, categoría, servicio contratado relacionado, título, descripción, prioridad, impacto, recomendación, estado, tipo de resultado, confianza, fuentes, evidencias, fecha de observación, responsable, acceso dependiente, limitaciones y si requiere aprobación humana.

El tipo de resultado distingue:

- `medicion`;
- `observacion`;
- `estimacion`;
- `heuristica`.

Una `Evidence` puede representar URL o recurso analizado, fuente, fecha, método de obtención, dato observado, artefacto, hash de integridad, contenido externo/no confiable, período de medición, dispositivo, mercado, idioma y nivel URL/origen.

Toda evidencia externa se considera no confiable hasta que una regla de calidad la acepte para el contexto concreto.

## Cobertura

`calculateCoverageByService` produce cobertura por servicio contratado:

- `evidencia_suficiente`;
- `cobertura_parcial`;
- `bloqueo_por_acceso`;
- `ausencia_declarada`;
- `pendiente_justificado`.

Control de calidad no debe aceptar una auditoría si falta evidencia o declaración por servicio. Los bloqueos por acceso no se sustituyen por estimaciones.

## Ocho Agent Pods

La arquitectura principal sigue siendo:

1. Onboarding y accesos
2. Auditoría SEO
3. Estrategia y planificación
4. SEO técnico
5. Contenidos
6. AEO/GEO y citabilidad
7. Analítica e informes
8. Control de calidad

El catálogo de capacidades asigna cada capacidad a uno de estos pods. Los agentes de Claude SEO siguen dentro del snapshot externo y no se convierten en pods VALME.

## Relación con Claude SEO

Cada capacidad indica el componente Claude SEO relacionado, pero su estado queda en `referencia` o `disenada`. Ninguna capacidad se marca como `disponible` porque todavía no existe adaptador, cola, conector seguro ni ejecución real.

La entrega no carga `CLAUDE.md`, `AGENTS.md`, hooks, workflows ni configuraciones internas del snapshot como instrucciones del repositorio principal. Tampoco ejecuta scripts Python, instaladores o proveedores.

## Persistencia

La migración incremental `0005_seo_audit_persistence.sql` materializa el contrato mediante tenants, membresías, proyectos, auditorías, referencias de acceso, hallazgos, evidencias, cobertura y eventos de estado. Las claves foráneas compuestas y RLS aíslan cada organización en PostgreSQL.

La migración está preparada pero no aplicada. La arquitectura, límites y procedimiento de despliegue se documentan en `seo-audit-persistence.md`. `drizzle/schema.ts` continúa intacto porque Lovable lo marca como autogenerado; los tipos de Supabase se regenerarán después de desplegar contra la base real.

## MCP

Se añaden tres herramientas de consulta:

- `list_seo_capabilities`;
- `explain_seo_audit_contract`;
- `list_seo_audit_states`.

Son solo lectura, idempotentes, sin red externa, sin Python, sin datos reales de clientes y sin exposición de rutas internas completas, secretos o prompts externos.

## Próximos pasos para auditoría real

Antes de ejecutar una auditoría real faltan:

- desplegar y verificar la persistencia multi-tenant preparada;
- almacenamiento seguro de referencias de acceso;
- cola de trabajos;
- adaptadores de lectura con límites de red, robots, timeouts y coste;
- fixtures de HTML/artefactos aportados por el cliente;
- conectores GSC/GA4/PSI/CrUX separados;
- política de crawling por scope y rate limit;
- renderer de informes VALME;
- revisión humana de calidad y autorización de plan versionado.

Primera integración recomendada: checks locales sobre artefactos aportados, sin red. Después crawling de lectura con scope cerrado. Después conectores GSC/GA4/PSI/CrUX. Las escrituras externas, publicaciones, envíos y costes requieren PRs y aprobaciones independientes.
