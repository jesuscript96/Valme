# Arquitectura técnica

## Versión actual

Aplicación estática en navegador:

- `src/index.html`: estructura de la interfaz.
- `src/styles/main.css`: sistema visual y responsive.
- `src/scripts/app.js`: navegación, datos de demostración y estado local.
- Estado en memoria: decisiones simuladas durante la sesión de demostración.

La interfaz V2 se organiza en siete áreas: Centro de mando, Clientes, Agentes, Supervisión, Operaciones, Informes y Configuración.

No existen todavía conexiones reales con OpenAI, Search Console, Analytics o CMS.

## Arquitectura objetivo

1. **Frontend:** panel del Project Manager.
2. **Backend:** API y lógica de negocio.
3. **Base de datos:** clientes, proyectos, tareas, informes y aprobaciones.
4. **Orquestador de IA:** prompts, herramientas, modelos y salidas estructuradas.
5. **Conectores de lectura:** Search Console, GA4 y otras fuentes.
6. **Cola de trabajos:** auditorías, análisis e informes.
7. **Capa de aprobación:** ninguna acción externa se ejecuta sin autorización.
8. **Registro de auditoría:** qué propuso la IA, quién aprobó y qué ocurrió.

## Política de modelos

- GPT-5.6 Sol: motor general de producto y operación.
- GPT-6 Astra: estrategia compleja, auditorías difíciles y control de calidad final.
- GPT-5.6 Terra/Luna: tareas repetitivas de volumen cuando el proceso esté validado.

## Fronteras de seguridad

- Lectura antes que escritura.
- Credenciales fuera del código.
- Datos separados por cliente.
- Permisos mínimos.
- Vista previa antes de acciones externas.
- Registro y reversión cuando sea posible.

## Alcance de la V2

- Utiliza exclusivamente datos ficticios claramente identificados.
- No contiene clientes reales, credenciales ni secretos.
- No conecta con agentes, correo, CRM, CMS, Search Console, Analytics o servicios externos.
- Las acciones de aprobación, devolución, revisión y autorización son simulaciones de interfaz.
- Aprobar no equivale a ejecutar; autorizar un envío no lo realiza.
- La confianza mostrada es una evaluación de demostración, no una probabilidad calibrada ni una ampliación de permisos.
