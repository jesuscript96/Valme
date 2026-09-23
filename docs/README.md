# Documentación de VALME Search OS

Esta carpeta es el mapa de decisión del proyecto. La numeración indica el orden recomendado de lectura.

## Estructura

- `00-product/`: propósito, usuarios, alcance y límites.
- `01-roadmap/`: etapas de construcción y criterios para avanzar.
- `02-design/`: sistema visual, interacción y accesibilidad.
- `03-architecture/`: componentes técnicos, datos e integraciones.
- `04-operations/`: supervisión del Project Manager, aprobaciones y control de calidad.
- `06-qa/`: resultados de pruebas, limitaciones y validaciones pendientes.

## V2

- [Dirección visual V2](02-design/ui-v2-direction.md)
- [Verificación de interfaz V2](06-qa/ui-v2-verification.md)

## Capacidades externas

- [Integración aislada de Claude SEO](claude-seo-integration.md): inventario, correspondencia con los ocho Agent Pods, límites y actualización del snapshot. Capacidades conservadas, todavía sin activar.

## Regla de trabajo

1. Primero se define el objetivo.
2. Después se diseña el flujo.
3. A continuación se implementa en una rama.
4. Se prueba con datos de demostración.
5. El Project Manager revisa.
6. Solo entonces se incorpora a `main` y se publica.

La IA puede proponer, preparar y automatizar. Las publicaciones, cambios en clientes, presupuestos y acciones externas requieren aprobación humana.
