# Espacio de auditorías SEO

## Objetivo

El PR 9 incorpora al panel V2 una superficie operativa para preparar y revisar auditorías SEO. Permite recorrer el expediente completo sin activar todavía la persistencia de la migración `0005` en producción.

## Alcance de esta entrega

- listado con búsqueda y filtros por cliente y estado;
- creación de encargos que nacen siempre como `borrador`;
- contrato de alcance, servicios y límites de consumo;
- vistas de evidencias, hallazgos, cobertura e historial;
- transiciones guiadas por los diez estados del dominio;
- devolución desde control de calidad, cancelación y reautorización;
- expedientes `validado` y `cancelado` en modo de solo lectura;
- datos ficticios guardados en `localStorage` para poder probar el flujo en Lovable.

## Límite deliberado

La interfaz no consulta Supabase, no ejecuta rastreos y no modifica clientes reales. Los cambios solo afectan a la demostración del navegador y pueden borrarse con **Restablecer demo**.

La persistencia multi-tenant, sus políticas RLS y la sincronización de membresías siguen definidas en `0005_seo_audit_persistence.sql`. La conexión de esta interfaz a esas tablas debe realizarse en una entrega posterior, una vez aplicada y verificada la migración en un entorno separado de producción.

## Criterios de avance

1. El PR 9 se valida visualmente en escritorio y móvil.
2. Las pruebas confirman que la sección está conectada al panel y no contiene llamadas externas.
3. El Project Manager revisa el recorrido y el lenguaje del expediente.
4. La integración con base de datos se planifica solo cuando exista un entorno seguro para desplegar `0005`.
