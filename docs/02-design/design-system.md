# Sistema de diseño — VALME Search OS

## Dirección

La interfaz debe transmitir **calma, control, precisión y discreción**. La referencia de interacción es [apple-design de Emil Kowalski](https://github.com/emilkowalski/skills/tree/main/skills/apple-design), adaptada a la identidad de VALME. No se busca copiar macOS o iOS.

## Identidad VALME

- Base: negro, blanco cálido y grises neutros.
- Acento principal: verde lima, reservado para acción, progreso y confirmación.
- Tipografía: IBM Plex Sans para interfaz e IBM Plex Mono para metadatos, con fuentes del sistema como respaldo.
- Densidad: profesional; suficiente información sin sensación de saturación.
- Forma: radios contenidos, sombras suaves y jerarquía clara.

## Principios de interacción

1. **Respuesta inmediata.** Botones y controles reaccionan al presionar, no después.
2. **Control humano.** La IA propone; el usuario puede revisar, cancelar o corregir.
3. **Continuidad espacial.** Un panel entra y sale por el mismo lugar.
4. **Interrupción.** Ninguna animación debe bloquear una nueva acción.
5. **Simplicidad, no vacío.** Mostrar primero la acción habitual y dejar lo avanzado un nivel por debajo.
6. **Feedback útil.** Diferenciar estado, finalización, advertencia y error.
7. **Acciones destructivas protegidas.** Confirmación y, cuando sea posible, deshacer.
8. **Wayfinding.** Cada pantalla debe dejar claro dónde estamos, qué podemos hacer y cómo volver.

## Movimiento

- Interacciones normales: rápidas, discretas y sin rebote.
- Rebote solo cuando existe un gesto físico con impulso.
- Animar preferentemente `transform` y `opacity`.
- Evitar animaciones decorativas constantes.
- Toda transición debe funcionar también si el usuario la interrumpe.

## Materiales y profundidad

- Usar translucencia únicamente para barras, paneles flotantes o capas de navegación.
- No apilar varias superficies translúcidas.
- Las superficies grandes tienen más separación y sombra que los controles pequeños.
- Los modales bloqueantes usan fondo atenuado; los paneles auxiliares no bloqueantes mantienen el contexto visible.

## Tipografía

- Títulos grandes: interlineado compacto y espaciado ligeramente negativo.
- Texto de interfaz: tamaño legible, contraste alto y lenguaje directo.
- Espaciado basado en `rem`, evitando tamaños rígidos que rompan al ampliar texto.
- Etiquetas específicas: “Clientes”, “Aprobaciones”, “Informes”; evitar nombres ambiguos.

## Accesibilidad obligatoria

- `prefers-reduced-motion`: sustituir desplazamientos por fundidos breves.
- `prefers-reduced-transparency`: fondos sólidos sin desenfoque.
- `prefers-contrast: more`: mayor contraste y bordes definidos.
- Navegación por teclado y foco visible.
- Áreas táctiles cómodas.
- No depender únicamente del color para comunicar un estado.

## Aplicación al MVP

Antes de añadir efectos se revisará:

- Claridad de la jerarquía.
- Contraste y legibilidad.
- Estados de botones y formularios.
- Mensajes de carga, éxito y error.
- Comportamiento en móvil.
- Reducción de movimiento.
- Coherencia entre abrir y cerrar paneles.

## Dirección V2 aprobada

La V2 convierte el dashboard en un centro de mando para supervisar una agencia operada por agentes. La atención del Project Manager se ordena así:

1. Aprobaciones, bloqueos, riesgos y SLA vencidos.
2. Capacidad real de incorporación y estado de cartera.
3. Carga, disponibilidad y calidad de los agentes.
4. Actividad automatizada y resultados verificables.

El verde lima #C2F264 identifica acción y confirmación. Los estados incluyen siempre texto; el color nunca es el único indicador. El corte de 45° se reserva para superficies de marca relevantes.

La especificación detallada está en [Dirección visual V2](ui-v2-direction.md).
