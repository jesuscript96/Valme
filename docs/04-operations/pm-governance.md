# Gobierno del Project Manager

## Rol

El Project Manager es responsable de validar objetivos, prioridades, calidad y acciones externas. La automatización reduce trabajo operativo, pero no sustituye su criterio.

## Estados estándar

1. **Borrador:** información incompleta.
2. **Propuesto por IA:** resultado listo para revisar.
3. **En revisión:** el PM está evaluando.
4. **Aprobado:** puede pasar a ejecución.
5. **En ejecución:** trabajo iniciado.
6. **Completado:** resultado entregado y verificado.
7. **Rechazado:** no se ejecuta; debe registrarse el motivo.
8. **Bloqueado:** falta información, acceso o decisión.

## Acciones que siempre requieren aprobación

- Publicar o modificar contenido.
- Cambiar metadatos o estructura de una web.
- Enviar un informe al cliente.
- Modificar presupuestos o campañas.
- Crear, borrar o cambiar datos en herramientas externas.
- Dar acceso a nuevos usuarios.
- Cambiar una estrategia ya acordada.
- Ejecutar acciones que puedan afectar ventas, reputación o cumplimiento.

## Ciclo de trabajo

1. Entrada de datos.
2. Validación de calidad.
3. Propuesta de IA.
4. Revisión del PM.
5. Aprobación, corrección o rechazo.
6. Ejecución controlada.
7. Verificación.
8. Registro e informe.

## Criterio de terminado

Una tarea no está terminada porque la IA haya producido una respuesta. Está terminada cuando:

- Cumple los criterios de aceptación.
- Ha sido revisada.
- El resultado está guardado.
- Se conoce su impacto.
- Existe siguiente acción o cierre explícito.

## Invariantes de supervisión

- Una devolución al agente solicita una nueva propuesta y mantiene el problema abierto.
- Una aprobación cierra la decisión humana, pero no confirma que la ejecución haya empezado o terminado.
- Iniciar una revisión humana no resuelve automáticamente un bloqueo o riesgo.
- La confianza del agente informa la revisión; nunca amplía permisos.
- Aprobar el contenido de un informe y autorizar su envío son decisiones separadas.
- Cada acción conserva cliente, agente, acción, estado, confianza, evidencia, resultado, fecha y hora, posibilidad de revisión y requisito de aprobación humana.
