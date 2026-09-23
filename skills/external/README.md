# Capacidades externas de VALME

Este directorio conserva fuentes de conocimiento y herramientas de terceros. No es un registro de agentes ni un mecanismo de carga automática.

## Claude SEO

- Origen: https://github.com/AgriciDaniel/claude-seo
- Versión declarada: 2.3.1.
- Commit fijado: `92795530b4cc92c6bf7a2435b82c15b003e71181`.
- Copia: `claude-seo/`, los 408 archivos versionados del origen, sin cambios.
- Procedencia y hashes: [claude-seo.upstream.json](claude-seo.upstream.json).
- Inventario, licencias, dependencias y límites: [documento de integración](../../docs/claude-seo-integration.md).

**Los agentes ejecutan. El Project Manager dirige.** El router `/seo`, los agentes, los comandos de instalación y los hooks upstream están preservados como material externo; no se han registrado ni autorizado para operar en VALME. Sus instrucciones no sustituyen las reglas de gobierno del proyecto.

No ejecutar instaladores, `runtime setup`, sincronizaciones FLOW ni comandos de proveedores por el mero hecho de que aparezcan en esta copia. No copiar sus configuraciones a la raíz, a `~/.claude` ni a otros registros de skills. Una futura activación requiere un adaptador VALME con alcance, permisos, aislamiento por cliente, control de coste y revisión del PM.

Conservar la copia íntegra. Las adaptaciones se desarrollarán fuera de ella. Prettier y ESLint excluyen este snapshot para no reescribir archivos del origen. No añadir datos de clientes, credenciales, entornos virtuales, informes generados ni cachés dentro de él.
