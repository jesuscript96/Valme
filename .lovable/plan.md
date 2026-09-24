# Auditoría SEO real y ejecutable — Informe y plan técnico

Este paso es solo de análisis. No se modifica código, base de datos ni publicación hasta que el PM apruebe.

## 1. Cómo funciona hoy Diagnóstico
- Todo ocurre en el navegador, en `public/v2/scripts/diagnostico.js`, con datos ficticios guardados en localStorage (clave `valme-v2-demo-2`).
- Creación del encargo `DIA-xxx`: `dgCrearEncargo` / `dgEncargoDe` (uno por cliente, idempotente).
- Hallazgos: `dgHallazgos`, `dgFichaHallazgo`, `dgHallazgosIncompletos` (fuente, fecha, evidencia, bloqueo por acceso).
- Bloqueos y accesos: `dgBloqueos`, `dgBloqueado`, `dgDisponibles`, `tabAccesos`.
- Validaciones por paso: `dgRequisitos`, `dgImpedir`, `dgBloqueoHTML`.
- QA: `dgRevisar` (devuelve si faltan limitaciones declaradas).
- Plan: `dgCrearPlan`, `dgAccionesPlan`, `dgTablaPlan`; decisión del PM en `dgDecidirPlan` / `planReview` (aprobar, pedir cambios, rechazar con motivo; versión nueva).
- Persistencia: `dgGuardar` / `dgRestaurar`; semillas `dgSemilla` (Nébula Hogar) y `dgSemillaReal` (Tuilus).
- Pantallas: `tabDiagnostico`, `tabPlan`, `dashboard`, `supervision` (sobrescriben funciones de `app.js`); estructura en `public/v2/index.html`; se sirve desde `src/routes/index.tsx`.
- Base de datos existente (clientes, agentes, aprobaciones, decisiones, actividad, tareas) no la usa la V2; está protegida por roles y nadie tiene rol asignado.

## 2–5. Claude SEO: qué hay y qué se puede usar
- Estructura: 25 skills (`seo-audit`, `seo-technical`, `seo-page`, `seo-schema`, `seo-sitemap`, `seo-content`, `seo-geo`, `seo-images`, `seo-hreflang`, `seo-google`, `seo-backlinks`, etc.), 18 agentes en Markdown, 54 scripts Python, extensiones (DataForSEO, Ahrefs, Firecrawl, Bing, Unlighthouse…).
- Para auditoría completa: `seo-audit` orquesta `seo-technical`, `seo-page`, `seo-schema`, `seo-sitemap`, `seo-content`, `seo-geo`, `seo-images`, `seo-performance`. Entrada: una URL. Salida: Markdown + `audit-data.json` (categorías, hallazgos con severidad y recomendación, puntuación 0–100).
- Reutilizable de verdad:
  - Las reglas, umbrales y criterios de los SKILL.md y `references/` (qué comprobar, severidades, pesos de puntuación).
  - El formato `audit-data.json` como inspiración del modelo normalizado.
  - La lógica de scripts puros y simples (`parse_html.py`, `sitemap_discovery.py`, `pagespeed_check.py`, `url_safety.py`) portada a TypeScript.
- No ejecutable directamente, y por qué:
  - Los scripts son Python con Playwright, lxml, trafilatura, weasyprint; el servidor de la app corre en un entorno tipo Worker sin Python, sin navegador y sin procesos hijos.
  - Las skills son instrucciones para un agente Claude Code (herramientas Read/Bash/WebFetch), no funciones invocables.
  - Google, Moz, DataForSEO, Ahrefs requieren credenciales y cuentas que hoy no existen.
  - El rastreo de 500 páginas excede el tiempo de una petición.
- Conclusión: en el MVP portamos a TypeScript los chequeos deterministas; más adelante un worker Python externo (opcional) podrá ejecutar Claude SEO íntegro a través del mismo adaptador.

## 6. Arquitectura recomendada

```text
Ficha cliente > Diagnóstico > Nueva auditoría > Ejecutar
      |
      v
Audit Request (servidor, usuario del equipo verificado)
      |
      v
Audit Orchestrator  -- crea audit_run y módulos, avanza por pasos
      |
      v
SEO Engine Adapter (interfaz común: run(módulo, dominio) -> resultados brutos)
      |-- valme-native (TS: HTTP, robots, sitemap, on-page, schema, enlaces)
      |-- pagespeed (API pública de Google)
      |-- futuros: GSC, GA4, Lighthouse, Screaming Frog, Ahrefs, Semrush, worker Claude SEO
      v
Finding Normalizer -> VALME Findings (con evidencia y huella)
      v
QA (existente) -> Aprobación PM (existente) -> Plan de acción (existente)
```

- La interfaz nunca llama a un motor: solo pide ejecutar y lee estado y hallazgos.
- Cada módulo se ejecuta en su propia llamada corta (el navegador consulta el avance), evitando límites de tiempo; se puede cancelar entre módulos.
- Solo lectura sobre la web del cliente: nunca escribe, publica ni cambia nada.

## 7. Modelo de datos propuesto (Lovable Cloud)
- `audit_runs`: id, audit_code (DIA-xxx), client_id, domain, requested_by, requested_at, started_at, finished_at, duration_ms, status (queued, running, completed, completed_with_warnings, failed, cancelled), engine_versions (json), config (json), modules_requested, findings_count, warnings, errors, previous_run_id.
- `audit_modules`: id, run_id, module (technical, onpage, schema, sitemap, performance, content, aeo, geo), engine, status (pending, running, completed, failed, skipped), started_at, finished_at, skip_reason, error, pages_checked.
- `audit_findings`: finding_id, audit_id, client_id, module_id, source_engine, source_skill, rule_id, category, severity, title, description, affected_url, impact, recommended_action, detected_at, qa_status, approval_status, responsible_agent, fingerprint (regla + URL normalizada, para deduplicar y comparar), first_seen_run_id, last_seen_run_id, recurrence (nuevo, persistente, resuelto, reaparecido), confidence, status_history.
- `audit_evidence`: id, finding_id, url, http_status, selector o elemento HTML (fragmento truncado), metric, observed_value, expected_value, source, captured_at, engine, raw_excerpt, content_hash.
- `audit_events`: registro append-only de quién hizo qué y cuándo (inicio, fin, cancelación, errores, decisiones QA/PM).
- Todas con permisos (GRANT) y reglas de acceso solo para el rol equipo; `client_id` enlaza con la tabla de clientes.

## 8. Flujo completo
1. PM pulsa «Ejecutar auditoría»; se valida dominio configurado, rol de equipo y accesos.
2. Se crea `audit_run` (queued) y sus módulos (pending); se registra el evento.
3. El navegador pide ejecutar cada módulo en orden; cada módulo pasa a running, el adaptador analiza, el normalizador guarda hallazgos y evidencia, el módulo pasa a completed/failed/skipped.
4. La ficha muestra progreso real («SEO técnico — completado», «Schema — ejecutándose», «AEO — pendiente»), siempre con texto e indicador, nunca solo color.
5. Al terminar: completed, completed_with_warnings o failed, con recuento y duración.
6. Los hallazgos aparecen en Diagnóstico con el bloque «¿Por qué VALME lo considera un problema?» (valor encontrado, esperado, URL, respuesta HTTP, fuente, fecha, motor).
7. QA, aprobación del PM y plan siguen el flujo actual; nada se ejecuta sobre la web.

## 9. Dependencias y servicios
- Lovable Cloud (tablas nuevas), funciones de servidor de la app.
- `fetch` del servidor para descargar páginas; un analizador HTML compatible con el entorno (p. ej. `linkedom` o `htmlparser2`).
- PageSpeed Insights: funciona sin clave con límites bajos; una clave opcional se guardaría como secreto de servidor.
- Inicio de sesión en la app y al menos un usuario con rol equipo (hoy la V2 no tiene inicio de sesión).
- Opcional fase posterior: worker Python externo para Claude SEO; conectores GSC/GA4 con OAuth.

## 10. Riesgos técnicos
- La V2 es HTML/JS estático sin sesión: hay que añadir inicio de sesión para llamar a funciones protegidas.
- Mezcla de mundos: el diagnóstico simulado (localStorage) y el real (base de datos) deben convivir; se marcará claramente cuál es real y cuál demostración.
- Webs que bloquean robots, tardan o dependen de JavaScript (sin navegador en servidor el análisis de contenido renderizado es limitado; se declara como limitación).
- Seguridad al descargar URLs (evitar direcciones internas): portar la lógica de `url_safety.py`.
- Límites de cuota de PageSpeed; tiempos por petición.
- Riesgo de dar por hecho datos que no se midieron: cada módulo omitido se muestra como «Omitido» con motivo.

## 11. Archivos a crear o modificar
Crear:
- `src/lib/audit/types.ts` (modelo normalizado, estados)
- `src/lib/audit/engines/adapter.ts` (interfaz), `valme-native.server.ts`, `pagespeed.server.ts`
- `src/lib/audit/rules/*.server.ts` (technical, onpage, schema, sitemap)
- `src/lib/audit/normalizer.server.ts`, `url-safety.server.ts`
- `src/lib/audit/orchestrator.functions.ts` (iniciar, ejecutar módulo, estado, cancelar, listar hallazgos)
- Migración con las cinco tablas
- `public/v2/scripts/auditoria.js` (botón, progreso, hallazgos con evidencia) y ajustes en `index.html`
- Documento `docs/03-architecture/audit-orchestrator.md`
Modificar:
- `public/v2/scripts/diagnostico.js` (vincular hallazgos reales al QA/plan existentes)
- `public/v2/scripts/app.js` o pantalla de acceso (inicio de sesión)
- `docs/03-architecture/overview.md` (actualizar estado)
No se toca: `skills/external/claude-seo/`, logotipos, identidad, permisos ni credenciales existentes.

## 12. Rama de trabajo
`feat/audit-orchestrator-mvp`, con PR en borrador hacia main; sin fusionar ni publicar sin aprobación.

## 13. Fases
1. Modelo de datos y migración; inicio de sesión y asignación de rol equipo al PM.
2. Orquestador + adaptador + motor `valme-native` con módulo técnico (HTTP, HTTPS, redirecciones, robots.txt, sitemap, canonical, noindex).
3. Módulos on-page (title, description, H1, alt, enlaces rotos internos de la portada) y schema (JSON-LD detectado y validado básico).
4. Módulo rendimiento vía PageSpeed.
5. Interfaz: «Nueva auditoría», progreso real, hallazgos con evidencia, historial de ejecuciones.
6. Conexión con QA, aprobación y plan existentes.
7. Comparación entre auditorías (huella, nuevos/resueltos) y auditorías recurrentes.
8. Posterior: AEO/GEO, contenido, GSC/GA4, worker Claude SEO, otros motores.

## 14. MVP: primera auditoría real de Tuilus
- Requisito: dominio real de Tuilus configurado en su ficha (pendiente de que el PM lo facilite).
- Alcance: portada y hasta 20 páginas del sitemap; módulos técnico, on-page, schema y rendimiento; contenido, AEO y GEO marcados «Omitido — fuera del MVP».
- Resultado: ejecución registrada con estado y duración, hallazgos con evidencia verificable, visibles en Diagnóstico, que pasan por QA y aprobación del PM antes de generar plan.
- Sin IA generativa en el MVP: todo hallazgo sale de una regla comprobable.
- Nada se modifica en la web del cliente.

## Pendiente de confirmar por el PM
- Dominio de Tuilus.
- Aceptar añadir inicio de sesión a la V2 (necesario para ejecutar auditorías reales de forma segura).
