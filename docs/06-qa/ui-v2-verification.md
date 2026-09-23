# Verificación de interfaz V2

Fecha: 18 de septiembre de 2026.

## Alcance

Comprobación de la implementación estática con datos ficticios. No se han probado integraciones, ejecución de agentes, comunicaciones ni acciones sobre clientes porque no existen en esta fase.

## Comprobaciones automatizadas

| Área | Resultado | Evidencia |
| --- | --- | --- |
| Sintaxis JavaScript | Superada | node --check src/scripts/app.js |
| Integridad del diff | Superada | git diff --check |
| Estructura HTML y textos alternativos | Superada | idioma, identificadores únicos, textos alternativos y etiqueta de datos ficticios |
| Distribución de 84 clientes | Superada | 62 automático, 12 revisión, 6 bloqueados, 4 onboarding |
| Navegación, filtros y fichas | Superada en arnés DOM | navegación, foco, búsqueda, filtro de estado, ficha de cliente y Agent Pod |
| Evidencias y supervisión | Superada en arnés DOM | aprobar, devolver e iniciar revisión mantienen semánticas distintas |
| Informes | Superada en arnés DOM | aprobar contenido y autorizar envío son acciones separadas |
| Responsive | Superada estáticamente | reglas para 820 px, 600 px, 380 px y suelo de 320 px |
| Contraste | Superada | combinaciones principales entre 5,61:1 y 16,20:1 |

## Validación visual en navegador

Pendiente. El navegador remoto del entorno bloqueó las direcciones localhost y 127.0.0.1, y su política impidió cargar una copia embebida. No se ha intentado sortear esa restricción.

La revisión automatizada confirma la presencia de objetivos táctiles de 44 px, foco visible, salto al contenido, preferencias de accesibilidad y ausencia de llamadas fetch, XHR o WebSocket. Estos controles no sustituyen la inspección visual en un navegador local.

Antes de publicar deben verificarse manualmente:

- Escritorio, tablet y móvil desde 320 px.
- Ausencia de desbordamiento horizontal.
- Recorrido completo por teclado y orden de foco.
- Foco trasladado al título tras cambiar de vista.
- Objetivos táctiles de al menos 44 px.
- Contraste calculado y contraste percibido con IBM Plex cargada.
- prefers-reduced-motion, prefers-contrast y prefers-reduced-transparency.

## Limitaciones conocidas

- Aplicación estática y datos de demostración en memoria.
- Sin persistencia entre recargas.
- Sin conexiones reales ni ejecución externa.
- Los supuestos de capacidad y SLA no están validados operativamente.
